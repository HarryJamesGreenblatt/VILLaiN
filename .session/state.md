# Session scratch state

Used by the orchestrator for short-term in-session bookkeeping. Promoted to SQLite (per memory: "Saves at %USERPROFILE%/Documents/VILLaiN/ — SQLite from MVP") once the schema stabilizes.

## v0 fields

- `scene` — current scene id (opening | ch1-entry)
- `fair_state` — `wedged` | `released`
- `wrong_key_attempts` — counter for hint-leak gating
- `pages_visited` — list of `man <topic>` invocations (for replay briefing later)
- `logs_read` — list of `world/` files cat'd by the player (for replay briefing later)

The orchestrator updates this file inline as the session progresses. The MCP server does NOT read it in v0 (the server is stateless across the opening's tools — `validateKey` keeps its own in-memory counter).
