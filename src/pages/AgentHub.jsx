import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ShieldAlert, Mail, TrendingUp, BarChart3, DollarSign,
  Crown, Users, FileText, ArrowRight, Sparkles, Lock, RefreshCw,
  Eye, Clock,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { renewalStore, store } from "../lib/storage";
import { PageLayout } from "../components/layout/PageLayout";
import { computePortfolioHealth, computePortfolioSummary, getSeverity } from "../lib/healthScore";
import { formatARR, safeParse } from "../lib/utils";

// ─── Agent Category Definitions ─────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "renewal", label: "Renewal Agents",
    description: "Protect revenue. Monitor health, plan rescues, draft outreach.",
    color: "#6B8AFF", glow: "rgba(107, 138, 255, 0.08)",
    agents: [
      { id: "health-monitor", name: "Health Monitor", icon: Activity, color: "#6B8AFF", route: "/app/agents/renewal/health-monitor", description: "Continuous health scoring, risk signals, behavioral archetype classification", cacheCheck: "health" },
      { id: "rescue-planner", name: "Rescue Planner", icon: ShieldAlert, color: "#F87171", route: "/app/agents/renewal/rescue-planner", description: "AI-generated intervention playbooks for at-risk accounts", cacheCheck: "rescue" },
      { id: "outreach-drafter", name: "Outreach Drafter", icon: Mail, color: "#22D3EE", route: "/app/agents/renewal/outreach-drafter", description: "Personalized renewal emails calibrated to health and archetype", cacheCheck: "outreach" },
    ],
  },
  {
    id: "growth", label: "Growth Agents",
    description: "Surface expansion. Detect PQLs, forecast revenue, brief for upsell.",
    color: "#34D399", glow: "rgba(52, 211, 153, 0.08)",
    agents: [
      { id: "expansion-scout", name: "Expansion Scout", icon: TrendingUp, color: "#34D399", route: "/app/agents/growth/expansion-scout", description: "PQL detection, upsell triggers, expansion signals from your data", cacheCheck: "expansion" },
      { id: "forecast-engine", name: "Forecast Engine", icon: BarChart3, color: "#A78BFA", route: "/app/agents/growth/forecast-engine", description: "GRR/NRR forecasts with benchmarks, scenarios, and confidence tiers", cacheCheck: "forecast" },
      { id: "opportunity-brief", name: "Opportunity Brief", icon: DollarSign, color: "#34D399", route: "/app/agents/growth/opportunity-brief", description: "Pre-call expansion briefs with pricing strategy and talking points", cacheCheck: "opportunity" },
    ],
  },
  {
    id: "coaching", label: "Coaching Agents",
    description: "Make humans superhuman. Briefs, prep, and playbooks.",
    color: "#D4A843", glow: "rgba(212, 168, 67, 0.08)",
    agents: [
      { id: "executive-brief", name: "Executive Brief", icon: Crown, color: "#D4A843", route: "/app/agents/coaching/executive-brief", description: "Board-ready summaries, talking points, and strategic recommendations", cacheCheck: "leadership" },
      { id: "meeting-prep", name: "Meeting Prep", icon: Users, color: "#22D3EE", route: "/app/agents/coaching/meeting-prep", description: "Pre-call briefs with relationship context and recommended asks", cacheCheck: "meeting" },
      { id: "playbook-builder", name: "Playbook Builder", icon: FileText, color: "#FB923C", route: "/app/agents/coaching/playbook-builder", description: "90/60/30 day action plans with archetype-aware strategies", cacheCheck: "playbook" },
    ],
  },
];

// Flatten for lookups
const ALL_AGENTS = CATEGORIES.flatMap(c => c.agents.map(a => ({ ...a, category: c })));

// ─── Cache detection ────────────────────────────────────────────────────────
function getAgentCacheStatus(cacheCheck, ws) {
  const prefix = `bc2-${ws}`;
  const keyMap = {
    forecast: `${prefix}-forecast`,
    expansion: `${prefix}-renewals-expansion-cache`,
    leadership: `${prefix}-renewals-leadership-cache`,
    health: null,
    rescue: null,
    outreach: null,
    meeting: null,
    playbook: null,
    opportunity: null,
  };
  const key = keyMap[cacheCheck];
  if (!key) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const parsed = safeParse(raw, null);
  if (!parsed) return null;
  return { generatedAt: parsed._generatedAt || null, data: parsed };
}

function timeAgo(ts) {
  if (!ts) return "Unknown";
  const m = Math.floor((Date.now() - ts) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
}

// ─── Autonomy Dial ──────────────────────────────────────────────────────────
function AutonomyDial() {
  const modes = [
    { id: "suggest", label: "Suggest", active: true },
    { id: "draft", label: "Draft", active: false },
    { id: "execute", label: "Execute", active: false },
  ];
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 10 }}>
      {modes.map(m => (
        <div key={m.id} style={{
          display: "flex", alignItems: "center", gap: 3,
          padding: "3px 8px", borderRadius: 4,
          background: m.active ? C.goldMuted : "rgba(255,255,255,0.03)",
          border: `1px solid ${m.active ? C.gold + "30" : C.borderDefault}`,
          fontFamily: FONT_MONO, fontSize: 9, fontWeight: m.active ? 600 : 400,
          color: m.active ? C.gold : C.textTertiary,
          opacity: m.active ? 1 : 0.5,
        }}>
          {!m.active && <Lock size={8} />}
          {m.label}
        </div>
      ))}
    </div>
  );
}

// ─── Agent Hub ──────────────────────────────────────────────────────────────
export default function AgentHub() {
  const navigate = useNavigate();
  const { isMobile } = useMediaQuery();
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  // Detect which agents have cached results (synchronous localStorage reads)
  const activeAgents = useMemo(() => {
    const ws = store._ws;
    const found = [];
    for (const agent of ALL_AGENTS) {
      const status = getAgentCacheStatus(agent.cacheCheck, ws);
      if (status) found.push({ ...agent, cacheStatus: status });
    }
    return found;
  }, []);

  const [tab, setTab] = useState(() => {
    // Default to "active" tab if agents have run
    const ws = store._ws;
    for (const agent of ALL_AGENTS) {
      if (getAgentCacheStatus(agent.cacheCheck, ws)) return "active";
    }
    return "catalog";
  });

  // Load portfolio summary
  useEffect(() => {
    (async () => {
      const accounts = await renewalStore.getAccounts();
      if (accounts.length === 0) return;
      const contextMap = {};
      await Promise.all(accounts.map(async (a) => {
        try { const ctx = await renewalStore.getContext(a.id); if (ctx?.length) contextMap[a.id] = ctx; } catch { /* skip */ }
      }));
      const results = computePortfolioHealth(accounts, contextMap);
      setPortfolioSummary(computePortfolioSummary(results));
    })();
  }, []);

  return (
    <PageLayout maxWidth={1100}>
      {/* Pipeline banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4, marginBottom: isMobile ? 16 : 24,
        padding: isMobile ? "8px 10px" : "10px 16px", background: C.bgCard, borderRadius: 8,
        border: `1px solid ${C.borderDefault}`, overflowX: "auto",
      }}>
        {["Monitor", "Predict", "Generate", "Identify", "Orchestrate"].map((fn, i) => (
          <div key={fn} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {i > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, opacity: 0.4, margin: "0 4px" }}>{"\u2192"}</span>}
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
          display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 8 : 10, marginBottom: isMobile ? 20 : 28,
        }}>
          {[
            { label: "Accounts", value: portfolioSummary.total, color: C.textPrimary },
            { label: "Avg Health", value: portfolioSummary.avgScore.toFixed(1), color: getSeverity(portfolioSummary.avgScore).color },
            { label: "Portfolio ARR", value: formatARR(portfolioSummary.totalARR), color: C.textPrimary },
            { label: "At-Risk ARR", value: formatARR(portfolioSummary.atRiskARR), color: portfolioSummary.atRiskARR > 0 ? C.red : C.green },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: isMobile ? "10px 12px" : "12px 16px", background: C.bgCard,
              border: `1px solid ${C.borderDefault}`, borderRadius: 8,
            }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: fs(20, 17, isMobile), fontWeight: 700, color: stat.color, marginTop: 4 }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab bar: Active | Catalog */}
      <div style={{ display: "flex", gap: 4, background: C.bgCard, borderRadius: 10, padding: 4, border: `1px solid ${C.borderDefault}`, width: "fit-content", marginBottom: isMobile ? 20 : 24 }}>
        <button onClick={() => setTab("active")} style={{
          display: "flex", alignItems: "center", gap: 6, padding: isMobile ? "8px 12px" : "8px 18px",
          borderRadius: 8, border: "none", cursor: "pointer",
          background: tab === "active" ? "rgba(255,255,255,0.1)" : "transparent",
          color: tab === "active" ? C.textPrimary : C.textTertiary,
          fontFamily: FONT_SANS, fontSize: 13, fontWeight: tab === "active" ? 600 : 500,
        }}>
          Active
          {activeAgents.length > 0 && (
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
              color: C.aiBlue, background: C.aiBlueMuted,
              padding: "2px 6px", borderRadius: 10, minWidth: 18, textAlign: "center",
            }}>{activeAgents.length}</span>
          )}
        </button>
        <button onClick={() => setTab("catalog")} style={{
          display: "flex", alignItems: "center", gap: 6, padding: isMobile ? "8px 12px" : "8px 18px",
          borderRadius: 8, border: "none", cursor: "pointer",
          background: tab === "catalog" ? "rgba(255,255,255,0.1)" : "transparent",
          color: tab === "catalog" ? C.textPrimary : C.textTertiary,
          fontFamily: FONT_SANS, fontSize: 13, fontWeight: tab === "catalog" ? 600 : 500,
        }}>
          Catalog
        </button>
      </div>

      {/* Active Agents Tab */}
      {tab === "active" && (
        <ActiveAgentsTab activeAgents={activeAgents} isMobile={isMobile} navigate={navigate} />
      )}

      {/* Catalog Tab */}
      {tab === "catalog" && (
        <CatalogTab isMobile={isMobile} navigate={navigate} />
      )}
    </PageLayout>
  );
}

// ─── Active Agents Tab ──────────────────────────────────────────────────────
function ActiveAgentsTab({ activeAgents, isMobile, navigate }) {
  if (activeAgents.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: 200, gap: 16, textAlign: "center", padding: isMobile ? "24px 14px" : "40px 20px",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: C.aiBlueMuted, border: `1px solid ${C.aiBlue}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={24} style={{ color: C.aiBlue }} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: fs(18, 16, isMobile), fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>
            No agents have run yet
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, maxWidth: 400, lineHeight: 1.5 }}>
            Switch to the Catalog tab to launch an agent. Results will appear here once an agent has generated output.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: isMobile ? 10 : 12 }}>
      {activeAgents.map(agent => {
        const Icon = agent.icon;
        const ago = timeAgo(agent.cacheStatus?.generatedAt);
        return (
          <div key={agent.id} style={{
            background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12,
            padding: isMobile ? "14px 14px" : "18px 20px", position: "relative", overflow: "hidden",
          }}>
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
                    {agent.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}60` }} />
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>
                      <Clock size={9} style={{ marginRight: 3, verticalAlign: "middle" }} />
                      {ago}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5, marginBottom: 12 }}>
                {agent.description}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => navigate(agent.route)} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "6px 14px",
                  background: agent.color + "14", border: `1px solid ${agent.color}25`,
                  borderRadius: 8, cursor: "pointer",
                  fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: agent.color,
                }}>
                  <Eye size={12} /> View Results
                </button>
                <button onClick={() => navigate(agent.route)} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "6px 14px",
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderDefault}`,
                  borderRadius: 8, cursor: "pointer",
                  fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: C.textTertiary,
                }}>
                  <RefreshCw size={11} /> Refresh
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Catalog Tab ────────────────────────────────────────────────────────────
function CatalogTab({ isMobile, navigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 20 : 28 }}>
      {CATEGORIES.map(category => (
        <div key={category.id}>
          {/* Category header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: category.color,
              boxShadow: `0 0 8px ${category.color}60`,
            }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 10 : 12 }}>
            {category.agents.map(agent => {
              const Icon = agent.icon;
              return (
                <button
                  key={agent.id}
                  onClick={() => navigate(agent.route)}
                  style={{
                    background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                    borderRadius: 12, padding: isMobile ? "14px 14px 12px" : "20px 20px 16px",
                    cursor: "pointer", textAlign: "left", transition: "all 0.2s ease",
                    position: "relative", overflow: "hidden",
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
                      lineHeight: 1.5, marginBottom: 8, minHeight: 36,
                    }}>
                      {agent.description}
                    </div>

                    {/* Autonomy Dial */}
                    <AutonomyDial />

                    <div style={{
                      display: "flex", alignItems: "center", gap: 5, marginTop: 12,
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
  );
}
