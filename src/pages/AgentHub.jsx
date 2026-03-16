import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, BarChart3, Radio, Crown, FileText, Users, Sparkles, ArrowRight, Check, Lock } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { renewalStore } from "../lib/storage";
import { PageLayout } from "../components/layout/PageLayout";

const PRE_INSTALLED = [
  {
    id: "autopilot",
    name: "Autopilot",
    icon: Bot,
    color: "#6B8AFF",
    glow: "rgba(107, 138, 255, 0.12)",
    border: "rgba(107, 138, 255, 0.25)",
    description: "AI-generated renewal actions — draft emails, flag risks, surface next steps across your entire portfolio.",
    route: "/app/agents/autopilot",
    getStatus: () => {
      const actions = renewalStore.getAutopilotActions().filter(a => a.status === "pending");
      return actions.length > 0 ? `${actions.length} pending action${actions.length !== 1 ? "s" : ""}` : "No pending actions";
    },
    getMetric: () => {
      const actions = renewalStore.getAutopilotActions().filter(a => a.status === "pending");
      return actions.length;
    },
  },
  {
    id: "forecast",
    name: "Forecast",
    icon: BarChart3,
    color: "#A78BFA",
    glow: "rgba(167, 139, 250, 0.12)",
    border: "rgba(167, 139, 250, 0.25)",
    description: "Board-ready renewal forecasts with GRR/NRR, confidence tiers, scenario modeling, and risk callouts.",
    route: "/app/agents/forecast",
    getStatus: () => {
      try {
        const cache = JSON.parse(localStorage.getItem(`bc2-${renewalStore._key("").split("-renewals-")[0].replace("bc2-", "")}-forecast`));
        if (cache?.metrics?.grr) return `GRR: ${cache.metrics.grr}`;
      } catch {}
      return "Ready to generate";
    },
    getMetric: () => null,
  },
  {
    id: "intel",
    name: "Intel",
    icon: Radio,
    color: "#34D399",
    glow: "rgba(52, 211, 153, 0.12)",
    border: "rgba(52, 211, 153, 0.25)",
    description: "Expansion signals, churn risk indicators, competitive intelligence, and renewal triggers from your account data.",
    route: "/app/agents/intel",
    getStatus: () => {
      const cache = renewalStore.getExpansionCache();
      if (cache?.opportunities?.length > 0) return `${cache.opportunities.length} signal${cache.opportunities.length !== 1 ? "s" : ""} found`;
      return "Ready to scan";
    },
    getMetric: () => {
      const cache = renewalStore.getExpansionCache();
      return cache?.opportunities?.length || 0;
    },
  },
  {
    id: "briefs",
    name: "Briefs",
    icon: Crown,
    color: "#D4A843",
    glow: "rgba(212, 168, 67, 0.12)",
    border: "rgba(212, 168, 67, 0.25)",
    description: "Executive briefs, talking points, and strategic recommendations — copy-ready for leadership meetings and board updates.",
    route: "/app/agents/briefs",
    getStatus: () => {
      const cache = renewalStore.getLeadershipCache();
      if (cache?._generatedAt) {
        const m = Math.floor((Date.now() - cache._generatedAt) / 60000);
        const ago = m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`;
        return `Updated ${ago}`;
      }
      return "Ready to generate";
    },
    getMetric: () => null,
  },
];

const AVAILABLE_AGENTS = [
  {
    id: "playbook",
    name: "Renewal Playbook",
    icon: FileText,
    color: "#FB923C",
    glow: "rgba(251, 146, 60, 0.08)",
    border: "rgba(251, 146, 60, 0.20)",
    description: "Auto-generates 90/60/30 day action checklists for upcoming renewals. Creates tasks, drafts outreach, and builds a timeline — so nothing falls through the cracks.",
    route: "/app/agents/playbook",
  },
  {
    id: "meeting-prep",
    name: "Meeting Prep",
    icon: Users,
    color: "#22D3EE",
    glow: "rgba(34, 211, 238, 0.08)",
    border: "rgba(34, 211, 238, 0.20)",
    description: "Prep briefs for any renewal meeting — talking points, risk summary, relationship context, and recommended asks. Walk in prepared, not scrambling.",
    route: "/app/agents/meeting-prep",
  },
];

export default function AgentHub() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => renewalStore.getSettings());
  const activatedIds = settings.activatedAgents || [];

  function activateAgent(agentId) {
    const updated = { ...settings, activatedAgents: [...activatedIds, agentId] };
    renewalStore.saveSettings(updated);
    setSettings(updated);
  }

  const activeAvailable = AVAILABLE_AGENTS.filter(a => activatedIds.includes(a.id));
  const inactiveAvailable = AVAILABLE_AGENTS.filter(a => !activatedIds.includes(a.id));

  return (
    <PageLayout maxWidth={1100}>
      {/* Active Agents */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: "#34D399",
            boxShadow: "0 0 8px rgba(52, 211, 153, 0.6)",
          }} />
          <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>
            Active Agents
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
            {PRE_INSTALLED.length + activeAvailable.length}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {[...PRE_INSTALLED, ...activeAvailable].map(agent => {
            const Icon = agent.icon;
            const status = agent.getStatus ? agent.getStatus() : "Active";
            const metric = agent.getMetric ? agent.getMetric() : null;

            return (
              <button
                key={agent.id}
                onClick={() => navigate(agent.route)}
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.borderDefault}`,
                  borderRadius: 14,
                  padding: "24px 24px 20px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = agent.border;
                  e.currentTarget.style.boxShadow = `0 8px 32px ${agent.glow}, inset 0 1px 0 ${agent.border}`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.borderDefault;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Glow effect */}
                <div style={{
                  position: "absolute", top: -30, right: -30, width: 100, height: 100,
                  borderRadius: "50%", background: `radial-gradient(circle, ${agent.glow} 0%, transparent 70%)`,
                  pointerEvents: "none",
                }} />

                <div style={{ position: "relative" }}>
                  {/* Icon + Name row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 11,
                      background: agent.glow, border: `1px solid ${agent.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 4px 12px ${agent.glow}`,
                    }}>
                      <Icon size={20} color={agent.color} strokeWidth={1.75} />
                    </div>
                    <div>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>
                        {agent.name}
                      </div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: agent.color, marginTop: 1 }}>
                        {status}
                      </div>
                    </div>
                    {metric > 0 && (
                      <div style={{
                        marginLeft: "auto", fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700,
                        color: agent.color, opacity: 0.8,
                      }}>{metric}</div>
                    )}
                  </div>

                  {/* Description */}
                  <div style={{
                    fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary,
                    lineHeight: 1.6, letterSpacing: "0.01em", opacity: 0.7, marginBottom: 14,
                  }}>
                    {agent.description}
                  </div>

                  {/* Open button */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: agent.color,
                  }}>
                    Open <ArrowRight size={12} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Agents */}
      {inactiveAvailable.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: C.textTertiary, opacity: 0.4,
            }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textSecondary, letterSpacing: "-0.01em" }}>
              Available Agents
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
              {inactiveAvailable.length}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {inactiveAvailable.map(agent => {
              const Icon = agent.icon;

              return (
                <div
                  key={agent.id}
                  style={{
                    background: C.bgCard,
                    border: `1px solid ${C.borderDefault}`,
                    borderRadius: 14,
                    padding: "24px 24px 20px",
                    position: "relative",
                    overflow: "hidden",
                    opacity: 0.7,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = agent.border; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.borderColor = C.borderDefault; }}
                >
                  {/* Icon + Name row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 11,
                      background: "rgba(255,255,255,0.03)", border: `1px solid ${C.borderDefault}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={20} color={C.textTertiary} strokeWidth={1.75} />
                    </div>
                    <div>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textSecondary, letterSpacing: "-0.01em" }}>
                        {agent.name}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{
                    fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary,
                    lineHeight: 1.6, letterSpacing: "0.01em", opacity: 0.7, marginBottom: 16,
                  }}>
                    {agent.description}
                  </div>

                  {/* Activate button */}
                  <button
                    onClick={() => activateAgent(agent.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 18px", borderRadius: 8,
                      background: agent.glow, border: `1px solid ${agent.border}`,
                      color: agent.color, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = agent.color + "25"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = agent.glow; }}
                  >
                    <Sparkles size={14} /> Activate Agent
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
