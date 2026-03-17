import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Sparkles, AlertTriangle, Zap, ArrowRight } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { renewalStore } from "../lib/storage";
import { callAI } from "../lib/ai";
import { PageLayout } from "../components/layout/PageLayout";
import { RENEWAL_EXPANSION_PROMPT, buildCompanyContext } from "../lib/prompts";

export default function Intel() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [cache, setCache] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountsWithContext, setAccountsWithContext] = useState([]);
  const cachedAgo = cache?._generatedAt ? (() => { const m = Math.floor((Date.now() - cache._generatedAt) / 60000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`; })() : null;

  useEffect(() => {
    (async () => {
      const accts = await renewalStore.getAccounts();
      setAccounts(accts);
      setCache(await renewalStore.getExpansionCache());
      const withCtx = [];
      for (const a of accts) {
        const ctx = await renewalStore.getContext(a.id);
        if (ctx.length > 0) withCtx.push(a);
      }
      setAccountsWithContext(withCtx);
    })();
  }, []);

  async function analyzeExpansion() {
    if (accountsWithContext.length === 0) return; setLoading(true); setError(null);
    try {
      const data = await Promise.all(accountsWithContext.map(async a => {
        const ctx = await renewalStore.getContext(a.id);
        return { id: a.id, name: a.name, arr: a.arr, renewalDate: a.renewalDate, riskLevel: a.riskLevel, contacts: a.contacts || [], context: ctx.map(ci => ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 600)}`).join("\n") };
      }));
      const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const settings = await renewalStore.getSettings();
      const companyContext = buildCompanyContext(settings.companyProfile);
      const response = await callAI([{ role: "user", content: "Analyze my accounts for renewal signals — expansion opportunities, churn risk, and renewal triggers." }], RENEWAL_EXPANSION_PROMPT(data, today, companyContext), 4000);
      let text = String(response).trim(); if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text); parsed._generatedAt = Date.now(); setCache(parsed); await renewalStore.saveExpansionCache(parsed);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  useEffect(() => { if (accountsWithContext.length > 0 && !cache && !loading) analyzeExpansion(); }, [accountsWithContext.length]);

  const signalColors = { usage_growth: C.green, feature_request: C.aiBlue, team_expansion: C.gold, contract_timing: C.amber, competitive_displacement: C.red, product_gap: "#a78bfa" };
  const signalLabels = { usage_growth: "Usage Growth", feature_request: "Feature Request", team_expansion: "Team Expansion", contract_timing: "Contract Timing", competitive_displacement: "Competitive", product_gap: "Product Gap" };

  return (
    <PageLayout maxWidth={1200}>
      {accounts.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center", padding: "40px 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: C.green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={32} style={{ color: C.green }} /></div>
          <div>
            <h2 style={{ fontFamily: FONT_SANS, fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Renewal Intelligence</h2>
            <p style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: "0.01em", opacity: 0.8, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: "0 auto" }}>Import your accounts first, then add context data (call notes, CRM exports, emails). AI will surface expansion opportunities, churn signals, risk indicators, and renewal triggers hiding in your data.</p>
          </div>
        </div>
      ) : accountsWithContext.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center", padding: "40px 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: C.green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={32} style={{ color: C.green }} /></div>
          <div>
            <h2 style={{ fontFamily: FONT_SANS, fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Add Context to Unlock Signals</h2>
            <p style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: "0.01em", opacity: 0.8, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: "0 auto" }}>You have {accounts.length} account{accounts.length !== 1 ? "s" : ""} but none have context data yet. Add call notes, CRM data, or emails to any account and AI will scan for expansion signals, churn risk, and renewal triggers.</p>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: "0.01em", opacity: 0.8, color: C.textTertiary, maxWidth: 400, lineHeight: 1.5 }}>
            <strong style={{ color: C.textSecondary }}>What counts as context?</strong> Gong call transcripts, Salesforce notes, email threads, support tickets, usage data — anything that reveals renewal health, risk signals, or growth opportunities.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.green}25`, borderLeft: `3px solid ${C.green}`, borderRadius: 12, padding: "22px 26px", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: C.green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={14} color={C.green} /></div>
              <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Renewal Intelligence</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto" }}>Analyzing {accountsWithContext.length} accounts</span>
              {cachedAgo && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>· {cachedAgo}</span>}
              <button onClick={analyzeExpansion} disabled={loading} style={{ background: loading ? C.green + "18" : "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: loading ? "wait" : "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: loading ? C.green : C.textTertiary, display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={11} style={{ animation: loading ? "aiPulse 2s ease-in-out infinite" : "none" }} />{loading ? "Analyzing..." : "Refresh"}
              </button>
            </div>
            {error && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 8 }}><AlertTriangle size={14} /> {error}</div>}
            {loading && !cache ? (<div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, animation: "aiPulse 2s ease-in-out infinite" }} /><span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Scanning account data for renewal signals...</span></div>
            ) : cache?.portfolioInsights ? (
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.7, marginBottom: 8 }}>{cache.portfolioInsights}</div>
                {cache.totalEstimatedExpansion && <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600, color: C.green }}>Total Estimated Expansion: {cache.totalEstimatedExpansion}</div>}
              </div>
            ) : (<div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Click Refresh to scan for renewal signals.</div>)}
          </div>

          {/* Opportunity Cards */}
          {cache?.opportunities?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}><span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Opportunities</span><div style={{ flex: 1, height: 1, background: C.borderDefault }} /><span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{cache.opportunities.length} signals</span></div>
              {cache.opportunities.map((opp, i) => {
                const color = signalColors[opp.signalType] || C.green;
                const matchedAccount = accounts.find(a => a.name === opp.accountName || a.id === opp.accountId);
                const confColors = { high: C.green, medium: C.amber, low: C.red };
                return (
                  <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <TrendingUp size={14} style={{ color }} />
                      <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{opp.accountName}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color, background: color + "18", padding: "2px 6px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{signalLabels[opp.signalType] || opp.signalType}</span>
                      {opp.confidence && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: confColors[opp.confidence] || C.textTertiary }}>{opp.confidence}</span>}
                      {opp.estimatedValue && <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, color: C.green, marginLeft: "auto" }}>{opp.estimatedValue}</span>}
                    </div>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{opp.title}</div>
                    {opp.evidence && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 8, padding: "8px 12px", background: C.bgPrimary, borderRadius: 6, borderLeft: `2px solid ${color}40` }}>"{opp.evidence}"</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Zap size={12} style={{ color: C.gold }} /><span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, fontWeight: 500 }}>{opp.recommendedAction}</span>
                      {opp.urgency && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginLeft: "auto", textTransform: "uppercase" }}>{opp.urgency}</span>}
                      {matchedAccount && <button onClick={() => navigate('/app/accounts', { state: { accountId: matchedAccount.id } })} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 4, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary }}><ArrowRight size={10} />View</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}
