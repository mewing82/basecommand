import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ListChecks, Clock } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { store, renewalStore } from "../lib/storage";
import { PageLayout } from "../components/layout/PageLayout";
import { PILLARS, AGENT_DETAILS, AGENT_ACTION_TYPES, isPillarActive, isAgentCached } from "../lib/pillars";

const AUTONOMY_LEVELS = ["suggest", "draft", "execute"];
const LEVEL_COLORS = { suggest: C.textTertiary, draft: C.gold, execute: C.amber };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEffectiveLevel(agentId, autonomySettings) {
  const actionTypes = AGENT_ACTION_TYPES[agentId] || ["next_action"];
  if (!autonomySettings) return "suggest";
  let highest = 0;
  for (const at of actionTypes) {
    const level = autonomySettings[at] || "draft";
    const idx = AUTONOMY_LEVELS.indexOf(level);
    if (idx > highest) highest = idx;
  }
  return AUTONOMY_LEVELS[highest];
}

function getCacheAge(cacheKey) {
  const pre = `bc2-${store._ws}`;
  const raw = localStorage.getItem(`${pre}-${cacheKey}`) || localStorage.getItem(`${pre}-renewals-${cacheKey}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed._generatedAt) return null;
    const mins = Math.floor((Date.now() - parsed._generatedAt) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  } catch { return null; }
}

// ─── Autonomy Dial (functional) ─────────────────────────────────────────────
function AutonomyDial({ agentId, autonomySettings, onUpdate }) {
  const actionTypes = AGENT_ACTION_TYPES[agentId] || ["next_action"];
  const effectiveLevel = getEffectiveLevel(agentId, autonomySettings);

  function cycleLevel() {
    const currentIdx = AUTONOMY_LEVELS.indexOf(effectiveLevel);
    const nextIdx = (currentIdx + 1) % AUTONOMY_LEVELS.length;
    const nextLevel = AUTONOMY_LEVELS[nextIdx];

    if (nextLevel === "execute") {
      if (!confirm(`Set ${agentId.replace(/-/g, " ")} to Execute mode? Actions will be auto-approved.`)) return;
    }

    const updates = { ...autonomySettings };
    for (const at of actionTypes) updates[at] = nextLevel;
    onUpdate(updates);
  }

  return (
    <div style={{ display: "flex", gap: 3, marginTop: 10 }}>
      {AUTONOMY_LEVELS.map(level => {
        const isActive = level === effectiveLevel;
        const isBeyond = AUTONOMY_LEVELS.indexOf(level) > AUTONOMY_LEVELS.indexOf(effectiveLevel);
        const color = LEVEL_COLORS[level];
        return (
          <button
            key={level}
            onClick={cycleLevel}
            style={{
              display: "flex", alignItems: "center", gap: 3,
              padding: "3px 8px", borderRadius: 4, cursor: "pointer",
              background: isActive ? color + "18" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isActive ? color + "30" : C.borderDefault}`,
              fontFamily: FONT_MONO, fontSize: 9, fontWeight: isActive ? 600 : 400,
              color: isActive ? color : C.textTertiary,
              opacity: isBeyond ? 0.4 : isActive ? 1 : 0.6,
              transition: "all 0.15s",
            }}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        );
      })}
    </div>
  );
}

// ─── Agent Hub ──────────────────────────────────────────────────────────────
export default function AgentHub() {
  const navigate = useNavigate();
  const { isMobile } = useMediaQuery();
  const [autonomySettings, setAutonomySettings] = useState(null);
  const [executionCounts, setExecutionCounts] = useState({});
  const [pendingByAgent, setPendingByAgent] = useState({});
  const [totalPending, setTotalPending] = useState(0);
  const [totalExecutions, setTotalExecutions] = useState(0);

  useEffect(() => {
    (async () => {
      setAutonomySettings(await renewalStore.getAutonomySettings());

      // Load execution stats grouped by agentId
      try {
        const executions = await renewalStore.getExecutions({ limit: 500 });
        const byAgent = {};
        for (const e of executions) {
          const aid = e.agentId || "autopilot";
          byAgent[aid] = (byAgent[aid] || 0) + 1;
        }
        setExecutionCounts(byAgent);
        setTotalExecutions(executions.length);
      } catch { /* skip */ }

      // Load pending actions mapped to agents by action type
      try {
        const actions = await renewalStore.getAutopilotActions();
        const pending = actions.filter(a => a.status === "pending");
        setTotalPending(pending.length);
        const byAgent = {};
        for (const a of pending) {
          const aType = a.type || "next_action";
          for (const [agentId, types] of Object.entries(AGENT_ACTION_TYPES)) {
            if (types.includes(aType)) {
              byAgent[agentId] = (byAgent[agentId] || 0) + 1;
            }
          }
        }
        setPendingByAgent(byAgent);
      } catch { /* skip */ }
    })();
  }, []);

  async function handleAutonomyUpdate(newSettings) {
    setAutonomySettings(newSettings);
    await renewalStore.saveAutonomySettings(newSettings);
  }

  const activePillars = PILLARS.filter(p => isPillarActive(p)).length;
  const totalAgents = Object.keys(AGENT_DETAILS).length;
  const activeAgents = Object.values(AGENT_DETAILS).filter(a => isAgentCached(a.cacheKey)).length;

  // Dominant autonomy mode across all agents
  const modeCounts = { suggest: 0, draft: 0, execute: 0 };
  for (const id of Object.keys(AGENT_DETAILS)) {
    modeCounts[getEffectiveLevel(id, autonomySettings)]++;
  }
  const dominantMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0][0];

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
        background: C.bgCard, borderRadius: 10,
        border: `1px solid ${C.borderDefault}`,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: isMobile ? 8 : 16 }}>
          {[
            { label: `${totalAgents} agents`, color: C.textPrimary },
            { label: `${activeAgents} active`, color: activeAgents > 0 ? C.green : C.textTertiary },
            { label: `${dominantMode.charAt(0).toUpperCase() + dominantMode.slice(1)} mode`, color: LEVEL_COLORS[dominantMode] },
            { label: `${totalPending} pending review`, color: totalPending > 0 ? C.amber : C.textTertiary },
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
          {totalPending > 0 && (
            <button
              onClick={() => navigate("/app/tasks")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                background: C.amber + "14", border: `1px solid ${C.amber}25`,
                fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: C.amber,
              }}
            >
              <ListChecks size={12} /> Agent Queue
            </button>
          )}
          {totalExecutions > 0 && (
            <button
              onClick={() => navigate("/app/tasks")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderDefault}`,
                fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: C.textTertiary,
              }}
            >
              <Clock size={12} /> Execution Log
            </button>
          )}
        </div>
      </div>

      {/* Pillar sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 24 : 32 }}>
        {PILLARS.map(pillar => {
          const on = isPillarActive(pillar);
          const agents = pillar.agents.map(id => ({ ...AGENT_DETAILS[id], agentId: id })).filter(Boolean);
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
                  const mode = getEffectiveLevel(agent.agentId, autonomySettings);
                  const modeColor = LEVEL_COLORS[mode];
                  const cacheAge = getCacheAge(agent.cacheKey);
                  const agentExecCount = executionCounts[agent.agentId] || 0;
                  const agentPendingCount = pendingByAgent[agent.agentId] || 0;
                  const isExecuteMode = mode === "execute";
                  const borderLeftStyle = isExecuteMode
                    ? `3px solid ${C.amber}50`
                    : mode === "draft"
                    ? `3px solid ${C.gold}30`
                    : "3px solid transparent";

                  return (
                    <div
                      key={agent.name}
                      onClick={() => navigate(agent.route)}
                      style={{
                        background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                        borderLeft: borderLeftStyle,
                        borderRadius: 12, padding: isMobile ? "14px 14px 12px" : "20px 20px 16px",
                        cursor: "pointer", textAlign: "left", transition: "all 0.2s ease",
                        position: "relative", overflow: "hidden",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = `0 6px 24px ${agent.color}15, 0 0 0 1px ${agent.color}30`;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={e => {
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
                        {/* Agent name + rich status line */}
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
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                              <div style={{
                                width: 6, height: 6, borderRadius: "50%",
                                background: cached ? C.green : C.textTertiary + "60",
                                boxShadow: cached ? `0 0 4px ${C.green}40` : "none",
                                ...(isExecuteMode && cached ? { animation: "bc-pulse-glow 2s ease-in-out infinite" } : {}),
                                flexShrink: 0,
                              }} />
                              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: cached ? C.green : C.textTertiary }}>
                                {cached ? (cacheAge ? `Last run ${cacheAge}` : "Has results") : "Not run yet"}
                              </span>
                              <span style={{
                                fontFamily: FONT_MONO, fontSize: 8, fontWeight: 700,
                                padding: "1px 5px", borderRadius: 3, textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                background: modeColor + "18", color: modeColor,
                                border: `1px solid ${modeColor}25`,
                              }}>
                                {mode}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div style={{
                          fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary,
                          lineHeight: 1.5, marginBottom: 8, minHeight: 36,
                        }}>
                          {agent.description}
                        </div>

                        {/* Autonomy dial */}
                        <div onClick={e => e.stopPropagation()}>
                          <AutonomyDial
                            agentId={agent.agentId}
                            autonomySettings={autonomySettings}
                            onUpdate={handleAutonomyUpdate}
                          />
                        </div>

                        {/* Execution stats bar */}
                        {(agentExecCount > 0 || agentPendingCount > 0) && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 10, marginTop: 10,
                            padding: "6px 10px", borderRadius: 6,
                            background: "rgba(255,255,255,0.02)", border: `1px solid ${C.borderDefault}`,
                          }}>
                            {agentExecCount > 0 && (
                              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>
                                {agentExecCount} execution{agentExecCount !== 1 ? "s" : ""}
                              </span>
                            )}
                            {agentExecCount > 0 && agentPendingCount > 0 && (
                              <span style={{ color: C.textTertiary, opacity: 0.3, fontFamily: FONT_MONO, fontSize: 10 }}>·</span>
                            )}
                            {agentPendingCount > 0 && (
                              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.amber, fontWeight: 600 }}>
                                {agentPendingCount} pending review
                              </span>
                            )}
                          </div>
                        )}

                        {/* Dual CTA row */}
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          marginTop: 12,
                        }}>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 5,
                            fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: agent.color,
                          }}>
                            {cached ? "View Results" : "Run Agent"} <ArrowRight size={11} />
                          </div>
                          {agentPendingCount > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate("/app/tasks"); }}
                              style={{
                                display: "flex", alignItems: "center", gap: 4,
                                padding: "3px 8px", borderRadius: 4, cursor: "pointer",
                                background: C.amber + "14", border: `1px solid ${C.amber}25`,
                                fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600, color: C.amber,
                              }}
                            >
                              Review Queue
                              <span style={{
                                fontFamily: FONT_MONO, fontSize: 8, fontWeight: 700,
                                background: C.amber, color: "#000", borderRadius: 3,
                                padding: "0 4px", marginLeft: 2,
                              }}>
                                {agentPendingCount}
                              </span>
                            </button>
                          )}
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
    </PageLayout>
  );
}
