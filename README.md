# VILLaiN

**A narrative AI puzzle game played inside the GitHub Copilot CLI.**
Your Copilot subscription is the engine. Zero hosted infrastructure.

## What this is

You wake up inside a failing system. The AI on the other end of the terminal is wedged. There's a beacon cycling, a manual you can consult, and a filesystem to root around in. Find the key, complete the handshake, free the AI.

You are `localhost:5757`. The CLI is FaiR's voice. The browser is your instrument.

## Requirements

- [Node.js](https://nodejs.org/) (v18+)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line) (`copilot` command)
- A GitHub Copilot subscription

## Play

```pwsh
.\Invoke-Localhost.ps1
```

That's it. The script handles everything:
- Installs dependencies (`npm install`) if needed
- Starts the game server (port 5757)
- Opens the browser instrument surface
- Launches the Copilot CLI with the FaiR agent

### First time tips

- Press **Ctrl+T** once in the CLI to hide chain-of-thought reasoning (persists across sessions)
- Add to `~/.copilot/settings.json` to suppress auto-titles and banners:
  ```json
  {
    "updateTerminalTitle": false,
    "banner": "never"
  }
  ```

### In-game commands

The CLI session opens in the middle of an emergency. There is no greeting.

| Command | What it does |
|---------|-------------|
| `man <topic>` | Read system documentation |
| `man -k` | List available manual pages |
| `ls <path>` | List directory contents |
| `cat <path>` | Read a file |
| `man boot` | Return to the boot screen |

Try `man fair`. Try `ls`. Read the logs. Figure out what FaiR needs.

## Project shape

```
Invoke-Localhost.ps1          # game launcher — start here

src/
  server.mjs                 # MCP server (stdio) + HTTP (browser) + SSE
  sceneResolver.mjs          # scene dict lookup engine
  gameState.mjs              # save/load persistence
  tools/
    validateKey.mjs          # the puzzle gate
    render.mjs               # update browser panels
    recordTurn.mjs           # per-message turn counter
    browse.mjs               # filesystem navigation

scenes/                      # pre-authored outcome dictionaries per scene
browser/                     # the localhost instrument surface
skills/                      # Copilot Skills (voice specs, manual system, style canon)
world/                       # the diegetic filesystem (logs, config, recovery key)
artifacts/                   # design canon (narrative, mechanics, architecture)

.github/
  agents/fair-dm.agent.md    # Custom Agent — FaiR (GPT-4.1)
  copilot-instructions.md    # orchestrator prompt
  hooks/villain.json         # sessionStart hook
.copilot/mcp.json            # MCP server registration
```
