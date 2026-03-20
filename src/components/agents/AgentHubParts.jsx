import { ArrowRight, CheckCircle, X, ListChecks, ChevronRight } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { AGENT_ACTION_TYPES, isAgentCached } from "../../lib/pillars";
import { AUTONOMY_LEVELS, LEVEL_COLORS, URGENCY_COLORS, getEffectiveLevel, getCacheAge } from "./agentHubHelpers";

// ─── Autonomy Dial ───────────────────────────────────────────────────────────
export function AutonomyDial({ agentId, autonomySettings, onUpdate, compact }) {
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
    <div style={{ display: "flex", gap: 3, marginTop: compact ? 0 : 10 }}>
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

// ─── Operations Center Row ───────────────────────────────────────────────────
export function OpsRow({ agent, autonomySettings, onUpdate, isMobile, navigate }) {
  const AgentIcon = agent.icon;
  const mode = agent.mode;
  const modeColor = LEVEL_COLORS[mode];
  const cached = isAgentCached(agent.cacheKey);
  const cacheAge = getCacheAge(agent.cacheKey);
  const isExecuteMode = mode === "execute";
  const borderColor = isExecuteMode ? C.amber : C.gold;

  return (
    <div
      onClick={() => navigate(agent.route)}
      style={{
        display: "flex", flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        gap: isMobile ? 8 : 14,
        padding: isMobile ? "12px 14px" : "14px 18px",
        background: `${borderColor}06`,
        borderRadius: 8, cursor: "pointer",
        border: `1px solid ${C.borderDefault}`,
        borderLeftWidth: 3, borderLeftColor: `${borderColor}${isExecuteMode ? "60" : "40"}`,
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${borderColor}0C`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${borderColor}06`; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: isMobile ? undefined : 1, minWidth: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: agent.color + "14", border: `1px solid ${agent.color}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AgentIcon size={16} color={agent.color} strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{agent.name}</span>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700,
              padding: "1px 6px", borderRadius: 3, textTransform: "uppercase",
              letterSpacing: "0.05em",
              background: modeColor + "18", color: modeColor, border: `1px solid ${modeColor}25`,
            }}>{mode}</span>
          </div>
          {!isMobile && (
            <div style={{
              fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2,
            }}>{agent.description}</div>
          )}
        </div>
      </div>
      {isMobile && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {agent.description}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: cached ? C.green : C.textTertiary + "60",
          boxShadow: cached ? `0 0 4px ${C.green}40` : "none",
          ...(isExecuteMode && cached ? { animation: "bc-pulse-glow 2s ease-in-out infinite" } : {}),
        }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: cached ? C.green : C.textTertiary, whiteSpace: "nowrap" }}>
          {cached ? (cacheAge ? `Last run ${cacheAge}` : "Has results") : "Not run yet"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <AutonomyDial agentId={agent.agentId} autonomySettings={autonomySettings} onUpdate={onUpdate} compact />
        <span
          onClick={() => navigate(agent.route)}
          style={{
            fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: agent.color,
            display: "flex", alignItems: "center", gap: 4, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          Open <ArrowRight size={11} />
        </span>
      </div>
    </div>
  );
}

// ─── Pending Review Queue ────────────────────────────────────────────────────
export function PendingReviewQueue({ actions, executedIds, onApprove, onDismiss, onViewAll, isMobile }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <ListChecks size={14} style={{ color: C.amber }} />
        <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
          Pending Review ({actions.length})
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {actions.slice(0, 5).map(action => {
          const c = URGENCY_COLORS[action.urgency] || C.textTertiary;
          const wasExecuted = executedIds.has(action.id);
          return (
            <div key={action.id} style={{
              display: "flex", flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              gap: isMobile ? 8 : 12,
              padding: isMobile ? "10px 12px" : "10px 14px",
              background: C.bgCard, borderRadius: 8,
              border: `1px solid ${C.borderDefault}`,
              borderLeft: `3px solid ${wasExecuted ? C.green : c}`,
              transition: "all 0.3s", opacity: wasExecuted ? 0.6 : 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 8, fontWeight: 700,
                  padding: "2px 6px", borderRadius: 3, textTransform: "uppercase",
                  background: c + "18", color: c, border: `1px solid ${c}25`, flexShrink: 0,
                }}>{action.urgency || "medium"}</span>
                <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, flexShrink: 0 }}>
                  {action.accountName}
                </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {action.title}
                </span>
                {wasExecuted && (
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600, color: C.green, background: C.greenMuted, padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>EXECUTED</span>
                )}
              </div>
              {!wasExecuted && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => onApprove(action.id)} style={{
                    padding: "4px 10px", borderRadius: 5, border: "none",
                    background: C.greenMuted, color: C.green,
                    fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <CheckCircle size={11} /> Approve
                  </button>
                  <button onClick={() => onDismiss(action.id)} style={{
                    padding: "4px 10px", borderRadius: 5, border: "none",
                    background: "transparent", color: C.textTertiary,
                    fontFamily: FONT_SANS, fontSize: 11, fontWeight: 500,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <X size={11} /> Dismiss
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {actions.length > 5 && (
        <button
          onClick={onViewAll}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            marginTop: 10, width: "100%", padding: "8px 12px",
            borderRadius: 8, border: `1px solid ${C.borderDefault}`,
            background: "transparent", color: C.textSecondary,
            fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.amber + "40"; e.currentTarget.style.color = C.amber; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}
        >
          View all {actions.length} in Agent Queue <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}
