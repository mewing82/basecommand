import { Activity, TrendingUp, Zap, Search, Cpu, ShieldAlert, Mail, BarChart3, DollarSign, Crown, Users, FileText } from "lucide-react";

// ─── 5 Renewal Pillars ──────────────────────────────────────────────────────
// The core workflow functions of the AI Revenue Engine.
// Each pillar maps to 1-3 agents that perform that function.
// Single source of truth for pillar definitions, agent mappings, and cache detection.

export const PILLARS = [
  {
    id: "monitor", label: "Monitor", icon: Activity, color: "#6B8AFF",
    tagline: "Continuous health scoring and risk detection",
    agents: ["health-monitor"],
    cacheKeys: ["health-cache"],
  },
  {
    id: "predict", label: "Predict", icon: TrendingUp, color: "#A78BFA",
    tagline: "GRR/NRR forecasting and scenario modeling",
    agents: ["forecast-engine"],
    cacheKeys: ["forecast"],
  },
  {
    id: "generate", label: "Generate", icon: Zap, color: "#22D3EE",
    tagline: "AI-drafted emails and intervention playbooks",
    agents: ["outreach-drafter", "rescue-planner"],
    cacheKeys: ["outreach-cache", "rescue-cache"],
  },
  {
    id: "identify", label: "Identify", icon: Search, color: "#34D399",
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
  "health-monitor": { name: "Health Monitor", icon: Activity, color: "#6B8AFF", route: "/app/agents/renewal/health-monitor", description: "Continuous health scoring, risk signals, behavioral archetype classification", cacheKey: "health-cache" },
  "rescue-planner": { name: "Rescue Planner", icon: ShieldAlert, color: "#F87171", route: "/app/agents/renewal/rescue-planner", description: "AI-generated intervention playbooks for at-risk accounts", cacheKey: "rescue-cache" },
  "outreach-drafter": { name: "Outreach Drafter", icon: Mail, color: "#22D3EE", route: "/app/agents/renewal/outreach-drafter", description: "Personalized renewal emails calibrated to health and archetype", cacheKey: "outreach-cache" },
  "expansion-scout": { name: "Expansion Scout", icon: TrendingUp, color: "#34D399", route: "/app/agents/growth/expansion-scout", description: "PQL detection, upsell triggers, expansion signals from your data", cacheKey: "expansion-cache" },
  "forecast-engine": { name: "Forecast Engine", icon: BarChart3, color: "#A78BFA", route: "/app/agents/growth/forecast-engine", description: "GRR/NRR forecasts with benchmarks, scenarios, and confidence tiers", cacheKey: "forecast" },
  "opportunity-brief": { name: "Opportunity Brief", icon: DollarSign, color: "#34D399", route: "/app/agents/growth/opportunity-brief", description: "Pre-call expansion briefs with pricing strategy and talking points", cacheKey: "opportunity-cache" },
  "executive-brief": { name: "Executive Brief", icon: Crown, color: "#D4A843", route: "/app/agents/coaching/executive-brief", description: "Board-ready summaries, talking points, and strategic recommendations", cacheKey: "leadership-cache" },
  "meeting-prep": { name: "Meeting Prep", icon: Users, color: "#22D3EE", route: "/app/agents/coaching/meeting-prep", description: "Pre-call briefs with relationship context and recommended asks", cacheKey: "meeting-prep-cache" },
  "playbook-builder": { name: "Playbook Builder", icon: FileText, color: "#FB923C", route: "/app/agents/coaching/playbook-builder", description: "90/60/30 day action plans with archetype-aware strategies", cacheKey: "playbook-cache" },
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

export function getActivePillarCount(wsPrefix) {
  return PILLARS.filter(p => isPillarActive(p, wsPrefix)).length;
}
