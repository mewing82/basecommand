import { ArrowRight, Lightbulb, FileEdit, Zap } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { LEVEL_DEFS, LEVEL_COLORS } from "./agentHubHelpers";

const MODE_CARDS = [
  {
    level: "suggest",
    icon: Lightbulb,
    title: "Suggest",
    subtitle: "Co-Pilot",
    desc: "Agent analyzes and recommends. You decide.",
    bestFor: "Getting started",
  },
  {
    level: "draft",
    icon: FileEdit,
    title: "Draft",
    subtitle: "Semi-Autonomous",
    desc: "Agent creates draft actions. You approve.",
    bestFor: "Trusted workflows",
  },
  {
    level: "execute",
    icon: Zap,
    title: "Execute",
    subtitle: "Autonomous",
    desc: "Agent acts automatically. You audit the log.",
    bestFor: "Proven patterns",
  },
];

export default function FleetWelcome({ isMobile, navigate }) {
  return (
    <div style={{
      padding: isMobile ? "24px 16px" : "32px 28px",
      background: C.bgCard, borderRadius: 12,
      border: `1px solid ${C.borderDefault}`,
      marginBottom: isMobile ? 20 : 28,
      textAlign: "center",
    }}>
      <div style={{
        fontFamily: FONT_SANS, fontSize: fs(22, 18, isMobile),
        fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.02em",
        marginBottom: 8,
      }}>
        Activate Your AI Fleet
      </div>
      <div style={{
        fontFamily: FONT_BODY, fontSize: fs(14, 13, isMobile),
        color: C.textTertiary, lineHeight: 1.6, marginBottom: 24,
        maxWidth: 520, marginLeft: "auto", marginRight: "auto",
      }}>
        9 specialized agents across 5 renewal functions. Configure their autonomy level, then run your first agent.
      </div>

      {/* Three-mode explainer */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: isMobile ? 10 : 14,
        marginBottom: 24,
      }}>
        {MODE_CARDS.map(card => {
          const color = LEVEL_COLORS[card.level];
          const Icon = card.icon;
          return (
            <div key={card.level} style={{
              padding: isMobile ? "14px 14px" : "18px 16px",
              background: `${color}08`, borderRadius: 10,
              border: `1px solid ${color}20`,
              textAlign: "left",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: `${color}14`, border: `1px solid ${color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={14} color={color} />
                </div>
                <div>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700, color }}>
                    {card.title}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {card.subtitle}
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.5, marginBottom: 6 }}>
                {card.desc}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>
                Best for: {card.bestFor}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/app/agents/renewal/health-monitor")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 22px", borderRadius: 8, cursor: "pointer",
          background: C.gold, border: "none",
          fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: "#fff",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.goldHover; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.gold; }}
      >
        Run Portfolio Health Monitor <ArrowRight size={14} />
      </button>
    </div>
  );
}
