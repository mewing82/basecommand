// ─── App Constants ────────────────────────────────────────────────────────────
export const DECISION_STATUSES = ["draft", "analyzing", "decided", "implementing", "evaluating", "closed"];
export const DECISION_STATUS_LABELS = {
  draft: "Draft", analyzing: "Analyzing", decided: "Decided",
  implementing: "Implementing", evaluating: "Evaluating", closed: "Closed"
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

export const XP_ACTIONS = { task_complete: 10, decision_made: 15, document_added: 5, ai_interaction: 3, priority_achieved: 20 };
export const RANK_LEVELS = [
  { name: "Rookie", threshold: 0, color: "#64748B", flavor: "You have a desk. Barely." },
  { name: "Operator", threshold: 50, color: "#3A7CA5", flavor: "You know where the buttons are." },
  { name: "Strategist", threshold: 150, color: "#6366F1", flavor: "People pretend to listen now." },
  { name: "Mastermind", threshold: 300, color: "#2D8653", flavor: "You break things on purpose. And it works." },
  { name: "The Architect", threshold: 500, color: "#A855F7", flavor: "They don't schedule meetings with you. You schedule them." },
];

export const SUPPORTED_DOC_TYPES = [".txt", ".md", ".docx", ".jsx"];

export const DECISION_TEMPLATES = {
  blank: { label: "Blank", context: "" },
  hiring: { label: "Hiring", context: "Role: \nCandidates: \nKey criteria: \nTimeline: \nBudget: " },
  vendor: { label: "Vendor Selection", context: "Business need: \nVendors evaluated: \nBudget: \nTimeline: \nRequirements: " },
  project: { label: "Project Prioritization", context: "Competing projects: \nResources: \nStrategic priorities: \nTimeline: " },
  pivot: { label: "Strategic Pivot", context: "Current state: \nProposed change: \nDriver: \nStakeholders: \nRisks: " },
  budget: { label: "Budget Allocation", context: "Total budget: \nCompeting requests: \nPriorities: \nConstraints: " },
};

// ─── AI Provider Registry ─────────────────────────────────────────────────────
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

export const RESPONSE_STYLES = ["Direct", "Collaborative", "Diplomatic", "Firm", "Empathetic", "Executive"];
export const RESPONSE_TONES = ["Formal", "Conversational", "Concise"];
