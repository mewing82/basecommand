import { ArrowRight } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, fs } from "../../lib/tokens";
import { isAgentCached } from "../../lib/pillars";
import { getEffectiveLevel, getCacheAge, LEVEL_COLORS } from "./agentHubHelpers";
import { AutonomyDial } from "./AgentHubParts";

export default function PillarSection({ pillar, agents, autonomySettings, onUpdate, isMobile, navigate }) {
  const on = agents.some(a => isAgentCached(a.cacheKey));
  const PIcon = pillar.icon;

  return (
    <div style={{
      marginBottom: isMobile ? 16 : 20,
      background: C.bgCard,
      border: `1px solid ${C.borderDefault}`,
      borderTop: `2px solid ${on ? pillar.color : pillar.color + "40"}`,
      borderRadius: 12,
      padding: isMobile ? "14px 14px 16px" : "18px 20px 20px",
    }}>
      {/* Pillar header */}
      <button
        onClick={() => navigate(`/app/pillars/${pillar.id}`)}
        style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
          background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%",
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: on ? pillar.color : pillar.color + "40",
          boxShadow: on ? `0 0 8px ${pillar.color}60` : "none",
        }} />
        <PIcon size={16} style={{ color: pillar.color }} />
        <span style={{
          fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile),
          fontWeight: 600, color: pillar.color, letterSpacing: "-0.01em",
        }}>
          {pillar.label}
        </span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>
          {pillar.tagline}
        </span>
        <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
        <span style={{
          fontFamily: FONT_SANS, fontSize: 10, fontWeight: 600,
          color: on ? pillar.color : C.textTertiary,
          background: on ? `${pillar.color}12` : "transparent",
          padding: on ? "2px 8px" : "0", borderRadius: 3,
        }}>
          {on ? "Active" : `${agents.length} agent${agents.length !== 1 ? "s" : ""}`}
        </span>
        <ArrowRight size={12} style={{ color: C.textTertiary }} />
      </button>

      {/* Agent cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : `repeat(${Math.min(agents.length, 3)}, 1fr)`,
        gap: isMobile ? 10 : 12,
      }}>
        {agents.map(agent => {
          const AgentIcon = agent.icon;
          const mode = getEffectiveLevel(agent.agentId, autonomySettings);
          const modeColor = LEVEL_COLORS[mode];
          const cached = isAgentCached(agent.cacheKey);
          const cacheAge = getCacheAge(agent.cacheKey);
          const borderAccent = mode === "execute" ? C.amber : mode === "draft" ? C.gold : null;

          return (
            <div
              key={agent.agentId}
              onClick={() => navigate(agent.route)}
              style={{
                background: C.bgPrimary,
                border: `1px solid ${C.borderDefault}`,
                borderLeft: borderAccent ? `3px solid ${borderAccent}40` : `1px solid ${C.borderDefault}`,
                borderRadius: 12,
                padding: isMobile ? "14px 14px 12px" : "20px 20px 16px",
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
              {/* Subtle radial glow */}
              <div style={{
                position: "absolute", top: -20, right: -20, width: 80, height: 80,
                borderRadius: "50%", background: `radial-gradient(circle, ${agent.color}10 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />

              <div style={{ position: "relative" }}>
                {/* Icon + name + status row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: agent.color + "14", border: `1px solid ${agent.color}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <AgentIcon size={18} color={agent.color} strokeWidth={1.75} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
                      {agent.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: cached ? C.green : C.textTertiary + "60",
                        boxShadow: cached ? `0 0 4px ${C.green}40` : "none",
                        ...(mode === "execute" && cached ? { animation: "bc-pulse-glow 2s ease-in-out infinite" } : {}),
                        flexShrink: 0,
                      }} />
                      <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: cached ? C.green : C.textTertiary }}>
                        {cached ? (cacheAge ? `Last run ${cacheAge}` : "Has results") : "Not run yet"}
                      </span>
                      <span style={{
                        fontFamily: FONT_SANS, fontSize: 8, fontWeight: 700,
                        padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.05em",
                        background: modeColor + "18", color: modeColor, border: `1px solid ${modeColor}25`,
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
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {agent.description}
                </div>

                {/* Autonomy dial */}
                <div onClick={e => e.stopPropagation()}>
                  <AutonomyDial agentId={agent.agentId} autonomySettings={autonomySettings} onUpdate={onUpdate} />
                </div>

                {/* CTA */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 5, marginTop: 12,
                  fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: agent.color,
                }}>
                  {cached ? "View Results" : "Open Agent"} <ArrowRight size={11} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
