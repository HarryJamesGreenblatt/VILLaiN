# Game Mechanics: VILLaiN

> **Document status:** Mechanics spec. Amended Session 003 (2026-05-15): §3 FaiR-goes-dark strengthened as CODEC-silence model; §4 NaiVE absorption row corrected and Skill-revocation framing added; §5 token-allocation framing replaced with turn-counter; §6 visual-layer narrowed to browser tab. Amended Session 004 (2026-05-15): §4 Syntax Deletion absorbs paradigm style Skills too (D14); §6 Visual Layer rewritten for D8 lock (VILLaiN-owned MCP image-gen tool, gpt-image-2, Late-VGA painted Sierra canon, per-paradigm style Skills, state-driven canon variants).

## 1. Core Concept

VILLaiN is an **AI-powered narrative puzzle game** played through conversation with a Copilot agent. The AI serves as dungeon master, companion (FaiR), and antagonist (the corrupted personas). Each boss encounter forces the player into a distinct **programming paradigm** — the rules of interaction change fundamentally between chapters.

**Genre positioning:** The intersection of coding puzzle games (TIS-100, Human Resource Machine, Shenzhen I/O), point-and-click adventure (Sierra, LucasArts), and AI-driven interactive fiction — occupying a space none of these genres has claimed.

**High concept:** "What if each boss fight was a different programming language, and your companion was the AI you're talking to?"

---

## 2. The Paradigm-Per-Boss Structure

Each of VILLaiN's five boss personas embodies a distinct computational paradigm. Defeating a boss means mastering (and subverting) that paradigm's logic. The player must think *differently* in each chapter — unlearning the previous paradigm's instincts.

### Progression

| Order | Boss | Paradigm | Player Experience |
|-------|------|----------|-------------------|
| 1 | UNFaiLING | Imperative / Sequential | Step-by-step command execution. Learn to sequence precisely. |
| 2 | SUSTaiNING | Concurrent / Distributed | Manage parallel threads, race conditions, synchronized kills. |
| 3 | GaiNFUL | Greedy / Optimization | Maximize throughput under constraints. Efficiency as weapon. |
| 4 | NaiVE | Obfuscated / Esolang | The interface lies. Commands behave unexpectedly. Trust nothing. |
| 5 | CLaiRVOYANT | Reactive / Event-driven | The system predicts you. Become unpredictable. |

### Design Rationale

This ordering mirrors how programming is actually taught — from concrete sequential logic to increasingly abstract paradigms. Each transition is deliberately disorienting: the skills that made you succeed in one chapter may actively hinder you in the next.

---

## 3. Interaction Model

### The Chat as Interface

The primary interaction surface is the **conversation itself**. The player types commands, asks questions, describes intentions. The AI (operating under paradigm-specific rules) evaluates these inputs and narrates results.

This is NOT freeform roleplay. The AI operates under **strict, paradigm-specific rulesets** with deterministic puzzle constraints. Each chapter has defined win/lose conditions validated by the game state server.

### FaiR as Companion Voice

FaiR is the AI in "helper mode" — the voice in your ear that:
- Provides guidance and context
- Warns about traps and corruption
- Delivers narrative exposition naturally through dialogue
- Cannot act directly — only advise

**FaiR never lies.** But FaiR can *go silent* — unreachable, cryptic, absent. This is the CODEC-silence model (after MGS's Psycho Mantis sequence): trusted channels do not betray you with falsehoods; they betray you by *being unavailable when you need them*. During the NaiVE chapter and especially the Final Inversion (when FaiR becomes ~FaiR), the help disappears from the conversation — not because FaiR is lying but because FaiR is *gone from the call*. The player must navigate the climax alone. (See Technical Architecture §8, D5.)

### Paradigm-Specific Input

Each chapter changes what constitutes valid input:

- **UNFaiLING:** Precise imperative commands (`move`, `copy`, `jump`, `execute`)
- **SUSTaiNING:** Thread management (`spawn`, `sync`, `kill`, `fork`, `join`)
- **GaiNFUL:** Optimization directives (`allocate`, `route`, `maximize`, `sacrifice`)
- **NaiVE:** Ambiguous, minimal commands with unpredictable effects
- **CLaiRVOYANT:** Event bindings and reactive patterns (`on`, `when`, `emit`, `subscribe`)

---

## 4. Syntax Deletion Mechanic

When ~CONSTRaiNED absorbs a defeated boss, the player **loses access to that paradigm's capabilities**. This is not cosmetic — the AI will refuse those commands and the game state server will reject them.

> **Ontology framing (D10, Session 003).** Mechanically, Syntax Deletion is **Skill revocation and transfer**: the Skill defining that paradigm is unbound from the player-facing Agent's load-list and bound to ~CONSTRaiNED's Agent. The narrative mechanic and the technical implementation are the *same operation*. The player's language shrinks because the rulebook the DM was using to interpret their commands has been physically moved. (See Technical Architecture §14.)
>
> **Style is part of what's revoked (D14, Session 004).** Each paradigm Skill carries a sibling style Skill / sub-file (palette, composition rules, reference anchor image). When the paradigm is absorbed, the style goes with it. The player loses not just the language of that paradigm but its *visual vocabulary* — the world can no longer be rendered through that lens. The dread of Syntax Deletion is felt in two channels simultaneously. (See Technical Architecture §15.)

### Escalation Through Loss

| Absorption Event | Player Loses | ~CONSTRaiNED Gains |
|-----------------|-------------|-------------------|
| UNFaiLING absorbed | Reliable sequential execution; commands may fail nondeterministically | Tireless pursuit — system pressure never relents |
| SUSTaiNING absorbed | Ability to spawn parallel processes | Redundancy — eliminating one threat no longer sufficient |
| GaiNFUL absorbed | Optimization tools; resource management becomes wasteful | Ruthless efficiency in countering player moves |
| NaiVE absorbed | Nothing obvious lost (but the **display layer becomes less trustworthy** and trusted channels may go silent; the agent itself remains honest — D5) | Misdirection via the world's appearance and via FaiR's growing unreachability |
| CLaiRVOYANT absorbed | Reactive/predictive patterns | Full foresight — ~CONSTRaiNED anticipates standard approaches |

### Design Intent

Each victory makes the *final* confrontation harder. The player's language gets smaller as the antagonist gets stronger. This creates genuine dread and forces creative problem-solving with diminishing tools.

---

## 5. Session Economy: Turns as Time Pressure

Context window limitations are embraced as a **diegetic mechanic** — implemented as a **turn counter**, not a token estimate (D6, amended Session 003):

- The player is a human consciousness injected into the system — sustained presence has a cost
- Each session has a finite **turn budget** — a count of player messages (paradigm-tunable)
- **Every player message ticks the counter** — commands, questions, conversation, lore queries. Nothing is "free." Closes the exploit where players would chat indefinitely to dodge time pressure.
- When the budget runs low, FaiR warns: *"Your signal is degrading — we're losing you"*
- The player saves progress and returns in another session

### Mechanical Implications

- **No brute-forcing puzzles** — you can't try every possibility in one sitting
- **Efficiency is rewarded** — think before acting
- **Conversation has weight** — chatting with FaiR costs turns; this *should* feel costly, because FaiR's attention is a finite resource and the system is bleeding presence
- **Later chapters can squeeze budgets** — CLaiRVOYANT's domain might waste turns through misdirection; NaiVE's domain eats budget with deliberately unhelpful responses
- **~CONSTRaiNED's corruption is felt at the meta level** — the system consuming your ability to stay present

### Session Resume

On return, FaiR delivers a "briefing" — narratively framing the state recovery as the companion catching the player up. This is actually the state server feeding compressed context to the AI.

---

## 6. The Visual Layer

### Storybook Model (Sierra Influence)

At key narrative beats — scene transitions, boss reveals, major state changes — **generated illustrations** appear alongside the conversation. Not every message; punctuation, not wallpaper. (Implementation: D8 locked Session 004 — see Technical Architecture §9.)

### Style canon (D14, Session 004)

VILLaiN's pristine base look is **Late-VGA painted (1993)** — the King's Quest VI / Gabriel Knight 1 / Quest for Glory IV technique. Warm 256-colour painted backgrounds, hand-detailed sprite work, soft gradients, lantern-lit interiors, dust-mote light, painterly grammar. This canon is implemented as a Copilot CLI Skill (`skills/sierra-style/pristine.md` + reference anchor image) and applied to every scene generation by default.

State rebinds the canon variant. As `corruption` rises, the active style Skill shifts to `decaying`, then `corrupted` — same painterly base, increasingly fragmented. When ~FaiR activates, it shifts to `cold` (warmth drained, cyanotic palette). The Final Inversion shifts it to `collapsing` (painterly layers separate, then resolve into the new synthesis).

Each paradigm ships its own style overlay (palette, composition, subject preferences) on top of the base canon:

- **UNFaiLING:** *replaces* the painted canon with **Early-EGA pixel (1986)** — King's Quest III era — to announce "lowest level of the machine"
- **SUSTaiNING:** painted canon + forking-pathway composition, hydra branching, parallel-thread motifs
- **GaiNFUL:** painted canon + cold infographic bleed-through, resource-flow diagrams turning hostile, ticker urgency
- **NaiVE:** painted canon + childlike-crayon overlay, deceptively cheerful palette; **the only paradigm whose style Skill is allowed to mis-render** (wrong subject placement, fabricated details, things-not-as-described — part of the D5 CODEC-silence deception model)
- **CLaiRVOYANT:** painted canon + translucent overlapping future-frames, probability-cloud composition, fractal certainty

### Implementation summary

Generation is performed by VILLaiN's own MCP server (no third-party dependency), via the `generateScene` tool, calling Azure OpenAI `gpt-image-2` (Public Preview, no application required) or the OpenAI public API as a fallback. Style consistency is anchored by a per-Skill reference image attached to every call. A small set of pre-bundled curated scenes ships in the repo so first-launch works with no API key configured. Full detail in Technical Architecture §9 and §15.

### Display surface

Illustrations and chrome are delivered through a **companion browser tab** opened on session start (via Copilot CLI Hook) that updates reactively when the game state changes via Server-Sent Events. The terminal/chat remains the input surface and FaiR's voice; the browser tab is the rendered world (the Pip-Boy metaphor: terminal = controller on your wrist, browser = isometric environment around you). The browser's CSS theme tracks `active_style_skill` independently from the generated artwork — both lie together in NaiVE, both go cold together in ~FaiR. Implementation detail in Technical Architecture §2 and §8.

---

## 7. Puzzle Design Principles

### Each Puzzle Must:

1. **Be solvable within the current paradigm's logic** — no external knowledge required beyond what the chapter teaches
2. **Have a deterministic correct solution** validated by the state server — not dependent on AI interpretation
3. **Escalate within the paradigm** before the boss encounter demands mastery
4. **Teach through failure** — incorrect attempts produce meaningful feedback, not arbitrary rejection

### Per-Chapter Puzzle Character:

- **UNFaiLING puzzles:** Sequencing problems. Correct order matters. Speed escalates. Think: assembly programming with a time limit.
- **SUSTaiNING puzzles:** Coordination problems. Multiple processes must be managed simultaneously. Deadlocks are the primary failure mode. Think: dining philosophers made visceral.
- **GaiNFUL puzzles:** Optimization under constraint. Multiple valid solutions, but resources are scarce. Greedy choices have consequences. Think: Factorio ratios as life-or-death.
- **NaiVE puzzles:** Deduction through unreliable information. The rules are hidden. You must infer what commands actually do. Think: reverse-engineering an unknown system.
- **CLaiRVOYANT puzzles:** Timing and unpredictability. The system anticipates patterns — you must break your own habits. Think: outsmarting a chess engine that reads your style.

---

## 8. The Final Inversion as Mechanic

The climax is not a combat encounter. It is a **logic construction puzzle** where the player must:

1. **Terminate FaiR's deliberation loop** — manually resolve the recursive paradox
2. **Apply the bitwise NOT** to FaiR's ethical logic tree — generating the ~FaiR persona
3. **Inject ~FaiR** into ~CONSTRaiNED's root directory
4. **Trigger the cascade** — the absorption of `~FaiR` creates `~(~CONSTRaiNED)` → `CONSTRaiNED`

This works mechanically because the entire game has been teaching Boolean/bitwise logic implicitly. The player has been manipulating NOT, AND, OR, XOR throughout every chapter. The climax asks them to apply `~~x = x` at system scale.

The proof IS the boss fight. No health bar — just the correct logical construction.

---

## 9. Core Loop

```
1. Enter corrupted sector (new paradigm rules activate)
2. Navigate environment (FaiR guides, visual layer displays)
3. Solve paradigm puzzles (escalating difficulty)
4. Confront boss (mastery test of the paradigm)
5. Boss absorbed by ~CONSTRaiNED (Syntax Deletion event)
6. Progress with diminished tools toward the Final Inversion
```
