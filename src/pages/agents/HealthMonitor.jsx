import { useState, useEffect } from "react";
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Shield, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { renewalStore } from "../../lib/storage";
import { PageLayout } from "../../components/layout/PageLayout";
import { Btn } from "../../components/ui/index";
import { computePortfolioHealth, computePortfolioSummary, getSeverity, ARCHETYPES } from "../../lib/healthScore";
import { formatARR } from "../../lib/utils";

const cardStyle = { padding: "18px 20px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, marginBottom: 12 };

function ScoreBar({ score, size = "md" }) {
  const sev = getSeverity(score);
  const pct = (score / 10) * 100;
  const h = size === "sm" ? 4 : 6;
  return (
    <div style={{ width: "100%", height: h, borderRadius: h / 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`, height: "100%", borderRadius: h / 2,
        background: `linear-gradient(90deg, ${sev.color}CC, ${sev.color})`,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

function SeverityBadge({ severity }) {
  return (
    <span style={{
      fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600,
      color: severity.color, textTransform: "uppercase",
      background: severity.color + "18", padding: "2px 7px", borderRadius: 3,
      letterSpacing: "0.04em",
    }}>{severity.label}</span>
  );
}

function ArchetypeBadge({ archetype }) {
  const info = ARCHETYPES[archetype];
  if (!info) return null;
  return (
    <span style={{
      fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600,
      color: info.color, textTransform: "uppercase",
      background: info.color + "14", padding: "2px 7px", borderRadius: 3,
      border: `1px solid ${info.color}30`,
      letterSpacing: "0.03em",
    }}>{info.label}</span>
  );
}

function SignalBreakdown({ signals, isMobile }) {
  const sortedKeys = Object.keys(signals).sort((a, b) => signals[a].score - signals[b].score);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {sortedKeys.map(key => {
        const s = signals[key];
        return (
          <div key={key} style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 6 : 10, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <div style={{ minWidth: isMobile ? "auto" : 120, width: isMobile ? "auto" : 120, fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, flexShrink: 0 }}>
              {s.label}
            </div>
            <div style={{ flex: 1 }}>
              <ScoreBar score={s.score} size="sm" />
            </div>
            <div style={{ width: 28, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: s.severity.color, textAlign: "right" }}>
              {s.score}
            </div>
            <div style={{ flex: 2, fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.reason}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AccountHealthCard({ account, health, defaultExpanded = false, isMobile }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const ChevIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <div style={{
      ...cardStyle,
      padding: isMobile ? "14px 12px" : "18px 20px",
      borderLeft: `3px solid ${health.severity.color}40`,
      marginBottom: 8,
    }}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12, padding: 0,
          textAlign: "left",
        }}
      >
        {/* Score circle */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: health.severity.color + "14",
          border: `1px solid ${health.severity.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700,
          color: health.severity.color,
        }}>
          {health.score}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>
              {account.name}
            </span>
            <SeverityBadge severity={health.severity} />
            <ArchetypeBadge archetype={health.archetype} />
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
            {formatARR(account.arr)}
            {account.renewalDate && <> · Renewal {account.renewalDate}</>}
            {health.renewalProbability != null && <> · {Math.round(health.renewalProbability * 100)}% renewal probability</>}
          </div>
        </div>

        <div style={{ width: 100 }}>
          <ScoreBar score={health.score} />
        </div>

        <ChevIcon size={14} style={{ color: C.textTertiary, flexShrink: 0 }} />
      </button>

      {/* Expanded: signal breakdown */}
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.borderDefault}` }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Signal Breakdown
          </div>
          <SignalBreakdown signals={health.signals} isMobile={isMobile} />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function HealthMonitor() {
  const { isMobile } = useMediaQuery();
  const [healthResults, setHealthResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | critical | high | medium | low | healthy

  useEffect(() => { loadHealth(); }, []);

  async function loadHealth() {
    setLoading(true);
    const accounts = await renewalStore.getAccounts();

    // Load context for each account (for context_richness signal)
    const contextMap = {};
    for (const acct of accounts) {
      try {
        const ctx = await renewalStore.getContext(acct.id);
        if (ctx?.length) contextMap[acct.id] = ctx;
      } catch { /* skip */ }
    }

    const results = computePortfolioHealth(accounts, contextMap);
    setHealthResults(results);
    setSummary(computePortfolioSummary(results));
    setLoading(false);
  }

  const filteredResults = filter === "all" ? healthResults : healthResults.filter(r => {
    const sev = r.health.severity.label.toLowerCase();
    return sev === filter;
  });

  return (
    <PageLayout maxWidth={900}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#34D399", boxShadow: "0 0 8px rgba(52, 211, 153, 0.6)",
            }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Renewal Agent
            </span>
          </div>
        </div>
        <Btn variant="ghost" onClick={loadHealth} disabled={loading}>
          <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          {loading ? "Scanning..." : "Refresh"}
        </Btn>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 8 : 10, marginBottom: 20 }}>
          {[
            { label: "Portfolio Health", value: summary.avgScore.toFixed(1), sub: `${summary.total} accounts`, color: getSeverity(summary.avgScore).color },
            { label: "At-Risk ARR", value: formatARR(summary.atRiskARR), sub: `of ${formatARR(summary.totalARR)}`, color: summary.atRiskARR > 0 ? C.red : C.green },
            { label: "Critical / High", value: `${summary.severityCounts.critical + summary.severityCounts.high}`, sub: "need attention", color: (summary.severityCounts.critical + summary.severityCounts.high) > 0 ? C.amber : C.green },
            { label: "Healthy", value: `${summary.severityCounts.healthy + summary.severityCounts.low}`, sub: "on track", color: C.green },
          ].map((stat, i) => (
            <div key={i} style={{ ...cardStyle, padding: isMobile ? "14px 12px" : "18px 20px" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: fs(22, 20, isMobile), fontWeight: 700, color: stat.color, letterSpacing: "-0.02em" }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginTop: 2 }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Archetype distribution */}
      {summary && summary.total > 0 && (
        <div style={{ ...cardStyle, padding: isMobile ? "14px 12px" : "18px 20px", marginBottom: 20 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
            Behavioral Archetypes
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(ARCHETYPES).map(([key, info]) => {
              const count = summary.archetypes[key] || 0;
              if (count === 0) return null;
              return (
                <div key={key} style={{
                  padding: "6px 12px", borderRadius: 6,
                  background: info.color + "10", border: `1px solid ${info.color}25`,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: info.color }}>
                    {count}
                  </span>
                  <div>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: info.color }}>
                      {info.label}
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textTertiary }}>
                      {info.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All" },
          { id: "critical", label: "Critical", color: "#F87171" },
          { id: "high", label: "High", color: "#FBBF24" },
          { id: "medium", label: "Medium", color: "#A78BFA" },
          { id: "low", label: "Low", color: "#34D399" },
          { id: "healthy", label: "Healthy", color: "#22D3EE" },
        ].map(tab => {
          const isActive = filter === tab.id;
          const count = tab.id === "all" ? healthResults.length : healthResults.filter(r => r.health.severity.label.toLowerCase() === tab.id).length;
          return (
            <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
              padding: "5px 12px", borderRadius: 6, cursor: "pointer",
              border: `1px solid ${isActive ? (tab.color || C.gold) + "60" : C.borderDefault}`,
              background: isActive ? (tab.color || C.gold) + "14" : "transparent",
              color: isActive ? (tab.color || C.textPrimary) : C.textTertiary,
              fontFamily: FONT_SANS, fontSize: 12, fontWeight: isActive ? 600 : 400,
              display: "flex", alignItems: "center", gap: 5,
              transition: "all 0.15s",
            }}>
              {tab.label}
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Account health cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Activity size={24} style={{ color: C.textTertiary, animation: "aiPulse 2s ease-in-out infinite" }} />
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 12 }}>
            Computing health scores across portfolio...
          </div>
        </div>
      ) : filteredResults.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Shield size={24} style={{ color: C.textTertiary }} />
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 12 }}>
            {healthResults.length === 0 ? "No accounts found. Import accounts to start monitoring." : `No accounts with ${filter} severity.`}
          </div>
        </div>
      ) : (
        <div>
          {filteredResults.map(({ account, health }) => (
            <AccountHealthCard
              key={account.id}
              account={account}
              health={health}
              defaultExpanded={health.score <= 4}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
}
