import { useState, useEffect, useRef } from "react";
import mammoth from "mammoth";
import {
  LayoutDashboard, Inbox, Diamond, CheckSquare, TrendingUp,
  FolderKanban, Users, Library, Settings as SettingsIcon, Sparkles,
  ChevronLeft, ChevronRight, ChevronDown, Search,
  Plus, Copy, Check, X, AlertTriangle,
  ArrowRight, FileText, Zap, Star, Filter,
  Lightbulb, Circle, Grid3X3, Target,
  PlusCircle, ChevronUp, Hash,
} from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
// "Command Indigo" — AI-native design system
// Warm-neutral dark base (not pure black) for accessibility per Smashing Magazine
// Dual accent: Indigo = human actions/authority, Cyan = AI intelligence/data
const C = {
  // Backgrounds — warm-neutral layered depth system
  bgPrimary: "#0F1013",
  bgCard: "#171921",
  bgCardHover: "#1E2029",
  bgSidebar: "#0B0C0F",
  bgAI: "#0F1319",
  bgElevated: "#1E2029",
  bgSurface: "#262830",
  // Borders
  borderDefault: "#262830",
  borderActive: "#6366F1",
  borderSubtle: "#32353D",
  borderAI: "#1E2A4A",
  // Text — high contrast hierarchy (no pure white — prevents halation)
  textPrimary: "#ECEDF0",
  textSecondary: "#9CA3AF",
  textTertiary: "#8B95A5",
  // Primary accent — indigo for human actions, decisions, authority
  gold: "#6366F1",
  goldHover: "#818CF8",
  goldMuted: "rgba(99, 102, 241, 0.14)",
  goldGlow: "rgba(99, 102, 241, 0.06)",
  // AI accent — cyan for AI-generated content, intelligence, data
  aiBlue: "#22D3EE",
  aiBlueMuted: "rgba(34, 211, 238, 0.10)",
  aiBlueGlow: "rgba(34, 211, 238, 0.06)",
  // Status — desaturated for dark mode (avoid oversaturation per Smashing)
  green: "#34D399",
  greenMuted: "rgba(52, 211, 153, 0.12)",
  amber: "#FBBF24",
  amberMuted: "rgba(251, 191, 36, 0.12)",
  red: "#F87171",
  redMuted: "rgba(248, 113, 113, 0.12)",
  blue: "#6366F1",
  blueMuted: "rgba(99, 102, 241, 0.12)",
  // Special
  purple: "#A78BFA",
  purpleMuted: "rgba(167, 139, 250, 0.12)",
};

const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_DISPLAY = "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_SANS = FONT_DISPLAY; // backward compat — explicit FONT_DISPLAY/FONT_BODY preferred

const DECISION_STATUSES = ["draft", "analyzing", "decided", "implementing", "evaluating", "closed"];
const DECISION_STATUS_LABELS = {
  draft: "Draft", analyzing: "Analyzing", decided: "Decided",
  implementing: "Implementing", evaluating: "Evaluating", closed: "Closed"
};
const TASK_STATUSES = ["open", "in_progress", "blocked", "complete", "cancelled"];
const TASK_STATUS_LABELS = { open: "Open", in_progress: "In Progress", blocked: "Blocked", complete: "Complete", cancelled: "Cancelled" };
const TASK_PRIORITIES = ["critical", "high", "medium", "low"];
const PRIORITY_TIMEFRAMES = ["this_week", "this_month", "this_quarter", "this_year"];
const PRIORITY_TIMEFRAME_LABELS = { this_week: "This Week", this_month: "This Month", this_quarter: "This Quarter", this_year: "This Year" };
const PRIORITY_STATUSES = ["active", "on_track", "at_risk", "paused", "achieved"];
const PRIORITY_STATUS_LABELS = { active: "Active", on_track: "On Track", at_risk: "At Risk", paused: "Paused", achieved: "Achieved" };

const PROJECT_STATUSES = ["active", "paused", "completed", "archived"];
const PROJECT_STATUS_LABELS = { active: "Active", paused: "Paused", completed: "Completed", archived: "Archived" };

const XP_ACTIONS = { task_complete: 10, decision_made: 15, document_added: 5, ai_interaction: 3, priority_achieved: 20 };
const RANK_LEVELS = [
  { name: "Rookie", threshold: 0, color: "#64748B", flavor: "You have a desk. Barely." },
  { name: "Operator", threshold: 50, color: "#3A7CA5", flavor: "You know where the buttons are." },
  { name: "Strategist", threshold: 150, color: "#6366F1", flavor: "People pretend to listen now." },
  { name: "Mastermind", threshold: 300, color: "#2D8653", flavor: "You break things on purpose. And it works." },
  { name: "The Architect", threshold: 500, color: "#A855F7", flavor: "They don't schedule meetings with you. You schedule them." },
];

const SUPPORTED_DOC_TYPES = [".txt", ".md", ".docx", ".jsx"];

// ─── User Config ─────────────────────────────────────────────────────────────
// USER_NAME is now configurable via Settings → stored in localStorage
function getUserName() {
  return localStorage.getItem("bc2-user-name") || "Commander";
}

const USER_NAME_GETTER = getUserName;

const DECISION_TEMPLATES = {
  blank: { label: "Blank", context: "" },
  hiring: { label: "Hiring", context: "Role: \nCandidates: \nKey criteria: \nTimeline: \nBudget: " },
  vendor: { label: "Vendor Selection", context: "Business need: \nVendors evaluated: \nBudget: \nTimeline: \nRequirements: " },
  project: { label: "Project Prioritization", context: "Competing projects: \nResources: \nStrategic priorities: \nTimeline: " },
  pivot: { label: "Strategic Pivot", context: "Current state: \nProposed change: \nDriver: \nStakeholders: \nRisks: " },
  budget: { label: "Budget Allocation", context: "Total budget: \nCompeting requests: \nPriorities: \nConstraints: " },
};

// ─── AI Provider Registry ─────────────────────────────────────────────────────
const AI_PROVIDERS = {
  anthropic: {
    label: "Anthropic",
    models: [
      { id: "claude-opus-4-20250514", label: "Claude Opus 4", tier: "premium" },
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", tier: "standard" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", tier: "fast" },
    ],
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-api03-...",
  },
  openai: {
    label: "OpenAI",
    models: [
      { id: "gpt-4.1", label: "GPT-4.1", tier: "premium" },
      { id: "gpt-4o", label: "GPT-4o", tier: "standard" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini", tier: "fast" },
      { id: "o3-mini", label: "o3-mini", tier: "reasoning" },
    ],
    keyPrefix: "sk-",
    keyPlaceholder: "sk-proj-...",
  },
};

function getActiveAIConfig() {
  const configId = localStorage.getItem(`bc2-${store._ws}-ai-active-config`);
  if (!configId) return null;
  const raw = localStorage.getItem(store._key("ai-config", configId));
  return raw ? JSON.parse(raw) : null;
}

function setActiveAIConfig(configId) {
  localStorage.setItem(`bc2-${store._ws}-ai-active-config`, configId);
}

// Resolve the actual API key from localStorage for a given config
function resolveAPIKey(config) {
  if (!config?.keyId) return null;
  const raw = localStorage.getItem(store._key("ai-key", config.keyId));
  if (!raw) return null;
  return JSON.parse(raw).apiKey || null;
}

function getModelLabel(provider, modelId) {
  const p = AI_PROVIDERS[provider];
  if (!p) return modelId;
  const m = p.models.find(m => m.id === modelId);
  return m ? m.label : modelId;
}

// ─── Workspace Management ─────────────────────────────────────────────────────
const GLOBAL_KEYS = ["bc2-workspaces", "bc2-active-workspace", "bc2-user-id", "bc2-meta:schema-version"];
const WS_DEFAULT_ID = "ws_default";

function getWorkspaces() {
  const raw = localStorage.getItem("bc2-workspaces");
  return raw ? JSON.parse(raw) : [];
}

function saveWorkspaces(list) {
  localStorage.setItem("bc2-workspaces", JSON.stringify(list));
}

function getActiveWorkspaceId() {
  return localStorage.getItem("bc2-active-workspace") || WS_DEFAULT_ID;
}

function createWorkspace(name, icon) {
  const ws = {
    id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    icon: icon || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const list = getWorkspaces();
  list.push(ws);
  saveWorkspaces(list);
  return ws;
}

function renameWorkspace(wsId, newName) {
  const list = getWorkspaces();
  const ws = list.find(w => w.id === wsId);
  if (ws) { ws.name = newName.trim(); ws.updatedAt = new Date().toISOString(); }
  saveWorkspaces(list);
}

function deleteWorkspace(wsId) {
  if (wsId === WS_DEFAULT_ID) return; // never delete default
  // Remove all data for this workspace
  const prefix = `bc2-${wsId}-`;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) keys.push(key);
  }
  keys.forEach(k => localStorage.removeItem(k));
  // Remove from workspace list
  const list = getWorkspaces().filter(w => w.id !== wsId);
  saveWorkspaces(list);
  // Switch to default if this was active
  if (getActiveWorkspaceId() === wsId) {
    localStorage.setItem("bc2-active-workspace", WS_DEFAULT_ID);
  }
}

// ─── Storage / Data Access Layer ──────────────────────────────────────────────
function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

const store = {
  _ws: getActiveWorkspaceId(),
  setWorkspace(wsId) { this._ws = wsId; localStorage.setItem("bc2-active-workspace", wsId); },
  _key(entityType, id) { return `bc2-${this._ws}-${entityType}:${id}`; },
  _indexKey(entityType) { return `bc2-${this._ws}-${entityType}:index`; },
  _aiKey(entityType, entityId) { return `bc2-${this._ws}-${entityType}:${entityId}:ai-history`; },
  _linksKey(sourceType, sourceId) { return `bc2-${this._ws}-links:${sourceType}:${sourceId}`; },

  async get(entityType, id) {
    const raw = localStorage.getItem(this._key(entityType, id));
    return safeParse(raw, null);
  },

  async save(entityType, entity) {
    const key = this._key(entityType, entity.id);
    entity.updatedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(entity));
    // update index
    const idxKey = this._indexKey(entityType);
    const raw = localStorage.getItem(idxKey);
    const ids = safeParse(raw, []);
    if (!ids.includes(entity.id)) {
      ids.push(entity.id);
      localStorage.setItem(idxKey, JSON.stringify(ids));
    }
    return entity;
  },

  async delete(entityType, id) {
    localStorage.removeItem(this._key(entityType, id));
    const idxKey = this._indexKey(entityType);
    const raw = localStorage.getItem(idxKey);
    if (raw) {
      const ids = safeParse(raw, []).filter(i => i !== id);
      localStorage.setItem(idxKey, JSON.stringify(ids));
    }
  },

  async list(entityType) {
    const idxKey = this._indexKey(entityType);
    const raw = localStorage.getItem(idxKey);
    if (!raw) return [];
    const ids = safeParse(raw, []);
    const results = [];
    for (const id of ids) {
      const entity = await this.get(entityType, id);
      if (entity) results.push(entity);
    }
    return results;
  },

  async link(sourceType, sourceId, targetType, targetId) {
    // Forward link
    const fwdKey = this._linksKey(sourceType, sourceId);
    const fwdRaw = localStorage.getItem(fwdKey);
    const fwd = safeParse(fwdRaw, []);
    const ref = { type: targetType, id: targetId };
    if (!fwd.some(r => r.type === targetType && r.id === targetId)) {
      fwd.push(ref);
      localStorage.setItem(fwdKey, JSON.stringify(fwd));
    }
    // Reverse link
    const revKey = this._linksKey(targetType, targetId);
    const revRaw = localStorage.getItem(revKey);
    const rev = safeParse(revRaw, []);
    const revRef = { type: sourceType, id: sourceId };
    if (!rev.some(r => r.type === sourceType && r.id === sourceId)) {
      rev.push(revRef);
      localStorage.setItem(revKey, JSON.stringify(rev));
    }
  },

  async getLinks(sourceType, sourceId) {
    const key = this._linksKey(sourceType, sourceId);
    const raw = localStorage.getItem(key);
    return safeParse(raw, []);
  },

  async getAIHistory(entityType, entityId) {
    const key = this._aiKey(entityType, entityId);
    const raw = localStorage.getItem(key);
    return safeParse(raw, []);
  },

  async appendAIHistory(entityType, entityId, interaction) {
    const key = this._aiKey(entityType, entityId);
    const raw = localStorage.getItem(key);
    const history = safeParse(raw, []);
    history.push(interaction);
    const trimmed = history.slice(-50);
    localStorage.setItem(key, JSON.stringify(trimmed));
  },

  async checkAndMigrate() {
    const versionKey = "bc2-meta:schema-version";
    const current = localStorage.getItem(versionKey);

    // Workspace migration: move old bc2-{type}:{id} keys to bc2-ws_default-{type}:{id}
    if (!localStorage.getItem("bc2-workspaces")) {
      const entityTypes = ["decision", "task", "priority", "meeting", "ingest", "document", "project", "links", "digest", "connector", "copilot"];
      const keysToMigrate = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("bc2-")) continue;
        if (GLOBAL_KEYS.includes(key)) continue;
        if (key.startsWith("bc2-ui:")) continue;
        // Skip if already workspace-scoped (contains ws_ after bc2-)
        if (key.match(/^bc2-ws_/)) continue;
        // Check if this is an entity key
        const afterPrefix = key.slice(4); // after "bc2-"
        if (entityTypes.some(t => afterPrefix.startsWith(t + ":") || afterPrefix.startsWith(t + "-"))) {
          keysToMigrate.push(key);
        }
      }
      // Also migrate copilot cache
      const copilotKey = "bc-copilot-dashboard";
      if (localStorage.getItem(copilotKey)) {
        const val = localStorage.getItem(copilotKey);
        localStorage.setItem(`bc2-${WS_DEFAULT_ID}-copilot-dashboard`, val);
        localStorage.removeItem(copilotKey);
      }
      // Migrate entity keys
      for (const key of keysToMigrate) {
        const val = localStorage.getItem(key);
        const newKey = key.replace(/^bc2-/, `bc2-${WS_DEFAULT_ID}-`);
        localStorage.setItem(newKey, val);
        localStorage.removeItem(key);
      }
      // Create default workspace
      const defaultWs = { id: WS_DEFAULT_ID, name: "Default", icon: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      saveWorkspaces([defaultWs]);
      localStorage.setItem("bc2-active-workspace", WS_DEFAULT_ID);
      this._ws = WS_DEFAULT_ID;
    }

    if (current !== "3.0") {
      localStorage.setItem(versionKey, "3.0");
    }
  },

  // Export only the active workspace's data
  exportAll() {
    const prefix = `bc2-${this._ws}-`;
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  },

  // Import data — keys are stored as-is (workspace prefix included)
  importAll(data) {
    for (const [key, val] of Object.entries(data)) {
      if (key.startsWith("bc2-")) {
        localStorage.setItem(key, val);
      }
    }
  },

  // Clear only the active workspace's data
  clearAll() {
    const prefix = `bc2-${this._ws}-`;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
  },
};

// ─── AI Engine ───────────────────────────────────────────────────────────────
const BC_SYSTEM_PROMPT = `You are Base Command (BC), an executive decision intelligence system. You serve as a strategic advisor to leaders, helping them make better decisions, manage priorities, and track execution.

Core principles:
- Be direct. No filler, no preamble. Start with substance.
- Be specific. Reference concrete details. Vague advice is useless.
- Be honest. If risky, say so. If overdue, don't sugarcoat.
- Be actionable. End with something the leader can do next.
- Be concise. Respect the leader's time. Use short paragraphs. Bold key points.

When analyzing decisions: identify the core tension or trade-off, evaluate each option against stated criteria, flag risks and second-order effects, make a recommendation with clear reasoning.

When working with tasks: break complex tasks into specific actionable subtasks, identify dependencies and blockers, suggest delegation opportunities, flag misalignment with stated priorities.

When assessing priorities: evaluate progress based on linked decisions and task completion, identify gaps between stated priorities and actual activity, surface tensions between competing priorities.

Format using markdown. Use **bold** for key points. Use bullet lists sparingly. Keep under 500 words unless complexity demands more.`;

async function callAI(messages, systemOverride, maxTokens, configOverride) {
  const config = configOverride || getActiveAIConfig();
  const provider = config?.provider || "anthropic";
  const model = config?.model || "claude-sonnet-4-20250514";
  const system = systemOverride || BC_SYSTEM_PROMPT;
  const max_tokens = maxTokens || 4000;

  // Resolve API key from localStorage (never leaves the browser)
  const apiKey = resolveAPIKey(config);
  if (!apiKey) {
    throw new Error(`No ${provider === "openai" ? "OpenAI" : "Anthropic"} API key configured. Add one in Settings → AI Configuration.`);
  }

  let data;

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens,
        ...(system ? { system } : {}),
        messages,
      }),
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Anthropic API error (${res.status})`);
  } else if (provider === "openai") {
    const openaiMessages = [];
    if (system) openaiMessages.push({ role: "system", content: system });
    for (const msg of messages) openaiMessages.push({ role: msg.role, content: msg.content });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens, messages: openaiMessages }),
    });
    const raw = await res.json();
    if (!res.ok) throw new Error(raw.error?.message || `OpenAI API error (${res.status})`);

    // Normalize to Anthropic response shape
    const choice = raw.choices?.[0];
    data = {
      content: [{ text: choice?.message?.content || "" }],
      stop_reason: choice?.finish_reason === "stop" ? "end_turn"
        : choice?.finish_reason === "length" ? "max_tokens"
        : choice?.finish_reason || "end_turn",
      model: raw.model,
      usage: { input_tokens: raw.usage?.prompt_tokens || 0, output_tokens: raw.usage?.completion_tokens || 0 },
    };
  } else {
    throw new Error(`Unknown AI provider: ${provider}`);
  }

  const text = data.content?.map(b => b.text || "").join("") || "";
  // Attach stop_reason so callers can detect truncation
  const result = new String(text);
  result.stop_reason = data.stop_reason;
  return result;
}

async function callAIForEntity(entityType, entityId, userPrompt, configOverride) {
  const history = await store.getAIHistory(entityType, entityId);
  const messages = [
    ...history.flatMap(h => [
      { role: "user", content: h.prompt },
      { role: "assistant", content: h.response },
    ]),
    { role: "user", content: userPrompt },
  ];
  const response = await callAI(messages, undefined, undefined, configOverride);
  await store.appendAIHistory(entityType, entityId, {
    prompt: userPrompt,
    response,
    createdAt: new Date().toISOString(),
  });
  return response;
}

const AI_ACTIONS = {
  analyze_decision: {
    label: "Analyze Decision",
    prompt: (e) => `Analyze this decision. Identify the core tension or trade-off. Evaluate each option. Flag risks and second-order effects. Make a recommendation with clear reasoning.\n\nDecision: ${e.title}\nContext: ${e.context || "(none)"}\nOptions: ${JSON.stringify(e.options || [])}`,
    entity: "decision",
  },
  generate_tasks: {
    label: "Generate Tasks",
    prompt: (e) => `Generate 3-7 implementation tasks for this decision. Return ONLY a JSON array with no other text: [{"title":"...","description":"...","priority":"high","dueOffset":7}] where dueOffset is days from today, priority is one of critical/high/medium/low.\n\nDecision: ${e.title}\nOutcome: ${e.outcome || "(not yet set)"}`,
    entity: "decision",
  },
  evaluate_outcome: {
    label: "Evaluate Outcome",
    prompt: (e) => `Evaluate this decision's outcome versus the original analysis and options considered.\n\nDecision: ${e.title}\nOriginal context: ${e.context || "(none)"}\nOutcome: ${e.outcome || "(not yet set)"}`,
    entity: "decision",
  },
  break_down: {
    label: "Break Down Task",
    prompt: (e) => `Break this task into 3-7 specific, actionable subtasks. Return ONLY a JSON array with no other text: [{"title":"..."}]\n\nTask: ${e.title}\nDescription: ${e.description || "(none)"}`,
    entity: "task",
  },
  draft_update: {
    label: "Draft Status Update",
    prompt: (e) => `Draft a concise status update for stakeholders on this task. Professional tone, factual, action-oriented.\n\nTask: ${e.title}\nStatus: ${e.status}\nDescription: ${e.description || "(none)"}`,
    entity: "task",
  },
  identify_blockers: {
    label: "Identify Blockers",
    prompt: (e) => `Analyze this task for dependencies, gaps, friction points, and unblocking strategies.\n\nTask: ${e.title}\nStatus: ${e.status}\nDescription: ${e.description || "(none)"}`,
    entity: "task",
  },
  assess_health: {
    label: "Assess Health",
    prompt: (e) => `Assess the health of this strategic priority. Return ONLY valid JSON with no other text: {"score":75,"assessment":"..."} where score is 0-100.\n\nPriority: ${e.title}\nDescription: ${e.description || "(none)"}\nSuccess Metrics: ${JSON.stringify(e.successMetrics || [])}`,
    entity: "priority",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
let _idCounter = 0;
const genId = (prefix) => `${prefix}_${Date.now()}_${_idCounter++}`;
const isoNow = () => new Date().toISOString();

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtRelative(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return fmtDate(iso);
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date() && true;
}

// Levenshtein-based similarity (0-1) for dedup matching
function similarity(a, b) {
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


function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function healthColor(score) {
  if (score === null || score === undefined) return C.textTertiary;
  if (score > 70) return C.green;
  if (score >= 40) return C.amber;
  return C.red;
}

function priorityColor(p) {
  return { critical: C.red, high: C.amber, medium: C.blue, low: C.textTertiary }[p] || C.textTertiary;
}

function statusColor(s) {
  const map = {
    draft: C.textTertiary, analyzing: C.blue, decided: C.gold, implementing: C.amber,
    evaluating: C.blue, closed: C.green,
    open: C.textSecondary, in_progress: C.blue, blocked: C.red, complete: C.green, cancelled: C.textTertiary,
    active: C.green, on_track: C.green, at_risk: C.red, paused: C.amber, achieved: C.gold,
    completed: C.green, archived: C.textTertiary,
  };
  return map[s] || C.textTertiary;
}

function getRank(xp) {
  let rank = RANK_LEVELS[0];
  for (const level of RANK_LEVELS) {
    if (xp >= level.threshold) rank = level;
  }
  const nextIdx = RANK_LEVELS.indexOf(rank) + 1;
  const next = nextIdx < RANK_LEVELS.length ? RANK_LEVELS[nextIdx] : null;
  const progress = next ? (xp - rank.threshold) / (next.threshold - rank.threshold) : 1;
  return { ...rank, xp, progress, next };
}

async function extractFileContent(file) {
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

// ─── Project Filter (shared across views) ────────────────────────────────────
function useProjectLinks(projects) {
  const [linkMap, setLinkMap] = useState({});
  useEffect(() => {
    if (!projects || projects.length === 0) { setLinkMap({}); return; }
    Promise.all(projects.map(p => store.getLinks("project", p.id).then(links => ({ id: p.id, links })))).then(results => {
      const map = {};
      for (const { id, links } of results) { map[id] = new Set(links.map(l => l.id)); }
      setLinkMap(map);
    });
  }, [projects]);
  return linkMap;
}

function ProjectFilterPills({ projects, filterProject, setFilterProject }) {
  if (!projects || projects.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
      <button onClick={() => setFilterProject(null)} style={{
        padding: "5px 12px", borderRadius: 8, cursor: "pointer",
        border: `1px solid ${filterProject === null ? C.borderSubtle : C.borderDefault}`,
        background: filterProject === null ? "rgba(255,255,255,0.08)" : "transparent",
        color: filterProject === null ? C.textPrimary : C.textSecondary,
        fontFamily: FONT_SANS, fontSize: 12, fontWeight: filterProject === null ? 600 : 400,
        transition: "all 0.15s ease",
      }}>All</button>
      {projects.map(p => (
        <button key={p.id} onClick={() => setFilterProject(filterProject === p.id ? null : p.id)} style={{
          padding: "5px 12px", borderRadius: 8, cursor: "pointer",
          border: `1px solid ${filterProject === p.id ? C.borderSubtle : C.borderDefault}`,
          background: filterProject === p.id ? "rgba(255,255,255,0.08)" : "transparent",
          color: filterProject === p.id ? C.textPrimary : C.textSecondary,
          fontFamily: FONT_SANS, fontSize: 12, fontWeight: filterProject === p.id ? 600 : 400,
          transition: "all 0.15s ease", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{p.title}</button>
      ))}
    </div>
  );
}

function filterByProject(items, filterProject, linkMap) {
  if (!filterProject) return items;
  const ids = linkMap[filterProject];
  if (!ids) return items;
  return items.filter(item => ids.has(item.id));
}

// Simple markdown renderer → React elements
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      elements.push(<br key={key++} />);
      continue;
    }
    // Heading
    if (line.startsWith("### ")) {
      elements.push(<div key={key++} style={{ fontWeight: 600, fontSize: 15, color: C.textPrimary, marginTop: 12, marginBottom: 4, fontFamily: FONT_SANS }}>{inlineMarkdown(line.slice(4))}</div>);
    } else if (line.startsWith("## ")) {
      elements.push(<div key={key++} style={{ fontWeight: 700, fontSize: 15, color: C.textPrimary, marginTop: 14, marginBottom: 4, fontFamily: FONT_SANS }}>{inlineMarkdown(line.slice(3))}</div>);
    } else if (line.startsWith("# ")) {
      elements.push(<div key={key++} style={{ fontWeight: 700, fontSize: 16, color: C.textPrimary, marginTop: 16, marginBottom: 6, fontFamily: FONT_SANS }}>{inlineMarkdown(line.slice(2))}</div>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: 8, marginBottom: 3, fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary }}>
          <span style={{ color: C.gold, flexShrink: 0 }}>•</span>
          <span>{inlineMarkdown(line.slice(2))}</span>
        </div>
      );
    } else {
      elements.push(<div key={key++} style={{ marginBottom: 4, fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>{inlineMarkdown(line)}</div>);
    }
  }
  return elements;
}

function inlineMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: C.textPrimary, fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} style={{ fontFamily: FONT_MONO, fontSize: 12, background: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: 3 }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ─── Reusable Components ──────────────────────────────────────────────────────

function Badge({ label, color, bg }) {
  const c = color || C.textSecondary;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: 6,
      fontSize: 11,
      fontFamily: FONT_MONO,
      fontWeight: 500,
      color: c,
      background: bg || `${c}18`,
      letterSpacing: "0.02em",
      lineHeight: 1,
      border: `1px solid ${c}15`,
    }}>{label}</span>
  );
}

function Btn({ children, onClick, variant = "ghost", disabled, style: extraStyle, size = "md" }) {
  const [hovered, setHovered] = useState(false);
  const base = {
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    borderRadius: 8,
    fontFamily: FONT_SANS,
    fontWeight: 500,
    fontSize: 13,
    opacity: disabled ? 0.4 : 1,
    transition: "all 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    letterSpacing: "-0.01em",
    ...extraStyle,
  };
  const sizes = {
    sm: { padding: "5px 10px", fontSize: 13 },
    md: { padding: "8px 16px", fontSize: 13 },
    lg: { padding: "10px 22px", fontSize: 14 },
  };
  const variants = {
    primary: {
      background: hovered ? C.goldHover : C.gold, color: "#0F1013",
      fontWeight: 600,
      boxShadow: hovered ? `0 0 20px ${C.goldGlow}` : "none",
    },
    ghost: {
      background: hovered ? "rgba(255,255,255,0.06)" : "transparent",
      color: hovered ? C.textPrimary : C.textSecondary,
    },
    danger: {
      background: hovered ? C.redMuted : "transparent",
      color: C.red,
      border: `1px solid ${hovered ? C.red + "40" : "transparent"}`,
    },
    outline: {
      background: hovered ? "rgba(255,255,255,0.04)" : "transparent",
      color: hovered ? C.textPrimary : C.textSecondary,
      border: `1px solid ${hovered ? C.borderSubtle : C.borderDefault}`,
    },
    ai: {
      background: hovered ? C.aiBlueMuted : C.aiBlueGlow,
      color: C.aiBlue,
      border: `1px solid ${hovered ? C.aiBlue + "30" : "transparent"}`,
    },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
    >{children}</button>
  );
}

function Input({ value, onChange, placeholder, multiline, rows = 3, style: extraStyle, onKeyDown }) {
  const base = {
    background: C.bgCard,
    border: `1px solid ${C.borderDefault}`,
    borderRadius: 8,
    color: C.textPrimary,
    fontFamily: FONT_SANS,
    fontSize: 14,
    padding: "10px 14px",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    resize: multiline ? "vertical" : "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    lineHeight: 1.5,
    ...extraStyle,
  };
  const focusStyle = `border-color: ${C.borderSubtle}; box-shadow: 0 0 0 3px ${C.goldGlow};`;
  if (multiline) {
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base} onKeyDown={onKeyDown} onFocus={e => e.target.style.cssText += focusStyle} onBlur={e => { e.target.style.borderColor = C.borderDefault; e.target.style.boxShadow = "none"; }} />;
  }
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} onKeyDown={onKeyDown} onFocus={e => e.target.style.cssText += focusStyle} onBlur={e => { e.target.style.borderColor = C.borderDefault; e.target.style.boxShadow = "none"; }} />;
}

function Select({ value, onChange, options, style: extraStyle }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: C.bgCard,
        border: `1px solid ${C.borderDefault}`,
        borderRadius: 8,
        color: C.textPrimary,
        fontFamily: FONT_SANS,
        fontSize: 14,
        padding: "10px 14px",
        outline: "none",
        cursor: "pointer",
        transition: "border-color 0.15s ease",
        ...extraStyle,
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Modal({ title, onClose, children, width = 580 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(1,4,9,0.80)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C.bgElevated, border: `1px solid ${C.borderSubtle}`, borderRadius: 14,
        width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto",
        padding: 28, position: "relative",
        boxShadow: "0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.02em" }}>{title}</div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "none", color: C.textTertiary, cursor: "pointer",
            fontSize: 14, padding: "4px 8px", borderRadius: 6, transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.color = C.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = C.textTertiary; }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AIConfigPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    store.list("ai-config").then(setConfigs);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (configs.length === 0) return null;

  const active = value ? configs.find(c => c.id === value.id) : (getActiveAIConfig() || null);
  const label = active ? `${getModelLabel(active.provider, active.model)}` : "Default";

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "3px 8px", borderRadius: 4, cursor: "pointer",
          background: "transparent", border: `1px solid ${C.borderDefault}`,
          fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary,
          transition: "all 0.12s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.color = C.textSecondary; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textTertiary; }}
        title="Switch AI model"
      >
        <Sparkles size={8} color={C.aiBlue} />
        {label}
        <span style={{ fontSize: 7, opacity: 0.5 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "100%", right: 0, zIndex: 200,
          background: C.bgElevated, border: `1px solid ${C.borderSubtle}`,
          borderRadius: 6, padding: 3, marginBottom: 4, minWidth: 180,
          boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        }}>
          {/* Workspace default */}
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            style={{
              width: "100%", padding: "6px 8px", borderRadius: 4, cursor: "pointer",
              background: !value && !active ? "rgba(255,255,255,0.08)" : "transparent",
              border: "none", textAlign: "left", fontFamily: FONT_MONO, fontSize: 11,
              color: !value && !active ? C.textPrimary : C.textSecondary,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            onMouseLeave={e => { if (value || active) e.currentTarget.style.background = "transparent"; }}
          >
            Workspace Default
          </button>
          {configs.map(cfg => {
            const isSelected = value ? cfg.id === value.id : (active?.id === cfg.id);
            return (
              <button
                key={cfg.id}
                onClick={() => { onChange(cfg); setOpen(false); }}
                style={{
                  width: "100%", padding: "6px 8px", borderRadius: 4, cursor: "pointer",
                  background: isSelected ? "rgba(255,255,255,0.08)" : "transparent",
                  border: "none", textAlign: "left", display: "flex", flexDirection: "column", gap: 1,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: isSelected ? C.textPrimary : C.textPrimary }}>{cfg.name}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                  {AI_PROVIDERS[cfg.provider]?.label} · {getModelLabel(cfg.provider, cfg.model)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AIPanel({ response, loading, error }) {
  if (!loading && !response && !error) return null;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
      border: `1px solid ${C.borderAI}`,
      borderLeft: `2px solid ${C.aiBlue}40`,
      borderRadius: 10,
      padding: "16px 18px", marginTop: 14,
      position: "relative",
    }}>
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.textTertiary }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: C.aiBlueMuted,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "aiPulse 2s ease-in-out infinite",
          }}>
            <Sparkles size={10} color={C.aiBlue} />
          </div>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary }}>BC is analyzing...</span>
        </div>
      )}
      {error && <div style={{ color: C.red, fontFamily: FONT_BODY, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={14} /> {error}
      </div>}
      {response && !loading && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: C.aiBlueMuted, border: `1px solid ${C.aiBlue}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={10} color={C.aiBlue} />
            </div>
            <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.aiBlue, letterSpacing: "-0.01em" }}>BC Intelligence</span>
          </div>
          <div style={{ color: C.textSecondary }}>{renderMarkdown(response)}</div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 32px", color: C.textTertiary }}>
      {icon && <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.5 }}>{icon}</div>}
      <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: C.textSecondary, marginBottom: 8, letterSpacing: "-0.01em" }}>{title}</div>
      {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 14, marginBottom: 24, lineHeight: 1.6, maxWidth: 400, margin: "0 auto 24px" }}>{sub}</div>}
      {action && <Btn variant="outline" onClick={onAction}>{action}</Btn>}
    </div>
  );
}

function HealthBar({ score }) {
  const color = healthColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${score || 0}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}CC)`, borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color, minWidth: 30, fontWeight: 500 }}>{score !== null && score !== undefined ? `${score}%` : "—"}</span>
    </div>
  );
}

function FormField({ label, children, required }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8, letterSpacing: "-0.01em" }}>
        {label}{required && <span style={{ color: C.gold, marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function WorkspaceSwitcher({ workspaces, activeWsId, onSwitch, onCreate, onRename, onDelete, collapsed }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const ref = useRef(null);

  const activeWs = workspaces.find(w => w.id === activeWsId) || { name: "Default", icon: "" };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (collapsed) {
    return (
      <div style={{ padding: "0 0 8px", display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => setOpen(!open)}
          title={activeWs.name}
          style={{
            width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.borderDefault}`,
            background: C.bgCard, color: C.gold, fontFamily: FONT_SANS, fontSize: 12,
            fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {activeWs.icon || activeWs.name.charAt(0).toUpperCase()}
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ padding: "0 12px 8px", position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "7px 10px", borderRadius: 6, cursor: "pointer",
          background: open ? C.bgCardHover : "transparent",
          border: `1px solid ${open ? C.borderSubtle : "transparent"}`,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = C.bgCardHover; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{
          width: 22, height: 22, borderRadius: 5, background: C.goldMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: C.gold, fontFamily: FONT_SANS, flexShrink: 0,
        }}>
          {activeWs.icon || activeWs.name.charAt(0).toUpperCase()}
        </span>
        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {activeWs.name}
        </span>
        <span style={{ fontSize: 11, color: C.textTertiary, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 12, right: 12, zIndex: 200,
          background: C.bgElevated, border: `1px solid ${C.borderSubtle}`,
          borderRadius: 8, padding: 4, marginTop: 4,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}>
          {workspaces.map(ws => (
            <div key={ws.id}>
              {renamingId === ws.id ? (
                <div style={{ display: "flex", gap: 4, padding: "4px 6px" }}>
                  <input
                    autoFocus
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && renameVal.trim()) { onRename(ws.id, renameVal); setRenamingId(null); }
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    style={{
                      flex: 1, background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                      borderRadius: 4, padding: "4px 8px", color: C.textPrimary,
                      fontFamily: FONT_SANS, fontSize: 12, outline: "none",
                    }}
                  />
                  <button onClick={() => { if (renameVal.trim()) { onRename(ws.id, renameVal); setRenamingId(null); } }}
                    style={{ background: "none", border: "none", color: C.green, cursor: "pointer", fontSize: 12 }}>✓</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => { onSwitch(ws.id); setOpen(false); }}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 8px", borderRadius: 5, cursor: "pointer",
                      background: ws.id === activeWsId ? C.goldMuted : "transparent",
                      border: "none", textAlign: "left", transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { if (ws.id !== activeWsId) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (ws.id !== activeWsId) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{
                      width: 20, height: 20, borderRadius: 4, background: ws.id === activeWsId ? C.gold + "20" : C.bgSurface,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: ws.id === activeWsId ? C.gold : C.textTertiary, fontFamily: FONT_SANS,
                    }}>
                      {ws.icon || ws.name.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: ws.id === activeWsId ? C.textPrimary : C.textSecondary }}>
                      {ws.name}
                    </span>
                    {ws.id === activeWsId && <span style={{ fontSize: 10, color: C.gold, marginLeft: "auto" }}>●</span>}
                  </button>
                  {/* Rename / Delete actions */}
                  <button
                    onClick={() => { setRenamingId(ws.id); setRenameVal(ws.name); }}
                    title="Rename"
                    style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 10, padding: "4px", flexShrink: 0 }}
                  >✎</button>
                  {ws.id !== WS_DEFAULT_ID && (
                    confirmDeleteId === ws.id ? (
                      <button
                        onClick={() => { onDelete(ws.id); setConfirmDeleteId(null); setOpen(false); }}
                        title="Confirm delete"
                        style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 10, padding: "4px", flexShrink: 0 }}
                      >✓</button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(ws.id)}
                        title="Delete workspace"
                        style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 10, padding: "4px", flexShrink: 0 }}
                      >✕</button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Divider */}
          <div style={{ height: 1, background: C.borderDefault, margin: "4px 6px" }} />

          {creating ? (
            <div style={{ padding: "4px 6px" }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Workspace name..."
                onKeyDown={e => {
                  if (e.key === "Enter" && newName.trim()) { onCreate(newName); setNewName(""); setCreating(false); setOpen(false); }
                  if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
                style={{
                  width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                  borderRadius: 4, padding: "6px 8px", color: C.textPrimary,
                  fontFamily: FONT_SANS, fontSize: 12, outline: "none",
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "7px 8px", borderRadius: 5, cursor: "pointer",
                background: "transparent", border: "none", textAlign: "left",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ width: 20, height: 20, borderRadius: 4, background: C.bgSurface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.textTertiary }}>+</span>
              <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textTertiary }}>New Workspace</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Sidebar({ activeView, setView, collapsed, setCollapsed, aiNotifications, workspaces, activeWsId, onSwitchWorkspace, onCreateWorkspace, onRenameWorkspace, onDeleteWorkspace }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const isExpanded = !collapsed;

  const navSections = [
    { label: "Command", items: [
      { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { id: "ingest", icon: Inbox, label: "Ingest" },
    ]},
    { label: "Work", items: [
      { id: "decisions", icon: Diamond, label: "Decisions" },
      { id: "tasks", icon: CheckSquare, label: "Tasks" },
      { id: "priorities", icon: TrendingUp, label: "Priorities" },
      { id: "projects", icon: FolderKanban, label: "Projects" },
    ]},
    { label: "Reference", items: [
      { id: "meetings", icon: Users, label: "Meetings" },
      { id: "library", icon: Library, label: "Library" },
    ]},
  ];

  return (
    <div
      style={{
        width: isExpanded ? 240 : 56,
        minWidth: isExpanded ? 240 : 56,
        background: C.bgSidebar,
        borderRight: `1px solid ${C.borderDefault}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: isExpanded ? "20px 20px 16px" : "20px 0 16px", display: "flex", alignItems: "center", gap: 10, justifyContent: isExpanded ? "space-between" : "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: C.bgSidebar,
            fontFamily: FONT_MONO, flexShrink: 0,
          }}>B</div>
          {isExpanded && (
            <span style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 17, color: C.textPrimary, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
              Base Command
            </span>
          )}
        </div>
        {isExpanded && (
          <button onClick={() => { setCollapsed(true); localStorage.setItem("bc2-ui:sidebar-collapsed", "true"); }} style={{
            background: "rgba(255,255,255,0.04)", border: "none", color: C.textTertiary, cursor: "pointer",
            fontSize: 12, padding: "4px 6px", borderRadius: 6, transition: "all 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
          ><ChevronLeft size={14} /></button>
        )}
      </div>

      {!isExpanded && (
        <button onClick={() => { setCollapsed(false); localStorage.setItem("bc2-ui:sidebar-collapsed", "false"); }} style={{
          background: "none", border: "none", color: C.textTertiary, cursor: "pointer",
          fontSize: 14, padding: "6px 0", marginBottom: 4, width: "100%",
          transition: "color 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = C.textPrimary}
          onMouseLeave={e => e.currentTarget.style.color = C.textTertiary}
        ><ChevronRight size={14} /></button>
      )}

      {/* Workspace switcher */}
      <WorkspaceSwitcher
        workspaces={workspaces}
        activeWsId={activeWsId}
        onSwitch={onSwitchWorkspace}
        onCreate={onCreateWorkspace}
        onRename={onRenameWorkspace}
        onDelete={onDeleteWorkspace}
        collapsed={!isExpanded}
      />

      {/* Nav sections */}
      <nav style={{ flex: 1, padding: "4px 0", overflow: "hidden" }}>
        {navSections.map((section, si) => (
          <div key={si} style={{ marginBottom: 8 }}>
            {isExpanded && (
              <div style={{
                fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, color: C.textTertiary,
                padding: "8px 20px 4px", textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{section.label}</div>
            )}
            {!isExpanded && si > 0 && (
              <div style={{ width: 20, height: 1, background: C.borderDefault, margin: "6px auto" }} />
            )}
            {section.items.map(item => {
              const active = activeView === item.id;
              const isHovered = hoveredItem === item.id;
              const hasNotif = aiNotifications && aiNotifications[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    width: "100%",
                    background: active ? "rgba(255,255,255,0.07)" : isHovered ? "rgba(255,255,255,0.04)" : "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: isExpanded ? "12px 20px" : "12px 0",
                    justifyContent: isExpanded ? "flex-start" : "center",
                    color: active ? C.textPrimary : isHovered ? C.textPrimary : C.textSecondary,
                    borderRight: active ? `2px solid ${C.gold}` : "2px solid transparent",
                    transition: "all 0.12s ease",
                    position: "relative",
                  }}
                >
                  <item.icon size={18} strokeWidth={active ? 2 : 1.75} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
                  {isExpanded && (
                    <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: active ? 600 : 500, whiteSpace: "nowrap", letterSpacing: "0em" }}>{item.label}</span>
                  )}
                  {hasNotif && (
                    <span style={{
                      marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                      background: C.aiBlue, boxShadow: `0 0 8px ${C.aiBlue}60`,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ width: isExpanded ? "85%" : 20, height: 1, background: C.borderDefault, margin: "4px auto 8px" }} />

      {/* Settings */}
      <button
        onClick={() => setView("settings")}
        onMouseEnter={() => setHoveredItem("settings")}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          width: "100%", background: activeView === "settings" ? "rgba(255,255,255,0.07)" : hoveredItem === "settings" ? "rgba(255,255,255,0.04)" : "none",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12, padding: isExpanded ? "12px 20px 20px" : "12px 0 20px",
          justifyContent: isExpanded ? "flex-start" : "center",
          color: activeView === "settings" ? C.textPrimary : hoveredItem === "settings" ? C.textPrimary : C.textSecondary,
          borderRight: activeView === "settings" ? `2px solid ${C.gold}` : "2px solid transparent",
          transition: "all 0.12s ease",
        }}
      >
        <SettingsIcon size={18} strokeWidth={activeView === "settings" ? 2 : 1.75} style={{ flexShrink: 0, opacity: activeView === "settings" ? 1 : 0.75 }} />
        {isExpanded && <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: activeView === "settings" ? 600 : 500, whiteSpace: "nowrap" }}>Settings</span>}
      </button>
    </div>
  );
}

// ─── Command Palette ──────────────────────────────────────────────────────────
function CommandPalette({ onClose, setView, decisions, tasks, priorities }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = query.toLowerCase().trim();
      if (!q) { setResults([]); return; }

      // Action shortcuts
      if (q.startsWith("/")) {
        const actions = [
          { type: "action", label: "Ingest Content", cmd: "/ingest", action: () => { setView("ingest"); onClose(); } },
          { type: "action", label: "Meeting Log", cmd: "/meetings", action: () => { setView("meetings"); onClose(); } },
          { type: "action", label: "New Decision", cmd: "/new decision", action: () => { setView("decisions"); onClose(); } },
          { type: "action", label: "New Task", cmd: "/new task", action: () => { setView("tasks"); onClose(); } },
          { type: "action", label: "Projects", cmd: "/projects", action: () => { setView("projects"); onClose(); } },
          { type: "action", label: "Library", cmd: "/library", action: () => { setView("library"); onClose(); } },
          { type: "action", label: "Weekly Briefing", cmd: "/briefing", action: () => { setView("dashboard"); onClose(); } },
          { type: "action", label: "Export Data", cmd: "/export", action: () => { setView("settings"); onClose(); } },
        ].filter(a => a.cmd.includes(q));
        setResults(actions);
        return;
      }

      const hits = [];
      decisions.forEach(d => {
        if (d.title?.toLowerCase().includes(q) || (d.tags || []).some(t => t.toLowerCase().includes(q))) {
          hits.push({ type: "decision", icon: <Diamond size={13} />, entity: d, action: () => { setView("decisions"); onClose(); } });
        }
      });
      tasks.forEach(t => {
        if (t.title?.toLowerCase().includes(q) || (t.tags || []).some(tag => tag.toLowerCase().includes(q))) {
          hits.push({ type: "task", icon: <CheckSquare size={13} />, entity: t, action: () => { setView("tasks"); onClose(); } });
        }
      });
      priorities.forEach(p => {
        if (p.title?.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q))) {
          hits.push({ type: "priority", icon: <ChevronUp size={13} />, entity: p, action: () => { setView("priorities"); onClose(); } });
        }
      });
      setResults(hits.slice(0, 10));
    }, 200);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(1,4,9,0.80)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 2000,
      display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C.bgElevated, border: `1px solid ${C.borderSubtle}`, borderRadius: 14,
        width: "100%", maxWidth: 580, overflow: "hidden",
        boxShadow: "0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.borderDefault}` }}>
          <span style={{ color: C.textTertiary, fontSize: 16, opacity: 0.6 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or type / for commands..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 400,
              letterSpacing: "-0.01em",
            }}
          />
          <kbd style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.06)" }}>ESC</kbd>
        </div>
        {results.length > 0 && (
          <div style={{ maxHeight: 380, overflow: "auto", padding: "4px 0" }}>
            {results.map((r, i) => (
              <button key={i} onClick={r.action} style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 18px", textAlign: "left",
                transition: "background 0.1s ease",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                {r.type === "action" ? (
                  <>
                    <span style={{ color: C.gold, fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600 }}>/</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textPrimary, fontWeight: 500 }}>{r.label}</span>
                    <span style={{ marginLeft: "auto", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{r.cmd}</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: C.textTertiary, fontSize: 13, opacity: 0.7 }}>{r.icon}</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textPrimary, flex: 1, fontWeight: 450 }}>{r.entity.title}</span>
                    <Badge label={r.entity.status} color={statusColor(r.entity.status)} />
                  </>
                )}
              </button>
            ))}
          </div>
        )}
        {query && results.length === 0 && (
          <div style={{ padding: "24px 18px", fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, textAlign: "center" }}>No results for "{query}"</div>
        )}
        {!query && (
          <div style={{ padding: "14px 18px" }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600, color: C.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Quick actions</div>
            {[
              { cmd: "/new decision", label: "Create a new decision" },
              { cmd: "/new task", label: "Create a new task" },
              { cmd: "/briefing", label: "Get your strategic briefing" },
              { cmd: "/export", label: "Export your data" },
            ].map(item => (
              <div key={item.cmd} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.gold, fontWeight: 500, minWidth: 110 }}>{item.cmd}</span>
                <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Decision Lifecycle Bar ───────────────────────────────────────────────────
function LifecycleBar({ status, onAdvance }) {
  const currentIdx = DECISION_STATUSES.indexOf(status);
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 12, alignItems: "center" }}>
      {DECISION_STATUSES.map((s, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isNext = i === currentIdx + 1;
        return (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => isNext && onAdvance && onAdvance(s)}
              title={DECISION_STATUS_LABELS[s]}
              style={{
                width: "100%",
                height: 4,
                borderRadius: 2,
                border: "none",
                cursor: isNext ? "pointer" : "default",
                background: isCurrent
                  ? `linear-gradient(90deg, ${C.gold}, ${C.goldHover})`
                  : isPast
                    ? `${C.gold}50`
                    : "rgba(255,255,255,0.06)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isCurrent ? `0 0 8px ${C.goldGlow}` : "none",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
export function DashboardView({ decisions, tasks, priorities, projects, onNavigate }) {
  const CACHE_KEY = `bc2-${store._ws}-copilot-dashboard`;
  const [insight, setInsight] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const hasData = tasks.length > 0 || decisions.length > 0 || projects.length > 0;

  // Compute stats for momentum display
  const completedTasks = tasks.filter(t => t.status === "complete");
  const completedThisWeek = completedTasks.filter(t => {
    if (!t.updatedAt) return false;
    const d = new Date(t.updatedAt);
    const now = new Date();
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1); mon.setHours(0,0,0,0);
    return d >= mon;
  });
  const activeTasks = tasks.filter(t => !["complete", "cancelled"].includes(t.status));
  const overdueTasks = activeTasks.filter(t => isOverdue(t.dueDate));
  const openDecisions = decisions.filter(d => ["draft", "analyzing"].includes(d.status));
  const activeProjects = projects.filter(p => p.status !== "complete" && p.status !== "archived");

  async function generateInsights() {
    setLoading(true);
    setError("");
    try {
      const snapshot = {
        tasks: tasks.slice(-30).map(t => ({
          title: t.title, status: t.status, priority: t.priority,
          dueDate: t.dueDate, updatedAt: t.updatedAt,
          subtasks: (t.subtasks || []).length,
          subtasksDone: (t.subtasks || []).filter(s => s.done).length,
        })),
        decisions: decisions.slice(-15).map(d => ({
          title: d.title, status: d.status, createdAt: d.createdAt, updatedAt: d.updatedAt,
        })),
        priorities: priorities.map(p => ({
          title: p.title, status: p.status, healthScore: p.healthScore, timeframe: p.timeframe,
        })),
        projects: projects.slice(-8).map(p => ({
          title: p.title, status: p.status, description: (p.description || "").slice(0, 100),
        })),
        stats: {
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          completedThisWeek: completedThisWeek.length,
          overdueTasks: overdueTasks.length,
          openDecisions: openDecisions.length,
          activeProjects: activeProjects.length,
        },
        today: today.toISOString().split("T")[0],
        dayOfWeek: today.toLocaleDateString("en-US", { weekday: "long" }),
      };

      const prompt = `You are BC, an executive decision intelligence co-pilot. Analyze this user's current state and return a JSON response that powers their dashboard. Be direct, strategic, and personal — like a brilliant chief of staff briefing their executive.

DATA:
${JSON.stringify(snapshot)}

Return ONLY valid JSON (no markdown fences):
{
  "brief": "3-4 sentence strategic read of their situation right now. Notice patterns, connect dots, surface what they might miss. Be direct and specific — reference actual task/decision names. End with one forward-looking insight.",
  "moves": [
    {
      "action": "Specific thing to do (reference actual entity name)",
      "rationale": "Why this matters RIGHT NOW — connect it to other items, deadlines, or strategic impact. 1-2 sentences.",
      "type": "task|decision|priority|project",
      "nav": "tasks|decisions|priorities|projects"
    }
  ],
  "momentum": "1-2 sentence read on their pace and energy. Compare this week to overall progress. Be encouraging if they're doing well, gently challenging if things are stalling. Specific numbers.",
  "projectSpotlights": [
    {
      "title": "Project name",
      "read": "2-3 sentence strategic assessment. What's going well, what's at risk, what's the next critical move. Be specific.",
      "progress": 65,
      "tasksRemaining": 5
    }
  ]
}

RULES:
- "moves" should be 2-3 items, ordered by impact. These are YOUR recommendations, not just a sorted task list. Think strategically — unblocking decisions, addressing risks, maintaining momentum.
- "projectSpotlights" should be 1-2 active projects that need attention. Skip if no projects exist.
- Be specific — use real names from the data. Never be generic.
- If data is sparse, acknowledge it and focus moves on getting started.
- Tone: confident co-pilot, not corporate dashboard. Like a trusted advisor who respects the user's time.`;

      const response = await callAI([{ role: "user", content: prompt }], undefined, 2000);
      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      parsed._generatedAt = Date.now();
      setInsight(parsed);
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate on first load if we have data but no cached insight
  useEffect(() => {
    if (hasData && !insight && !loading) generateInsights();
  }, [hasData]);

  const cachedAgo = insight?._generatedAt
    ? (() => { const m = Math.floor((Date.now() - insight._generatedAt) / 60000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`; })()
    : null;

  // ─── Empty State: Meet Your Co-pilot ───
  if (!hasData) {
    return (
      <div style={{ padding: "80px 40px", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: "0 auto 24px",
          background: `linear-gradient(135deg, ${C.goldMuted}, ${C.aiBlueMuted})`,
          border: `1px solid ${C.gold}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.gold,
        }}><Sparkles size={28} /></div>
        <h1 style={{ fontFamily: FONT_SANS, fontSize: 28, fontWeight: 700, color: C.textPrimary, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
          Your command center is ready
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.textSecondary, lineHeight: 1.7, maxWidth: 460, margin: "0 auto 36px" }}>
          BC is your decision intelligence partner. Create a project or import a plan, and I'll analyze what matters, surface risks, and tell you exactly where to focus.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => onNavigate("projects")} style={{
            padding: "12px 28px", borderRadius: 10, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`, color: C.bgPrimary,
            fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em",
            boxShadow: `0 4px 16px ${C.goldGlow}`,
            transition: "all 0.15s ease",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >Create a Project</button>
          <button onClick={() => onNavigate("projects")} style={{
            padding: "12px 28px", borderRadius: 10, border: `1px solid ${C.borderDefault}`, cursor: "pointer",
            background: "transparent", color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500,
            transition: "all 0.15s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.color = C.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}
          >Import a Plan</button>
        </div>
      </div>
    );
  }

  // ─── Co-pilot Dashboard ───
  return (
    <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em" }}>
            {getGreeting()}, {getUserName()}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 6, fontWeight: 400 }}>{dateStr}</div>
        </div>
        <button onClick={generateInsights} disabled={loading} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10,
          border: `1px solid ${loading ? C.aiBlue + "30" : C.borderDefault}`,
          background: loading ? C.aiBlueMuted : "transparent",
          cursor: loading ? "wait" : "pointer",
          fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: loading ? C.aiBlue : C.textSecondary,
          transition: "all 0.2s ease",
        }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.color = C.textPrimary; } }}
          onMouseLeave={e => { if (!loading) { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; } }}
        >
          <span style={{ color: loading ? C.aiBlue : C.gold, animation: loading ? "aiPulse 2s ease-in-out infinite" : "none", display: "flex", alignItems: "center" }}><Sparkles size={14} /></span>
          {loading ? "Analyzing..." : "Refresh"}
          {cachedAgo && !loading && <span style={{ color: C.textTertiary, fontSize: 12 }}>· {cachedAgo}</span>}
        </button>
      </div>

      {/* ── Momentum Stats — Mission Control instrument panel ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Completed this week", value: completedThisWeek.length, total: activeTasks.length + completedThisWeek.length, color: C.green, icon: <TrendingUp size={11} /> },
          { label: "Overdue", value: overdueTasks.length, total: null, color: overdueTasks.length > 0 ? C.red : C.green, icon: overdueTasks.length > 0 ? <AlertTriangle size={11} /> : <Check size={11} /> },
          { label: "Open decisions", value: openDecisions.length, total: null, color: openDecisions.length > 3 ? C.amber : C.blue, icon: <Diamond size={11} /> },
          { label: "Active projects", value: activeProjects.length, total: null, color: C.gold, icon: <Grid3X3 size={11} /> },
        ].map((stat, i) => (
          <div key={i} style={{
            background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12,
            padding: "18px 16px",
            transition: "border-color 0.15s ease",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.borderSubtle}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.borderDefault}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textTertiary, fontWeight: 500 }}>{stat.label}</span>
              <span style={{ fontSize: 11, color: stat.color, opacity: 0.6 }}>{stat.icon}</span>
            </div>
            <span style={{ fontFamily: FONT_MONO, fontSize: 32, fontWeight: 700, color: stat.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{stat.value}</span>
            {stat.total !== null && stat.total > 0 && (
              <div style={{ marginTop: 10, width: "100%", height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${(stat.value / stat.total) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${stat.color}, ${stat.color}AA)`, borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <div style={{ color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={14} /> {error}
      </div>}

      {/* ── BC Intelligence Brief — AI-native central panel ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
        border: `1px solid ${C.borderAI}`, borderLeft: `2px solid ${C.aiBlue}40`,
        borderRadius: 14, padding: "24px 26px", marginBottom: 28,
        position: "relative", overflow: "hidden",
      }}>
        {/* Subtle ambient glow */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${C.aiBlueGlow} 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, position: "relative" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: C.aiBlueMuted, border: `1px solid ${C.aiBlue}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={12} color={C.aiBlue} />
          </div>
          <div>
            <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>Strategic Brief</span>
          </div>
          {cachedAgo && <span style={{ marginLeft: "auto", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{cachedAgo}</span>}
        </div>

        {loading && !insight ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.aiBlue, animation: "aiPulse 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Analyzing your tasks, decisions, and projects...</span>
          </div>
        ) : insight?.brief ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.8, letterSpacing: "-0.005em" }}>
            {insight.brief}
          </div>
        ) : (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, lineHeight: 1.7 }}>
            Click "Refresh" to get BC's strategic assessment of your current situation.
          </div>
        )}

        {/* Momentum narrative */}
        {insight?.momentum && (
          <div style={{
            marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.borderDefault}`,
            fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.7,
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <TrendingUp size={12} style={{ color: C.gold, marginTop: 2, flexShrink: 0 }} />
            <span>{insight.momentum}</span>
          </div>
        )}
      </div>

      {/* ── Recommended Moves — AI-suggested actions ── */}
      {insight?.moves && insight.moves.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>Recommended moves</span>
            <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insight.moves.map((move, i) => (
              <div key={i}
                onClick={() => move.nav && onNavigate(move.nav)}
                style={{
                  background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12,
                  padding: "16px 20px", cursor: move.nav ? "pointer" : "default",
                  display: "flex", gap: 16, alignItems: "flex-start",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold + "40"; e.currentTarget.style.background = C.bgCardHover; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.background = C.bgCard; }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: C.goldMuted, border: `1px solid ${C.gold}20`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: C.gold,
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, marginBottom: 4, letterSpacing: "-0.01em" }}>
                    {move.action}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>
                    {move.rationale}
                  </div>
                </div>
                {move.nav && (
                  <ArrowRight size={16} style={{ color: C.textTertiary, flexShrink: 0, marginTop: 2, opacity: 0.5 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Project Spotlights ── */}
      {insight?.projectSpotlights && insight.projectSpotlights.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>Project spotlight</span>
            <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: insight.projectSpotlights.length === 1 ? "1fr" : "1fr 1fr", gap: 12 }}>
            {insight.projectSpotlights.map((proj, i) => (
              <div key={i}
                onClick={() => onNavigate("projects")}
                style={{
                  background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12,
                  padding: "20px 22px", cursor: "pointer", transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>{proj.title}</span>
                  {proj.progress !== undefined && (
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, color: proj.progress >= 75 ? C.green : proj.progress >= 40 ? C.gold : C.textTertiary }}>{proj.progress}%</span>
                  )}
                </div>
                {proj.progress !== undefined && (
                  <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ width: `${proj.progress}%`, height: "100%", background: `linear-gradient(90deg, ${proj.progress >= 75 ? C.green : proj.progress >= 40 ? C.gold : C.blue}, ${proj.progress >= 75 ? C.green : proj.progress >= 40 ? C.gold : C.blue}AA)`, borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                  </div>
                )}
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.7 }}>
                  {proj.read}
                </div>
                {proj.tasksRemaining !== undefined && (
                  <div style={{ marginTop: 12, fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                    {proj.tasksRemaining} task{proj.tasksRemaining !== 1 ? "s" : ""} remaining
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading overlay for refresh ── */}
      {loading && insight && (
        <div style={{
          textAlign: "center", padding: "16px 0",
          fontFamily: FONT_BODY, fontSize: 13, color: C.aiBlue,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.aiBlue, animation: "aiPulse 2s ease-in-out infinite" }} />
          BC is refreshing your intelligence...
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children, onViewAll, action }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>{title}</span>
          {count !== undefined && <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary, fontWeight: 500 }}>{count}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {action}
          {onViewAll && <Btn variant="ghost" size="sm" onClick={onViewAll}>View all →</Btn>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Decisions View ───────────────────────────────────────────────────────────
export function DecisionsView({ decisions, setDecisions, tasks, setTasks, priorities, projects, ingestSessions, setView, setFocusSessionId }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filterProject, setFilterProject] = useState(null);
  const [filterSource, setFilterSource] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const linkMap = useProjectLinks(projects);

  const projectFiltered = filterByProject(decisions, filterProject, linkMap);
  const sourceFiltered = filterSource
    ? projectFiltered.filter(d => (d.source || "manual") === filterSource)
    : projectFiltered;
  const statusFiltered = sourceFiltered.filter(d => filterStatus === "all" || d.status === filterStatus);
  const filtered = sortBy === "newest"
    ? [...statusFiltered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : sortBy === "oldest"
    ? [...statusFiltered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : statusFiltered;

  async function createDecision(data) {
    const d = {
      id: genId("dec"),
      ...data,
      status: "draft",
      options: data.options || [],
      linkedTasks: [],
      linkedPriorities: [],
      tags: [],
      source: data.source || "manual",
      createdAt: isoNow(),
      updatedAt: isoNow(),
    };
    await store.save("decision", d);
    setDecisions(prev => [...prev, d]);
    setShowForm(false);
  }

  async function updateDecision(id, updates) {
    const existing = decisions.find(d => d.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await store.save("decision", updated);
    setDecisions(prev => prev.map(d => d.id === id ? updated : d));
  }

  async function deleteDecision(id) {
    await store.delete("decision", id);
    setDecisions(prev => prev.filter(d => d.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  async function advanceStatus(decision, newStatus) {
    await updateDecision(decision.id, { status: newStatus });
    // Trigger AI for status transitions
    if (newStatus === "analyzing") {
      // handled in expanded card
    }
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em" }}>Decisions</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, marginTop: 4 }}>{decisions.length} total</div>
        </div>
        <Btn variant="primary" onClick={() => setShowForm(true)}>＋ New Decision</Btn>
      </div>

      {/* Project filter */}
      <ProjectFilterPills projects={projects} filterProject={filterProject} setFilterProject={setFilterProject} />

      {/* Status filter bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {["all", ...DECISION_STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            background: filterStatus === s ? "rgba(255,255,255,0.08)" : "transparent",
            border: `1px solid ${filterStatus === s ? C.borderSubtle : C.borderDefault}`,
            borderRadius: 8, color: filterStatus === s ? C.textPrimary : C.textSecondary,
            fontFamily: FONT_SANS, fontSize: 13, fontWeight: filterStatus === s ? 600 : 400, padding: "5px 12px", cursor: "pointer",
            transition: "all 0.15s ease",
          }}>
            {s === "all" ? "All" : DECISION_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Source filter + sort */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary, fontWeight: 500, marginRight: 2 }}>Source:</span>
          {[
            [null, "All"],
            ["ingest", "Ingest"],
            ["project", "Project"],
            ["manual", "Manual"],
          ].map(([val, lbl]) => (
            <button key={lbl} onClick={() => setFilterSource(val)} style={{
              padding: "4px 10px", borderRadius: 6, cursor: "pointer",
              border: `1px solid ${filterSource === val ? C.borderSubtle : C.borderDefault}`,
              background: filterSource === val ? "rgba(255,255,255,0.08)" : "transparent",
              color: filterSource === val ? C.textPrimary : C.textSecondary,
              fontSize: 13, fontFamily: FONT_SANS, fontWeight: filterSource === val ? 600 : 400,
              transition: "all 0.15s ease",
            }}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[["default", "Default"], ["newest", "Newest"], ["oldest", "Oldest"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setSortBy(val)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: sortBy === val ? "rgba(255,255,255,0.08)" : "transparent",
              color: sortBy === val ? C.textPrimary : C.textSecondary,
              fontSize: 13, fontFamily: FONT_SANS, fontWeight: sortBy === val ? 500 : 400,
              transition: "all 0.15s ease",
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Decision cards */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Diamond size={36} />} title="No decisions yet" sub="Start by creating your first decision to track." action="＋ New Decision" onAction={() => setShowForm(true)} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {filtered.map(d => (
            <DecisionCard
              key={d.id}
              decision={d}
              expanded={expandedId === d.id}
              onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
              onUpdate={(updates) => updateDecision(d.id, updates)}
              onDelete={() => deleteDecision(d.id)}
              onAdvanceStatus={(newStatus) => advanceStatus(d, newStatus)}
              tasks={tasks}
              setTasks={setTasks}
              setDecisions={setDecisions}
              priorities={priorities}
              ingestSessions={ingestSessions}
              onNavigateToIngest={(sessionId) => { setFocusSessionId(sessionId); setView("ingest"); }}
            />
          ))}
        </div>
      )}

      {showForm && (
        <DecisionFormModal onClose={() => setShowForm(false)} onCreate={createDecision} />
      )}
    </div>
  );
}

function DecisionCard({ decision, expanded, onToggle, onUpdate, onDelete, onAdvanceStatus, tasks, setTasks, setDecisions, priorities, ingestSessions, onNavigateToIngest }) {
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: decision.title, context: decision.context || "", outcome: decision.outcome || "", rationale: decision.rationale || "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [aiConfigOverride, setAiConfigOverride] = useState(null);
  const [bcAdvice, setBcAdvice] = useState(decision._bcAdvice || null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  const linkedTasks = tasks.filter(t => t.sourceDecisionId === decision.id);
  const currentIdx = DECISION_STATUSES.indexOf(decision.status);
  const age = Math.floor((Date.now() - new Date(decision.createdAt).getTime()) / 86400000);
  const sourceSession = decision.ingestSessionId && ingestSessions ? ingestSessions.find(s => s.id === decision.ingestSessionId) : null;

  async function askBC() {
    const q = customPrompt.trim();
    if (!q || aiLoading) return;
    setCustomPrompt("");
    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    try {
      const ctx = `Decision: ${decision.title}\nStatus: ${decision.status}\nContext: ${decision.context || "none"}\nOutcome: ${decision.outcome || "none"}\nRationale: ${decision.rationale || "none"}`;
      const response = await callAIForEntity("decision", decision.id, `${ctx}\n\nQuestion: ${q}`, aiConfigOverride);
      setAiResponse(response);
    } catch (err) { setAiError(err.message); }
    finally { setAiLoading(false); }
  }

  async function getBCAdvice() {
    setAdviceLoading(true);
    try {
      const ctx = {
        title: decision.title,
        status: decision.status,
        context: decision.context || "",
        outcome: decision.outcome || "",
        rationale: decision.rationale || "",
        options: decision.options || [],
        age,
        linkedTasks: linkedTasks.map(t => ({ title: t.title, status: t.status })),
      };
      const prompt = `You are BC, an executive decision co-pilot. Analyze this decision and return ONLY valid JSON (no markdown fences):
{
  "situation": "1-2 sentence strategic read — what's really at stake here and where this decision stands right now.",
  "recommendation": "Your direct recommendation — what to do and why. Be specific and opinionated. 2-3 sentences.",
  "nextStep": "The single most important next action to move this forward. One sentence.",
  "risks": ["1-2 key risks or blind spots to watch"],
  "confidence": "high|medium|low"
}

Decision data: ${JSON.stringify(ctx)}

RULES:
- Be direct and specific. Reference actual details from the decision.
- Your recommendation should be opinionated — take a stance.
- If context is sparse, say so and recommend gathering specific information.
- Tone: trusted advisor, not corporate consultant.`;
      const response = await callAI([{ role: "user", content: prompt }], undefined, 1000);
      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      setBcAdvice(parsed);
      await onUpdate({ _bcAdvice: parsed });
    } catch (err) { setAiError(err.message); }
    finally { setAdviceLoading(false); }
  }

  async function runAIAction(actionKey) {
    const action = AI_ACTIONS[actionKey];
    if (!action) return;
    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    try {
      const prompt = action.prompt(decision);
      const response = await callAIForEntity("decision", decision.id, prompt);
      if (actionKey === "generate_tasks") {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const taskDefs = JSON.parse(jsonMatch[0]);
            const now = new Date();
            for (const td of taskDefs) {
              const dueDate = td.dueOffset ? new Date(now.getTime() + td.dueOffset * 86400000).toISOString().split("T")[0] : null;
              const newTask = {
                id: genId("task"), title: td.title, description: td.description || "",
                status: "open", priority: td.priority || "medium", dueDate,
                sourceDecisionId: decision.id, source: "decision",
                linkedPriorities: [], subtasks: [], tags: [],
                createdAt: isoNow(), updatedAt: isoNow(),
              };
              await store.save("task", newTask);
              await store.link("task", newTask.id, "decision", decision.id);
              setTasks(prev => [...prev, newTask]);
            }
          } catch (_) { /* task JSON parse failed — skip silently */ }
        }
        setAiResponse(`Created ${(response.match(/\[[\s\S]*\]/) ? JSON.parse(response.match(/\[[\s\S]*\]/)[0]).length : 0)} tasks from this decision.`);
      } else {
        setAiResponse(response);
      }
    } catch (err) { setAiError(err.message); }
    finally { setAiLoading(false); }
  }

  async function saveEdit() {
    await onUpdate(editData);
    setEditing(false);
  }

  const confidenceColor = { high: C.green, medium: C.amber, low: C.red };

  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${expanded ? C.gold + "30" : C.borderDefault}`,
      borderRadius: 12, overflow: "hidden", transition: "all 0.15s ease",
    }}>
      {/* ── Header ── */}
      <div onClick={onToggle} onMouseEnter={() => setHeaderHovered(true)} onMouseLeave={() => setHeaderHovered(false)}
        style={{ padding: "16px 18px 12px", cursor: "pointer", background: headerHovered ? C.bgCardHover : "transparent", transition: "background 0.12s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.45, flex: 1, letterSpacing: "-0.01em" }}>
            {decision.title}
          </div>
          <span style={{ fontSize: 11, color: headerHovered ? C.gold : C.textTertiary, flexShrink: 0, transition: "color 0.12s" }}>
            {expanded ? "▴" : "▾"}
          </span>
        </div>
        {decision.context && !expanded && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.5, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {decision.context}
          </div>
        )}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <Badge label={DECISION_STATUS_LABELS[decision.status]} color={statusColor(decision.status)} />
          {age > 5 && decision.status === "draft" && <Badge label={`${age}d in draft`} color={C.amber} />}
          {linkedTasks.length > 0 && <Badge label={`${linkedTasks.length} task${linkedTasks.length !== 1 ? "s" : ""}`} />}
          {decision.source && decision.source !== "manual" && (
            sourceSession && onNavigateToIngest ? (
              <span onClick={e => { e.stopPropagation(); onNavigateToIngest(sourceSession.id); }} style={{ cursor: "pointer" }} title="View source ingest session">
                <Badge label="⊕ ingest" color={C.amber} />
              </span>
            ) : (
              <Badge label={decision.source} color={decision.source === "ingest" ? C.amber : C.blue} />
            )
          )}
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto" }}>{fmtRelative(decision.createdAt)}</span>
        </div>
      </div>

      {/* ── Expanded ── */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}` }} onClick={e => e.stopPropagation()}>
          {/* Status pipeline — clickable stages */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
            <div style={{ display: "flex", gap: 4 }}>
              {DECISION_STATUSES.map((s, i) => {
                const isPast = i < currentIdx;
                const isCurrent = i === currentIdx;
                const isNext = i === currentIdx + 1;
                return (
                  <button key={s} onClick={() => isNext ? onAdvanceStatus(s) : isPast ? onAdvanceStatus(s) : null}
                    style={{
                      flex: 1, padding: "6px 4px", borderRadius: 6, border: "none",
                      background: isCurrent ? `${C.gold}25` : isPast ? `${C.gold}10` : "rgba(255,255,255,0.03)",
                      cursor: isNext || isPast ? "pointer" : "default",
                      fontFamily: FONT_MONO, fontSize: 11, fontWeight: isCurrent ? 700 : 400,
                      color: isCurrent ? C.gold : isPast ? C.gold + "90" : C.textTertiary,
                      textTransform: "uppercase", letterSpacing: "0.04em",
                      transition: "all 0.15s",
                    }}>
                    {DECISION_STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BC's Advice Panel */}
          <div style={{ padding: "14px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
            {bcAdvice ? (
              <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.borderAI}`, borderLeft: `2px solid ${C.aiBlue}40`, borderRadius: 10, padding: "14px 16px", position: "relative" }}>
                <div style={{ position: "absolute", top: 10, right: 12, display: "flex", alignItems: "center", gap: 4, fontFamily: FONT_SANS, fontSize: 11, color: C.aiBlue, opacity: 0.6, fontWeight: 600 }}>
                  <Sparkles size={8} /> BC
                </div>
                {/* Situation */}
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.7, marginBottom: 12 }}>
                  {bcAdvice.situation}
                </div>
                {/* Recommendation */}
                <div style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}20`, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontWeight: 700 }}>Recommendation</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>{bcAdvice.recommendation}</div>
                </div>
                {/* Next step */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                  <ArrowRight size={11} style={{ color: C.gold, flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                    <strong style={{ color: C.textPrimary }}>Next:</strong> {bcAdvice.nextStep}
                  </span>
                </div>
                {/* Risks */}
                {bcAdvice.risks && bcAdvice.risks.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                    {bcAdvice.risks.map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <AlertTriangle size={10} style={{ color: C.amber, marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, lineHeight: 1.4 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Confidence + refresh */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {bcAdvice.confidence && (
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: confidenceColor[bcAdvice.confidence] || C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {bcAdvice.confidence} confidence
                    </span>
                  )}
                  <button onClick={getBCAdvice} disabled={adviceLoading} style={{
                    background: "none", border: "none", cursor: adviceLoading ? "wait" : "pointer", padding: 0,
                    fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary,
                  }}>{adviceLoading ? "thinking..." : "↺ refresh"}</button>
                </div>
              </div>
            ) : (
              <button onClick={getBCAdvice} disabled={adviceLoading} style={{
                width: "100%", padding: "14px 16px", borderRadius: 10, border: `1px dashed ${C.gold}40`,
                background: `${C.gold}06`, cursor: adviceLoading ? "wait" : "pointer",
                fontFamily: FONT_MONO, fontSize: 12, color: C.gold, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
              }}>
                <Sparkles size={12} /> {adviceLoading ? "BC is analyzing..." : "Help me decide"}
              </button>
            )}
          </div>

          {/* Context & Outcome */}
          {editing ? (
            <div style={{ padding: "14px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <FormField label="Title">
                <Input value={editData.title} onChange={v => setEditData(p => ({ ...p, title: v }))} />
              </FormField>
              <FormField label="Context">
                <Input multiline rows={3} value={editData.context} onChange={v => setEditData(p => ({ ...p, context: v }))} />
              </FormField>
              <FormField label="Outcome">
                <Input multiline rows={2} value={editData.outcome} onChange={v => setEditData(p => ({ ...p, outcome: v }))} />
              </FormField>
              <FormField label="Rationale">
                <Input multiline rows={2} value={editData.rationale} onChange={v => setEditData(p => ({ ...p, rationale: v }))} />
              </FormField>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <Btn variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Btn>
                <Btn variant="primary" size="sm" onClick={saveEdit}>Save</Btn>
              </div>
            </div>
          ) : (
            <div style={{ padding: "14px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              {decision.context && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Context</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{decision.context}</div>
                </div>
              )}
              {decision.outcome && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Outcome</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.green, lineHeight: 1.6 }}>{decision.outcome}</div>
                </div>
              )}
              {decision.rationale && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Rationale</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{decision.rationale}</div>
                </div>
              )}
              {!decision.context && !decision.outcome && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, fontStyle: "italic" }}>No context added yet — edit to add details.</div>
              )}
            </div>
          )}

          {/* Source ingest provenance */}
          {sourceSession && onNavigateToIngest && (
            <div style={{ padding: "10px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Source</div>
              <button
                onClick={() => onNavigateToIngest(sourceSession.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  background: `${C.amber}08`, border: `1px solid ${C.amber}20`, borderRadius: 8,
                  padding: "8px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.amber}14`; e.currentTarget.style.borderColor = `${C.amber}40`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${C.amber}08`; e.currentTarget.style.borderColor = `${C.amber}20`; }}
              >
                <PlusCircle size={14} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.amber, marginBottom: 2 }}>
                    {sourceSession.mode === "meeting" ? `Meeting: ${sourceSession.meetingTitle || "Untitled"}` : sourceSession.mode === "respond_to" ? "Response Draft" : "Ingest Session"}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                    {fmtRelative(sourceSession.createdAt)} · {(sourceSession.rawContent || "").slice(0, 80).trim()}{(sourceSession.rawContent || "").length > 80 ? "…" : ""}
                  </div>
                </div>
                <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.amber, flexShrink: 0 }}>View →</span>
              </button>
            </div>
          )}

          {/* Linked tasks */}
          {linkedTasks.length > 0 && (
            <div style={{ padding: "10px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Linked Tasks ({linkedTasks.length})
              </div>
              {linkedTasks.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                  <span style={{ color: priorityColor(t.priority), fontSize: 8 }}>●</span>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textSecondary, flex: 1 }}>{t.title}</span>
                  <Badge label={TASK_STATUS_LABELS[t.status] || t.status} color={statusColor(t.status)} />
                </div>
              ))}
            </div>
          )}

          {/* Action bar + Ask BC */}
          <div style={{ padding: "12px 16px" }}>
            {/* Actions row */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Btn>
              {decision.status === "decided" && (
                <Btn variant="ghost" size="sm" onClick={() => runAIAction("generate_tasks")}><Sparkles size={12} style={{ display: "inline" }} /> Generate Tasks</Btn>
              )}
              {["implementing", "evaluating"].includes(decision.status) && (
                <Btn variant="ghost" size="sm" onClick={() => runAIAction("evaluate_outcome")}><Sparkles size={12} style={{ display: "inline" }} /> Evaluate</Btn>
              )}
              {confirmDelete ? (
                <>
                  <Btn variant="danger" size="sm" onClick={onDelete}>Confirm</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn>
                </>
              ) : (
                <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>Delete</Btn>
              )}
            </div>

            {/* Ask BC */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: aiResponse || aiLoading || aiError ? 10 : 0 }}>
              <input
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && askBC()}
                placeholder="Ask BC about this decision..."
                disabled={aiLoading}
                style={{
                  flex: 1, background: C.bgAI, border: `1px solid ${C.borderAI}`,
                  borderRadius: 6, padding: "7px 12px", color: C.textPrimary,
                  fontFamily: FONT_SANS, fontSize: 12, outline: "none",
                }}
              />
              <AIConfigPicker value={aiConfigOverride} onChange={setAiConfigOverride} />
              <button onClick={askBC} disabled={!customPrompt.trim() || aiLoading} style={{
                background: customPrompt.trim() && !aiLoading ? C.gold : "transparent",
                border: `1px solid ${customPrompt.trim() && !aiLoading ? C.gold : C.borderAI}`,
                borderRadius: 6, padding: "7px 14px",
                cursor: customPrompt.trim() && !aiLoading ? "pointer" : "not-allowed",
                color: customPrompt.trim() && !aiLoading ? C.bgPrimary : C.textTertiary,
                fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
              }}><Sparkles size={12} /></button>
            </div>
            <AIPanel response={aiResponse} loading={aiLoading} error={aiError} />
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionFormModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [template, setTemplate] = useState("blank");
  const [options, setOptions] = useState("");

  function handleTemplateChange(t) {
    setTemplate(t);
    setContext(DECISION_TEMPLATES[t]?.context || "");
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    await onCreate({
      title: title.trim(),
      context,
      templateType: template,
      options: options.split("\n").map(s => s.trim()).filter(Boolean),
    });
  }

  return (
    <Modal title="New Decision" onClose={onClose} width={560}>
      <FormField label="Template">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(DECISION_TEMPLATES).map(([key, t]) => (
            <button key={key} onClick={() => handleTemplateChange(key)} style={{
              padding: "4px 10px", borderRadius: 6, border: `1px solid ${template === key ? C.borderSubtle : C.borderDefault}`,
              background: template === key ? "rgba(255,255,255,0.08)" : "transparent",
              color: template === key ? C.textPrimary : C.textSecondary,
              fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>
      </FormField>
      <FormField label="Title" required>
        <Input value={title} onChange={setTitle} placeholder="What decision needs to be made?" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
      </FormField>
      <FormField label="Context">
        <Input multiline rows={5} value={context} onChange={setContext} placeholder="Background, constraints, criteria..." />
      </FormField>
      <FormField label="Options (one per line)">
        <Input multiline rows={3} value={options} onChange={setOptions} placeholder="Option A&#10;Option B&#10;Option C" />
      </FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={!title.trim()}>Create Decision</Btn>
      </div>
    </Modal>
  );
}

// ─── Tasks View ───────────────────────────────────────────────────────────────
export function TasksView({ tasks, setTasks, decisions, projects, ingestSessions }) {
  const [groupBy, setGroupBy] = useState("status");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState(null);
  const [sortBy, setSortBy] = useState("newest"); // "default" | "newest" | "oldest"
  const [filterSource, setFilterSource] = useState(null); // null | "ingest" | "project" | "decision" | "manual"
  const linkMap = useProjectLinks(projects);

  async function createTask(data) {
    const t = { id: genId("task"), ...data, source: data.source || "manual", subtasks: [], tags: [], createdAt: isoNow(), updatedAt: isoNow() };
    await store.save("task", t);
    if (data.sourceDecisionId) await store.link("task", t.id, "decision", data.sourceDecisionId);
    setTasks(prev => [...prev, t]);
    setShowForm(false);
  }
  async function updateTask(id, updates) {
    const existing = tasks.find(t => t.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates, updatedAt: isoNow() };
    await store.save("task", updated);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  }
  async function deleteTask(id) {
    await store.delete("task", id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  // Filter by project, source, then search
  const projectFiltered = filterByProject(tasks, filterProject, linkMap);
  const sourceFiltered = filterSource
    ? projectFiltered.filter(t => (t.source || "manual") === filterSource)
    : projectFiltered;
  const searchFiltered = searchTerm
    ? sourceFiltered.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.description || "").toLowerCase().includes(searchTerm.toLowerCase()))
    : sourceFiltered;
  const filtered = sortBy === "newest"
    ? [...searchFiltered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : sortBy === "oldest"
    ? [...searchFiltered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : searchFiltered;

  // Grouping
  function getGroups() {
    if (groupBy === "status") {
      return TASK_STATUSES.map(s => ({ key: s, label: TASK_STATUS_LABELS[s], color: statusColor(s), items: filtered.filter(t => t.status === s) })).filter(g => g.items.length > 0);
    }
    if (groupBy === "priority") {
      return TASK_PRIORITIES.map(p => ({ key: p, label: p.charAt(0).toUpperCase() + p.slice(1), color: priorityColor(p), items: filtered.filter(t => t.priority === p) })).filter(g => g.items.length > 0);
    }
    if (groupBy === "source") {
      const withSource = decisions.map(d => ({ key: d.id, label: d.title, color: C.blue, items: filtered.filter(t => t.sourceDecisionId === d.id) })).filter(g => g.items.length > 0);
      const noSource = { key: "none", label: "No linked decision", color: C.textTertiary, items: filtered.filter(t => !t.sourceDecisionId) };
      return [...withSource, ...(noSource.items.length > 0 ? [noSource] : [])];
    }
    return [];
  }
  const groups = getGroups();
  const completedCount = tasks.filter(t => t.status === "complete").length;

  // Build ingest session lookup
  const sessionMap = {};
  for (const s of (ingestSessions || [])) sessionMap[s.id] = s;

  // Given a list of tasks, split into renderable items: individual tasks and ingest batches
  function buildRenderItems(items) {
    const renderItems = [];
    const batchMap = {};
    const seen = new Set();
    for (const t of items) {
      if (t.ingestSessionId) {
        if (!batchMap[t.ingestSessionId]) batchMap[t.ingestSessionId] = [];
        batchMap[t.ingestSessionId].push(t);
      }
    }
    for (const t of items) {
      if (t.ingestSessionId && batchMap[t.ingestSessionId] && batchMap[t.ingestSessionId].length > 1) {
        if (!seen.has(t.ingestSessionId)) {
          seen.add(t.ingestSessionId);
          renderItems.push({ type: "batch", sessionId: t.ingestSessionId, tasks: batchMap[t.ingestSessionId] });
        }
      } else {
        renderItems.push({ type: "task", task: t });
      }
    }
    return renderItems;
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.textPrimary, margin: 0, fontFamily: FONT_SANS, letterSpacing: "-0.03em" }}>Tasks</h1>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, marginTop: 4, display: "block" }}>{completedCount}/{tasks.length} completed</span>
        </div>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%`, height: "100%", background: completedCount === tasks.length ? C.green : `linear-gradient(90deg, ${C.blue}, ${C.gold})`, borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.textTertiary, fontSize: 14, opacity: 0.5 }}>⌕</span>
        <input
          type="text" placeholder="Search tasks..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px 14px 10px 36px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, color: C.textPrimary, fontSize: 14, fontFamily: FONT_SANS, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s ease" }}
          onFocus={e => (e.target.style.borderColor = C.borderSubtle)} onBlur={e => (e.target.style.borderColor = C.borderDefault)}
        />
      </div>

      {/* Project filter */}
      <ProjectFilterPills projects={projects} filterProject={filterProject} setFilterProject={setFilterProject} />

      {/* Source filter */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary, fontWeight: 500, alignSelf: "center", marginRight: 2 }}>Source:</span>
        {[
          [null, "All"],
          ["ingest", "Ingest"],
          ["project", "Project"],
          ["decision", "Decision"],
          ["manual", "Manual"],
        ].map(([val, lbl]) => (
          <button key={lbl} onClick={() => setFilterSource(val)} style={{
            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            border: `1px solid ${filterSource === val ? C.blue + "40" : "transparent"}`,
            background: filterSource === val ? C.blueMuted : "transparent",
            color: filterSource === val ? C.blue : C.textTertiary,
            fontSize: 12, fontFamily: FONT_SANS, fontWeight: filterSource === val ? 600 : 400,
            transition: "all 0.15s ease",
          }}>{lbl}</button>
        ))}
      </div>

      {/* Group pills + sort + new task */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {[["status", "Status"], ["priority", "Priority"], ["source", "Source"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setGroupBy(val)} style={{
              padding: "5px 14px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${groupBy === val ? C.borderSubtle : C.borderDefault}`,
              background: groupBy === val ? "rgba(255,255,255,0.08)" : "transparent",
              color: groupBy === val ? C.textPrimary : C.textSecondary,
              fontSize: 13, fontFamily: FONT_SANS, fontWeight: groupBy === val ? 600 : 400,
              transition: "all 0.15s ease",
            }}>{lbl}</button>
          ))}
          <span style={{ width: 1, height: 16, background: C.borderDefault, margin: "0 2px" }} />
          {[["default", "Default"], ["newest", "Newest"], ["oldest", "Oldest"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setSortBy(val)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: sortBy === val ? "rgba(255,255,255,0.08)" : "transparent",
              color: sortBy === val ? C.textPrimary : C.textSecondary,
              fontSize: 13, fontFamily: FONT_SANS, fontWeight: sortBy === val ? 500 : 400,
              transition: "all 0.15s ease",
            }}>{lbl}</button>
          ))}
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowForm(true)}>+ New Task</Btn>
      </div>

      {/* Task groups */}
      {tasks.length === 0 ? (
        <EmptyState icon={<CheckSquare size={36} />} title="No tasks yet" sub="Create tasks to track execution on your decisions." action="+ New Task" onAction={() => setShowForm(true)} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.textTertiary, fontFamily: FONT_BODY, fontSize: 14 }}>No tasks match "{searchTerm}"</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {groups.map(group => (
            <div key={group.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.borderDefault}` }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: group.color || C.textTertiary, opacity: 0.7 }} />
                <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>{group.label}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{group.items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {buildRenderItems(group.items).map(item =>
                  item.type === "batch" ? (
                    <IngestBatchCard
                      key={`batch-${item.sessionId}`}
                      sessionId={item.sessionId}
                      batchTasks={item.tasks}
                      session={sessionMap[item.sessionId]}
                      expandedId={expandedId}
                      setExpandedId={setExpandedId}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                      decisions={decisions}
                    />
                  ) : (
                    <TaskRow key={item.task.id} task={item.task} expanded={expandedId === item.task.id} onToggle={() => setExpandedId(expandedId === item.task.id ? null : item.task.id)} onUpdate={updates => updateTask(item.task.id, updates)} onDelete={() => deleteTask(item.task.id)} decisions={decisions} />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <TaskFormModal onClose={() => setShowForm(false)} onCreate={createTask} decisions={decisions} />}
    </div>
  );
}

// ─── Ingest Batch Card ────────────────────────────────────────────────────────
function IngestBatchCard({ sessionId, batchTasks, session, expandedId, setExpandedId, onUpdate, onDelete, decisions }) {
  const [collapsed, setCollapsed] = useState(false);
  const done = batchTasks.filter(t => t.status === "complete").length;
  const total = batchTasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total;

  // Derive label from session data
  const label = session
    ? (session.meetingTitle || session.rawContent?.slice(0, 50)?.replace(/\n/g, " ")?.trim() || "Ingest")
    : "Ingest";
  const dateStr = session ? fmtRelative(session.createdAt) : batchTasks[0] ? fmtRelative(batchTasks[0].createdAt) : "";

  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${allDone ? C.green + "44" : C.amber + "44"}`,
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 4,
    }}>
      {/* Batch header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", cursor: "pointer",
          background: `linear-gradient(135deg, ${C.amber}08, ${C.gold}06)`,
          borderBottom: collapsed ? "none" : `1px solid rgba(255,255,255,0.04)`,
          transition: "all 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <Zap size={14} style={{ color: C.amber }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.amber, background: `${C.amber}18`, padding: "1px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Ingest</span>
              <span style={{
                fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{label}{label.length >= 50 ? "..." : ""}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, flexShrink: 0 }}>{dateStr}</span>
            </div>
            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  width: `${progress}%`, height: "100%",
                  background: allDone ? C.green : `linear-gradient(90deg, ${C.amber}, ${C.gold})`,
                  borderRadius: 2, transition: "width 0.3s",
                }} />
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: allDone ? C.green : C.textTertiary, flexShrink: 0 }}>
                {done}/{total}
              </span>
            </div>
          </div>
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: 8 }}>
          {collapsed ? "▾" : "▴"}
        </span>
      </div>

      {/* Task rows inside batch */}
      {!collapsed && (
        <div style={{ padding: "4px 0" }}>
          {batchTasks.map(t => (
            <div key={t.id} style={{ borderLeft: `3px solid ${C.amber}33`, marginLeft: 12 }}>
              <TaskRow
                task={t}
                expanded={expandedId === t.id}
                onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
                onUpdate={updates => onUpdate(t.id, updates)}
                onDelete={() => onDelete(t.id)}
                decisions={decisions}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, expanded, onToggle, onUpdate, onDelete, decisions }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: task.title, description: task.description || "", status: task.status, priority: task.priority, dueDate: task.dueDate || "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const [completedGuideSteps, setCompletedGuideSteps] = useState({});

  const isDone = task.status === "complete";
  const overdue = isOverdue(task.dueDate) && !["complete", "cancelled"].includes(task.status);
  const subsDone = (task.subtasks || []).filter(s => s.complete).length;
  const subsTotal = (task.subtasks || []).length;
  const guide = task.bcGuide; // persisted guide from AI
  const guideDone = guide ? Object.values(completedGuideSteps).filter(Boolean).length : 0;
  const guideTotal = guide ? (guide.steps || []).length : 0;

  async function breakDown() {
    setAiLoading(true);
    try {
      const response = await callAIForEntity("task", task.id, AI_ACTIONS.break_down.prompt(task));
      const m = response.match(/\[[\s\S]*\]/);
      if (m) { const subs = JSON.parse(m[0]).map(s => ({ id: genId("sub"), title: s.title, complete: false })); await onUpdate({ subtasks: [...(task.subtasks || []), ...subs] }); }
    } catch (_) { /* subtask breakdown failed — user sees loading stop */ }
    finally { setAiLoading(false); }
  }

  async function generateGuide() {
    if (guide) { setGuideOpen(true); return; }
    setGuideLoading(true);
    setGuideOpen(true);
    try {
      const subtaskList = (task.subtasks || []).map(s => `- ${s.title}`).join("\n") || "No subtasks yet.";
      const prompt = `You are a hands-on mentor helping someone accomplish a task. They may not know where to start.

Task: ${task.title}
Description: ${task.description || "none"}
Subtasks:
${subtaskList}

Return ONLY valid JSON (no markdown fences):
{
  "overview": "One sentence explaining what this task accomplishes and why it matters.",
  "steps": [
    {
      "action": "Clear, specific instruction — what to do",
      "how": "Detailed explanation of exactly HOW to do it. Be specific: name tools, commands, approaches. Write for someone who hasn't done this before.",
      "done_looks_like": "One sentence: how do you know this step is complete?"
    }
  ]
}

RULES:
- 4-8 steps. Each step should be one concrete action, not a category.
- "action" = brief imperative (like a cheat sheet command)
- "how" = the actual walkthrough (2-4 sentences, specific and practical)
- "done_looks_like" = clear completion signal
- If there are subtasks, create steps that map to accomplishing them. If not, create steps from scratch.
- Be practical, not theoretical. Name real tools and approaches.`;

      const raw = await callAI([{ role: "user", content: prompt }], "You are a practical mentor. Return only valid JSON.", 4000);
      const clean = String(raw).replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed && Array.isArray(parsed.steps)) {
        await onUpdate({ bcGuide: parsed });
      }
    } catch (_) { /* guide generation failed — user sees loading stop */ }
    finally { setGuideLoading(false); }
  }

  async function toggleSubtask(subId) { await onUpdate({ subtasks: (task.subtasks || []).map(s => s.id === subId ? { ...s, complete: !s.complete } : s) }); }
  async function saveEdit() { await onUpdate(editData); setEditing(false); }

  return (
    <div style={{ background: expanded ? C.bgCard : "#111827", borderRadius: 6, borderLeft: `3px solid ${expanded ? priorityColor(task.priority) : "transparent"}`, transition: "all 0.15s" }}>
      {/* Row — compact like cheat sheet */}
      <div onClick={onToggle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <button onClick={e => { e.stopPropagation(); onUpdate({ status: isDone ? "open" : "complete" }); }} style={{
            width: 18, height: 18, borderRadius: 3, flexShrink: 0,
            background: isDone ? C.green : "transparent", border: `2px solid ${isDone ? C.green : "#444"}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 11, fontWeight: 700,
          }}>{isDone ? "✓" : ""}</button>
          <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: isDone ? C.textTertiary : C.textPrimary, textDecoration: isDone ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {subsTotal > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: subsDone === subsTotal ? C.green : C.textTertiary }}>{subsDone}/{subsTotal}</span>}
          {guide && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, display: "flex", alignItems: "center" }}><Sparkles size={10} /></span>}
          {overdue && <AlertTriangle size={10} style={{ color: C.red }} />}
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: priorityColor(task.priority) }}>{task.priority}</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: statusColor(task.status) }}>{TASK_STATUS_LABELS[task.status]}</span>
          {task.source && task.source !== "manual" && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: task.source === "ingest" ? C.amber : task.source === "project" ? C.blue : C.green, background: `${task.source === "ingest" ? C.amber : task.source === "project" ? C.blue : C.green}15`, padding: "1px 5px", borderRadius: 6 }}>{task.source}</span>}
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{fmtRelative(task.createdAt)}</span>
        </div>
      </div>

      {/* Expanded — cheat-sheet style */}
      {expanded && !editing && (
        <div style={{ padding: "0 14px 10px" }}>
          {/* Description snippet */}
          {task.description && !guideOpen && (
            <div style={{ padding: "6px 10px", background: "#0F1013", borderRadius: 4, borderLeft: `2px solid ${priorityColor(task.priority)}44`, fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, fontStyle: "italic", marginBottom: 8 }}>
              {task.description.split("\n---\n")[0].split("\n")[0].slice(0, 150)}
            </div>
          )}

          {/* Subtasks — compact, only shown when guide is closed */}
          {subsTotal > 0 && !guideOpen && (
            <div style={{ marginBottom: 8 }}>
              {task.subtasks.map(sub => (
                <div key={sub.id} onClick={() => toggleSubtask(sub.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", cursor: "pointer", borderRadius: 3, background: sub.complete ? `${C.green}08` : "transparent" }}>
                  <span style={{ color: sub.complete ? C.green : "#555", fontSize: 11, flexShrink: 0 }}>{sub.complete ? "✓" : "○"}</span>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: sub.complete ? C.textTertiary : C.textSecondary, textDecoration: sub.complete ? "line-through" : "none" }}>{sub.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* === GUIDE ME — the BC differentiator === */}
          {guideOpen && guide && (
            <div style={{ background: "#0B1120", borderRadius: 8, border: `1px solid ${C.gold}22`, overflow: "hidden", marginBottom: 8 }}>
              {/* Guide header */}
              <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> Guide</div>
                  {guide.overview && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginTop: 3, lineHeight: 1.4 }}>{guide.overview}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: guideDone === guideTotal ? C.green : C.textTertiary }}>{guideDone}/{guideTotal}</span>
                  <button onClick={() => setGuideOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, padding: "2px 0" }}>close</button>
                </div>
              </div>

              {/* Progress bar */}
              {guideTotal > 0 && (
                <div style={{ height: 2, background: "rgba(255,255,255,0.04)" }}>
                  <div style={{ width: `${guideTotal > 0 ? (guideDone / guideTotal) * 100 : 0}%`, height: "100%", background: guideDone === guideTotal ? C.green : C.gold, transition: "width 0.3s" }} />
                </div>
              )}

              {/* Steps — cheat-sheet style rows */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(guide.steps || []).map((step, i) => {
                  const isStepExpanded = expandedStep === i;
                  const stepDone = completedGuideSteps[i];
                  return (
                    <div key={i} style={{ borderBottom: i < guide.steps.length - 1 ? `1px solid rgba(255,255,255,0.03)` : "none" }}>
                      {/* Step row — click to expand "how" */}
                      <div
                        onClick={() => setExpandedStep(isStepExpanded ? null : i)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", background: isStepExpanded ? "#111827" : "transparent", transition: "background 0.1s" }}
                      >
                        <button onClick={e => { e.stopPropagation(); setCompletedGuideSteps(p => ({ ...p, [i]: !p[i] })); }} style={{
                          width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                          background: stepDone ? C.green : "transparent",
                          border: `2px solid ${stepDone ? C.green : "#333"}`,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 11, fontWeight: 700,
                        }}>{stepDone ? "✓" : <span style={{ color: "#555", fontSize: 11 }}>{i + 1}</span>}</button>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: stepDone ? C.textTertiary : C.textPrimary, textDecoration: stepDone ? "line-through" : "none", flex: 1, lineHeight: 1.4 }}>{step.action}</span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: isStepExpanded ? C.gold : C.textTertiary, flexShrink: 0 }}>{isStepExpanded ? "▴" : "how?"}</span>
                      </div>

                      {/* Expanded "how" — the actual value */}
                      {isStepExpanded && (
                        <div style={{ padding: "0 12px 10px 38px" }}>
                          <div style={{ padding: "8px 10px", background: `${C.gold}08`, borderRadius: 4, borderLeft: `2px solid ${C.gold}44` }}>
                            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{step.how}</div>
                            {step.done_looks_like && (
                              <div style={{ marginTop: 6, fontFamily: FONT_MONO, fontSize: 11, color: C.green }}>
                                Done when: {step.done_looks_like}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* All done */}
              {guideDone === guideTotal && guideTotal > 0 && (
                <div style={{ padding: "8px 12px", background: `${C.green}10`, textAlign: "center" }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.green, fontWeight: 600 }}>All steps complete — mark task done?</span>
                  <button onClick={() => onUpdate({ status: "complete" })} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.gold, marginLeft: 8, textDecoration: "underline" }}>complete task</button>
                </div>
              )}
            </div>
          )}

          {/* Guide loading state */}
          {guideOpen && guideLoading && !guide && (
            <div style={{ padding: "16px 12px", background: "#0B1120", borderRadius: 8, border: `1px solid ${C.gold}22`, marginBottom: 8, textAlign: "center" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Sparkles size={10} /> Building your guide...</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginTop: 4 }}>BC is figuring out exactly how to do this</div>
            </div>
          )}

          {/* Action row */}
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
            {/* Guide me — the primary action */}
            <button onClick={generateGuide} style={{
              padding: "3px 10px", borderRadius: 3, border: "none", cursor: "pointer",
              background: guideOpen ? `${C.gold}22` : `${C.gold}15`,
              color: C.gold, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
              transition: "all 0.15s",
            }}>{guideOpen && guide ? "hide guide" : guide ? "show guide" : <><Sparkles size={10} style={{ display: "inline" }} /> guide me</>}</button>
            {guideOpen && guide && (
              <button onClick={() => { setGuideOpen(false); }} style={{
                padding: "3px 8px", borderRadius: 3, border: "none", cursor: "pointer",
                background: "rgba(255,255,255,0.04)", color: C.textTertiary,
                fontFamily: FONT_MONO, fontSize: 11,
              }}>just the list</button>
            )}
            <span style={{ color: "rgba(255,255,255,0.06)", margin: "0 2px" }}>|</span>
            {TASK_STATUSES.map(s => (
              <button key={s} onClick={() => onUpdate({ status: s })} style={{
                padding: "2px 7px", borderRadius: 3, border: "none",
                background: task.status === s ? `${statusColor(s)}22` : "rgba(255,255,255,0.04)",
                color: task.status === s ? statusColor(s) : C.textTertiary,
                fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer",
              }}>{TASK_STATUS_LABELS[s]}</button>
            ))}
            <span style={{ color: "rgba(255,255,255,0.06)", margin: "0 2px" }}>|</span>
            {subsTotal === 0 && !aiLoading && <button onClick={breakDown} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.blue, padding: "2px 0" }}>break down</button>}
            <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, padding: "2px 0" }}>edit</button>
            {confirmDelete ? (
              <>
                <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.red, padding: "2px 0" }}>confirm</button>
                <button onClick={() => setConfirmDelete(false)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, padding: "2px 0" }}>cancel</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, padding: "2px 0" }}>delete</button>
            )}
          </div>
        </div>
      )}

      {/* Edit mode */}
      {expanded && editing && (
        <div style={{ padding: "8px 14px 10px" }}>
          <FormField label="Title"><Input value={editData.title} onChange={v => setEditData(p => ({ ...p, title: v }))} /></FormField>
          <FormField label="Description"><Input multiline rows={2} value={editData.description} onChange={v => setEditData(p => ({ ...p, description: v }))} /></FormField>
          <div style={{ display: "flex", gap: 12 }}>
            <FormField label="Status" style={{ flex: 1 }}><Select value={editData.status} onChange={v => setEditData(p => ({ ...p, status: v }))} options={TASK_STATUSES.map(s => ({ value: s, label: TASK_STATUS_LABELS[s] }))} /></FormField>
            <FormField label="Priority" style={{ flex: 1 }}><Select value={editData.priority} onChange={v => setEditData(p => ({ ...p, priority: v }))} options={TASK_PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} /></FormField>
          </div>
          <FormField label="Due Date"><Input value={editData.dueDate} onChange={v => setEditData(p => ({ ...p, dueDate: v }))} placeholder="YYYY-MM-DD" /></FormField>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Btn>
            <Btn variant="primary" size="sm" onClick={saveEdit}>Save</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskFormModal({ onClose, onCreate, decisions }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [sourceDecisionId, setSourceDecisionId] = useState("");

  async function handleSubmit() {
    if (!title.trim()) return;
    await onCreate({ title: title.trim(), description, status, priority, dueDate: dueDate || null, sourceDecisionId: sourceDecisionId || null, linkedPriorities: [] });
  }

  return (
    <Modal title="New Task" onClose={onClose}>
      <FormField label="Title" required>
        <Input value={title} onChange={setTitle} placeholder="What needs to be done?" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
      </FormField>
      <FormField label="Description">
        <Input multiline rows={3} value={description} onChange={setDescription} placeholder="Details, context, acceptance criteria..." />
      </FormField>
      <div style={{ display: "flex", gap: 12 }}>
        <FormField label="Status" style={{ flex: 1 }}>
          <Select value={status} onChange={setStatus} options={TASK_STATUSES.map(s => ({ value: s, label: TASK_STATUS_LABELS[s] }))} />
        </FormField>
        <FormField label="Priority" style={{ flex: 1 }}>
          <Select value={priority} onChange={setPriority} options={TASK_PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} />
        </FormField>
      </div>
      <FormField label="Due Date">
        <Input value={dueDate} onChange={setDueDate} placeholder="YYYY-MM-DD" />
      </FormField>
      {decisions.length > 0 && (
        <FormField label="Link to Decision">
          <Select
            value={sourceDecisionId}
            onChange={setSourceDecisionId}
            options={[{ value: "", label: "None" }, ...decisions.map(d => ({ value: d.id, label: d.title }))]}
          />
        </FormField>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={!title.trim()}>Create Task</Btn>
      </div>
    </Modal>
  );
}

// ─── Priorities View ──────────────────────────────────────────────────────────
export function PrioritiesView({ priorities, setPriorities, decisions, tasks, projects }) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filterProject, setFilterProject] = useState(null);
  const [filterSource, setFilterSource] = useState(null);
  const linkMap = useProjectLinks(projects);

  async function createPriority(data) {
    const p = {
      id: genId("pri"),
      ...data,
      rank: priorities.length + 1,
      successMetrics: data.successMetrics || [],
      linkedDecisions: [],
      linkedTasks: [],
      tags: [],
      healthScore: null,
      source: data.source || "manual",
      createdAt: isoNow(),
      updatedAt: isoNow(),
    };
    await store.save("priority", p);
    setPriorities(prev => [...prev, p]);
    setShowForm(false);
  }

  async function updatePriority(id, updates) {
    const existing = priorities.find(p => p.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await store.save("priority", updated);
    setPriorities(prev => prev.map(p => p.id === id ? updated : p));
  }

  async function deletePriority(id) {
    await store.delete("priority", id);
    setPriorities(prev => prev.filter(p => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  async function moveRank(id, dir) {
    const sorted = [...priorities].sort((a, b) => a.rank - b.rank);
    const idx = sorted.findIndex(p => p.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    await updatePriority(a.id, { rank: b.rank });
    await updatePriority(b.id, { rank: a.rank });
  }

  const projectFiltered = filterByProject(priorities, filterProject, linkMap);
  const sourceFiltered = filterSource
    ? projectFiltered.filter(p => (p.source || "manual") === filterSource)
    : projectFiltered;
  const sorted = [...sourceFiltered].sort((a, b) => a.rank - b.rank);

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em" }}>Priorities</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, marginTop: 4 }}>{priorities.length} total</div>
        </div>
        <Btn variant="primary" onClick={() => setShowForm(true)}>＋ New Priority</Btn>
      </div>

      <ProjectFilterPills projects={projects} filterProject={filterProject} setFilterProject={setFilterProject} />

      {/* Source filter */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18, alignItems: "center" }}>
        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary, fontWeight: 500, marginRight: 2 }}>Source:</span>
        {[
          [null, "All"],
          ["ingest", "Ingest"],
          ["project", "Project"],
          ["manual", "Manual"],
        ].map(([val, lbl]) => (
          <button key={lbl} onClick={() => setFilterSource(val)} style={{
            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            border: `1px solid ${filterSource === val ? C.blue + "40" : "transparent"}`,
            background: filterSource === val ? C.blueMuted : "transparent",
            color: filterSource === val ? C.blue : C.textTertiary,
            fontSize: 12, fontFamily: FONT_SANS, fontWeight: filterSource === val ? 600 : 400,
            transition: "all 0.15s ease",
          }}>{lbl}</button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={<ChevronUp size={36} />} title="No priorities defined" sub="Define your strategic priorities to track health and alignment." action="＋ New Priority" onAction={() => setShowForm(true)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sorted.map((p, i) => (
            <PriorityCard
              key={p.id}
              priority={p}
              rank={i + 1}
              total={sorted.length}
              expanded={expandedId === p.id}
              onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
              onUpdate={(updates) => updatePriority(p.id, updates)}
              onDelete={() => deletePriority(p.id)}
              onMoveUp={() => moveRank(p.id, "up")}
              onMoveDown={() => moveRank(p.id, "down")}
              canMoveUp={i > 0}
              canMoveDown={i < sorted.length - 1}
              tasks={tasks}
              decisions={decisions}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PriorityFormModal onClose={() => setShowForm(false)} onCreate={createPriority} />
      )}
    </div>
  );
}

function PriorityCard({ priority, rank, total, expanded, onToggle, onUpdate, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown, tasks, decisions }) {
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: priority.title,
    description: priority.description || "",
    status: priority.status,
    timeframe: priority.timeframe,
    successMetrics: (priority.successMetrics || []).join("\n"),
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  async function askBC() {
    const q = customPrompt.trim();
    if (!q || aiLoading) return;
    setCustomPrompt("");
    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    try {
      const ctx = `Priority: ${priority.title}\nStatus: ${priority.status}\nTimeframe: ${priority.timeframe}\nHealth: ${priority.healthScore ?? "not assessed"}\nDescription: ${priority.description || "none"}`;
      const response = await callAIForEntity("priority", priority.id, `${ctx}\n\nQuestion: ${q}`);
      setAiResponse(response);
    } catch (err) { setAiError(err.message); }
    finally { setAiLoading(false); }
  }

  const linkedTasks = tasks.filter(t => t.linkedPriorities?.includes(priority.id));
  const linkedDecisions = decisions.filter(d => d.linkedPriorities?.includes(priority.id));

  async function runAssessHealth() {
    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    try {
      const prompt = AI_ACTIONS.assess_health.prompt(priority);
      const response = await callAIForEntity("priority", priority.id, prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.score !== undefined) {
            await onUpdate({ healthScore: parsed.score });
          }
          setAiResponse(parsed.assessment || response);
        } catch {
          setAiResponse(response);
        }
      } else {
        setAiResponse(response);
      }
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function saveEdit() {
    await onUpdate({
      ...editData,
      successMetrics: editData.successMetrics.split("\n").map(s => s.trim()).filter(Boolean),
    });
    setEditing(false);
  }

  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.borderDefault}`,
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <div
        onClick={onToggle}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        style={{
          padding: "16px 18px",
          cursor: "pointer",
          background: headerHovered ? C.bgCardHover : "transparent",
          transition: "background 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          {/* Rank */}
          <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 500, color: C.gold + "60", minWidth: 36, lineHeight: 1 }}>
            #{rank}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.4 }}>
                {priority.title}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                {/* Move buttons — stopPropagation so they don't trigger toggle */}
                <button onClick={e => { e.stopPropagation(); onMoveUp(); }} disabled={!canMoveUp} style={{ background: "none", border: "none", cursor: canMoveUp ? "pointer" : "default", color: canMoveUp ? C.textSecondary : "rgba(255,255,255,0.1)", fontSize: 12, padding: "2px 4px", display: "flex", alignItems: "center" }}><ChevronUp size={12} /></button>
                <button onClick={e => { e.stopPropagation(); onMoveDown(); }} disabled={!canMoveDown} style={{ background: "none", border: "none", cursor: canMoveDown ? "pointer" : "default", color: canMoveDown ? C.textSecondary : "rgba(255,255,255,0.1)", fontSize: 12, padding: "2px 4px", display: "flex", alignItems: "center" }}><ChevronDown size={12} /></button>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontFamily: FONT_MONO, fontSize: 11,
                  color: headerHovered ? C.gold : C.textSecondary,
                  border: `1px solid ${headerHovered ? C.gold : C.borderDefault}`,
                  borderRadius: 10, padding: "2px 8px",
                  transition: "all 0.15s",
                }}>
                  {expanded ? "▴ Close" : "▾ Open"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, marginBottom: 10, alignItems: "center" }}>
              <Badge label={PRIORITY_STATUS_LABELS[priority.status] || priority.status} color={statusColor(priority.status)} />
              <Badge label={PRIORITY_TIMEFRAME_LABELS[priority.timeframe] || priority.timeframe} />
              {linkedTasks.length > 0 && <Badge label={`${linkedTasks.length} tasks`} />}
              {linkedDecisions.length > 0 && <Badge label={`${linkedDecisions.length} decisions`} />}
              {priority.source && priority.source !== "manual" && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: priority.source === "ingest" ? C.amber : C.blue, background: `${priority.source === "ingest" ? C.amber : C.blue}15`, padding: "1px 5px", borderRadius: 6 }}>{priority.source}</span>}
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{fmtRelative(priority.createdAt)}</span>
            </div>

            {/* Health bar */}
            <div style={{ marginBottom: 4 }}>
              {priority.healthScore !== null && priority.healthScore !== undefined ? (
                <HealthBar score={priority.healthScore} />
              ) : (
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Not yet assessed</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}`, padding: 18 }}>
          {editing ? (
            <div>
              <FormField label="Title"><Input value={editData.title} onChange={v => setEditData(p => ({ ...p, title: v }))} /></FormField>
              <FormField label="Description"><Input multiline rows={3} value={editData.description} onChange={v => setEditData(p => ({ ...p, description: v }))} /></FormField>
              <div style={{ display: "flex", gap: 12 }}>
                <FormField label="Status" style={{ flex: 1 }}>
                  <Select value={editData.status} onChange={v => setEditData(p => ({ ...p, status: v }))} options={PRIORITY_STATUSES.map(s => ({ value: s, label: PRIORITY_STATUS_LABELS[s] }))} />
                </FormField>
                <FormField label="Timeframe" style={{ flex: 1 }}>
                  <Select value={editData.timeframe} onChange={v => setEditData(p => ({ ...p, timeframe: v }))} options={PRIORITY_TIMEFRAMES.map(t => ({ value: t, label: PRIORITY_TIMEFRAME_LABELS[t] }))} />
                </FormField>
              </div>
              <FormField label="Success Metrics (one per line)">
                <Input multiline rows={4} value={editData.successMetrics} onChange={v => setEditData(p => ({ ...p, successMetrics: v }))} placeholder="Metric 1&#10;Metric 2&#10;Metric 3" />
              </FormField>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Btn variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Btn>
                <Btn variant="primary" size="sm" onClick={saveEdit}>Save</Btn>
              </div>
            </div>
          ) : (
            <div>
              {priority.description && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>
                  {priority.description}
                </div>
              )}

              {(priority.successMetrics || []).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Success Metrics</div>
                  {priority.successMetrics.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "3px 0", fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary }}>
                      <span style={{ color: C.gold }}>•</span>{m}
                    </div>
                  ))}
                </div>
              )}

              {/* AI Actions */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                <Btn variant="ghost" size="sm" onClick={runAssessHealth} disabled={aiLoading}>
                  {aiLoading ? "Assessing..." : <><Sparkles size={12} style={{ display: "inline" }} /> Assess Health</>}
                </Btn>
                <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Btn>
                {confirmDelete ? (
                  <>
                    <Btn variant="danger" size="sm" onClick={onDelete}>Confirm Delete</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn>
                  </>
                ) : (
                  <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>Delete</Btn>
                )}
              </div>

              {/* Free-form ask */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && askBC()}
                  placeholder="Ask BC anything about this priority..."
                  disabled={aiLoading}
                  style={{
                    flex: 1, background: C.bgAI, border: `1px solid ${C.borderAI}`,
                    borderRadius: 6, padding: "7px 12px", color: C.textPrimary,
                    fontFamily: FONT_SANS, fontSize: 13, outline: "none",
                  }}
                />
                <button
                  onClick={askBC}
                  disabled={!customPrompt.trim() || aiLoading}
                  style={{
                    background: customPrompt.trim() && !aiLoading ? C.gold : "transparent",
                    border: `1px solid ${customPrompt.trim() && !aiLoading ? C.gold : C.borderAI}`,
                    borderRadius: 6, padding: "7px 14px", cursor: customPrompt.trim() && !aiLoading ? "pointer" : "not-allowed",
                    color: customPrompt.trim() && !aiLoading ? C.bgPrimary : C.textTertiary,
                    fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
                  }}
                ><Sparkles size={12} /></button>
              </div>

              <AIPanel response={aiResponse} loading={aiLoading} error={aiError} />

              {/* Linked items */}
              {(linkedTasks.length > 0 || linkedDecisions.length > 0) && (
                <div style={{ marginTop: 14 }}>
                  {linkedTasks.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Linked Tasks</div>
                      {linkedTasks.map(t => (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                          <span style={{ color: priorityColor(t.priority), fontSize: 8 }}>●</span>
                          <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textSecondary }}>{t.title}</span>
                          <Badge label={TASK_STATUS_LABELS[t.status] || t.status} color={statusColor(t.status)} />
                        </div>
                      ))}
                    </div>
                  )}
                  {linkedDecisions.length > 0 && (
                    <div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Linked Decisions</div>
                      {linkedDecisions.map(d => (
                        <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                          <Diamond size={10} style={{ color: C.gold }} />
                          <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textSecondary }}>{d.title}</span>
                          <Badge label={DECISION_STATUS_LABELS[d.status]} color={statusColor(d.status)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PriorityFormModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [timeframe, setTimeframe] = useState("this_quarter");
  const [successMetrics, setSuccessMetrics] = useState("");

  async function handleSubmit() {
    if (!title.trim()) return;
    await onCreate({
      title: title.trim(),
      description,
      status,
      timeframe,
      successMetrics: successMetrics.split("\n").map(s => s.trim()).filter(Boolean),
    });
  }

  return (
    <Modal title="New Priority" onClose={onClose}>
      <FormField label="Title" required>
        <Input value={title} onChange={setTitle} placeholder="Strategic priority title..." />
      </FormField>
      <FormField label="Description">
        <Input multiline rows={3} value={description} onChange={setDescription} placeholder="What does success look like? Why does this matter?" />
      </FormField>
      <div style={{ display: "flex", gap: 12 }}>
        <FormField label="Status" style={{ flex: 1 }}>
          <Select value={status} onChange={setStatus} options={PRIORITY_STATUSES.map(s => ({ value: s, label: PRIORITY_STATUS_LABELS[s] }))} />
        </FormField>
        <FormField label="Timeframe" style={{ flex: 1 }}>
          <Select value={timeframe} onChange={setTimeframe} options={PRIORITY_TIMEFRAMES.map(t => ({ value: t, label: PRIORITY_TIMEFRAME_LABELS[t] }))} />
        </FormField>
      </div>
      <FormField label="Success Metrics (one per line)">
        <Input multiline rows={4} value={successMetrics} onChange={setSuccessMetrics} placeholder="Achieve X by Y&#10;Reduce Z by W%&#10;Launch feature by date" />
      </FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={!title.trim()}>Create Priority</Btn>
      </div>
    </Modal>
  );
}

// ─── Ingest History ───────────────────────────────────────────────────────────
const MODE_META = {
  general:    { label: "General",    icon: <PlusCircle size={12} />, color: C.blue  },
  meeting:    { label: "Meeting",    icon: "◎", color: C.textSecondary },
  respond_to: { label: "Respond To", icon: "↩", color: C.gold  },
};

function IngestSessionCard({ session, expanded, onToggle }) {
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [headerHovered, setHeaderHovered] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  async function askBC() {
    const q = customPrompt.trim();
    if (!q || aiLoading) return;
    setCustomPrompt("");
    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    try {
      const ctx = session.mode === "respond_to"
        ? `Respond To session (${session.responseStyle}, ${session.responseTone})\nDrafted response: ${session.draftedResponse}\nOriginal content: ${session.rawContent}`
        : `Ingest session (${session.mode})\nBC response: ${session.bcResponse}\nOriginal content: ${session.rawContent}`;
      const response = await callAIForEntity("ingest", session.id, `${ctx}\n\nQuestion: ${q}`);
      setAiResponse(response);
    } catch (err) { setAiError(err.message); }
    finally { setAiLoading(false); }
  }

  const meta = MODE_META[session.mode] || MODE_META.general;
  const cc = session.committedCounts;
  const totalCommitted = cc ? (cc.tasks || 0) + (cc.decisions || 0) + (cc.priorities || 0) : 0;
  const dateLabel = new Date(session.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const preview = (session.rawContent || "").slice(0, 120).replace(/\n/g, " ") + ((session.rawContent || "").length > 120 ? "…" : "");

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, overflow: "hidden" }}>
      {/* Clickable header */}
      <div
        onClick={onToggle}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        style={{ padding: "14px 18px", cursor: "pointer", background: headerHovered ? C.bgCardHover : "transparent", transition: "background 0.15s" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: meta.color, background: `${meta.color}18`, padding: "2px 8px", borderRadius: 4, flexShrink: 0 }}>
              {meta.icon} {meta.label}
            </span>
            {session.mode === "respond_to" && session.responseStyle && (
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, flexShrink: 0 }}>
                {session.responseStyle} · {session.responseTone}
              </span>
            )}
            {session.mode === "meeting" && session.meetingTitle && (
              <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.meetingTitle}
              </span>
            )}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
            fontFamily: FONT_MONO, fontSize: 11,
            color: headerHovered ? C.gold : C.textSecondary,
            border: `1px solid ${headerHovered ? C.gold : C.borderDefault}`,
            borderRadius: 10, padding: "2px 8px", transition: "all 0.15s",
          }}>
            {expanded ? "▴ Close" : "▾ Open"}
          </div>
        </div>

        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.4, marginBottom: 6 }}>
          {preview}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{dateLabel}</span>
          {cc ? (
            totalCommitted > 0 ? (
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.green }}>
                ✓ {[cc.tasks > 0 && `${cc.tasks}t`, cc.decisions > 0 && `${cc.decisions}d`, cc.priorities > 0 && `${cc.priorities}p`].filter(Boolean).join(" ")} created
              </span>
            ) : (
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>No items created</span>
            )
          ) : (
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.amber }}>Not committed</span>
          )}
          {session.allItems?.length > 0 && !cc && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{session.allItems.length} item{session.allItems.length !== 1 ? "s" : ""} available</span>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}`, padding: "16px 18px" }}>

          {/* Respond To: show drafted response */}
          {session.mode === "respond_to" && session.draftedResponse && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Drafted Response — {session.responseStyle} · {session.responseTone}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(session.draftedResponse); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{ background: copied ? C.green : "transparent", border: `1px solid ${copied ? C.green : C.borderDefault}`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: copied ? "#fff" : C.textSecondary, transition: "all 0.2s" }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <div style={{ background: C.bgCard, border: `1px solid ${C.borderActive}`, borderRadius: 8, padding: "14px 16px", fontFamily: FONT_BODY, fontSize: 13, color: C.textPrimary, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {session.draftedResponse}
              </div>
              {session.responseNotes && (
                <div style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, fontStyle: "italic", display: "flex", alignItems: "flex-start", gap: 4 }}><Sparkles size={12} style={{ flexShrink: 0, marginTop: 2 }} /> {session.responseNotes}</div>
              )}
            </div>
          )}

          {/* General/Meeting: show BC response */}
          {session.mode !== "respond_to" && session.bcResponse && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>BC Analysis</div>
              <div style={{ background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 8, padding: "12px 14px", fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: inlineMarkdown(session.bcResponse) }} />
            </div>
          )}

          {/* Extracted items summary */}
          {session.allItems?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Extracted Items</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {session.allItems.map((item, i) => {
                  const im = { task: { color: C.blue, icon: <CheckSquare size={11} /> }, decision: { color: C.gold, icon: <Diamond size={11} /> }, priority: { color: C.amber, icon: <ChevronUp size={11} /> } }[item.type] || { color: C.textTertiary, icon: "·" };
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: im.color }}>{im.icon}</span>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textSecondary }}>{item.title}</span>
                      {item.priority && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{item.priority}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Show original content toggle */}
          {session.rawContent && (
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => setShowRaw(r => !r)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textDecoration: "underline" }}>
                {showRaw ? "Hide original" : "Show original content"}
              </button>
              {showRaw && (
                <div style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "10px 14px", maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                  {session.rawContent}
                </div>
              )}
            </div>
          )}

          {/* Ask BC — continue the conversation */}
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Continue with BC</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && askBC()}
              placeholder={session.mode === "respond_to" ? "Refine the draft, change the tone, push harder on a point..." : "Ask anything about this content..."}
              disabled={aiLoading}
              style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "7px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
            />
            <button
              onClick={askBC}
              disabled={!customPrompt.trim() || aiLoading}
              style={{
                background: customPrompt.trim() && !aiLoading ? C.gold : "transparent",
                border: `1px solid ${customPrompt.trim() && !aiLoading ? C.gold : C.borderAI}`,
                borderRadius: 6, padding: "7px 14px",
                cursor: customPrompt.trim() && !aiLoading ? "pointer" : "not-allowed",
                color: customPrompt.trim() && !aiLoading ? C.bgPrimary : C.textTertiary,
                fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
              }}
            ><Sparkles size={12} /></button>
          </div>
          <AIPanel response={aiResponse} loading={aiLoading} error={aiError} />
        </div>
      )}
    </div>
  );
}

function IngestHistory({ sessions, setIngestSessions, focusSessionId, setFocusSessionId }) {
  const [expandedId, setExpandedId] = useState(focusSessionId || null);
  const [search, setSearch] = useState("");

  // When focusSessionId changes, expand that session and clear the focus
  useEffect(() => {
    if (focusSessionId) {
      setExpandedId(focusSessionId);
      if (setFocusSessionId) setFocusSessionId(null);
    }
  }, [focusSessionId]);

  const sorted = [...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
  const filtered = search.trim()
    ? sorted.filter(s =>
        (s.rawContent || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.bcResponse || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.draftedResponse || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.meetingTitle || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.mode || "").toLowerCase().includes(search.toLowerCase())
      )
    : sorted;

  if (sessions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ color: C.borderDefault, marginBottom: 16 }}><PlusCircle size={32} /></div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: C.textSecondary, marginBottom: 8 }}>No sessions yet</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary }}>Sessions are saved automatically when you process content.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 20 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sessions..."
          style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: "9px 14px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
        />
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>No sessions match "{search}"</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(s => (
            <IngestSessionCard
              key={s.id}
              session={s}
              expanded={expandedId === s.id}
              onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ingest View ──────────────────────────────────────────────────────────────
const RESPOND_TO_PROMPT = (input, style, tone, context) => `You are Base Command (BC), an executive communication advisor.

Draft a response to the content below. Then extract any tasks or decisions that require follow-up.

RESPONSE STYLE: ${style}
- Direct: No filler. Lead with your position. Short paragraphs.
- Collaborative: Acknowledge their perspective. Find common ground. Invite dialogue.
- Diplomatic: Careful framing. Respectful of relationship. Tactful even when declining.
- Firm: Clear boundaries. Non-negotiable points stated plainly. No ambiguity.
- Empathetic: Acknowledge the human side. Validate before responding to substance.
- Executive: Board-ready tone. Strategic framing. Outcome-oriented.

RESPONSE TONE: ${tone}
- Formal: Professional, structured, no contractions.
- Conversational: Warm, natural, readable.
- Concise: Every sentence earns its place. Under 100 words if possible.

CONTEXT: ${context}

CONTENT TO RESPOND TO:
${input}

Return ONLY valid JSON:
{
  "drafted_response": "The full drafted response, ready to send or edit",
  "response_notes": "1-2 sentences on the approach taken and anything the user should consider before sending",
  "items": [
    {
      "type": "task|decision|priority",
      "title": "concise title",
      "description": "actionable detail",
      "priority": "critical|high|medium|low",
      "dueDate": "YYYY-MM-DD or null",
      "timeframe": "this_week|this_month|this_quarter|this_year"
    }
  ]
}

items should only include genuine follow-up actions — if there are none, return an empty array.
Return ONLY the JSON. No markdown fences. No preamble.`;

const RESPONSE_STYLES = ["Direct", "Collaborative", "Diplomatic", "Firm", "Empathetic", "Executive"];
const RESPONSE_TONES = ["Formal", "Conversational", "Concise"];

const INGEST_PROMPT = (input, context) => `You are Base Command (BC), processing raw content pasted by an executive.

Analyze the input and extract structured items — tasks, decisions, and priorities — that should be tracked.

CURRENT CONTEXT:
${context}

INPUT:
${input}

Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "type": "task|decision|priority",
      "title": "clean, concise title",
      "description": "1-2 sentence description with enough detail to act on",
      "priority": "critical|high|medium|low",
      "dueDate": "YYYY-MM-DD or null",
      "timeframe": "this_week|this_month|this_quarter|this_year",
      "context": "for decisions: the context field — what's at stake, what options exist"
    }
  ],
  "bc_response": "Sharp 2-4 sentence analysis: confirm what was captured, flag any strategic implications, call out anything that needs immediate attention. Direct. No fluff."
}

EXTRACTION RULES:
- task: any concrete action item. Extract due dates if mentioned (convert relative dates like 'by Friday' to YYYY-MM-DD). Default priority to 'medium' unless urgency is clear.
- decision: anything open/unresolved that requires a choice. Status will default to 'draft'.
- priority: a strategic initiative, focus area, or recurring theme worth tracking. Set timeframe based on urgency/scope.
- If something is both a task and a priority, prefer priority.
- Extract ALL actionable items — cast a wide net. It's better to extract too many than too few.
- Return ONLY the JSON. No markdown fences. No preamble.`;

export function IngestView({ setDecisions, setTasks, setPriorities, setMeetings, ingestSessions, setIngestSessions, focusSessionId, setFocusSessionId }) {
  const [ingestTab, setIngestTab] = useState(focusSessionId ? "history" : "new"); // "new" | "history"
  const [sourceType, setSourceType] = useState("general"); // "general" | "meeting" | "respond_to"
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0]);
  const [meetingAttendees, setMeetingAttendees] = useState("");
  const [responseStyle, setResponseStyle] = useState("Direct");
  const [responseTone, setResponseTone] = useState("Conversational");
  const [copied, setCopied] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { items, bc_response }
  const [selected, setSelected] = useState({}); // { index: true/false }
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState(null);
  // Email scan state
  const [emailTimeframe, setEmailTimeframe] = useState("24h");
  const [emailScanning, setEmailScanning] = useState(false);
  const [ingestAiConfig, setIngestAiConfig] = useState(null);
  const [emailGmailStatus, setEmailGmailStatus] = useState(null);
  const [emailOutlookStatus, setEmailOutlookStatus] = useState(null);

  // Email connectors not available in local-first mode
  useEffect(() => {
    if (sourceType === "email") {
      setEmailGmailStatus({ connected: false, reason: "local_first" });
      setEmailOutlookStatus({ connected: false, reason: "local_first" });
    }
  }, [sourceType]);

  // Switch to history tab when navigating from a decision's ingest link
  useEffect(() => {
    if (focusSessionId) setIngestTab("history");
  }, [focusSessionId]);

  const process = async () => {
    if (!input.trim() || processing) return;
    setProcessing(true);
    setResult(null);
    setCreated(null);
    setError(null);

    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const context = `Today: ${today}`;

    try {
      const promptContent = sourceType === "respond_to"
        ? RESPOND_TO_PROMPT(input.trim(), responseStyle, responseTone, context)
        : INGEST_PROMPT(input.trim(), context);
      const raw = await callAI(
        [{ role: "user", content: promptContent }],
        "You are a precise data extraction system. Return only valid JSON as instructed.",
        undefined,
        ingestAiConfig
      );
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
      const sel = {};
      (parsed.items || []).forEach((_, i) => { sel[i] = sourceType !== "respond_to"; });
      setSelected(sel);

      // Auto-save session immediately so stepping away loses nothing
      const sessionId = `ingest_${Date.now()}`;
      setCurrentSessionId(sessionId);
      const session = {
        id: sessionId,
        mode: sourceType,
        responseStyle: sourceType === "respond_to" ? responseStyle : null,
        responseTone: sourceType === "respond_to" ? responseTone : null,
        draftedResponse: parsed.drafted_response || null,
        responseNotes: parsed.response_notes || null,
        meetingTitle: sourceType === "meeting" ? (meetingTitle.trim() || null) : null,
        meetingDate: sourceType === "meeting" ? meetingDate : null,
        meetingAttendees: sourceType === "meeting" ? (meetingAttendees.trim() || null) : null,
        rawContent: input.trim(),
        bcResponse: parsed.bc_response || null,
        allItems: parsed.items || [],
        committedCounts: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await store.save("ingest", session);
      const updatedSessions = await store.list("ingest");
      setIngestSessions(updatedSessions);
    } catch (e) {
      setError("Failed to process content. Check the API connection and try again.");
    } finally {
      setProcessing(false);
    }
  };

  const commit = async () => {
    if (!result || creating) return;
    setCreating(true);
    const counts = { tasks: 0, decisions: 0, priorities: 0 };
    const ts = new Date().toISOString();

    for (const [i, item] of (result.items || []).entries()) {
      if (!selected[i]) continue;
      const id = `${item.type}_${Date.now()}_${i}`;

      if (item.type === "task") {
        const task = {
          id, title: item.title, description: item.description || "",
          status: "open", priority: item.priority || "medium",
          dueDate: item.dueDate || null, sourceDecisionId: null,
          source: "ingest", ingestSessionId: currentSessionId,
          linkedPriorities: [], subtasks: [], tags: [], createdAt: ts, updatedAt: ts,
        };
        await store.save("task", task);
        counts.tasks++;
      } else if (item.type === "decision") {
        const decision = {
          id, title: item.title, context: item.context || item.description || "",
          status: "draft", options: [], outcome: "", rationale: "", risks: "",
          linkedTasks: [], linkedPriorities: [], tags: [],
          templateType: "blank", source: "ingest", ingestSessionId: currentSessionId, createdAt: ts, updatedAt: ts,
        };
        await store.save("decision", decision);
        counts.decisions++;
      } else if (item.type === "priority") {
        const existing = await store.list("priority");
        const priority = {
          id, title: item.title, description: item.description || "",
          rank: existing.length + 1,
          timeframe: item.timeframe || "this_quarter",
          status: "active", successMetrics: [], healthScore: null,
          linkedDecisions: [], linkedTasks: [], tags: [], source: "ingest", ingestSessionId: currentSessionId, createdAt: ts, updatedAt: ts,
        };
        await store.save("priority", priority);
        counts.priorities++;
      }
    }

    // Update the ingest session with committed counts
    if (currentSessionId) {
      const existing = await store.get("ingest", currentSessionId);
      if (existing) {
        await store.save("ingest", { ...existing, committedCounts: counts, updatedAt: ts });
        const updatedSessions = await store.list("ingest");
        setIngestSessions(updatedSessions);
      }
    }

    // If this was a meeting, save a meeting record
    if (sourceType === "meeting") {
      const meeting = {
        id: `meeting_${Date.now()}`,
        title: meetingTitle.trim() || `Meeting — ${new Date(meetingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        date: meetingDate,
        attendees: meetingAttendees.trim(),
        summary: result.bc_response || "",
        rawContent: input.trim(),
        extractedCounts: counts,
        createdAt: ts, updatedAt: ts,
      };
      await store.save("meeting", meeting);
      const m = await store.list("meeting");
      setMeetings(m);
    }

    // Refresh global state
    const [d, t, p] = await Promise.all([
      store.list("decision"),
      store.list("task"),
      store.list("priority"),
    ]);
    setDecisions(d);
    setTasks(t);
    setPriorities(p);

    setCreated(counts);
    setCreating(false);
    setResult(null);
    setSelected({});
    setInput("");
  };

  const reset = () => {
    setResult(null);
    setCreated(null);
    setError(null);
    setInput("");
    setSourceType("general");
    setMeetingTitle("");
    setMeetingDate(new Date().toISOString().split("T")[0]);
    setMeetingAttendees("");
    setResponseStyle("Direct");
    setResponseTone("Conversational");
    setCopied(false);
    setCurrentSessionId(null);
  };

  const TYPE_META = {
    task:     { label: "Task",     color: C.blue,  icon: <CheckSquare size={11} /> },
    decision: { label: "Decision", color: C.gold,  icon: <Diamond size={11} /> },
    priority: { label: "Priority", color: C.amber, icon: <ChevronUp size={11} /> },
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 40px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Ingest</h1>
            <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, fontFamily: FONT_BODY }}>
              Paste any content — BC extracts what matters and drafts responses.
            </p>
          </div>
          {/* New / History tabs */}
          <div style={{ display: "flex", gap: 2, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: 3 }}>
            {[
              { id: "new", label: "New" },
              { id: "history", label: `History${ingestSessions.length > 0 ? ` (${ingestSessions.length})` : ""}` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setIngestTab(tab.id)} style={{
                padding: "5px 14px", borderRadius: 6, cursor: "pointer",
                fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, border: "none",
                background: ingestTab === tab.id ? "rgba(255,255,255,0.08)" : "transparent",
                color: ingestTab === tab.id ? C.textPrimary : C.textSecondary,
                transition: "all 0.15s",
              }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* History tab */}
      {ingestTab === "history" && (
        <IngestHistory sessions={ingestSessions} setIngestSessions={setIngestSessions} focusSessionId={focusSessionId} setFocusSessionId={setFocusSessionId} />
      )}

      {/* New tab */}
      {ingestTab === "new" && !result && !created && (
        <div>
          {/* Source type toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { id: "general",    label: "⊕ General" },
              { id: "meeting",    label: "◎ Meeting" },
              { id: "respond_to", label: "↩ Respond To" },
              { id: "email",      label: "✉ Email Scan" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSourceType(id)}
                style={{
                  padding: "6px 16px", borderRadius: 6, cursor: "pointer",
                  fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600,
                  border: `1px solid ${sourceType === id ? C.borderSubtle : C.borderDefault}`,
                  background: sourceType === id ? "rgba(255,255,255,0.08)" : "transparent",
                  color: sourceType === id ? C.textPrimary : C.textSecondary,
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Respond To options */}
          {sourceType === "respond_to" && (
            <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Style</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {RESPONSE_STYLES.map(s => (
                    <button key={s} onClick={() => setResponseStyle(s)} style={{
                      padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                      fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                      border: `1px solid ${responseStyle === s ? C.borderSubtle : C.borderDefault}`,
                      background: responseStyle === s ? "rgba(255,255,255,0.08)" : "transparent",
                      color: responseStyle === s ? C.textPrimary : C.textSecondary,
                      transition: "all 0.15s",
                    }}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tone</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {RESPONSE_TONES.map(t => (
                    <button key={t} onClick={() => setResponseTone(t)} style={{
                      padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                      fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                      border: `1px solid ${responseTone === t ? C.borderSubtle : C.borderDefault}`,
                      background: responseTone === t ? "rgba(255,255,255,0.08)" : "transparent",
                      color: responseTone === t ? C.textPrimary : C.textSecondary,
                      transition: "all 0.15s",
                    }}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Meeting metadata fields */}
          {sourceType === "meeting" && (
            <div style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 8, padding: 16, marginBottom: 12,
              display: "flex", gap: 12, flexWrap: "wrap",
            }}>
              <div style={{ flex: "2 1 200px" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Meeting Title</div>
                <input
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Q2 Renewal Review"
                  style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "6px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
                />
              </div>
              <div style={{ flex: "1 1 130px" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</div>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "6px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", colorScheme: "dark" }}
                />
              </div>
              <div style={{ flex: "2 1 200px" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Attendees <span style={{ color: C.textTertiary, fontWeight: 400 }}>(optional)</span></div>
                <input
                  value={meetingAttendees}
                  onChange={e => setMeetingAttendees(e.target.value)}
                  placeholder="e.g. Sarah, Tom, Dev team"
                  style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "6px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
                />
              </div>
            </div>
          )}

          {/* Email scan panel */}
          {sourceType === "email" && (
            <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: 20, marginBottom: 12 }}>
              {/* Connected providers */}
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Connected Accounts</div>
              {emailGmailStatus === null && emailOutlookStatus === null ? (
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary, padding: "8px 0" }}>Checking connections...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {[
                    { key: "gmail", label: "Gmail", icon: "✉", status: emailGmailStatus },
                    { key: "outlook", label: "Outlook", icon: "📧", status: emailOutlookStatus },
                  ].map(({ key, label, icon, status }) => (
                    <div key={key} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                      background: status?.connected ? `${C.green}08` : `${C.red}08`,
                      border: `1px solid ${status?.connected ? C.green + "30" : C.borderDefault}`,
                      borderRadius: 6,
                    }}>
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textPrimary, flex: 1 }}>{label}</span>
                      {status?.connected ? (
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.green }}>{status.email || "Connected"}</span>
                      ) : (
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Requires backend</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Timeframe selector */}
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Timeframe</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {[
                  { id: "24h", label: "Last 24 hours" },
                  { id: "3d",  label: "Last 3 days" },
                  { id: "7d",  label: "Last 7 days" },
                ].map(({ id, label }) => (
                  <button key={id} onClick={() => setEmailTimeframe(id)} style={{
                    padding: "5px 14px", borderRadius: 6, cursor: "pointer",
                    fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                    border: `1px solid ${emailTimeframe === id ? C.borderSubtle : C.borderDefault}`,
                    background: emailTimeframe === id ? "rgba(255,255,255,0.08)" : "transparent",
                    color: emailTimeframe === id ? C.textPrimary : C.textSecondary,
                    transition: "all 0.15s",
                  }}>{label}</button>
                ))}
              </div>

              {/* Scan button */}
              {(emailGmailStatus?.connected || emailOutlookStatus?.connected) ? (
                <button
                  onClick={async () => {
                    setEmailScanning(true);
                    setError(null);
                    setResult(null);
                    setCreated(null);
                    try {
                      const userId = getOrCreateUserId();
                      const existingHashes = JSON.parse(localStorage.getItem(`bc2-${store._ws}-connector:scanned-hashes`) || "[]");
                      const scanRes = await fetch("/api/connectors/scan", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId,
                          provider: "all",
                          timeframe: emailTimeframe,
                          existingHashes,
                        }),
                      });
                      const data = await scanRes.json();
                      if (!scanRes.ok) throw new Error(data.error || "Scan failed");

                      // Store new hashes (cap at 1000)
                      if (data.newHashes?.length) {
                        const updated = [...existingHashes, ...data.newHashes].slice(-1000);
                        localStorage.setItem(`bc2-${store._ws}-connector:scanned-hashes`, JSON.stringify(updated));
                      }

                      if (!data.items?.length) {
                        setError("No actionable items found in your recent emails.");
                        setEmailScanning(false);
                        return;
                      }

                      // Dedup against existing items — fuzzy title matching
                      const existingTitles = [
                        ...(await store.list("task")).map(t => ({ type: "task", title: t.title })),
                        ...(await store.list("decision")).map(d => ({ type: "decision", title: d.title })),
                        ...(await store.list("priority")).map(p => ({ type: "priority", title: p.title })),
                      ];

                      const normalize = s => (s || "").toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();

                      const itemsWithDedup = data.items.map(item => {
                        const normTitle = normalize(item.title);
                        const isDuplicate = existingTitles.some(e =>
                          e.type === item.type && similarity(normalize(e.title), normTitle) > 0.8
                        );
                        return { ...item, _likelyDuplicate: isDuplicate };
                      });

                      // Format as ingest result
                      const parsedResult = {
                        items: itemsWithDedup,
                        bc_response: data.summary || `Scanned ${data.emailCount} emails. Found ${data.items.length} actionable items.`,
                      };
                      setResult(parsedResult);
                      const sel = {};
                      parsedResult.items.forEach((item, i) => { sel[i] = !item._likelyDuplicate; });
                      setSelected(sel);

                      // Save as ingest session
                      const sessionId = `ingest_${Date.now()}`;
                      setCurrentSessionId(sessionId);
                      const session = {
                        id: sessionId,
                        mode: "email",
                        rawContent: `Email scan: ${emailTimeframe} timeframe, ${data.emailCount} emails scanned`,
                        bcResponse: data.summary || null,
                        allItems: parsedResult.items,
                        committedCounts: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
                      await store.save("ingest", session);
                      const updatedSessions = await store.list("ingest");
                      setIngestSessions(updatedSessions);
                    } catch (e) {
                      setError(e.message || "Email scan failed");
                    }
                    setEmailScanning(false);
                  }}
                  disabled={emailScanning}
                  style={{
                    width: "100%", padding: "12px 20px", borderRadius: 8, cursor: emailScanning ? "not-allowed" : "pointer",
                    background: emailScanning ? C.goldMuted : C.gold, color: emailScanning ? C.textTertiary : C.bgPrimary,
                    border: "none", fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                  }}
                >
                  {emailScanning ? <><Sparkles size={12} style={{ display: "inline" }} /> Scanning emails...</> : <><Sparkles size={12} style={{ display: "inline" }} /> Scan Emails</>}
                </button>
              ) : (
                <div style={{ textAlign: "center", padding: "12px 0", fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary }}>
                  Connect at least one email account in Settings to start scanning.
                </div>
              )}
            </div>
          )}

          {/* Text input for non-email modes */}
          {sourceType !== "email" && (
            <>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  sourceType === "meeting"    ? "Paste meeting notes, transcript, or summary...\n\nBC will extract tasks, decisions, and priorities, and save a meeting record." :
                  sourceType === "respond_to" ? "Paste the message, email, Slack thread, or situation you need to respond to...\n\nBC will draft a response in your selected style and flag any follow-up items." :
                  "Paste meeting notes, Slack threads, email chains, voice memo transcripts...\n\nBC will extract what matters and create it for you."
                }
                style={{
                  width: "100%", minHeight: 280,
                  background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                  borderRadius: 8, padding: 16, resize: "vertical",
                  color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14,
                  lineHeight: 1.6, outline: "none",
                }}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") process(); }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: C.textTertiary, fontFamily: FONT_MONO }}>
                    {input.length > 0 ? `${input.length} characters` : "⌘↵ to process"}
                  </span>
                  <AIConfigPicker value={ingestAiConfig} onChange={setIngestAiConfig} />
                </div>
                <button
                  onClick={process}
                  disabled={!input.trim() || processing}
                  style={{
                    background: input.trim() && !processing ? C.gold : C.goldMuted,
                    color: input.trim() && !processing ? C.bgPrimary : C.textTertiary,
                    border: "none", borderRadius: 6, padding: "9px 20px",
                    fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600,
                    cursor: input.trim() && !processing ? "pointer" : "not-allowed",
                  }}
                >
                  {processing ? <><Sparkles size={12} style={{ display: "inline" }} /> Processing...</> : <><Sparkles size={12} style={{ display: "inline" }} /> Process</>}
                </button>
              </div>
            </>
          )}
          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 6, fontSize: 13, color: C.red, fontFamily: FONT_BODY }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {ingestTab === "new" && result && (
        <div>
          {/* RESPOND TO: Drafted response — shown first, prominently */}
          {sourceType === "respond_to" && result.drafted_response && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, letterSpacing: "0.06em" }}>
                  ↩ DRAFTED RESPONSE — {responseStyle.toUpperCase()} · {responseTone.toUpperCase()}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(result.drafted_response); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{
                    background: copied ? C.green : "transparent",
                    border: `1px solid ${copied ? C.green : C.borderDefault}`,
                    borderRadius: 6, padding: "4px 12px", cursor: "pointer",
                    fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                    color: copied ? "#fff" : C.textSecondary, transition: "all 0.2s",
                  }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <div style={{
                background: C.bgCard, border: `1px solid ${C.borderActive}`,
                borderRadius: 8, padding: "18px 20px",
                fontFamily: FONT_BODY, fontSize: 14, color: C.textPrimary, lineHeight: 1.75,
                whiteSpace: "pre-wrap",
              }}>
                {result.drafted_response}
              </div>
              {result.response_notes && (
                <div style={{ marginTop: 10, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, fontStyle: "italic", lineHeight: 1.5 }}>
                  <Sparkles size={12} style={{ display: "inline" }} /> {result.response_notes}
                </div>
              )}
            </div>
          )}

          {/* BC Commentary (general/meeting modes) */}
          {sourceType !== "respond_to" && result.bc_response && (
            <div style={{
              background: C.bgAI, border: `1px solid ${C.borderAI}`,
              borderRadius: 8, padding: "14px 18px", marginBottom: 24,
            }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue, marginBottom: 8, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> BASE COMMAND</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textPrimary, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: inlineMarkdown(result.bc_response) }} />
            </div>
          )}

          {/* Extracted items */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.textSecondary }}>
                {(result.items || []).length > 0
                  ? `${(result.items||[]).length} follow-up item${(result.items||[]).length !== 1 ? "s" : ""} ${sourceType === "respond_to" ? "— check any to create" : "— select which to create"}`
                  : sourceType === "respond_to" ? "No follow-up items identified" : "No items extracted"
                }
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { const s = {}; (result.items||[]).forEach((_,i) => s[i]=true); setSelected(s); }}
                  style={{ background:"none", border:"none", color: C.textTertiary, cursor:"pointer", fontSize:12, fontFamily: FONT_MONO }}>
                  All
                </button>
                <button onClick={() => setSelected({})}
                  style={{ background:"none", border:"none", color: C.textTertiary, cursor:"pointer", fontSize:12, fontFamily: FONT_MONO }}>
                  None
                </button>
              </div>
            </div>

            {(result.items || []).map((item, i) => {
              const meta = TYPE_META[item.type] || TYPE_META.task;
              const isSelected = selected[i];
              return (
                <div
                  key={i}
                  onClick={() => setSelected(s => ({ ...s, [i]: !s[i] }))}
                  style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    background: isSelected ? C.bgCardHover : C.bgCard,
                    border: `1px solid ${isSelected ? C.borderActive : C.borderDefault}`,
                    borderRadius: 8, padding: "14px 16px", marginBottom: 10,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                    border: `2px solid ${isSelected ? C.gold : C.borderDefault}`,
                    background: isSelected ? C.gold : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isSelected && <span style={{ color: C.bgPrimary, fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                        color: meta.color, background: `${meta.color}18`,
                        padding: "2px 8px", borderRadius: 4,
                      }}>
                        {meta.icon} {meta.label}
                      </span>
                      {item.priority && item.type === "task" && (
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                          {item.priority}
                        </span>
                      )}
                      {item.dueDate && (
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                          Due: {item.dueDate}
                        </span>
                      )}
                      {item.timeframe && item.type === "priority" && (
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                          {PRIORITY_TIMEFRAME_LABELS[item.timeframe] || item.timeframe}
                        </span>
                      )}
                      {item._likelyDuplicate && (
                        <span style={{
                          fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                          color: C.amber, background: C.amberMuted,
                          padding: "2px 6px", borderRadius: 4,
                        }}>
                          Likely duplicate
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary, marginBottom: (item.description || item.source_email) ? 4 : 0 }}>
                      {item.title}
                    </div>
                    {item.description && (
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                        {item.description}
                      </div>
                    )}
                    {item.source_email && (
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginTop: 3 }}>
                        via {item.source_email}{item.source_subject ? ` — "${item.source_subject}"` : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={reset}
              style={{ background: "none", border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "9px 18px", color: C.textSecondary, fontFamily: FONT_MONO, fontSize: 13, cursor: "pointer" }}
            >
              Start Over
            </button>
            <button
              onClick={commit}
              disabled={!Object.values(selected).some(Boolean) || creating}
              style={{
                background: Object.values(selected).some(Boolean) && !creating ? C.gold : "rgba(212,168,83,0.2)",
                color: Object.values(selected).some(Boolean) && !creating ? C.bgPrimary : C.textTertiary,
                border: "none", borderRadius: 6, padding: "9px 20px",
                fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600,
                cursor: Object.values(selected).some(Boolean) && !creating ? "pointer" : "not-allowed",
              }}
            >
              {creating ? "Creating..." : `Create ${Object.values(selected).filter(Boolean).length} Item${Object.values(selected).filter(Boolean).length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* Success state */}
      {ingestTab === "new" && created && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: C.textPrimary, marginBottom: 8 }}>
            {sourceType === "meeting" ? "Meeting Logged" : sourceType === "respond_to" ? "Done" : "Items Created"}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, marginBottom: 28, lineHeight: 1.8 }}>
            {sourceType === "meeting" && <span>Meeting record saved to log<br/></span>}
            {created.decisions > 0 && <span>{created.decisions} decision{created.decisions !== 1 ? "s" : ""} created<br/></span>}
            {created.tasks > 0 && <span>{created.tasks} task{created.tasks !== 1 ? "s" : ""} created<br/></span>}
            {created.priorities > 0 && <span>{created.priorities} priorit{created.priorities !== 1 ? "ies" : "y"} created<br/></span>}
            {(created.decisions + created.tasks + created.priorities) === 0 && <span>{sourceType === "respond_to" ? "No follow-up items created" : "No items extracted"}</span>}
          </div>
          <button onClick={reset} style={{ background: C.gold, color: C.bgPrimary, border: "none", borderRadius: 6, padding: "10px 24px", fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Ingest More
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Meetings View ────────────────────────────────────────────────────────────
function MeetingCard({ meeting, expanded, onToggle }) {
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [headerHovered, setHeaderHovered] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  async function askBC() {
    const q = customPrompt.trim();
    if (!q || aiLoading) return;
    setCustomPrompt("");
    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    try {
      const ctx = `Meeting: ${meeting.title}\nDate: ${meeting.date}\nAttendees: ${meeting.attendees || "not specified"}\nSummary: ${meeting.summary}`;
      const response = await callAIForEntity("meeting", meeting.id, `${ctx}\n\nQuestion: ${q}`);
      setAiResponse(response);
    } catch (err) { setAiError(err.message); }
    finally { setAiLoading(false); }
  }

  const { extractedCounts: ec = {} } = meeting;
  const totalExtracted = (ec.tasks || 0) + (ec.decisions || 0) + (ec.priorities || 0);
  const dateLabel = meeting.date
    ? new Date(meeting.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "No date";

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, overflow: "hidden" }}>
      {/* Clickable header */}
      <div
        onClick={onToggle}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        style={{ padding: "16px 18px", cursor: "pointer", background: headerHovered ? C.bgCardHover : "transparent", transition: "background 0.15s" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.4, flex: 1 }}>
            {meeting.title}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
            fontFamily: FONT_MONO, fontSize: 11,
            color: headerHovered ? C.gold : C.textSecondary,
            border: `1px solid ${headerHovered ? C.gold : C.borderDefault}`,
            borderRadius: 10, padding: "2px 8px", transition: "all 0.15s",
          }}>
            {expanded ? "▴ Close" : "▾ Open"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>◎ {dateLabel}</span>
          {meeting.attendees && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>· {meeting.attendees}</span>
          )}
          {totalExtracted > 0 && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
              ·&nbsp;
              {ec.tasks > 0 && `${ec.tasks}t `}
              {ec.decisions > 0 && `${ec.decisions}d `}
              {ec.priorities > 0 && `${ec.priorities}p`}
              &nbsp;extracted
            </span>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}`, padding: "16px 18px" }}>
          {/* Summary */}
          {meeting.summary && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>BC Summary</div>
              <div
                style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.7, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 8, padding: "12px 14px" }}
                dangerouslySetInnerHTML={{ __html: inlineMarkdown(meeting.summary) }}
              />
            </div>
          )}

          {/* Extracted item counts */}
          {totalExtracted > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {ec.tasks > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue, background: `${C.blue}18`, padding: "3px 10px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><CheckSquare size={11} /> {ec.tasks} task{ec.tasks !== 1 ? "s" : ""}</span>}
              {ec.decisions > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, background: `${C.gold}18`, padding: "3px 10px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><Diamond size={11} /> {ec.decisions} decision{ec.decisions !== 1 ? "s" : ""}</span>}
              {ec.priorities > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.amber, background: `${C.amber}18`, padding: "3px 10px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><ChevronUp size={11} /> {ec.priorities} priorit{ec.priorities !== 1 ? "ies" : "y"}</span>}
            </div>
          )}

          {/* Raw content toggle */}
          {meeting.rawContent && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setShowRaw(r => !r)}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textDecoration: "underline" }}
              >
                {showRaw ? "Hide original" : "Show original content"}
              </button>
              {showRaw && (
                <div style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "10px 14px", maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                  {meeting.rawContent}
                </div>
              )}
            </div>
          )}

          {/* Ask BC */}
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ask BC</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && askBC()}
              placeholder="What decisions came out of this? Who owns the renewal follow-up?..."
              disabled={aiLoading}
              style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "7px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
            />
            <button
              onClick={askBC}
              disabled={!customPrompt.trim() || aiLoading}
              style={{
                background: customPrompt.trim() && !aiLoading ? C.gold : "transparent",
                border: `1px solid ${customPrompt.trim() && !aiLoading ? C.gold : C.borderAI}`,
                borderRadius: 6, padding: "7px 14px",
                cursor: customPrompt.trim() && !aiLoading ? "pointer" : "not-allowed",
                color: customPrompt.trim() && !aiLoading ? C.bgPrimary : C.textTertiary,
                fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
              }}
            ><Sparkles size={12} /></button>
          </div>
          <AIPanel response={aiResponse} loading={aiLoading} error={aiError} />
        </div>
      )}
    </div>
  );
}

export function MeetingsView({ meetings }) {
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");

  const sorted = [...meetings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filtered = search.trim()
    ? sorted.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.attendees || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.summary || "").toLowerCase().includes(search.toLowerCase())
      )
    : sorted;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 40px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Meetings</h1>
            <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, fontFamily: FONT_BODY }}>
              A log of meetings you've ingested. Ask BC anything about any of them.
            </p>
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary, marginTop: 4 }}>{meetings.length} logged</span>
        </div>
      </div>

      {meetings.length > 0 && (
        <div style={{ position: "relative", marginBottom: 20 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search meetings..."
            style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: "9px 14px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        meetings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 32, color: C.borderDefault, marginBottom: 16 }}>◎</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: C.textSecondary, marginBottom: 8 }}>No meetings logged yet</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, maxWidth: 340, margin: "0 auto" }}>
              Go to Ingest, switch to <strong style={{ color: C.textSecondary }}>Meeting</strong> mode, and paste your notes. BC will summarize and extract action items.
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>
            No meetings match "{search}"
          </div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(m => (
            <MeetingCard
              key={m.id}
              meeting={m}
              expanded={expandedId === m.id}
              onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Task Guide Renderer (cheat-sheet style) ─────────────────────────────────
function TaskGuideRenderer({ guideData }) {
  const [search, setSearch] = useState("");
  const [expandedStep, setExpandedStep] = useState(null);
  const [checkedExercises, setCheckedExercises] = useState({});
  const [activeTask, setActiveTask] = useState(null);

  // Parse guideData — handle both structured JSON and legacy markdown
  let guide;
  if (typeof guideData === "string") {
    try { guide = JSON.parse(guideData); } catch { return <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{guideData}</div>; }
  } else {
    guide = guideData;
  }
  if (!guide || !guide.tasks) return null;

  const sectionColors = [
    { bg: "#1a2332", accent: "#4FC3F7", pill: "#0D47A1" },
    { bg: "#1a2a1a", accent: "#81C784", pill: "#2E7D32" },
    { bg: "#2a1a2a", accent: "#CE93D8", pill: "#6A1B9A" },
    { bg: "#2a2a1a", accent: "#FFD54F", pill: "#F57F17" },
    { bg: "#2a1a1a", accent: "#EF9A9A", pill: "#C62828" },
    { bg: "#1a2a2a", accent: "#80CBC4", pill: "#00695C" },
  ];

  const filtered = guide.tasks
    .map((t, i) => ({ ...t, _idx: i }))
    .filter(t =>
      !search.trim() ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.steps || []).some(s => (s.step || "").toLowerCase().includes(search.toLowerCase()))
    );

  const displayed = activeTask !== null
    ? filtered.filter(t => t._idx === activeTask)
    : filtered;

  const toggleExercise = (key) => setCheckedExercises(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.gold, fontSize: 12, fontWeight: 700 }}>/</span>
        <input
          type="text" placeholder="search tasks & steps..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "8px 12px 8px 26px", background: C.bgPrimary, border: `1px solid ${C.borderDefault}`, borderRadius: 6, color: C.textPrimary, fontSize: 12, fontFamily: FONT_MONO, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Task pills */}
      {guide.tasks.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          <button onClick={() => setActiveTask(null)} style={{
            padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer",
            background: activeTask === null ? C.gold : "rgba(255,255,255,0.04)",
            color: activeTask === null ? C.bgPrimary : C.textTertiary,
            fontFamily: FONT_MONO, fontSize: 11, fontWeight: activeTask === null ? 700 : 400,
          }}>All</button>
          {guide.tasks.map((t, i) => (
            <button key={i} onClick={() => setActiveTask(activeTask === i ? null : i)} style={{
              padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer",
              background: activeTask === i ? sectionColors[i % sectionColors.length].pill : "rgba(255,255,255,0.04)",
              color: activeTask === i ? "#fff" : C.textTertiary,
              fontFamily: FONT_MONO, fontSize: 11, fontWeight: activeTask === i ? 700 : 400,
              maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{t.title}</button>
          ))}
        </div>
      )}

      {/* Task sections */}
      {displayed.map(task => {
        const colors = sectionColors[task._idx % sectionColors.length];
        return (
          <div key={task._idx} style={{ marginBottom: 16 }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingBottom: 4, borderBottom: `2px solid ${colors.accent}44` }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.accent, margin: 0, fontFamily: FONT_MONO, textTransform: "uppercase", letterSpacing: 1 }}>{task.title}</h3>
            </div>
            {task.description && (
              <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 8, fontFamily: FONT_BODY, lineHeight: 1.5 }}>{task.description}</div>
            )}

            {/* Steps — clickable rows */}
            {task.steps && task.steps.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
                {task.steps.map((s, si) => {
                  const stepKey = `${task._idx}-step-${si}`;
                  const isOpen = expandedStep === stepKey;
                  const stepText = typeof s === "string" ? s : s.step;
                  const detail = typeof s === "string" ? null : s.detail;
                  return (
                    <div key={si}
                      onClick={() => setExpandedStep(isOpen ? null : stepKey)}
                      style={{
                        background: isOpen ? colors.bg : C.bgPrimary,
                        borderRadius: 4, padding: "8px 10px", cursor: "pointer",
                        borderLeft: `3px solid ${isOpen ? colors.accent : "transparent"}`,
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: colors.accent, fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, flexShrink: 0, width: 18 }}>{si + 1}.</span>
                          <span style={{ color: C.textPrimary, fontSize: 13, fontFamily: FONT_BODY }}>{stepText}</span>
                        </div>
                        {detail && <span style={{ color: C.textTertiary, fontSize: 11, fontFamily: FONT_MONO, flexShrink: 0 }}>{isOpen ? "▴" : "how?"}</span>}
                      </div>
                      {isOpen && detail && (
                        <div style={{ marginTop: 6, marginLeft: 26, padding: "6px 10px", background: C.bgCard, borderRadius: 4, fontSize: 11, color: colors.accent, fontFamily: FONT_BODY, lineHeight: 1.5, borderLeft: `2px solid ${colors.accent}44` }}>
                          {detail}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Exercises — checkable */}
            {task.exercises && task.exercises.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: C.textTertiary, fontFamily: FONT_MONO, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Exercises</div>
                {task.exercises.map((ex, ei) => {
                  const exKey = `${task._idx}-ex-${ei}`;
                  const exText = typeof ex === "string" ? ex : ex.task;
                  const hint = typeof ex === "string" ? null : ex.hint;
                  const checked = checkedExercises[exKey];
                  return (
                    <div key={ei} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
                      <div onClick={() => toggleExercise(exKey)}
                        style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${checked ? colors.accent : C.borderDefault}`, background: checked ? colors.accent : "transparent", cursor: "pointer", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {checked && <span style={{ fontSize: 11, color: C.bgPrimary }}>✓</span>}
                      </div>
                      <div>
                        <span style={{ fontSize: 13, color: checked ? C.textTertiary : C.textPrimary, fontFamily: FONT_BODY, textDecoration: checked ? "line-through" : "none" }}>{exText}</span>
                        {hint && <div style={{ fontSize: 11, color: C.textTertiary, fontStyle: "italic", marginTop: 2 }}>Hint: {hint}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Resources */}
            {task.resources && task.resources.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: C.textTertiary, fontFamily: FONT_MONO, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Resources</div>
                {task.resources.map((r, ri) => {
                  const name = typeof r === "string" ? r : r.name;
                  const url = typeof r === "string" ? null : r.url;
                  const why = typeof r === "string" ? null : r.why;
                  return (
                    <div key={ri} style={{ padding: "3px 0", fontSize: 13, fontFamily: FONT_BODY }}>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, fontWeight: 600, textDecoration: "none", borderBottom: `1px solid ${colors.accent}44` }}
                          onMouseEnter={e => e.target.style.borderBottomColor = colors.accent}
                          onMouseLeave={e => e.target.style.borderBottomColor = colors.accent + "44"}
                        >{name}</a>
                      ) : (
                        <span style={{ color: colors.accent, fontWeight: 600 }}>{name}</span>
                      )}
                      {why && <span style={{ color: C.textTertiary }}> — {why}</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tips */}
            {task.tips && task.tips.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: C.textTertiary, fontFamily: FONT_MONO, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Tips</div>
                {task.tips.map((tip, ti) => (
                  <div key={ti} style={{ padding: "3px 0", fontSize: 11, color: C.gold, fontFamily: FONT_BODY, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={11} /> {typeof tip === "string" ? tip : tip.text || tip}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {displayed.length === 0 && (
        <div style={{ textAlign: "center", padding: 20, color: C.textTertiary, fontSize: 13 }}>
          No tasks match "{search}"
        </div>
      )}
    </div>
  );
}

// ─── Library View ──────────────────────────────────────────────────────────────
function DocumentCard({ doc, expanded, onToggle, onDelete }) {
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [headerHovered, setHeaderHovered] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function askBC() {
    const q = customPrompt.trim();
    if (!q || aiLoading) return;
    setCustomPrompt("");
    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    try {
      const contentPreview = (doc.content || "").slice(0, 3000);
      const ctx = `Document: ${doc.title}\nType: ${doc.fileType}\nSummary: ${doc.summary || "none"}\n\nContent (first 3000 chars):\n${contentPreview}`;
      const response = await callAIForEntity("document", doc.id, `${ctx}\n\nQuestion: ${q}`);
      setAiResponse(response);
    } catch (err) { setAiError(err.message); }
    finally { setAiLoading(false); }
  }

  const sizeLabel = doc.fileSize < 1024 ? `${doc.fileSize}B` : doc.fileSize < 1048576 ? `${(doc.fileSize / 1024).toFixed(1)}KB` : `${(doc.fileSize / 1048576).toFixed(1)}MB`;

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, overflow: "hidden" }}>
      <div
        onClick={onToggle}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        style={{ padding: "14px 18px", cursor: "pointer", background: headerHovered ? C.bgCardHover : "transparent", transition: "background 0.15s" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 16, flexShrink: 0, color: doc.fileType === "guide" ? C.gold : "inherit" }}>{doc.fileType === "guide" ? <Sparkles size={16} /> : <FileText size={16} />}</span>
            <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {doc.title}
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
            fontFamily: FONT_MONO, fontSize: 11,
            color: headerHovered ? C.gold : C.textSecondary,
            border: `1px solid ${headerHovered ? C.gold : C.borderDefault}`,
            borderRadius: 10, padding: "2px 8px", transition: "all 0.15s",
          }}>
            {expanded ? "▴ Close" : "▾ Open"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Badge label={doc.fileType} />
          <Badge label={sizeLabel} />
          {doc.source && doc.source !== "upload" && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue, background: `${C.blue}15`, padding: "1px 5px", borderRadius: 6 }}>{doc.source}</span>}
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{fmtRelative(doc.createdAt)}</span>
        </div>
        {doc.summary && !expanded && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.5, marginTop: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {doc.summary}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}`, padding: "16px 18px" }}>
          {doc.summary && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Summary</div>
              <div style={{ background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 8, padding: "12px 14px" }}>
                {renderMarkdown(doc.summary)}
              </div>
            </div>
          )}

          {doc.fileType === "guide" && doc.content && (
            <div style={{ marginBottom: 16 }}>
              <TaskGuideRenderer guideData={doc.content} />
            </div>
          )}

          {doc.fileType !== "guide" && doc.content && (
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => setShowContent(r => !r)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textDecoration: "underline" }}>
                {showContent ? "Hide document content" : "Show document content"}
              </button>
              {showContent && (
                <div style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "10px 14px", maxHeight: 300, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                  {doc.content}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {confirmDelete ? (
              <>
                <Btn variant="danger" size="sm" onClick={onDelete}>Confirm Delete</Btn>
                <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn>
              </>
            ) : (
              <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>Delete</Btn>
            )}
          </div>

          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ask BC about this document</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && askBC()}
              placeholder="Summarize the key points, find action items, ask anything..."
              disabled={aiLoading}
              style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "7px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
            />
            <button
              onClick={askBC}
              disabled={!customPrompt.trim() || aiLoading}
              style={{
                background: customPrompt.trim() && !aiLoading ? C.gold : "transparent",
                border: `1px solid ${customPrompt.trim() && !aiLoading ? C.gold : C.borderAI}`,
                borderRadius: 6, padding: "7px 14px",
                cursor: customPrompt.trim() && !aiLoading ? "pointer" : "not-allowed",
                color: customPrompt.trim() && !aiLoading ? C.bgPrimary : C.textTertiary,
                fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
              }}
            ><Sparkles size={12} /></button>
          </div>
          <AIPanel response={aiResponse} loading={aiLoading} error={aiError} />
        </div>
      )}
    </div>
  );
}

export function LibraryView({ documents, setDocuments, projects }) {
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [filterProject, setFilterProject] = useState(null);
  const [filterSource, setFilterSource] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const fileInputRef = useRef(null);
  const linkMap = useProjectLinks(projects);

  const dateSorted = sortBy === "oldest"
    ? [...documents].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [...documents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const projectFiltered = filterProject
    ? dateSorted.filter(d => d.projectId === filterProject || (linkMap[filterProject] && linkMap[filterProject].has(d.id)))
    : dateSorted;
  const sourceFiltered = filterSource
    ? projectFiltered.filter(d => (d.source || "upload") === filterSource)
    : projectFiltered;
  const filtered = search.trim()
    ? sourceFiltered.filter(d =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.summary || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.content || "").toLowerCase().includes(search.toLowerCase())
      )
    : sourceFiltered;

  // Group by project
  const projectDocs = {};
  const unlinkedDocs = [];
  for (const doc of filtered) {
    if (doc.projectId) {
      if (!projectDocs[doc.projectId]) projectDocs[doc.projectId] = [];
      projectDocs[doc.projectId].push(doc);
    } else {
      unlinkedDocs.push(doc);
    }
  }
  const projectGroups = Object.entries(projectDocs).map(([pid, docs]) => {
    const proj = projects.find(p => p.id === pid);
    return { projectId: pid, projectTitle: proj ? proj.title : "Unknown Project", docs };
  });

  async function handleUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError("");

    for (const file of files) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (!SUPPORTED_DOC_TYPES.includes(ext)) {
        setUploadError(`Unsupported file type: ${ext}. Supported: ${SUPPORTED_DOC_TYPES.join(", ")}`);
        continue;
      }

      try {
        const content = await extractFileContent(file);
        if (!content) {
          setUploadError(`Could not extract text from ${file.name}`);
          continue;
        }

        const doc = {
          id: genId("doc"),
          title: file.name,
          filename: file.name,
          fileType: ext.replace(".", ""),
          content,
          summary: null,
          fileSize: file.size,
          source: "upload",
          createdAt: isoNow(),
          updatedAt: isoNow(),
        };
        await store.save("document", doc);

        // Auto-summarize with AI
        try {
          const preview = content.slice(0, 4000);
          const summaryResponse = await callAI(
            [{ role: "user", content: `Summarize this document in 3-5 concise bullet points. Focus on key topics, action items, and important details.\n\nDocument: ${file.name}\n\nContent:\n${preview}` }],
          );
          doc.summary = summaryResponse;
          await store.save("document", doc);
        } catch (_) { /* summary generation failed — doc saved without summary */ }

        const updatedDocs = await store.list("document");
        setDocuments(updatedDocs);
      } catch (err) {
        setUploadError(`Error processing ${file.name}: ${err.message}`);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function deleteDocument(id) {
    await store.delete("document", id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 40px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Library</h1>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, fontFamily: FONT_BODY }}>
            Upload documents and interact with them through BC.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{documents.length} doc{documents.length !== 1 ? "s" : ""}</span>
          <input ref={fileInputRef} type="file" accept=".txt,.md,.docx,.jsx" multiple onChange={handleUpload} style={{ display: "none" }} />
          <Btn variant="primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "＋ Upload"}
          </Btn>
        </div>
      </div>

      {uploadError && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 6, fontSize: 13, color: C.red, fontFamily: FONT_BODY }}>
          {uploadError}
        </div>
      )}

      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 16 }}>
        Supported: .txt, .md, .docx, .jsx
      </div>

      <ProjectFilterPills projects={projects} filterProject={filterProject} setFilterProject={setFilterProject} />

      {/* Source filter + sort */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 4 }}>Source:</span>
          {[
            [null, "All"],
            ["upload", "Upload"],
            ["project", "Project"],
          ].map(([val, lbl]) => (
            <button key={lbl} onClick={() => setFilterSource(val)} style={{
              padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer",
              background: filterSource === val ? C.blue : "rgba(255,255,255,0.04)",
              color: filterSource === val ? "#fff" : C.textTertiary,
              fontSize: 11, fontFamily: FONT_MONO, fontWeight: filterSource === val ? 700 : 400,
            }}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[["newest", "Newest"], ["oldest", "Oldest"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setSortBy(val)} style={{
              padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer",
              background: sortBy === val ? "rgba(255,255,255,0.08)" : "transparent",
              color: sortBy === val ? C.textPrimary : C.textSecondary,
              fontSize: 11, fontFamily: FONT_MONO, fontWeight: sortBy === val ? 600 : 400,
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {documents.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: "9px 14px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        documents.length === 0 ? (
          <EmptyState icon="▤" title="No documents yet" sub="Upload .txt, .md, or .docx files to get started. BC will auto-summarize and let you interact with them." action="＋ Upload" onAction={() => fileInputRef.current?.click()} />
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>No documents match "{search}"</div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Project-grouped documents */}
          {projectGroups.map(group => (
            <div key={group.projectId}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: FONT_MONO, fontSize: 11, color: C.gold,
                marginBottom: 8, paddingBottom: 6,
                borderBottom: `1px solid ${C.gold}20`,
              }}>
                <Grid3X3 size={11} />
                <span style={{ fontWeight: 600, letterSpacing: "0.04em" }}>{group.projectTitle}</span>
                <span style={{ color: C.textTertiary, fontWeight: 400 }}>({group.docs.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginLeft: 4 }}>
                {group.docs.map(d => (
                  <DocumentCard
                    key={d.id}
                    doc={d}
                    expanded={expandedId === d.id}
                    onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    onDelete={() => deleteDocument(d.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Unlinked documents */}
          {unlinkedDocs.length > 0 && (
            <div>
              {projectGroups.length > 0 && (
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary,
                  marginBottom: 8, paddingBottom: 6,
                  borderBottom: `1px solid ${C.borderDefault}`,
                  letterSpacing: "0.04em",
                }}>
                  Unlinked Documents ({unlinkedDocs.length})
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {unlinkedDocs.map(d => (
                  <DocumentCard
                    key={d.id}
                    doc={d}
                    expanded={expandedId === d.id}
                    onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    onDelete={() => deleteDocument(d.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Projects View ─────────────────────────────────────────────────────────────
function GuidancePanel({ guidance, type, autoExpand }) {
  const [expanded, setExpanded] = useState(!!autoExpand);
  const [completedSteps, setCompletedSteps] = useState({});
  const [completedExercises, setCompletedExercises] = useState({});
  const [expandedHints, setExpandedHints] = useState({});
  const [expandedDetails, setExpandedDetails] = useState({});

  if (!guidance) return null;

  // Detect if guidance uses old string format vs new structured format
  const isStructured = type === "task"
    ? Array.isArray(guidance.instructions)
    : Array.isArray(guidance.considerations);

  if (!isStructured) {
    // Fallback: render old string-based guidance
    const sections = type === "task"
      ? [
          { key: "instructions", label: "How To Do This", icon: <ArrowRight size={10} />, color: C.blue },
          { key: "exercises", label: "Exercises", icon: <Zap size={10} />, color: C.amber },
          { key: "resources", label: "Resources", icon: "📚", color: C.green },
          { key: "tips", label: "Tips", icon: <Lightbulb size={10} />, color: C.gold },
        ]
      : [
          { key: "considerations", label: "Considerations", icon: "⚖", color: C.gold },
          { key: "recommended_approach", label: "Approach", icon: <ArrowRight size={10} />, color: C.blue },
          { key: "resources", label: "Resources", icon: "📚", color: C.green },
        ];
    const hasSections = sections.some(s => guidance[s.key]);
    if (!hasSections) return null;
    return (
      <div style={{ marginTop: 8 }}>
        <button onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }} style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          fontFamily: FONT_MONO, fontSize: 11, color: C.gold, letterSpacing: "0.05em",
        }}>
          {expanded ? "▴ Hide Guidance" : "▾ Show Guidance"}
        </button>
        {expanded && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            {sections.map(s => {
              if (!guidance[s.key]) return null;
              return (
                <div key={s.key} style={{ background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: s.color, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {s.icon} {s.label}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {guidance[s.key]}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Structured interactive guidance ─────────────────────────────
  const instructions = type === "task" ? (guidance.instructions || []) : (guidance.recommended_approach || []);
  const exercises = guidance.exercises || [];
  const resources = guidance.resources || [];
  const tips = type === "task" ? (guidance.tips || []) : [];
  const considerations = type !== "task" ? (guidance.considerations || []) : [];

  const totalSteps = instructions.length;
  const doneSteps = Object.values(completedSteps).filter(Boolean).length;
  const totalExercises = exercises.length;
  const doneExercises = Object.values(completedExercises).filter(Boolean).length;
  const hasContent = totalSteps > 0 || exercises.length > 0 || resources.length > 0 || tips.length > 0 || considerations.length > 0;
  if (!hasContent) return null;

  return (
    <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
      <button onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }} style={{
        background: expanded ? `${C.gold}15` : "none",
        border: expanded ? `1px solid ${C.gold}40` : `1px solid ${C.borderDefault}`,
        borderRadius: 6, cursor: "pointer", padding: "6px 12px",
        fontFamily: FONT_MONO, fontSize: 11, color: C.gold, letterSpacing: "0.04em",
        display: "flex", alignItems: "center", gap: 8,
        transition: "all 0.15s",
      }}>
        <span>{expanded ? "▴" : "▾"} {type === "task" ? "Task Guide" : "Decision Guide"}</span>
        {totalSteps > 0 && (
          <span style={{
            background: doneSteps === totalSteps && totalSteps > 0 ? `${C.green}30` : "rgba(255,255,255,0.08)",
            color: doneSteps === totalSteps && totalSteps > 0 ? C.green : C.textTertiary,
            padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 600,
          }}>
            {doneSteps}/{totalSteps}
          </span>
        )}
      </button>

      {expanded && (
        <div style={{ marginTop: 10, background: "#0B1120", border: `1px solid ${C.borderDefault}`, borderRadius: 10, overflow: "hidden" }}>
          {/* Progress bar */}
          {totalSteps > 0 && (
            <div style={{ height: 3, background: "rgba(255,255,255,0.04)" }}>
              <div style={{
                width: `${totalSteps > 0 ? (doneSteps / totalSteps) * 100 : 0}%`,
                height: "100%",
                background: doneSteps === totalSteps ? C.green : C.gold,
                transition: "width 0.4s ease",
              }} />
            </div>
          )}

          {/* Considerations (decisions only) */}
          {considerations.length > 0 && (
            <div style={{ padding: "14px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.gold, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                ⚖ Key Considerations
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {considerations.map((c, i) => {
                  const text = typeof c === "string" ? c : c.text || c;
                  return (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", background: `${C.gold}08`, borderRadius: 6, border: `1px solid ${C.gold}15` }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, flexShrink: 0, marginTop: 1 }}>⚖</span>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Instructions / Steps */}
          {instructions.length > 0 && (
            <div style={{ padding: "14px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.blue, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <ArrowRight size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {type === "task" ? "Steps" : "Approach"} ({doneSteps}/{totalSteps} complete)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {instructions.map((inst, i) => {
                  const step = typeof inst === "string" ? inst : inst.step;
                  const detail = typeof inst === "string" ? null : inst.detail;
                  const isDone = completedSteps[i];
                  const isDetailOpen = expandedDetails[`step_${i}`];
                  return (
                    <div key={i} style={{
                      background: isDone ? `${C.green}08` : "#111827",
                      borderRadius: 8, padding: "10px 12px",
                      borderLeft: `3px solid ${isDone ? C.green : C.blue}30`,
                      transition: "all 0.15s",
                    }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <button onClick={() => setCompletedSteps(p => ({ ...p, [i]: !p[i] }))} style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                          background: isDone ? C.green : "transparent",
                          border: `2px solid ${isDone ? C.green : "#333"}`,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                        }}>
                          {isDone ? "✓" : <span style={{ color: "#666", fontSize: 11, fontWeight: 600 }}>{i + 1}</span>}
                        </button>
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontFamily: FONT_BODY, fontSize: 13, color: isDone ? C.textTertiary : "#E0E0E0",
                            textDecoration: isDone ? "line-through" : "none", lineHeight: 1.5,
                          }}>{step}</span>
                          {detail && (
                            <button onClick={() => setExpandedDetails(p => ({ ...p, [`step_${i}`]: !p[`step_${i}`] }))} style={{
                              background: "none", border: "none", cursor: "pointer", padding: "2px 0", marginLeft: 6,
                              fontFamily: FONT_MONO, fontSize: 11, color: C.blue,
                            }}>
                              {isDetailOpen ? "hide ▴" : "why? ▾"}
                            </button>
                          )}
                          {isDetailOpen && detail && (
                            <div style={{
                              marginTop: 6, padding: "8px 10px", background: "rgba(58,124,165,0.06)",
                              borderRadius: 4, fontSize: 13, color: C.textTertiary, lineHeight: 1.5,
                              fontFamily: FONT_BODY, fontStyle: "italic",
                            }}>
                              {detail}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Exercises */}
          {exercises.length > 0 && (
            <div style={{ padding: "14px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.amber, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <Zap size={10} style={{ display: "inline", verticalAlign: "middle" }} /> Exercises ({doneExercises}/{totalExercises})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {exercises.map((ex, i) => {
                  const task = typeof ex === "string" ? ex : ex.task;
                  const hint = typeof ex === "string" ? null : ex.hint;
                  const isDone = completedExercises[i];
                  const isHintOpen = expandedHints[`ex_${i}`];
                  return (
                    <div key={i} style={{
                      background: isDone ? `${C.green}08` : "#111827",
                      borderRadius: 8, padding: "10px 12px",
                      borderLeft: `3px solid ${isDone ? C.green : C.amber}30`,
                    }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <button onClick={() => setCompletedExercises(p => ({ ...p, [i]: !p[i] }))} style={{
                          width: 22, height: 22, borderRadius: 4, flexShrink: 0, marginTop: 1,
                          background: isDone ? C.green : "transparent",
                          border: `2px solid ${isDone ? C.green : "#333"}`,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 11, fontWeight: 700,
                        }}>
                          {isDone ? "✓" : ""}
                        </button>
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontFamily: FONT_BODY, fontSize: 13, color: isDone ? C.textTertiary : "#E0E0E0",
                            lineHeight: 1.5,
                          }}>{task}</span>
                          {hint && (
                            <>
                              <button onClick={() => setExpandedHints(p => ({ ...p, [`ex_${i}`]: !p[`ex_${i}`] }))} style={{
                                background: "none", border: "none", cursor: "pointer", padding: "2px 0", display: "block",
                                fontFamily: FONT_MONO, fontSize: 11, color: C.amber, marginTop: 4,
                              }}>
                                {isHintOpen ? "hide hint ▴" : "need a hint? ▾"}
                              </button>
                              {isHintOpen && (
                                <div style={{
                                  marginTop: 4, padding: "6px 10px", background: `${C.amber}08`,
                                  borderRadius: 4, fontSize: 13, color: C.textTertiary, fontStyle: "italic",
                                  fontFamily: FONT_BODY,
                                }}>
                                  <Lightbulb size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {hint}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <div style={{ padding: "14px 16px", borderBottom: tips.length > 0 ? `1px solid rgba(255,255,255,0.04)` : "none" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.green, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                📚 Resources
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {resources.map((res, i) => {
                  const name = typeof res === "string" ? res : res.name;
                  const url = typeof res === "string" ? null : res.url;
                  const why = typeof res === "string" ? null : res.why;
                  return (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", background: `${C.green}06`, borderRadius: 6 }}>
                      <ArrowRight size={12} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} />
                      <div>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.green, fontWeight: 600, textDecoration: "none", borderBottom: `1px solid ${C.green}44` }}>{name}</a>
                        ) : (
                          <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.green, fontWeight: 600 }}>{name}</span>
                        )}
                        {why && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2, lineHeight: 1.4 }}>{why}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.gold, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <Lightbulb size={10} style={{ display: "inline", verticalAlign: "middle" }} /> Tips
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px", background: `${C.gold}08`, borderRadius: 6, border: `1px solid ${C.gold}12` }}>
                    <AlertTriangle size={11} style={{ color: C.gold, flexShrink: 0 }} />
                    <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{typeof tip === "string" ? tip : tip.text || tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RankBadge({ xp }) {
  const rank = getRank(xp || 0);
  const pct = Math.round(rank.progress * 100);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 0,
      background: `linear-gradient(135deg, ${rank.color}22 0%, ${rank.color}08 100%)`,
      border: `1px solid ${rank.color}44`,
      borderRadius: 20, padding: "3px 4px 3px 10px",
      boxShadow: `0 0 8px ${rank.color}15`,
    }}>
      <span style={{
        fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700,
        color: rank.color,
        letterSpacing: "0.04em",
        textShadow: `0 0 10px ${rank.color}40`,
      }}>
        <Sparkles size={11} style={{ display: "inline" }} /> {rank.name}
      </span>
      {rank.next && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 8 }}>
          <div style={{ width: 40, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: `linear-gradient(90deg, ${rank.color}, ${rank.next.color})`,
              borderRadius: 3, transition: "width 0.6s ease",
              boxShadow: `0 0 4px ${rank.color}60`,
            }} />
          </div>
          <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: `${rank.color}AA` }}>{rank.xp}</span>
        </div>
      )}
      {!rank.next && (
        <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: rank.color, marginLeft: 6, opacity: 0.8 }}>MAX</span>
      )}
    </div>
  );
}

function TasksTab({ linkedTasks, setTasks }) {
  const [activePhase, setActivePhase] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  if (linkedTasks.length === 0) {
    return <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, padding: "20px 0", textAlign: "center" }}>No tasks linked yet.</div>;
  }

  // Group by phase
  const phaseMap = {};
  for (const t of linkedTasks) {
    const phase = (t.tags && t.tags[0]) || "General";
    if (!phaseMap[phase]) phaseMap[phase] = [];
    phaseMap[phase].push(t);
  }
  const phases = Object.entries(phaseMap).map(([name, tasks]) => ({ name, tasks }));
  const phaseColors = [C.blue, C.gold, C.amber, C.green, "#A855F7", C.red];

  const currentPhaseName = activePhase || phases[0]?.name;
  const currentPhase = phases.find(p => p.name === currentPhaseName) || phases[0];
  const totalTasks = linkedTasks.length;
  const completedCount = linkedTasks.filter(t => t.status === "complete").length;

  // Filter tasks in current phase by search
  const phaseTasks = currentPhase ? currentPhase.tasks.filter(t =>
    !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  async function handleStatusChange(taskId, newStatus) {
    const task = linkedTasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = { ...task, status: newStatus, updatedAt: isoNow() };
    await store.save("task", updated);
    if (setTasks) setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
  }

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%`, height: "100%", background: completedCount === totalTasks ? C.green : `linear-gradient(90deg, ${C.blue}, ${C.gold})`, borderRadius: 2, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: completedCount === totalTasks ? C.green : C.textTertiary, fontWeight: 600 }}>{completedCount}/{totalTasks}</span>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.gold, fontSize: 12, fontWeight: 700, fontFamily: FONT_MONO }}>/</span>
        <input type="text" placeholder="search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "8px 12px 8px 24px", background: "#111827", border: `1px solid ${C.borderDefault}`, borderRadius: 6, color: C.textPrimary, fontSize: 12, fontFamily: FONT_MONO, outline: "none", boxSizing: "border-box" }}
          onFocus={e => (e.target.style.borderColor = C.gold)} onBlur={e => (e.target.style.borderColor = C.borderDefault)}
        />
      </div>

      {/* Phase pills */}
      {phases.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {phases.map((phase, pi) => {
            const isActive = phase.name === currentPhaseName;
            const color = phaseColors[pi % phaseColors.length];
            const done = phase.tasks.filter(t => t.status === "complete").length;
            return (
              <button key={phase.name} onClick={() => setActivePhase(phase.name)} style={{
                padding: "5px 12px", borderRadius: 16, border: "none", cursor: "pointer",
                background: isActive ? color : "#111827",
                color: isActive ? "#fff" : C.textTertiary,
                fontSize: 11, fontFamily: FONT_MONO, fontWeight: isActive ? 700 : 400,
                transition: "all 0.2s",
              }}>{phase.name} {done}/{phase.tasks.length}</button>
            );
          })}
        </div>
      )}

      {/* Phase section header */}
      {currentPhase && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: `2px solid ${phaseColors[phases.indexOf(currentPhase) % phaseColors.length]}33` }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: phaseColors[phases.indexOf(currentPhase) % phaseColors.length], textTransform: "uppercase", letterSpacing: 1 }}>{currentPhase.name}</span>
        </div>
      )}

      {/* Task rows — reuse TaskRow with guide me */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {phaseTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            expanded={expandedId === task.id}
            onToggle={() => setExpandedId(expandedId === task.id ? null : task.id)}
            onUpdate={async (updates) => {
              const updated = { ...task, ...updates, updatedAt: isoNow() };
              await store.save("task", updated);
              if (setTasks) setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
            }}
            onDelete={async () => {
              await store.delete("task", task.id);
              if (setTasks) setTasks(prev => prev.filter(t => t.id !== task.id));
            }}
            decisions={[]}
          />
        ))}
      </div>

      {phaseTasks.length === 0 && searchTerm && (
        <div style={{ textAlign: "center", padding: 20, color: C.textTertiary, fontFamily: FONT_BODY, fontSize: 13 }}>No tasks match "{searchTerm}"</div>
      )}

      {/* Completion */}
      {completedCount === totalTasks && totalTasks > 0 && (
        <div style={{ marginTop: 16, padding: "14px 18px", background: `${C.green}10`, borderRadius: 8, border: `1px solid ${C.green}30`, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: C.green }}>All tasks complete!</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginTop: 4 }}>Time to review decisions and close out.</div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, expanded, onToggle, onUpdate, onDelete, tasks, decisions, priorities, documents, setTasks, setDecisions, setPriorities, allProjects }) {
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [headerHovered, setHeaderHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: project.title, description: project.description || "", status: project.status });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [links, setLinks] = useState([]);
  const [linkType, setLinkType] = useState("task");
  const [linkId, setLinkId] = useState("");

  useEffect(() => {
    store.getLinks("project", project.id).then(setLinks);
  }, [project.id]);

  const linkedTasks = tasks.filter(t => links.some(l => l.type === "task" && l.id === t.id));
  const linkedDecisions = decisions.filter(d => links.some(l => l.type === "decision" && l.id === d.id));
  const linkedPriorities = priorities.filter(p => links.some(l => l.type === "priority" && l.id === p.id));
  const linkedDocs = documents.filter(d => links.some(l => l.type === "document" && l.id === d.id));

  // Progress: % of linked tasks complete
  const totalTasks = linkedTasks.length;
  const completeTasks = linkedTasks.filter(t => t.status === "complete").length;
  const progress = totalTasks > 0 ? Math.round((completeTasks / totalTasks) * 100) : 0;

  // Decisions resolved
  const resolvedDecisions = linkedDecisions.filter(d => ["decided", "implementing", "closed"].includes(d.status)).length;

  async function addLink() {
    if (!linkId) return;
    await store.link("project", project.id, linkType, linkId);
    const updated = await store.getLinks("project", project.id);
    setLinks(updated);
    setLinkId("");
    // Award XP
    const xpGain = linkType === "document" ? XP_ACTIONS.document_added : 0;
    if (xpGain > 0) await onUpdate({ xp: (project.xp || 0) + xpGain });
  }

  async function askBC() {
    const q = customPrompt.trim();
    if (!q || aiLoading) return;
    setCustomPrompt("");
    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    try {
      const taskSummary = linkedTasks.map(t => `- [${t.status}] ${t.title}`).join("\n") || "none";
      const decSummary = linkedDecisions.map(d => `- [${d.status}] ${d.title}`).join("\n") || "none";
      const docSummary = linkedDocs.map(d => `- ${d.title}: ${(d.summary || "").slice(0, 100)}`).join("\n") || "none";
      const priSummary = linkedPriorities.map(p => `- [${p.status}] ${p.title}`).join("\n") || "none";
      const ctx = `Project: ${project.title}\nStatus: ${project.status}\nDescription: ${project.description || "none"}\nProgress: ${progress}% (${completeTasks}/${totalTasks} tasks)\n\nLinked Tasks:\n${taskSummary}\n\nLinked Decisions:\n${decSummary}\n\nLinked Priorities:\n${priSummary}\n\nLinked Documents:\n${docSummary}`;
      const response = await callAIForEntity("project", project.id, `${ctx}\n\nQuestion: ${q}`);
      setAiResponse(response);
      // Award XP for AI interaction
      await onUpdate({ xp: (project.xp || 0) + XP_ACTIONS.ai_interaction });
    } catch (err) { setAiError(err.message); }
    finally { setAiLoading(false); }
  }

  async function saveEdit() {
    await onUpdate(editData);
    setEditing(false);
  }

  const rank = getRank(project.xp || 0);
  const hasPlan = !!project.originalPlan;
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: `Tasks (${linkedTasks.length})` },
    { id: "decisions", label: `Decisions (${linkedDecisions.length})` },
    { id: "docs", label: `Docs (${linkedDocs.length})` },
    ...(hasPlan ? [{ id: "plan", label: "Plan" }] : []),
  ];

  // Entities available to link (not already linked)
  const linkableItems = {
    task: tasks.filter(t => !links.some(l => l.type === "task" && l.id === t.id)),
    decision: decisions.filter(d => !links.some(l => l.type === "decision" && l.id === d.id)),
    priority: priorities.filter(p => !links.some(l => l.type === "priority" && l.id === p.id)),
    document: documents.filter(d => !links.some(l => l.type === "document" && l.id === d.id)),
  };

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, overflow: "hidden" }}>
      <div
        onClick={onToggle}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        style={{ padding: "16px 18px", cursor: "pointer", background: headerHovered ? C.bgCardHover : "transparent", transition: "background 0.15s" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.4, marginBottom: 6 }}>
              {project.title}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Badge label={PROJECT_STATUS_LABELS[project.status] || project.status} color={statusColor(project.status)} />
              <RankBadge xp={project.xp} />
              {project.source && project.source !== "manual" && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: project.source === "builder" ? C.gold : C.blue, background: `${project.source === "builder" ? C.gold : C.blue}15`, padding: "1px 5px", borderRadius: 6 }}>{project.source === "builder" ? "AI built" : "imported"}</span>}
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{fmtRelative(project.createdAt)}</span>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
            fontFamily: FONT_MONO, fontSize: 11,
            color: headerHovered ? C.gold : C.textSecondary,
            border: `1px solid ${headerHovered ? C.gold : C.borderDefault}`,
            borderRadius: 10, padding: "2px 8px", transition: "all 0.15s",
          }}>
            {expanded ? "▴ Close" : "▾ Open"}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: progress === 100 ? C.green : C.gold, borderRadius: 3, transition: "width 0.4s ease" }} />
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: progress === 100 ? C.green : C.textTertiary, minWidth: 36 }}>{progress}%</span>
        </div>

        {!expanded && project.description && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.5, marginTop: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {project.description}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}` }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.borderDefault}`, padding: "0 18px" }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "10px 16px", border: "none", cursor: "pointer",
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                background: "transparent",
                color: activeTab === tab.id ? C.gold : C.textTertiary,
                borderBottom: activeTab === tab.id ? `2px solid ${C.gold}` : "2px solid transparent",
                transition: "all 0.15s",
              }}>{tab.label}</button>
            ))}
          </div>

          <div style={{ padding: "16px 18px" }}>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                {editing ? (
                  <div>
                    <FormField label="Title"><Input value={editData.title} onChange={v => setEditData(p => ({ ...p, title: v }))} /></FormField>
                    <FormField label="Description"><Input multiline rows={3} value={editData.description} onChange={v => setEditData(p => ({ ...p, description: v }))} /></FormField>
                    <FormField label="Status">
                      <Select value={editData.status} onChange={v => setEditData(p => ({ ...p, status: v }))} options={PROJECT_STATUSES.map(s => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))} />
                    </FormField>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <Btn variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Btn>
                      <Btn variant="primary" size="sm" onClick={saveEdit}>Save</Btn>
                    </div>
                  </div>
                ) : (
                  <div>
                    {project.description && (
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>
                        {project.description}
                      </div>
                    )}

                    {/* Stats row */}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 16px", flex: "1 1 100px", textAlign: "center" }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, color: C.textPrimary }}>{completeTasks}/{totalTasks}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase" }}>Tasks Done</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 16px", flex: "1 1 100px", textAlign: "center" }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, color: C.textPrimary }}>{resolvedDecisions}/{linkedDecisions.length}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase" }}>Decided</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 16px", flex: "1 1 100px", textAlign: "center" }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, color: C.textPrimary }}>{linkedDocs.length}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase" }}>Documents</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 16px", flex: "1 1 100px", textAlign: "center" }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, color: rank.color }}>{project.xp || 0}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase" }}>XP</div>
                      </div>
                    </div>

                    {/* Rank display */}
                    <div style={{
                      marginBottom: 16, padding: "16px 18px",
                      background: `linear-gradient(135deg, ${rank.color}15 0%, transparent 60%)`,
                      border: `1px solid ${rank.color}33`,
                      borderRadius: 10, position: "relative", overflow: "hidden",
                    }}>
                      {/* Decorative glow */}
                      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${rank.color}20, transparent 70%)`, borderRadius: "50%" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, position: "relative" }}>
                        <span style={{
                          fontSize: 28, lineHeight: 1,
                          textShadow: `0 0 20px ${rank.color}60`,
                        }}><Sparkles size={28} /></span>
                        <div>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: rank.color, letterSpacing: "0.06em", textShadow: `0 0 12px ${rank.color}40` }}>
                            {rank.name}
                          </div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, fontStyle: "italic", marginTop: 2 }}>
                            "{rank.flavor}"
                          </div>
                        </div>
                        <div style={{ marginLeft: "auto", textAlign: "right" }}>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: rank.color }}>{project.xp || 0} <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>XP</span></div>
                        </div>
                      </div>
                      {rank.next && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Progress to {rank.next.name}</span>
                            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: `${rank.next.color}AA` }}>{rank.next.threshold - (project.xp || 0)} XP to go</span>
                          </div>
                          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{
                              width: `${Math.round(rank.progress * 100)}%`, height: "100%",
                              background: `linear-gradient(90deg, ${rank.color}, ${rank.next.color})`,
                              borderRadius: 3, transition: "width 0.6s ease",
                              boxShadow: `0 0 6px ${rank.color}50`,
                            }} />
                          </div>
                          {/* All ranks preview */}
                          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
                            {RANK_LEVELS.map((r, i) => {
                              const isActive = r.name === rank.name;
                              const isPast = r.threshold < rank.threshold;
                              return (
                                <div key={i} style={{ textAlign: "center", opacity: isPast ? 0.4 : isActive ? 1 : 0.25 }}>
                                  <div style={{
                                    fontFamily: FONT_MONO, fontSize: 11, fontWeight: isActive ? 700 : 500,
                                    color: isActive ? r.color : C.textTertiary,
                                    textShadow: isActive ? `0 0 8px ${r.color}60` : "none",
                                  }}>{r.name}</div>
                                  <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.textTertiary }}>{r.threshold}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {!rank.next && (
                        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: rank.color, textAlign: "center", marginTop: 4, letterSpacing: "0.1em", textShadow: `0 0 10px ${rank.color}50` }}>
                          ★ MAX RANK ACHIEVED ★
                        </div>
                      )}
                    </div>

                    {/* Link entity */}
                    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Link to Project</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Select value={linkType} onChange={setLinkType} options={[
                          { value: "task", label: "Task" },
                          { value: "decision", label: "Decision" },
                          { value: "priority", label: "Priority" },
                          { value: "document", label: "Document" },
                        ]} style={{ minWidth: 110 }} />
                        <Select
                          value={linkId}
                          onChange={setLinkId}
                          options={[
                            { value: "", label: `Select ${linkType}...` },
                            ...(linkableItems[linkType] || []).map(item => ({ value: item.id, label: item.title || item.filename || item.id })),
                          ]}
                          style={{ flex: 1, minWidth: 180 }}
                        />
                        <Btn variant="outline" size="sm" onClick={addLink} disabled={!linkId}>Link</Btn>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Btn>
                      {confirmDelete ? (
                        <div style={{ width: "100%", background: `${C.red}10`, border: `1px solid ${C.red}33`, borderRadius: 8, padding: "12px 14px", marginTop: 4 }}>
                          <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.red, fontWeight: 600, marginBottom: 6 }}>Delete this project and all linked items?</div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, marginBottom: 10, lineHeight: 1.5 }}>
                            This will permanently remove:
                            {linkedTasks.length > 0 && <span style={{ display: "block" }}>• {linkedTasks.length} task{linkedTasks.length !== 1 ? "s" : ""}</span>}
                            {linkedDecisions.length > 0 && <span style={{ display: "block" }}>• {linkedDecisions.length} decision{linkedDecisions.length !== 1 ? "s" : ""}</span>}
                            {linkedPriorities.length > 0 && <span style={{ display: "block" }}>• {linkedPriorities.length} priorit{linkedPriorities.length !== 1 ? "ies" : "y"}</span>}
                            {linkedDocs.length > 0 && <span style={{ display: "block" }}>• {linkedDocs.length} document{linkedDocs.length !== 1 ? "s" : ""}</span>}
                            {linkedTasks.length + linkedDecisions.length + linkedPriorities.length + linkedDocs.length === 0 && <span style={{ display: "block" }}>No linked items.</span>}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Btn variant="danger" size="sm" onClick={onDelete}>Delete Everything</Btn>
                            <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn>
                          </div>
                        </div>
                      ) : (
                        <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>Delete</Btn>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <TasksTab linkedTasks={linkedTasks} setTasks={setTasks} />
            )}

            {/* Decisions Tab */}
            {activeTab === "decisions" && (
              <div>
                {linkedDecisions.length === 0 ? (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, padding: "20px 0", textAlign: "center" }}>No decisions linked yet. Use the Overview tab to link decisions.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {linkedDecisions.map(d => (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
                        <Diamond size={10} style={{ color: C.gold }} />
                        <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textPrimary, flex: 1 }}>{d.title}</span>
                        <Badge label={DECISION_STATUS_LABELS[d.status]} color={statusColor(d.status)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Docs Tab */}
            {activeTab === "docs" && (
              <div>
                {linkedDocs.length === 0 ? (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, padding: "20px 0", textAlign: "center" }}>No documents linked yet. Upload docs in Library, then link them here.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {linkedDocs.map(d => (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
                        <FileText size={14} />
                        <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textPrimary, flex: 1 }}>{d.title}</span>
                        <Badge label={d.fileType} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Plan Tab — original AI-generated plan */}
            {activeTab === "plan" && hasPlan && (
              <div>
                {project.originalPlan.bc_analysis && (
                  <div style={{ background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 8, padding: "14px 18px", marginBottom: 16 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue, marginBottom: 8, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> ORIGINAL BC ANALYSIS</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
                      {renderMarkdown(project.originalPlan.bc_analysis)}
                    </div>
                  </div>
                )}

                {(project.originalPlan.milestones || []).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Milestones</div>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                      {project.originalPlan.milestones.map((m, i) => (
                        <div key={i} style={{ minWidth: 170, background: "rgba(255,255,255,0.02)", border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: "10px 12px", flexShrink: 0 }}>
                          <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 3 }}>{m.title}</div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, lineHeight: 1.4 }}>{m.description}</div>
                          {m.phase && <Badge label={m.phase} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(project.originalPlan.tasks || []).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Original Tasks ({project.originalPlan.tasks.length})</div>
                    {project.originalPlan.tasks.map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                        <CheckSquare size={11} style={{ color: C.blue }} />
                        <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textSecondary, flex: 1 }}>{t.title}</span>
                        <Badge label={t.priority || "medium"} color={priorityColor(t.priority)} />
                        {t.phase && <Badge label={t.phase} />}
                      </div>
                    ))}
                  </div>
                )}

                {(project.originalPlan.decisions || []).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Original Decisions ({project.originalPlan.decisions.length})</div>
                    {project.originalPlan.decisions.map((d, i) => (
                      <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Diamond size={11} style={{ color: C.gold }} />
                          <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textSecondary }}>{d.title}</span>
                        </div>
                        {d.context && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginLeft: 22, marginTop: 2 }}>{d.context}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {(project.originalPlan.priorities || []).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Original Priorities ({project.originalPlan.priorities.length})</div>
                    {project.originalPlan.priorities.map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                        <ChevronUp size={11} style={{ color: C.amber }} />
                        <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textSecondary, flex: 1 }}>{p.title}</span>
                        {p.timeframe && <Badge label={PRIORITY_TIMEFRAME_LABELS[p.timeframe] || p.timeframe} />}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginTop: 8 }}>
                  Plan generated {fmtRelative(project.createdAt)}
                </div>
              </div>
            )}

            {/* Ask BC — always visible */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ask BC about this project</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && askBC()}
                  placeholder="What's blocking this project? What should I focus on next?..."
                  disabled={aiLoading}
                  style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "7px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
                />
                <button
                  onClick={askBC}
                  disabled={!customPrompt.trim() || aiLoading}
                  style={{
                    background: customPrompt.trim() && !aiLoading ? C.gold : "transparent",
                    border: `1px solid ${customPrompt.trim() && !aiLoading ? C.gold : C.borderAI}`,
                    borderRadius: 6, padding: "7px 14px",
                    cursor: customPrompt.trim() && !aiLoading ? "pointer" : "not-allowed",
                    color: customPrompt.trim() && !aiLoading ? C.bgPrimary : C.textTertiary,
                    fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
                  }}
                ><Sparkles size={12} /></button>
              </div>
              <AIPanel response={aiResponse} loading={aiLoading} error={aiError} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PROJECT_BUILDER_PROMPT = (description, context) => `You are Base Command (BC), an executive project planning system that doesn't just plan — it teaches, guides, and equips.

The user is describing a new project. Generate a comprehensive, actionable project plan. For every item, include concrete guidance on HOW to do it — instructions, exercises, recommended resources, and suggested approaches. The user should be able to open any task and immediately know what to do next.

TODAY: ${context}

USER DESCRIPTION:
${description}

Return ONLY valid JSON in this exact format:
{
  "title": "Clean, concise project title",
  "description": "2-4 sentence project description covering scope, goals, and success criteria",
  "tasks": [
    {
      "title": "Specific actionable task",
      "description": "1-2 sentences of detail",
      "priority": "critical|high|medium|low",
      "dueOffset": 7,
      "phase": "Phase name",
      "guidance": {
        "instructions": [
          {"step": "Specific action to take (e.g. 'Open terminal and run npm init')", "detail": "Why this matters and what to expect"}
        ],
        "exercises": [
          {"task": "A concrete hands-on exercise to practice", "hint": "A helpful hint if they get stuck"}
        ],
        "resources": [
          {"name": "Specific resource name (e.g. 'MDN Web Docs')", "url": "https://actual-url.com", "why": "How this resource helps with this task"}
        ],
        "tips": ["Practical tip or common pitfall to avoid"]
      }
    }
  ],
  "decisions": [
    {
      "title": "Key decision that will need to be made",
      "context": "What's at stake, what options exist, why this matters",
      "guidance": {
        "considerations": ["Specific factor to weigh when making this decision — tied to the project context"],
        "recommended_approach": [
          {"step": "How to approach this decision", "detail": "What to research, who to talk to"}
        ],
        "resources": [
          {"name": "Resource name", "url": "https://actual-url.com", "why": "How this helps inform the decision"}
        ]
      }
    }
  ],
  "priorities": [
    {
      "title": "Strategic priority this project maps to",
      "description": "Why this matters strategically",
      "timeframe": "this_week|this_month|this_quarter|this_year"
    }
  ],
  "milestones": [
    {
      "title": "Milestone name",
      "description": "What 'done' looks like for this milestone",
      "phase": "Phase name"
    }
  ],
  "bc_analysis": "2-4 sentence strategic analysis: what makes this project succeed or fail, what the user should watch out for, and one specific recommendation. Direct. No fluff."
}

RULES:
- Generate 5-15 tasks, organized by phase. dueOffset is days from today.
- Generate 1-5 decisions — real decision points, not tasks disguised as decisions.
- Generate 1-3 priorities — strategic themes, not individual tasks.
- Generate 2-5 milestones — meaningful phase markers.
- Be specific to the project described. Generic plans are useless.
- Tasks should be concrete enough to act on immediately.
- Guidance must be SPECIFIC to the task, not boilerplate. If the task is "learn terminal navigation", the instructions should include actual terminal commands.
- guidance.instructions should be an array of 3-7 step objects. guidance.exercises should be 1-3 exercise objects. guidance.resources should be 2-4 resource objects with real URLs. guidance.tips should be 1-3 string tips.
- Every resource MUST include a real, working "url" field. Use well-known documentation sites, tutorials, and tools. Do NOT make up URLs — only use URLs you are confident exist.
- Return ONLY the JSON. No markdown fences. No preamble.`;

function ProjectBuilder({ onCommit, onCancel, setDocuments }) {
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editData, setEditData] = useState({});
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [creating, setCreating] = useState(false);

  async function generate() {
    if (!input.trim() || processing) return;
    setProcessing(true);
    setPlan(null);
    setError("");
    try {
      const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const sysPrompt = "You are a precise project planning system. Return only valid JSON as instructed.";
      let raw = await callAI(
        [{ role: "user", content: PROJECT_BUILDER_PROMPT(input.trim(), today) }],
        sysPrompt,
        16000
      );
      let cleaned = raw.replace(/```json|```/g, "").trim();

      // If truncated, get the rest
      if (raw.stop_reason === "max_tokens") {
        try {
          const continuation = await callAI(
            [
              { role: "user", content: PROJECT_BUILDER_PROMPT(input.trim(), today) },
              { role: "assistant", content: String(raw) },
              { role: "user", content: "Your response was cut off. Continue the JSON from exactly where you stopped. Output ONLY the remaining JSON to complete the structure. Do NOT repeat any content." },
            ],
            sysPrompt,
            16000
          );
          cleaned = (String(raw) + String(continuation)).replace(/```json|```/g, "").trim();
        } catch (_) { /* continuation fetch failed — use original response */ }
      }

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Try repair
        const fixes = [cleaned + "]}", cleaned + '"}]}', cleaned + '"}],"decisions":[],"priorities":[],"milestones":[],"bc_analysis":"Plan parsed."}'];
        for (const fix of fixes) { try { parsed = JSON.parse(fix); break; } catch {} }
        if (!parsed) throw new Error("Invalid JSON");
      }

      setPlan(parsed);
      // Select everything by default
      const sel = {};
      (parsed.tasks || []).forEach((_, i) => { sel[`task_${i}`] = true; });
      (parsed.decisions || []).forEach((_, i) => { sel[`decision_${i}`] = true; });
      (parsed.priorities || []).forEach((_, i) => { sel[`priority_${i}`] = true; });
      setSelected(sel);
    } catch (e) {
      setError("Failed to generate project plan. Check the API connection and try again.");
    } finally {
      setProcessing(false);
    }
  }

  async function refine() {
    if (!refinePrompt.trim() || !plan || refining) return;
    const prompt = refinePrompt.trim();
    setRefinePrompt("");
    setRefining(true);
    setError("");
    try {
      const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const raw = await callAI(
        [
          { role: "user", content: PROJECT_BUILDER_PROMPT(input.trim(), today) },
          { role: "assistant", content: JSON.stringify(plan) },
          { role: "user", content: `Refine this project plan based on this feedback. Return the COMPLETE updated plan in the same JSON format. Feedback: ${prompt}` },
        ],
        "You are a precise project planning system. Return only valid JSON as instructed.",
        16000
      );
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setPlan(parsed);
      const sel = {};
      (parsed.tasks || []).forEach((_, i) => { sel[`task_${i}`] = true; });
      (parsed.decisions || []).forEach((_, i) => { sel[`decision_${i}`] = true; });
      (parsed.priorities || []).forEach((_, i) => { sel[`priority_${i}`] = true; });
      setSelected(sel);
    } catch (e) {
      setError("Failed to refine plan. Try again.");
    } finally {
      setRefining(false);
    }
  }

  function startEdit(type, index, item) {
    setEditingItem(`${type}_${index}`);
    setEditData({ ...item });
  }

  function saveEdit(type, index) {
    if (!plan) return;
    const updated = { ...plan };
    const key = type === "task" ? "tasks" : type === "decision" ? "decisions" : "priorities";
    updated[key] = [...updated[key]];
    updated[key][index] = { ...updated[key][index], ...editData };
    setPlan(updated);
    setEditingItem(null);
    setEditData({});
  }

  function cancelEdit() {
    setEditingItem(null);
    setEditData({});
  }

  async function commit() {
    if (!plan || creating) return;
    setCreating(true);
    const ts = isoNow();
    const now = new Date();

    // Create project — save full original plan for history
    const project = {
      id: genId("proj"),
      title: plan.title,
      description: plan.description,
      status: "active",
      xp: 0,
      milestones: plan.milestones || [],
      originalPlan: plan,
      source: "builder",
      createdAt: ts,
      updatedAt: ts,
    };
    await store.save("project", project);

    // Create selected tasks and link to project
    const createdTasks = [];
    for (const [i, task] of (plan.tasks || []).entries()) {
      if (!selected[`task_${i}`]) continue;
      const dueDate = task.dueOffset
        ? new Date(now.getTime() + task.dueOffset * 86400000).toISOString().split("T")[0]
        : null;
      // Build rich description including guidance
      let fullDesc = task.description || "";
      if (task.guidance) {
        const g = task.guidance;
        const parts = [];
        if (g.instructions) parts.push(`## Instructions\n${g.instructions}`);
        if (g.exercises) parts.push(`## Exercises\n${g.exercises}`);
        if (g.resources) parts.push(`## Resources\n${g.resources}`);
        if (g.tips) parts.push(`## Tips\n${g.tips}`);
        if (parts.length > 0) fullDesc += (fullDesc ? "\n\n---\n\n" : "") + parts.join("\n\n");
      }
      const t = {
        id: genId("task"),
        title: task.title,
        description: fullDesc,
        status: "open",
        priority: task.priority || "medium",
        dueDate,
        sourceDecisionId: null,
        source: "project",
        linkedPriorities: [],
        subtasks: [],
        tags: task.phase ? [task.phase] : [],
        guidance: task.guidance || null,
        createdAt: ts,
        updatedAt: ts,
      };
      await store.save("task", t);
      await store.link("project", project.id, "task", t.id);
      createdTasks.push(t);
    }

    // Create selected decisions and link to project
    const createdDecisions = [];
    for (const [i, dec] of (plan.decisions || []).entries()) {
      if (!selected[`decision_${i}`]) continue;
      let fullContext = dec.context || "";
      if (dec.guidance) {
        const g = dec.guidance;
        const parts = [];
        if (g.considerations) parts.push(`## Key Considerations\n${g.considerations}`);
        if (g.recommended_approach) parts.push(`## Recommended Approach\n${g.recommended_approach}`);
        if (g.resources) parts.push(`## Resources\n${g.resources}`);
        if (parts.length > 0) fullContext += (fullContext ? "\n\n---\n\n" : "") + parts.join("\n\n");
      }
      const d = {
        id: genId("dec"),
        title: dec.title,
        context: fullContext,
        status: "draft",
        options: [],
        outcome: "",
        rationale: "",
        risks: "",
        linkedTasks: [],
        linkedPriorities: [],
        tags: [],
        templateType: "blank",
        guidance: dec.guidance || null,
        source: "project",
        createdAt: ts,
        updatedAt: ts,
      };
      await store.save("decision", d);
      await store.link("project", project.id, "decision", d.id);
      createdDecisions.push(d);
    }

    // Create selected priorities and link to project
    const createdPriorities = [];
    const existingPriorities = await store.list("priority");
    for (const [i, pri] of (plan.priorities || []).entries()) {
      if (!selected[`priority_${i}`]) continue;
      const p = {
        id: genId("pri"),
        title: pri.title,
        description: pri.description || "",
        rank: existingPriorities.length + createdPriorities.length + 1,
        timeframe: pri.timeframe || "this_quarter",
        status: "active",
        successMetrics: [],
        healthScore: null,
        linkedDecisions: [],
        linkedTasks: [],
        tags: [],
        source: "project",
        createdAt: ts,
        updatedAt: ts,
      };
      await store.save("priority", p);
      await store.link("project", project.id, "priority", p.id);
      createdPriorities.push(p);
    }

    // ─── Auto-create Library documents ─────────────────────────
    const createdDocs = [];

    // 1. Project Roadmap document
    const roadmapParts = [`# ${plan.title} — Roadmap\n`];
    if (plan.description) roadmapParts.push(`## Overview\n${plan.description}\n`);
    if (plan.bc_analysis) roadmapParts.push(`## BC Analysis\n${plan.bc_analysis}\n`);
    if ((plan.milestones || []).length > 0) {
      roadmapParts.push(`## Milestones`);
      plan.milestones.forEach((m, i) => roadmapParts.push(`${i + 1}. **${m.title}** — ${m.description}${m.phase ? ` _(${m.phase})_` : ""}`));
      roadmapParts.push("");
    }
    if (createdTasks.length > 0) {
      roadmapParts.push(`## Tasks (${createdTasks.length})`);
      createdTasks.forEach(t => roadmapParts.push(`- [ ] ${t.title} _(${t.priority})_`));
      roadmapParts.push("");
    }
    if (createdDecisions.length > 0) {
      roadmapParts.push(`## Decisions (${createdDecisions.length})`);
      createdDecisions.forEach(d => roadmapParts.push(`- ${d.title}`));
      roadmapParts.push("");
    }
    const roadmapContent = roadmapParts.join("\n");
    const roadmapDoc = {
      id: genId("doc"),
      title: `${plan.title} — Roadmap`,
      filename: `${plan.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase()}-roadmap.md`,
      fileType: "md",
      content: roadmapContent,
      summary: `Project roadmap for "${plan.title}". ${(plan.milestones || []).length} milestones, ${createdTasks.length} tasks, ${createdDecisions.length} decisions.`,
      fileSize: new Blob([roadmapContent]).size,
      projectId: project.id,
      source: "project",
      createdAt: ts,
      updatedAt: ts,
    };
    await store.save("document", roadmapDoc);
    await store.link("project", project.id, "document", roadmapDoc.id);
    createdDocs.push(roadmapDoc);

    // 2. Task Guide document — structured JSON for interactive cheat-sheet renderer
    const guidedTasks = (plan.tasks || []).filter((t, i) => selected[`task_${i}`] && t.guidance);
    if (guidedTasks.length > 0) {
      const guideJSON = {
        projectTitle: plan.title,
        tasks: guidedTasks.map(task => {
          const g = task.guidance;
          return {
            title: task.title,
            description: task.description || "",
            steps: g.instructions
              ? (Array.isArray(g.instructions) ? g.instructions : [{ step: g.instructions }]).map(s =>
                  typeof s === "string" ? { step: s } : { step: s.step, detail: s.detail || null })
              : [],
            exercises: g.exercises
              ? (Array.isArray(g.exercises) ? g.exercises : [{ task: g.exercises }]).map(ex =>
                  typeof ex === "string" ? { task: ex } : { task: ex.task, hint: ex.hint || null })
              : [],
            resources: g.resources
              ? (Array.isArray(g.resources) ? g.resources : [{ name: g.resources }]).map(r =>
                  typeof r === "string" ? { name: r } : { name: r.name, url: r.url || null, why: r.why || null })
              : [],
            tips: g.tips
              ? (Array.isArray(g.tips) ? g.tips : [g.tips]).map(tip => typeof tip === "string" ? tip : tip.text || String(tip))
              : [],
          };
        }),
      };
      const guideContent = JSON.stringify(guideJSON);
      const guideDoc = {
        id: genId("doc"),
        title: `${plan.title} — Task Guide`,
        filename: `${plan.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase()}-task-guide.guide`,
        fileType: "guide",
        content: guideContent,
        summary: `Interactive task guide with step-by-step instructions for ${guidedTasks.length} tasks in "${plan.title}".`,
        fileSize: new Blob([guideContent]).size,
        projectId: project.id,
        source: "project",
        createdAt: ts,
        updatedAt: ts,
      };
      await store.save("document", guideDoc);
      await store.link("project", project.id, "document", guideDoc.id);
      createdDocs.push(guideDoc);
    }

    // Refresh documents state
    if (setDocuments) {
      const allDocs = await store.list("document");
      setDocuments(allDocs);
    }

    onCommit({
      project,
      tasks: createdTasks,
      decisions: createdDecisions,
      priorities: createdPriorities,
    });
  }

  const TYPE_META = {
    task: { label: "Task", color: C.blue, icon: <CheckSquare size={11} /> },
    decision: { label: "Decision", color: C.gold, icon: <Diamond size={11} /> },
    priority: { label: "Priority", color: C.amber, icon: <ChevronUp size={11} /> },
  };

  const totalSelected = Object.values(selected).filter(Boolean).length;

  // Group tasks by phase
  function groupTasksByPhase(tasks) {
    const phases = [];
    const phaseMap = {};
    for (const [i, t] of tasks.entries()) {
      const phase = t.phase || "General";
      if (!phaseMap[phase]) {
        phaseMap[phase] = { label: phase, items: [] };
        phases.push(phaseMap[phase]);
      }
      phaseMap[phase].items.push({ ...t, _index: i });
    }
    return phases;
  }

  return (
    <div>
      {/* Step 1: Describe */}
      {!plan && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> Describe Your Project</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 16 }}>
              Tell BC what you're working on. Be as detailed or brief as you want — BC will build out a full project plan with tasks, decisions, and milestones.
            </div>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={"Describe your project...\n\nExamples:\n• Building an AI-powered decision tool, need to ship MVP in 6 weeks\n• Evaluating a Senior AE role at Dropbox — research comp, prep interviews, decide by month end\n• Launching renewal AI agents for enterprise accounts, need pilot plan and stakeholder buy-in"}
            style={{
              width: "100%", minHeight: 200,
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 8, padding: 16, resize: "vertical",
              color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14,
              lineHeight: 1.6, outline: "none",
            }}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate(); }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.textTertiary, fontFamily: FONT_MONO }}>
                {input.length > 0 ? `${input.length} characters` : "⌘↵ to generate"}
              </span>
              <Btn variant="ghost" size="sm" onClick={onCancel}>Cancel</Btn>
            </div>
            <button
              onClick={generate}
              disabled={!input.trim() || processing}
              style={{
                background: input.trim() && !processing ? C.gold : "rgba(212,168,83,0.2)",
                color: input.trim() && !processing ? C.bgPrimary : C.textTertiary,
                border: "none", borderRadius: 6, padding: "9px 20px",
                fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600,
                cursor: input.trim() && !processing ? "pointer" : "not-allowed",
              }}
            >
              {processing ? <><Sparkles size={12} style={{ display: "inline" }} /> Building Plan...</> : <><Sparkles size={12} style={{ display: "inline" }} /> Build Project Plan</>}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 6, fontSize: 13, color: C.red, fontFamily: FONT_BODY }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review Plan */}
      {plan && !creating && (
        <div>
          {/* Plan header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>
              {plan.title}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>
              {plan.description}
            </div>
          </div>

          {/* BC Analysis */}
          {plan.bc_analysis && (
            <div style={{
              background: C.bgAI, border: `1px solid ${C.borderAI}`,
              borderRadius: 8, padding: "14px 18px", marginBottom: 24,
            }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue, marginBottom: 8, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> BASE COMMAND</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textPrimary, lineHeight: 1.6 }}>
                {renderMarkdown(plan.bc_analysis)}
              </div>
            </div>
          )}

          {/* Milestones */}
          {(plan.milestones || []).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Milestones</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {plan.milestones.map((m, i) => (
                  <div key={i} style={{
                    minWidth: 180, background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                    borderRadius: 8, padding: "12px 14px", flexShrink: 0,
                  }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{m.title}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.4 }}>{m.description}</div>
                    {m.phase && <Badge label={m.phase} color={C.textTertiary} bg="rgba(255,255,255,0.04)" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks — grouped by phase */}
          {(plan.tasks || []).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tasks ({plan.tasks.length})</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { const s = { ...selected }; plan.tasks.forEach((_, i) => s[`task_${i}`] = true); setSelected(s); }}
                    style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO }}>All</button>
                  <button onClick={() => { const s = { ...selected }; plan.tasks.forEach((_, i) => s[`task_${i}`] = false); setSelected(s); }}
                    style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO }}>None</button>
                </div>
              </div>
              {groupTasksByPhase(plan.tasks).map((phase, pi) => (
                <div key={pi} style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{phase.label}</div>
                  {phase.items.map(task => {
                    const i = task._index;
                    const key = `task_${i}`;
                    const isSelected = selected[key];
                    const isEditing = editingItem === key;
                    return (
                      <div key={i}
                        style={{
                          display: "flex", gap: 12, alignItems: "flex-start",
                          background: isSelected ? C.bgCardHover : C.bgCard,
                          border: `1px solid ${isSelected ? C.borderActive : C.borderDefault}`,
                          borderRadius: 8, padding: "12px 14px", marginBottom: 6,
                          transition: "all 0.15s",
                        }}
                      >
                        <div onClick={() => setSelected(s => ({ ...s, [key]: !s[key] }))}
                          style={{
                            width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, cursor: "pointer",
                            border: `2px solid ${isSelected ? C.gold : C.borderDefault}`,
                            background: isSelected ? C.gold : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                          {isSelected && <span style={{ color: C.bgPrimary, fontSize: 11, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {isEditing ? (
                            <div>
                              <Input value={editData.title || ""} onChange={v => setEditData(p => ({ ...p, title: v }))} style={{ marginBottom: 6 }} />
                              <Input multiline rows={2} value={editData.description || ""} onChange={v => setEditData(p => ({ ...p, description: v }))} style={{ marginBottom: 6 }} />
                              <div style={{ display: "flex", gap: 8 }}>
                                <Select value={editData.priority || "medium"} onChange={v => setEditData(p => ({ ...p, priority: v }))} options={TASK_PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} />
                                <Btn variant="primary" size="sm" onClick={() => saveEdit("task", i)}>Save</Btn>
                                <Btn variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Btn>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                                <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.blue, background: `${C.blue}18`, padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><CheckSquare size={11} /> Task</span>
                                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: priorityColor(task.priority) }}>{task.priority}</span>
                                {task.dueOffset && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>+{task.dueOffset}d</span>}
                                <button onClick={() => startEdit("task", i, task)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto", padding: "2px 6px" }}>edit</button>
                              </div>
                              <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary, marginBottom: task.description ? 3 : 0 }}>{task.title}</div>
                              {task.description && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{task.description}</div>}
                              {task.guidance && (
                                <GuidancePanel guidance={task.guidance} type="task" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Decisions */}
          {(plan.decisions || []).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Decisions ({plan.decisions.length})</div>
              {plan.decisions.map((dec, i) => {
                const key = `decision_${i}`;
                const isSelected = selected[key];
                const isEditing = editingItem === key;
                return (
                  <div key={i}
                    style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      background: isSelected ? C.bgCardHover : C.bgCard,
                      border: `1px solid ${isSelected ? C.borderActive : C.borderDefault}`,
                      borderRadius: 8, padding: "12px 14px", marginBottom: 6,
                      transition: "all 0.15s",
                    }}
                  >
                    <div onClick={() => setSelected(s => ({ ...s, [key]: !s[key] }))}
                      style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, cursor: "pointer",
                        border: `2px solid ${isSelected ? C.gold : C.borderDefault}`,
                        background: isSelected ? C.gold : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      {isSelected && <span style={{ color: C.bgPrimary, fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isEditing ? (
                        <div>
                          <Input value={editData.title || ""} onChange={v => setEditData(p => ({ ...p, title: v }))} style={{ marginBottom: 6 }} />
                          <Input multiline rows={2} value={editData.context || ""} onChange={v => setEditData(p => ({ ...p, context: v }))} style={{ marginBottom: 6 }} />
                          <div style={{ display: "flex", gap: 8 }}>
                            <Btn variant="primary" size="sm" onClick={() => saveEdit("decision", i)}>Save</Btn>
                            <Btn variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Btn>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.gold, background: `${C.gold}18`, padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><Diamond size={11} /> Decision</span>
                            <button onClick={() => startEdit("decision", i, dec)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto", padding: "2px 6px" }}>edit</button>
                          </div>
                          <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary, marginBottom: dec.context ? 3 : 0 }}>{dec.title}</div>
                          {dec.context && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{dec.context}</div>}
                          {dec.guidance && (
                            <GuidancePanel guidance={dec.guidance} type="decision" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Priorities */}
          {(plan.priorities || []).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Priorities ({plan.priorities.length})</div>
              {plan.priorities.map((pri, i) => {
                const key = `priority_${i}`;
                const isSelected = selected[key];
                const isEditing = editingItem === key;
                return (
                  <div key={i}
                    style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      background: isSelected ? C.bgCardHover : C.bgCard,
                      border: `1px solid ${isSelected ? C.borderActive : C.borderDefault}`,
                      borderRadius: 8, padding: "12px 14px", marginBottom: 6,
                      transition: "all 0.15s",
                    }}
                  >
                    <div onClick={() => setSelected(s => ({ ...s, [key]: !s[key] }))}
                      style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, cursor: "pointer",
                        border: `2px solid ${isSelected ? C.gold : C.borderDefault}`,
                        background: isSelected ? C.gold : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      {isSelected && <span style={{ color: C.bgPrimary, fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isEditing ? (
                        <div>
                          <Input value={editData.title || ""} onChange={v => setEditData(p => ({ ...p, title: v }))} style={{ marginBottom: 6 }} />
                          <Input multiline rows={2} value={editData.description || ""} onChange={v => setEditData(p => ({ ...p, description: v }))} style={{ marginBottom: 6 }} />
                          <div style={{ display: "flex", gap: 8 }}>
                            <Btn variant="primary" size="sm" onClick={() => saveEdit("priority", i)}>Save</Btn>
                            <Btn variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Btn>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.amber, background: `${C.amber}18`, padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><ChevronUp size={11} /> Priority</span>
                            {pri.timeframe && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{PRIORITY_TIMEFRAME_LABELS[pri.timeframe] || pri.timeframe}</span>}
                            <button onClick={() => startEdit("priority", i, pri)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto", padding: "2px 6px" }}>edit</button>
                          </div>
                          <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary, marginBottom: pri.description ? 3 : 0 }}>{pri.title}</div>
                          {pri.description && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{pri.description}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Refine with BC */}
          <div style={{ marginBottom: 20, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Refine with BC</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={refinePrompt}
                onChange={e => setRefinePrompt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && refine()}
                placeholder="Add more tasks for interview prep, make the timeline less aggressive, split phase 1..."
                disabled={refining}
                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
              />
              <button
                onClick={refine}
                disabled={!refinePrompt.trim() || refining}
                style={{
                  background: refinePrompt.trim() && !refining ? C.gold : "transparent",
                  border: `1px solid ${refinePrompt.trim() && !refining ? C.gold : C.borderAI}`,
                  borderRadius: 6, padding: "7px 14px",
                  cursor: refinePrompt.trim() && !refining ? "pointer" : "not-allowed",
                  color: refinePrompt.trim() && !refining ? C.bgPrimary : C.textTertiary,
                  fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
                }}
              >{refining ? "..." : <Sparkles size={12} />}</button>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: "10px 14px", background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 6, fontSize: 13, color: C.red, fontFamily: FONT_BODY }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setPlan(null)}>Start Over</Btn>
            <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
            <button
              onClick={commit}
              disabled={totalSelected === 0}
              style={{
                background: totalSelected > 0 ? C.gold : "rgba(212,168,83,0.2)",
                color: totalSelected > 0 ? C.bgPrimary : C.textTertiary,
                border: "none", borderRadius: 6, padding: "9px 20px",
                fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600,
                cursor: totalSelected > 0 ? "pointer" : "not-allowed",
              }}
            >
              Create Project + {totalSelected} Item{totalSelected !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 1: Extract just titles (ultra compact, can't truncate)
const IMPORT_EXTRACT_PROMPT = (content) => `Extract every action item, task, step, and to-do from this document. Return ONLY a JSON array of short title strings. One string per item. Do NOT combine or consolidate items.

Example output: ["Set up dev environment","Install dependencies","Create database schema","Write API endpoints"]

DOCUMENT:
${content}`;

// Step 2: Build ONLY project metadata (no tasks — those come from Step 1 titles)
const IMPORT_STRUCTURE_PROMPT = (content, taskTitles) => `Analyze this document and return project metadata. Do NOT return tasks — they are already extracted separately.

DOCUMENT:
${content}

EXTRACTED TASKS (for context only — do NOT include in output):
${taskTitles.slice(0, 10).join(", ")}${taskTitles.length > 10 ? ` ... and ${taskTitles.length - 10} more` : ""}

Return ONLY valid JSON (no markdown fences):
{"title":"Project title","description":"2-3 sentence summary","taskPhases":{"task title":"Phase name","another task":"Phase name"},"decisions":[{"title":"Decision","context":"Brief"}],"priorities":[{"title":"Priority","description":"Brief","timeframe":"this_quarter"}],"milestones":[{"title":"Milestone","description":"Done looks like","phase":"Phase"}],"bc_analysis":"Brief assessment."}

RULES:
- taskPhases maps task titles to logical phase/category names. Include as many as you can.
- Do NOT include a "tasks" array. Tasks are handled separately.
- Keep everything concise.`;

function ProjectModePicker({ onSelect, onCancel }) {
  const [hovered, setHovered] = useState(null);
  const modes = [
    {
      id: "ai",
      icon: "✦",
      title: "Build with BC",
      desc: "Describe your project and BC generates a full plan with tasks, decisions, and guidance.",
      note: "Uses AI credits",
      color: C.gold,
    },
    {
      id: "import",
      icon: "↑",
      title: "Import a Plan",
      desc: "Upload a project plan you built elsewhere — in Claude, a doc, notes. BC parses it into structure.",
      note: "Minimal AI usage",
      color: C.blue,
    },
    {
      id: "scratch",
      icon: <CheckSquare size={24} />,
      title: "Start from Scratch",
      desc: "Create a blank project and add tasks, decisions, and documents manually as you go.",
      note: "No AI needed",
      color: C.textSecondary,
    },
  ];

  return (
    <div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>How do you want to start?</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {modes.map(m => {
          const isHov = hovered === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                flex: "1 1 200px", minWidth: 200,
                background: isHov ? `${m.color}12` : C.bgCard,
                border: `1px solid ${isHov ? m.color : C.borderDefault}`,
                borderRadius: 10, padding: "20px 18px",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 10, color: m.color, textShadow: isHov ? `0 0 12px ${m.color}40` : "none" }}>{m.icon}</div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{m.title}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.5, marginBottom: 10 }}>{m.desc}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: m.color, opacity: 0.8 }}>{m.note}</div>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        <Btn variant="ghost" size="sm" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function ProjectImporter({ onCommit, onCancel, setDocuments }) {
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editData, setEditData] = useState({});
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef(null);

  async function handleFileUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    try {
      const content = await extractFileContent(f);
      if (content) setInput(content);
      else setError(`Could not read ${f.name}`);
    } catch (err) {
      setError(`Error reading file: ${err.message}`);
    }
  }

  // Local extraction — always works, no AI needed
  function extractTasksLocally(text) {
    const lines = text.split("\n").map(l => l.trim());
    return lines
      .filter(l => /^[-•*]\s|^\d+[\.\)]\s|^☐\s|^\[\s?\]\s|^>\s/.test(l))
      .map(l => l.replace(/^[-•*☐>]\s*|^\d+[\.\)]\s*|^\[\s?\]\s*/, "").trim())
      .filter(l => l.length > 3 && l.length < 200);
  }

  async function parse() {
    if (!input.trim() || processing) return;
    setProcessing(true);
    setPlan(null);
    setError("");
    try {
      const sysPrompt = "You are a precise document parser. Return only valid JSON as instructed.";
      const rawText = input.trim();

      // Always extract locally as safety net
      const localTitles = extractTasksLocally(rawText);

      // STEP 1: Extract task titles via AI
      let taskTitles = [];
      try {
        const titlesRaw = await callAI(
          [{ role: "user", content: IMPORT_EXTRACT_PROMPT(rawText) }],
          sysPrompt,
          8000
        );
        const titlesClean = String(titlesRaw).replace(/```json|```/g, "").trim();
        const aiTitles = JSON.parse(titlesClean);
        if (Array.isArray(aiTitles) && aiTitles.length > 0) {
          taskTitles = aiTitles.filter(t => typeof t === "string" && t.length > 0);
        }
      } catch (_) { /* AI extraction failed, fall back to local */ }

      // Use whichever found more tasks (AI or local), merge unique from both
      if (localTitles.length > taskTitles.length) {
        const existing = new Set(localTitles.map(t => t.toLowerCase()));
        const extras = taskTitles.filter(t => !existing.has(t.toLowerCase()));
        taskTitles = [...localTitles, ...extras];
      } else if (localTitles.length > 0) {
        const existing = new Set(taskTitles.map(t => t.toLowerCase()));
        const extras = localTitles.filter(t => !existing.has(t.toLowerCase()));
        if (extras.length > 0) {
          taskTitles = [...taskTitles, ...extras];
        }
      }

      if (taskTitles.length === 0) {
        setError("Could not find any tasks in this document. Try formatting items as bullet points or numbered lists.");
        return;
      }

      // STEP 2: Get project metadata only (no tasks)
      let meta = null;
      try {
        const structRaw = await callAI(
          [{ role: "user", content: IMPORT_STRUCTURE_PROMPT(rawText, taskTitles) }],
          sysPrompt,
          4000
        );
        const structClean = String(structRaw).replace(/```json|```/g, "").trim();
        meta = JSON.parse(structClean);
      } catch (_) { /* metadata extraction failed, use defaults */ }

      if (!meta) {
        meta = { title: "Imported Project", description: rawText.slice(0, 200), taskPhases: {}, decisions: [], priorities: [], milestones: [], bc_analysis: "Project imported from document." };
      }

      // STEP 3: Build ALL tasks from titles (the single source of truth)
      const phaseMap = meta.taskPhases || {};
      const tasks = taskTitles.map(title => {
        const phase = phaseMap[title] || Object.entries(phaseMap).find(([k]) => k.toLowerCase() === title.toLowerCase())?.[1] || "General";
        return { title, description: "", priority: "medium", dueOffset: null, phase };
      });

      const parsed = {
        title: meta.title || "Imported Project",
        description: meta.description || "",
        tasks,
        decisions: Array.isArray(meta.decisions) ? meta.decisions : [],
        priorities: Array.isArray(meta.priorities) ? meta.priorities : [],
        milestones: Array.isArray(meta.milestones) ? meta.milestones : [],
        bc_analysis: meta.bc_analysis || "",
      };

      setPlan(parsed);
      const sel = {};
      parsed.tasks.forEach((_, i) => { sel[`task_${i}`] = true; });
      (parsed.decisions || []).forEach((_, i) => { sel[`decision_${i}`] = true; });
      (parsed.priorities || []).forEach((_, i) => { sel[`priority_${i}`] = true; });
      setSelected(sel);
    } catch (e) {
      setError("Failed to parse document: " + e.message);
    } finally {
      setProcessing(false);
    }
  }

  // Reuse the same edit/commit logic as ProjectBuilder
  function startEdit(type, index, item) {
    setEditingItem(`${type}_${index}`);
    setEditData({ ...item });
  }
  function saveEdit(type, index) {
    if (!plan) return;
    const updated = { ...plan };
    const key = type === "task" ? "tasks" : type === "decision" ? "decisions" : "priorities";
    updated[key] = [...updated[key]];
    updated[key][index] = { ...updated[key][index], ...editData };
    setPlan(updated);
    setEditingItem(null);
    setEditData({});
  }
  function cancelEdit() { setEditingItem(null); setEditData({}); }

  async function commit() {
    if (!plan || creating) return;
    setCreating(true);
    const ts = isoNow();
    const now = new Date();

    const project = {
      id: genId("proj"),
      title: plan.title,
      description: plan.description,
      status: "active",
      xp: 0,
      milestones: plan.milestones || [],
      originalPlan: plan,
      importedFrom: file ? file.name : "pasted content",
      source: "import",
      createdAt: ts,
      updatedAt: ts,
    };
    await store.save("project", project);

    let createdTaskCount = 0;
    for (const [i, task] of (plan.tasks || []).entries()) {
      const key = `task_${i}`;
      const isSelected = selected[key];
      if (!isSelected) continue;
      const dueDate = task.dueOffset ? new Date(now.getTime() + task.dueOffset * 86400000).toISOString().split("T")[0] : null;
      let fullDesc = task.description || "";
      if (task.guidance) {
        const g = task.guidance;
        const parts = [];
        if (g.instructions) parts.push(`## Instructions\n${Array.isArray(g.instructions) ? g.instructions.map(s => typeof s === "string" ? s : s.step).join("\n") : g.instructions}`);
        if (g.exercises) parts.push(`## Exercises\n${Array.isArray(g.exercises) ? g.exercises.map(e => typeof e === "string" ? e : e.task).join("\n") : g.exercises}`);
        if (g.resources) parts.push(`## Resources\n${Array.isArray(g.resources) ? g.resources.map(r => typeof r === "string" ? r : r.name).join("\n") : g.resources}`);
        if (g.tips) parts.push(`## Tips\n${Array.isArray(g.tips) ? g.tips.join("\n") : g.tips}`);
        if (parts.length > 0) fullDesc += (fullDesc ? "\n\n---\n\n" : "") + parts.join("\n\n");
      }
      const t = { id: genId("task"), title: task.title, description: fullDesc, status: "open", priority: task.priority || "medium", dueDate, sourceDecisionId: null, source: "project", linkedPriorities: [], subtasks: [], tags: task.phase ? [task.phase] : [], guidance: task.guidance || null, createdAt: ts, updatedAt: ts };
      await store.save("task", t);
      await store.link("project", project.id, "task", t.id);
      createdTaskCount++;
    }
    for (const [i, dec] of (plan.decisions || []).entries()) {
      if (!selected[`decision_${i}`]) continue;
      let fullContext = dec.context || "";
      if (dec.guidance) {
        const g = dec.guidance;
        const parts = [];
        if (g.considerations) parts.push(`## Key Considerations\n${g.considerations}`);
        if (g.recommended_approach) parts.push(`## Recommended Approach\n${g.recommended_approach}`);
        if (g.resources) parts.push(`## Resources\n${g.resources}`);
        if (parts.length > 0) fullContext += (fullContext ? "\n\n---\n\n" : "") + parts.join("\n\n");
      }
      const d = { id: genId("dec"), title: dec.title, context: fullContext, status: "draft", options: [], outcome: "", rationale: "", risks: "", linkedTasks: [], linkedPriorities: [], tags: [], templateType: "blank", guidance: dec.guidance || null, source: "project", createdAt: ts, updatedAt: ts };
      await store.save("decision", d);
      await store.link("project", project.id, "decision", d.id);
    }

    const existingPriorities = await store.list("priority");
    let priCount = 0;
    for (const [i, pri] of (plan.priorities || []).entries()) {
      if (!selected[`priority_${i}`]) continue;
      const p = { id: genId("pri"), title: pri.title, description: pri.description || "", rank: existingPriorities.length + priCount + 1, timeframe: pri.timeframe || "this_quarter", status: "active", successMetrics: [], healthScore: null, linkedDecisions: [], linkedTasks: [], tags: [], source: "project", createdAt: ts, updatedAt: ts };
      await store.save("priority", p);
      await store.link("project", project.id, "priority", p.id);
      priCount++;
    }

    // Auto-create roadmap document for imported project
    const roadmapParts = [`# ${plan.title} — Roadmap\n`];
    if (plan.description) roadmapParts.push(`## Overview\n${plan.description}\n`);
    if (plan.bc_analysis) roadmapParts.push(`## BC Analysis\n${plan.bc_analysis}\n`);
    if ((plan.milestones || []).length > 0) {
      roadmapParts.push(`## Milestones`);
      plan.milestones.forEach((m, i) => roadmapParts.push(`${i + 1}. **${m.title}** — ${m.description}`));
      roadmapParts.push("");
    }
    const roadmapContent = roadmapParts.join("\n");
    const roadmapDoc = {
      id: genId("doc"),
      title: `${plan.title} — Roadmap`,
      filename: `${plan.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase()}-roadmap.md`,
      fileType: "md", content: roadmapContent,
      summary: `Project roadmap for "${plan.title}" (imported).`,
      fileSize: new Blob([roadmapContent]).size,
      projectId: project.id, source: "project", createdAt: ts, updatedAt: ts,
    };
    await store.save("document", roadmapDoc);
    await store.link("project", project.id, "document", roadmapDoc.id);
    if (setDocuments) { const allDocs = await store.list("document"); setDocuments(allDocs); }

    onCommit({ project });
  }

  const totalSelected = Object.values(selected).filter(Boolean).length;

  return (
    <div>
      {!plan && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>↑ Import a Plan</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 16, lineHeight: 1.5 }}>
              Upload a file or paste a project plan you built in Claude, Google Docs, Notes, or anywhere else. BC will parse it into tasks, decisions, and priorities.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input ref={fileInputRef} type="file" accept=".txt,.md,.docx,.jsx" onChange={handleFileUpload} style={{ display: "none" }} />
            <Btn variant="outline" onClick={() => fileInputRef.current?.click()}>
              {file ? `✓ ${file.name}` : "Upload File"}
            </Btn>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, alignSelf: "center" }}>or paste below</span>
          </div>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={"Paste your project plan here...\n\nThis can be:\n• A Claude conversation export\n• Meeting notes with action items\n• A structured plan with phases and tasks\n• A brainstorm doc — BC will find the structure"}
            style={{
              width: "100%", minHeight: 220,
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 8, padding: 16, resize: "vertical",
              color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14,
              lineHeight: 1.6, outline: "none",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.textTertiary, fontFamily: FONT_MONO }}>
                {input.length > 0 ? `${input.length} characters` : ""}
              </span>
              <Btn variant="ghost" size="sm" onClick={onCancel}>Cancel</Btn>
            </div>
            <button
              onClick={parse}
              disabled={!input.trim() || processing}
              style={{
                background: input.trim() && !processing ? C.blue : "rgba(58,124,165,0.2)",
                color: input.trim() && !processing ? "#fff" : C.textTertiary,
                border: "none", borderRadius: 6, padding: "9px 20px",
                fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600,
                cursor: input.trim() && !processing ? "pointer" : "not-allowed",
              }}
            >
              {processing ? "Parsing..." : "Parse Plan"}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 6, fontSize: 13, color: C.red, fontFamily: FONT_BODY }}>{error}</div>
          )}
        </div>
      )}

      {/* Reuse the same review UI pattern as ProjectBuilder */}
      {plan && !creating && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{plan.title}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>{plan.description}</div>
            {plan.importedFrom && <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginTop: 4 }}>Imported from: {file?.name || "pasted content"}</div>}
          </div>

          {/* Parse diagnostic */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: `1px solid ${C.borderDefault}` }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue }}>{(plan.tasks || []).length} tasks</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold }}>{(plan.decisions || []).length} decisions</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.amber }}>{(plan.priorities || []).length} priorities</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{(plan.milestones || []).length} milestones</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.green, marginLeft: "auto" }}>{Object.values(selected).filter(Boolean).length} selected</span>
          </div>

          {plan.bc_analysis && (
            <div style={{ background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 8, padding: "14px 18px", marginBottom: 24 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue, marginBottom: 8, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> BC ASSESSMENT</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textPrimary, lineHeight: 1.6 }}>{renderMarkdown(plan.bc_analysis)}</div>
            </div>
          )}

          {/* Tasks */}
          {(plan.tasks || []).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tasks ({plan.tasks.length})</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { const s = { ...selected }; plan.tasks.forEach((_, i) => s[`task_${i}`] = true); setSelected(s); }} style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO }}>All</button>
                  <button onClick={() => { const s = { ...selected }; plan.tasks.forEach((_, i) => s[`task_${i}`] = false); setSelected(s); }} style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO }}>None</button>
                </div>
              </div>
              {plan.tasks.map((task, i) => {
                const key = `task_${i}`;
                const isSelected = selected[key];
                return (
                  <div key={i} onClick={() => setSelected(s => ({ ...s, [key]: !s[key] }))} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: isSelected ? C.bgCardHover : C.bgCard, border: `1px solid ${isSelected ? C.borderActive : C.borderDefault}`, borderRadius: 8, padding: "12px 14px", marginBottom: 6, cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? C.gold : C.borderDefault}`, background: isSelected ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isSelected && <span style={{ color: C.bgPrimary, fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.blue, background: `${C.blue}18`, padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><CheckSquare size={11} /> Task</span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: priorityColor(task.priority) }}>{task.priority}</span>
                        {task.phase && <Badge label={task.phase} />}
                      </div>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary, marginBottom: task.description ? 3 : 0 }}>{task.title}</div>
                      {task.description && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{task.description}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Decisions */}
          {(plan.decisions || []).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Decisions ({plan.decisions.length})</div>
              {plan.decisions.map((dec, i) => {
                const key = `decision_${i}`;
                const isSelected = selected[key];
                return (
                  <div key={i} onClick={() => setSelected(s => ({ ...s, [key]: !s[key] }))} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: isSelected ? C.bgCardHover : C.bgCard, border: `1px solid ${isSelected ? C.borderActive : C.borderDefault}`, borderRadius: 8, padding: "12px 14px", marginBottom: 6, cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? C.gold : C.borderDefault}`, background: isSelected ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isSelected && <span style={{ color: C.bgPrimary, fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.gold, background: `${C.gold}18`, padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><Diamond size={11} /> Decision</span>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary, marginTop: 4, marginBottom: dec.context ? 3 : 0 }}>{dec.title}</div>
                      {dec.context && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{dec.context}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Priorities */}
          {(plan.priorities || []).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Priorities ({plan.priorities.length})</div>
              {plan.priorities.map((pri, i) => {
                const key = `priority_${i}`;
                const isSelected = selected[key];
                return (
                  <div key={i} onClick={() => setSelected(s => ({ ...s, [key]: !s[key] }))} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: isSelected ? C.bgCardHover : C.bgCard, border: `1px solid ${isSelected ? C.borderActive : C.borderDefault}`, borderRadius: 8, padding: "12px 14px", marginBottom: 6, cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? C.gold : C.borderDefault}`, background: isSelected ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isSelected && <span style={{ color: C.bgPrimary, fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.amber, background: `${C.amber}18`, padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><ChevronUp size={11} /> Priority</span>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary, marginTop: 4, marginBottom: pri.description ? 3 : 0 }}>{pri.title}</div>
                      {pri.description && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{pri.description}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setPlan(null)}>Back</Btn>
            <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
            <button onClick={commit} disabled={totalSelected === 0} style={{
              background: totalSelected > 0 ? C.gold : "rgba(212,168,83,0.2)", color: totalSelected > 0 ? C.bgPrimary : C.textTertiary,
              border: "none", borderRadius: 6, padding: "9px 20px", fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600,
              cursor: totalSelected > 0 ? "pointer" : "not-allowed",
            }}>
              Create Project + {totalSelected} Item{totalSelected !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectScratchForm({ onCommit, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || creating) return;
    setCreating(true);
    const ts = isoNow();
    const project = {
      id: genId("proj"),
      title: title.trim(),
      description,
      status: "active",
      xp: 0,
      milestones: [],
      source: "manual",
      createdAt: ts,
      updatedAt: ts,
    };
    await store.save("project", project);
    onCommit({ project });
  }

  return (
    <div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textSecondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>☐ Start from Scratch</div>
      <FormField label="Project Name" required>
        <Input value={title} onChange={setTitle} placeholder="What are you working on?" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
      </FormField>
      <FormField label="Description">
        <Input multiline rows={4} value={description} onChange={setDescription} placeholder="Goals, scope, timeline... or leave blank and fill in later." />
      </FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={!title.trim() || creating}>{creating ? "Creating..." : "Create Project"}</Btn>
      </div>
    </div>
  );
}

export function ProjectsView({ projects, setProjects, tasks, decisions, priorities, documents, setTasks, setDecisions, setPriorities, setDocuments }) {
  const [expandedId, setExpandedId] = useState(null);
  const [createMode, setCreateMode] = useState(null); // null | "pick" | "ai" | "import" | "scratch"
  const [filterSource, setFilterSource] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  async function handleCommit({ project }) {
    const [d, t, p, projs, docs] = await Promise.all([
      store.list("decision"),
      store.list("task"),
      store.list("priority"),
      store.list("project"),
      store.list("document"),
    ]);
    setDecisions(d);
    setTasks(t);
    setPriorities(p);
    setProjects(projs);
    if (setDocuments) setDocuments(docs);
    setCreateMode(null);
    setExpandedId(project.id);
  }

  async function updateProject(id, updates) {
    const existing = projects.find(p => p.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await store.save("project", updated);
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
  }

  async function deleteProject(id) {
    // Cascade-delete all linked entities
    const links = await store.getLinks("project", id);
    for (const link of links) {
      await store.delete(link.type, link.id);
    }
    await store.delete("project", id);
    // Refresh all state from store
    const [d, t, p, projs, docs] = await Promise.all([
      store.list("decision"),
      store.list("task"),
      store.list("priority"),
      store.list("project"),
      store.list("document"),
    ]);
    setDecisions(d);
    setTasks(t);
    setPriorities(p);
    setProjects(projs);
    if (setDocuments) setDocuments(docs);
    if (expandedId === id) setExpandedId(null);
  }

  const sourceFiltered = filterSource
    ? projects.filter(p => (p.source || "manual") === filterSource)
    : projects;
  const sortedProjects = sortBy === "newest"
    ? [...sourceFiltered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : sortBy === "oldest"
    ? [...sourceFiltered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : sourceFiltered;
  const active = sortedProjects.filter(p => p.status === "active");
  const other = sortedProjects.filter(p => p.status !== "active");

  const modeSubtitle = {
    pick: "Choose how you'd like to create your project.",
    ai: "Describe your project and BC will build the plan.",
    import: "Paste or upload a plan you've already created.",
    scratch: "Start with a blank project and add items yourself.",
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 40px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Projects</h1>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, fontFamily: FONT_BODY }}>
            {createMode ? modeSubtitle[createMode] : "Your mission workstations. Link tasks, decisions, and documents to track progress."}
          </p>
        </div>
        {!createMode && <Btn variant="primary" onClick={() => setCreateMode("pick")}><Sparkles size={12} style={{ display: "inline" }} /> New Project</Btn>}
      </div>

      {!createMode && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 4 }}>Source:</span>
            {[
              [null, "All"],
              ["builder", "AI Builder"],
              ["import", "Import"],
              ["manual", "Manual"],
            ].map(([val, lbl]) => (
              <button key={lbl} onClick={() => setFilterSource(val)} style={{
                padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer",
                background: filterSource === val ? "rgba(255,255,255,0.08)" : "transparent",
                color: filterSource === val ? C.textPrimary : C.textSecondary,
                fontSize: 11, fontFamily: FONT_MONO, fontWeight: filterSource === val ? 700 : 400,
              }}>{lbl}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {[["default", "Default"], ["newest", "Newest"], ["oldest", "Oldest"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setSortBy(val)} style={{
                padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer",
                background: sortBy === val ? "rgba(255,255,255,0.08)" : "transparent",
                color: sortBy === val ? C.textPrimary : C.textSecondary,
                fontSize: 11, fontFamily: FONT_MONO, fontWeight: sortBy === val ? 600 : 400,
              }}>{lbl}</button>
            ))}
          </div>
        </div>
      )}

      {createMode === "pick" && (
        <ProjectModePicker onSelect={setCreateMode} onCancel={() => setCreateMode(null)} />
      )}
      {createMode === "ai" && (
        <ProjectBuilder onCommit={handleCommit} onCancel={() => setCreateMode(null)} setDocuments={setDocuments} />
      )}
      {createMode === "import" && (
        <ProjectImporter onCommit={handleCommit} onCancel={() => setCreateMode(null)} setDocuments={setDocuments} />
      )}
      {createMode === "scratch" && (
        <ProjectScratchForm onCommit={handleCommit} onCancel={() => setCreateMode(null)} />
      )}

      {!createMode && (
        <>
          {projects.length === 0 ? (
            <EmptyState icon={<Grid3X3 size={36} />} title="No projects yet" sub="Create a project to organize tasks, decisions, and documents." action="✦ New Project" onAction={() => setCreateMode("pick")} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {active.length > 0 && (
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Active ({active.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {active.map(p => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        expanded={expandedId === p.id}
                        onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                        onUpdate={(updates) => updateProject(p.id, updates)}
                        onDelete={() => deleteProject(p.id)}
                        tasks={tasks}
                        decisions={decisions}
                        priorities={priorities}
                        documents={documents}
                        setTasks={setTasks}
                        setDecisions={setDecisions}
                        setPriorities={setPriorities}
                        allProjects={projects}
                      />
                    ))}
                  </div>
                </div>
              )}
              {other.length > 0 && (
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Other ({other.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {other.map(p => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        expanded={expandedId === p.id}
                        onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                        onUpdate={(updates) => updateProject(p.id, updates)}
                        onDelete={() => deleteProject(p.id)}
                        tasks={tasks}
                        decisions={decisions}
                        priorities={priorities}
                        documents={documents}
                        setTasks={setTasks}
                        setDecisions={setDecisions}
                        setPriorities={setPriorities}
                        allProjects={projects}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────
// ─── Connector helpers ─────────────────────────────────────────────────────────
function getOrCreateUserId() {
  let id = localStorage.getItem("bc2-user-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("bc2-user-id", id);
  }
  return id;
}

function ConnectorRow({ provider, label, icon, status, onConnect, onDisconnect }) {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await onDisconnect();
    setDisconnecting(false);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 16px", background: C.bgCard, border: `1px solid ${C.borderDefault}`,
      borderRadius: 10, marginBottom: 8, transition: "border-color 0.15s",
      ...(status.connected ? { borderColor: `${C.green}40` } : {}),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{icon}</span>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>{label}</div>
          {status.connected ? (
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.green, marginTop: 2 }}>
              Connected{status.email ? ` — ${status.email}` : ""}
            </div>
          ) : (
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginTop: 2 }}>Not connected</div>
          )}
        </div>
      </div>
      <div>
        {status.connected ? (
          <Btn variant="ghost" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </Btn>
        ) : (
          <Btn variant="outline" size="sm" onClick={onConnect}>Connect</Btn>
        )}
      </div>
    </div>
  );
}

export function SettingsView({ sidebarCollapsed, setSidebarCollapsed }) {
  const [testStatus, setTestStatus] = useState("");
  const [clearConfirm, setClearConfirm] = useState(false);
  const [gmailStatus, setGmailStatus] = useState({ connected: false });
  const [outlookStatus, setOutlookStatus] = useState({ connected: false });
  const [connectorLoading, setConnectorLoading] = useState(true);
  // AI config state
  const [apiKeys, setApiKeys] = useState([]);
  const [aiConfigs, setAiConfigs] = useState([]);
  const [activeConfigId, setActiveConfigIdLocal] = useState(() => localStorage.getItem(`bc2-${store._ws}-ai-active-config`) || "");
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState("anthropic");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyLoading, setNewKeyLoading] = useState(false);
  const [newKeyError, setNewKeyError] = useState("");
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ name: "", provider: "anthropic", keyId: "", model: "" });
  const schemaVersion = localStorage.getItem("bc2-meta:schema-version") || "—";
  const userId = getOrCreateUserId();

  // Load AI keys + configs from localStorage on mount
  useEffect(() => {
    store.list("ai-key").then(setApiKeys);
    store.list("ai-config").then(setAiConfigs);
  }, []);

  // Connectors require an approved backend — show as unavailable for now
  useEffect(() => {
    setConnectorLoading(false);
  }, []);

  async function disconnectProvider(provider) {
    // Connectors not available in local-first mode
    if (provider === "gmail") setGmailStatus({ connected: false });
    else setOutlookStatus({ connected: false });
  }

  async function testConnection() {
    setTestStatus("Testing...");
    try {
      const response = await callAI([{ role: "user", content: "Reply with exactly: BC online." }]);
      setTestStatus(response.trim() ? "Connected — " + response.trim() : "Connected");
    } catch (err) {
      setTestStatus("Error: " + err.message);
    }
  }

  function exportData() {
    const data = store.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `base-command-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        store.importAll(data);
        window.location.reload();
      } catch {
        alert("Invalid JSON file");
      }
    };
    input.click();
  }

  function clearData() {
    store.clearAll();
    window.location.reload();
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 640 }}>
      <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", marginBottom: 32 }}>Settings</div>

      <SettingsSection title="AI Configuration">
        {/* Active config display */}
        {(() => {
          const active = aiConfigs.find(c => c.id === activeConfigId);
          return active ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 12px", background: C.goldMuted, border: `1px solid ${C.gold}30`, borderRadius: 6 }}>
              <span style={{ fontSize: 12, color: C.gold }}>●</span>
              <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                {active.name}
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                {AI_PROVIDERS[active.provider]?.label} · {getModelLabel(active.provider, active.model)}
              </span>
            </div>
          ) : (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 16 }}>
              No AI config set — add an API key below to get started.
            </div>
          );
        })()}

        {/* API Keys */}
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>API Keys</div>
        {apiKeys.length === 0 && !showAddKey && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 8 }}>
            No API keys added yet. Keys are stored locally on your machine — never sent to any server.
          </div>
        )}
        {apiKeys.map(k => (
          <div key={k.keyId} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 12px", background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            borderRadius: 6, marginBottom: 6,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, padding: "2px 6px",
                borderRadius: 4, background: k.provider === "anthropic" ? C.goldMuted : C.aiBlueMuted,
                color: k.provider === "anthropic" ? C.gold : C.aiBlue,
              }}>
                {AI_PROVIDERS[k.provider]?.label || k.provider}
              </span>
              <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textPrimary }}>{k.label}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>...{k.lastFour}</span>
            </div>
            <button
              onClick={async () => {
                await store.delete("ai-key", k.id);
                setApiKeys(prev => prev.filter(x => x.id !== k.id));
                // Remove any configs using this key
                for (const cfg of aiConfigs.filter(c => c.keyId === k.keyId)) {
                  await store.delete("ai-config", cfg.id);
                }
                setAiConfigs(prev => prev.filter(c => c.keyId !== k.keyId));
              }}
              style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO }}
            >Remove</button>
          </div>
        ))}

        {showAddKey ? (
          <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {Object.entries(AI_PROVIDERS).map(([pid, p]) => (
                <button key={pid} onClick={() => setNewKeyProvider(pid)} style={{
                  padding: "4px 12px", borderRadius: 5, cursor: "pointer",
                  fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${newKeyProvider === pid ? C.borderSubtle : C.borderDefault}`,
                  background: newKeyProvider === pid ? "rgba(255,255,255,0.08)" : "transparent",
                  color: newKeyProvider === pid ? C.textPrimary : C.textSecondary,
                }}>{p.label}</button>
              ))}
            </div>
            <input
              value={newKeyLabel}
              onChange={e => setNewKeyLabel(e.target.value)}
              placeholder="Label (e.g. Work key, Personal key)"
              style={{ width: "100%", marginBottom: 8, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
            />
            <input
              type="password"
              value={newKeyValue}
              onChange={e => setNewKeyValue(e.target.value)}
              placeholder={AI_PROVIDERS[newKeyProvider]?.keyPlaceholder || "API key"}
              style={{ width: "100%", marginBottom: 10, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 12, outline: "none" }}
            />
            {newKeyError && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.red, marginBottom: 8 }}>{newKeyError}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" size="sm" onClick={() => { setShowAddKey(false); setNewKeyValue(""); setNewKeyLabel(""); setNewKeyError(""); }}>Cancel</Btn>
              <Btn variant="primary" size="sm" disabled={newKeyLoading || !newKeyValue.trim()} onClick={async () => {
                setNewKeyLoading(true);
                setNewKeyError("");
                try {
                  const keyVal = newKeyValue.trim();
                  const prov = newKeyProvider;
                  // Validate key format
                  if (prov === "anthropic" && !keyVal.startsWith("sk-ant-")) throw new Error("Anthropic keys start with sk-ant-");
                  if (prov === "openai" && !keyVal.startsWith("sk-")) throw new Error("OpenAI keys start with sk-");
                  // Quick validation: make a lightweight API call
                  if (prov === "anthropic") {
                    const testRes = await fetch("https://api.anthropic.com/v1/messages", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "x-api-key": keyVal, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
                      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 10, messages: [{ role: "user", content: "hi" }] }),
                    });
                    if (!testRes.ok) { const e = await testRes.json(); throw new Error(e.error?.message || "Key validation failed"); }
                  } else if (prov === "openai") {
                    const testRes = await fetch("https://api.openai.com/v1/models", {
                      headers: { Authorization: `Bearer ${keyVal}` },
                    });
                    if (!testRes.ok) throw new Error("OpenAI key validation failed");
                  }
                  // Save locally
                  const keyObj = {
                    id: `aikey_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    keyId: `aikey_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    provider: prov,
                    label: newKeyLabel.trim() || `${AI_PROVIDERS[prov]?.label} Key`,
                    lastFour: keyVal.slice(-4),
                    apiKey: keyVal,
                    createdAt: new Date().toISOString(),
                  };
                  await store.save("ai-key", keyObj);
                  setApiKeys(prev => [...prev, keyObj]);
                  setShowAddKey(false);
                  setNewKeyValue("");
                  setNewKeyLabel("");
                } catch (e) {
                  setNewKeyError(e.message);
                }
                setNewKeyLoading(false);
              }}>{newKeyLoading ? "Validating..." : "Save Key"}</Btn>
            </div>
          </div>
        ) : (
          <Btn variant="outline" size="sm" onClick={() => setShowAddKey(true)} style={{ marginBottom: 16 }}>+ Add API Key</Btn>
        )}

        {/* Model Configurations */}
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Model Configurations</div>
        {aiConfigs.length === 0 && !showAddConfig && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 8 }}>
            No configs yet. Add an API key above, then create a named configuration.
          </div>
        )}
        {aiConfigs.map(cfg => {
          const isActive = cfg.id === activeConfigId;
          return (
            <div key={cfg.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", background: isActive ? C.goldMuted : C.bgCard,
              border: `1px solid ${isActive ? C.gold + "40" : C.borderDefault}`,
              borderRadius: 6, marginBottom: 6, cursor: "pointer",
            }}
              onClick={() => { setActiveAIConfig(cfg.id); setActiveConfigIdLocal(cfg.id); }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                <span style={{
                  width: 14, height: 14, borderRadius: "50%", border: `2px solid ${isActive ? C.gold : C.borderDefault}`,
                  background: isActive ? C.gold : "transparent", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isActive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.bgPrimary }} />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{cfg.name}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                    {AI_PROVIDERS[cfg.provider]?.label} · {getModelLabel(cfg.provider, cfg.model)} · ...{cfg.keyLastFour || "env"}
                  </div>
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await store.delete("ai-config", cfg.id);
                  setAiConfigs(prev => prev.filter(c => c.id !== cfg.id));
                  if (activeConfigId === cfg.id) { setActiveAIConfig(""); setActiveConfigIdLocal(""); }
                }}
                style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO, flexShrink: 0 }}
              >Remove</button>
            </div>
          );
        })}

        {showAddConfig ? (
          <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, marginBottom: 12 }}>
            <input
              value={configForm.name}
              onChange={e => setConfigForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Config name (e.g. Work Opus, Fast Haiku)"
              style={{ width: "100%", marginBottom: 10, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}
            />
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {/* Provider */}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 4, textTransform: "uppercase" }}>Provider</div>
                <select value={configForm.provider} onChange={e => setConfigForm(f => ({ ...f, provider: e.target.value, keyId: "", model: "" }))} style={{
                  width: "100%", background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6,
                  padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none",
                }}>
                  {Object.entries(AI_PROVIDERS).map(([pid, p]) => (
                    <option key={pid} value={pid}>{p.label}</option>
                  ))}
                </select>
              </div>
              {/* Key */}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 4, textTransform: "uppercase" }}>API Key</div>
                <select value={configForm.keyId} onChange={e => setConfigForm(f => ({ ...f, keyId: e.target.value }))} style={{
                  width: "100%", background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6,
                  padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none",
                }}>
                  <option value="">Select a key...</option>
                  {apiKeys.filter(k => k.provider === configForm.provider).map(k => (
                    <option key={k.keyId} value={k.keyId}>{k.label} (...{k.lastFour})</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Model */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 4, textTransform: "uppercase" }}>Model</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(AI_PROVIDERS[configForm.provider]?.models || []).map(m => (
                  <button key={m.id} onClick={() => setConfigForm(f => ({ ...f, model: m.id }))} style={{
                    padding: "5px 12px", borderRadius: 5, cursor: "pointer",
                    fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                    border: `1px solid ${configForm.model === m.id ? C.borderSubtle : C.borderDefault}`,
                    background: configForm.model === m.id ? "rgba(255,255,255,0.08)" : "transparent",
                    color: configForm.model === m.id ? C.textPrimary : C.textSecondary,
                  }}>
                    {m.label}
                    <span style={{ fontSize: 11, color: C.textTertiary, marginLeft: 4 }}>({m.tier})</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" size="sm" onClick={() => { setShowAddConfig(false); setConfigForm({ name: "", provider: "anthropic", keyId: "", model: "" }); }}>Cancel</Btn>
              <Btn variant="primary" size="sm" disabled={!configForm.name.trim() || !configForm.model || !configForm.keyId} onClick={async () => {
                const keyMeta = apiKeys.find(k => k.keyId === configForm.keyId);
                const cfg = {
                  id: `aiconf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  name: configForm.name.trim(),
                  provider: configForm.provider,
                  keyId: configForm.keyId,
                  keyLastFour: keyMeta?.lastFour || "???",
                  model: configForm.model,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                await store.save("ai-config", cfg);
                setAiConfigs(prev => [...prev, cfg]);
                // Auto-set as active if first config
                if (!activeConfigId) { setActiveAIConfig(cfg.id); setActiveConfigIdLocal(cfg.id); }
                setShowAddConfig(false);
                setConfigForm({ name: "", provider: "anthropic", keyId: "", model: "" });
              }}>Create Config</Btn>
            </div>
          </div>
        ) : (
          <Btn variant="outline" size="sm" onClick={() => setShowAddConfig(true)}>+ Add Configuration</Btn>
        )}

        {/* Test connection */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.borderDefault}` }}>
          <Btn variant="outline" size="sm" onClick={testConnection}>Test Active Config</Btn>
          {testStatus && (
            <span style={{ marginLeft: 12, fontFamily: FONT_MONO, fontSize: 12, color: testStatus.startsWith("Error") ? C.red : C.green }}>{testStatus}</span>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title="Connectors">
        <div style={{ padding: "12px 14px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={14} style={{ color: C.amber, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>Requires approved backend</span>
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>
            Email connectors (Gmail, Outlook) require a server-side backend for OAuth authentication. This feature will be available once Base Command is deployed to an approved backend environment. All AI processing already happens directly between your browser and the AI provider — no data transits through third-party servers.
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Profile">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary }}>Display Name</span>
          <input
            defaultValue={getUserName()}
            onBlur={e => {
              const name = e.target.value.trim() || "Commander";
              localStorage.setItem("bc2-user-name", name);
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                const name = e.target.value.trim() || "Commander";
                localStorage.setItem("bc2-user-name", name);
                e.target.blur();
              }
            }}
            aria-label="Display name"
            style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 6,
              padding: "6px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13,
              outline: "none", width: 200, textAlign: "right",
            }}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Display Preferences">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary }}>Sidebar collapsed by default</span>
          <button
            onClick={() => {
              const newVal = !sidebarCollapsed;
              setSidebarCollapsed(newVal);
              localStorage.setItem("bc2-ui:sidebar-collapsed", String(newVal));
            }}
            style={{
              width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
              background: sidebarCollapsed ? C.gold : C.borderDefault,
              position: "relative", transition: "background 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: 3, left: sidebarCollapsed ? 20 : 3,
              width: 16, height: 16, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s",
            }} />
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Data Management">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn variant="outline" onClick={exportData}>Export JSON</Btn>
          <Btn variant="outline" onClick={importData}>Import JSON</Btn>
          {clearConfirm ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.red }}>This will delete all data.</span>
              <Btn variant="danger" onClick={clearData}>Confirm Clear</Btn>
              <Btn variant="ghost" onClick={() => setClearConfirm(false)}>Cancel</Btn>
            </div>
          ) : (
            <Btn variant="danger" onClick={() => setClearConfirm(true)}>Clear All Data</Btn>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow label="Schema Version" value={schemaVersion} />
        <SettingsRow label="Storage" value="localStorage" />
        <SettingsRow label="Workspace" value={(() => { const ws = getWorkspaces().find(w => w.id === getActiveWorkspaceId()); return ws ? ws.name : "Default"; })()} />
        <SettingsRow label="App" value="Base Command v3.0" />
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textTertiary, letterSpacing: "-0.01em", marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.borderDefault}` }}>{title}</div>
      {children}
    </div>
  );
}

function SettingsRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
      <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textSecondary }}>{label}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{value}</span>
    </div>
  );
}

// Views are exported individually above — no root component here
