// Scene resolver — loads scene dicts from scenes/, resolves context keys.
//
// Architecture: each scene is a JSON file in scenes/ mapping context keys
// (e.g. "man:fair", "ls:/var/log", "cat:/etc/villain/config.yaml") to
// outcome objects ({ panel, title, body, event?, next? }).
//
// Resolution: currentScene[key] → outcome. If key not found, returns null.
// The server sets the active scene on startup and advances it when an
// outcome carries a `next` field.

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export class SceneResolver {
  constructor(scenesDir) {
    this.scenesDir = scenesDir;
    this.scenes = new Map();      // sceneId → { _meta, ...entries }
    this.activeSceneId = null;
  }

  async load() {
    const files = await readdir(this.scenesDir);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const raw = await readFile(join(this.scenesDir, f), "utf8");
      const scene = JSON.parse(raw);
      const id = scene._meta?.id ?? f.replace(/\.json$/, "");
      this.scenes.set(id, scene);
    }
    // Default to first scene if none set.
    if (!this.activeSceneId && this.scenes.size > 0) {
      this.activeSceneId = this.scenes.keys().next().value;
    }
  }

  setScene(sceneId) {
    if (!this.scenes.has(sceneId)) return false;
    this.activeSceneId = sceneId;
    return true;
  }

  resolve(key) {
    const scene = this.scenes.get(this.activeSceneId);
    if (!scene) return null;
    const outcome = scene[key];
    if (!outcome || key === "_meta") return null;
    return outcome;
  }

  // List all valid keys for the active scene (for help/apropos).
  keys() {
    const scene = this.scenes.get(this.activeSceneId);
    if (!scene) return [];
    return Object.keys(scene).filter(k => k !== "_meta");
  }

  get meta() {
    const scene = this.scenes.get(this.activeSceneId);
    return scene?._meta ?? null;
  }
}
