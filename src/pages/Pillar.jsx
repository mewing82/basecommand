import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight, Sparkles, BarChart3,
  CheckCircle, Bot,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { renewalStore } from "../lib/storage";
import { PageLayout } from "../components/layout/PageLayout";
import { computePortfolioHealth, computePortfolioSummary, getSeverity } from "../lib/healthScore";
import { formatARR } from "../lib/utils";
import { PILLARS, AGENT_DETAILS, isAgentCached as isAgentCachedShared } from "../lib/pillars";
import { getEffectiveLevel, LEVEL_COLORS } from "../components/agents/agentHubHelpers";

// ─── Pillar-specific recommendations ────────────────────────────────────────
const RECOMMENDATIONS = {
  monitor: [
    { text: "Run Portfolio Health Monitor to score all accounts", priority: "high", agentId: "health-monitor" },
    { text: "Add context data (Gong notes, support tickets) for richer health signals", priority: "medium" },
    { text: "Set renewal dates on all accounts for accurate proximity scoring", priority: "medium" },
  ],
  predict: [
    { text: "Generate a GRR/NRR forecast to baseline your retention metrics", priority: "high", agentId: "forecast-engine" },
    { text: "Compare against industry benchmarks (92% median GRR, 103% median NRR)", priority: "medium" },
    { text: "Run weekly to track forecast delta and trending direction", priority: "low" },
  ],
  generate: [
    { text: "Draft outreach for accounts renewing in the next 30 days", priority: "high", agentId: "outreach-drafter" },
    { text: "Generate rescue plans for high-risk accounts", priority: "high", agentId: "rescue-planner" },
    { text: "Personalize emails using account context and archetype data", priority: "medium" },
  ],
  identify: [
    { text: "Scan portfolio for expansion signals and PQLs", priority: "high", agentId: "expansion-scout" },
    { text: "Generate opportunity briefs for upcoming renewal conversations", priority: "medium", agentId: "opportunity-brief" },
    { text: "Tag accounts with expansion potential for NRR improvement", priority: "low" },
  ],
  orchestrate: [
    { text: "Generate an executive brief for your next leadership meeting", priority: "high", agentId: "executive-brief" },
    { text: "Build 90/60/30 day playbooks for key renewals", priority: "medium", agentId: "playbook-builder" },
    { text: "Prepare meeting briefs before renewal calls", priority: "medium", agentId: "meeting-prep" },
  ],
};

function isAgentCached(cacheKey) {
  return isAgentCachedShared(cacheKey);
}

export default function Pillar() {
  const { pillarId } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useMediaQuery();
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [autonomySettings, setAutonomySettings] = useState(null);

  useEffect(() => {
    (async () => {
      const accts = await renewalStore.getAccounts();
      if (accts.length === 0) return;
      const contextMap = {};
      await Promise.all(accts.map(async (a) => {
        try { const ctx = await renewalStore.getContext(a.id); if (ctx?.length) contextMap[a.id] = ctx; } catch { /* skip */ }
      }));
      const results = computePortfolioHealth(accts, contextMap);
      setPortfolioSummary(computePortfolioSummary(results));
    })();
    renewalStore.getAutonomySettings().then(setAutonomySettings);
  }, []);

  const pillar = PILLARS.find(p => p.id === pillarId);
  if (!pillar) return <PageLayout><div style={{ padding: 40, textAlign: "center", color: C.textTertiary }}>Pillar not found</div></PageLayout>;

  const agents = pillar.agents.map(id => {
    const d = AGENT_DETAILS[id];
    if (!d) return null;
    return { ...d, agentId: id, mode: getEffectiveLevel(id, autonomySettings) };
  }).filter(Boolean);
  const recs = RECOMMENDATIONS[pillarId] || [];
  const Icon = pillar.icon;
  const pillarIdx = PILLARS.findIndex(p => p.id === pillarId);
  const prevPillar = pillarIdx > 0 ? PILLARS[pillarIdx - 1] : null;
  const nextPillar = pillarIdx < PILLARS.length - 1 ? PILLARS[pillarIdx + 1] : null;
  const activeCount = agents.filter(a => isAgentCached(a.cacheKey)).length;
  const totalAgents = agents.length;
  const pillarActive = activeCount > 0;
  const priorityColors = { high: C.red, medium: C.amber, low: C.textTertiary };

  return (
    <PageLayout maxWidth={1100}>
      {/* Pillar pipeline breadcrumb */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4, marginBottom: isMobile ? 16 : 24,
        padding: isMobile ? "8px 10px" : "10px 16px", background: C.bgCard, borderRadius: 8,
        border: `1px solid ${C.borderDefault}`, overflowX: "auto",
      }}>
        {PILLARS.map((p, i) => {
          const PIcon = p.icon;
          const isCurrent = p.id === pillarId;
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.textTertiary, opacity: 0.4, margin: "0 4px" }}>→</span>}
              <button
                onClick={() => navigate(`/app/pillars/${p.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600,
                  color: isCurrent ? p.color : C.textTertiary,
                  padding: "4px 12px", borderRadius: 4, whiteSpace: "nowrap",
                  background: isCurrent ? `${p.color}14` : "transparent",
                  border: isCurrent ? `1px solid ${p.color}30` : "1px solid transparent",
                  cursor: "pointer", transition: "all 0.12s",
                }}
                onMouseEnter={e => { if (!isCurrent) { e.currentTarget.style.color = p.color; e.currentTarget.style.background = `${p.color}08`; } }}
                onMouseLeave={e => { if (!isCurrent) { e.currentTarget.style.color = C.textTertiary; e.currentTarget.style.background = "transparent"; } }}
              >
                <PIcon size={12} /> {p.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pillar header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `${pillar.color}14`, border: `1px solid ${pillar.color}25`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={26} style={{ color: pillar.color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontFamily: FONT_SANS, fontSize: fs(26, 20, isMobile), fontWeight: 700, color: C.textPrimary, margin: 0 }}>{pillar.label}</h1>
            <span style={{
              fontFamily: FONT_SANS, fontSize: 10, fontWeight: 600, textTransform: "uppercase",
              color: pillarActive ? C.green : C.textTertiary,
              background: pillarActive ? C.greenMuted : "rgba(0,0,0,0.04)",
              padding: "3px 8px", borderRadius: 4,
            }}>{pillarActive ? "Active" : "Idle"}</span>
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>
            {pillar.tagline}
          </p>
        </div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary, flexShrink: 0 }}>
          {activeCount}/{totalAgents} agents active
        </div>
      </div>

      {/* Agents in this pillar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Bot size={16} style={{ color: pillar.color }} /> Agents
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${Math.min(agents.length, 3)}, 1fr)`, gap: 12 }}>
          {agents.map(agent => {
            const AgentIcon = agent.icon;
            const cached = isAgentCached(agent.cacheKey);
            return (
              <div key={agent.name} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12,
                padding: isMobile ? "14px 14px 12px" : "20px 20px 16px",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${agent.color}10 0%, transparent 70%)`, pointerEvents: "none" }} />
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
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: cached ? C.green : C.textTertiary, boxShadow: cached ? `0 0 4px ${C.green}40` : "none" }} />
                        <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: cached ? C.green : C.textTertiary }}>{cached ? "Active" : "Not run yet"}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5, marginBottom: 12, minHeight: 36 }}>
                    {agent.description}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: LEVEL_COLORS[agent.mode] || C.textTertiary, background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{agent.mode}</span>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => navigate(agent.route)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: agent.color,
                        background: "transparent", border: "none", cursor: "pointer",
                        padding: "4px 0",
                      }}
                    >
                      {cached ? "View Results" : "Run Agent"} <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} style={{ color: C.aiBlue }} /> Recommendations
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recs.map((rec, i) => {
            const agent = rec.agentId ? AGENT_DETAILS[rec.agentId] : null;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", background: C.bgCard,
                border: `1px solid ${C.borderDefault}`, borderRadius: 10,
                borderLeft: `3px solid ${priorityColors[rec.priority] || C.textTertiary}`,
              }}>
                <CheckCircle size={14} style={{ color: priorityColors[rec.priority], flexShrink: 0 }} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 1.5 }}>{rec.text}</span>
                {agent && (
                  <button
                    onClick={() => navigate(agent.route)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                      background: agent.color + "14", border: `1px solid ${agent.color}25`,
                      color: agent.color, fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600,
                      flexShrink: 0, transition: "all 0.12s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = agent.color + "20"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = agent.color + "14"; }}
                  >
                    <agent.icon size={12} /> {agent.name} <ArrowRight size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Portfolio context */}
      {portfolioSummary && portfolioSummary.total > 0 && (
        <div style={{
          background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12,
          padding: isMobile ? "16px 14px" : "20px 22px", marginBottom: 28,
        }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={16} style={{ color: C.textSecondary }} /> Portfolio Context
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10 }}>
            {[
              { label: "Accounts", value: portfolioSummary.total, color: C.textPrimary },
              { label: "Avg Health", value: portfolioSummary.avgScore.toFixed(1), color: getSeverity(portfolioSummary.avgScore).color },
              { label: "Portfolio ARR", value: formatARR(portfolioSummary.totalARR), color: C.textPrimary },
              { label: "At-Risk ARR", value: formatARR(portfolioSummary.atRiskARR), color: portfolioSummary.atRiskARR > 0 ? C.red : C.green },
            ].map((stat, i) => (
              <div key={i} style={{ padding: "10px 14px", background: C.bgPrimary, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: fs(18, 16, isMobile), fontWeight: 700, color: stat.color, marginTop: 4 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prev/Next pillar navigation */}
      <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
        {prevPillar ? (
          <button onClick={() => navigate(`/app/pillars/${prevPillar.id}`)} style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            padding: "14px 18px", borderRadius: 10, cursor: "pointer",
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500,
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = prevPillar.color + "40"; e.currentTarget.style.color = prevPillar.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}
          >
            <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> {prevPillar.label}
          </button>
        ) : <div style={{ flex: 1 }} />}
        {nextPillar && (
          <button onClick={() => navigate(`/app/pillars/${nextPillar.id}`)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8,
            padding: "14px 18px", borderRadius: 10, cursor: "pointer",
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500,
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = nextPillar.color + "40"; e.currentTarget.style.color = nextPillar.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}
          >
            {nextPillar.label} <ArrowRight size={14} />
          </button>
        )}
      </div>
    </PageLayout>
  );
}
