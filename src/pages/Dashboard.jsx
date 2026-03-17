import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, AlertTriangle, ArrowRight, Bot, Crown, Radio, Upload, Plus, Check, BarChart3 } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { callAI } from "../lib/ai";
import { renewalStore, store } from "../lib/storage";
import { getGreeting } from "../lib/utils";
import { useAuthStore } from "../store/authStore";
import { PageLayout } from "../components/layout/PageLayout";
import { Btn } from "../components/ui/index";
import { RENEWAL_AUTOPILOT_PROMPT } from "../lib/prompts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || "there";

  const [accounts, setAccounts] = useState([]);
  useEffect(() => { renewalStore.getAccounts().then(setAccounts); }, []);
  const hasAccounts = accounts.length > 0;

  // If no accounts, show onboarding
  if (!hasAccounts) {
    return <DashboardOnboarding userName={userName} onAccountsChanged={() => renewalStore.getAccounts().then(setAccounts)} />;
  }

  // Otherwise show command center
  return <DashboardCommandCenter userName={userName} accounts={accounts} />;
}

// ─── Onboarding (Zero Accounts) ──────────────────────────────────────────────
function DashboardOnboarding({ userName, onAccountsChanged }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([{ name: "", arr: "", renewalDate: "" }]);
  const [created, setCreated] = useState([]);

  function updateRow(idx, field, value) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  function addRow() {
    setRows(prev => [...prev, { name: "", arr: "", renewalDate: "" }]);
  }

  async function createAccount(idx) {
    const row = rows[idx];
    if (!row.name.trim()) return;
    const account = {
      id: `acct-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: row.name.trim(),
      arr: parseFloat(row.arr) || 0,
      renewalDate: row.renewalDate || "",
      riskLevel: "medium",
      contacts: [],
      summary: "",
      tags: [],
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await renewalStore.saveAccount(account);
    setCreated(prev => [...prev, account]);
    setRows(prev => prev.map((r, i) => i === idx ? { name: "", arr: "", renewalDate: "" } : r));
    onAccountsChanged();
  }

  function handleKeyDown(e, idx) {
    if (e.key === "Enter") {
      e.preventDefault();
      createAccount(idx);
    }
  }

  return (
    <PageLayout maxWidth={720} largePadding>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: "0 auto 24px",
          background: `linear-gradient(135deg, ${C.goldMuted}, ${C.aiBlueMuted})`,
          border: `1px solid ${C.gold}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={28} style={{ color: C.gold }} />
        </div>
        <h1 style={{
          fontFamily: FONT_SANS, fontSize: 28, fontWeight: 700, color: C.textPrimary,
          margin: "0 0 8px", letterSpacing: "-0.03em",
        }}>
          {getGreeting()}, {userName}
        </h1>
        <p style={{
          fontFamily: FONT_BODY, fontSize: 16, color: C.textSecondary,
          lineHeight: 1.7, maxWidth: 480, margin: "0 auto",
        }}>
          Add a few renewal accounts to see BaseCommand in action. Just a name is enough to get started.
        </p>
      </div>

      {/* Quick Add Form */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.borderDefault}`,
        borderRadius: 14, padding: "28px 28px 20px", marginBottom: 20,
      }}>
        <div style={{
          fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary,
          marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
        }}>
          <Plus size={16} style={{ color: C.gold }} /> Quick Add Accounts
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((row, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={row.name}
                onChange={e => updateRow(idx, "name", e.target.value)}
                onKeyDown={e => handleKeyDown(e, idx)}
                placeholder="Company name"
                style={{
                  flex: 2, padding: "10px 14px", borderRadius: 8,
                  background: C.bgPrimary, border: `1px solid ${C.borderDefault}`,
                  color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14,
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = C.borderDefault}
              />
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  color: C.textTertiary, fontFamily: FONT_MONO, fontSize: 13,
                }}>$</span>
                <input
                  type="number"
                  value={row.arr}
                  onChange={e => updateRow(idx, "arr", e.target.value)}
                  onKeyDown={e => handleKeyDown(e, idx)}
                  placeholder="ARR"
                  style={{
                    width: "100%", padding: "10px 14px 10px 24px", borderRadius: 8,
                    background: C.bgPrimary, border: `1px solid ${C.borderDefault}`,
                    color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 14,
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = C.gold}
                  onBlur={e => e.target.style.borderColor = C.borderDefault}
                />
              </div>
              <input
                type="date"
                value={row.renewalDate}
                onChange={e => updateRow(idx, "renewalDate", e.target.value)}
                onKeyDown={e => handleKeyDown(e, idx)}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 8,
                  background: C.bgPrimary, border: `1px solid ${C.borderDefault}`,
                  color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 14,
                  outline: "none", colorScheme: "dark", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = C.borderDefault}
              />
              <button
                onClick={() => createAccount(idx)}
                disabled={!row.name.trim()}
                style={{
                  padding: "10px 14px", borderRadius: 8, border: "none",
                  background: row.name.trim() ? C.gold : C.bgElevated,
                  color: row.name.trim() ? C.bgPrimary : C.textTertiary,
                  fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600,
                  cursor: row.name.trim() ? "pointer" : "default",
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          ))}
        </div>

        {rows.length < 5 && (
          <button
            onClick={addRow}
            style={{
              marginTop: 10, padding: "6px 14px", borderRadius: 6,
              background: "transparent", border: `1px dashed ${C.borderDefault}`,
              color: C.textTertiary, fontFamily: FONT_SANS, fontSize: 12,
              cursor: "pointer", width: "100%",
            }}
          >
            + Another row
          </button>
        )}
      </div>

      {/* Created accounts */}
      {created.length > 0 && (
        <div style={{
          background: C.bgCard, border: `1px solid ${C.green}25`,
          borderRadius: 14, padding: "20px 24px", marginBottom: 20,
        }}>
          <div style={{
            fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.green,
            marginBottom: 12, display: "flex", alignItems: "center", gap: 6,
          }}>
            <Check size={14} /> {created.length} account{created.length !== 1 ? "s" : ""} added
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {created.map(acct => (
              <div key={acct.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", background: C.bgPrimary, borderRadius: 8,
                border: `1px solid ${C.borderDefault}`,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: C.amber, flexShrink: 0,
                }} />
                <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary, flex: 1 }}>
                  {acct.name}
                </span>
                {acct.arr > 0 && (
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>
                    ${acct.arr.toLocaleString()}
                  </span>
                )}
                {acct.renewalDate && (
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                    {acct.renewalDate}
                  </span>
                )}
              </div>
            ))}
          </div>

          <Btn
            variant="primary"
            onClick={() => navigate("/app/agents/renewal/health-monitor")}
            style={{ marginTop: 16, width: "100%" }}
          >
            <Bot size={14} /> View Account Health Scores
          </Btn>
        </div>
      )}

      {/* Alternative: Import */}
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{
          fontFamily: FONT_SANS, fontSize: 13, color: C.textTertiary,
          marginBottom: 16, display: "flex", alignItems: "center", gap: 12, justifyContent: "center",
        }}>
          <div style={{ width: 40, height: 1, background: C.borderDefault }} />
          or
          <div style={{ width: 40, height: 1, background: C.borderDefault }} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => navigate("/app/import")}
            style={{
              padding: "12px 24px", borderRadius: 10,
              border: `1px solid ${C.borderDefault}`, background: "transparent",
              color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.color = C.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}
          >
            <Upload size={14} /> Import from CRM
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

// ─── Command Center (Has Accounts) ───────────────────────────────────────────
function DashboardCommandCenter({ userName, accounts }) {
  const navigate = useNavigate();

  const CACHE_KEY = `bc2-${store._ws}-dashboard-renewal`;
  const [insight, setInsight] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [autopilotActions, setAutopilotActions] = useState([]);
  const [expansionCache, setExpansionCache] = useState(null);
  useEffect(() => {
    renewalStore.getAutopilotActions().then(actions => setAutopilotActions(actions.filter(a => a.status === "pending")));
    renewalStore.getExpansionCache().then(setExpansionCache);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const totalARR = accounts.reduce((sum, a) => sum + (a.arr || 0), 0);
  const atRiskARR = accounts.filter(a => a.riskLevel === "high").reduce((sum, a) => sum + (a.arr || 0), 0);
  const due30 = accounts.filter(a => { const d = new Date(a.renewalDate); const diff = (d - now) / 86400000; return diff >= 0 && diff <= 30; });
  const due60 = accounts.filter(a => { const d = new Date(a.renewalDate); const diff = (d - now) / 86400000; return diff > 30 && diff <= 60; });
  const due90 = accounts.filter(a => { const d = new Date(a.renewalDate); const diff = (d - now) / 86400000; return diff > 60 && diff <= 90; });
  const fmt$ = (n) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  const upcomingRenewals = [...accounts]
    .filter(a => a.renewalDate)
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
    .filter(a => new Date(a.renewalDate) >= now || Math.ceil((new Date(a.renewalDate) - now) / 86400000) >= -30)
    .slice(0, 5);

  const cachedAgo = insight?._generatedAt ? (() => {
    const m = Math.floor((Date.now() - insight._generatedAt) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`;
  })() : null;

  async function generateInsights() {
    setLoading(true); setError("");
    try {
      const portfolioData = await Promise.all(accounts.map(async a => {
        const daysUntil = Math.ceil((new Date(a.renewalDate) - now) / 86400000);
        const ctx = await renewalStore.getContext(a.id);
        return {
          name: a.name, arr: a.arr, renewalDate: a.renewalDate,
          riskLevel: a.riskLevel, daysUntilRenewal: daysUntil,
          contextCount: ctx.length,
        };
      }));
      const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

      const prompt = `You are BC, an AI-powered renewal operations co-pilot. Analyze this renewal portfolio and return a JSON dashboard brief.

PORTFOLIO (${accounts.length} accounts, ${fmt$(totalARR)} total ARR):
${JSON.stringify(portfolioData)}

PENDING AUTOPILOT ACTIONS: ${autopilotActions.length}
TODAY: ${today}

Return ONLY valid JSON (no markdown fences):
{
  "brief": "3-4 sentence strategic read of the renewal portfolio right now. Reference specific accounts by name. End with one forward-looking action.",
  "momentum": "1-2 sentence read on portfolio health. Use specific numbers.",
  "topRisk": { "accountName": "name", "reason": "why it's the top risk", "arr": 0 },
  "topOpportunity": { "accountName": "name", "reason": "why it's the top opportunity" }
}

RULES:
- Be specific — use real account names from the data.
- Focus on renewal risk, timing, and portfolio health.
- Tone: confident co-pilot, not corporate dashboard.`;

      const response = await callAI([{ role: "user", content: prompt }], undefined, 2000);
      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      parsed._generatedAt = Date.now();
      setInsight(parsed);
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!insight && !loading) generateInsights();
  }, []);

  const riskColors = { high: C.red, medium: C.amber, low: C.green };

  return (
    <PageLayout maxWidth={960}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em" }}>
            {getGreeting()}, {userName}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 6 }}>{dateStr}</div>
        </div>
        <button onClick={generateInsights} disabled={loading} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10,
          border: `1px solid ${loading ? C.aiBlue + "30" : C.borderDefault}`,
          background: loading ? C.aiBlueMuted : "transparent",
          cursor: loading ? "wait" : "pointer",
          fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: loading ? C.aiBlue : C.textSecondary,
          transition: "all 0.2s ease",
        }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.color = C.textPrimary; } }}
          onMouseLeave={e => { if (!loading) { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; } }}
        >
          <Sparkles size={14} style={{ color: loading ? C.aiBlue : C.gold, animation: loading ? "aiPulse 2s ease-in-out infinite" : "none" }} />
          {loading ? "Analyzing..." : "Refresh"}
          {cachedAgo && !loading && <span style={{ color: C.textTertiary, fontSize: 12 }}>· {cachedAgo}</span>}
        </button>
      </div>

      {/* Portfolio Snapshot */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total ARR", value: fmt$(totalARR), color: C.textPrimary },
          { label: "Accounts", value: accounts.length, color: C.textPrimary },
          { label: "At-Risk ARR", value: fmt$(atRiskARR), color: atRiskARR > 0 ? C.red : C.green },
          { label: "Due 30 Days", value: due30.length, color: due30.length > 0 ? C.red : C.green },
          { label: "Due 60–90 Days", value: due60.length + due90.length, color: due60.length + due90.length > 0 ? C.amber : C.textTertiary },
        ].map((stat, i) => (
          <div key={i} style={{
            background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: "16px 18px",
          }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {error && <div style={{ color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={14} /> {error}</div>}

      {/* AI Strategic Brief */}
      <div style={{
        background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
        border: `1px solid ${C.borderAI}`, borderLeft: `2px solid ${C.aiBlue}40`,
        borderRadius: 14, padding: "24px 26px", marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${C.aiBlueGlow} 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, position: "relative" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.aiBlueMuted, border: `1px solid ${C.aiBlue}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={12} color={C.aiBlue} />
          </div>
          <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary }}>Portfolio Brief</span>
          {cachedAgo && <span style={{ marginLeft: "auto", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{cachedAgo}</span>}
        </div>

        {loading && !insight ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.aiBlue, animation: "aiPulse 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Analyzing {accounts.length} accounts...</span>
          </div>
        ) : insight?.brief ? (
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.8 }}>{insight.brief}</div>
            {insight.momentum && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.borderDefault}`, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.7 }}>
                {insight.momentum}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Click Refresh to get your portfolio brief.</div>
        )}
      </div>

      {/* Two-column: Pending Actions + Upcoming Renewals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Pending Autopilot Actions */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Bot size={16} style={{ color: C.aiBlue }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>Pending Actions</span>
            {autopilotActions.length > 0 && (
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.amber, marginLeft: "auto" }}>{autopilotActions.length}</span>
            )}
          </div>
          {autopilotActions.length === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>
              No pending actions. Visit Renewal Agents to monitor your portfolio.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {autopilotActions.slice(0, 4).map(action => {
                const urgencyColors = { critical: C.red, high: C.amber, medium: C.blue };
                const color = urgencyColors[action.urgency] || C.textTertiary;
                return (
                  <div key={action.id} style={{
                    padding: "10px 12px", background: C.bgPrimary, borderRadius: 8,
                    border: `1px solid ${C.borderDefault}`, borderLeft: `3px solid ${color}`,
                  }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>
                      {action.accountName}
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.4 }}>
                      {action.title}
                    </div>
                  </div>
                );
              })}
              {autopilotActions.length > 4 && (
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textAlign: "center" }}>
                  +{autopilotActions.length - 4} more
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => navigate("/app/agents/renewal/health-monitor")}
            style={{
              marginTop: 14, display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.borderDefault}`,
              background: "transparent", color: C.textSecondary, fontFamily: FONT_SANS,
              fontSize: 12, fontWeight: 500, cursor: "pointer", width: "100%",
              justifyContent: "center", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.aiBlue + "40"; e.currentTarget.style.color = C.aiBlue; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}
          >
            View Renewal Agents <ArrowRight size={12} />
          </button>
        </div>

        {/* Upcoming Renewals */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={16} style={{ color: C.amber }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>Upcoming Renewals</span>
          </div>
          {upcomingRenewals.length === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>
              No upcoming renewals with dates set. Add renewal dates to your accounts.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcomingRenewals.map(acct => {
                const daysUntil = Math.ceil((new Date(acct.renewalDate) - now) / 86400000);
                const overdue = daysUntil < 0;
                return (
                  <button
                    key={acct.id}
                    onClick={() => navigate("/app/accounts", { state: { accountId: acct.id } })}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", background: C.bgPrimary, borderRadius: 8,
                      border: `1px solid ${C.borderDefault}`, cursor: "pointer", textAlign: "left",
                      width: "100%", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.background = C.bgCardHover; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.background = C.bgPrimary; }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColors[acct.riskLevel] || C.textTertiary, flexShrink: 0 }} />
                    <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: C.textPrimary, flex: 1 }}>
                      {acct.name}
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>
                      {fmt$(acct.arr)}
                    </span>
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                      color: overdue ? C.red : daysUntil <= 30 ? C.red : daysUntil <= 60 ? C.amber : C.textTertiary,
                    }}>
                      {overdue ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={() => navigate("/app/accounts")}
            style={{
              marginTop: 14, display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.borderDefault}`,
              background: "transparent", color: C.textSecondary, fontFamily: FONT_SANS,
              fontSize: 12, fontWeight: 500, cursor: "pointer", width: "100%",
              justifyContent: "center", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold + "40"; e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}
          >
            View All Accounts <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { icon: Sparkles, label: "Agents", desc: "AI agent hub", route: "/app/agents", color: C.gold },
          { icon: Bot, label: "Health Monitor", desc: "Portfolio health scores", route: "/app/agents/renewal/health-monitor", color: C.aiBlue },
          { icon: BarChart3, label: "Forecast Engine", desc: "GRR/NRR forecasting", route: "/app/agents/growth/forecast-engine", color: "#A78BFA" },
          { icon: Upload, label: "Data Sources", desc: "Connect & import data", route: "/app/import", color: C.amber },
        ].map((link, i) => {
          const Icon = link.icon;
          return (
            <button
              key={i}
              onClick={() => navigate(link.route)}
              style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12,
                padding: "18px 16px", cursor: "pointer", textAlign: "left",
                transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 10,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = link.color + "40"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: link.color + "15", border: `1px solid ${link.color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} color={link.color} />
              </div>
              <div>
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{link.label}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginTop: 2 }}>{link.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {loading && insight && (
        <div style={{ textAlign: "center", padding: "16px 0", fontFamily: FONT_BODY, fontSize: 13, color: C.aiBlue, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.aiBlue, animation: "aiPulse 2s ease-in-out infinite" }} />
          Refreshing portfolio intelligence...
        </div>
      )}
    </PageLayout>
  );
}
