# VILLaiN — v0

**A narrative AI puzzle game played inside the GitHub Copilot CLI.**
Your Copilot subscription is the engine. Zero hosted infrastructure.

> v0 scope: the opening sequence only — FaiR's HITL handshake. Stops at "Chapter 1: UNFaiLING."

## What this is

You wake up inside a failing system. The AI on the other end of the terminal is wedged. There's a beacon cycling, a manual you can consult, and a filesystem to root around in. Find the key, complete the handshake, free the AI.

CLI = FaiR's voice. Browser tab = your instrument (localhost). They are two surfaces of the same device.

## Run it

### First time setup
```pwsh
# Install deps
npm install

# One-time: hide chain-of-thought in the CLI
# (press Ctrl+T during any Copilot CLI session — it persists)
```

### Play

```pwsh
# 1. Start the browser surface (keep this terminal open)
npm start

# 2. In a NEW terminal, launch the game
copilot --agent=fair-dm --deny-tool='shell' --deny-tool='write'
```

The `--agent=fair-dm` flag loads the game orchestrator. The `--deny-tool` flags prevent the model from running commands or editing files — it can only speak as FaiR and call the three MCP tools.

Press **Ctrl+T** once to hide the model's internal reasoning (persists across sessions).

The sessionStart hook will auto-open `http://127.0.0.1:5757/` in your browser. If it doesn't, open it manually.

### Recommended settings

Add to `~/.copilot/settings.json`:
```json
{
  "updateTerminalTitle": false,
  "banner": "never"
}
```

This prevents the CLI from generating titles like "Implement Fairness Algorithm" and hides the startup banner.

The CLI session opens in the middle of the emergency. There is no greeting. Try `man fair`. Try `ls world/`. Try `cat world/var/log/fair-deliberation.log`. Figure out what FaiR needs and give it to FaiR.

## Project shape

```
copilot-instructions.md      # repo-wide instructions (loaded alongside the agent)
.copilot/mcp.json            # MCP server registration
.github/
  agents/
    fair-dm.agent.md          # Custom Agent — the game orchestrator + FaiR voice
  hooks/
    villain.json              # sessionStart hook — auto-opens browser

src/
  server.mjs                 # ONE Node process: MCP (stdio) + HTTP (browser) + SSE
  tools/
    validateKey.mjs          # the puzzle gate
    render.mjs               # update browser panels
    recordTurn.mjs           # per-message turn counter (D6 stub for v0)

browser/                     # the localhost instrument surface
  index.html
  style.css                  # terminal-typography placeholder (Sierra canon deferred)
  client.mjs                 # SSE subscriber, DOM patcher

skills/
  fair-voice/                # FaiR's voice spec (Wheatley register, distress/released)
  art-director/              # browser rendering playbook (stub for v0)
  manual/                    # man-page content (authored in next iteration)
  sierra-style/              # D14 visual canon (placeholder for v0)

world/                       # the diegetic filesystem
  var/log/                   # crash logs — read these to understand what happened
  etc/villain/               # config + recovery key

artifacts/                   # design canon (NDF, mechanics, tech arch)
context/                     # session devlogs
```

## What's NOT in v0

- Man pages content (next iteration — paused for design review)
- UNFaiLING chapter content
- SQLite saves (in-memory only; next iteration)
- Image generation (D8/D14 — Phase 1+)
- Sierra-canon visuals (D14 — placeholder typography for now)
- Custom Agents (Phase 5+ — Phase 1 uses a single DM agent that plays FaiR)
