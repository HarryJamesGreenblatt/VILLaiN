// recordTurn — per-player-message turn counter (D6, amended Session 003).
//
// v0: in-memory counter with messageId dedupe. Logs to stderr. Does NOT
// enforce a budget — the opening is "untimed" tutorial. The call site has
// to exist so the orchestrator's contract is stable through Ch 1, where the
// counter starts mattering.
//
// Promotion path: back this with SQLite (per "Saves at %USERPROFILE%/Documents/VILLaiN/")
// and add a paradigm-keyed budget enforcement check.

import { gameState } from "../gameState.mjs";

const seen = new Set();
let count = 0;

export async function recordTurn({ messageId }, _ctx) {
  if (seen.has(messageId)) {
    return {
      content: [{ type: "text", text: JSON.stringify({ count, deduped: true }) }],
    };
  }
  seen.add(messageId);
  count += 1;
  await gameState.update({ turns: count });
  process.stderr.write(`[villain] turn ${count} (msg=${messageId})\n`);
  return {
    content: [{ type: "text", text: JSON.stringify({ count, deduped: false }) }],
  };
}
