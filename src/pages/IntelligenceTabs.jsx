/**
 * Sub-components for Intelligence Hub: BriefTab and ForecastTab.
 * Extracted to keep Intelligence.jsx under the 500-line limit.
 */
import {
  Crown, AlertTriangle, Zap, Check, Copy,
  ClipboardCopy, BarChart3, Target, Lightbulb, FileText,
  Presentation, Mail, Loader, ShieldAlert, TrendingUp, TrendingDown, ArrowRight,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { formatARR } from "../lib/utils";
import { Btn } from "../components/ui/index";
import { AILoadingProgress, ActionMenu } from "../components/ui/AgentWidgets";
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

function calcTimeAgo(timestamp) {
  if (!timestamp) return null;
  const m = Math.floor((Date.now() - timestamp) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
}

function useTimeAgo(timestamp) {
  const [ago, setAgo] = useState(() => calcTimeAgo(timestamp));
  useEffect(() => {
    if (!timestamp) return;
    const id = setInterval(() => setAgo(calcTimeAgo(timestamp)), 60000);
    return () => clearInterval(id);
  }, [timestamp]);
  return ago;
}

// ─── Benchmark bar for GRR/NRR ──────────────────────────────────────────────
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
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 4, width: `${pct(numVal)}%`, background: `linear-gradient(90deg, ${valColor}40, ${valColor})` }} />
        <div style={{ position: "absolute", left: `${pct(bench.median)}%`, top: -2, width: 1, height: 12, background: C.textTertiary, opacity: 0.5 }} />
        <div style={{ position: "absolute", left: `${pct(bench.bestInClass)}%`, top: -2, width: 1, height: 12, background: C.green, opacity: 0.6 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary }}>Median: {bench.median}%</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.green }}>Best-in-class: {bench.bestInClass}%</span>
      </div>
    </div>
  );
}

// ─── Export Toolbar ──────────────────────────────────────────────────────────
export function ExportToolbar({ onCopy, copied }) {
  const [toast, setToast] = useState(null);
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2000); }
  const btnStyle = {
    display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
    background: "rgba(255,255,255,0.06)", border: `1px solid ${C.borderDefault}`,
    borderRadius: 6, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 12,
    fontWeight: 500, color: C.textTertiary, transition: "all 0.15s",
  };
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", position: "relative" }}>
      <button onClick={onCopy} style={{ ...btnStyle, color: copied ? C.green : C.textTertiary }}>
        {copied ? <Check size={12} /> : <ClipboardCopy size={12} />} {copied ? "Copied" : "Copy"}
      </button>
      <button onClick={() => window.print()} style={btnStyle}>
        <FileText size={12} /> PDF
      </button>
      <button onClick={() => showToast("Slides export coming soon")} style={btnStyle}>
        <Presentation size={12} /> Slides
      </button>
      <button onClick={() => showToast("Email export coming soon")} style={btnStyle}>
        <Mail size={12} /> Email
      </button>
      {toast && (
        <div style={{
          position: "absolute", top: -36, left: "50%", transform: "translateX(-50%)",
          padding: "6px 14px", background: C.bgElevated, border: `1px solid ${C.borderDefault}`,
          borderRadius: 6, fontFamily: FONT_SANS, fontSize: 12, color: C.textSecondary,
          whiteSpace: "nowrap", zIndex: 10,
        }}>{toast}</div>
      )}
    </div>
  );
}

// ─── Brief Tab ──────────────────────────────────────────────────────────────
export function BriefTab({ briefCache, loading, startedAt, error, accounts, onGenerate, onCopy, copiedSection, isMobile, buildBriefText }) {
  const severityColors = { critical: C.red, warning: C.amber, info: C.aiBlue };
  const cachedAgo = useTimeAgo(briefCache?._generatedAt);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header + export */}
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.goldMuted, border: `1px solid ${C.gold}25`, display: "flex", alignItems: "center", justifyContent: "center" }}><Crown size={14} color={C.gold} /></div>
          <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Executive Brief</span>
          {cachedAgo && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Updated {cachedAgo}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {briefCache?.executiveBrief && <ExportToolbar onCopy={() => onCopy(buildBriefText(), "brief")} copied={copiedSection === "brief"} />}
          <Btn variant="ai" onClick={onGenerate} disabled={loading}>
            {loading ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Analyzing...</> : <><Sparkles size={14} /> Refresh</>}
          </Btn>
        </div>
      </div>

      {error && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontFamily: FONT_BODY, fontSize: 13 }}><AlertTriangle size={14} /> {error}</div>}

      {loading && !briefCache ? (
        <AILoadingProgress startedAt={startedAt} phases={[
          { label: `Analyzing ${accounts.length} accounts...`, duration: 5000 },
          { label: "Building executive narrative...", duration: 8000 },
          { label: "Computing retention metrics...", duration: 7000 },
          { label: "Drafting strategic recommendations...", duration: 10000 },
        ]} />
      ) : briefCache?.executiveBrief ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* AI Card - headline + forecast summary */}
          <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.gold}25`, borderLeft: `3px solid ${C.gold}`, borderRadius: 12, padding: isMobile ? "16px 14px" : "22px 26px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}15 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ fontFamily: FONT_SANS, fontSize: fs(18, 16, isMobile), fontWeight: 700, color: C.textPrimary, lineHeight: 1.4, marginBottom: 10, position: "relative" }}>{briefCache.executiveBrief.headline}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.7, position: "relative" }}>{briefCache.executiveBrief.forecastSummary}</div>
          </div>

          {/* Key Narratives */}
          {briefCache.executiveBrief.keyNarratives?.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 10 }}>Key Narratives</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {briefCache.executiveBrief.keyNarratives.map((n, i) => (
                  <div key={i} style={{ padding: "12px 14px", background: C.bgCard, borderRadius: 8, border: `1px solid ${C.borderDefault}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{n.title}</span>
                      {n.impact && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.amber, marginLeft: "auto" }}>{n.impact}</span>}
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{n.detail}</div>
                    {n.accounts?.length > 0 && <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>{n.accounts.map((a, ai) => <span key={ai} style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, background: C.bgPrimary, padding: "2px 6px", borderRadius: 3, border: `1px solid ${C.borderDefault}` }}>{a}</span>)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wins */}
          {briefCache.executiveBrief.wins?.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Check size={13} style={{ color: C.green }} /><span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.green }}>Wins</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {briefCache.executiveBrief.wins.map((w, i) => <div key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, paddingLeft: 12, borderLeft: `2px solid ${C.green}30` }}>{w}</div>)}
              </div>
            </div>
          )}

          {/* Escalations */}
          {briefCache.executiveBrief.escalations?.length > 0 && (
            <div style={{ background: C.bgCard, border: `1px solid ${C.red}25`, borderRadius: 10, padding: isMobile ? "14px 14px" : "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><AlertTriangle size={14} style={{ color: C.red }} /><span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.red }}>Escalations</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {briefCache.executiveBrief.escalations.map((esc, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: C.bgPrimary, borderRadius: 8, border: `1px solid ${C.red}15`, borderLeft: `3px solid ${C.red}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{esc.accountName}</span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{formatARR(esc.arr || 0)}</span>
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginBottom: 4 }}>{esc.issue}</div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, fontWeight: 500 }}>Ask: {esc.ask}</div>
                      <ActionMenu accountName={esc.accountName} actionText={esc.ask} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Talking Points */}
          {briefCache.executiveBrief.talkingPoints?.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textSecondary }}>Talking Points</span>
                <button onClick={() => onCopy(briefCache.executiveBrief.talkingPoints.map(tp => `- ${tp}`).join("\n"), "tp")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 4, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 10, color: copiedSection === "tp" ? C.green : C.textTertiary }}>
                  {copiedSection === "tp" ? <Check size={10} /> : <Copy size={10} />}{copiedSection === "tp" ? "Copied" : "Copy"}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {briefCache.executiveBrief.talkingPoints.map((tp, i) => <div key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textPrimary, lineHeight: 1.5, padding: "6px 12px", background: C.bgCard, borderRadius: 6, border: `1px solid ${C.borderDefault}` }}>- {tp}</div>)}
              </div>
            </div>
          )}

          {/* Health Signals */}
          {briefCache.healthSignals?.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><Target size={16} style={{ color: C.textSecondary }} /><span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>Portfolio Health</span><div style={{ flex: 1, height: 1, background: C.borderDefault }} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {briefCache.healthSignals.map((signal, i) => {
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

          {/* Strategic Recs */}
          {briefCache.strategicRecs?.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><Lightbulb size={16} style={{ color: C.textSecondary }} /><span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>Strategic Recommendations</span><div style={{ flex: 1, height: 1, background: C.borderDefault }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: isMobile ? 8 : 10 }}>
                {briefCache.strategicRecs.map((rec, i) => (
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
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Click Refresh to generate your executive brief.</div>
      )}
    </div>
  );
}

// ─── Forecast Tab ───────────────────────────────────────────────────────────
export function ForecastTab({ forecast, loading, startedAt, error, accounts, onGenerate, onCopy, copiedSection, isMobile, healthSummary, previousForecast, scenarioView, setScenarioView, expandedPeriod, setExpandedPeriod, trendIcons, buildForecastText }) {
  const cachedAgo = useTimeAgo(forecast?._generatedAt);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header + export */}
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#A78BFA18", border: "1px solid #A78BFA25", display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart3 size={14} color="#A78BFA" /></div>
          <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Forecast</span>
          {cachedAgo && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Updated {cachedAgo}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {forecast && <ExportToolbar onCopy={() => onCopy(buildForecastText(), "forecast")} copied={copiedSection === "forecast"} />}
          <Btn variant="ai" onClick={onGenerate} disabled={loading}>
            {loading ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</> : <><Sparkles size={14} /> Refresh</>}
          </Btn>
        </div>
      </div>

      {error && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontFamily: FONT_BODY, fontSize: 13 }}><AlertTriangle size={14} /> {error}</div>}

      {loading && !forecast ? (
        <AILoadingProgress startedAt={startedAt} phases={[
          { label: `Analyzing ${accounts.length} accounts...`, duration: 5000 },
          { label: "Computing GRR and NRR metrics...", duration: 7000 },
          { label: "Building revenue scenarios...", duration: 10000 },
          { label: "Generating forecast narrative...", duration: 8000 },
        ]} />
      ) : forecast ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Key Metrics */}
          {forecast.metrics && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 8 : 12 }}>
              {[
                { label: "Gross Retention", value: forecast.metrics.grr, color: C.green, benchmark: "grr" },
                { label: "Net Retention", value: forecast.metrics.nrr, color: parseFloat(forecast.metrics.nrr) >= 100 ? C.green : C.amber, benchmark: "nrr" },
                { label: "GRR Trend", value: forecast.metrics.grrTrend || "\u2014", color: forecast.metrics.grrTrend === "improving" ? C.green : forecast.metrics.grrTrend === "declining" ? C.red : C.textTertiary, icon: trendIcons[forecast.metrics.grrTrend] },
                { label: "Forecast Confidence", value: forecast.metrics.forecastConfidence || "\u2014", color: forecast.metrics.forecastConfidence === "high" ? C.green : forecast.metrics.forecastConfidence === "low" ? C.red : C.amber },
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

          {/* What Changed — delta vs previous forecast */}
          {previousForecast?.metrics && forecast.metrics && (() => {
            const prev = previousForecast.metrics;
            const curr = forecast.metrics;
            const parseNum = v => parseFloat(String(v || "0").replace("%", "")) || 0;
            const deltas = [
              { label: "GRR", prev: prev.grr, curr: curr.grr, delta: parseNum(curr.grr) - parseNum(prev.grr), unit: "%", good: "up" },
              { label: "NRR", prev: prev.nrr, curr: curr.nrr, delta: parseNum(curr.nrr) - parseNum(prev.nrr), unit: "%", good: "up" },
            ].filter(d => d.delta !== 0);
            const prevAge = previousForecast._generatedAt ? calcTimeAgo(previousForecast._generatedAt) : "previous";
            if (deltas.length === 0) return null;
            return (
              <div style={{
                background: C.bgCard, border: `1px solid ${C.aiBlue}20`, borderRadius: 10,
                padding: isMobile ? "12px 14px" : "16px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <ArrowRight size={14} style={{ color: C.aiBlue }} />
                  <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.aiBlue }}>What Changed</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginLeft: "auto" }}>vs {prevAge}</span>
                </div>
                <div style={{ display: "flex", gap: isMobile ? 12 : 20, flexWrap: "wrap" }}>
                  {deltas.map(d => {
                    const improved = d.good === "up" ? d.delta > 0 : d.delta < 0;
                    const DIcon = d.delta > 0 ? TrendingUp : TrendingDown;
                    const color = improved ? C.green : C.red;
                    return (
                      <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary }}>{d.label}:</span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{d.prev}</span>
                        <ArrowRight size={10} style={{ color: C.textTertiary }} />
                        <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, color }}>{d.curr}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color, background: color + "14", padding: "2px 6px", borderRadius: 3 }}>
                          <DIcon size={10} /> {d.delta > 0 ? "+" : ""}{d.delta.toFixed(1)}{d.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Revenue Impact */}
          {forecast.metrics && healthSummary && (
            <div style={{ background: C.bgCard, border: `1px solid ${C.green}20`, borderRadius: 10, padding: isMobile ? "12px 12px" : "14px 18px", display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 12 }}>
              <Target size={16} style={{ color: C.green, flexShrink: 0 }} />
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                <strong style={{ color: C.green }}>Revenue Impact:</strong> A 3% GRR improvement on your {formatARR(healthSummary.totalARR)} portfolio = <strong style={{ color: C.green }}>{formatARR(healthSummary.totalARR * 0.03)}</strong> in retained revenue.
                {healthSummary.atRiskARR > 0 && <> Currently {formatARR(healthSummary.atRiskARR)} is at risk.</>}
              </div>
            </div>
          )}

          {/* AI Narrative */}
          {forecast.narrative && (
            <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: "1px solid #A78BFA25", borderLeft: "3px solid #A78BFA", borderRadius: 12, padding: isMobile ? "14px 12px" : "22px 26px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA15 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary, marginBottom: 12, position: "relative" }}>Forecast Intelligence</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.8, position: "relative" }}>{forecast.narrative}</div>
              {forecast.metrics?.forecastConfidenceReason && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.borderDefault}`, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6, position: "relative" }}>
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
                  { key: "thisMonth", label: "This Month" }, { key: "nextMonth", label: "Next Month" },
                  { key: "thisQuarter", label: "This Quarter" }, { key: "nextQuarter", label: "Next Quarter" },
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
                      <div style={{ fontFamily: FONT_MONO, fontSize: fs(22, 18, isMobile), fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>{formatARR(data.total || 0)}</div>
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
                              <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: tier.color }}>{formatARR(tier.value || 0)}</span>
                            </div>
                            {expanded && tier.accts?.length > 0 && (
                              <div style={{ marginLeft: 12, marginTop: 4, display: "flex", flexWrap: "wrap", gap: 3 }}>
                                {tier.accts.map((name, i) => <span key={i} style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, background: C.bgPrimary, padding: "2px 6px", borderRadius: 3, border: `1px solid ${C.borderDefault}` }}>{name}</span>)}
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
                      <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: C.textPrimary }}>{formatARR(forecast.scenarios[scenarioView].totalARR || 0)}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 4 }}>GRR</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: scenarioView === "downside" ? C.red : scenarioView === "bestCase" ? C.green : "#A78BFA" }}>
                        {forecast.scenarios[scenarioView].grr || "\u2014"}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>{forecast.scenarios[scenarioView].narrative}</div>
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
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.red }}>{formatARR(forecast.riskCallouts.reduce((s, r) => s + (r.arr || 0), 0))} at risk</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {forecast.riskCallouts.map((risk, i) => (
                  <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.red}20`, borderLeft: `3px solid ${C.red}`, borderRadius: 10, padding: isMobile ? "12px 12px" : "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{risk.accountName}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.red, fontWeight: 600 }}>{formatARR(risk.arr || 0)}</span>
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
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: C.goldMuted, border: `1px solid ${C.gold}20`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: C.gold }}>{action.priority}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 3 }}>{action.action}</div>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.green, fontWeight: 600 }}>{action.impact}</span>
                      <ActionMenu accountName={action.accountName} actionText={action.action} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
