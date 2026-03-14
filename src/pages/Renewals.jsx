import { useState, useEffect, useRef } from "react";
import { Bot, MessageSquare, Upload, TrendingUp, Crown, Sparkles, Plus, Send, X, ChevronDown, ArrowRight, AlertTriangle, Zap, FileText, Type, Image, Trash2, Eye, Check, Mail, Shield, ChevronRight, Copy, BarChart3, Target, Lightbulb, ClipboardCopy } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { renewalStore, store } from "../lib/storage";
import { callAI } from "../lib/ai";
import { safeParse, fmtRelative, similarity } from "../lib/utils";
import { Badge, Btn, Input, Modal, FormField, renderMarkdown } from "../components/ui/index";
import { RENEWAL_IMPORT_PROMPT, RENEWAL_AUTOPILOT_PROMPT, RENEWAL_EXPANSION_PROMPT, RENEWAL_LEADERSHIP_PROMPT } from "../lib/prompts";

const RENEWALS_SECTIONS = [
  { id: "autopilot", icon: Bot, label: "Autopilot", agent: "Autopilot Agent" },
  { id: "accounts", icon: MessageSquare, label: "Accounts", agent: "Account Intelligence Agent" },
  { id: "import", icon: Upload, label: "Import", agent: "Data Intelligence Agent" },
  { id: "expansion", icon: TrendingUp, label: "Expansion", agent: "Expansion Intelligence Agent" },
  { id: "leadership", icon: Crown, label: "Leadership", agent: "Executive Intelligence Agent" },
];

export default function Renewals() {
  const [activeSection, setActiveSection] = useState("autopilot");
  const [hoveredSection, setHoveredSection] = useState(null);
  const [accounts, setAccounts] = useState(() => renewalStore.getAccounts());
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [showAddAccount, setShowAddAccount] = useState(false);

  function handleCreateAccount(data) {
    const account = { id: `acct-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name: data.name.trim(), arr: parseFloat(data.arr) || 0, renewalDate: data.renewalDate, riskLevel: data.riskLevel || "medium", contacts: [], summary: "", tags: [], lastActivity: new Date().toISOString(), createdAt: new Date().toISOString() };
    renewalStore.saveAccount(account); setAccounts(renewalStore.getAccounts());
    setShowAddAccount(false); setSelectedAccountId(account.id); setActiveSection("accounts");
  }
  function handleNavigateToAccount(accountId) { setSelectedAccountId(accountId); setActiveSection("accounts"); }
  const selectedAccount = selectedAccountId ? accounts.find(a => a.id === selectedAccountId) || null : null;

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: FONT_SANS, fontSize: 24, fontWeight: 700, color: C.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>Renewal Operations</h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, margin: "4px 0 0" }}>AI-augmented renewal management</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.aiBlueMuted, border: `1px solid ${C.aiBlue}30`, borderRadius: 8, padding: "6px 14px" }}>
            <Sparkles size={14} style={{ color: C.aiBlue }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, color: C.aiBlue, letterSpacing: "0.04em" }}>MODE: CO-PILOT</span>
          </div>
          <Btn variant="primary" onClick={() => setShowAddAccount(true)} size="sm"><Plus size={14} /> Add Account</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: `1px solid ${C.borderDefault}`, paddingBottom: 0 }}>
        {RENEWALS_SECTIONS.map(section => {
          const active = activeSection === section.id; const hovered = hoveredSection === section.id; const Icon = section.icon;
          return (
            <button key={section.id} onClick={() => setActiveSection(section.id)} onMouseEnter={() => setHoveredSection(section.id)} onMouseLeave={() => setHoveredSection(null)} title={section.agent}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", cursor: "pointer", background: "none", border: "none", borderBottom: `2px solid ${active ? C.gold : "transparent"}`, color: active ? C.textPrimary : hovered ? C.textPrimary : C.textSecondary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: active ? 600 : 500, transition: "all 0.15s ease", marginBottom: -1 }}>
              <Icon size={16} strokeWidth={active ? 2 : 1.75} style={{ opacity: active ? 1 : 0.7 }} />{section.label}
            </button>
          );
        })}
      </div>

      {activeSection === "autopilot" && <RenewalsAutopilot accounts={accounts} onNavigate={handleNavigateToAccount} onSwitchTab={setActiveSection} />}
      {activeSection === "accounts" && <RenewalsAccountsView accounts={accounts} selectedAccount={selectedAccount} onSelectAccount={setSelectedAccountId} onAddAccount={() => setShowAddAccount(true)} />}
      {activeSection === "import" && <RenewalsImport existingAccounts={accounts} onAccountsCreated={() => setAccounts(renewalStore.getAccounts())} onSwitchTab={setActiveSection} />}
      {activeSection === "expansion" && <RenewalsExpansion accounts={accounts} onNavigate={handleNavigateToAccount} />}
      {activeSection === "leadership" && <RenewalsLeadership accounts={accounts} onNavigate={handleNavigateToAccount} onSwitchTab={setActiveSection} />}

      {showAddAccount && <AddAccountModal onClose={() => setShowAddAccount(false)} onCreate={handleCreateAccount} />}
    </div>
  );
}

function Placeholder({ icon: Icon, title, agent, description }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: C.goldMuted, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={28} style={{ color: C.gold }} /></div>
      <div><h2 style={{ fontFamily: FONT_SANS, fontSize: 20, fontWeight: 600, color: C.textPrimary, margin: "0 0 4px" }}>{title}</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, maxWidth: 400, margin: "0 auto 8px", lineHeight: 1.5 }}>{description}</p>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Future agent: {agent}</span></div>
    </div>
  );
}

function AddAccountModal({ onClose, onCreate }) {
  const [name, setName] = useState(""); const [arr, setArr] = useState(""); const [renewalDate, setRenewalDate] = useState(""); const [riskLevel, setRiskLevel] = useState("medium");
  function handleSubmit() { if (!name.trim() || !arr || !renewalDate) return; onCreate({ name, arr, renewalDate, riskLevel }); }
  const riskColors = { low: C.green, medium: C.amber, high: C.red };
  return (
    <Modal title="Add Account" onClose={onClose} width={480}>
      <FormField label="Account Name" required><Input value={name} onChange={setName} placeholder="Company name" onKeyDown={e => e.key === "Enter" && handleSubmit()} /></FormField>
      <FormField label="ARR" required>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textTertiary, fontFamily: FONT_MONO, fontSize: 14 }}>$</span>
          <input type="number" value={arr} onChange={e => setArr(e.target.value)} placeholder="187000" onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 14, padding: "10px 12px 10px 28px", outline: "none", boxSizing: "border-box" }} />
        </div>
      </FormField>
      <FormField label="Renewal Date" required>
        <input type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 14, padding: "10px 12px", outline: "none", colorScheme: "dark", boxSizing: "border-box" }} />
      </FormField>
      <FormField label="Risk Level">
        <div style={{ display: "flex", gap: 8 }}>
          {["low", "medium", "high"].map(level => (<button key={level} onClick={() => setRiskLevel(level)} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, cursor: "pointer", border: `1px solid ${riskLevel === level ? riskColors[level] + "60" : C.borderDefault}`, background: riskLevel === level ? riskColors[level] + "14" : "transparent", color: riskLevel === level ? riskColors[level] : C.textSecondary, fontFamily: FONT_SANS, fontSize: 13, fontWeight: riskLevel === level ? 600 : 500, textTransform: "capitalize" }}>{level}</button>))}
        </div>
      </FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={handleSubmit} disabled={!name.trim() || !arr || !renewalDate}>Add Account</Btn></div>
    </Modal>
  );
}

// ─── Autopilot (replaces Guidance) ───────────────────────────────────────────
function RenewalsAutopilot({ accounts, onNavigate, onSwitchTab }) {
  const CACHE_KEY = `bc2-${store._ws}-renewals-autopilot`;
  const [autopilot, setAutopilot] = useState(() => safeParse(localStorage.getItem(CACHE_KEY), null));
  const [actions, setActions] = useState(() => renewalStore.getAutopilotActions());
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
      const portfolioData = accounts.map(a => {
        const daysUntil = Math.ceil((new Date(a.renewalDate) - now) / 86400000);
        const ctx = renewalStore.getContext(a.id);
        const contextSummary = ctx.length === 0 ? "No context data" : ctx.map(ci => ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 500)}`).join("\n");
        return { id: a.id, name: a.name, arr: a.arr, renewalDate: a.renewalDate, riskLevel: a.riskLevel, daysUntilRenewal: daysUntil, contacts: a.contacts || [], summary: a.summary || "", tags: a.tags || [], contextData: contextSummary };
      });
      const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const response = await callAI([{ role: "user", content: "Generate autopilot actions for my renewal portfolio." }], RENEWAL_AUTOPILOT_PROMPT(portfolioData, today), 4000);
      let text = String(response).trim(); if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text); parsed._generatedAt = Date.now(); setAutopilot(parsed); localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      // Save new actions
      if (parsed.actions?.length > 0) {
        const newActions = parsed.actions.map(a => ({ id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, accountId: a.accountId || "", accountName: a.accountName, type: a.type, title: a.title, description: a.description, draft: a.draft || "", urgency: a.urgency, reasoning: a.reasoning || "", status: "pending", createdAt: new Date().toISOString() }));
        renewalStore.saveAutopilotActions(newActions); setActions(newActions);
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  function handleActionStatus(actionId, status) {
    renewalStore.updateAutopilotAction(actionId, { status }); setActions(renewalStore.getAutopilotActions());
  }
  function handleCopy(text, id) { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }

  useEffect(() => { if (accounts.length > 0 && !autopilot && !loading) generateAutopilot(); }, [accounts.length]);

  if (accounts.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${C.aiBlue}20, ${C.gold}20)`, display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={32} style={{ color: C.aiBlue }} /></div>
      <div>
        <h2 style={{ fontFamily: FONT_SANS, fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Your Renewal Autopilot</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: "0 auto" }}>BaseCommand takes renewal work off your plate. Import your customer data — even a messy spreadsheet works — and the autopilot will generate outreach emails, flag risks, and surface expansion opportunities.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400, width: "100%" }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>Get Started</div>
        {[{ step: "1", label: "Import your data", desc: "Paste a Salesforce export, spreadsheet, or even rough notes about your customers", action: () => onSwitchTab("import") }, { step: "2", label: "Review extracted accounts", desc: "AI identifies accounts, ARR, renewal dates, and risk signals from your data" }, { step: "3", label: "Let Autopilot work", desc: "Get draft emails, risk assessments, and expansion signals — just review and approve" }].map((item, i) => (
          <button key={i} onClick={item.action} disabled={!item.action} style={{ display: "flex", gap: 14, padding: "14px 18px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, cursor: item.action ? "pointer" : "default", textAlign: "left", transition: "all 0.15s", width: "100%" }}
            onMouseEnter={e => { if (item.action) { e.currentTarget.style.borderColor = C.aiBlue + "40"; e.currentTarget.style.background = C.bgCardHover; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.background = C.bgCard; }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: C.aiBlue, opacity: 0.5, flexShrink: 0, width: 24 }}>{item.step}</span>
            <div><div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.4 }}>{item.desc}</div></div>
            {item.action && <ArrowRight size={14} style={{ color: C.aiBlue, flexShrink: 0, alignSelf: "center", opacity: 0.5 }} />}
          </button>
        ))}
      </div>
    </div>
  );

  const urgencyColors = { critical: C.red, high: C.amber, medium: C.blue };
  const typeIcons = { email_draft: Mail, risk_assessment: Shield, next_action: Zap };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Portfolio stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {[{ label: "Total ARR", value: fmt$(totalARR), color: C.textPrimary }, { label: "At-Risk ARR", value: fmt$(atRiskARR), color: atRiskARR > 0 ? C.red : C.textTertiary }, { label: "Due 30 Days", value: due30, color: due30 > 0 ? C.red : C.green }, { label: "Due 60 Days", value: due60, color: due60 > 0 ? C.amber : C.textTertiary }, { label: "Due 90 Days", value: due90, color: due90 > 0 ? C.textSecondary : C.textTertiary }].map((stat, i) => (
          <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Autopilot Status Banner */}
      <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.borderAI}`, borderLeft: `3px solid ${C.aiBlue}`, borderRadius: 12, padding: "22px 26px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${C.aiBlueGlow} 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, position: "relative" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.aiBlueMuted, border: `1px solid ${C.aiBlue}25`, display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={14} color={C.aiBlue} /></div>
          <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Autopilot</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto" }}>Autopilot Agent</span>
          {cachedAgo && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>· {cachedAgo}</span>}
          <button onClick={generateAutopilot} disabled={loading} style={{ background: loading ? C.aiBlueMuted : "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: loading ? "wait" : "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: loading ? C.aiBlue : C.textTertiary, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
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
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span><span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>{s.label}</span></div>
              ))}
            </div>
          </div>
        ) : (<div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Click Refresh to activate the autopilot.</div>)}
      </div>

      {/* Actions Feed */}
      {pendingActions.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Actions to Review</span><div style={{ flex: 1, height: 1, background: C.borderDefault }} /><span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{pendingActions.length} pending</span></div>
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
                        {action.reasoning && <div style={{ marginTop: 8, fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Reasoning: {action.reasoning}</div>}
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
            <button onClick={() => onSwitchTab("expansion")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 6, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: C.green }}>View All <ArrowRight size={12} /></button>
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
          return (<button key={account.id} onClick={() => onNavigate(account.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%" }}
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
  );
}

// ─── Leadership (Executive Intelligence Agent) ──────────────────────────────
function RenewalsLeadership({ accounts, onNavigate, onSwitchTab }) {
  const [cache, setCache] = useState(() => renewalStore.getLeadershipCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedSection, setCopiedSection] = useState(null);
  const [expandedForecast, setExpandedForecast] = useState(null);
  const cachedAgo = cache?._generatedAt ? (() => { const m = Math.floor((Date.now() - cache._generatedAt) / 60000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`; })() : null;

  const now = new Date();
  const totalARR = accounts.reduce((sum, a) => sum + (a.arr || 0), 0);
  const fmt$ = (n) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  async function generateAnalysis() {
    if (accounts.length === 0) return; setLoading(true); setError(null);
    try {
      const portfolioData = accounts.map(a => {
        const daysUntil = Math.ceil((new Date(a.renewalDate) - now) / 86400000);
        const ctx = renewalStore.getContext(a.id);
        return { id: a.id, name: a.name, arr: a.arr, renewalDate: a.renewalDate, riskLevel: a.riskLevel, daysUntilRenewal: daysUntil, contacts: a.contacts || [], summary: a.summary || "", tags: a.tags || [], contextCount: ctx.length, contextSummary: ctx.slice(0, 3).map(ci => ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 300)}`).join("\n") };
      });
      const autopilotActions = renewalStore.getAutopilotActions().filter(a => a.status !== "dismissed").slice(0, 20);
      const expansionCache = renewalStore.getExpansionCache();
      const expansionSignals = expansionCache?.opportunities?.slice(0, 10) || [];
      const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const response = await callAI([{ role: "user", content: "Generate my executive leadership analysis and brief." }], RENEWAL_LEADERSHIP_PROMPT(portfolioData, autopilotActions, expansionSignals, today), 5000);
      let text = String(response).trim(); if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text); parsed._generatedAt = Date.now(); setCache(parsed); renewalStore.saveLeadershipCache(parsed);
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${C.gold}20, ${C.aiBlue}20)`, display: "flex", alignItems: "center", justifyContent: "center" }}><Crown size={32} style={{ color: C.gold }} /></div>
      <div>
        <h2 style={{ fontFamily: FONT_SANS, fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Your Renewal Command Center</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: "0 auto" }}>Built for renewal leaders who need portfolio-level visibility, not account-level execution. Import your portfolio data to unlock executive briefs, forecasting, and strategic insights.</p>
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
        <Btn variant="primary" onClick={() => onSwitchTab("import")} style={{ marginTop: 8 }}><Upload size={14} /> Import Portfolio Data</Btn>
      </div>
    </div>
  );

  const severityColors = { critical: C.red, warning: C.amber, info: C.aiBlue };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Executive Brief */}
      <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.gold}25`, borderLeft: `3px solid ${C.gold}`, borderRadius: 12, padding: "22px 26px", position: "relative", overflow: "hidden" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold, animation: "aiPulse 2s ease-in-out infinite" }} /><span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Analyzing {accounts.length} accounts for executive brief...</span></div>
        ) : cache?.executiveBrief ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Headline */}
            <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>{cache.executiveBrief.headline}</div>
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
        <div style={{ background: C.bgCard, border: `1px solid ${C.red}25`, borderRadius: 10, padding: "16px 20px" }}>
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
                  </div>
                  {matchedAccount && <button onClick={() => onNavigate(matchedAccount.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 6, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, flexShrink: 0, alignSelf: "center" }}><ArrowRight size={10} />View</button>}
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
            <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Forecast</span>
            <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
            {cache.forecast.retentionRate && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>Retention Rate</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: C.green }}>{cache.forecast.retentionRate}</span>
              {cache.forecast.retentionRateConfidence && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: { high: C.green, medium: C.amber, low: C.red }[cache.forecast.retentionRateConfidence] || C.textTertiary, textTransform: "uppercase" }}>{cache.forecast.retentionRateConfidence}</span>}
            </div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[{ key: "thisMonth", label: "This Month" }, { key: "nextMonth", label: "Next Month" }, { key: "thisQuarter", label: "This Quarter" }, { key: "nextQuarter", label: "Next Quarter" }].map(period => {
              const data = cache.forecast[period.key]; if (!data) return null;
              const expanded = expandedForecast === period.key;
              return (
                <button key={period.key} onClick={() => setExpandedForecast(expanded ? null : period.key)} style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: "16px 18px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>{period.label}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>{fmt$(data.total || 0)}</div>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><Target size={16} style={{ color: C.textSecondary }} /><span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Portfolio Health</span><div style={{ flex: 1, height: 1, background: C.borderDefault }} /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cache.healthSignals.map((signal, i) => {
              const color = severityColors[signal.severity] || C.textTertiary;
              return (
                <div key={i} style={{ background: C.bgCard, border: `1px solid ${color}20`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "14px 18px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><Lightbulb size={16} style={{ color: C.textSecondary }} /><span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Strategic Recommendations</span><div style={{ flex: 1, height: 1, background: C.borderDefault }} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 10 }}>
            {cache.strategicRecs.map((rec, i) => (
              <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{rec.title}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginBottom: 8 }}>{rec.rationale}</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}><Zap size={12} style={{ color: C.gold, flexShrink: 0, marginTop: 2 }} /><span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, fontWeight: 500 }}>{rec.action}</span></div>
                {rec.impact && <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Impact: {rec.impact}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Import (Data Intelligence Agent) ────────────────────────────────────────
function RenewalsImport({ existingAccounts, onAccountsCreated, onSwitchTab }) {
  const [phase, setPhase] = useState("input"); // input | review | done
  const [rawData, setRawData] = useState("");
  const [source, setSource] = useState("Salesforce");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extracted, setExtracted] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [createdCount, setCreatedCount] = useState(0);
  const fileInputRef = useRef(null);

  async function handleProcess() {
    if (!rawData.trim()) return; setLoading(true); setError(null);
    try {
      // Chunk large inputs
      const chunks = [];
      const maxChunk = 12000;
      if (rawData.length <= maxChunk) { chunks.push(rawData); }
      else { let start = 0; while (start < rawData.length) { chunks.push(rawData.slice(start, start + maxChunk)); start += maxChunk; } }

      let allAccounts = [];
      let allWarnings = [];
      let summary = "";
      for (const chunk of chunks) {
        const response = await callAI([{ role: "user", content: `Process this data and extract renewal accounts:\n\n${chunk}` }], RENEWAL_IMPORT_PROMPT(chunk, source), 4000);
        let text = String(response).trim(); if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        const parsed = JSON.parse(text);
        if (parsed.accounts) allAccounts = allAccounts.concat(parsed.accounts);
        if (parsed.warnings) allWarnings = allWarnings.concat(parsed.warnings);
        if (parsed.summary) summary = parsed.summary;
      }

      // Deduplicate extracted accounts
      const deduped = [];
      for (const acct of allAccounts) {
        const isDup = deduped.some(d => similarity(d.name.toLowerCase(), acct.name.toLowerCase()) > 0.8);
        if (!isDup) deduped.push(acct);
      }

      // Flag accounts that match existing ones
      for (const acct of deduped) {
        const existingMatch = existingAccounts.find(e => similarity(e.name.toLowerCase(), acct.name.toLowerCase()) > 0.7);
        if (existingMatch) acct._existingMatch = existingMatch.name;
      }

      setExtracted(deduped); setWarnings(allWarnings); setAiSummary(summary); setPhase("review");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setRawData(prev => prev ? prev + "\n\n---\n\n" + ev.target.result : ev.target.result); };
    reader.readAsText(file); e.target.value = "";
  }

  function removeExtracted(idx) { setExtracted(prev => prev.filter((_, i) => i !== idx)); }
  function updateExtracted(idx, field, value) { setExtracted(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a)); }

  function handleCreateAccounts() {
    let created = 0;
    for (const acct of extracted) {
      if (acct._existingMatch && acct._skip) continue;
      const account = {
        id: `acct-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: acct.name.trim(),
        arr: parseFloat(acct.arr) || 0,
        renewalDate: acct.renewalDate || "",
        riskLevel: acct.riskLevel || "medium",
        contacts: acct.contacts || [],
        summary: acct.notes || "",
        tags: [],
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      renewalStore.saveAccount(account);
      // Attach raw source data as context item
      renewalStore.addContextItem(account.id, {
        id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        accountId: account.id,
        type: "text",
        label: `Import: ${source}`,
        source: source.toLowerCase(),
        content: rawData.slice(0, 5000),
        metadata: { words: rawData.split(/\s+/).length, size: (new Blob([rawData]).size / 1024).toFixed(1) + " KB" },
        uploadedAt: new Date().toISOString()
      });
      created++;
    }
    setCreatedCount(created); onAccountsCreated(); setPhase("done");
  }

  const confidenceColors = { high: C.green, medium: C.amber, low: C.red };

  // Phase: Input
  if (phase === "input") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.borderAI}`, borderLeft: `3px solid ${C.aiBlue}`, borderRadius: 12, padding: "22px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.aiBlueMuted, display: "flex", alignItems: "center", justifyContent: "center" }}><Upload size={14} color={C.aiBlue} /></div>
          <div>
            <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Import Unstructured Data</span>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, margin: "2px 0 0" }}>Don't worry about clean data. Paste messy CRM exports, spreadsheets, call notes, emails — AI will extract your accounts.</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <FormField label="Source">
          <select value={source} onChange={e => setSource(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 13, outline: "none" }}>
            {["Salesforce", "HubSpot", "Gong", "Spreadsheet", "Email", "Notes", "Other"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
        <div style={{ flex: 1 }} />
        <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv,.md" style={{ display: "none" }} onChange={handleFileUpload} />
        <Btn variant="ghost" onClick={() => fileInputRef.current?.click()}><FileText size={14} /> Upload File</Btn>
      </div>

      <textarea value={rawData} onChange={e => setRawData(e.target.value)} placeholder={"Paste your data here...\n\nExamples:\n- Salesforce CSV export\n- Spreadsheet copy/paste\n- CRM report\n- Call notes with account details\n- Email threads about renewals\n- Any mix of the above"} rows={14}
        style={{ width: "100%", padding: "16px 18px", borderRadius: 10, background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 13, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = C.aiBlue} onBlur={e => e.target.style.borderColor = C.borderDefault} />

      {rawData.trim() ? <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{rawData.split(/\s+/).length} words · {(new Blob([rawData]).size / 1024).toFixed(1)} KB</div>
      : <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[{ title: "CRM Exports", desc: "Salesforce reports, HubSpot exports, even messy CSV files with inconsistent columns", icon: FileText, color: C.green },
            { title: "Call Notes & Transcripts", desc: "Gong summaries, meeting notes, or any text with customer details mentioned", icon: MessageSquare, color: C.amber },
            { title: "Emails & Messages", desc: "Renewal threads, customer check-ins, Slack conversations about accounts", icon: Mail, color: C.aiBlue }
          ].map((item, i) => { const Icon = item.icon; return (
            <div key={i} style={{ padding: "14px 16px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Icon size={14} style={{ color: item.color }} /><span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{item.title}</span></div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5 }}>{item.desc}</div>
            </div>);
          })}
        </div>}
      {error && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontFamily: FONT_BODY, fontSize: 13 }}><AlertTriangle size={14} /> {error}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn variant="primary" onClick={handleProcess} disabled={!rawData.trim() || loading}>
          {loading ? <><Sparkles size={14} style={{ animation: "aiPulse 2s ease-in-out infinite" }} /> Processing...</> : <><Sparkles size={14} /> Process with AI</>}
        </Btn>
      </div>
    </div>
  );

  // Phase: Review
  if (phase === "review") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.borderAI}`, borderLeft: `3px solid ${C.aiBlue}`, borderRadius: 12, padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Sparkles size={14} style={{ color: C.aiBlue }} />
          <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>AI Extraction Complete</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.aiBlue, marginLeft: "auto" }}>{extracted.length} accounts found</span>
        </div>
        {aiSummary && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{aiSummary}</div>}
        {warnings.length > 0 && <div style={{ marginTop: 8 }}>{warnings.map((w, i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontFamily: FONT_BODY, fontSize: 12, color: C.amber, lineHeight: 1.4, marginTop: 4 }}><AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />{w}</div>)}</div>}
      </div>

      {extracted.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>No accounts could be extracted from the data. Try pasting different data or a larger sample.</p>
          <Btn variant="ghost" onClick={() => setPhase("input")} style={{ marginTop: 12 }}>Go Back</Btn>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {extracted.map((acct, idx) => {
              const confColor = confidenceColors[acct.confidence] || C.textTertiary;
              const rc = { high: C.red, medium: C.amber, low: C.green };
              return (
                <div key={idx} style={{ background: C.bgCard, border: `1px solid ${acct._existingMatch ? C.amber + "40" : C.borderDefault}`, borderRadius: 10, padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <input value={acct.name} onChange={e => updateExtracted(idx, "name", e.target.value)} style={{ flex: 1, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary, background: "transparent", border: "none", outline: "none", padding: 0 }} />
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: confColor, background: confColor + "18", padding: "2px 6px", borderRadius: 3, textTransform: "uppercase" }}>{acct.confidence || "medium"}</span>
                    <button onClick={() => removeExtracted(idx)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textTertiary, display: "flex", padding: 2, opacity: 0.5 }} onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}><X size={14} /></button>
                  </div>
                  {acct._existingMatch && <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "6px 10px", background: C.amber + "12", borderRadius: 6, border: `1px solid ${C.amber}25` }}><AlertTriangle size={12} style={{ color: C.amber }} /><span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.amber }}>Possible duplicate of "{acct._existingMatch}"</span></div>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginBottom: 4 }}>ARR</div>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: C.textTertiary, fontFamily: FONT_MONO, fontSize: 12 }}>$</span>
                        <input type="number" value={acct.arr || ""} onChange={e => updateExtracted(idx, "arr", parseFloat(e.target.value) || 0)} style={{ width: "100%", padding: "6px 8px 6px 20px", borderRadius: 6, background: C.bgPrimary, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginBottom: 4 }}>Renewal Date</div>
                      <input type="date" value={acct.renewalDate || ""} onChange={e => updateExtracted(idx, "renewalDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, background: C.bgPrimary, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 12, outline: "none", colorScheme: "dark", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginBottom: 4 }}>Risk Level</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {["low", "medium", "high"].map(level => (<button key={level} onClick={() => updateExtracted(idx, "riskLevel", level)} style={{ flex: 1, padding: "5px 4px", borderRadius: 5, cursor: "pointer", border: `1px solid ${acct.riskLevel === level ? rc[level] + "60" : C.borderDefault}`, background: acct.riskLevel === level ? rc[level] + "14" : "transparent", color: acct.riskLevel === level ? rc[level] : C.textTertiary, fontFamily: FONT_SANS, fontSize: 10, fontWeight: acct.riskLevel === level ? 600 : 500, textTransform: "capitalize" }}>{level}</button>))}
                      </div>
                    </div>
                  </div>
                  {acct.notes && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.5, padding: "8px 10px", background: C.bgPrimary, borderRadius: 6, border: `1px solid ${C.borderDefault}` }}>{acct.notes}</div>}
                  {acct.contacts?.length > 0 && <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>{acct.contacts.map((c, ci) => <span key={ci} style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, background: C.bgPrimary, padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.borderDefault}` }}>{c.name}{c.role ? ` · ${c.role}` : ""}</span>)}</div>}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => { setPhase("input"); setExtracted([]); }}>Back</Btn>
            <Btn variant="primary" onClick={handleCreateAccounts} disabled={extracted.length === 0}><Check size={14} /> Create {extracted.length} Account{extracted.length !== 1 ? "s" : ""}</Btn>
          </div>
        </>
      )}
    </div>
  );

  // Phase: Done
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: C.green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={28} style={{ color: C.green }} /></div>
      <h2 style={{ fontFamily: FONT_SANS, fontSize: 20, fontWeight: 600, color: C.textPrimary, margin: 0 }}>Import Complete</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, maxWidth: 400, lineHeight: 1.5, margin: 0 }}>{createdCount} account{createdCount !== 1 ? "s" : ""} created with source data attached. The Autopilot will start generating actions for them.</p>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Btn variant="ghost" onClick={() => { setPhase("input"); setRawData(""); setExtracted([]); }}>Import More</Btn>
        <Btn variant="primary" onClick={() => onSwitchTab("autopilot")}>Go to Autopilot</Btn>
      </div>
    </div>
  );
}

// ─── Expansion (Expansion Intelligence Agent) ───────────────────────────────
function RenewalsExpansion({ accounts, onNavigate }) {
  const [cache, setCache] = useState(() => renewalStore.getExpansionCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cachedAgo = cache?._generatedAt ? (() => { const m = Math.floor((Date.now() - cache._generatedAt) / 60000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`; })() : null;

  const accountsWithContext = accounts.filter(a => renewalStore.getContext(a.id).length > 0);

  async function analyzeExpansion() {
    if (accountsWithContext.length === 0) return; setLoading(true); setError(null);
    try {
      const data = accountsWithContext.map(a => {
        const ctx = renewalStore.getContext(a.id);
        return { id: a.id, name: a.name, arr: a.arr, renewalDate: a.renewalDate, riskLevel: a.riskLevel, contacts: a.contacts || [], context: ctx.map(ci => ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 600)}`).join("\n") };
      });
      const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const response = await callAI([{ role: "user", content: "Analyze my accounts for expansion opportunities." }], RENEWAL_EXPANSION_PROMPT(data, today), 4000);
      let text = String(response).trim(); if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text); parsed._generatedAt = Date.now(); setCache(parsed); renewalStore.saveExpansionCache(parsed);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  useEffect(() => { if (accountsWithContext.length > 0 && !cache && !loading) analyzeExpansion(); }, [accountsWithContext.length]);

  if (accounts.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: C.green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={32} style={{ color: C.green }} /></div>
      <div>
        <h2 style={{ fontFamily: FONT_SANS, fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Find Expansion Revenue</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: "0 auto" }}>Import your accounts first, then add context data (call notes, CRM exports, emails). The Expansion Agent will identify upsell and cross-sell opportunities hiding in your customer conversations.</p>
      </div>
    </div>
  );

  if (accountsWithContext.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: C.green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={32} style={{ color: C.green }} /></div>
      <div>
        <h2 style={{ fontFamily: FONT_SANS, fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Add Context to Unlock Signals</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: "0 auto" }}>You have {accounts.length} account{accounts.length !== 1 ? "s" : ""} but none have context data yet. Add call notes, CRM data, or emails to any account and the Expansion Agent will scan for upsell and cross-sell opportunities.</p>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, maxWidth: 400, lineHeight: 1.5 }}>
        <strong style={{ color: C.textSecondary }}>What counts as context?</strong> Gong call transcripts, Salesforce notes, email threads, support tickets, usage data — anything that reveals how your customer is using your product and what they need next.
      </div>
    </div>
  );

  const signalColors = { usage_growth: C.green, feature_request: C.aiBlue, team_expansion: C.gold, contract_timing: C.amber, competitive_displacement: C.red, product_gap: "#a78bfa" };
  const signalLabels = { usage_growth: "Usage Growth", feature_request: "Feature Request", team_expansion: "Team Expansion", contract_timing: "Contract Timing", competitive_displacement: "Competitive", product_gap: "Product Gap" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.green}25`, borderLeft: `3px solid ${C.green}`, borderRadius: 12, padding: "22px 26px", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={14} color={C.green} /></div>
          <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Expansion Intelligence</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto" }}>Analyzing {accountsWithContext.length} accounts</span>
          {cachedAgo && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>· {cachedAgo}</span>}
          <button onClick={analyzeExpansion} disabled={loading} style={{ background: loading ? C.green + "18" : "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: loading ? "wait" : "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: loading ? C.green : C.textTertiary, display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={11} style={{ animation: loading ? "aiPulse 2s ease-in-out infinite" : "none" }} />{loading ? "Analyzing..." : "Refresh"}
          </button>
        </div>
        {error && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 8 }}><AlertTriangle size={14} /> {error}</div>}
        {loading && !cache ? (<div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, animation: "aiPulse 2s ease-in-out infinite" }} /><span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Scanning account data for expansion signals...</span></div>
        ) : cache?.portfolioInsights ? (
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.7, marginBottom: 8 }}>{cache.portfolioInsights}</div>
            {cache.totalEstimatedExpansion && <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600, color: C.green }}>Total Estimated Expansion: {cache.totalEstimatedExpansion}</div>}
          </div>
        ) : (<div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Click Refresh to scan for expansion opportunities.</div>)}
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
                  {matchedAccount && <button onClick={() => onNavigate(matchedAccount.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 4, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary }}><ArrowRight size={10} />View</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Accounts (Account Intelligence Agent) ───────────────────────────────────
function RenewalsAccountsView({ accounts, selectedAccount, onSelectAccount, onAddAccount }) {
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showThreadList, setShowThreadList] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [contextItems, setContextItems] = useState([]);
  const [showTextPaste, setShowTextPaste] = useState(false);
  const [pasteLabel, setPasteLabel] = useState(""); const [pasteSource, setPasteSource] = useState("manual"); const [pasteContent, setPasteContent] = useState("");
  const messagesEndRef = useRef(null); const inputRef = useRef(null); const csvInputRef = useRef(null); const imgInputRef = useRef(null);

  useEffect(() => {
    if (!selectedAccount) { setThreads([]); setActiveThreadId(null); setMessages([]); setContextItems([]); return; }
    const acctThreads = renewalStore.getThreads(selectedAccount.id); setThreads(acctThreads);
    if (acctThreads.length > 0) { const sorted = [...acctThreads].sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)); setActiveThreadId(sorted[0].id); }
    else { setActiveThreadId(null); setMessages([]); }
    setShowThreadList(false); setContextItems(renewalStore.getContext(selectedAccount.id));
  }, [selectedAccount?.id]);

  useEffect(() => { if (!activeThreadId) { setMessages([]); return; } setMessages(renewalStore.getMessages(activeThreadId)); }, [activeThreadId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (selectedAccount && activeThreadId) inputRef.current?.focus(); }, [selectedAccount?.id, activeThreadId]);

  function refreshContext() { if (selectedAccount) setContextItems(renewalStore.getContext(selectedAccount.id)); }
  function createThread(firstMessage) {
    const thread = { id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, title: firstMessage ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "") : "New conversation", createdAt: new Date().toISOString(), lastMessageAt: new Date().toISOString() };
    renewalStore.addThread(selectedAccount.id, thread); setThreads(renewalStore.getThreads(selectedAccount.id)); setActiveThreadId(thread.id); setMessages([]); setShowThreadList(false); return thread;
  }
  function deleteThread(threadId) { renewalStore.deleteThread(selectedAccount.id, threadId); const remaining = renewalStore.getThreads(selectedAccount.id); setThreads(remaining); if (activeThreadId === threadId) { if (remaining.length > 0) { setActiveThreadId([...remaining].sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt))[0].id); } else { setActiveThreadId(null); setMessages([]); } } }
  function deleteContextItem(itemId) { renewalStore.deleteContextItem(selectedAccount.id, itemId); refreshContext(); }

  function handleCSVUpload(e) { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const text = ev.target.result; const lines = text.split("\n").filter(l => l.trim()); renewalStore.addContextItem(selectedAccount.id, { id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, accountId: selectedAccount.id, type: "csv", label: file.name, source: "manual", content: text, metadata: { rows: Math.max(0, lines.length - 1), words: text.split(/\s+/).length, size: (file.size / 1024).toFixed(1) + " KB" }, uploadedAt: new Date().toISOString() }); refreshContext(); }; reader.readAsText(file); e.target.value = ""; }
  function handleTextPasteSave() { if (!pasteContent.trim()) return; renewalStore.addContextItem(selectedAccount.id, { id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, accountId: selectedAccount.id, type: "text", label: pasteLabel.trim() || "Pasted text", source: pasteSource, content: pasteContent, metadata: { words: pasteContent.trim().split(/\s+/).length, size: (new Blob([pasteContent]).size / 1024).toFixed(1) + " KB" }, uploadedAt: new Date().toISOString() }); refreshContext(); setPasteLabel(""); setPasteSource("manual"); setPasteContent(""); setShowTextPaste(false); }
  function handleImageUpload(e) { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { renewalStore.addContextItem(selectedAccount.id, { id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, accountId: selectedAccount.id, type: "image", label: file.name, source: "manual", content: ev.target.result, metadata: { size: (file.size / 1024).toFixed(1) + " KB", mimeType: file.type }, uploadedAt: new Date().toISOString() }); refreshContext(); }; reader.readAsDataURL(file); e.target.value = ""; }

  function buildCoPilotSystemPrompt() {
    const acct = selectedAccount; const items = renewalStore.getContext(acct.id);
    const daysToRenewal = acct.renewalDate ? Math.ceil((new Date(acct.renewalDate) - new Date()) / 86400000) : null;
    const contextSummary = items.length === 0 ? "No context items ingested yet." : items.map(ci => ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 800)}`).join("\n\n");
    return `You are a Renewal Co-Pilot inside Base Command.\n\nACCOUNT:\n- Name: ${acct.name}\n- ARR: $${(acct.arr || 0).toLocaleString()}\n- Renewal: ${acct.renewalDate || "Not set"}${daysToRenewal !== null ? ` (${daysToRenewal} days)` : ""}\n- Risk: ${acct.riskLevel}\n\nINGESTED DATA (${items.length}):\n${contextSummary}\n\nToday: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}\n\nCAPABILITIES: Email drafting, conversation prep, risk analysis, pricing strategies, next best actions, contract analysis, stakeholder mapping.\n\nGUIDELINES: Be direct and actionable. Reference account data. Use markdown. **Bold** key points.`;
  }

  async function handleSend() {
    const text = input.trim(); if (!text || sending) return; setInput(""); setSending(true);
    let threadId = activeThreadId; if (!threadId) { const thread = createThread(text); threadId = thread.id; }
    const userMsg = { role: "user", content: text, timestamp: new Date().toISOString() };
    renewalStore.addMessage(threadId, userMsg); setMessages(prev => [...prev, userMsg]);
    const updatedThreads = renewalStore.getThreads(selectedAccount.id).map(t => t.id !== threadId ? t : { ...t, ...(messages.filter(m => m.role === "user").length === 0 ? { title: text.slice(0, 50) } : {}), lastMessageAt: new Date().toISOString() });
    renewalStore.saveThreads(selectedAccount.id, updatedThreads); setThreads(updatedThreads);
    try {
      const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const response = await callAI(apiMessages, buildCoPilotSystemPrompt(), 4000);
      const assistantMsg = { role: "assistant", content: response.toString(), timestamp: new Date().toISOString() };
      renewalStore.addMessage(threadId, assistantMsg); setMessages(prev => [...prev, assistantMsg]);
    } catch (err) { const errorMsg = { role: "assistant", content: `**Error:** ${err.message}`, timestamp: new Date().toISOString(), isError: true }; renewalStore.addMessage(threadId, errorMsg); setMessages(prev => [...prev, errorMsg]); }
    setSending(false);
  }

  const contextByType = { csv: [], text: [], image: [] }; contextItems.forEach(ci => { if (contextByType[ci.type]) contextByType[ci.type].push(ci); else contextByType.text.push(ci); });
  const typeConfig = { csv: { icon: FileText, label: "CSV Data", color: C.green }, text: { icon: Type, label: "Text / Notes", color: C.amber }, image: { icon: Image, label: "Screenshots", color: C.aiBlue } };

  if (accounts.length === 0) return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12, padding: 32, minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: C.goldMuted, display: "flex", alignItems: "center", justifyContent: "center" }}><MessageSquare size={28} style={{ color: C.gold }} /></div>
      <div><h2 style={{ fontFamily: FONT_SANS, fontSize: 20, fontWeight: 600, color: C.textPrimary, margin: "0 0 4px", textAlign: "center" }}>No Accounts Yet</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, maxWidth: 360, lineHeight: 1.5, margin: "8px 0 0", textAlign: "center" }}>Add your first account to start working with the Account Intelligence co-pilot.</p></div>
      <Btn variant="primary" onClick={onAddAccount}><Plus size={14} /> Add Account</Btn>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 0, minHeight: 500, height: "calc(100vh - 280px)" }}>
      {/* Account list sidebar */}
      <div style={{ width: 240, flexShrink: 0, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: "12px 0 0 12px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.borderDefault}`, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textSecondary }}>Accounts ({accounts.length})</div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {accounts.map(account => {
            const selected = selectedAccount?.id === account.id; const rc = { high: C.red, medium: C.amber, low: C.green };
            return (<button key={account.id} onClick={() => onSelectAccount(account.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", textAlign: "left", background: selected ? "rgba(255,255,255,0.07)" : "transparent", border: "none", borderLeft: `3px solid ${selected ? C.gold : "transparent"}`, transition: "all 0.12s" }}
              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }} onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: rc[account.riskLevel] || C.textTertiary }} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: selected ? 600 : 500, color: selected ? C.textPrimary : C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account.name}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginTop: 2 }}>${(account.arr || 0).toLocaleString()}</div></div>
            </button>);
          })}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, background: C.bgCard, borderTop: `1px solid ${C.borderDefault}`, borderBottom: `1px solid ${C.borderDefault}`, ...(showContext ? {} : { borderRight: `1px solid ${C.borderDefault}`, borderRadius: "0 12px 12px 0" }), display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selectedAccount ? (<>
          {/* Account header */}
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.borderDefault}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <h2 style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, margin: 0, flex: 1 }}>{selectedAccount.name}</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {[{ label: `$${(selectedAccount.arr || 0).toLocaleString()}`, color: C.textPrimary }, { label: selectedAccount.renewalDate || "No date", color: C.textSecondary }, { label: selectedAccount.riskLevel, color: { high: C.red, medium: C.amber, low: C.green }[selectedAccount.riskLevel] }].map((chip, i) => (
                <span key={i} style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, color: chip.color, background: C.bgPrimary, padding: "3px 10px", borderRadius: 4, border: `1px solid ${C.borderDefault}`, textTransform: "capitalize" }}>{chip.label}</span>
              ))}
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, color: C.aiBlue, background: C.aiBlueMuted, padding: "3px 10px", borderRadius: 4 }}>Co-Pilot</span>
              <button onClick={() => setShowContext(!showContext)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", background: showContext ? "rgba(255,255,255,0.07)" : "transparent", border: `1px solid ${showContext ? C.aiBlue + "40" : C.borderDefault}`, borderRadius: 4, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, color: showContext ? C.aiBlue : C.textTertiary }}><Eye size={12} /> Context{contextItems.length > 0 ? ` (${contextItems.length})` : ""}</button>
            </div>
          </div>
          {/* Thread bar */}
          <div style={{ padding: "8px 20px", borderBottom: `1px solid ${C.borderDefault}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0, background: C.bgPrimary }}>
            <button onClick={() => setShowThreadList(!showThreadList)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: showThreadList ? "rgba(255,255,255,0.07)" : "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 6, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: C.textSecondary }}>
              <MessageSquare size={13} />{activeThreadId ? (threads.find(t => t.id === activeThreadId)?.title || "Conversation") : "No conversation"}<ChevronDown size={12} style={{ transform: showThreadList ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => createThread()} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 6, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: C.textSecondary }}><Plus size={13} /> New</button>
            {threads.length > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{threads.length} thread{threads.length !== 1 ? "s" : ""}</span>}
          </div>
          {/* Thread list dropdown */}
          {showThreadList && threads.length > 0 && (
            <div style={{ borderBottom: `1px solid ${C.borderDefault}`, background: C.bgPrimary, maxHeight: 200, overflow: "auto", flexShrink: 0 }}>
              {[...threads].sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)).map(thread => {
                const isActive = thread.id === activeThreadId;
                return (<div key={thread.id} onClick={() => { setActiveThreadId(thread.id); setShowThreadList(false); }} style={{ display: "flex", alignItems: "center", padding: "8px 20px", gap: 8, background: isActive ? "rgba(255,255,255,0.05)" : "transparent", cursor: "pointer", borderLeft: `2px solid ${isActive ? C.aiBlue : "transparent"}` }}>
                  <MessageSquare size={12} style={{ color: isActive ? C.aiBlue : C.textTertiary, flexShrink: 0 }} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: isActive ? C.textPrimary : C.textSecondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{thread.title}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>{new Date(thread.lastMessageAt || thread.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                  <button onClick={e => { e.stopPropagation(); deleteThread(thread.id); }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: C.textTertiary, display: "flex", opacity: 0.5 }}><X size={12} /></button>
                </div>);
              })}
            </div>
          )}
          {/* Messages */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {!activeThreadId && messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 16, padding: "40px 0", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}20, ${C.aiBlue}20)`, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={24} style={{ color: C.aiBlue }} /></div>
                <div><h3 style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, margin: "0 0 6px" }}>Account Co-Pilot</h3>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, maxWidth: 380, lineHeight: 1.5, margin: 0 }}>Start a conversation about {selectedAccount.name}.</p></div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
                  {["Draft a renewal outreach email", "Analyze risk signals", "What's my best expansion play?"].map((s, i) => (
                    <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }} style={{ padding: "7px 12px", borderRadius: 8, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: FONT_BODY, fontSize: 12, transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.color = C.textPrimary; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: msg.role === "user" ? C.goldMuted : C.aiBlueMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {msg.role === "user" ? <span style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, color: C.gold }}>M</span> : <Sparkles size={13} style={{ color: C.aiBlue }} />}
                </div>
                <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: 10, background: msg.role === "user" ? C.bgElevated : C.bgAI, border: `1px solid ${msg.role === "user" ? C.borderSubtle : C.borderAI}`, ...(msg.isError ? { borderColor: C.red + "40" } : {}) }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textPrimary, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginTop: 5, textAlign: msg.role === "user" ? "right" : "left" }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
            {sending && <div style={{ display: "flex", gap: 10 }}><div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: C.aiBlueMuted, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={13} style={{ color: C.aiBlue }} /></div><div style={{ padding: "10px 14px", borderRadius: 10, background: C.bgAI, border: `1px solid ${C.borderAI}` }}><div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, animation: "aiPulse 1.5s ease-in-out infinite" }}>Thinking...</div></div></div>}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.borderDefault}`, flexShrink: 0, background: C.bgPrimary }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={`Ask about ${selectedAccount.name}...`} disabled={sending}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 13, outline: "none" }}
                onFocus={e => e.target.style.borderColor = C.aiBlue} onBlur={e => e.target.style.borderColor = C.borderDefault} />
              <button onClick={handleSend} disabled={sending || !input.trim()} style={{ padding: "10px 16px", borderRadius: 8, border: "none", cursor: sending || !input.trim() ? "default" : "pointer", background: sending || !input.trim() ? C.bgElevated : `linear-gradient(135deg, ${C.gold}, ${C.aiBlue})`, color: sending || !input.trim() ? C.textTertiary : "#fff", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, opacity: sending || !input.trim() ? 0.5 : 1 }}><Send size={14} /> Send</button>
            </div>
          </div>
        </>) : (<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12 }}><MessageSquare size={32} style={{ color: C.textTertiary, opacity: 0.5 }} /><p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Select an account to start working</p></div>)}
      </div>

      {/* Context Panel */}
      {showContext && selectedAccount && (
        <div style={{ width: 300, flexShrink: 0, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderLeft: "none", borderRadius: "0 12px 12px 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderDefault}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Eye size={14} style={{ color: C.aiBlue }} /><span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, flex: 1 }}>Account Context</span>
            <button onClick={() => setShowContext(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textTertiary, display: "flex", padding: 2 }}><X size={14} /></button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary */}
            <div style={{ background: C.bgPrimary, borderRadius: 8, padding: 12, border: `1px solid ${C.borderDefault}` }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>Summary</div>
              {(() => { const dtr = selectedAccount.renewalDate ? Math.ceil((new Date(selectedAccount.renewalDate) - new Date()) / 86400000) : null; return (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[{ label: "ARR", value: `$${(selectedAccount.arr || 0).toLocaleString()}` }, { label: "Renewal", value: selectedAccount.renewalDate || "Not set" }, ...(dtr !== null ? [{ label: "Days Out", value: `${dtr} days`, color: dtr <= 30 ? C.red : dtr <= 60 ? C.amber : C.textPrimary }] : []), { label: "Risk", value: selectedAccount.riskLevel, color: { high: C.red, medium: C.amber, low: C.green }[selectedAccount.riskLevel] }, { label: "Threads", value: String(threads.length) }, { label: "Context", value: `${contextItems.length} item${contextItems.length !== 1 ? "s" : ""}` }].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>{row.label}</span><span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 500, color: row.color || C.textPrimary, textTransform: "capitalize" }}>{row.value}</span></div>
                  ))}
                </div>
              ); })()}
            </div>
            {/* Add Context buttons */}
            <div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>Add Context</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input ref={csvInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSVUpload} />
                <input ref={imgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                {[{ label: "CSV", icon: FileText, color: C.green, onClick: () => csvInputRef.current?.click() }, { label: "Text", icon: Type, color: C.amber, onClick: () => setShowTextPaste(true) }, { label: "Image", icon: Image, color: C.aiBlue, onClick: () => imgInputRef.current?.click() }].map((btn, i) => (
                  <button key={i} onClick={btn.onClick} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 8, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 11, fontWeight: 500, transition: "all 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = btn.color + "60"; e.currentTarget.style.color = btn.color; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}>
                    <btn.icon size={16} />{btn.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Text paste form */}
            {showTextPaste && (
              <div style={{ background: C.bgPrimary, borderRadius: 8, padding: 12, border: `1px solid ${C.amber}30` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.amber }}>Paste Text</span><button onClick={() => setShowTextPaste(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textTertiary, display: "flex", padding: 2 }}><X size={12} /></button></div>
                <input value={pasteLabel} onChange={e => setPasteLabel(e.target.value)} placeholder="Label (e.g. Gong call notes)" style={{ width: "100%", padding: "6px 10px", borderRadius: 6, marginBottom: 6, background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                <select value={pasteSource} onChange={e => setPasteSource(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, marginBottom: 6, background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: FONT_BODY, fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                  <option value="manual">Manual</option><option value="gong">Gong</option><option value="salesforce">Salesforce</option><option value="quickbase">Quickbase</option><option value="slack">Slack</option><option value="email">Email</option><option value="other">Other</option>
                </select>
                <textarea value={pasteContent} onChange={e => setPasteContent(e.target.value)} placeholder="Paste content here..." rows={5} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, marginBottom: 8, resize: "vertical", background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 12, outline: "none", boxSizing: "border-box", lineHeight: 1.5 }} />
                <button onClick={handleTextPasteSave} disabled={!pasteContent.trim()} style={{ width: "100%", padding: "7px 0", borderRadius: 6, border: "none", cursor: pasteContent.trim() ? "pointer" : "default", background: pasteContent.trim() ? C.amber : C.bgElevated, color: pasteContent.trim() ? "#000" : C.textTertiary, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, opacity: pasteContent.trim() ? 1 : 0.5 }}>Save Context</button>
              </div>
            )}
            {/* Context items */}
            {contextItems.length === 0 && !showTextPaste && (<div style={{ textAlign: "center", padding: "20px 0" }}><Upload size={20} style={{ color: C.textTertiary, opacity: 0.4, marginBottom: 8 }} /><p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, margin: 0, lineHeight: 1.5 }}>No context loaded yet.</p></div>)}
            {["csv", "text", "image"].map(type => {
              const items = contextByType[type]; if (items.length === 0) return null; const cfg = typeConfig[type]; const TypeIcon = cfg.icon;
              return (<div key={type}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><TypeIcon size={13} style={{ color: cfg.color }} /><span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span><span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>({items.length})</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {items.map(item => (<div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: C.bgPrimary, borderRadius: 6, border: `1px solid ${C.borderDefault}` }}>
                    {type === "image" && item.content && <img src={item.content} alt={item.label} style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textPrimary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>{item.source !== "manual" && <span style={{ textTransform: "capitalize" }}>{item.source} · </span>}{item.metadata?.rows != null && `${item.metadata.rows} rows · `}{item.metadata?.words != null && `${item.metadata.words} words · `}{item.metadata?.size || ""}</div></div>
                    <button onClick={() => deleteContextItem(item.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: C.textTertiary, display: "flex", opacity: 0.4 }} onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}><Trash2 size={12} /></button>
                  </div>))}
                </div>
              </div>);
            })}
          </div>
        </div>
      )}
    </div>
  );
}
