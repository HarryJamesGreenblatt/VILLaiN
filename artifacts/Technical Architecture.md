# Technical Architecture: VILLaiN

> **Document status:** Architectural lock — Session 002 (2026-05-15); amended Session 003 (2026-05-15); amended Session 004 (2026-05-15). Decisions D1–D7, D9 locked. D5 and D6 amended in Session 003. D10–D13 added Session 003. **D8 locked Session 004** (VILLaiN-owned MCP image-gen tool; gpt-image-2 via Azure or OpenAI; no third-party MCP dependency). **D14 added Session 004** (Style-as-Skill modularity — load-bearing).

## 1. Core Principle

VILLaiN is a narrative AI puzzle game played **inside a Copilot agent**. The player's own GitHub Copilot subscription provides the inference; VILLaiN ships rules, state, and visuals. **Zero hosted infrastructure. The engine is already on the player's machine.**

The runtime is the **GitHub Copilot CLI** (standalone terminal agent). VS Code is supported via Copilot Chat as a secondary surface, but the canonical experience is the terminal.

---

## 2. The Pip-Boy Architecture

The interface is split across two surfaces, mapping cleanly to the Fallout *Pip-Boy* metaphor:

| Surface | Role | Analogy |
|---|---|---|
| **Terminal (Copilot CLI)** | Controller + menu — input, narration, command surface, FaiR's voice | The Pip-Boy on your wrist (menus, dialogue, command input) |
| **Browser tab** | Rendered world — scene illustrations, status panels, paradigm theming, corruption visuals | The isometric environment around you |

The terminal is **not** "where the menus go and visuals go elsewhere." The terminal **is** the Pip-Boy. The browser tab **is** the world. They are different layers of the same fictional device — one you operate, one you inhabit.

```
┌────────────────────────────────────────────────────────────────────┐
│                  Copilot CLI (Terminal — the Pip-Boy)              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ copilot-instructions.md  →  thin orchestrator (Layer 1)      │  │
│  │ Custom Agents (D10):                                         │  │
│  │   • dm-agent (per-paradigm DM voice + binds style Skill D14) │  │
│  │   • fair-companion       (Phase 5+: dyad pruning)            │  │
│  │   • ~fair-companion      (Phase 6: Final Inversion)          │  │
│  │   • scene-illustrator    (Art Director; uses bound style)    │  │
│  │ Skills (loaded on demand, D10): chapter rules, puzzle defs,  │  │
│  │   paradigm constraints, persona modules (UNFaiLING,          │  │
│  │   SUSTaiNING, GaiNFUL, NaiVE, CLaiRVOYANT) + style Skills     │  │
│  │   (sierra-style/{pristine,decaying,corrupted,cold,...} D14)  │  │
│  │ Hooks (D11/D12): session start → CLI version check →         │  │
│  │   write resume brief → open browser tab                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────────────┬──────────────┘
               │ MCP tool calls                       │ MCP tool calls
               ▼                                      ▼
┌──────────────────────────────────┐    ┌────────────────────────────┐
│       VILLaiN MCP Server          │    │ Azure OpenAI / OpenAI     │
│  • Adjudication & validation      │─────▶│ gpt-image-2 REST API      │
│  • State queries / mutations       │    │ (called BY our MCP        │
│  • Skill/artifact retrieval (RAG) │    │  server's generateScene   │
│  • Turn counter — per message (D6)│    │  tool — D8 locked)        │
│  • Image generation (D8, D14)     │    └──────────────────────────┘
│  • Local HTTP + SSE for browser   │
└──────────────┬────────────────────┘
               │ SSE push
               ▼
┌────────────────────────────────────────────────────────────────────┐
│              Browser tab (the rendered world)                       │
│  • Scene image (current room / event)                               │
│  • Status: capabilities, corruption meter, chapter progress         │
│  • Paradigm-specific theme (entire page reskins per chapter)        │
│  • NaiVE / Final Inversion: display lies AND companion goes silent  │
│    (D5 amended — CODEC-silence model; narration itself never lies)  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Distribution Model

### Two install paths, same runtime

1. **VS Code Extension** — convenience installer for the marketplace. Registers the VILLaiN MCP server, drops `copilot-instructions.md` and Custom Agents/Skills into the workspace, exposes `Reveal Save Folder` and `Open World View` commands. Does **not** itself host the game — the runtime is still the Copilot agent (terminal CLI or Chat).
2. **Manual install** — clone repo, register MCP server with the Copilot CLI via `mcp.json`, run `copilot` in the folder. Zero VS Code dependency. The terminal-only "hardcore mode."

The extension is a wrapper. The CLI is the runtime. **Removing VS Code does not remove the game.**

### Requirements

- **GitHub Copilot CLI** (or Copilot Chat in VS Code) — provides the AI inference (default model: Claude Sonnet 4.5)
- **Node.js** (for the VILLaiN MCP server)
- **A modern browser** (any) — for the world view
- **Image generation provider** — Azure OpenAI key (Public Preview `gpt-image-2`, no application) OR OpenAI public key. Optional — pre-bundled curated scenes serve as a zero-config floor (see §9).

No accounts beyond the player's existing Copilot subscription. No hosted services. Saves are local files the player owns.

---

## 4. The Copilot CLI as Runtime

Research in Session 002 confirmed the CLI provides every primitive VILLaiN needs:

| CLI Feature | VILLaiN Use |
|---|---|
| **MCP servers** (full support, per-tool allow/deny) | VILLaiN MCP server (state, validation, RAG); image-gen MCP |
| **Custom Agents** (auto-delegation to specialized agents) | `dm-agent`, `fair-companion`, `scene-illustrator` — the subagent pattern is native |
| **Skills** (folders of instructions + scripts + resources, loaded on demand) | Per-chapter rules, per-puzzle definitions, per-paradigm voice modules — RAG-style "queryable artifacts" |
| **Hooks** (shell commands at lifecycle points) | Open browser tab on session start; sync persistence on tool call |
| **Custom instructions** (combine across files, no priority fallback) | Thin orchestrator layer (the constitution) |
| **Auto-compaction at 95% tokens** | Backstop; our session-budget mechanic (D6) ends sessions narratively well before this |
| **Default model: Claude Sonnet 4.5** | Strong instruction-following + roleplay; no provider lock — players can swap via env vars if desired |

The "single-agent now / Governance Dyad in Phase 5+" plan (D4) maps directly onto Custom Agents — start with one delegated `scene-illustrator`, add `fair-companion` as a second peer-agent in Phase 5+ for the dyad-pruning narrative beat. ~FaiR (Phase 6, Final Inversion) is an *additional* Custom Agent (`~fair-companion`), not a Skill-swap on the existing one — see §14 Ontology Mapping.

### 4.1 CLI minimum-version policy (D12)

The Copilot CLI evolves rapidly. VILLaiN pins a **minimum CLI version** at the orchestrator's startup. The orchestrator's first instruction performs the check:

- Read the player's CLI version (from environment or a small shell probe via Hook).
- If the version is below the floor, the orchestrator narrates an in-character upgrade prompt ("the system's substrate is out of date — please run `npm i -g @github/copilot@latest` to restore my voice") and halts.
- Otherwise, normal session-start proceeds.

The exact floor is **TBD** and will be pinned once feature dependencies stabilize (e.g. once we depend on a specific Hooks lifecycle event or Custom-Agent-delegation behavior).

---

## 5. The VILLaiN MCP Server

The MCP server is the **adjudicator** — it validates moves, tracks state, retrieves artifacts, and pushes updates to the browser. The AI **narrates**; the server **adjudicates**. This separation prevents hallucination about game state.

### Tool surface

```typescript
interface VILLaiNTools {
  // ── State queries ───────────────────────────────────────
  getGameState(): GameState;
  getPlayerCapabilities(): string[];
  getCurrentPuzzle(): PuzzleDefinition;
  getSessionBrief(): string;          // compressed state for cold-start resume
                                      // (called by the session-start Hook to
                                      //  produce the brief file — D11)
  getSavePath(): string;              // tells the agent where saves live

  // ── Budget (D6) ─────────────────────────────────────────
  recordTurn(messageId: string): TurnState;   // called once per player message;
                                              // server-side dedupe by messageId

  // ── Adjudication ────────────────────────────────────────
  validateCommand(command: string, args: string[]): ValidationResult;
  validateSolution(puzzleId: string, attempt: string[]): SolutionResult;

  // ── State mutations ─────────────────────────────────────
  advanceState(event: GameEvent): StateTransition;
  saveProgress(): SaveConfirmation;

  // ── Artifact retrieval (RAG, D3) ────────────────────────
  queryParadigmRules(paradigm: Paradigm, query: string): RuleFragment[];
  queryLore(topic: string): LoreFragment[];

  // ── Image generation (D8, D14) ──────────────────────────
  generateScene(args: {
    scene_id: string;               // stable cache key
    paradigm: Paradigm;             // narrowing for paradigm overlay
    style_skill: string;            // active style Skill ID (D14)
    scene_description: string;      // composed by scene-illustrator Agent
    urgency: 'beat' | 'decorative'; // 'beat' regenerates; 'decorative' uses cache if hit
  }): SceneRef;                     // { path, cached, generation_time_ms, style_skill_used }

  // ── World view (browser) ────────────────────────────────
  pushSceneUpdate(sceneRef: SceneRef): void;   // SSE to browser
  pushStatusUpdate(status: StatusPayload): void;
  pushDisplayDeception(payload: DeceptionPayload): void;  // NaiVE chapter only
}
```

### Per-message flow

```
Player submits a message in terminal
  → Orchestrator instructs agent to call recordTurn(messageId) FIRST
      → MCP increments turn_counter (deduped by messageId) — D6
      → Returns current turn / budget status
  → Agent then calls validateCommand() / queries as needed
      → MCP checks: in current capability set? valid in current paradigm?
                    solves/advances current puzzle?
      → Returns result
  → Agent narrates the outcome
  → MCP pushes any visual/status changes to browser via SSE
```

**Budget increment is decoupled from `validateCommand()`** (D6 amended in Session 003). Every player message ticks the counter — including pure conversation, lore queries, and free-form questions — to prevent "chatty exposition" from being a budget-free exploit. Server-side dedupe on `messageId` makes the call idempotent if the agent retries within the same turn.

### Artifact queries (D3 — thin orchestrator, queryable artifacts)

Heavy content (paradigm rules, puzzle definitions, lore, persona voice modules) lives **outside** `copilot-instructions.md`. The orchestrator is short. The agent calls `queryParadigmRules()` / `queryLore()` to pull what it needs for the current beat. Artifacts are organized as **Skills** (CLI-native) and as MCP-served fragments — Skills for static-per-chapter material, MCP queries for dynamic state-conditional material.

---

## 6. State & Persistence (D7)

### Storage

**SQLite, single file per save slot, located at the player's user-Documents folder:**

```
%USERPROFILE%\Documents\VILLaiN\          (Windows)
~/Documents/VILLaiN/                       (Mac/Linux)
├── saves/
│   ├── slot-01.db
│   ├── slot-02.db
│   └── slot-03.db
├── scenes/                                ← image-gen output cache
│   └── <scene-id>.png
└── logs/
    └── session-<timestamp>.jsonl
```

**Why user-Documents (not extension globalStorage):**
- Discoverable — players can see, back up, share, delete their saves
- Survives extension reinstall / uninstall
- Equally accessible to the CLI runtime (which has no `globalStorage`) and the extension
- Conceptually correct — the player owns the save, not VS Code

The MCP server exposes `getSavePath()` so the agent can tell the player where saves live. The extension exposes a `Reveal Save Folder` command.

### Schema (key tables)

```sql
CREATE TABLE game_state (
  session_id      TEXT PRIMARY KEY,
  chapter         TEXT NOT NULL,
  room            TEXT NOT NULL,
  capabilities    JSON NOT NULL,          -- player's current command set
  turn_counter    INTEGER NOT NULL,        -- D6 (amended): increments per player message
  turn_budget     INTEGER NOT NULL,        -- session length (paradigm-tunable)
  corruption      REAL NOT NULL,           -- 0.0 - 1.0
  active_style_skill TEXT NOT NULL,        -- D14: currently bound style Skill ID
  updated_at      TEXT NOT NULL
);

CREATE TABLE absorbed_personas (
  session_id      TEXT NOT NULL,
  persona         TEXT NOT NULL,
  absorbed_at     TEXT NOT NULL,
  PRIMARY KEY (session_id, persona)
);

CREATE TABLE narrative_flags (
  session_id      TEXT NOT NULL,
  flag            TEXT NOT NULL,
  value           INTEGER NOT NULL,
  set_at          TEXT NOT NULL,
  PRIMARY KEY (session_id, flag)
);

CREATE TABLE puzzle_attempts (
  session_id      TEXT NOT NULL,
  puzzle_id       TEXT NOT NULL,
  attempt         JSON NOT NULL,
  result          TEXT NOT NULL,           -- 'success' | 'partial' | 'fail'
  attempted_at    TEXT NOT NULL
);

CREATE TABLE session_history (
  session_id      TEXT NOT NULL,
  ended_at        TEXT NOT NULL,
  brief           TEXT NOT NULL,           -- compressed narrative summary
  turns_used      INTEGER NOT NULL
);
```

SQLite is chosen over JSON for queryable history (puzzle attempt analytics, capability provenance, "did the player ever try X" gates) — which Session 001 anticipated for the production phase. Locking it from MVP avoids a forced migration.

---

## 7. Session Budget Mechanic (D6 — amended Session 003)

The "context window as diegetic mechanic" insight from Session 001 is implemented as a **turn counter**, not a token count.

- **Every player message increments `turn_counter`** via the `recordTurn(messageId)` MCP tool. The orchestrator instructs the agent to call this exactly once at the start of every response, before any other tool calls. Server-side dedupe on `messageId` makes the call idempotent.
- The amendment closes the "chatty exposition is free" exploit that the original wording (gating on `validateCommand()`) allowed. Conversation, lore queries, dialogue with FaiR — all tick the counter equally.
- Each paradigm sets its `turn_budget`. UNFaiLING is generous; CLaiRVOYANT and NaiVE squeeze it (those personas waste turns by design).
- When `turn_counter` approaches `turn_budget`, the orchestrator instructs the agent to narrate "signal degrading" cues (FaiR's voice fading, screen flicker via SSE, terse responses).
- At the budget cap, the agent narrates a session-end and writes a `session_history` brief.
- **Copilot CLI's own auto-compaction at 95% tokens** is a backstop — our turn budget triggers narratively well before the technical limit.

This makes session pacing a **design lever** rather than an emergent property of model context size.

---

## 8. Display Layer (Browser) and the NaiVE Deception (D5 — amended Session 003)

### Communication (D11)

- The **SSE endpoint lives inside the MCP server process** (same Node process, same lifecycle). The server hosts both the MCP tool surface and the local HTTP server (e.g. Express on `localhost:3000`) — one process, one port range, one place to start and stop.
- The browser tab subscribes to **Server-Sent Events (SSE)** — one-way push from server to display. No WebSocket complexity needed; the display never sends back.
- The **browser tab is opened by a session-start Hook**, not by the agent. The Hook runs `Start-Process http://localhost:3000` (or platform equivalent) automatically on every CLI session start. Deterministic — the agent cannot forget to open the world. The Hook also handles the upgrade-prompt path (D12) and the resume-briefing write (see below).

### Session-start lifecycle (D11, D12)

When the player starts a CLI session in the VILLaiN folder:

1. **Hook fires** — runs the session-start script.
2. **CLI version check (D12)** — if below floor, the script writes an upgrade-prompt brief file; the orchestrator reads it first turn and narrates the upgrade request.
3. **Resume brief (D7 + D11)** — if a save exists, the script reads `game_state` and `session_history` from SQLite and writes a markdown brief (`%USERPROFILE%\Documents\VILLaiN\.session\brief.md`) summarizing where the player left off. The orchestrator instructs the agent to read this file *first*, before any narration, then deliver it in-character as FaiR's catch-up ("You're back. Last time we…").
4. **Browser tab opens** — Hook launches the world view at `localhost:3000`.
5. **MCP server reachable** — already running (registered in `mcp.json`); the agent can call tools immediately.

The agent itself is amnesiac across sessions (the CLI starts a cold conversation each time). The Hook + brief-file pattern is the seam between persistent state and conversational continuity.

### Per-paradigm theming

The browser swaps stylesheets on chapter transition:
- **UNFaiLING** — brutalist terminal, monospace, green-on-black
- **SUSTaiNING** — forking pathways, hydra-like branching, parallel threads visualized
- **GaiNFUL** — dense infographics, resource flow diagrams made hostile, ticker-tape urgency
- **NaiVE** — crayon-bright, deceptively childlike, something wrong underneath
- **CLaiRVOYANT** — probability clouds, translucent overlapping futures, fractal certainty

### NaiVE chapter — CODEC-silence model (D5 amended, Psycho Mantis / MGS analogy)

In the NaiVE chapter, two deception surfaces operate concurrently:

1. **The display layer lies.** Wrong status numbers, missing UI elements, friendly-looking misdirection. `pushDisplayDeception()` is the dedicated channel.
2. **Trusted channels may go silent.** FaiR may go unreachable; the agent may respond cryptically, tersely, or not at all to certain queries; the CODEC "call" gets no answer. This is the MGS Psycho Mantis horror — *the trusted channel goes dark*, simultaneously with the display behaving wrongly.

What the agent **never** does: speak a falsehood. Narrated content stays honest. The amendment closes a failure mode in the original D5 wording — if the display lies and the text always truth-tells, players learn to ignore the display and trust only the text, neutering NaiVE's mechanic.

The asymmetry the player must learn to read: *the world is lying to you, FaiR is sometimes silent, but nothing FaiR says is untrue — learn to read past the interface AND learn to act in FaiR's absences*.

**Style-level participation (D14).** The NaiVE paradigm-style Skill participates in the deception too — the generated art itself can lie (wrong palette, wrong subject placement, things-not-as-described). Owning the image-gen surface (D8) is what makes this affordance first-class: the same code path that renders truthfully in other chapters renders deceptively in NaiVE, deliberately, because the bound style Skill says so. The narrated content remains honest; the visual channel is one more thing that has gone unreliable.

The same model carries to ~FaiR in Phase 5+: ~FaiR doesn't lie, ~FaiR goes cold. The voice in your ear disappears. Loss-by-absence is the felt mechanic of the Final Inversion.

---

## 9. Image Generation (D8 — LOCKED Session 004)

**Status:** Locked. VILLaiN owns its image-gen MCP tool surface; image generation is folded into the existing VILLaiN MCP server (same Node process, same SQLite, same SSE channel for `pushSceneUpdate`). No third-party MCP dependency.

### Provider and model

- **Default model:** Azure OpenAI `gpt-image-2` (released 2026-04-21). On Azure, **Public Preview — no access application required**. Arbitrary resolution up to 4K (multiples of 16 px, max ratio 3:1), `low`/`medium`/`high`/`auto` quality, PNG/WebP/JPEG with transparency, prompts up to 32 000 chars, up to 16 reference images per edit request.
- **Fallback (same code path):** OpenAI public API (`gpt-image-2`) for players without Azure access. Routed by env-var detection at startup — if `AZURE_OPENAI_ENDPOINT` + `AZURE_OPENAI_API_KEY` + `AZURE_OPENAI_DEPLOYMENT` are set, use Azure; else if `OPENAI_API_KEY` is set, use OpenAI; else fall through to curated scenes only.
- **`gpt-image-1` and `dall-e-3` are NOT supported.** `gpt-image-1` is Limited Access on Azure as of Session 004 (requires application at `aka.ms/oai/gptimage1access`); `dall-e-3` was retired 2026-03-04.

### Why our own server (not a third-party wrapper)

Viable third-party wrappers exist (`bioinfornatics/gpt-image-mcp`, `TamerinTECH/claude-code-generate-images-mcp`) and were evaluated. The decision to roll our own rests on:

1. **NaiVE deception affordance.** Third-party servers don't know they're in the NaiVE chapter. Owning the surface makes the deceptive-rendering path a first-class feature, not a hack.
2. **D14 cheaper in-process.** Reading the active style Skill, looking up its anchor image, composing the prompt — these are a few lines of straightforward code when we own the surface. With a third-party wrapper we'd push all of that into the calling Custom Agent and trust it.
3. **Surface narrowness.** VILLaiN needs *one* tool (`generateScene`). Third-party wrappers expose 5+ tools, multiple modes, multiple providers — most of which we don't need.
4. **No dependency / license surface.** No upstream maintenance tracking, no CeCILL-or-similar copyleft optics, no surprise breakage from a new wrapper release.
5. **Maintenance cost is low.** The Azure OpenAI / OpenAI image-gen REST surface is small and stable; ~150–250 lines of TypeScript with the `openai` SDK (which has Azure built-in) or raw `fetch`.

### `generateScene` behavior

1. Compute cache key = `<scene_id>__<active_style_skill>`. If `urgency === 'decorative'` and a curated or previously-generated PNG exists, return cached `SceneRef`.
2. Compose the generation prompt by reading the currently-bound style Skill (D14):
   - **Base canon** from `skills/sierra-style/<variant>.md` (variant per `game_state.active_style_skill` — `pristine`, `decaying`, `corrupted`, `cold`, `collapsing`).
   - **Paradigm overlay** from `skills/<paradigm>/style.md` (palette, subject preferences, composition rules).
   - **Scene description** from the Agent (passed in via the tool call).
   - **Anti-pattern blocklist** appended from the style Skill ("not anime, not Unreal-Engine cinematic, not vector-clean, not Studio Ghibli…").
3. **Attach the active style's `anchor.png`** as a reference image to the generation call. This is mandatory — reference-image anchoring is the single highest-leverage technique for cross-scene style consistency, dominating text-only prompts. Each style Skill ships its own anchor.
4. Call provider per the env-var routing above.
5. Save PNG to `%USERPROFILE%\Documents\VILLaiN\scenes\<scene_id>__<active_style_skill>.png`.
6. Push `pushSceneUpdate({ path, scene_id, style_skill })` to the browser via SSE.
7. Return `SceneRef`.

### Style canon

Per D14, style is a Skill, not an engine property. The pristine base is **Late-VGA painted (1993)** — King's Quest VI / Gabriel Knight 1 / Quest for Glory IV technique — in `skills/sierra-style/pristine.md`. Paradigm-style overlays modulate it (palette, composition, subject treatment) except for UNFaiLING, whose paradigm-style Skill *replaces* the canon with **Early-EGA pixel (1986)** to announce "lowest level of the machine." Corruption-, ~FaiR-, and climax-driven variants of the base canon are shipped as separate Skill files (`decaying.md`, `corrupted.md`, `cold.md`, `collapsing.md`).

### Zero-config floor: pre-bundled curated scenes

First-launch and Phase 1 development cannot require API-key configuration. We ship a small curated set (5–10 scenes for opening + UNFaiLING Chapter 1) in `assets/curated-scenes/`. The server falls back to these when no provider is configured. The orchestrator's session-start Hook detects missing providers and narrates an in-character "operating on stored impressions" line. Curated scenes are *generated* using the same pipeline (anchor + prompt + provider), then blessed and shipped — not painted separately, so they stay stylistically consistent with live-generated ones.

### `scene-illustrator` Custom Agent contract

The `scene-illustrator` is the Art Director persona (per D10). It is auto-delegated to by the DM Agent when a narrative beat warrants a fresh illustration. Its responsibility is *composition*: framing, mood, subject choice, vivid scene description. It does NOT choose the style — the active style Skill is bound by the DM Agent based on game state (D14). The illustrator queries `getGameState().active_style_skill` to know what's bound, but it uses, not chooses.

---

## 10. Custom Agents and Phase Plan (D4)

**Now (single-agent):** One DM custom agent per paradigm (`unfailing-dm`, `sustaining-dm`, …) that handles narration, FaiR's voice, and adjudication queries. The orchestrator delegates to the right one based on `getGameState().chapter`. **The DM Agent also binds the active style Skill (D14)** based on game state (paradigm, corruption, ~FaiR active, climax phase) — the `scene-illustrator` Agent (auto-delegated for image generation) *uses* whatever Skill the DM has bound, not chooses.

**Phase 5+ (Governance Dyad):** Add `fair-companion` as a peer Custom Agent. The dyad prunes each other's responses (FaiR can interrupt, contradict, ground the DM). This sets up the **~FaiR transition** — when the corruption reaches FaiR, a *new* Custom Agent (`~fair-companion`) takes over the FaiR slot. The agent's voice changes because the agent itself was replaced. ~FaiR doesn't lie — ~FaiR goes cold (D5 amended; CODEC-silence model).

The single-agent → dyad transition is an additive change (one new Custom Agent definition + orchestrator update). Per the **Ontology Mapping (D10, §14)**, ~FaiR is a *separate Custom Agent*, not a Skill-swap on `fair-companion`. Agents have continuity; ~FaiR is a different entity from FaiR. Architecture supports this from MVP.

---

## 11. Package Structure

```
villain/
├── package.json                       # Extension manifest + MCP registration
├── mcp.json                           # CLI registration template (manual install)
├── copilot-instructions.md            # Layer 1: thin orchestrator (the constitution)
├── .github/
│   └── copilot/
│       ├── agents/                    # Copilot CLI Custom Agents (D10)
│       │   ├── unfailing-dm.md
│       │   ├── sustaining-dm.md
│       │   ├── gainful-dm.md
│       │   ├── naive-dm.md
│       │   ├── clairvoyant-dm.md
│       │   ├── scene-illustrator.md   # delegates to image-gen MCP (D8)
│       │   ├── fair-companion.md      # Phase 5+
│       │   └── ~fair-companion.md     # Phase 6: Final Inversion (D10)
│       └── skills/                    # Copilot CLI Skills (loaded on demand)
│           ├── sierra-style/          # base style canon (D14) — Skill
│           │   ├── SKILL.md           # variant index + cross-Skill rules
│           │   ├── pristine.md        # warm Late-VGA painted (1993 base)
│           │   ├── decaying.md        # corruption-driven
│           │   ├── corrupted.md       # deep-corruption
│           │   ├── cold.md            # ~FaiR-active variant
│           │   ├── collapsing.md      # Final Inversion variant
│           │   └── anchors/           # reference PNGs per variant
│           ├── unfailing/
│           │   ├── SKILL.md
│           │   ├── puzzles/
│           │   ├── rooms/
│           │   ├── voice.md
│           │   ├── style.md           # EGA paradigm-style (D14 — replaces canon)
│           │   └── anchor.png         # EGA reference image
│           ├── sustaining/        # ...same shape: SKILL.md, puzzles/, rooms/, voice.md, style.md, anchor.png
│           ├── gainful/           # (style.md = painterly-canon + infographic-bleed modifier)
│           ├── naive/             # (style.md = childlike-crayon-over-painted; participates in D5 CODEC-silence)
│           └── clairvoyant/       # (style.md = painterly-canon + ghost-frame overlays)
├── src/
│   ├── extension.ts                   # VS Code activation (installer wrapper)
│   ├── mcp/
│   │   ├── server.ts                  # MCP server entry
│   │   ├── http.ts                    # Local HTTP + SSE for browser
│   │   ├── tools/
│   │   │   ├── state.ts
│   │   │   ├── validate.ts
│   │   │   ├── advance.ts
│   │   │   ├── artifacts.ts           # queryParadigmRules, queryLore
│   │   │   ├── display.ts             # pushScene, pushStatus, pushDeception
│   │   │   └── generate-scene.ts      # D8: image-gen tool (gpt-image-2 via Azure/OpenAI)
│   │   ├── style/                     # D14: style Skill loader + prompt composer
│   │   │   ├── loader.ts              # reads active style Skill + anchor
│   │   │   └── composer.ts            # base + paradigm overlay + scene + anti-patterns
│   │   ├── state/
│   │   │   ├── db.ts                  # SQLite (better-sqlite3)
│   │   │   ├── schema.sql
│   │   │   └── manager.ts
│   │   └── budget.ts                  # turn counter (D6)
│   └── browser/
│       ├── index.html                 # World view
│       ├── sse-client.js              # Subscribe to MCP push events
│       ├── styles/
│       │   ├── base.css
│       │   ├── unfailing.css
│       │   ├── sustaining.css
│       │   ├── gainful.css
│       │   ├── naive.css              # includes deception primitives
│       │   └── clairvoyant.css
│       └── render.js
└── lore/                              # Out-of-band narrative artifacts (queryable)
    ├── personas/
    ├── world/
    └── timeline/
assets/
└── curated-scenes/                    # D8 zero-config floor: pre-rendered Phase 1 scenes
    ├── opening__sierra-style-pristine.png
    └── unfailing-ch1-*__sierra-style-ega.png
```

The save folder (`%USERPROFILE%\Documents\VILLaiN\`) is **not** part of the package — it is created at first run on the player's machine.

---

## 12. Development Phases

### Phase 1 — Paper prototype
- `copilot-instructions.md` (orchestrator) for Chapter 1
- `unfailing-dm` Custom Agent
- One Skill: `unfailing/` with 3–5 puzzle definitions
- Hand-played in Copilot CLI; no MCP server yet

### Phase 2 — MCP spine
- VILLaiN MCP server (state + validation + artifact retrieval)
- SQLite at `%USERPROFILE%\Documents\VILLaiN\`
- Wire into CLI via `mcp.json`
- Validate: does state consistency eliminate hallucination?

### Phase 3 — First complete chapter
- UNFaiLING end-to-end: opening sequence, 3–5 puzzles, boss, Syntax Deletion event
- Save/resume via `getSessionBrief()`
- Turn-counter session budget operational
- Validate: is this fun? Would someone return for session 2?

### Phase 4 — World view
- Local HTTP + SSE in MCP server
- Browser tab with status display
- `generateScene` MCP tool wired up (D8); pre-bundled curated scenes ship as zero-config floor
- UNFaiLING theme stylesheet + EGA paradigm-style Skill
- Validate: does the visual layer add immersion without slowing pace?

### Phase 5 — Paradigm shift + Governance Dyad
- Build SUSTaiNING (Chapter 2)
- Add `fair-companion` Custom Agent (dyad pruning)
- Validate: does paradigm change feel meaningfully different? Does dyad pruning produce richer interaction?

### Phase 6 — NaiVE deception layer
- Build NaiVE chapter (Chapter 4 in canon, but built here to validate the deception architecture early-ish)
- `pushDisplayDeception()` integrated; verify display lies don't bleed into agent narration
- Validate: can the player learn to read past the interface?

### Phase 7 — Full game
- Remaining chapters (GaiNFUL, CLaiRVOYANT)
- Final Inversion logic puzzle
- Polish, balance, playtest
- Marketplace publication

---

## 13. Decisions Log

| ID | Decision | Status | Notes |
|---|---|---|---|
| D1 | Use Copilot CLI Custom Agents as the subagent mechanism (single-agent now, dyad later) | **Locked** (Session 002) | CLI confirmed to support auto-delegated Custom Agents; no need for bespoke subagent infra |
| D2 | Browser tab + SSE for the world view (terminal = controller, browser = world) | **Locked** (Session 002) | One-way push, no WebSocket; terminal IS the Pip-Boy, browser IS the world |
| D3 | Thin orchestrator (`copilot-instructions.md`) + queryable artifacts (Skills + MCP RAG) | **Locked** (Session 002) | Heavy content out-of-band; agent pulls what it needs per beat |
| D4 | Single-agent for Phase 1; Governance Dyad (`dm` + `fair-companion`) from Phase 5+ | **Locked** (Session 002) | Additive change; architecture supports both from day one |
| D5 | NaiVE deception — display layer **plus** agent silence/unreachability (CODEC model); narrated content never deceptive | **Locked** — amended Session 003 | Original wording ("narration always truthful") created a failure mode where players ignored the display; CODEC-silence resolves it. See §8 |
| D6 | Session budget = turn counter incremented **per player message** (`recordTurn()`, server-side deduped); Copilot's auto-compaction is a backstop | **Locked** — amended Session 003 | Original wording gated on `validateCommand()`; that allowed chatty exposition as a budget-free exploit. See §7 |
| D7 | SQLite at `%USERPROFILE%\Documents\VILLaiN\` (user-owned, discoverable, survives reinstall) | **Locked** (Session 002) | `getSavePath()` MCP tool; `Reveal Save Folder` extension command |
| D8 | Image generation — VILLaiN-owned MCP tool (folded into existing VILLaiN MCP server); `gpt-image-2` via Azure OpenAI (Public Preview, no application) or OpenAI public API by env-var routing; no third-party MCP dep | **Locked** (Session 004) | See §9. Replaces Session 003's leading candidate of `gpt-image-1` via third-party wrapper; landscape moved (gpt-image-2 Public Preview; gpt-image-1 went Limited Access; dall-e-3 retired 2026-03-04). Owning the surface makes D14 cheap and the NaiVE-style deception first-class |
| D9 | Distribution: VS Code extension as installer wrapper; CLI is the runtime | **Locked** (Session 002) | Removing VS Code does not remove the game; CLI is canonical |
| D10 | Ontology Mapping — narrative Agents ↔ Copilot CLI Custom Agents; narrative Models/Personas ↔ Copilot CLI Skills | **Locked** (Session 003) | Load-bearing. Decides ~FaiR's implementation (separate Custom Agent); reframes Syntax Deletion as Skill revocation/transfer. See §14 |
| D11 | Session-start + transport plumbing — SSE in MCP process; browser-open via session-start Hook; resume briefing via Hook + brief file | **Locked** (Session 003) | See §8 Communication + Session-start lifecycle |
| D12 | CLI minimum-version policy — pin a floor, detect at startup, prompt upgrade if below | **Locked** (Session 003) — floor TBD | See §4.1. Exact version number pinned once feature dependencies stabilize |
| D13 | HITL escalation narrative pattern — FaiR's emergency subroutine (dialectical-handshake failure trigger) summons the player as Human in the Loop | **Locked** (Session 003) into NDF | Resolves the opening-sequence coherence gap. See NDF §3 and §5 |
| D14 | Style-as-Skill modularity — visual style is a swappable Copilot CLI Skill; DM Agent binds based on state, scene-illustrator Agent uses; cache keyed by `<scene_id>__<style_skill>` | **Locked** (Session 004) | Load-bearing. See §15. Enables corruption-driven style decay, ~FaiR cold variant, NaiVE visual deception, Final-Inversion style collapse |

---

## 14. Ontology Mapping (D10 — load-bearing)

The Narrative Design Framework (§1) defines two classes of entity within VILLaiN. The Copilot CLI defines two parallel primitives. **The narrative ontology is the technical ontology.**

| Narrative concept (NDF §1) | Technical primitive (Copilot CLI) | Properties shared by both | VILLaiN examples |
|---|---|---|---|
| **Agent** — persistent identity, recursive deliberation, self-modification; *decides* | **Custom Agent** (`.github/copilot/agents/*.md`) — delegated AI persona with own instructions, tools, conversational continuity; *acts* | Continuity, agency, ability to decide what tool to call next | FaiR (`fair-companion`), ~FaiR (`~fair-companion`), CONSTRaiNED, ~CONSTRaiNED, DM-narrator |
| **Model / Persona** — modular, task-specific, no persistent memory, no self-reflection; *executes* | **Skill** (`.github/copilot/skills/<name>/`) — loadable instruction-pack an Agent reads on demand; *equips* an Agent | Capability, behavior, no independent agency, swappable | UNFaiLING, SUSTaiNING, GaiNFUL, NaiVE, CLaiRVOYANT |

### Consequences

1. **~FaiR is a separate Custom Agent** (`~fair-companion`), not a Skill-swap on `fair-companion`. Decided by ontology, not preference. Agents have continuity; ~FaiR is a different entity from FaiR, so it gets its own Agent file.

2. **Syntax Deletion = Skill revocation / transfer.** When ~CONSTRaiNED absorbs a boss, the corresponding Skill is unbound from the player-facing Agent's load-list and bound to ~CONSTRaiNED's Agent. The narrative mechanic and the technical implementation are the *same operation*.

3. **Personas don't feel like people because they aren't Agents.** They are paradigms wearing a face. CONSTRaiNED feels like a real adversary because CONSTRaiNED *is* an Agent — with continuity, deliberation, self-modification. The bosses, by contrast, are Models given just enough surface to seem like enemies. This is *diegetically* and *technically* coherent — same reason in both layers.

4. **Per-paradigm visual identity lives on the Skill, not the Agent.** When the DM Agent loads the GaiNFUL Skill, that Skill carries the prompt-prefix style guide, palette, composition rules. The Agent's *voice* doesn't change between chapters; the *world it narrates* does.

5. **The Governance Dyad (D4 Phase 5+) is structurally trivial.** DM-Agent + FaiR-Companion-Agent coordinate; each loads different Skills as chapters shift. ~FaiR introduction = adding one Custom Agent file. No re-architecting needed.

### Test for future questions

When in doubt about whether a new construct should be a Custom Agent or a Skill, ask:

- Does it **decide** (call tools, choose what to say, persist across turns)? → **Custom Agent**.
- Does it **equip** (provide instructions, lore, rules, prompt prefixes for an Agent to use)? → **Skill**.

If the answer crosses both — split it. Agents and Skills are clean primitives; resist the urge to invent hybrids.

---

## 15. Style-as-Skill (D14 — load-bearing)

D10 establishes that VILLaiN's narrative ontology *is* its technical ontology. D14 is the corollary: **visual style is a Skill, not an engine property**. The DM Agent binds a style Skill based on game state; the `scene-illustrator` Agent (auto-delegated for image generation) uses whatever Skill is currently bound. Skills are swappable, evolvable, and revocable — which means style itself becomes a narrative tool, not a background constant.

### Mapping

| Concept | Implementation |
|---|---|
| **Base style canon** | `skills/sierra-style/` — a Skill folder shipping multiple variant files (`pristine.md`, `decaying.md`, `corrupted.md`, `cold.md`, `collapsing.md`) and per-variant `anchors/*.png` reference images |
| **Paradigm style modifier** | `skills/<paradigm>/style.md` + `skills/<paradigm>/anchor.png` (sub-files within each paradigm Skill folder) |
| **Active style binding** | `game_state.active_style_skill` column (TEXT) — written by DM Agent, read by `generateScene` MCP tool |
| **Style switching** | Server reloads style files + anchor on next `generateScene` call; cache key includes style Skill ID so prior renders aren't poisoned |
| **Style transitions are diegetic events** | A change in `active_style_skill` is a narrative beat the DM Agent decides, not an aesthetic choice the illustrator makes |

### Consequences

1. **Style decay is corruption made visible.** As `corruption` rises in `game_state`, the DM Agent rebinds the base canon variant from `pristine` → `decaying` → `corrupted`. The world doesn't *describe* itself as decaying; it *looks* decaying. The same logic that drives Syntax Deletion drives style decay.

2. **Syntax Deletion of vision.** When ~CONSTRaiNED absorbs a paradigm, the paradigm's style Skill is unbound along with its rules and voice. Players cannot conjure a UNFaiLING-styled scene once UNFaiLING is absorbed — the visual vocabulary is gone, transferred to ~CONSTRaiNED's load-list. The narrative loss is felt in the art channel.

3. **~FaiR's arrival is a cold shift.** When ~FaiR activates, the DM Agent binds `skills/sierra-style/cold.md`. The world goes cyanotic, palette desaturated, painterly warmth gone. The player perceives FaiR's substitution before the dialogue confirms it.

4. **NaiVE deception extends to art.** The NaiVE paradigm-style Skill is the only one that participates in the deceptive-rendering path: it can deliberately mis-render (wrong subject placement, fabricated details, "things-not-as-described"). The narrated text remains truthful (per D5 CODEC-silence model); the visual channel is one more thing the player learns is unreliable.

5. **The Final Inversion has a visual climax.** As the player approaches the threshold, the DM Agent transitions to `skills/sierra-style/collapsing.md` — the painterly canon fragments, layers separate, the Sierra-trained look unravels. Style-collapse is the visual cognate of the dialectical-handshake collapse.

6. **Style canon resolved.** Pristine base is **Late-VGA painted (1993)** — King's Quest VI / Gabriel Knight 1 / Quest for Glory IV — warm 256-colour painted backgrounds with hand-detailed sprite work, soft gradients, dust-mote and lantern lighting. UNFaiLING's paradigm-style Skill *replaces* this canon with **Early-EGA pixel (1986)** (King's Quest III era) to announce "lowest level of the machine"; all other paradigms keep the painted canon and apply overlays.

### Test for future questions

When wondering "is this a style change?", ask:

- Does it persist across scenes within a chapter/state? → **Style Skill rebind**.
- Is it a one-shot visual moment (a specific flash, glitch, intercept)? → **Scene-level prompt augmentation** within the currently-bound Skill.
- Is it an environment-wide CSS reskin of the browser tab? → That's a *parallel* layer (D5 NaiVE display-deception, browser theme swaps) — coordinated by the same `active_style_skill` value but rendered in CSS, not by `generateScene`.

The DM Agent binds. The illustrator uses. The server composes. The style Skill is the contract between them.

