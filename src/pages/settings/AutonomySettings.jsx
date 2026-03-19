import { useState, useEffect } from "react";
import { Bot, Mail, Shield, Zap, AlertTriangle } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { renewalStore } from "../../lib/storage";
import { Btn } from "../../components/ui/index";

const LEVELS = [
  { id: "suggest", label: "Suggest", desc: "Agent proposes — you review before any task is created" },
  { id: "draft", label: "Draft", desc: "Agent creates a draft task — you approve before execution" },
  { id: "execute", label: "Execute", desc: "Agent creates and executes automatically — logged to audit trail" },
];

const ACTION_TYPES = [
  { id: "email_draft", label: "Email Drafts", icon: Mail, color: "#22D3EE", desc: "Outreach emails, follow-ups, renewal reminders" },
  { id: "risk_assessment", label: "Risk Assessments", icon: Shield, color: "#F87171", desc: "Health score updates, risk level changes, alerts" },
  { id: "next_action", label: "Next Actions", icon: Zap, color: "#A78BFA", desc: "Recommended tasks, meeting preps, playbook steps" },
];

export default function AutonomySettings() {
  const { isMobile } = useMediaQuery();
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    renewalStore.getAutonomySettings().then(setSettings);
  }, []);

  async function save(newSettings) {
    setSettings(newSettings);
    await renewalStore.saveAutonomySettings(newSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function setLevel(actionType, level) {
    save({ ...settings, [actionType]: level });
  }

  function toggleAutoCritical() {
    save({ ...settings, auto_approve_critical: !settings.auto_approve_critical });
  }

  if (!settings) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Bot size={20} style={{ color: C.aiBlue }} />
        <span style={{ fontFamily: FONT_SANS, fontSize: fs(18, 16, isMobile), fontWeight: 700, color: C.textPrimary }}>Autonomy Controls</span>
        {saved && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.green, marginLeft: "auto" }}>Saved</span>}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6, marginBottom: 24 }}>
        Control how autonomous each action type is. All actions are logged to the execution audit trail regardless of level.
      </div>

      {/* Action type cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {ACTION_TYPES.map(at => {
          const Icon = at.icon;
          const currentLevel = settings[at.id] || "draft";
          return (
            <div key={at.id} style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 12, padding: isMobile ? "16px 14px" : "20px 22px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: at.color + "14", border: `1px solid ${at.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} color={at.color} />
                </div>
                <div>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{at.label}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>{at.desc}</div>
                </div>
              </div>

              {/* Level selector */}
              <div style={{ display: "flex", gap: 8, flexDirection: isMobile ? "column" : "row" }}>
                {LEVELS.map(level => {
                  const isActive = currentLevel === level.id;
                  const isExecute = level.id === "execute";
                  return (
                    <button
                      key={level.id}
                      onClick={() => setLevel(at.id, level.id)}
                      style={{
                        flex: 1, padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                        textAlign: "left",
                        border: `1px solid ${isActive ? (isExecute ? C.amber : C.aiBlue) + "50" : C.borderDefault}`,
                        background: isActive ? (isExecute ? C.amber + "10" : C.aiBlue + "10") : "transparent",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: isActive ? (isExecute ? C.amber : C.aiBlue) : C.textTertiary + "40",
                          boxShadow: isActive ? `0 0 4px ${isExecute ? C.amber : C.aiBlue}40` : "none",
                        }} />
                        <span style={{
                          fontFamily: FONT_SANS, fontSize: 13, fontWeight: isActive ? 600 : 500,
                          color: isActive ? C.textPrimary : C.textSecondary,
                        }}>{level.label}</span>
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, lineHeight: 1.4 }}>
                        {level.desc}
                      </div>
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
        marginTop: 20, background: C.bgCard, border: `1px solid ${C.borderDefault}`,
        borderRadius: 12, padding: isMobile ? "16px 14px" : "20px 22px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AlertTriangle size={18} style={{ color: C.amber, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>
              Auto-approve critical urgency actions
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5 }}>
              When enabled, actions marked "critical" by agents will be automatically approved regardless of the per-type setting above. Use with caution.
            </div>
          </div>
          <button onClick={toggleAutoCritical} style={{
            width: 44, height: 24, borderRadius: 12, cursor: "pointer",
            background: settings.auto_approve_critical ? C.amber : C.borderDefault,
            border: "none", position: "relative", flexShrink: 0,
            transition: "background 0.2s",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", background: C.textPrimary,
              position: "absolute", top: 3,
              left: settings.auto_approve_critical ? 23 : 3,
              transition: "left 0.2s",
            }} />
          </button>
        </div>
      </div>

      {/* Info callout */}
      <div style={{
        marginTop: 16, padding: "12px 16px", borderRadius: 8,
        background: C.bgAI, border: `1px solid ${C.borderAI}`,
      }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.aiBlue, textTransform: "uppercase", marginBottom: 4 }}>How it works</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.6 }}>
          <strong style={{ color: C.textSecondary }}>Suggest</strong> — Agents generate proposals in the Agent Queue for you to manually create tasks.{" "}
          <strong style={{ color: C.textSecondary }}>Draft</strong> — Agents create draft tasks automatically; you approve in the queue.{" "}
          <strong style={{ color: C.textSecondary }}>Execute</strong> — Agents create and execute tasks automatically. Every action is logged in the Execution Log for full transparency.
        </div>
      </div>
    </div>
  );
}
