import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Sparkles, AlertTriangle, Zap, ArrowRight, Check, ClipboardCopy, TrendingUp, TrendingDown, Minus, ShieldAlert } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { renewalStore, store } from "../lib/storage";
import { callAI } from "../lib/ai";
import { safeParse } from "../lib/utils";
import { PageLayout } from "../components/layout/PageLayout";
import { Btn } from "../components/ui/index";
import { RENEWAL_FORECAST_PROMPT } from "../lib/prompts";

export default function Forecast() {
  const navigate = useNavigate();
  const [accounts] = useState(() => renewalStore.getAccounts());

  const cacheKey = `bc2-${store._ws}-forecast`;
  const [forecast, setForecast] = useState(() => safeParse(localStorage.getItem(cacheKey), null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedSection, setCopiedSection] = useState(null);
  const [scenarioView, setScenarioView] = useState("expected");
  const [expandedPeriod, setExpandedPeriod] = useState(null);

  const cachedAgo = forecast?._generatedAt ? (() => {
    const m = Math.floor((Date.now() - forecast._generatedAt) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`;
  })() : null;

  const now = new Date();
  const totalARR = accounts.reduce((sum, a) => sum + (a.arr || 0), 0);
  const fmt$ = (n) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  async function generateForecast() {
    if (accounts.length === 0) return;
    setLoading(true); setError(null);
    try {
      const portfolioData = accounts.map(a => {
        const daysUntil = Math.ceil((new Date(a.renewalDate) - now) / 86400000);
        const ctx = renewalStore.getContext(a.id);
        return {
          id: a.id, name: a.name, arr: a.arr, renewalDate: a.renewalDate,
          riskLevel: a.riskLevel, daysUntilRenewal: daysUntil,
          contacts: a.contacts || [], summary: a.summary || "",
          contextCount: ctx.length,
          contextSummary: ctx.slice(0, 3).map(ci =>
            ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 300)}`
          ).join("\n"),
        };
      });
      const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const response = await callAI(
        [{ role: "user", content: "Generate a comprehensive renewal forecast for my portfolio." }],
        RENEWAL_FORECAST_PROMPT(portfolioData, today),
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

  useEffect(() => {
    if (accounts.length > 0 && !forecast && !loading) generateForecast();
  }, []);

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  }

  function buildForecastText() {
    if (!forecast) return "";
    let text = "RENEWAL FORECAST\n\n";
    if (forecast.narrative) text += forecast.narrative + "\n\n";
    if (forecast.metrics) {
      text += `GRR: ${forecast.metrics.grr} | NRR: ${forecast.metrics.nrr} | Confidence: ${forecast.metrics.forecastConfidence}\n\n`;
    }
    if (forecast.periods) {
      ["thisMonth", "nextMonth", "thisQuarter", "nextQuarter"].forEach(key => {
        const labels = { thisMonth: "This Month", nextMonth: "Next Month", thisQuarter: "This Quarter", nextQuarter: "Next Quarter" };
        const p = forecast.periods[key];
        if (p) {
          text += `${labels[key]}: ${fmt$(p.total)} (${p.accountCount} accounts)\n`;
          text += `  Committed: ${fmt$(p.committed?.arr || 0)} | Best Case: ${fmt$(p.bestCase?.arr || 0)} | At Risk: ${fmt$(p.atRisk?.arr || 0)}\n`;
        }
      });
      text += "\n";
    }
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

  // Empty state
  if (accounts.length === 0) return (
    <PageLayout maxWidth={1200}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center", padding: "40px 20px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#A78BFA18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart3 size={32} style={{ color: "#A78BFA" }} />
        </div>
        <div>
          <h2 style={{ fontFamily: FONT_SANS, fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Board-Ready Forecasts</h2>
          <p style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: "0.01em", opacity: 0.8, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: "0 auto" }}>
            Import your renewal portfolio to generate AI-powered forecasts with confidence tiers, GRR/NRR metrics, scenario modeling, and risk callouts — the output that usually requires a dedicated renewal director.
          </p>
        </div>
        <Btn variant="primary" onClick={() => navigate("/app/import")}>Import Portfolio Data</Btn>
      </div>
    </PageLayout>
  );

  const trendIcons = { improving: TrendingUp, stable: Minus, declining: TrendingDown };

  return (
    <PageLayout maxWidth={1200}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 20 }}>
          {forecast && (
            <button onClick={() => handleCopy(buildForecastText(), "all")} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10,
              border: `1px solid ${C.borderDefault}`, background: "transparent",
              fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: copiedSection === "all" ? C.green : C.textSecondary,
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {copiedSection === "all" ? <Check size={14} /> : <ClipboardCopy size={14} />}
              {copiedSection === "all" ? "Copied" : "Copy Forecast"}
            </button>
          )}
          <button onClick={generateForecast} disabled={loading} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10,
            border: `1px solid ${loading ? "#A78BFA30" : C.borderDefault}`,
            background: loading ? "#A78BFA15" : "transparent",
            cursor: loading ? "wait" : "pointer",
            fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: loading ? "#A78BFA" : C.textSecondary,
            transition: "all 0.2s ease",
          }}>
            <Sparkles size={14} style={{ color: loading ? "#A78BFA" : C.gold, animation: loading ? "aiPulse 2s ease-in-out infinite" : "none" }} />
            {loading ? "Generating..." : "Refresh"}
            {cachedAgo && !loading && <span style={{ color: C.textTertiary, fontSize: 12 }}>· {cachedAgo}</span>}
          </button>
      </div>

      {error && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 16 }}><AlertTriangle size={14} /> {error}</div>}

      {loading && !forecast ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#A78BFA", animation: "aiPulse 2s ease-in-out infinite" }} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Generating forecast for {accounts.length} accounts...</span>
        </div>
      ) : forecast ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Key Metrics Bar */}
          {forecast.metrics && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Gross Retention", value: forecast.metrics.grr, color: C.green },
                { label: "Net Retention", value: forecast.metrics.nrr, color: parseFloat(forecast.metrics.nrr) >= 100 ? C.green : C.amber },
                { label: "GRR Trend", value: forecast.metrics.grrTrend || "—", color: forecast.metrics.grrTrend === "improving" ? C.green : forecast.metrics.grrTrend === "declining" ? C.red : C.textTertiary, icon: trendIcons[forecast.metrics.grrTrend] },
                { label: "Forecast Confidence", value: forecast.metrics.forecastConfidence || "—", color: forecast.metrics.forecastConfidence === "high" ? C.green : forecast.metrics.forecastConfidence === "low" ? C.red : C.amber },
              ].map((m, i) => {
                const TrendIcon = m.icon;
                return (
                  <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: "16px 18px" }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>{m.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: m.color, textTransform: "capitalize" }}>{m.value}</span>
                      {TrendIcon && <TrendIcon size={16} style={{ color: m.color }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Narrative */}
          {forecast.narrative && (
            <div style={{
              background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
              border: "1px solid #A78BFA25", borderLeft: "3px solid #A78BFA",
              borderRadius: 12, padding: "22px 26px", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA15 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, position: "relative" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#A78BFA18", border: "1px solid #A78BFA25", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart3 size={14} color="#A78BFA" />
                </div>
                <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Forecast Intelligence</span>
                {cachedAgo && <span style={{ marginLeft: "auto", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{cachedAgo}</span>}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.8 }}>{forecast.narrative}</div>
              {forecast.metrics?.forecastConfidenceReason && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.borderDefault}`, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>
                  <strong style={{ color: C.textSecondary }}>Confidence:</strong> {forecast.metrics.forecastConfidenceReason}
                </div>
              )}
            </div>
          )}

          {/* Period Cards */}
          {forecast.periods && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Forecast by Period</span>
                <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
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
                      borderRadius: 12, padding: "18px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}
                      onMouseEnter={e => { if (!expanded) e.currentTarget.style.borderColor = C.borderSubtle; }}
                      onMouseLeave={e => { if (!expanded) e.currentTarget.style.borderColor = C.borderDefault; }}
                    >
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>{period.label}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>{fmt$(data.total || 0)}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 10 }}>{data.accountCount || 0} accounts</div>

                      {totalBar > 0 && (
                        <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 12, background: "rgba(255,255,255,0.04)" }}>
                          {data.committed?.arr > 0 && <div style={{ width: `${(data.committed.arr / totalBar) * 100}%`, background: C.green, transition: "width 0.3s" }} />}
                          {data.bestCase?.arr > 0 && <div style={{ width: `${(data.bestCase.arr / totalBar) * 100}%`, background: C.amber, transition: "width 0.3s" }} />}
                          {data.atRisk?.arr > 0 && <div style={{ width: `${(data.atRisk.arr / totalBar) * 100}%`, background: C.red, transition: "width 0.3s" }} />}
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

          {/* Scenario Modeling */}
          {forecast.scenarios && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Scenario Analysis</span>
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
                    fontFamily: FONT_SANS, fontSize: 13, fontWeight: scenarioView === s.id ? 600 : 500, transition: "all 0.15s",
                  }}>{s.label}</button>
                ))}
              </div>
              {forecast.scenarios[scenarioView] && (
                <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12, padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
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
                <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Forecast Risks</span>
                <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.red }}>{fmt$(forecast.riskCallouts.reduce((s, r) => s + (r.arr || 0), 0))} at risk</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {forecast.riskCallouts.map((risk, i) => {
                  const acct = accounts.find(a => a.name === risk.accountName);
                  return (
                    <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.red}20`, borderLeft: `3px solid ${C.red}`, borderRadius: 10, padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{risk.accountName}</span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.red, fontWeight: 600 }}>{fmt$(risk.arr || 0)}</span>
                        {risk.renewalDate && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto" }}>{risk.renewalDate}</span>}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 6 }}>{risk.risk}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Zap size={12} style={{ color: C.gold }} />
                        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, fontWeight: 500 }}>{risk.recommendedAction}</span>
                        {acct && (
                          <button onClick={() => navigate("/app/accounts", { state: { accountId: acct.id } })} style={{
                            marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
                            padding: "3px 10px", background: "transparent", border: `1px solid ${C.borderDefault}`,
                            borderRadius: 4, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary,
                          }}><ArrowRight size={10} /> View</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {forecast.actions?.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Zap size={16} style={{ color: C.gold }} />
                <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Actions to Improve Forecast</span>
                <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {forecast.actions.map((action, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: "14px 18px" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: C.goldMuted, border: `1px solid ${C.gold}20`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: C.gold,
                    }}>{action.priority}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 3 }}>{action.action}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.green, fontWeight: 600 }}>{action.impact}</span>
                        {action.accountName && action.accountName !== "Portfolio" && (
                          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, background: C.bgPrimary, padding: "2px 6px", borderRadius: 3, border: `1px solid ${C.borderDefault}` }}>{action.accountName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Click Refresh to generate your forecast.</div>
        </div>
      )}

      {loading && forecast && (
        <div style={{ textAlign: "center", padding: "16px 0", fontFamily: FONT_BODY, fontSize: 13, color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA", animation: "aiPulse 2s ease-in-out infinite" }} />
          Regenerating forecast...
        </div>
      )}
    </PageLayout>
  );
}
