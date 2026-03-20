import { Activity, TrendingUp, Zap, Search, Cpu, ShieldAlert, Mail, BarChart3, DollarSign, Crown, Users, FileText } from "lucide-react";

// ─── 5 Renewal Pillars ──────────────────────────────────────────────────────
// The core workflow functions of the AI Revenue Engine.
// Each pillar maps to 1-3 agents that perform that function.
// Single source of truth for pillar definitions, agent mappings, and cache detection.

export const PILLARS = [
  {
    id: "monitor", label: "Monitor", icon: Activity, color: "#3B82F6",
    tagline: "Continuous health scoring and risk detection",
    agents: ["health-monitor"],
    cacheKeys: ["health-cache"],
  },
  {
    id: "predict", label: "Predict", icon: TrendingUp, color: "#8B5CF6",
    tagline: "GRR/NRR forecasting and scenario modeling",
    agents: ["forecast-engine"],
    cacheKeys: ["forecast"],
  },
  {
    id: "generate", label: "Generate", icon: Zap, color: "#7C3AED",
    tagline: "AI-drafted emails and intervention playbooks",
    agents: ["outreach-drafter", "rescue-planner"],
    cacheKeys: ["outreach-cache", "rescue-cache"],
  },
  {
    id: "identify", label: "Identify", icon: Search, color: "#16A368",
    tagline: "Expansion signals and upsell opportunities",
    agents: ["expansion-scout", "opportunity-brief"],
    cacheKeys: ["expansion-cache", "opportunity-cache"],
  },
  {
    id: "orchestrate", label: "Orchestrate", icon: Cpu, color: "#D4A843",
    tagline: "Board-ready briefs, playbooks, and meeting prep",
    agents: ["executive-brief", "meeting-prep", "playbook-builder"],
    cacheKeys: ["leadership-cache", "meeting-prep-cache", "playbook-cache"],
  },
];

// ─── Agent detail definitions ────────────────────────────────────────────────
export const AGENT_DETAILS = {
  "health-monitor": { name: "Portfolio Health Monitor", icon: Activity, color: "#3B82F6", route: "/app/agents/renewal/health-monitor", description: "Continuous health scoring, risk signals, behavioral archetype classification", cacheKey: "health-cache" },
  "rescue-planner": { name: "At-Risk Rescue Planner", icon: ShieldAlert, color: "#DC4A3D", route: "/app/agents/renewal/rescue-planner", description: "AI-generated intervention playbooks for at-risk accounts", cacheKey: "rescue-cache" },
  "outreach-drafter": { name: "Renewal Outreach Drafter", icon: Mail, color: "#7C3AED", route: "/app/agents/renewal/outreach-drafter", description: "Personalized renewal emails calibrated to health and archetype", cacheKey: "outreach-cache" },
  "expansion-scout": { name: "Expansion Signal Scout", icon: TrendingUp, color: "#16A368", route: "/app/agents/growth/expansion-scout", description: "PQL detection, upsell triggers, expansion signals from your data", cacheKey: "expansion-cache" },
  "forecast-engine": { name: "Revenue Forecast Engine", icon: BarChart3, color: "#8B5CF6", route: "/app/agents/growth/forecast-engine", description: "GRR/NRR forecasts with benchmarks, scenarios, and confidence tiers", cacheKey: "forecast" },
  "opportunity-brief": { name: "Upsell Opportunity Brief", icon: DollarSign, color: "#16A368", route: "/app/agents/growth/opportunity-brief", description: "Pre-call expansion briefs with pricing strategy and talking points", cacheKey: "opportunity-cache" },
  "executive-brief": { name: "Executive Strategy Brief", icon: Crown, color: "#D4A843", route: "/app/agents/coaching/executive-brief", description: "Board-ready summaries, talking points, and strategic recommendations", cacheKey: "leadership-cache" },
  "meeting-prep": { name: "Renewal Meeting Prep", icon: Users, color: "#7C3AED", route: "/app/agents/coaching/meeting-prep", description: "Pre-call briefs with relationship context and recommended asks", cacheKey: "meeting-prep-cache" },
  "playbook-builder": { name: "Renewal Playbook Builder", icon: FileText, color: "#FB923C", route: "/app/agents/coaching/playbook-builder", description: "90/60/30 day action plans with archetype-aware strategies", cacheKey: "playbook-cache" },
};

// ─── Cache detection (single source of truth) ───────────────────────────────
export function isPillarActive(pillar, wsPrefix) {
  const pre = wsPrefix || "bc2-ws_default";
  return pillar.cacheKeys.some(ck =>
    localStorage.getItem(`${pre}-${ck}`) || localStorage.getItem(`${pre}-renewals-${ck}`)
  );
}

export function isAgentCached(cacheKey, wsPrefix) {
  const pre = wsPrefix || "bc2-ws_default";
  return !!(localStorage.getItem(`${pre}-${cacheKey}`) || localStorage.getItem(`${pre}-renewals-${cacheKey}`));
}

// ─── Pillar lookup helpers ───────────────────────────────────────────────────
// Map an action type (e.g. "health_check", "rescue_plan") to a pillar
const ACTION_TYPE_TO_PILLAR = {
  health_check: "monitor", health_monitor: "monitor", monitor: "monitor",
  forecast: "predict", forecast_update: "predict", predict: "predict",
  outreach: "generate", rescue_plan: "generate", rescue: "generate", email_draft: "generate", generate: "generate",
  expansion: "identify", opportunity: "identify", upsell: "identify", identify: "identify",
  executive_brief: "orchestrate", meeting_prep: "orchestrate", playbook: "orchestrate", orchestrate: "orchestrate",
};

export function getPillarForAction(action) {
  // Try matching by action.type
  const typeKey = (action.type || "").toLowerCase().replace(/[\s-]/g, "_");
  const pillarId = ACTION_TYPE_TO_PILLAR[typeKey];
  if (pillarId) return PILLARS.find(p => p.id === pillarId) || null;
  // Try matching by agent name in title
  const title = (action.title || "").toLowerCase();
  if (title.includes("health") || title.includes("monitor")) return PILLARS.find(p => p.id === "monitor");
  if (title.includes("forecast") || title.includes("predict")) return PILLARS.find(p => p.id === "predict");
  if (title.includes("outreach") || title.includes("email") || title.includes("rescue")) return PILLARS.find(p => p.id === "generate");
  if (title.includes("expansion") || title.includes("opportunity") || title.includes("upsell")) return PILLARS.find(p => p.id === "identify");
  if (title.includes("brief") || title.includes("playbook") || title.includes("meeting")) return PILLARS.find(p => p.id === "orchestrate");
  return null;
}

// ─── Dynamic pillar recommendations ─────────────────────────────────────────
export function getPillarRecommendations(accounts) {
  const recs = [];
  const now = Date.now();
  const due30 = accounts.filter(a => {
    if (!a.renewalDate) return false;
    const d = (new Date(a.renewalDate) - now) / 86400000;
    return d >= 0 && d <= 30;
  });
  const atRisk = accounts.filter(a => a.riskLevel === "high");

  for (const p of PILLARS) {
    const active = isPillarActive(p);
    if (!active) {
      // Idle pillar — suggest activation
      if (p.id === "monitor") recs.push({ pillar: p, title: "Activate Monitor: Score your portfolio health", desc: `${accounts.length} accounts need health scoring for risk detection`, priority: "high", route: "/app/agents/renewal/health-monitor" });
      if (p.id === "predict") recs.push({ pillar: p, title: "Activate Predict: Generate your first forecast", desc: "Get GRR/NRR metrics with confidence tiers and scenario modeling", priority: "high", route: "/app/agents/growth/forecast-engine" });
      if (p.id === "generate" && due30.length > 0) recs.push({ pillar: p, title: `Activate Generate: Draft outreach for ${due30.length} accounts renewing in 30 days`, desc: "Personalized emails calibrated to health and archetype", priority: "high", route: "/app/agents/renewal/outreach-drafter" });
      if (p.id === "generate" && atRisk.length > 0) recs.push({ pillar: p, title: `Activate Generate: Build rescue plans for ${atRisk.length} at-risk accounts`, desc: "AI-generated intervention playbooks with specific actions", priority: "high", route: "/app/agents/renewal/rescue-planner" });
      if (p.id === "identify") recs.push({ pillar: p, title: "Activate Identify: Scan for expansion signals", desc: "Find upsell opportunities and PQLs in your portfolio", priority: "medium", route: "/app/agents/growth/expansion-scout" });
      if (p.id === "orchestrate") recs.push({ pillar: p, title: "Activate Orchestrate: Generate an executive brief", desc: "Board-ready summaries with talking points and strategic recommendations", priority: "medium", route: "/app/agents/coaching/executive-brief" });
    } else {
      // Active pillar — suggest refresh or next action
      // Check cache age
      const pre = "bc2-ws_default";
      for (const ck of p.cacheKeys) {
        const raw = localStorage.getItem(`${pre}-${ck}`) || localStorage.getItem(`${pre}-renewals-${ck}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const age = parsed._generatedAt ? (now - parsed._generatedAt) / 3600000 : Infinity;
            if (age > 24) {
              recs.push({ pillar: p, title: `Refresh ${p.label}: Data is ${Math.floor(age)}h old`, desc: `Re-run to get updated insights based on latest portfolio state`, priority: "low", route: `/app/pillars/${p.id}` });
            }
          } catch { /* skip */ }
        }
      }
    }
  }
  return recs;
}

export function getActivePillarCount(wsPrefix) {
  return PILLARS.filter(p => isPillarActive(p, wsPrefix)).length;
}

// ─── Agent → Action Type mapping (for autonomy controls) ────────────────────
export const AGENT_ACTION_TYPES = {
  "outreach-drafter": ["email_draft"],
  "rescue-planner": ["risk_assessment", "next_action"],
  "health-monitor": ["risk_assessment"],
  "expansion-scout": ["next_action"],
  "forecast-engine": ["next_action"],
  "executive-brief": ["next_action"],
  "meeting-prep": ["next_action"],
  "playbook-builder": ["next_action"],
  "opportunity-brief": ["next_action"],
};
