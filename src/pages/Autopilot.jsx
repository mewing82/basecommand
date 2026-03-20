import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Bot, Sparkles, ArrowRight, AlertTriangle, Zap, Mail, Shield, Check, Copy, TrendingUp, ChevronRight, Upload } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { renewalStore, store } from "../lib/storage";
import { callAI } from "../lib/ai";
import { PageLayout } from "../components/layout/PageLayout";
import { safeParse } from "../lib/utils";
import { Btn } from "../components/ui/index";
import { RENEWAL_AUTOPILOT_PROMPT, buildCompanyContext } from "../lib/prompts";
import { executeAction, dismissAction, shouldAutoExecute } from "../lib/executionEngine";

export default function Autopilot() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);

  const CACHE_KEY = `bc2-${store._ws}-renewals-autopilot`;
  const [autopilot, setAutopilot] = useState(() => safeParse(localStorage.getItem(CACHE_KEY), null));
  const [actions, setActions] = useState([]);

  useEffect(() => {
    renewalStore.getAccounts().then(setAccounts);
    renewalStore.getAutopilotActions().then(setActions);
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedAction, setExpandedAction] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const now = new Date();
  const totalARR = accounts.reduce((sum, a) => sum + (a.arr || 0), 0);
  const atRiskARR = accounts.filter(a => a.riskLevel === "high").reduce((sum, a) => sum + (a.arr || 0), 0);
  const due30 = accounts.filter(a => { const d = new Date(a.renewalDate); const diff = (d - now) / 86400000; return diff >= 0 && diff <= 30; }).length;
  const due60 = accounts.filter(a => { const d = new Date(a.renewalDate); const diff = (d - now) / 86400000; return diff > 30 && diff <= 60; }).length;
  const due90 = accounts.filter(a => { const d = new Date(a.renewalDate); const diff = (d - now) / 86400000; return diff > 60 && diff <= 90; }).length;
  const fmt$ = (n) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  const cachedAgo = autopilot?._generatedAt ? (() => { const m = Math.floor((Date.now() - autopilot._generatedAt) / 60000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`; })() : null;
  const pendingActions = actions.filter(a => a.status === "pending");

  async function generateAutopilot() {
    if (accounts.length === 0) return; setLoading(true); setError(null);
    try {
      const portfolioData = await Promise.all(accounts.map(async a => {
        const daysUntil = Math.ceil((new Date(a.renewalDate) - now) / 86400000);
        const ctx = await renewalStore.getContext(a.id);
        const contextSummary = ctx.length === 0 ? "No context data" : ctx.map(ci => ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 500)}`).join("\n");
        return { id: a.id, name: a.name, arr: a.arr, renewalDate: a.renewalDate, riskLevel: a.riskLevel, daysUntilRenewal: daysUntil, contacts: a.contacts || [], summary: a.summary || "", tags: a.tags || [], contextData: contextSummary };
      }));
      const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const settings = await renewalStore.getSettings();
      const companyContext = buildCompanyContext(settings.companyProfile);
      const response = await callAI([{ role: "user", content: "Generate autopilot actions for my renewal portfolio." }], RENEWAL_AUTOPILOT_PROMPT(portfolioData, today, companyContext), 4000);
      let text = String(response).trim(); if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text); parsed._generatedAt = Date.now(); setAutopilot(parsed); localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      // Save new actions + check auto-execute
      if (parsed.actions?.length > 0) {
        const autonomySettings = await renewalStore.getAutonomySettings();
        const newActions = parsed.actions.map(a => ({ id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, accountId: a.accountId || "", accountName: a.accountName, type: a.type, title: a.title, description: a.description, draft: a.draft || "", urgency: a.urgency, reasoning: a.reasoning || "", status: "pending", createdAt: new Date().toISOString() }));

        // Log all generated actions to execution log
        for (const action of newActions) {
          await renewalStore.createExecution({
            id: `exec-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            agentId: "autopilot", actionType: action.type || "next_action",
            actionId: action.id, accountId: action.accountId, accountName: action.accountName,
            inputSummary: action.title, outputSummary: "",
            status: "generated", metadata: { urgency: action.urgency },
            createdAt: new Date().toISOString(),
          });
        }

        // Auto-execute actions where autonomy settings allow
        for (const action of newActions) {
          if (shouldAutoExecute(action, autonomySettings)) {
            action.status = "approved";
            await executeAction(action);
          }
        }

        await renewalStore.saveAutopilotActions(newActions); setActions(newActions);
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function handleActionStatus(actionId, status) {
    const action = actions.find(a => a.id === actionId);
    if (action && status === "approved") {
      await executeAction(action);
    } else if (action && status === "dismissed") {
      await dismissAction(action);
    } else {
      await renewalStore.updateAutopilotAction(actionId, { status });
    }
    setActions(await renewalStore.getAutopilotActions());
  }
  function handleCopy(text, id) { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }

  useEffect(() => { if (accounts.length > 0 && !autopilot && !loading) generateAutopilot(); }, [accounts.length]);

  const urgencyColors = { critical: C.red, high: C.amber, medium: C.blue };
  const typeIcons = { email_draft: Mail, risk_assessment: Shield, next_action: Zap };

  return (
    <PageLayout maxWidth={1200}>
      {accounts.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center", padding: "40px 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${C.aiBlue}20, ${C.gold}20)`, display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={32} style={{ color: C.aiBlue }} /></div>
          <div>
            <h2 style={{ fontFamily: FONT_SANS, fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Your Renewal Autopilot</h2>
            <p style={{ fontFamily: FONT_SANS, fontSize: 12, letterSpacing: "0.01em", opacity: 0.8, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: "0 auto" }}>BaseCommand takes renewal work off your plate. Import your customer data — even a messy spreadsheet works — and the autopilot will generate outreach emails, flag risks, and surface expansion opportunities.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400, width: "100%" }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>Get Started</div>
            {[{ step: "1", label: "Import your data", desc: "Paste a Salesforce export, spreadsheet, or even rough notes about your customers", action: () => navigate('/app/import') }, { step: "2", label: "Review extracted accounts", desc: "AI identifies accounts, ARR, renewal dates, and risk signals from your data" }, { step: "3", label: "Let Autopilot work", desc: "Get draft emails, risk assessments, and expansion signals — just review and approve" }].map((item, i) => (
              <button key={i} onClick={item.action} disabled={!item.action} style={{ display: "flex", gap: 14, padding: "14px 18px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, cursor: item.action ? "pointer" : "default", textAlign: "left", transition: "all 0.15s", width: "100%" }}
                onMouseEnter={e => { if (item.action) { e.currentTarget.style.borderColor = C.aiBlue + "40"; e.currentTarget.style.background = C.bgCardHover; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.background = C.bgCard; }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 700, color: C.aiBlue, opacity: 0.5, flexShrink: 0, width: 24 }}>{item.step}</span>
                <div><div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.4 }}>{item.desc}</div></div>
                {item.action && <ArrowRight size={14} style={{ color: C.aiBlue, flexShrink: 0, alignSelf: "center", opacity: 0.5 }} />}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Portfolio stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[{ label: "Total ARR", value: fmt$(totalARR), color: C.textPrimary }, { label: "At-Risk ARR", value: fmt$(atRiskARR), color: atRiskARR > 0 ? C.red : C.textTertiary }, { label: "Due 30 Days", value: due30, color: due30 > 0 ? C.red : C.green }, { label: "Due 60 Days", value: due60, color: due60 > 0 ? C.amber : C.textTertiary }, { label: "Due 90 Days", value: due90, color: due90 > 0 ? C.textSecondary : C.textTertiary }].map((stat, i) => (
              <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontFamily: FONT_SANS, fontSize: 20, fontWeight: 600, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Autopilot Status Banner */}
          <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.borderAI}`, borderLeft: `3px solid ${C.aiBlue}`, borderRadius: 12, padding: "22px 26px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${C.aiBlueGlow} 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, position: "relative" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: C.aiBlueMuted, border: `1px solid ${C.aiBlue}25`, display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={14} color={C.aiBlue} /></div>
              <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Autopilot</span>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, marginLeft: "auto" }}>Autopilot Agent</span>
              {cachedAgo && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>· {cachedAgo}</span>}
              <button onClick={generateAutopilot} disabled={loading} style={{ background: loading ? C.aiBlueMuted : "rgba(0,0,0,0.04)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: loading ? "wait" : "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: loading ? C.aiBlue : C.textTertiary, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={11} style={{ animation: loading ? "aiPulse 2s ease-in-out infinite" : "none" }} />{loading ? "Analyzing..." : "Refresh"}
              </button>
            </div>
            {error && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 12 }}><AlertTriangle size={14} /> {error}</div>}
            {loading && !autopilot ? (<div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.aiBlue, animation: "aiPulse 2s ease-in-out infinite" }} /><span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Analyzing {accounts.length} accounts and generating actions...</span></div>
            ) : autopilot?.status?.summary ? (
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.7, marginBottom: 12 }}>{autopilot.status.summary}</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[{ label: "Managing", value: autopilot.status.managing || accounts.length, color: C.aiBlue }, { label: "Pending Actions", value: pendingActions.length, color: pendingActions.length > 0 ? C.amber : C.textTertiary }, { label: "Expansion Signals", value: autopilot.expansionHighlights?.length || 0, color: C.green }].map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span><span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>{s.label}</span></div>
                  ))}
                </div>
              </div>
            ) : (<div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Click Refresh to activate the autopilot.</div>)}
          </div>

          {/* Actions Feed */}
          {pendingActions.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Actions to Review</span><div style={{ flex: 1, height: 1, background: C.borderDefault }} /><span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary }}>{pendingActions.length} pending</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pendingActions.map(action => {
                  const color = urgencyColors[action.urgency] || C.textTertiary;
                  const TypeIcon = typeIcons[action.type] || Zap;
                  const expanded = expandedAction === action.id;
                  const typeLabels = { email_draft: "Email Draft", risk_assessment: "Risk Assessment", next_action: "Next Action" };
                  return (
                    <div key={action.id} style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderLeft: `3px solid ${color}`, borderRadius: 10, overflow: "hidden", transition: "all 0.15s" }}>
                      <button onClick={() => setExpandedAction(expanded ? null : action.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                        <TypeIcon size={16} style={{ color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{action.accountName}</span>
                            <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color, background: color + "18", padding: "2px 6px", borderRadius: 3, letterSpacing: "0.04em", textTransform: "uppercase" }}>{typeLabels[action.type] || action.type}</span>
                          </div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, marginTop: 2 }}>{action.title}</div>
                        </div>
                        <ChevronRight size={14} style={{ color: C.textTertiary, transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
                      </button>
                      {expanded && (
                        <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${C.borderDefault}` }}>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, margin: "12px 0", padding: "12px 14px", background: C.bgPrimary, borderRadius: 8, border: `1px solid ${C.borderDefault}` }}>
                            {action.description && <div style={{ marginBottom: 8 }}>{action.description}</div>}
                            {action.draft && <div style={{ whiteSpace: "pre-wrap", fontFamily: FONT_BODY, fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>{action.draft}</div>}
                            {action.reasoning && <div style={{ marginTop: 8, fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary }}>Reasoning: {action.reasoning}</div>}
                          </div>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            {action.draft && <button onClick={() => handleCopy(action.draft, action.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: copiedId === action.id ? C.green : C.textSecondary, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500 }}>{copiedId === action.id ? <Check size={12} /> : <Copy size={12} />}{copiedId === action.id ? "Copied" : "Copy"}</button>}
                            <button onClick={() => handleActionStatus(action.id, "dismissed")} style={{ padding: "6px 12px", borderRadius: 6, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textTertiary, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500 }}>Dismiss</button>
                            <button onClick={() => handleActionStatus(action.id, "approved")} style={{ padding: "6px 12px", borderRadius: 6, cursor: "pointer", background: C.green + "18", border: `1px solid ${C.green}40`, color: C.green, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600 }}><Check size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />Approve</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expansion Highlights */}
          {autopilot?.expansionHighlights?.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Expansion Opportunities</span>
                <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
                <button onClick={() => navigate('/app/intel')} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 6, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: C.green }}>View All <ArrowRight size={12} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300, 1fr))", gap: 10 }}>
                {autopilot.expansionHighlights.slice(0, 3).map((opp, i) => (
                  <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.green}25`, borderRadius: 10, padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <TrendingUp size={14} style={{ color: C.green }} />
                      <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{opp.accountName}</span>
                      {opp.estimatedValue && <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, color: C.green, marginLeft: "auto" }}>{opp.estimatedValue}</span>}
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{opp.signal}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attention Items */}
          {autopilot?.attentionItems?.length > 0 && (
            <div style={{ background: C.bgCard, border: `1px solid ${C.amber}25`, borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><AlertTriangle size={14} style={{ color: C.amber }} /><span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.amber }}>Needs Your Judgment</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {autopilot.attentionItems.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, flexShrink: 0 }}>{item.accountName}:</span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{item.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All accounts list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}><span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textSecondary }}>All Accounts ({accounts.length})</span><div style={{ flex: 1, height: 1, background: C.borderDefault }} /></div>
            {[...accounts].sort((a, b) => { const ro = { high: 0, medium: 1, low: 2 }; if (ro[a.riskLevel] !== ro[b.riskLevel]) return ro[a.riskLevel] - ro[b.riskLevel]; return new Date(a.renewalDate) - new Date(b.renewalDate); }).map(account => {
              const daysUntil = Math.ceil((new Date(account.renewalDate) - now) / 86400000); const rc = { high: C.red, medium: C.amber, low: C.green };
              return (<button key={account.id} onClick={() => navigate('/app/accounts', { state: { accountId: account.id } })} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.background = C.bgCardHover; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.background = C.bgCard; }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: rc[account.riskLevel] || C.textTertiary }} />
                <div style={{ flex: 1 }}><div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{account.name}</div></div>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.textTertiary }}>{fmt$(account.arr)}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: daysUntil <= 30 ? C.red : daysUntil <= 60 ? C.amber : C.textTertiary }}>{daysUntil > 0 ? `${daysUntil}d` : `${Math.abs(daysUntil)}d overdue`}</span>
                <ArrowRight size={14} style={{ color: C.textTertiary, flexShrink: 0, opacity: 0.4 }} />
              </button>);
            })}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
