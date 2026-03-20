import { C } from "../../lib/tokens";
import { AGENT_ACTION_TYPES } from "../../lib/pillars";
import { store } from "../../lib/storage";

export const AUTONOMY_LEVELS = ["suggest", "draft", "execute"];
export const LEVEL_COLORS = { suggest: C.textTertiary, draft: C.gold, execute: C.amber };
export const URGENCY_COLORS = { critical: C.red, high: C.amber, medium: C.blue };

export function getEffectiveLevel(agentId, autonomySettings) {
  const actionTypes = AGENT_ACTION_TYPES[agentId] || ["next_action"];
  if (!autonomySettings) return "suggest";
  let highest = 0;
  for (const at of actionTypes) {
    const level = autonomySettings[at] || "draft";
    const idx = AUTONOMY_LEVELS.indexOf(level);
    if (idx > highest) highest = idx;
  }
  return AUTONOMY_LEVELS[highest];
}

export function getCacheAge(cacheKey) {
  const pre = `bc2-${store._ws}`;
  const raw = localStorage.getItem(`${pre}-${cacheKey}`) || localStorage.getItem(`${pre}-renewals-${cacheKey}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed._generatedAt) return null;
    const mins = Math.floor((Date.now() - parsed._generatedAt) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  } catch { return null; }
}
