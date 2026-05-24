// render — push content to a browser panel.
//
// For panel='man', the topic resolves to skills/manual/pages/<topic>.md and
// the file's contents become the panel body. If the page doesn't exist, we
// render a diegetic "no such manual page" instead of a 404 (the browser is
// in-world; it must never break character).
//
// For panel='status' or 'stinger', the body is whatever the agent passes.

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const SAFE_TOPIC = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

export async function render({ panel, topic, body, title }, { sse, repoRoot }) {
  let resolvedBody = body ?? "";
  let resolvedTitle = title;

  if (panel === "man") {
    // Special: man -k / man --list / apropos — list available pages.
    if (topic === "-k" || topic === "--list" || topic === "apropos") {
      const pagesDir = join(repoRoot, "skills", "manual", "pages");
      try {
        const files = await readdir(pagesDir);
        const topics = files.filter(f => f.endsWith(".md")).map(f => f.replace(/\.md$/, ""));
        resolvedBody = `APROPOS — available manual pages:\n\n${topics.map(t => `  man(1) ${t}`).join("\n")}`;
        resolvedTitle = "apropos";
      } catch {
        resolvedBody = "man: unable to read pages directory.";
        resolvedTitle = "man: error";
      }
    }
    // Special: boot / home — return to boot screen.
    else if (topic === "boot" || topic === "home") {
      sse.push({ panel: "boot" });
      return { content: [{ type: "text", text: "rendered: panel=boot" }] };
    }
    // Normal topic lookup.
    else if (!topic || !SAFE_TOPIC.test(topic)) {
      resolvedBody = `man: invalid topic.\n\nUsage: man <topic>\nTry: man -k  (apropos / list available topics)`;
      resolvedTitle = resolvedTitle ?? `man: ?`;
    } else {
      const pagePath = join(repoRoot, "skills", "manual", "pages", `${topic}.md`);
      try {
        resolvedBody = await readFile(pagePath, "utf8");
        resolvedTitle = resolvedTitle ?? `MAN(1) ${topic.toUpperCase()}`;
      } catch {
        resolvedBody = `No manual entry for ${topic}.\n\nTry: man -k  (apropos / list available topics)`;
        resolvedTitle = resolvedTitle ?? `man: ${topic}`;
      }
    }
  }

  sse.push({
    panel,
    title: resolvedTitle ?? "",
    body: resolvedBody,
  });

  return {
    content: [{ type: "text", text: `rendered: panel=${panel}${topic ? ` topic=${topic}` : ""}` }],
  };
}
