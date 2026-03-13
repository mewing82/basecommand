// ─── Design Tokens ────────────────────────────────────────────────────────────
// "Command Indigo" — AI-native design system
// Warm-neutral dark base (not pure black) for accessibility
// Dual accent: Indigo = human actions/authority, Cyan = AI intelligence/data

export const C = {
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
  // Status — desaturated for dark mode
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

// ─── Typography ──────────────────────────────────────────────────────────────
export const FONT_MONO = "'JetBrains Mono', monospace";
export const FONT_DISPLAY = "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
export const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
export const FONT_SANS = FONT_DISPLAY; // backward compat

// ─── Entity Constants ────────────────────────────────────────────────────────
export const DECISION_STATUSES = ["draft", "analyzing", "decided", "implementing", "evaluating", "closed"];
export const DECISION_STATUS_LABELS = {
  draft: "Draft", analyzing: "Analyzing", decided: "Decided",
  implementing: "Implementing", evaluating: "Evaluating", closed: "Closed",
};

export const TASK_STATUSES = ["open", "in_progress", "blocked", "complete", "cancelled"];
export const TASK_STATUS_LABELS = { open: "Open", in_progress: "In Progress", blocked: "Blocked", complete: "Complete", cancelled: "Cancelled" };
export const TASK_PRIORITIES = ["critical", "high", "medium", "low"];

export const PRIORITY_TIMEFRAMES = ["this_week", "this_month", "this_quarter", "this_year"];
export const PRIORITY_TIMEFRAME_LABELS = { this_week: "This Week", this_month: "This Month", this_quarter: "This Quarter", this_year: "This Year" };
export const PRIORITY_STATUSES = ["active", "on_track", "at_risk", "paused", "achieved"];
export const PRIORITY_STATUS_LABELS = { active: "Active", on_track: "On Track", at_risk: "At Risk", paused: "Paused", achieved: "Achieved" };

export const PROJECT_STATUSES = ["active", "paused", "completed", "archived"];
export const PROJECT_STATUS_LABELS = { active: "Active", paused: "Paused", completed: "Completed", archived: "Archived" };

export const DECISION_TEMPLATES = {
  blank: { label: "Blank", context: "" },
  hiring: { label: "Hiring", context: "Role: \nCandidates: \nKey criteria: \nTimeline: \nBudget: " },
  vendor: { label: "Vendor Selection", context: "Business need: \nVendors evaluated: \nBudget: \nTimeline: \nRequirements: " },
  project: { label: "Project Prioritization", context: "Competing projects: \nResources: \nStrategic priorities: \nTimeline: " },
  pivot: { label: "Strategic Pivot", context: "Current state: \nProposed change: \nDriver: \nStakeholders: \nRisks: " },
  budget: { label: "Budget Allocation", context: "Total budget: \nCompeting requests: \nPriorities: \nConstraints: " },
};

// ─── XP / Gamification ───────────────────────────────────────────────────────
export const XP_ACTIONS = { task_complete: 10, decision_made: 15, document_added: 5, ai_interaction: 3, priority_achieved: 20 };
export const RANK_LEVELS = [
  { name: "Rookie", threshold: 0, color: "#64748B", flavor: "You have a desk. Barely." },
  { name: "Operator", threshold: 50, color: "#3A7CA5", flavor: "You know where the buttons are." },
  { name: "Strategist", threshold: 150, color: "#6366F1", flavor: "People pretend to listen now." },
  { name: "Mastermind", threshold: 300, color: "#2D8653", flavor: "You break things on purpose. And it works." },
  { name: "The Architect", threshold: 500, color: "#A855F7", flavor: "They don't schedule meetings with you. You schedule them." },
];

export const SUPPORTED_DOC_TYPES = [".txt", ".md", ".docx", ".jsx"];

// ─── AI Provider Registry ────────────────────────────────────────────────────
export const AI_PROVIDERS = {
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
