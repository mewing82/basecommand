import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TrendingUp, Sparkles, AlertTriangle, Zap, ArrowRight, Search, Loader } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { renewalStore } from "../../lib/storage";
import { callAI } from "../../lib/ai";
import { PageLayout } from "../../components/layout/PageLayout";
import { Btn } from "../../components/ui/index";
import { computePortfolioHealth, ARCHETYPES } from "../../lib/healthScore";
import { RENEWAL_EXPANSION_PROMPT, buildCompanyContext } from "../../lib/prompts";
import { formatARR } from "../../lib/utils";
import { AILoadingProgress, ActionMenu } from "../../components/ui/AgentWidgets";

const SIGNAL_COLORS = {
  usage_growth: "#34D399", feature_request: "#22D3EE", team_expansion: "#6366F1",
  contract_timing: "#FBBF24", competitive_displacement: "#F87171", product_gap: "#A78BFA",
  pql_trigger: "#34D399", budget_signal: "#22D3EE",
};
const SIGNAL_LABELS = {
  usage_growth: "Usage Growth", feature_request: "Feature Request", team_expansion: "Team Expansion",
  contract_timing: "Contract Timing", competitive_displacement: "Competitive", product_gap: "Product Gap",
  pql_trigger: "PQL Trigger", budget_signal: "Budget Signal",
};

export default function ExpansionScout() {
  const { isMobile } = useMediaQuery();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [healthResults, setHealthResults] = useState([]);
  const [cache, setCache] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadStartedAt, setLoadStartedAt] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchParams] = useSearchParams();
  const targetAccountId = searchParams.get("accountId");

  const cachedAgo = cache?._generatedAt ? (() => {
    const m = Math.floor((Date.now() - cache._generatedAt) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
  })() : null;

  useEffect(() => {
    (async () => {
      const accts = await renewalStore.getAccounts();
      setAccounts(accts);
      setCache(await renewalStore.getExpansionCache());
      // Compute health for archetype-enriched expansion analysis
      const contextMap = {};
      for (const a of accts) {
        try { const ctx = await renewalStore.getContext(a.id); if (ctx?.length) contextMap[a.id] = ctx; } catch { /* skip */ }
      }
      setHealthResults(computePortfolioHealth(accts, contextMap));
    })();
  }, []);

  // Auto-trigger analysis in focused single-account mode
  useEffect(() => {
    if (targetAccountId && accounts.length > 0 && healthResults.length > 0 && !cache && !loading) {
      analyzeExpansion();
    }
  }, [targetAccountId, accounts, healthResults]);

  async function analyzeExpansion() {
    const sourceAccounts = targetAccountId
      ? accounts.filter(a => a.id === targetAccountId)
      : accounts;
    const accountsWithContext = [];
    for (const a of sourceAccounts) {
      const ctx = await renewalStore.getContext(a.id);
      if (ctx.length > 0) accountsWithContext.push(a);
    }
    if (accountsWithContext.length === 0) return;
    setLoading(true); setLoadStartedAt(Date.now()); setError(null);
    try {
      const data = await Promise.all(accountsWithContext.map(async a => {
        const ctx = await renewalStore.getContext(a.id);
        const health = healthResults.find(r => r.account.id === a.id)?.health;
        return {
          id: a.id, name: a.name, arr: a.arr, renewalDate: a.renewalDate,
          riskLevel: a.riskLevel, contacts: a.contacts || [],
          healthScore: health?.score || "N/A",
          archetype: health?.archetypeInfo?.label || "Unknown",
          context: ctx.map(ci => ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 600)}`).join("\n"),
        };
      }));
      const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const settings = await renewalStore.getSettings();
      const companyContext = buildCompanyContext(settings.companyProfile);
      const response = await callAI(
        [{ role: "user", content: "Analyze my accounts for expansion opportunities, PQL triggers, and upsell signals. Include health scores and archetypes in your analysis." }],
        RENEWAL_EXPANSION_PROMPT(data, today, companyContext),
        4000
      );
      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      parsed._generatedAt = Date.now();
      setCache(parsed);
      await renewalStore.saveExpansionCache(parsed);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  const opportunities = cache?.opportunities || [];
  const signalTypes = [...new Set(opportunities.map(o => o.signalType))];
  const filtered = filter === "all" ? opportunities : opportunities.filter(o => o.signalType === filter);
  const totalExpansionValue = cache?.totalEstimatedExpansion;

  // Growth-ready accounts (Power Users, Converts, Enthusiastic Adopters)
  const growthAccounts = healthResults.filter(r =>
    ["power_user", "enthusiastic_adopter", "convert"].includes(r.health.archetype)
  );

  if (accounts.length === 0) return (
    <PageLayout maxWidth={1000}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: C.green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TrendingUp size={32} style={{ color: C.green }} />
        </div>
        <h2 style={{ fontFamily: FONT_SANS, fontSize: fs(22, 20, isMobile), fontWeight: 700, color: C.textPrimary, margin: 0 }}>Expansion Scout</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: 0 }}>
          Import your accounts to detect expansion opportunities, PQL triggers, and upsell signals hiding in your data.
        </p>
        <Btn variant="primary" onClick={() => navigate("/app/import")}>Import Portfolio Data</Btn>
      </div>
    </PageLayout>
  );

  return (
    <PageLayout maxWidth={1000}>
      {targetAccountId && (
        <button onClick={() => window.history.back()} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, padding: 0, marginBottom: 12,
          transition: "color 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = C.textSecondary; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.textTertiary; }}
        >
          <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back
        </button>
      )}
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px rgba(52, 211, 153, 0.6)" }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Growth Agent</span>
        </div>
      </div>

      {/* Growth-ready accounts summary */}
      {growthAccounts.length > 0 && (
        <div style={{
          background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
          border: `1px solid ${C.green}25`, borderLeft: `3px solid ${C.green}`,
          borderRadius: 12, padding: isMobile ? "14px 12px" : "18px 24px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <TrendingUp size={16} style={{ color: C.green }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: fs(15, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>
              {growthAccounts.length} growth-ready account{growthAccounts.length !== 1 ? "s" : ""}
            </span>
            {totalExpansionValue && (
              <span style={{ fontFamily: FONT_MONO, fontSize: isMobile ? 12 : 14, fontWeight: 700, color: C.green, marginLeft: isMobile ? 0 : "auto" }}>
                {totalExpansionValue} estimated expansion
              </span>
            )}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>
            Accounts classified as Power Users, Enthusiastic Adopters, or Converts — primed for expansion conversations.
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {growthAccounts.slice(0, 8).map(({ account, health }) => (
              <span key={account.id} style={{
                fontFamily: FONT_MONO, fontSize: 11, padding: "3px 8px", borderRadius: 4,
                background: ARCHETYPES[health.archetype].color + "14",
                border: `1px solid ${ARCHETYPES[health.archetype].color}25`,
                color: ARCHETYPES[health.archetype].color,
              }}>
                {account.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scan controls */}
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <Btn variant="ai" onClick={analyzeExpansion} disabled={loading}>
          {loading
            ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Scanning</>
            : <><Search size={14} /> Scan for Opportunities</>
          }
        </Btn>
        {cachedAgo && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Last scan: {cachedAgo}</span>}
        {error && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.red }}><AlertTriangle size={12} /> {error}</span>}
      </div>

          {loading && (
            <AILoadingProgress
              startedAt={loadStartedAt}
              phases={[
                { label: "Scanning portfolio for growth signals...", duration: 5000 },
                { label: "Analyzing engagement patterns...", duration: 7000 },
                { label: "Identifying expansion opportunities...", duration: 10000 },
                { label: "Estimating expansion value...", duration: 8000 },
              ]}
            />
          )}


      {/* Portfolio insights */}
      {cache?.portfolioInsights && (
        <div style={{
          background: C.bgCard, border: `1px solid ${C.borderDefault}`,
          borderRadius: 10, padding: isMobile ? "12px 12px" : "14px 18px", marginBottom: 20,
        }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.7 }}>
            {cache.portfolioInsights}
          </div>
        </div>
      )}

      {/* Signal type filter */}
      {opportunities.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setFilter("all")} style={{
            padding: "5px 12px", borderRadius: 6, cursor: "pointer",
            border: `1px solid ${filter === "all" ? C.gold + "60" : C.borderDefault}`,
            background: filter === "all" ? C.goldMuted : "transparent",
            color: filter === "all" ? C.textPrimary : C.textTertiary,
            fontFamily: FONT_SANS, fontSize: 12, fontWeight: filter === "all" ? 600 : 400,
          }}>All ({opportunities.length})</button>
          {signalTypes.map(type => {
            const color = SIGNAL_COLORS[type] || C.textTertiary;
            const count = opportunities.filter(o => o.signalType === type).length;
            return (
              <button key={type} onClick={() => setFilter(type)} style={{
                padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${filter === type ? color + "60" : C.borderDefault}`,
                background: filter === type ? color + "14" : "transparent",
                color: filter === type ? color : C.textTertiary,
                fontFamily: FONT_SANS, fontSize: 12, fontWeight: filter === type ? 600 : 400,
              }}>{SIGNAL_LABELS[type] || type} ({count})</button>
            );
          })}
        </div>
      )}

      {/* Opportunity cards */}
      {filtered.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((opp, i) => {
            const color = SIGNAL_COLORS[opp.signalType] || C.green;
            const confColors = { high: C.green, medium: C.amber, low: C.red };
            const matchedAccount = accounts.find(a => a.name === opp.accountName || a.id === opp.accountId);
            return (
              <div key={i} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                borderLeft: `3px solid ${color}`, borderRadius: 10, padding: isMobile ? "12px 12px" : "16px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <TrendingUp size={14} style={{ color }} />
                  <span style={{ fontFamily: FONT_SANS, fontSize: fs(15, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>{opp.accountName}</span>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color,
                    background: color + "18", padding: "2px 6px", borderRadius: 3,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>{SIGNAL_LABELS[opp.signalType] || opp.signalType}</span>
                  {opp.confidence && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: confColors[opp.confidence] || C.textTertiary }}>{opp.confidence}</span>}
                  {opp.estimatedValue && <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, color: C.green, marginLeft: "auto" }}>{opp.estimatedValue}</span>}
                </div>
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{opp.title}</div>
                {opp.evidence && (
                  <div style={{
                    fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6,
                    marginBottom: 8, padding: "8px 12px", background: C.bgPrimary,
                    borderRadius: 6, borderLeft: `2px solid ${color}40`,
                  }}>"{opp.evidence}"</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={12} style={{ color: C.gold }} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, fontWeight: 500 }}>{opp.recommendedAction}</span>
                  {opp.urgency && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginLeft: "auto", textTransform: "uppercase" }}>{opp.urgency}</span>}
                  {matchedAccount && (
                    <button onClick={() => navigate("/app/accounts", { state: { accountId: matchedAccount.id } })} style={{
                      display: "flex", alignItems: "center", gap: 4, padding: "2px 8px",
                      background: "transparent", border: `1px solid ${C.borderDefault}`,
                      borderRadius: 4, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary,
                    }}><ArrowRight size={10} /> View</button>
                  )}
                </div>
                  <ActionMenu accountName={opp.accountName} actionText={opp.recommendedAction} />
              </div>
            );
          })}
        </div>
      ) : !loading && cache && (
        <div style={{ textAlign: "center", padding: 40, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary }}>
          No expansion signals detected. Add more context data to accounts for richer analysis.
        </div>
      )}
    </PageLayout>
  );
}
