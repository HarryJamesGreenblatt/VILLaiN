// Game state — persists across CLI sessions via JSON file.
//
// Reads on server startup, writes on state-changing events.
// Save location: %USERPROFILE%/Documents/VILLaiN/.save/state.json

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const SAVE_DIR = join(homedir(), "Documents", "VILLaiN", ".save");
const SAVE_FILE = join(SAVE_DIR, "state.json");

const defaults = {
  scene: "v0/opening",
  released: false,
  turns: 0,
  lastPanel: "boot",
};

let state = { ...defaults };

export const gameState = {
  /** Load state from disk. Missing file = fresh game. */
  async load() {
    try {
      const raw = await readFile(SAVE_FILE, "utf8");
      const saved = JSON.parse(raw);
      state = { ...defaults, ...saved };
    } catch {
      state = { ...defaults };
    }
    return state;
  },

  /** Persist current state to disk. */
  async save() {
    try {
      await mkdir(SAVE_DIR, { recursive: true });
      await writeFile(SAVE_FILE, JSON.stringify(state, null, 2), "utf8");
    } catch (err) {
      process.stderr.write(`[villain] save failed: ${err.message}\n`);
    }
  },

  /** Reset to defaults and delete save file. */
  async reset() {
    state = { ...defaults };
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(SAVE_FILE);
    } catch { /* no file to delete */ }
  },

  /** Get current state. */
  get() { return { ...state }; },

  /** Update state fields and persist. */
  async update(patch) {
    Object.assign(state, patch);
    await gameState.save();
    return state;
  },

  /** Whether a save file exists. */
  async exists() {
    try {
      await readFile(SAVE_FILE, "utf8");
      return true;
    } catch {
      return false;
    }
  },
};
