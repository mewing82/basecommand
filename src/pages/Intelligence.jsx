import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, BarChart3, Upload, Presentation, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { C, FONT_SANS, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { renewalStore, store } from "../lib/storage";
import { callAI } from "../lib/ai";
import { safeParse, formatARR } from "../lib/utils";
import { PageLayout } from "../components/layout/PageLayout";
import { Btn } from "../components/ui/index";
import { RENEWAL_LEADERSHIP_PROMPT, RENEWAL_FORECAST_PROMPT, buildCompanyContext } from "../lib/prompts";
import { computePortfolioHealth, computePortfolioSummary } from "../lib/healthScore";
import { BriefTab, ForecastTab } from "./IntelligenceTabs";
import { PILLARS, isPillarActive } from "../lib/pillars";
import { NRRWaterfall } from "../components/dashboard/DashboardWidgets";

function timeAgo(ts) {
  if (!ts) return null;
  const m = Math.floor((Date.now() - ts) / 60000);
  return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)}d`;
}

// ─── Pillar context strip ───────────────────────────────────────────────────
const INTEL_PILLARS = ["monitor", "predict", "orchestrate"];

function PillarContextStrip() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>Powered by</span>
      {PILLARS.filter(p => INTEL_PILLARS.includes(p.id)).map(p => {
        const on = isPillarActive(p);
        const PIcon = p.icon;
        return (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "3px 10px",
            borderRadius: 4, background: on ? `${p.color}10` : "transparent",
            border: `1px solid ${on ? p.color + "25" : C.borderDefault}`,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: on ? p.color : C.textTertiary + "60" }} />
            <PIcon size={10} style={{ color: on ? p.color : C.textTertiary }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 10, fontWeight: 600, color: on ? p.color : C.textTertiary }}>{p.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Segment filter pills (placeholder UI) ──────────────────────────────────
function SegmentFilter() {
  const pills = ["All Segments", "Enterprise", "Mid-Market", "SMB"];
  const [active, setActive] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {pills.map((p, i) => (
        <button key={p} onClick={() => setActive(i)} style={{
          padding: "4px 12px", borderRadius: 20, border: `1px solid ${i === active ? C.gold + "40" : C.borderDefault}`,
          background: i === active ? C.goldMuted : "transparent", cursor: "pointer",
          fontFamily: FONT_SANS, fontSize: 11, fontWeight: i === active ? 600 : 400,
          color: i === active ? C.gold : C.textTertiary,
        }}>{p}</button>
      ))}
    </div>
  );
}

// ─── Intelligence Hub ────────────────────────────────────────────────────────
export default function Intelligence() {
  const navigate = useNavigate();
  const { isMobile } = useMediaQuery();
  const [tab, setTab] = useState("brief");

  // Shared data
  const [accounts, setAccounts] = useState([]);
  useEffect(() => { renewalStore.getAccounts().then(setAccounts); }, []);

  // Brief state
  const [briefCache, setBriefCache] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefStartedAt, setBriefStartedAt] = useState(null);
  const [briefError, setBriefError] = useState(null);

  // Forecast state
  const forecastCacheKey = `bc2-${store._ws}-forecast`;
  const [forecast, setForecast] = useState(() => safeParse(localStorage.getItem(forecastCacheKey), null));
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastStartedAt, setForecastStartedAt] = useState(null);
  const [forecastError, setForecastError] = useState(null);

  const [copiedSection, setCopiedSection] = useState(null);
  const [scenarioView, setScenarioView] = useState("expected");
  const [expandedPeriod, setExpandedPeriod] = useState(null);
  const [expandedForecast, setExpandedForecast] = useState(null);
  const [healthSummary, setHealthSummary] = useState(null);
  const [previousForecast, setPreviousForecast] = useState(null); // for "What Changed" delta

  // Load caches on mount
  useEffect(() => { renewalStore.getLeadershipCache().then(setBriefCache); }, []);

  // Health summary for forecast enrichment
  useEffect(() => {
    if (accounts.length === 0) return;
    (async () => {
      const contextMap = {};
      await Promise.all(accounts.map(async (a) => {
        try { const ctx = await renewalStore.getContext(a.id); if (ctx?.length) contextMap[a.id] = ctx; } catch { /* skip */ }
      }));
      const results = computePortfolioHealth(accounts, contextMap);
      setHealthSummary(computePortfolioSummary(results));
    })();
  }, [accounts]);

  // Auto-generate if no cache (intentionally only depends on accounts.length)
  useEffect(() => {
    if (accounts.length > 0 && !briefCache && !briefLoading) generateBrief();
  }, [accounts.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (accounts.length > 0 && !forecast && !forecastLoading) generateForecast();
  }, [accounts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date();
  const trendIcons = { improving: TrendingUp, stable: Minus, declining: TrendingDown };

  // ─── Generate brief ──────────────────────────────────────────────────────
  async function generateBrief() {
    if (accounts.length === 0) return;
    setBriefLoading(true); setBriefStartedAt(Date.now()); setBriefError(null);
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
      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      parsed._generatedAt = Date.now();
      setBriefCache(parsed);
      await renewalStore.saveLeadershipCache(parsed);
    } catch (err) { setBriefError(err.message); } finally { setBriefLoading(false); }
  }

  // ─── Generate forecast ───────────────────────────────────────────────────
  async function generateForecast() {
    if (accounts.length === 0) return;
    if (forecast) setPreviousForecast(forecast); // save for "What Changed"
    setForecastLoading(true); setForecastStartedAt(Date.now()); setForecastError(null);
    try {
      const portfolioData = await Promise.all(accounts.map(async a => {
        const daysUntil = Math.ceil((new Date(a.renewalDate) - now) / 86400000);
        const ctx = await renewalStore.getContext(a.id);
        return { id: a.id, name: a.name, arr: a.arr, renewalDate: a.renewalDate, riskLevel: a.riskLevel, daysUntilRenewal: daysUntil, contacts: a.contacts || [], summary: a.summary || "", contextCount: ctx.length, contextSummary: ctx.slice(0, 3).map(ci => ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 300)}`).join("\n") };
      }));
      const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const settings = await renewalStore.getSettings();
      const companyContext = buildCompanyContext(settings.companyProfile);
      const response = await callAI([{ role: "user", content: "Generate a comprehensive renewal forecast with benchmark comparisons." }], RENEWAL_FORECAST_PROMPT(portfolioData, today, companyContext), 5000);
      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      parsed._generatedAt = Date.now();
      setForecast(parsed);
      localStorage.setItem(forecastCacheKey, JSON.stringify(parsed));
    } catch (err) { setForecastError(err.message); } finally { setForecastLoading(false); }
  }

  function handleCopy(text, sectionId) {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  }

  function buildBriefText() {
    if (!briefCache?.executiveBrief) return "";
    const b = briefCache.executiveBrief;
    let text = `RENEWAL PORTFOLIO UPDATE\n${b.headline}\n\n`;
    text += `FORECAST\n${b.forecastSummary}\n\n`;
    if (b.keyNarratives?.length > 0) { text += "KEY NARRATIVES\n"; b.keyNarratives.forEach(n => { text += `- ${n.title}: ${n.detail}${n.impact ? ` (${n.impact})` : ""}\n`; }); text += "\n"; }
    if (b.wins?.length > 0) { text += "WINS\n"; b.wins.forEach(w => { text += `- ${w}\n`; }); text += "\n"; }
    if (b.escalations?.length > 0) { text += "ESCALATIONS\n"; b.escalations.forEach(e => { text += `- ${e.accountName} (${formatARR(e.arr || 0)}): ${e.issue}. Ask: ${e.ask}\n`; }); text += "\n"; }
    if (b.talkingPoints?.length > 0) { text += "TALKING POINTS\n"; b.talkingPoints.forEach(tp => { text += `- ${tp}\n`; }); }
    return text;
  }

  function buildForecastText() {
    if (!forecast) return "";
    let text = "RENEWAL FORECAST\n\n";
    if (forecast.narrative) text += forecast.narrative + "\n\n";
    if (forecast.metrics) text += `GRR: ${forecast.metrics.grr} | NRR: ${forecast.metrics.nrr} | Confidence: ${forecast.metrics.forecastConfidence}\n\n`;
    if (forecast.riskCallouts?.length > 0) { text += "RISK CALLOUTS\n"; forecast.riskCallouts.forEach(r => { text += `- ${r.accountName} (${formatARR(r.arr)}): ${r.risk}\n`; }); text += "\n"; }
    if (forecast.actions?.length > 0) { text += "RECOMMENDED ACTIONS\n"; forecast.actions.forEach(a => { text += `${a.priority}. ${a.action} (${a.impact})\n`; }); }
    return text;
  }

  // ─── Empty state ─────────────────────────────────────────────────────────
  if (accounts.length === 0) return (
    <PageLayout maxWidth={1200}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: isMobile ? 200 : 400, gap: isMobile ? 16 : 20, textAlign: "center", padding: isMobile ? "24px 14px" : "40px 20px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${C.gold}20, ${C.aiBlue}20)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Crown size={32} style={{ color: C.gold }} />
        </div>
        <div>
          <h2 style={{ fontFamily: FONT_SANS, fontSize: fs(22, 18, isMobile), fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Intelligence Hub</h2>
          <p style={{ fontFamily: FONT_SANS, fontSize: 12, letterSpacing: "0.01em", opacity: 0.8, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: "0 auto" }}>
            Executive briefs and forecasting powered by AI. Import your portfolio data to unlock board-ready insights, GRR/NRR metrics, and strategic recommendations.
          </p>
        </div>
        <Btn variant="primary" onClick={() => navigate("/app/import")} style={{ marginTop: 8 }}><Upload size={14} /> Import Portfolio Data</Btn>
      </div>
    </PageLayout>
  );

  const briefAge = timeAgo(briefCache?._generatedAt);
  const forecastAge = timeAgo(forecast?._generatedAt);

  const TABS = [
    { id: "brief", label: "Executive Strategy Brief", icon: Crown, age: briefAge },
    { id: "forecast", label: "Forecast", icon: BarChart3, age: forecastAge },
    { id: "presentations", label: "Presentations", icon: Presentation, disabled: true },
  ];

  return (
    <PageLayout maxWidth={1200}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Pillar context + Segment filter */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 10 }}>
          <PillarContextStrip />
          <SegmentFilter />
        </div>

        {/* Tab bar with freshness indicators */}
        <div style={{ display: "flex", gap: 4, background: C.bgCard, borderRadius: 10, padding: 4, border: `1px solid ${C.borderDefault}`, width: "fit-content" }}>
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => !t.disabled && setTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: isMobile ? "8px 12px" : "8px 18px",
                borderRadius: 8, border: "none", cursor: t.disabled ? "default" : "pointer",
                background: tab === t.id ? "rgba(0,0,0,0.06)" : "transparent",
                color: t.disabled ? C.textTertiary + "60" : tab === t.id ? C.textPrimary : C.textTertiary,
                fontFamily: FONT_SANS, fontSize: 13, fontWeight: tab === t.id ? 600 : 500,
                opacity: t.disabled ? 0.4 : 1,
              }}>
                <Icon size={14} /> {t.label}
                {t.age && !t.disabled && (
                  <span style={{ fontFamily: FONT_SANS, fontSize: 9, color: C.textTertiary, opacity: 0.7 }}>{t.age}</span>
                )}
                {t.disabled && <span style={{ fontFamily: FONT_SANS, fontSize: 9, color: C.textTertiary, opacity: 0.5 }}>soon</span>}
              </button>
            );
          })}
        </div>

        {/* Executive Brief Tab */}
        {tab === "brief" && <BriefTab
          briefCache={briefCache} loading={briefLoading} startedAt={briefStartedAt}
          error={briefError} accounts={accounts} onGenerate={generateBrief}
          onCopy={handleCopy} copiedSection={copiedSection} isMobile={isMobile}
          buildBriefText={buildBriefText}
        />}

        {/* Forecast Tab — with NRR Waterfall and delta tracking */}
        {tab === "forecast" && <>
          <NRRWaterfall accounts={accounts} isMobile={isMobile} />
          <ForecastTab
            forecast={forecast} loading={forecastLoading} startedAt={forecastStartedAt}
            error={forecastError} accounts={accounts} onGenerate={generateForecast}
            onCopy={handleCopy} copiedSection={copiedSection} isMobile={isMobile}
            healthSummary={healthSummary} previousForecast={previousForecast}
            scenarioView={scenarioView} setScenarioView={setScenarioView}
            expandedPeriod={expandedPeriod} setExpandedPeriod={setExpandedPeriod}
            expandedForecast={expandedForecast} setExpandedForecast={setExpandedForecast}
            trendIcons={trendIcons} buildForecastText={buildForecastText}
          />
        </>}
      </div>
    </PageLayout>
  );
}
