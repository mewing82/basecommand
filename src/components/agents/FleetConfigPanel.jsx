import { useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { ACTION_TYPE_DEFS, LEVEL_DEFS, LEVEL_COLORS } from "./agentHubHelpers";

export default function FleetConfigPanel({ autonomySettings, onUpdate }) {
  const { isMobile } = useMediaQuery();
  const [saved, setSaved] = useState(false);

  if (!autonomySettings) return null;

  function setLevel(actionType, level) {
    const updated = { ...autonomySettings, [actionType]: level };
    onUpdate(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function toggleAutoCritical() {
    const updated = { ...autonomySettings, auto_approve_critical: !autonomySettings.auto_approve_critical };
    onUpdate(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div style={{
      padding: isMobile ? "16px 14px" : "20px 22px",
      background: C.bgCard, borderRadius: 10, border: `1px solid ${C.borderDefault}`,
      marginBottom: isMobile ? 20 : 28,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
          Fleet Autonomy Levels
        </span>
        <div style={{ flex: 1 }} />
        {saved && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.green }}>Saved</span>}
        <button
          onClick={() => {
            const defaults = { risk_assessment: "draft", auto_approve_critical: false };
            onUpdate(defaults);
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
          title="Reset to defaults"
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 4, cursor: "pointer",
            background: "transparent", border: `1px solid ${C.borderDefault}`,
            fontFamily: FONT_MONO, fontSize: 9, fontWeight: 500, color: C.textTertiary,
            transition: "all 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.textSecondary; e.currentTarget.style.color = C.textSecondary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textTertiary; }}
        >
          <RotateCcw size={9} /> Reset
        </button>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5, marginBottom: 16 }}>
        Control how autonomous each action type is. All actions are logged regardless of level.
      </div>

      {/* Action type cards — responsive grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: 12, marginBottom: 14,
      }}>
        {ACTION_TYPE_DEFS.map(at => {
          const Icon = at.icon;
          const currentLevel = autonomySettings[at.id] || "draft";
          return (
            <div key={at.id} style={{
              background: "rgba(255,255,255,0.02)", border: `1px solid ${C.borderDefault}`,
              borderRadius: 10, padding: "14px 14px 12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: at.color + "14", border: `1px solid ${at.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={14} color={at.color} />
                </div>
                <div>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{at.label}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textTertiary }}>{at.desc}</div>
                </div>
              </div>

              {/* Level selector — 3 buttons */}
              <div style={{ display: "flex", gap: 4 }}>
                {LEVEL_DEFS.map(level => {
                  const isActive = currentLevel === level.id;
                  const color = LEVEL_COLORS[level.id];
                  return (
                    <button
                      key={level.id}
                      onClick={() => setLevel(at.id, level.id)}
                      title={level.desc}
                      style={{
                        flex: 1, padding: "6px 0", borderRadius: 5, cursor: "pointer",
                        textAlign: "center",
                        border: `1px solid ${isActive ? color + "60" : C.borderDefault}`,
                        background: isActive ? color + "14" : "transparent",
                        fontFamily: FONT_MONO, fontSize: 10, fontWeight: isActive ? 700 : 500,
                        color: isActive ? color : C.textTertiary,
                        transition: "all 0.12s",
                      }}
                    >
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-approve critical toggle */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 8,
        background: "rgba(255,255,255,0.02)", border: `1px solid ${C.borderDefault}`,
      }}>
        <AlertTriangle size={14} style={{ color: C.amber, flexShrink: 0 }} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, flex: 1 }}>
          Auto-approve critical urgency actions
        </span>
        <button onClick={toggleAutoCritical} style={{
          width: 36, height: 20, borderRadius: 10, cursor: "pointer",
          background: autonomySettings.auto_approve_critical ? C.amber : C.borderDefault,
          border: "none", position: "relative", flexShrink: 0,
          transition: "background 0.2s",
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: "50%", background: C.textPrimary,
            position: "absolute", top: 3,
            left: autonomySettings.auto_approve_critical ? 19 : 3,
            transition: "left 0.2s",
          }} />
        </button>
      </div>
    </div>
  );
}
