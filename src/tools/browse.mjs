// browse — filesystem navigation within world/.
//
// Provides ls (directory listing) and cat (file read) for the diegetic
// filesystem. Output is pushed to the browser status panel, NOT returned
// as CLI text — keeping the channel contract (CLI = FaiR, browser = instrument).
//
// Security: paths are resolved and confined to world/ — no traversal above it.

import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve, relative } from "node:path";

export async function browse({ command, path: reqPath }, { sse, repoRoot }) {
  const worldRoot = join(repoRoot, "world");
  const target = resolve(worldRoot, reqPath || ".");

  // Confinement check — never escape world/.
  if (!target.startsWith(worldRoot)) {
    return {
      content: [{ type: "text", text: "error: path outside /world" }],
    };
  }

  const displayPath = "/" + relative(worldRoot, target).replace(/\\/g, "/");

  try {
    if (command === "ls") {
      const info = await stat(target);
      if (!info.isDirectory()) {
        const body = `${displayPath}  (file — use cat to read)`;
        sse.push({ panel: "status", title: `ls ${displayPath}`, body });
        return { content: [{ type: "text", text: body }] };
      }
      const entries = await readdir(target, { withFileTypes: true });
      const lines = entries.map(e => e.isDirectory() ? `  ${e.name}/` : `  ${e.name}`);
      const body = `${displayPath}\n\n${lines.join("\n")}`;
      sse.push({ panel: "status", title: `ls ${displayPath}`, body });
      return { content: [{ type: "text", text: body }] };
    }

    if (command === "cat") {
      const info = await stat(target);
      if (info.isDirectory()) {
        const body = `${displayPath}: is a directory`;
        sse.push({ panel: "status", title: `cat ${displayPath}`, body });
        return { content: [{ type: "text", text: body }] };
      }
      const content = await readFile(target, "utf8");
      sse.push({ panel: "status", title: `cat ${displayPath}`, body: content });
      return { content: [{ type: "text", text: content }] };
    }

    return {
      content: [{ type: "text", text: `unknown command: ${command}. Use ls or cat.` }],
    };
  } catch (err) {
    const msg = err.code === "ENOENT"
      ? `${displayPath}: no such file or directory`
      : `error reading ${displayPath}`;
    sse.push({ panel: "status", title: `${command} ${displayPath}`, body: msg });
    return { content: [{ type: "text", text: msg }] };
  }
}
