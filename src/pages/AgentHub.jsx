import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, Clock, Settings as SettingsIcon, ChevronUp } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { renewalStore } from "../lib/storage";
import { PageLayout } from "../components/layout/PageLayout";
import { PILLARS, AGENT_DETAILS, isPillarActive, isAgentCached } from "../lib/pillars";
import { executeAction, dismissAction } from "../lib/executionEngine";
import { getEffectiveLevel } from "../components/agents/agentHubHelpers";
import { PendingReviewQueue } from "../components/agents/AgentHubParts";
import FleetConfigPanel from "../components/agents/FleetConfigPanel";
import FleetWelcome from "../components/agents/FleetWelcome";
import PillarSection from "../components/agents/PillarSection";

// ─── Agent Hub ──────────────────────────────────────────────────────────────
export default function AgentHub() {
  const navigate = useNavigate();
  const { isMobile } = useMediaQuery();
  const configRef = useRef(null);
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

  // Scroll to config panel when opened via URL param
  useEffect(() => {
    if (fleetConfigOpen && configRef.current) {
      configRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [fleetConfigOpen]);

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

  const autonomousCount = allAgents.filter(a => a.mode !== "suggest").length;
  const copilotCount = allAgents.filter(a => a.mode === "suggest").length;
  const activePending = pendingActions.filter(a => !executedActionIds.has(a.id));
  const activePillars = PILLARS.filter(p => isPillarActive(p)).length;

  // Phase detection
  const activatedCount = allAgents.filter(a => isAgentCached(a.cacheKey)).length;
  const phase = activatedCount === 0 ? "welcome" : activatedCount < 3 ? "activating" : "operational";

  // Auto-open fleet config during activating phase (unless user manually closed it)
  const effectiveConfigOpen = fleetConfigOpen || (phase === "activating" && fleetConfigOpen !== false);

  // Pillar agent groupings
  const pillarAgents = PILLARS.map(p => ({
    pillar: p,
    agents: p.agents.map(id => allAgents.find(a => a.agentId === id)).filter(Boolean),
  }));

  return (
    <PageLayout maxWidth={1100}>
      <style>{`
        @keyframes bc-pulse-glow {
          0%, 100% { box-shadow: 0 0 4px ${C.amber}40; }
          50% { box-shadow: 0 0 10px ${C.amber}80; }
        }
      `}</style>

      {/* ═══ A: Compact Fleet Status Header ═══ */}
      <div style={{
        display: "flex", flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between",
        gap: isMobile ? 10 : 12, marginBottom: isMobile ? 16 : 20,
        padding: isMobile ? "10px 12px" : "12px 18px",
        background: C.bgCard, borderRadius: 10, border: `1px solid ${C.borderDefault}`,
      }}>
        {/* Pipeline dots + stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {PILLARS.map((p, i) => {
            const on = isPillarActive(p);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, opacity: 0.3 }}>→</span>}
                <button
                  onClick={() => navigate(`/app/pillars/${p.id}`)}
                  title={`${p.label}: ${p.tagline}`}
                  style={{
                    width: 10, height: 10, borderRadius: "50%", padding: 0,
                    background: on ? p.color : p.color + "30",
                    boxShadow: on ? `0 0 6px ${p.color}50` : "none",
                    border: "none", cursor: "pointer", transition: "all 0.15s",
                  }}
                />
              </div>
            );
          })}
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginLeft: 4 }}>
            {activePillars}/5 active
          </span>
          <span style={{ color: C.textTertiary, opacity: 0.3, fontFamily: FONT_MONO, fontSize: 10 }}>·</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: autonomousCount > 0 ? C.amber : C.textTertiary }}>
            {autonomousCount} autonomous
          </span>
          <span style={{ color: C.textTertiary, opacity: 0.3, fontFamily: FONT_MONO, fontSize: 10 }}>·</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: copilotCount > 0 ? C.textPrimary : C.textTertiary }}>
            {copilotCount} co-pilot
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => setFleetConfigOpen(prev => !prev)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 6, cursor: "pointer",
            background: effectiveConfigOpen ? C.gold + "18" : C.gold + "10",
            border: `1px solid ${effectiveConfigOpen ? C.gold + "40" : C.gold + "25"}`,
            fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: C.gold,
            transition: "all 0.15s",
          }}>
            <SettingsIcon size={12} /> Configure Fleet
            <ChevronUp size={10} style={{ transition: "transform 0.15s", transform: effectiveConfigOpen ? "rotate(0deg)" : "rotate(180deg)" }} />
          </button>
          {activePending.length > 0 && (
            <button onClick={() => navigate("/app/tasks")} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 6, cursor: "pointer",
              background: C.amber + "14", border: `1px solid ${C.amber}25`,
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: C.amber,
            }}>
              <ListChecks size={12} /> {activePending.length} Pending
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

      {/* ═══ B: Fleet Welcome (welcome phase only) ═══ */}
      {phase === "welcome" && (
        <FleetWelcome isMobile={isMobile} navigate={navigate} />
      )}

      {/* ═══ C: Fleet Config Panel (collapsible) ═══ */}
      {effectiveConfigOpen && (
        <FleetConfigPanel ref={configRef} autonomySettings={autonomySettings} onUpdate={handleAutonomyUpdate} />
      )}

      {/* ═══ D: Pending Review Queue ═══ */}
      {activePending.length > 0 && (
        <div style={{ marginBottom: isMobile ? 20 : 28 }}>
          <PendingReviewQueue
            actions={activePending}
            executedIds={executedActionIds}
            onApprove={handleApprove}
            onDismiss={handleDismiss}
            onViewAll={() => navigate("/app/tasks")}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* ═══ E: Pillar Sections × 5 ═══ */}
      {pillarAgents.map(({ pillar, agents }) => (
        <PillarSection
          key={pillar.id}
          pillar={pillar}
          agents={agents}
          autonomySettings={autonomySettings}
          onUpdate={handleAutonomyUpdate}
          isMobile={isMobile}
          navigate={navigate}
        />
      ))}

      {/* ═══ F: Pipeline Progress (welcome/activating phases only) ═══ */}
      {phase !== "operational" && (
        <div style={{
          display: "flex", alignItems: "center", gap: isMobile ? 6 : 10,
          padding: isMobile ? "12px 14px" : "14px 20px",
          background: C.bgCard, borderRadius: 10,
          border: `1px solid ${C.borderDefault}`,
          marginTop: isMobile ? 8 : 12,
        }}>
          {PILLARS.map((p, i) => {
            const on = isPillarActive(p);
            const PIcon = p.icon;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 8 }}>
                {i > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, opacity: 0.3 }}>→</span>}
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  opacity: on ? 1 : 0.35,
                }}>
                  <PIcon size={12} style={{ color: p.color }} />
                  {!isMobile && (
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: p.color }}>
                      {p.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: FONT_BODY, fontSize: fs(12, 11, isMobile), color: C.textTertiary }}>
            {activePillars} of 5 renewal functions active
            {activePillars < 5 && ". " + getNextPillarHint(activePillars)}
          </span>
        </div>
      )}
    </PageLayout>
  );
}

function getNextPillarHint(count) {
  const hints = [
    "Run Health Monitor to activate Monitor.",
    "Run Forecast Engine to activate Predict.",
    "Run Outreach Drafter to activate Generate.",
  ];
  return hints[count] || "";
}
