import type { Category, Heat, Mode, Question } from "./types";

export type Settings = { mode: Mode; heat: Heat; category: Category; autoHeat: boolean; sound: boolean };
export type SavedSession = {
  settings: Settings;
  historyIds: string[];
  cursor: number;
  remainingSeconds: number;
  completed: boolean;
};
export const DEFAULT_SETTINGS: Settings = {
  mode: "classic", heat: 2, category: "Mixed", autoHeat: false, sound: false,
};
const PREFIX = "nhie-v1-";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFIX + "settings") || "null");
    if (!parsed || ![1,2,3,4,5].includes(parsed.heat)) return DEFAULT_SETTINGS;
    return {
      mode: ["classic","endless","quickfire","custom"].includes(parsed.mode) ? parsed.mode : "classic",
      heat: parsed.heat, category: typeof parsed.category === "string" ? parsed.category : "Mixed",
      autoHeat: Boolean(parsed.autoHeat), sound: Boolean(parsed.sound),
    };
  } catch { return DEFAULT_SETTINGS; }
}
export function loadCustom(): Question[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(localStorage.getItem(PREFIX + "custom") || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((q: Question) =>
      q && q.custom === true && /^never have i ever\b/i.test(q.text) &&
      [1,2,3,4,5].includes(q.heat) && typeof q.id === "string" && q.text.length <= 180 &&
      typeof q.category === "string",
    ).slice(0, 500);
  } catch { return []; }
}
export function loadSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(sessionStorage.getItem(PREFIX + "session") || "null");
    return value && Array.isArray(value.historyIds) && value.settings ? value as SavedSession : null;
  } catch { return null; }
}
export function saveSettings(settings: Settings) {
  try { localStorage.setItem(PREFIX + "settings", JSON.stringify(settings)); } catch {}
}
export function saveCustom(questions: Question[]) {
  try { localStorage.setItem(PREFIX + "custom", JSON.stringify(questions)); } catch {}
}
export function saveSession(session: SavedSession | null) {
  try {
    if (session) sessionStorage.setItem(PREFIX + "session", JSON.stringify(session));
    else sessionStorage.removeItem(PREFIX + "session");
  } catch {}
}
