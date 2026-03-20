import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ListChecks, Clock, Bot, Cpu, Settings as SettingsIcon, ChevronUp } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { renewalStore } from "../lib/storage";
import { PageLayout } from "../components/layout/PageLayout";
import { PILLARS, AGENT_DETAILS, isPillarActive, isAgentCached } from "../lib/pillars";
import { executeAction, dismissAction } from "../lib/executionEngine";
import { getEffectiveLevel, getCacheAge } from "../components/agents/agentHubHelpers";
import { AutonomyDial, OpsRow, PendingReviewQueue } from "../components/agents/AgentHubParts";
import FleetConfigPanel from "../components/agents/FleetConfigPanel";

// ─── Agent Hub ──────────────────────────────────────────────────────────────
export default function AgentHub() {
  const navigate = useNavigate();
  const { isMobile } = useMediaQuery();
  const [autonomySettings, setAutonomySettings] = useState(null);
  const [pendingActions, setPendingActions] = useState([]);
  const [executedActionIds, setExecutedActionIds] = useState(new Set());
  const [totalExecutions, setTotalExecutions] = useState(0);
  const [fleetConfigOpen, setFleetConfigOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("configure") === "fleet") {
      window.history.replaceState({}, "", window.location.pathname);
      return true;
    }
    return false;
  });

  useEffect(() => {
    (async () => {
      let settings = await renewalStore.getAutonomySettings();
      if (!settings || Object.keys(settings).length === 0) {
        // Seed defaults: monitoring agents run autonomously, rest are co-pilot
        settings = { risk_assessment: "draft" };
        await renewalStore.saveAutonomySettings(settings);
      }
      setAutonomySettings(settings);

      try {
        const executions = await renewalStore.getExecutions({ limit: 500 });
        setTotalExecutions(executions.length);
      } catch { /* skip */ }

      try {
        const actions = await renewalStore.getAutopilotActions();
        setPendingActions(actions.filter(a => a.status === "pending"));
      } catch { /* skip */ }
    })();
  }, []);

  async function handleAutonomyUpdate(newSettings) {
    setAutonomySettings(newSettings);
    await renewalStore.saveAutonomySettings(newSettings);
  }

  async function handleApprove(actionId) {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;
    setExecutedActionIds(prev => new Set([...prev, actionId]));
    await executeAction(action);
    setTimeout(() => {
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
      setExecutedActionIds(prev => { const next = new Set(prev); next.delete(actionId); return next; });
    }, 1500);
  }

  function handleDismiss(actionId) {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
    dismissAction(action);
  }

  // ─── Derived computations ─────────────────────────────────────────────────
  const allAgents = Object.entries(AGENT_DETAILS).map(([id, d]) => ({
    ...d, agentId: id, mode: getEffectiveLevel(id, autonomySettings),
  }));
  const opsAgents = allAgents.filter(a => a.mode !== "suggest");
  const copilotAgents = allAgents.filter(a => a.mode === "suggest");

  const autonomousCount = opsAgents.length;
  const copilotCount = copilotAgents.length;
  const activePending = pendingActions.filter(a => !executedActionIds.has(a.id));
  const activePillars = PILLARS.filter(p => isPillarActive(p)).length;

  return (
    <PageLayout maxWidth={1100}>
      <style>{`
        @keyframes bc-pulse-glow {
          0%, 100% { box-shadow: 0 0 4px ${C.amber}40; }
          50% { box-shadow: 0 0 10px ${C.amber}80; }
        }
      `}</style>

      {/* Pipeline banner — clickable pillars */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4, marginBottom: isMobile ? 12 : 16,
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

      {/* Fleet Summary Bar */}
      <div style={{
        display: "flex", flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between",
        gap: isMobile ? 12 : 16, marginBottom: isMobile ? 20 : 28,
        padding: isMobile ? "14px 14px" : "16px 22px",
        background: C.bgCard, borderRadius: 10, border: `1px solid ${C.borderDefault}`,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: isMobile ? 8 : 16 }}>
          {[
            { label: `${autonomousCount} autonomous`, color: autonomousCount > 0 ? C.amber : C.textTertiary },
            { label: `${copilotCount} co-pilot`, color: copilotCount > 0 ? C.textPrimary : C.textTertiary },
            { label: `${activePending.length} pending review`, color: activePending.length > 0 ? C.amber : C.textTertiary },
          ].map((stat, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span style={{ color: C.textTertiary, opacity: 0.3, fontFamily: FONT_MONO, fontSize: 10 }}>·</span>}
              <span style={{ fontFamily: FONT_MONO, fontSize: fs(12, 11, isMobile), fontWeight: 600, color: stat.color }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={() => setFleetConfigOpen(prev => !prev)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 6, cursor: "pointer",
            background: fleetConfigOpen ? C.gold + "18" : C.gold + "10",
            border: `1px solid ${fleetConfigOpen ? C.gold + "40" : C.gold + "25"}`,
            fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: C.gold,
            transition: "all 0.15s",
          }}>
            <SettingsIcon size={12} /> Configure Fleet
            <ChevronUp size={10} style={{ transition: "transform 0.15s", transform: fleetConfigOpen ? "rotate(0deg)" : "rotate(180deg)" }} />
          </button>
          {activePending.length > 0 && (
            <button onClick={() => navigate("/app/tasks")} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 6, cursor: "pointer",
              background: C.amber + "14", border: `1px solid ${C.amber}25`,
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: C.amber,
            }}>
              <ListChecks size={12} /> Agent Queue
            </button>
          )}
          {totalExecutions > 0 && (
            <button onClick={() => navigate("/app/tasks")} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 6, cursor: "pointer",
              background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderDefault}`,
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: C.textTertiary,
            }}>
              <Clock size={12} /> Execution Log
            </button>
          )}
        </div>
      </div>

      {/* ═══ FLEET CONFIG PANEL ═══ */}
      {fleetConfigOpen && (
        <FleetConfigPanel autonomySettings={autonomySettings} onUpdate={handleAutonomyUpdate} />
      )}

      {/* ═══ OPERATIONS CENTER ═══ */}
      <div style={{ marginBottom: isMobile ? 28 : 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Bot size={16} style={{ color: C.amber }} />
          <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.01em" }}>
            Operations Center
          </span>
          <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>
            {autonomousCount > 0 ? `${autonomousCount} agent${autonomousCount !== 1 ? "s" : ""} running autonomously` : "No autonomous agents"}
          </span>
        </div>

        {opsAgents.length === 0 ? (
          <div style={{
            padding: isMobile ? "20px 16px" : "24px 22px",
            background: C.bgCard, borderRadius: 10, border: `1px solid ${C.borderDefault}`,
            fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6, textAlign: "center",
          }}>
            No agents running autonomously yet. Set an agent to Draft or Execute mode from the workbench below.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {opsAgents.map(agent => (
              <OpsRow key={agent.agentId} agent={agent} autonomySettings={autonomySettings} onUpdate={handleAutonomyUpdate} isMobile={isMobile} navigate={navigate} />
            ))}
          </div>
        )}

        {activePending.length > 0 && (
          <PendingReviewQueue
            actions={activePending}
            executedIds={executedActionIds}
            onApprove={handleApprove}
            onDismiss={handleDismiss}
            onViewAll={() => navigate("/app/tasks")}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* ═══ CO-PILOT WORKBENCH ═══ */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <Cpu size={16} style={{ color: C.aiBlue }} />
          <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.01em" }}>
            Co-Pilot Workbench
          </span>
          <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>
            {copilotCount > 0 ? `${copilotCount} agent${copilotCount !== 1 ? "s" : ""} available` : "All agents autonomous"}
          </span>
        </div>

        {copilotAgents.length === 0 ? (
          <div style={{
            padding: isMobile ? "20px 16px" : "24px 22px",
            background: C.bgCard, borderRadius: 10, border: `1px solid ${C.borderDefault}`,
            fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6, textAlign: "center",
          }}>
            All agents running autonomously. Monitor them in the Operations Center above.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 24 : 32 }}>
            {PILLARS.map(pillar => {
              const pillarCopilots = pillar.agents.map(id => copilotAgents.find(a => a.agentId === id)).filter(Boolean);
              if (pillarCopilots.length === 0) return null;
              const on = isPillarActive(pillar);
              const PIcon = pillar.icon;
              return (
                <div key={pillar.id}>
                  <button
                    onClick={() => navigate(`/app/pillars/${pillar.id}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
                      background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%",
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
                    <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>{pillar.tagline}</span>
                    <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
                      color: on ? pillar.color : C.textTertiary,
                      background: on ? `${pillar.color}12` : "transparent",
                      padding: on ? "2px 8px" : "0", borderRadius: 3,
                    }}>{on ? "Active" : `${pillarCopilots.length} agent${pillarCopilots.length !== 1 ? "s" : ""}`}</span>
                    <ArrowRight size={12} style={{ color: C.textTertiary }} />
                  </button>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : `repeat(${Math.min(pillarCopilots.length, 3)}, 1fr)`,
                    gap: isMobile ? 10 : 12,
                  }}>
                    {pillarCopilots.map(agent => {
                      const AgentIcon = agent.icon;
                      const cached = isAgentCached(agent.cacheKey);
                      const cacheAge = getCacheAge(agent.cacheKey);
                      return (
                        <div
                          key={agent.agentId}
                          onClick={() => navigate(agent.route)}
                          style={{
                            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                            borderRadius: 12, padding: isMobile ? "14px 14px 12px" : "20px 20px 16px",
                            cursor: "pointer", textAlign: "left", transition: "all 0.2s ease",
                            position: "relative", overflow: "hidden",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = `0 6px 24px ${agent.color}15, 0 0 0 1px ${agent.color}30`;
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
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
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{agent.name}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                  <div style={{
                                    width: 6, height: 6, borderRadius: "50%",
                                    background: cached ? C.green : C.textTertiary + "60",
                                    boxShadow: cached ? `0 0 4px ${C.green}40` : "none", flexShrink: 0,
                                  }} />
                                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: cached ? C.green : C.textTertiary }}>
                                    {cached ? (cacheAge ? `Last run ${cacheAge}` : "Has results") : "Not run yet"}
                                  </span>
                                  <span style={{
                                    fontFamily: FONT_MONO, fontSize: 8, fontWeight: 700,
                                    padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.05em",
                                    background: C.textTertiary + "18", color: C.textTertiary, border: `1px solid ${C.textTertiary}25`,
                                  }}>suggest</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5, marginBottom: 8, minHeight: 36 }}>
                              {agent.description}
                            </div>
                            <div onClick={e => e.stopPropagation()}>
                              <AutonomyDial agentId={agent.agentId} autonomySettings={autonomySettings} onUpdate={handleAutonomyUpdate} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: agent.color }}>
                              {cached ? "View Results" : "Open Agent"} <ArrowRight size={11} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
