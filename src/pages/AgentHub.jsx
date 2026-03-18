import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ShieldAlert, Mail, TrendingUp, BarChart3, DollarSign,
  Crown, Users, FileText, ArrowRight, Sparkles,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { renewalStore } from "../lib/storage";
import { PageLayout } from "../components/layout/PageLayout";
import { computePortfolioHealth, computePortfolioSummary, getSeverity } from "../lib/healthScore";
import { formatARR } from "../lib/utils";

// ─── Agent Category Definitions ─────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "renewal",
    label: "Renewal Agents",
    description: "Protect revenue. Monitor health, plan rescues, draft outreach.",
    color: "#6B8AFF",
    glow: "rgba(107, 138, 255, 0.08)",
    agents: [
      { id: "health-monitor", name: "Health Monitor", icon: Activity, color: "#6B8AFF", route: "/app/agents/renewal/health-monitor", description: "Continuous health scoring, risk signals, behavioral archetype classification" },
      { id: "rescue-planner", name: "Rescue Planner", icon: ShieldAlert, color: "#F87171", route: "/app/agents/renewal/rescue-planner", description: "AI-generated intervention playbooks for at-risk accounts" },
      { id: "outreach-drafter", name: "Outreach Drafter", icon: Mail, color: "#22D3EE", route: "/app/agents/renewal/outreach-drafter", description: "Personalized renewal emails calibrated to health and archetype" },
    ],
  },
  {
    id: "growth",
    label: "Growth Agents",
    description: "Surface expansion. Detect PQLs, forecast revenue, brief for upsell.",
    color: "#34D399",
    glow: "rgba(52, 211, 153, 0.08)",
    agents: [
      { id: "expansion-scout", name: "Expansion Scout", icon: TrendingUp, color: "#34D399", route: "/app/agents/growth/expansion-scout", description: "PQL detection, upsell triggers, expansion signals from your data" },
      { id: "forecast-engine", name: "Forecast Engine", icon: BarChart3, color: "#A78BFA", route: "/app/agents/growth/forecast-engine", description: "GRR/NRR forecasts with benchmarks, scenarios, and confidence tiers" },
      { id: "opportunity-brief", name: "Opportunity Brief", icon: DollarSign, color: "#34D399", route: "/app/agents/growth/opportunity-brief", description: "Pre-call expansion briefs with pricing strategy and talking points" },
    ],
  },
  {
    id: "coaching",
    label: "Coaching Agents",
    description: "Make humans superhuman. Briefs, prep, and playbooks.",
    color: "#D4A843",
    glow: "rgba(212, 168, 67, 0.08)",
    agents: [
      { id: "executive-brief", name: "Executive Brief", icon: Crown, color: "#D4A843", route: "/app/agents/coaching/executive-brief", description: "Board-ready summaries, talking points, and strategic recommendations" },
      { id: "meeting-prep", name: "Meeting Prep", icon: Users, color: "#22D3EE", route: "/app/agents/coaching/meeting-prep", description: "Pre-call briefs with relationship context and recommended asks" },
      { id: "playbook-builder", name: "Playbook Builder", icon: FileText, color: "#FB923C", route: "/app/agents/coaching/playbook-builder", description: "90/60/30 day action plans with archetype-aware strategies" },
    ],
  },
];

export default function AgentHub() {
  const navigate = useNavigate();
  const [portfolioSummary, setPortfolioSummary] = useState(null);

  useEffect(() => {
    (async () => {
      const accounts = await renewalStore.getAccounts();
      if (accounts.length === 0) return;
      const contextMap = {};
      for (const a of accounts) {
        try { const ctx = await renewalStore.getContext(a.id); if (ctx?.length) contextMap[a.id] = ctx; } catch { /* skip */ }
      }
      const results = computePortfolioHealth(accounts, contextMap);
      setPortfolioSummary(computePortfolioSummary(results));
    })();
  }, []);

  return (
    <PageLayout maxWidth={1100}>
      {/* Pipeline banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4, marginBottom: 24,
        padding: "10px 16px", background: C.bgCard, borderRadius: 8,
        border: `1px solid ${C.borderDefault}`, overflowX: "auto",
      }}>
        {["Monitor", "Predict", "Generate", "Identify", "Orchestrate"].map((fn, i) => (
          <div key={fn} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {i > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, opacity: 0.4, margin: "0 4px" }}>→</span>}
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
              color: C.aiBlue, padding: "3px 10px", borderRadius: 4,
              background: C.aiBlueMuted, whiteSpace: "nowrap",
            }}>{fn}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, whiteSpace: "nowrap" }}>
          5-function AI pipeline
        </span>
      </div>

      {/* Portfolio health summary */}
      {portfolioSummary && portfolioSummary.total > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 28,
        }}>
          {[
            { label: "Accounts", value: portfolioSummary.total, color: C.textPrimary },
            { label: "Avg Health", value: portfolioSummary.avgScore.toFixed(1), color: getSeverity(portfolioSummary.avgScore).color },
            { label: "Portfolio ARR", value: formatARR(portfolioSummary.totalARR), color: C.textPrimary },
            { label: "At-Risk ARR", value: formatARR(portfolioSummary.atRiskARR), color: portfolioSummary.atRiskARR > 0 ? C.red : C.green },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: "12px 16px", background: C.bgCard,
              border: `1px solid ${C.borderDefault}`, borderRadius: 8,
            }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: stat.color, marginTop: 4 }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Agent categories */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {CATEGORIES.map(category => (
          <div key={category.id}>
            {/* Category header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: category.color,
                boxShadow: `0 0 8px ${category.color}60`,
              }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>
                {category.label}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>
                {category.description}
              </span>
              <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                {category.agents.length}
              </span>
            </div>

            {/* Agent cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {category.agents.map(agent => {
                const Icon = agent.icon;
                return (
                  <button
                    key={agent.id}
                    onClick={() => navigate(agent.route)}
                    style={{
                      background: C.bgCard,
                      border: `1px solid ${C.borderDefault}`,
                      borderRadius: 12,
                      padding: "20px 20px 16px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = agent.color + "50";
                      e.currentTarget.style.boxShadow = `0 6px 24px ${agent.color}10`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = C.borderDefault;
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Glow */}
                    <div style={{
                      position: "absolute", top: -20, right: -20, width: 80, height: 80,
                      borderRadius: "50%", background: `radial-gradient(circle, ${agent.color}10 0%, transparent 70%)`,
                      pointerEvents: "none",
                    }} />

                    <div style={{ position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 9,
                          background: agent.color + "14", border: `1px solid ${agent.color}25`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon size={18} color={agent.color} strokeWidth={1.75} />
                        </div>
                        <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
                          {agent.name}
                        </div>
                      </div>

                      <div style={{
                        fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary,
                        lineHeight: 1.5, marginBottom: 12, minHeight: 36,
                      }}>
                        {agent.description}
                      </div>

                      <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: agent.color,
                      }}>
                        Open <ArrowRight size={11} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
