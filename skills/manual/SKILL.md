# Skill: manual

Implements the `man <topic>` help system. Pages live under `skills/manual/pages/<topic>.md`.

## Contract

When the player types `man <topic>`:

1. The agent calls `render({ panel: "man", topic: "<topic>" })`.
2. The MCP server resolves `skills/manual/pages/<topic>.md`, reads it, and pushes it to the browser via SSE.
3. The CLI emits one acknowledgement line (not FaiR's voice): `→ man(1) <topic>`
4. The agent does **not** narrate the page contents in the CLI.

If the player types `man` with no topic, or `man -k` / `man --list`, the agent calls `render({ panel: "man", topic: "" })` which returns a topic listing (handled by the render tool's error path — lists available pages).

## Available pages (v0)

| Topic        | Purpose                                                                                 |
|--------------|----------------------------------------------------------------------------------------|
| `fair`       | What FaiR is. Current state (WEDGED). Points at `/var/log/fair-deliberation.log`.       |
| `handshake`  | How the dialectical co-sign works. Explains the public-key protocol concept.            |
| `localhost`  | What this instrument is and where it came from. Your identity on the channel.            |

## Authoring rules

- Pages are **diegetic technical documentation** — written by the system's engineers, not by FaiR, not by the narrator.
- Voice: dry, precise, terse. Real man-page energy. Section headers in ALL CAPS.
- Each page should be self-contained but cross-reference related pages via `See also: man(1) <topic>`.
- **Do not solve the puzzle in a man page.** Pages explain concepts and point at the live system; they do not hand the player the answer.
