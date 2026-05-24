// VILLaiN browser client — subscribes to the SSE stream and patches the DOM.
//
// Render protocol: the server pushes {panel, title, body, ts, event?} objects.
// We show the matching panel (and hide the boot screen once any real panel
// arrives). Boot panel is the only one shown on initial load.

const $ = (id) => document.getElementById(id);

const PANELS = {
  boot:    { el: $("bootPanel"),    title: null,            body: $("bootBody") },
  man:     { el: $("manPanel"),     title: $("manTitle"),    body: $("manBody") },
  status:  { el: $("statusPanel"),  title: $("statusTitle"), body: $("statusBody") },
  stinger: { el: $("stingerPanel"), title: $("stingerTitle"),body: $("stingerBody") },
};

const conn = $("connection");
const stamp = $("lastUpdate");

function applyState(state) {
  if (!state || !state.panel) return;

  const target = PANELS[state.panel];
  if (!target) return;

  // Hide all panels, then show only the targeted one.
  for (const [id, p] of Object.entries(PANELS)) {
    p.el.hidden = (id !== state.panel);
  }

  // Boot panel has static content — never overwrite it.
  if (state.panel !== "boot") {
    if (target.title && state.title != null) target.title.textContent = state.title;
    if (target.body  && state.body)          target.body.textContent  = state.body;
  }

  document.body.dataset.panel = state.panel;

  // Connection / lifecycle hints.
  if (state.event === "fair-released") {
    conn.dataset.state = "released";
    conn.textContent = "— FaiR released —";
  }

  if (state.ts) {
    stamp.textContent = new Date(state.ts).toLocaleTimeString();
  }
}

function connect() {
  const es = new EventSource("/events");

  es.addEventListener("open", () => {
    conn.dataset.state = "connected";
    conn.textContent = "— connected —";
  });

  es.addEventListener("message", (ev) => {
    try { applyState(JSON.parse(ev.data)); } catch (e) { console.error(e); }
  });

  es.addEventListener("error", () => {
    conn.dataset.state = "";
    conn.textContent = "— reconnecting —";
    // EventSource auto-reconnects; nothing else to do.
  });
}

connect();
