// ─── Helpers ──────────────────────────────────────────────────────────────────
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../theme/tokens.js";
import { RANK_LEVELS } from "../theme/constants.js";
import mammoth from "mammoth";

let _idCounter = 0;
export const genId = (prefix) => `${prefix}_${Date.now()}_${_idCounter++}`;
export const isoNow = () => new Date().toISOString();

export function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtRelative(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return fmtDate(iso);
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function similarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const lenA = a.length, lenB = b.length;
  if (lenA === 0 || lenB === 0) return 0;
  const matrix = Array.from({ length: lenA + 1 }, (_, i) => {
    const row = new Array(lenB + 1);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;
  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return 1 - matrix[lenA][lenB] / Math.max(lenA, lenB);
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function healthColor(score) {
  if (score === null || score === undefined) return C.textTertiary;
  if (score > 70) return C.green;
  if (score >= 40) return C.amber;
  return C.red;
}

export function priorityColor(p) {
  return { critical: C.red, high: C.amber, medium: C.blue, low: C.textTertiary }[p] || C.textTertiary;
}

export function statusColor(s) {
  const map = {
    draft: C.textTertiary, analyzing: C.blue, decided: C.gold, implementing: C.amber,
    evaluating: C.blue, closed: C.green,
    open: C.textSecondary, in_progress: C.blue, blocked: C.red, complete: C.green, cancelled: C.textTertiary,
    active: C.green, on_track: C.green, at_risk: C.red, paused: C.amber, achieved: C.gold,
    completed: C.green, archived: C.textTertiary,
  };
  return map[s] || C.textTertiary;
}

export function getRank(xp) {
  let rank = RANK_LEVELS[0];
  for (const level of RANK_LEVELS) {
    if (xp >= level.threshold) rank = level;
  }
  const nextIdx = RANK_LEVELS.indexOf(rank) + 1;
  const next = nextIdx < RANK_LEVELS.length ? RANK_LEVELS[nextIdx] : null;
  const progress = next ? (xp - rank.threshold) / (next.threshold - rank.threshold) : 1;
  return { ...rank, xp, progress, next };
}

export async function extractFileContent(file) {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (ext === ".txt" || ext === ".md" || ext === ".jsx") {
    return await file.text();
  }
  if (ext === ".docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
  return null;
}

// User config — reads from localStorage, falls back to "Commander"
export function getUserName() {
  return localStorage.getItem("bc2-user-name") || "Commander";
}

export function setUserName(name) {
  localStorage.setItem("bc2-user-name", name.trim() || "Commander");
}

// Simple markdown renderer → React elements
export function renderMarkdown(text) {
  if (!text) return null;
  // NOTE: This is imported as a function and uses React inline — see components/Markdown.jsx
  // For now, keep the raw function here, it'll be used by the Markdown component
  return text;
}

export function inlineMarkdown(text) {
  return text;
}
