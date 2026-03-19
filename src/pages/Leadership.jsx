import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Sparkles, AlertTriangle, Zap, ArrowRight, Check, Copy, ClipboardCopy, BarChart3, Target, Lightbulb, Upload } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { renewalStore } from "../lib/storage";
import { callAI } from "../lib/ai";
import { PageLayout } from "../components/layout/PageLayout";
import { Btn } from "../components/ui/index";
import { RENEWAL_LEADERSHIP_PROMPT, buildCompanyContext } from "../lib/prompts";
import { AILoadingProgress, ActionMenu } from "../components/ui/AgentWidgets";

export default function Leadership() {
  const navigate = useNavigate();
  const { isMobile } = useMediaQuery();
  const [accounts, setAccounts] = useState([]);
  const [cache, setCache] = useState(null);

  useEffect(() => {
    renewalStore.getAccounts().then(setAccounts);
    renewalStore.getLeadershipCache().then(setCache);
  }, []);
  const [loading, setLoading] = useState(false);
  const [loadStartedAt, setLoadStartedAt] = useState(null);
  const [error, setError] = useState(null);
  const [copiedSection, setCopiedSection] = useState(null);
  const [expandedForecast, setExpandedForecast] = useState(null);
  const cachedAgo = cache?._generatedAt ? (() => { const m = Math.floor((Date.now() - cache._generatedAt) / 60000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`; })() : null;

  const now = new Date();
  const fmt$ = (n) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  async function generateAnalysis() {
    if (accounts.length === 0) return; setLoading(true); setLoadStartedAt(Date.now()); setError(null);
    try {
      const portfolioData = await Promise.all(accounts.map(async a => {
        const daysUntil = Math.ceil((new Date(a.renewalDate) - now) / 86400000);
        const ctx = await renewalStore.getContext(a.id);
        return { id: a.id, name: a.name, arr: a.arr, renewalDate: a.renewalDate, riskLevel: a.riskLevel, daysUntilRenewal: daysUntil, contacts: a.contacts || [], summary: a.summary || "", tags: a.tags || [], contextCount: ctx.length, contextSummary: ctx.slice(0, 3).map(ci => ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 300)}`).join("\n") };
      }));
      const allActions = await renewalStore.getAutopilotActions();
      const autopilotActions = allActions.filter(a => a.status !== "dismissed").slice(0, 20);
      const expansionCache = await renewalStore.getExpansionCache();
      const expansionSignals = expansionCache?.opportunities?.slice(0, 10) || [];
      const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const settings = await renewalStore.getSettings();
      const companyContext = buildCompanyContext(settings.companyProfile);
      const response = await callAI([{ role: "user", content: "Generate my executive leadership analysis and brief." }], RENEWAL_LEADERSHIP_PROMPT(portfolioData, autopilotActions, expansionSignals, today, companyContext), 5000);
      let text = String(response).trim(); if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text); parsed._generatedAt = Date.now(); setCache(parsed); await renewalStore.saveLeadershipCache(parsed);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  function handleCopy(text, sectionId) {
    navigator.clipboard.writeText(text); setCopiedSection(sectionId); setTimeout(() => setCopiedSection(null), 2000);
  }

  function buildBriefText() {
    if (!cache?.executiveBrief) return "";
    const b = cache.executiveBrief;
    let text = `RENEWAL PORTFOLIO UPDATE\n${b.headline}\n\n`;
    text += `FORECAST\n${b.forecastSummary}\n\n`;
    if (b.keyNarratives?.length > 0) { text += "KEY NARRATIVES\n"; b.keyNarratives.forEach(n => { text += `• ${n.title}: ${n.detail}${n.impact ? ` (${n.impact})` : ""}\n`; }); text += "\n"; }
    if (b.wins?.length > 0) { text += "WINS\n"; b.wins.forEach(w => { text += `• ${w}\n`; }); text += "\n"; }
    if (b.escalations?.length > 0) { text += "ESCALATIONS\n"; b.escalations.forEach(e => { text += `• ${e.accountName} (${fmt$(e.arr || 0)}): ${e.issue}. Ask: ${e.ask}\n`; }); text += "\n"; }
    if (b.talkingPoints?.length > 0) { text += "TALKING POINTS\n"; b.talkingPoints.forEach(tp => { text += `• ${tp}\n`; }); }
    return text;
  }

  useEffect(() => { if (accounts.length > 0 && !cache && !loading) generateAnalysis(); }, [accounts.length]);

  // Empty state
  if (accounts.length === 0) return (
    <PageLayout maxWidth={1200}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: isMobile ? 200 : 400, gap: isMobile ? 16 : 20, textAlign: "center", padding: isMobile ? "24px 14px" : "40px 20px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${C.gold}20, ${C.aiBlue}20)`, display: "flex", alignItems: "center", justifyContent: "center" }}><Crown size={32} style={{ color: C.gold }} /></div>
        <div>
          <h2 style={{ fontFamily: FONT_SANS, fontSize: fs(22, 18, isMobile), fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Your Renewal Command Center</h2>
          <p style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: "0.01em", opacity: 0.8, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: "0 auto" }}>Built for renewal leaders who need portfolio-level visibility, not account-level execution. Import your portfolio data to unlock executive briefs, forecasting, and strategic insights.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400, width: "100%" }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>What You'll Get</div>
          {[{ label: "Executive Briefs", desc: "Copy-ready talking points for leadership meetings, standups, and board reporting" },
            { label: "Forecast Analysis", desc: "Retention rate, risk buckets, and confidence levels by period" },
            { label: "Strategic Recommendations", desc: "AI-identified process improvements, segmentation insights, and resource allocation suggestions" }
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 18px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, textAlign: "left" }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: C.gold, opacity: 0.5, flexShrink: 0, width: 24 }}>{i + 1}</span>
              <div><div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.4 }}>{item.desc}</div></div>
            </div>
          ))}
          <Btn variant="primary" onClick={() => navigate('/app/import')} style={{ marginTop: 8 }}><Upload size={14} /> Import Portfolio Data</Btn>
        </div>
      </div>
    </PageLayout>
  );

  const severityColors = { critical: C.red, warning: C.amber, info: C.aiBlue };

  return (
    <PageLayout maxWidth={1200}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Executive Brief */}
        <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.gold}25`, borderLeft: `3px solid ${C.gold}`, borderRadius: 12, padding: isMobile ? "16px 14px" : "22px 26px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}15 0%, transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, position: "relative" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.goldMuted, border: `1px solid ${C.gold}25`, display: "flex", alignItems: "center", justifyContent: "center" }}><Crown size={14} color={C.gold} /></div>
            <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Executive Brief</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto" }}>Executive Intelligence Agent</span>
            {cachedAgo && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>· {cachedAgo}</span>}
            {cache?.executiveBrief && <button onClick={() => handleCopy(buildBriefText(), "brief")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: copiedSection === "brief" ? C.green : C.textTertiary }}>
              {copiedSection === "brief" ? <Check size={11} /> : <ClipboardCopy size={11} />}{copiedSection === "brief" ? "Copied" : "Copy Brief"}
            </button>}
            <button onClick={generateAnalysis} disabled={loading} style={{ background: loading ? C.goldMuted : "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: loading ? "wait" : "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: loading ? C.gold : C.textTertiary, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={11} style={{ animation: loading ? "aiPulse 2s ease-in-out infinite" : "none" }} />{loading ? "Analyzing..." : "Refresh"}
            </button>
          </div>

          {error && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 12 }}><AlertTriangle size={14} /> {error}</div>}

          {loading && !cache ? (
            <AILoadingProgress
              startedAt={loadStartedAt}
              phases={[
                { label: `Analyzing ${accounts.length} accounts...`, duration: 5000 },
                { label: "Building executive narrative...", duration: 8000 },
                { label: "Computing retention metrics...", duration: 7000 },
                { label: "Drafting strategic recommendations...", duration: 10000 },
              ]}
            />
          ) : cache?.executiveBrief ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Headline */}
              <div style={{ fontFamily: FONT_SANS, fontSize: fs(18, 16, isMobile), fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>{cache.executiveBrief.headline}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>{cache.executiveBrief.forecastSummary}</div>

              {/* Key Narratives */}
              {cache.executiveBrief.keyNarratives?.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.borderDefault}`, paddingTop: 14 }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 10 }}>Key Narratives</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {cache.executiveBrief.keyNarratives.map((n, i) => (
                      <div key={i} style={{ padding: "12px 14px", background: C.bgPrimary, borderRadius: 8, border: `1px solid ${C.borderDefault}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{n.title}</span>
                          {n.impact && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.amber, marginLeft: "auto" }}>{n.impact}</span>}
                        </div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{n.detail}</div>
                        {n.accounts?.length > 0 && <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>{n.accounts.map((a, ai) => <span key={ai} style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, background: C.bgCard, padding: "2px 6px", borderRadius: 3, border: `1px solid ${C.borderDefault}` }}>{a}</span>)}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wins */}
              {cache.executiveBrief.wins?.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.borderDefault}`, paddingTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Check size={13} style={{ color: C.green }} /><span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.green }}>Wins</span></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {cache.executiveBrief.wins.map((w, i) => <div key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, paddingLeft: 12, borderLeft: `2px solid ${C.green}30` }}>{w}</div>)}
                  </div>
                </div>
              )}

              {/* Talking Points */}
              {cache.executiveBrief.talkingPoints?.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.borderDefault}`, paddingTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textSecondary }}>Talking Points</span>
                    <button onClick={() => handleCopy(cache.executiveBrief.talkingPoints.map(tp => `• ${tp}`).join("\n"), "tp")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 4, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 10, color: copiedSection === "tp" ? C.green : C.textTertiary }}>
                      {copiedSection === "tp" ? <Check size={10} /> : <Copy size={10} />}{copiedSection === "tp" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {cache.executiveBrief.talkingPoints.map((tp, i) => <div key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textPrimary, lineHeight: 1.5, padding: "6px 12px", background: C.bgPrimary, borderRadius: 6, border: `1px solid ${C.borderDefault}` }}>• {tp}</div>)}
                  </div>
                </div>
              )}
            </div>
          ) : (<div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Click Refresh to generate your executive brief.</div>)}
        </div>

        {/* Escalations */}
        {cache?.executiveBrief?.escalations?.length > 0 && (
          <div style={{ background: C.bgCard, border: `1px solid ${C.red}25`, borderRadius: 10, padding: isMobile ? "14px 14px" : "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><AlertTriangle size={14} style={{ color: C.red }} /><span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.red }}>Escalations</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cache.executiveBrief.escalations.map((esc, i) => {
                const matchedAccount = accounts.find(a => a.name === esc.accountName);
                return (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: C.bgPrimary, borderRadius: 8, border: `1px solid ${C.red}15`, borderLeft: `3px solid ${C.red}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{esc.accountName}</span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{fmt$(esc.arr || 0)}</span>
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginBottom: 4 }}>{esc.issue}</div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, fontWeight: 500 }}>Ask: {esc.ask}</div>
                      <ActionMenu accountName={esc.accountName} actionText={esc.ask} />
                    </div>
                    {matchedAccount && <button onClick={() => navigate('/app/accounts', { state: { accountId: matchedAccount.id } })} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 6, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, flexShrink: 0, alignSelf: "center" }}><ArrowRight size={10} />View</button>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Forecast */}
        {cache?.forecast && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <BarChart3 size={16} style={{ color: C.textSecondary }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>Forecast</span>
              <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
              {cache.forecast.retentionRate && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>Retention Rate</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: C.green }}>{cache.forecast.retentionRate}</span>
                {cache.forecast.retentionRateConfidence && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: { high: C.green, medium: C.amber, low: C.red }[cache.forecast.retentionRateConfidence] || C.textTertiary, textTransform: "uppercase" }}>{cache.forecast.retentionRateConfidence}</span>}
              </div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 8 : 10 }}>
              {[{ key: "thisMonth", label: "This Month" }, { key: "nextMonth", label: "Next Month" }, { key: "thisQuarter", label: "This Quarter" }, { key: "nextQuarter", label: "Next Quarter" }].map(period => {
                const data = cache.forecast[period.key]; if (!data) return null;
                const expanded = expandedForecast === period.key;
                return (
                  <button key={period.key} onClick={() => setExpandedForecast(expanded ? null : period.key)} style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: isMobile ? "12px 12px" : "16px 18px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>{period.label}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: fs(20, 18, isMobile), fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>{fmt$(data.total || 0)}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 2 }}>{data.accounts || 0} accounts</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                      {[{ label: "Committed", value: data.committed, color: C.green }, { label: "Best Case", value: data.bestCase, color: C.amber }, { label: "At Risk", value: data.atRisk, color: C.red }].map(bucket => (
                        <div key={bucket.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: bucket.color, flexShrink: 0 }} />
                          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, flex: 1 }}>{bucket.label}</span>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, color: bucket.color }}>{fmt$(bucket.value || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Health Signals */}
        {cache?.healthSignals?.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><Target size={16} style={{ color: C.textSecondary }} /><span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>Portfolio Health</span><div style={{ flex: 1, height: 1, background: C.borderDefault }} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cache.healthSignals.map((signal, i) => {
                const color = severityColors[signal.severity] || C.textTertiary;
                return (
                  <div key={i} style={{ background: C.bgCard, border: `1px solid ${color}20`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: isMobile ? "12px 14px" : "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color, background: color + "18", padding: "2px 6px", borderRadius: 3, textTransform: "uppercase" }}>{signal.severity}</span>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{signal.signal}</span>
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginBottom: 6 }}>{signal.detail}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Zap size={12} style={{ color: C.gold }} /><span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.gold, fontWeight: 500 }}>{signal.recommendation}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Strategic Recommendations */}
        {cache?.strategicRecs?.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><Lightbulb size={16} style={{ color: C.textSecondary }} /><span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>Strategic Recommendations</span><div style={{ flex: 1, height: 1, background: C.borderDefault }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: isMobile ? 8 : 10 }}>
              {cache.strategicRecs.map((rec, i) => (
                <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: isMobile ? "14px 14px" : "16px 20px" }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{rec.title}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginBottom: 8 }}>{rec.rationale}</div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}><Zap size={12} style={{ color: C.gold, flexShrink: 0, marginTop: 2 }} /><span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, fontWeight: 500 }}>{rec.action}</span></div>
                  {rec.impact && <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Impact: {rec.impact}</div>}
                  <ActionMenu actionText={rec.action} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
