import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Sparkles, AlertTriangle, Zap, ArrowRight, Check, ClipboardCopy, TrendingUp, TrendingDown, Minus, ShieldAlert, Loader, Target } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { renewalStore, store } from "../../lib/storage";
import { callAI } from "../../lib/ai";
import { safeParse } from "../../lib/utils";
import { PageLayout } from "../../components/layout/PageLayout";
import { Btn } from "../../components/ui/index";
import { RENEWAL_FORECAST_PROMPT, buildCompanyContext } from "../../lib/prompts";
import { computePortfolioHealth, computePortfolioSummary } from "../../lib/healthScore";

// ─── Industry Benchmarks ────────────────────────────────────────────────────
const BENCHMARKS = {
  grr: { median: 92, bestInClass: 95, label: "GRR" },
  nrr: { median: 103, bestInClass: 120, label: "NRR" },
};

function BenchmarkBar({ value, metric }) {
  const bench = BENCHMARKS[metric];
  if (!bench || !value) return null;
  const numVal = parseFloat(String(value).replace("%", ""));
  if (isNaN(numVal)) return null;

  const min = 70, max = 140, range = max - min;
  const pct = v => Math.max(0, Math.min(100, ((v - min) / range) * 100));

  const valColor = numVal >= bench.bestInClass ? C.green : numVal >= bench.median ? C.amber : C.red;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ position: "relative", height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "visible" }}>
        {/* Fill to value */}
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 4,
          width: `${pct(numVal)}%`,
          background: `linear-gradient(90deg, ${valColor}40, ${valColor})`,
        }} />
        {/* Median marker */}
        <div style={{
          position: "absolute", left: `${pct(bench.median)}%`, top: -2, width: 1, height: 12,
          background: C.textTertiary, opacity: 0.5,
        }} />
        {/* Best-in-class marker */}
        <div style={{
          position: "absolute", left: `${pct(bench.bestInClass)}%`, top: -2, width: 1, height: 12,
          background: C.green, opacity: 0.6,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary }}>
          Median: {bench.median}%
        </span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.green }}>
          Best-in-class: {bench.bestInClass}%
        </span>
      </div>
    </div>
  );
}

export default function ForecastEngine() {
  const { isMobile } = useMediaQuery();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  useEffect(() => { renewalStore.getAccounts().then(setAccounts); }, []);

  const cacheKey = `bc2-${store._ws}-forecast`;
  const [forecast, setForecast] = useState(() => safeParse(localStorage.getItem(cacheKey), null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedSection, setCopiedSection] = useState(null);
  const [scenarioView, setScenarioView] = useState("expected");
  const [expandedPeriod, setExpandedPeriod] = useState(null);
  const [healthSummary, setHealthSummary] = useState(null);

  const cachedAgo = forecast?._generatedAt ? (() => {
    const m = Math.floor((Date.now() - forecast._generatedAt) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
  })() : null;

  // Compute health summary for enrichment
  useEffect(() => {
    if (accounts.length === 0) return;
    (async () => {
      const contextMap = {};
      for (const a of accounts) {
        try { const ctx = await renewalStore.getContext(a.id); if (ctx?.length) contextMap[a.id] = ctx; } catch { /* skip */ }
      }
      const results = computePortfolioHealth(accounts, contextMap);
      setHealthSummary(computePortfolioSummary(results));
    })();
  }, [accounts]);

  const now = new Date();
  const totalARR = accounts.reduce((sum, a) => sum + (a.arr || 0), 0);
  const fmt$ = (n) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  async function generateForecast() {
    if (accounts.length === 0) return;
    setLoading(true); setError(null);
    try {
      const portfolioData = await Promise.all(accounts.map(async a => {
        const daysUntil = Math.ceil((new Date(a.renewalDate) - now) / 86400000);
        const ctx = await renewalStore.getContext(a.id);
        return {
          id: a.id, name: a.name, arr: a.arr, renewalDate: a.renewalDate,
          riskLevel: a.riskLevel, daysUntilRenewal: daysUntil,
          contacts: a.contacts || [], summary: a.summary || "",
          contextCount: ctx.length,
          contextSummary: ctx.slice(0, 3).map(ci =>
            ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 300)}`
          ).join("\n"),
        };
      }));
      const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const settings = await renewalStore.getSettings();
      const companyContext = buildCompanyContext(settings.companyProfile);
      const response = await callAI(
        [{ role: "user", content: "Generate a comprehensive renewal forecast with benchmark comparisons." }],
        RENEWAL_FORECAST_PROMPT(portfolioData, today, companyContext),
        5000
      );
      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      parsed._generatedAt = Date.now();
      setForecast(parsed);
      localStorage.setItem(cacheKey, JSON.stringify(parsed));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text); setCopiedSection(id); setTimeout(() => setCopiedSection(null), 2000);
  }

  function buildForecastText() {
    if (!forecast) return "";
    let text = "RENEWAL FORECAST\n\n";
    if (forecast.narrative) text += forecast.narrative + "\n\n";
    if (forecast.metrics) text += `GRR: ${forecast.metrics.grr} | NRR: ${forecast.metrics.nrr} | Confidence: ${forecast.metrics.forecastConfidence}\n\n`;
    if (forecast.riskCallouts?.length > 0) {
      text += "RISK CALLOUTS\n";
      forecast.riskCallouts.forEach(r => { text += `• ${r.accountName} (${fmt$(r.arr)}): ${r.risk}\n`; });
      text += "\n";
    }
    if (forecast.actions?.length > 0) {
      text += "RECOMMENDED ACTIONS\n";
      forecast.actions.forEach(a => { text += `${a.priority}. ${a.action} (${a.impact})\n`; });
    }
    return text;
  }

  useEffect(() => { if (accounts.length > 0 && !forecast && !loading) generateForecast(); }, []);

  if (accounts.length === 0) return (
    <PageLayout maxWidth={1100}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#A78BFA18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart3 size={32} style={{ color: "#A78BFA" }} />
        </div>
        <h2 style={{ fontFamily: FONT_SANS, fontSize: fs(22, 20, isMobile), fontWeight: 700, color: C.textPrimary, margin: 0 }}>Forecast Engine</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: 0 }}>
          Board-ready forecasts with GRR/NRR metrics, confidence tiers, scenario modeling, and industry benchmark comparisons.
        </p>
        <Btn variant="primary" onClick={() => navigate("/app/import")}>Import Portfolio Data</Btn>
      </div>
    </PageLayout>
  );

  const trendIcons = { improving: TrendingUp, stable: Minus, declining: TrendingDown };

  return (
    <PageLayout maxWidth={1100}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: isMobile ? 8 : 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px rgba(52, 211, 153, 0.6)" }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Growth Agent</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {forecast && (
            <Btn variant="ghost" onClick={() => handleCopy(buildForecastText(), "all")}>
              {copiedSection === "all" ? <><Check size={14} /> Copied</> : <><ClipboardCopy size={14} /> Copy Forecast</>}
            </Btn>
          )}
          <Btn variant="ai" onClick={generateForecast} disabled={loading}>
            {loading ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</> : <><Sparkles size={14} /> Refresh</>}
            {cachedAgo && !loading && <span style={{ opacity: 0.6, fontSize: 11 }}>· {cachedAgo}</span>}
          </Btn>
        </div>
      </div>

      {error && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 16 }}><AlertTriangle size={14} /> {error}</div>}

      {loading && !forecast ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16 }}>
          <Loader size={24} style={{ color: "#A78BFA", animation: "spin 1s linear infinite" }} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Generating forecast for {accounts.length} accounts...</span>
        </div>
      ) : forecast ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Key Metrics with Benchmarks */}
          {forecast.metrics && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 8 : 12 }}>
              {[
                { label: "Gross Retention", value: forecast.metrics.grr, color: C.green, benchmark: "grr" },
                { label: "Net Retention", value: forecast.metrics.nrr, color: parseFloat(forecast.metrics.nrr) >= 100 ? C.green : C.amber, benchmark: "nrr" },
                { label: "GRR Trend", value: forecast.metrics.grrTrend || "—", color: forecast.metrics.grrTrend === "improving" ? C.green : forecast.metrics.grrTrend === "declining" ? C.red : C.textTertiary, icon: trendIcons[forecast.metrics.grrTrend] },
                { label: "Forecast Confidence", value: forecast.metrics.forecastConfidence || "—", color: forecast.metrics.forecastConfidence === "high" ? C.green : forecast.metrics.forecastConfidence === "low" ? C.red : C.amber },
              ].map((m, i) => {
                const TrendIcon = m.icon;
                return (
                  <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: isMobile ? "12px 12px" : "16px 18px" }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>{m.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: fs(22, 20, isMobile), fontWeight: 700, color: m.color, textTransform: "capitalize" }}>{m.value}</span>
                      {TrendIcon && <TrendIcon size={16} style={{ color: m.color }} />}
                    </div>
                    {m.benchmark && <BenchmarkBar value={m.value} metric={m.benchmark} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Revenue Impact Hint */}
          {forecast.metrics && healthSummary && (
            <div style={{
              background: C.bgCard, border: `1px solid ${C.green}20`,
              borderRadius: 10, padding: isMobile ? "12px 12px" : "14px 18px",
              display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 12,
            }}>
              <Target size={16} style={{ color: C.green, flexShrink: 0 }} />
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                <strong style={{ color: C.green }}>Revenue Impact:</strong> A 3% GRR improvement on your {fmt$(healthSummary.totalARR)} portfolio = <strong style={{ color: C.green }}>{fmt$(healthSummary.totalARR * 0.03)}</strong> in retained revenue.
                {healthSummary.atRiskARR > 0 && <> Currently {fmt$(healthSummary.atRiskARR)} is at risk.</>}
              </div>
            </div>
          )}

          {/* AI Narrative */}
          {forecast.narrative && (
            <div style={{
              background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
              border: "1px solid #A78BFA25", borderLeft: "3px solid #A78BFA",
              borderRadius: 12, padding: isMobile ? "14px 12px" : "22px 26px", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA15 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, position: "relative" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#A78BFA18", border: "1px solid #A78BFA25", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart3 size={14} color="#A78BFA" />
                </div>
                <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>Forecast Intelligence</span>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.8 }}>{forecast.narrative}</div>
              {forecast.metrics?.forecastConfidenceReason && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.borderDefault}`, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>
                  <strong style={{ color: C.textSecondary }}>Why this confidence level:</strong> {forecast.metrics.forecastConfidenceReason}
                </div>
              )}
            </div>
          )}

          {/* Period Cards */}
          {forecast.periods && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>Forecast by Period</span>
                <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 8 : 12 }}>
                {[
                  { key: "thisMonth", label: "This Month" },
                  { key: "nextMonth", label: "Next Month" },
                  { key: "thisQuarter", label: "This Quarter" },
                  { key: "nextQuarter", label: "Next Quarter" },
                ].map(period => {
                  const data = forecast.periods[period.key];
                  if (!data) return null;
                  const expanded = expandedPeriod === period.key;
                  const totalBar = (data.committed?.arr || 0) + (data.bestCase?.arr || 0) + (data.atRisk?.arr || 0);
                  return (
                    <button key={period.key} onClick={() => setExpandedPeriod(expanded ? null : period.key)} style={{
                      background: C.bgCard, border: `1px solid ${expanded ? "#A78BFA40" : C.borderDefault}`,
                      borderRadius: 12, padding: isMobile ? "14px 12px" : "18px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>{period.label}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: fs(22, 18, isMobile), fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>{fmt$(data.total || 0)}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 10 }}>{data.accountCount || 0} accounts</div>
                      {totalBar > 0 && (
                        <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 12, background: "rgba(255,255,255,0.04)" }}>
                          {data.committed?.arr > 0 && <div style={{ width: `${(data.committed.arr / totalBar) * 100}%`, background: C.green }} />}
                          {data.bestCase?.arr > 0 && <div style={{ width: `${(data.bestCase.arr / totalBar) * 100}%`, background: C.amber }} />}
                          {data.atRisk?.arr > 0 && <div style={{ width: `${(data.atRisk.arr / totalBar) * 100}%`, background: C.red }} />}
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {[
                          { label: "Committed", value: data.committed?.arr, accts: data.committed?.accounts, color: C.green },
                          { label: "Best Case", value: data.bestCase?.arr, accts: data.bestCase?.accounts, color: C.amber },
                          { label: "At Risk", value: data.atRisk?.arr, accts: data.atRisk?.accounts, color: C.red },
                        ].map(tier => (
                          <div key={tier.label}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: tier.color, flexShrink: 0 }} />
                              <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, flex: 1 }}>{tier.label}</span>
                              <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: tier.color }}>{fmt$(tier.value || 0)}</span>
                            </div>
                            {expanded && tier.accts?.length > 0 && (
                              <div style={{ marginLeft: 12, marginTop: 4, display: "flex", flexWrap: "wrap", gap: 3 }}>
                                {tier.accts.map((name, i) => (
                                  <span key={i} style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, background: C.bgPrimary, padding: "2px 6px", borderRadius: 3, border: `1px solid ${C.borderDefault}` }}>{name}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scenario Analysis */}
          {forecast.scenarios && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>Scenario Analysis</span>
                <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 14, background: C.bgCard, borderRadius: 8, padding: 3, border: `1px solid ${C.borderDefault}`, width: "fit-content" }}>
                {[
                  { id: "bestCase", label: "Best Case", color: C.green },
                  { id: "expected", label: "Expected", color: "#A78BFA" },
                  { id: "downside", label: "Downside", color: C.red },
                ].map(s => (
                  <button key={s.id} onClick={() => setScenarioView(s.id)} style={{
                    padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: scenarioView === s.id ? "rgba(255,255,255,0.1)" : "transparent",
                    color: scenarioView === s.id ? s.color : C.textTertiary,
                    fontFamily: FONT_SANS, fontSize: 13, fontWeight: scenarioView === s.id ? 600 : 500,
                  }}>{s.label}</button>
                ))}
              </div>
              {forecast.scenarios[scenarioView] && (
                <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12, padding: isMobile ? "14px 12px" : "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 12 : 16, marginBottom: 14, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 4 }}>Forecasted ARR</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: C.textPrimary }}>{fmt$(forecast.scenarios[scenarioView].totalARR || 0)}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 4 }}>GRR</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: scenarioView === "downside" ? C.red : scenarioView === "bestCase" ? C.green : "#A78BFA" }}>
                        {forecast.scenarios[scenarioView].grr || "—"}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>
                    {forecast.scenarios[scenarioView].narrative}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Risk Callouts */}
          {forecast.riskCallouts?.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <ShieldAlert size={16} style={{ color: C.red }} />
                <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>Forecast Risks</span>
                <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.red }}>{fmt$(forecast.riskCallouts.reduce((s, r) => s + (r.arr || 0), 0))} at risk</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {forecast.riskCallouts.map((risk, i) => (
                  <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.red}20`, borderLeft: `3px solid ${C.red}`, borderRadius: 10, padding: isMobile ? "12px 12px" : "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{risk.accountName}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.red, fontWeight: 600 }}>{fmt$(risk.arr || 0)}</span>
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 6 }}>{risk.risk}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Zap size={12} style={{ color: C.gold }} />
                      <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, fontWeight: 500 }}>{risk.recommendedAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {forecast.actions?.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Zap size={16} style={{ color: C.gold }} />
                <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>Actions to Improve Forecast</span>
                <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {forecast.actions.map((action, i) => (
                  <div key={i} style={{ display: "flex", gap: isMobile ? 10 : 14, alignItems: "flex-start", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: isMobile ? "12px 12px" : "14px 18px" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: C.goldMuted, border: `1px solid ${C.gold}20`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: C.gold,
                    }}>{action.priority}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 3 }}>{action.action}</div>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.green, fontWeight: 600 }}>{action.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </PageLayout>
  );
}
