// ─── Design Tokens ────────────────────────────────────────────────────────────
// "Emerald + Violet" — BaseCommand brand system
// Emerald primary (growth/renewal), Violet AI accent (intelligence/premium)
// Light-first with cool-slate dark mode

export const C = {
  // Backgrounds — light-first
  bgPrimary: "#FCFCFD",
  bgCard: "#FFFFFF",
  bgCardHover: "#F8F9FB",
  bgSidebar: "#FFFFFF",
  bgAI: "#FAF5FF",
  bgElevated: "#FFFFFF",
  bgSurface: "#F0F2F5",
  // Borders
  borderDefault: "#E2E5EB",
  borderActive: "#10B981",
  borderSubtle: "#F0F2F5",
  borderAI: "#DDD6FE",
  // Text
  textPrimary: "#161A25",
  textSecondary: "#4A5162",
  textTertiary: "#9AA1B0",
  textOnPrimary: "#FFFFFF",
  // Primary accent — Emerald (growth, renewal, action)
  gold: "#059669",
  goldHover: "#10B981",
  goldMuted: "rgba(5, 150, 105, 0.08)",
  goldGlow: "rgba(5, 150, 105, 0.04)",
  // AI accent — Violet (intelligence, AI content, premium)
  aiBlue: "#7C3AED",
  aiBlueMuted: "rgba(124, 58, 237, 0.06)",
  aiBlueGlow: "rgba(124, 58, 237, 0.03)",
  // Status
  green: "#16A368",
  greenMuted: "rgba(22, 163, 104, 0.08)",
  amber: "#D97706",
  amberMuted: "rgba(217, 119, 6, 0.08)",
  red: "#DC4A3D",
  redMuted: "rgba(220, 74, 61, 0.08)",
  blue: "#3B82F6",
  blueMuted: "rgba(59, 130, 246, 0.08)",
  // Special
  purple: "#8B5CF6",
  purpleMuted: "rgba(139, 92, 246, 0.08)",
};

// Dark mode tokens (for future theme toggle)
export const C_DARK = {
  bgPrimary: "#0F1114",
  bgCard: "#161A20",
  bgCardHover: "#1C2128",
  bgSidebar: "#0B0E12",
  bgAI: "rgba(124, 58, 237, 0.04)",
  bgElevated: "#161A20",
  bgSurface: "#1C2128",
  borderDefault: "#252A34",
  borderActive: "#10B981",
  borderSubtle: "#161A20",
  borderAI: "rgba(124, 58, 237, 0.15)",
  textPrimary: "#E8EAF0",
  textSecondary: "#A0A8B8",
  textTertiary: "#6B7385",
  textOnPrimary: "#0F1114",
  gold: "#34D399",
  goldHover: "#6EE7B7",
  goldMuted: "rgba(52, 211, 153, 0.10)",
  goldGlow: "rgba(52, 211, 153, 0.05)",
  aiBlue: "#A78BFA",
  aiBlueMuted: "rgba(167, 139, 250, 0.08)",
  aiBlueGlow: "rgba(167, 139, 250, 0.04)",
  green: "#34D399",
  greenMuted: "rgba(52, 211, 153, 0.10)",
  amber: "#FBBF24",
  amberMuted: "rgba(251, 191, 36, 0.10)",
  red: "#F87171",
  redMuted: "rgba(248, 113, 113, 0.10)",
  blue: "#60A5FA",
  blueMuted: "rgba(96, 165, 250, 0.10)",
  purple: "#A78BFA",
  purpleMuted: "rgba(167, 139, 250, 0.10)",
};

// ─── Typography ──────────────────────────────────────────────────────────────
export const FONT_MONO = "'JetBrains Mono', monospace";
export const FONT_DISPLAY = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
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
  { name: "Rookie", threshold: 0, color: "#9AA1B0", flavor: "You have a desk. Barely." },
  { name: "Operator", threshold: 50, color: "#3B82F6", flavor: "You know where the buttons are." },
  { name: "Strategist", threshold: 150, color: "#C07D10", flavor: "People pretend to listen now." },
  { name: "Mastermind", threshold: 300, color: "#069572", flavor: "You break things on purpose. And it works." },
  { name: "The Architect", threshold: 500, color: "#8B5CF6", flavor: "They don't schedule meetings with you. You schedule them." },
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

// ─── Typography Scale ───────────────────────────────────────────────────────
export const TYPE = {
  displayLg: { fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" },
  displayMd: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" },
  displaySm: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" },
  body: { fontFamily: FONT_BODY, fontSize: 14, fontWeight: 400, lineHeight: 1.6 },
  bodySm: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
  mono: { fontFamily: FONT_MONO, fontSize: 12, fontWeight: 500 },
  monoSm: { fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500 },
  label: { fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em" },
};

// ─── Spacing Scale (4px base) ───────────────────────────────────────────────
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 };

// ─── Border Radius ──────────────────────────────────────────────────────────
export const R = { sm: 4, md: 8, lg: 12, xl: 14 };

// ─── Hover Levels ───────────────────────────────────────────────────────────
export const HOVER = {
  subtle: "rgba(0,0,0,0.03)",
  default: "rgba(0,0,0,0.04)",
  strong: "rgba(0,0,0,0.06)",
};

// ─── Breakpoints ────────────────────────────────────────────────────────────
export const BP = { mobile: 640, tablet: 768, desktop: 1024, wide: 1280 };

// ─── AI Response Styles ─────────────────────────────────────────────────────
export const RESPONSE_STYLES = ["Direct", "Collaborative", "Diplomatic", "Firm", "Empathetic", "Executive"];
export const RESPONSE_TONES = ["Formal", "Conversational", "Concise"];

// ─── Mobile Responsive Helpers ──────────────────────────────────────────────
// Standard mobile paddings (375px viewport):
//   16px section padding → 343px content width
//   14px card padding inside section → 315px inner content
export const MOBILE_SECTION_PX = 16;
export const MOBILE_CARD_PX = 14;
export const MOBILE_CARD_PY = 16;

/**
 * Responsive font-size helper.
 * Usage: fontSize: fs(17, 15, isMobile)
 */
export const fs = (desktop, mobile, isMobile) => isMobile ? mobile : desktop;

// ─── App Layout Mobile Constants ────────────────────────────────────────────
export const APP_MOBILE_PX = 12;
export const APP_MODAL_MAX_W = "calc(100vw - 32px)";

/** Text truncation style object — spread into any element that needs ellipsis */
export const TRUNCATE = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
