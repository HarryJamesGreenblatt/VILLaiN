// VILLaiN — single-process server.
//
// Hosts in ONE Node process:
//   1. MCP server over stdio (Copilot CLI agent connects here for tools)
//   2. HTTP server on localhost:VILLAIN_BROWSER_PORT (serves the browser surface)
//   3. SSE endpoint on the same HTTP server (pushes state updates to the browser)
//
// Per D11 (locked Session 003): the browser transport endpoint lives INSIDE the
// MCP server process — not a separate process, not WebSocket, SSE one-way push.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { validateKey } from "./tools/validateKey.mjs";
import { render } from "./tools/render.mjs";
import { recordTurn } from "./tools/recordTurn.mjs";
import { browse } from "./tools/browse.mjs";
import { SceneResolver } from "./sceneResolver.mjs";
import { gameState } from "./gameState.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const BROWSER_DIR = join(REPO_ROOT, "browser");
const SCENES_DIR = join(REPO_ROOT, "scenes");
const PORT = Number(process.env.VILLAIN_BROWSER_PORT ?? 5757);

// Scene resolver — loads pre-authored outcome dicts from scenes/.
const scenes = new SceneResolver(SCENES_DIR);
await scenes.load();
process.stderr.write(`[villain] scenes loaded: ${[...scenes.scenes.keys()].join(", ")}\n`);

// Game state — load from disk, set active scene.
const savedState = await gameState.load();
scenes.setScene(savedState.scene);
process.stderr.write(`[villain] state: scene=${savedState.scene} released=${savedState.released} turns=${savedState.turns}\n`);

// ───────────────────────────────────────────────────────────────────────────
// SSE channel — the single source of "the browser should now look like X."
// Tools call sse.push({...}) to update the player's view.
// ───────────────────────────────────────────────────────────────────────────

const sseClients = new Set();
let lastState = { panel: savedState.lastPanel ?? "boot", body: "" };

export const sse = {
  push(state) {
    // Boot panel resets — don't carry stale title/body forward.
    if (state.panel === "boot") {
      lastState = { panel: "boot", body: "", title: "", ts: Date.now() };
    } else {
      lastState = { ...lastState, ...state, ts: Date.now() };
    }
    const payload = `data: ${JSON.stringify(lastState)}\n\n`;
    // Persist which panel is showing.
    gameState.update({ lastPanel: lastState.panel }).catch(() => {});
    if (sseClients.size > 0) {
      // We ARE the browser server — push directly.
      for (const res of sseClients) {
        try { res.write(payload); } catch { /* client gone */ }
      }
    } else {
      // We're probably the CLI-spawned MCP instance — POST to the browser server.
      fetch(`http://127.0.0.1:${PORT}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastState),
      }).catch(() => { /* browser server not up — silent */ });
    }
  },
  current: () => lastState,
};

// ───────────────────────────────────────────────────────────────────────────
// HTTP / SSE — minimal static serving + /events stream.
// ───────────────────────────────────────────────────────────────────────────

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".mjs":  "text/javascript; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const http = createServer(async (req, res) => {
  // SSE stream — the only "live" endpoint.
  if (req.url === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
    res.write(`data: ${JSON.stringify(lastState)}\n\n`); // replay current
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  // Reset endpoint — launcher calls this on New Game to wipe state.
  if (req.url === "/reset" && req.method === "POST") {
    await gameState.reset();
    scenes.setScene("v0/opening");
    lastState = { panel: "boot", body: "" };
    sse.push({ panel: "boot" });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Push endpoint — lets MCP tools in a separate process update the browser.
  if (req.url === "/push" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const state = JSON.parse(body);
      sse.push(state);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.writeHead(400).end();
    }
    return;
  }

  // Resolve endpoint — browser-side command resolution via scene dict.
  // POST /resolve { key: "man:fair" } → looks up in active scene → pushes to SSE + returns outcome.
  if (req.url === "/resolve" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const { key } = JSON.parse(body);
      if (!key) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "missing key" }));
        return;
      }

      // Special case: key submission goes through validateKey adjudicator.
      if (key.startsWith("key:") && key !== "key:valid" && key !== "key:invalid") {
        const submitted = key.slice(4);
        const result = await validateKey({ submitted }, { sse, repoRoot: REPO_ROOT });
        const parsed = JSON.parse(result.content[0].text);
        // On invalid, also push the scene's key:invalid outcome.
        if (!parsed.valid) {
          const failOutcome = scenes.resolve("key:invalid");
          if (failOutcome) sse.push(failOutcome);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(parsed));
        return;
      }

      const outcome = scenes.resolve(key);
      if (!outcome) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "not found", key }));
        return;
      }

      sse.push(outcome);

      // If outcome has a `next` scene, advance.
      if (outcome.next) scenes.setScene(outcome.next);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, panel: outcome.panel }));
    } catch {
      res.writeHead(400).end();
    }
    return;
  }

  // Static browser assets.
  const rel = req.url === "/" ? "/index.html" : req.url;
  const path = join(BROWSER_DIR, rel.split("?")[0]);
  if (!path.startsWith(BROWSER_DIR)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(path);
    res.writeHead(200, { "Content-Type": MIME[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});

http.listen(PORT, "127.0.0.1", () => {
  // stderr so MCP stdio stream stays clean.
  process.stderr.write(`[villain] browser at http://127.0.0.1:${PORT}/\n`);
});

http.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    process.stderr.write(`[villain] port ${PORT} in use — browser surface unavailable (MCP tools still work)\n`);
  } else {
    process.stderr.write(`[villain] http error: ${err.message}\n`);
  }
});

// ───────────────────────────────────────────────────────────────────────────
// MCP — tool registration. v0 surface: render, validateKey, recordTurn.
// ───────────────────────────────────────────────────────────────────────────

const mcp = new McpServer(
  { name: "villain", version: "0.0.1" },
  { capabilities: { tools: {} } },
);

mcp.tool(
  "render",
  "Update the browser surface. Use for `man <topic>` page rendering and status panel updates. Do NOT narrate the rendered content in the CLI — the browser is the instrument, the CLI is FaiR.",
  {
    panel: z.enum(["man", "status", "stinger"]).describe("Which browser panel to update."),
    topic: z.string().optional().describe("For panel='man': the topic name (e.g. 'fair'). The server resolves to skills/manual/pages/<topic>.md."),
    body:  z.string().optional().describe("For panel='status' or 'stinger': raw markdown body."),
    title: z.string().optional().describe("Optional panel title override."),
  },
  async (args) => render(args, { sse, repoRoot: REPO_ROOT }),
);

mcp.tool(
  "validateKey",
  "Adjudicate a candidate public key against the canonical key file. THIS IS THE OPENING PUZZLE GATE. Returns {valid, attempts}. On valid, also emits a 'fair-released' SSE event so the browser can react.",
  {
    submitted: z.string().describe("The candidate key text the player offered (may include PEM headers, whitespace, line breaks — all normalized)."),
  },
  async (args) => validateKey(args, { sse, repoRoot: REPO_ROOT }),
);

mcp.tool(
  "recordTurn",
  "Tick the per-player-message turn counter (D6, amended Session 003). The agent MUST call this exactly once per player message. v0 wires it as a recording stub; budget enforcement comes in Phase 1.",
  {
    messageId: z.string().describe("Stable id for the player message (for server-side dedupe)."),
  },
  async (args) => recordTurn(args, { sse, repoRoot: REPO_ROOT }),
);

mcp.tool(
  "browse",
  "Navigate the diegetic filesystem under /world. Use when the player types `ls`, `cat`, `cd`, or asks to see files. Output is pushed to the browser status panel. The CLI should only emit a terse acknowledgement like `→ ls /var/log`.",
  {
    command: z.enum(["ls", "cat"]).describe("Shell command to emulate: ls (list directory) or cat (read file)."),
    path: z.string().describe("Path relative to /world. Examples: '.', 'var/log', 'var/log/fair-deliberation.log', 'etc/villain/config.yaml'."),
  },
  async (args) => browse(args, { sse, repoRoot: REPO_ROOT }),
);

mcp.tool(
  "resolve",
  "Look up a context key in the active scene dict and push the result to the browser. This is the PRIMARY tool for responding to player commands. Keys follow the pattern: 'man:<topic>' for man pages, 'ls:<path>' for directory listings, 'cat:<path>' for file contents. Example keys: 'man:fair', 'ls:/', 'ls:/var/log', 'cat:/var/log/fair-deliberation.log', 'cat:/etc/villain/recovery/last-known-key.pem'. Returns the outcome or an error if the key is not found in the current scene.",
  {
    key: z.string().describe("The scene dict key to resolve. Format: 'man:<topic>', 'ls:<path>', 'cat:<path>'. Paths start with /."),
  },
  async ({ key }) => {
    const outcome = scenes.resolve(key);
    if (!outcome) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "not found", key, available: scenes.keys() }) }],
      };
    }
    sse.push(outcome);
    if (outcome.next) scenes.setScene(outcome.next);
    return {
      content: [{ type: "text", text: `resolved: ${key} → panel=${outcome.panel}` }],
    };
  },
);

await mcp.connect(new StdioServerTransport());
