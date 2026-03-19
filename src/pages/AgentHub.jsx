import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { renewalStore } from "../lib/storage";
import { PageLayout } from "../components/layout/PageLayout";
import { computePortfolioHealth, computePortfolioSummary, getSeverity } from "../lib/healthScore";
import { formatARR } from "../lib/utils";
import { PILLARS, AGENT_DETAILS, isPillarActive, isAgentCached } from "../lib/pillars";

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

  const activePillars = PILLARS.filter(p => isPillarActive(p)).length;

  return (
    <PageLayout maxWidth={1100}>
      {/* Pipeline banner — clickable pillars */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4, marginBottom: isMobile ? 16 : 24,
        padding: isMobile ? "8px 10px" : "10px 16px", background: C.bgCard, borderRadius: 8,
        border: `1px solid ${C.borderDefault}`, overflowX: "auto",
      }}>
        {PILLARS.map((p, i) => {
          const on = isPillarActive(p);
          const PIcon = p.icon;
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, opacity: 0.4, margin: "0 4px" }}>→</span>}
              <button
                onClick={() => navigate(`/app/pillars/${p.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                  color: on ? p.color : C.textTertiary,
                  padding: "4px 12px", borderRadius: 4, whiteSpace: "nowrap",
                  background: on ? `${p.color}12` : "transparent",
                  border: `1px solid ${on ? p.color + "25" : "transparent"}`,
                  cursor: "pointer", transition: "all 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${p.color}18`; }}
                onMouseLeave={e => { e.currentTarget.style.background = on ? `${p.color}12` : "transparent"; }}
              >
                <PIcon size={12} /> {p.label}
              </button>
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, whiteSpace: "nowrap" }}>
          {activePillars}/5 active
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

      {/* Pillar sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 24 : 32 }}>
        {PILLARS.map(pillar => {
          const on = isPillarActive(pillar);
          const agents = pillar.agents.map(id => AGENT_DETAILS[id]).filter(Boolean);
          const PIcon = pillar.icon;
          return (
            <div key={pillar.id}>
              {/* Pillar header — clickable to pillar page */}
              <button
                onClick={() => navigate(`/app/pillars/${pillar.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  width: "100%",
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: on ? pillar.color : pillar.color + "40",
                  boxShadow: on ? `0 0 8px ${pillar.color}60` : "none",
                }} />
                <PIcon size={16} style={{ color: pillar.color }} />
                <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>
                  {pillar.label}
                </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>
                  {pillar.tagline}
                </span>
                <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
                  color: on ? pillar.color : C.textTertiary,
                  background: on ? `${pillar.color}12` : "transparent",
                  padding: on ? "2px 8px" : "0", borderRadius: 3,
                }}>{on ? "Active" : `${agents.length} agent${agents.length !== 1 ? "s" : ""}`}</span>
                <ArrowRight size={12} style={{ color: C.textTertiary }} />
              </button>

              {/* Agent cards */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${Math.min(agents.length, 3)}, 1fr)`, gap: isMobile ? 10 : 12 }}>
                {agents.map(agent => {
                  const AgentIcon = agent.icon;
                  const cached = isAgentCached(agent.cacheKey);
                  return (
                    <button
                      key={agent.name}
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
                            <AgentIcon size={18} color={agent.color} strokeWidth={1.75} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{agent.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                              <div style={{
                                width: 6, height: 6, borderRadius: "50%",
                                background: cached ? C.green : C.textTertiary + "60",
                                boxShadow: cached ? `0 0 4px ${C.green}40` : "none",
                              }} />
                              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: cached ? C.green : C.textTertiary }}>
                                {cached ? "Has results" : "Not run yet"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{
                          fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary,
                          lineHeight: 1.5, marginBottom: 8, minHeight: 36,
                        }}>
                          {agent.description}
                        </div>
                        <AutonomyDial />
                        <div style={{
                          display: "flex", alignItems: "center", gap: 5, marginTop: 12,
                          fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: agent.color,
                        }}>
                          {cached ? "View Results" : "Run Agent"} <ArrowRight size={11} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}
