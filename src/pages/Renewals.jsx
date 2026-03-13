import { useState, useEffect, useRef } from "react";
import { Compass, MessageSquare, LineChart, BookOpen, BarChart3, Sparkles, Plus, Send, X, ChevronDown, ArrowRight, AlertTriangle, Zap, FileText, Type, Image, Upload, Trash2, Eye, Check } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { renewalStore, store } from "../lib/storage";
import { callAI } from "../lib/ai";
import { safeParse, fmtRelative } from "../lib/utils";
import { Badge, Btn, Input, Modal, FormField, renderMarkdown } from "../components/ui/index";

const RENEWALS_SECTIONS = [
  { id: "guidance", icon: Compass, label: "Guidance", agent: "Orchestration Agent" },
  { id: "accounts", icon: MessageSquare, label: "Accounts", agent: "Account Intelligence Agent" },
  { id: "forecast", icon: LineChart, label: "Forecast", agent: "Forecast Intelligence Agent" },
  { id: "knowledge", icon: BookOpen, label: "Knowledge Base", agent: "Enablement Agent" },
  { id: "metrics", icon: BarChart3, label: "Metrics", agent: "Performance Agent" },
];

export default function Renewals() {
  const [activeSection, setActiveSection] = useState("guidance");
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

      {activeSection === "guidance" && <RenewalsGuidance accounts={accounts} onNavigate={handleNavigateToAccount} />}
      {activeSection === "accounts" && <RenewalsAccountsView accounts={accounts} selectedAccount={selectedAccount} onSelectAccount={setSelectedAccountId} onAddAccount={() => setShowAddAccount(true)} />}
      {activeSection === "forecast" && <Placeholder icon={LineChart} title="Forecast" agent="Forecast Intelligence Agent" description="Quarterly churn and retention forecast. Upload data, track WoW changes, generate executive briefs." />}
      {activeSection === "knowledge" && <Placeholder icon={BookOpen} title="Knowledge Base" agent="Enablement Agent" description="Searchable repository of renewal documentation. Ask questions, get sourced answers." />}
      {activeSection === "metrics" && <Placeholder icon={BarChart3} title="Metrics" agent="Performance Agent" description="KPI tracking with AI interpretation. Upload data, get performance insights." />}

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

// ─── Guidance (Orchestration Agent) ──────────────────────────────────────────
function RenewalsGuidance({ accounts, onNavigate }) {
  const CACHE_KEY = `bc2-${store._ws}-renewals-guidance`;
  const [briefing, setBriefing] = useState(() => safeParse(localStorage.getItem(CACHE_KEY), null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const now = new Date();
  const totalARR = accounts.reduce((sum, a) => sum + (a.arr || 0), 0);
  const atRiskARR = accounts.filter(a => a.riskLevel === "high").reduce((sum, a) => sum + (a.arr || 0), 0);
  const due30 = accounts.filter(a => { const d = new Date(a.renewalDate); const diff = (d - now) / 86400000; return diff >= 0 && diff <= 30; }).length;
  const due60 = accounts.filter(a => { const d = new Date(a.renewalDate); const diff = (d - now) / 86400000; return diff > 30 && diff <= 60; }).length;
  const due90 = accounts.filter(a => { const d = new Date(a.renewalDate); const diff = (d - now) / 86400000; return diff > 60 && diff <= 90; }).length;
  const fmt$ = (n) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  const cachedAgo = briefing?._generatedAt ? (() => { const m = Math.floor((Date.now() - briefing._generatedAt) / 60000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`; })() : null;

  async function generateBriefing() {
    if (accounts.length === 0) return; setLoading(true); setError(null);
    try {
      const portfolioData = accounts.map(a => { const daysUntil = Math.ceil((new Date(a.renewalDate) - now) / 86400000); return { name: a.name, arr: a.arr, renewalDate: a.renewalDate, riskLevel: a.riskLevel, daysUntilRenewal: daysUntil, contextItems: renewalStore.getContext(a.id).length, activeThreads: renewalStore.getThreads(a.id).length, summary: a.summary || "", tags: a.tags || [] }; });
      const systemPrompt = `You analyze a renewal specialist's full portfolio and prioritize their day.\n\nPORTFOLIO DATA:\n${JSON.stringify(portfolioData)}\n\nTODAY: ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}\nSUMMARY: ${accounts.length} accounts, ${fmt$(totalARR)} total ARR, ${fmt$(atRiskARR)} at-risk, ${due30} due 30d, ${due60} due 60d, ${due90} due 90d.\n\nReturn ONLY valid JSON:\n{"summary":"2-3 sentences. Be direct, reference names and amounts.","priorities":[{"accountName":"Name","urgency":"critical|high|medium|opportunity","reasoning":"WHY this needs attention.","action":"WHAT to do.","daysUntilRenewal":30,"arr":187000}],"onTrack":["on-track account names"],"pendingDrafts":0}\n\nRULES: Order by urgency. Be specific. Flag data gaps.`;
      const response = await callAI([{ role: "user", content: "Generate my daily renewal briefing." }], systemPrompt, 3000);
      let text = String(response).trim(); if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text); parsed._generatedAt = Date.now(); setBriefing(parsed); localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  useEffect(() => { if (accounts.length > 0 && !briefing && !loading) generateBriefing(); }, [accounts.length]);

  if (accounts.length === 0) return (<Placeholder icon={Compass} title="Guidance" agent="Orchestration Agent" description="Add accounts to get AI-generated prioritization briefings." />);

  const urgencyColors = { critical: C.red, high: C.amber, medium: C.blue, opportunity: C.green };
  const urgencyLabels = { critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", opportunity: "OPPORTUNITY" };

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

      {/* AI Briefing */}
      <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.borderAI}`, borderLeft: `3px solid ${C.aiBlue}`, borderRadius: 12, padding: "22px 26px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${C.aiBlueGlow} 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, position: "relative" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.aiBlueMuted, border: `1px solid ${C.aiBlue}25`, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={12} color={C.aiBlue} /></div>
          <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Daily Briefing</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto" }}>Orchestration Agent</span>
          {cachedAgo && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>· {cachedAgo}</span>}
          <button onClick={generateBriefing} disabled={loading} style={{ background: loading ? C.aiBlueMuted : "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: loading ? "wait" : "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: loading ? C.aiBlue : C.textTertiary, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={11} style={{ animation: loading ? "aiPulse 2s ease-in-out infinite" : "none" }} />{loading ? "Analyzing..." : "Refresh"}
          </button>
        </div>
        {error && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 12 }}><AlertTriangle size={14} /> {error}</div>}
        {loading && !briefing ? (<div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.aiBlue, animation: "aiPulse 2s ease-in-out infinite" }} /><span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Analyzing your {accounts.length} accounts...</span></div>
        ) : briefing?.summary ? (<div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>{briefing.summary}</div>
        ) : (<div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Click Refresh to generate your daily briefing.</div>)}
        {briefing && <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.borderDefault}`, display: "flex", alignItems: "center", gap: 8 }}><FileText size={13} style={{ color: C.textTertiary }} /><span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{briefing.pendingDrafts || 0} pending drafts</span></div>}
      </div>

      {/* Priority Cards */}
      {briefing?.priorities?.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Today's Priorities</span><div style={{ flex: 1, height: 1, background: C.borderDefault }} /><span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{briefing.priorities.length} accounts</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {briefing.priorities.map((item, i) => {
              const color = urgencyColors[item.urgency] || C.textTertiary; const matchedAccount = accounts.find(a => a.name === item.accountName);
              return (
                <button key={i} onClick={() => matchedAccount && onNavigate(matchedAccount.id)} style={{ display: "flex", gap: 16, padding: "16px 20px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderLeft: `3px solid ${color}`, borderRadius: 10, cursor: matchedAccount ? "pointer" : "default", textAlign: "left", transition: "all 0.15s", width: "100%" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.background = C.bgCardHover; e.currentTarget.style.borderLeftColor = color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.background = C.bgCard; e.currentTarget.style.borderLeftColor = color; }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, minWidth: 48 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color, background: color + "18", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em" }}>{urgencyLabels[item.urgency]}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: C.textTertiary, opacity: 0.4 }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{item.accountName}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{fmt$(item.arr || 0)}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, marginLeft: "auto", color: (item.daysUntilRenewal || 999) <= 30 ? C.red : (item.daysUntilRenewal || 999) <= 60 ? C.amber : C.textTertiary }}>{item.daysUntilRenewal > 0 ? `${item.daysUntilRenewal}d` : item.daysUntilRenewal === 0 ? "Today" : `${Math.abs(item.daysUntilRenewal)}d overdue`}</span>
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginBottom: 6 }}>{item.reasoning}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Zap size={12} style={{ color: C.gold }} /><span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, fontWeight: 500 }}>{item.action}</span></div>
                  </div>
                  {matchedAccount && <ArrowRight size={16} style={{ color: C.textTertiary, flexShrink: 0, alignSelf: "center", opacity: 0.5 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* On-track */}
      {briefing?.onTrack?.length > 0 && (
        <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><Check size={14} style={{ color: C.green }} /><span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textSecondary }}>On Track</span></div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>{briefing.onTrack.join(" · ")}</div>
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
