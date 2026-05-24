# Skill: art-director

**Renderer's playbook.** This Skill governs *how* the browser surface is composed — panel layout, when to animate, what reads as "instrument," what reads as "world." It is distinct from the style Skills under `sierra-style/`, which govern the *visual language* (palette, composition, painted aesthetic per D14). The art-director consumes whichever style Skill is currently bound.

> **v0 note:** the v0 browser stylesheet (`browser/style.css`) is a **terminal-typography placeholder** — legible monospace on dark bg, accent amber. The full Late-VGA painted Sierra canon (D14, `sierra-style/pristine`) is deferred to v0.1+ once the playable loop is proven. This Skill is mostly a stub until then.

## Panel inventory (v0)

The browser has four panels. Exactly one is visible at a time (the SSE-pushed state's `panel` field selects).

| Panel id   | Purpose                                                | Triggered by                                              |
|------------|--------------------------------------------------------|-----------------------------------------------------------|
| `boot`     | localhost splash + orientation copy                      | Initial load. Hidden permanently after first real panel.  |
| `man`      | Renders a manual page (markdown body, mono typography) | `render({panel:"man", topic})` from the agent             |
| `status`   | General system readout / scanner output                | `render({panel:"status", body})` from the agent           |
| `stinger`  | Full-card flash: chapter cards, release moments        | `render({panel:"stinger", ...})` or `validateKey` success |

## Composition rules (v0)

- **Monospace everywhere.** Even prose man pages render in mono. This is the instrument's voice.
- **No images yet** (D8/D14 image-gen is later iteration).
- **Animation is reserved for state changes** — never for ambient decoration. The stinger fade-in is the only ambient animation in v0.
- **Color is structural, not decorative.** Amber = accent / focus; bone = body text; green = "ok / released"; warm red = "warn / breach."

## What renders here, what doesn't

| Renders here (browser)                                       | Does NOT render here                                         |
|---------------------------------------------------------------|--------------------------------------------------------------|
| Manual pages                                                  | FaiR's voice (CLI only)                                      |
| System logs presented via render (rare in v0)                 | Player commands (CLI only)                                   |
| Status / scanner output                                       | Instrument-acknowledgement lines (CLI only)                  |
| Chapter stingers                                              | Anything that "speaks"                                       |

## Promotion path

- **v0.1:** import `sierra-style/pristine` palette tokens, replace the placeholder colors. Add the painted-canon background texture.
- **v0.2:** anchor-image-driven scene illustrations (D8) render in a fifth `scene` panel, fed by the `generateScene` MCP tool.
- **Phase 1+:** paradigm style Skill overlays. CSS variables swap on `active_style_skill` change.
- **NaiVE:** `pushDisplayDeception()` can render falsely (the only Skill allowed to mis-render — D5/D14).
- **~FaiR:** cold-variant palette swap (warmth drained, cyanotic).
