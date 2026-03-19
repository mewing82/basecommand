import { Activity, TrendingUp, Zap, Search, Cpu } from "lucide-react";

// ─── 5 Renewal Pillars ──────────────────────────────────────────────────────
// The core workflow functions of the AI Revenue Engine.
// Each pillar maps to 1-3 agents that perform that function.

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
