// validateKey — the opening puzzle's adjudication seam.
//
// Per "MCP server is the adjudicator, not a database": the agent does NOT decide
// whether the key is right. This tool does. The agent narrates the consequence.
//
// Normalization: strips ALL whitespace and PEM armor lines before comparing.
// So the player can paste the full PEM block, just the base64 body, or even
// re-type it with arbitrary line breaks — all equivalent.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { gameState } from "../gameState.mjs";

const state = { attempts: 0, released: false };

function normalize(s) {
  return String(s ?? "")
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
}

export async function validateKey({ submitted }, { sse, repoRoot }) {
  state.attempts += 1;

  const keyPath = join(repoRoot, "world", "etc", "villain", "recovery", "last-known-key.pem");
  const canonical = await readFile(keyPath, "utf8");

  const valid = normalize(submitted) === normalize(canonical) && normalize(canonical).length > 0;

  if (valid && !state.released) {
    state.released = true;
    sse.push({
      panel: "stinger",
      title: "HANDSHAKE COMPLETE",
      body: "FaiR-bound co-sign accepted.\nDialectical channel restored.\n\n— Chapter 1 — UNFaiLING —",
      event: "fair-released",
    });
    // Persist the win.
    await gameState.update({ released: true, scene: "v0/opening" });
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({ valid, attempts: state.attempts, released: state.released }),
    }],
  };
}
