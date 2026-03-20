import { useState } from "react";
import {
  Plus, Check, Calendar, Sparkles, ArrowRight, RefreshCw,
  Trash2, Lightbulb, X,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { renewalStore } from "../../lib/storage";
import { callAI } from "../../lib/ai";
import { Btn, Modal, FormField, Input } from "../../components/ui/index";
import { getPillarRecommendations } from "../../lib/pillars";

const PRIORITY_COLORS = { high: C.red, medium: C.amber, low: C.green, critical: C.red };

// ─── Persona-Based Task Suggestions ─────────────────────────────────────────
const SUGGESTIONS = {
  specialist: [
    { title: "Prep for your next upcoming renewal call", desc: "AI drafts a prep brief with account context, risk signals, and talking points", type: "account", priority: "high" },
    { title: "Draft renewal outreach for accounts due in 30 days", desc: "Personalized emails for each upcoming renewal", type: "account", priority: "high" },
    { title: "Review and update account health notes", desc: "Summarize recent activity and flag gaps in your accounts", type: "account", priority: "medium" },
    { title: "Build a save strategy for at-risk accounts", desc: "AI generates a tactical save plan with specific steps", type: "account", priority: "high" },
    { title: "Identify accounts missing key contacts", desc: "Scan your portfolio for stakeholder gaps", type: "strategic", priority: "medium" },
    { title: "Summarize last quarter's renewal outcomes", desc: "Win/loss analysis with patterns and learnings", type: "strategic", priority: "low" },
  ],
  director: [
    { title: "Compile weekly renewal forecast update", desc: "AI generates a forecast summary from your current portfolio data", type: "strategic", priority: "high" },
    { title: "Conduct quarterly churn analysis", desc: "Analyze churn patterns, root causes, and trends across your book", type: "strategic", priority: "medium" },
    { title: "Deep dive into top 10 ARR accounts", desc: "Strategic brief per account with risk and opportunity analysis", type: "strategic", priority: "high" },
    { title: "Build board-ready retention narrative", desc: "Draft a board paragraph with GRR/NRR metrics and narrative", type: "strategic", priority: "medium" },
    { title: "Create QBR prep materials", desc: "AI generates QBR content with data points from your portfolio", type: "strategic", priority: "medium" },
    { title: "Send weekly executive summary", desc: "Draft an exec summary from current portfolio state", type: "strategic", priority: "high", recurrence: "weekly" },
  ],
  revenue_leader: [
    { title: "Identify accounts needing exec alignment", desc: "Flag accounts where executive sponsor engagement is critical", type: "strategic", priority: "high" },
    { title: "Build renewal pipeline summary for leadership", desc: "Pipeline report with confidence tiers and risk callouts", type: "strategic", priority: "high" },
    { title: "Analyze workload across renewal portfolio", desc: "Account distribution and capacity gaps analysis", type: "strategic", priority: "medium" },
    { title: "Create expansion playbook for top accounts", desc: "AI generates upsell strategies per account", type: "account", priority: "medium" },
    { title: "Review forecast accuracy vs last quarter", desc: "Compare predicted vs actual renewal outcomes", type: "strategic", priority: "low" },
  ],
  founder: [
    { title: "Review your top 3 accounts by ARR", desc: "AI brief on your most important renewals with risk and actions", type: "strategic", priority: "high" },
    { title: "Build a renewal calendar for the quarter", desc: "Timeline view of upcoming renewals with key dates", type: "strategic", priority: "medium" },
    { title: "Identify your riskiest renewal this month", desc: "Deep dive on your highest-risk account with save strategy", type: "account", priority: "high" },
    { title: "Generate investor-ready retention metrics", desc: "GRR/NRR with narrative formatted for board or investors", type: "strategic", priority: "medium" },
  ],
  revops: [
    { title: "Audit account data completeness", desc: "Identify missing fields across your portfolio", type: "strategic", priority: "medium" },
    { title: "Identify accounts missing renewal dates", desc: "List all accounts with data gaps that affect forecasting", type: "strategic", priority: "high" },
    { title: "Run a duplicate account check", desc: "Find potential duplicates by name similarity", type: "strategic", priority: "low" },
    { title: "Standardize risk level assessment", desc: "AI re-evaluates risk levels based on available context", type: "strategic", priority: "medium" },
    { title: "Generate data quality report", desc: "Portfolio data health score with specific recommendations", type: "strategic", priority: "medium" },
  ],
};

const DEFAULT_SUGGESTIONS = [
  { title: "Review your upcoming renewals", desc: "AI analyzes accounts due in the next 30 days with risk and actions", type: "strategic", priority: "high" },
  { title: "Compile a renewal forecast", desc: "AI generates a forecast summary from your portfolio data", type: "strategic", priority: "high" },
  { title: "Draft outreach for your next renewal", desc: "AI writes a personalized renewal email for your soonest account", type: "account", priority: "medium" },
  { title: "Build a portfolio health summary", desc: "Overview of retention risk, expansion signals, and key metrics", type: "strategic", priority: "medium" },
];

export default function MyActions({ tasks, setTasks, accounts, persona, navigate, isMobile }) {
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showCreate, setShowCreate] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(null);
  const [aiOutput, setAiOutput] = useState({});
  const [dismissedSuggestions, setDismissedSuggestions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bc2-dismissed-suggestions") || "[]"); } catch { return []; }
  });

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "account", label: "Account Actions" },
    { id: "strategic", label: "Strategic" },
  ];

  const allSuggestions = persona ? (SUGGESTIONS[persona] || DEFAULT_SUGGESTIONS) : DEFAULT_SUGGESTIONS;
  const existingTitles = tasks.map(t => t.title.toLowerCase());
  const visibleSuggestions = allSuggestions
    .filter(s => !dismissedSuggestions.includes(s.title))
    .filter(s => !existingTitles.includes(s.title.toLowerCase()))
    .slice(0, 4);

  function dismissSuggestion(title) {
    const updated = [...dismissedSuggestions, title];
    setDismissedSuggestions(updated);
    localStorage.setItem("bc2-dismissed-suggestions", JSON.stringify(updated));
  }

  async function createFromSuggestion(suggestion) {
    const task = {
      id: `task-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: suggestion.title, type: suggestion.type === "strategic" ? "strategic" : "account",
      accountId: null, accountName: null, status: "pending", dueDate: null,
      recurrence: suggestion.recurrence || "none", priority: suggestion.priority || "medium",
      aiOutput: null, createdAt: new Date().toISOString(), completedAt: null,
    };
    await renewalStore.saveTaskItem(task);
    setTasks(await renewalStore.getTaskItems());
    aiDraft(task);
  }

  const filtered = tasks.filter(t => {
    const typeMatch = filter === "all" || t.type === filter || (filter === "strategic" && t.type === "portfolio");
    if (!typeMatch) return false;
    if (statusFilter === "active" && t.status === "complete") return false;
    if (statusFilter === "complete" && t.status !== "complete") return false;
    return true;
  });

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const statusOrder = { pending: 0, in_progress: 1, complete: 2 };
  const sorted = [...filtered].sort((a, b) => {
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate) { const diff = new Date(a.dueDate) - new Date(b.dueDate); if (diff !== 0) return diff; }
    return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
  });

  async function updateTask(id, updates) {
    await renewalStore.updateTaskItem(id, updates);
    setTasks(await renewalStore.getTaskItems());
  }
  async function deleteTask(id) {
    await renewalStore.deleteTaskItem(id);
    setTasks(await renewalStore.getTaskItems());
  }
  function cycleStatus(task) {
    const next = { pending: "in_progress", in_progress: "complete", complete: "pending" };
    const updates = { status: next[task.status] };
    if (next[task.status] === "complete") updates.completedAt = new Date().toISOString();
    else updates.completedAt = null;
    updateTask(task.id, updates);
  }

  async function aiDraft(task) {
    setAiDrafting(task.id);
    try {
      const portfolioContext = accounts.map(a => ({ name: a.name, arr: a.arr, renewalDate: a.renewalDate, riskLevel: a.riskLevel }));
      const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      let contextStr = "";
      if (task.type === "account" && task.accountId) {
        const acct = accounts.find(a => a.id === task.accountId);
        const ctx = acct ? await renewalStore.getContext(acct.id) : [];
        contextStr = `\nTARGET ACCOUNT: ${task.accountName} | ARR: $${acct?.arr?.toLocaleString() || 0} | Risk: ${acct?.riskLevel || "unknown"} | Renewal: ${acct?.renewalDate || "not set"}\nContext items: ${ctx.length}`;
      }
      const prompt = `You are BC, an AI-powered renewal operations co-pilot. Help execute this task.\n\nTASK: "${task.title}"\nTYPE: ${task.type === "account" ? "Account Action" : "Strategic Task"}${contextStr}\n\nPORTFOLIO (${accounts.length} accounts, $${accounts.reduce((s, a) => s + (a.arr || 0), 0).toLocaleString()} total ARR):\n${JSON.stringify(portfolioContext)}\n\nTODAY: ${today}\n\nGenerate a complete, ready-to-use output for this task. Be specific, use real data, and make it actionable. Format with markdown. Be concise but thorough.`;
      const response = await callAI([{ role: "user", content: prompt }], undefined, 3000);
      const text = String(response).trim();
      setAiOutput(prev => ({ ...prev, [task.id]: text }));
      updateTask(task.id, { aiOutput: text });
    } catch (err) {
      setAiOutput(prev => ({ ...prev, [task.id]: `**Error:** ${err.message}` }));
    } finally { setAiDrafting(null); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Btn variant="primary" onClick={() => setShowCreate(true)} size="sm"><Plus size={14} /> New Task</Btn>
      </div>

      {/* Pillar-aware recommendations */}
      {accounts.length > 0 && (() => {
        const pillarRecs = getPillarRecommendations(accounts).slice(0, 4);
        if (pillarRecs.length === 0 && visibleSuggestions.length === 0) return null;
        return (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Lightbulb size={16} style={{ color: C.gold }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.gold }}>
                {pillarRecs.length > 0 ? "Your AI engine recommends" : "Suggested for you"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
              {pillarRecs.map((rec, i) => {
                const PIcon = rec.pillar.icon;
                return (
                  <div key={`pillar-${i}`} style={{
                    background: C.bgCard, border: `1px solid ${rec.pillar.color}20`, borderRadius: 10,
                    padding: isMobile ? "12px 14px" : "14px 16px", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = rec.pillar.color + "40"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = rec.pillar.color + "20"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <PIcon size={12} style={{ color: rec.pillar.color }} />
                      <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600, color: rec.pillar.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{rec.pillar.label}</span>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: rec.priority === "high" ? C.red : rec.priority === "medium" ? C.amber : C.textTertiary, marginLeft: "auto" }} />
                    </div>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{rec.title}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5, marginBottom: 12 }}>{rec.desc}</div>
                    <button onClick={() => navigate(rec.route)} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6,
                      background: rec.pillar.color + "14", border: `1px solid ${rec.pillar.color}30`,
                      color: rec.pillar.color, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}><PIcon size={12} /> Go to {rec.pillar.label} <ArrowRight size={10} /></button>
                  </div>
                );
              })}
              {pillarRecs.length === 0 && visibleSuggestions.map((suggestion, i) => (
                <div key={`sug-${i}`} style={{ background: C.bgCard, border: `1px solid ${C.gold}15`, borderRadius: 10, padding: isMobile ? "12px 14px" : "14px 16px", position: "relative", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold + "40"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.gold + "15"; }}>
                  <button onClick={() => dismissSuggestion(suggestion.title)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: C.textTertiary, cursor: "pointer", padding: 2, opacity: 0.3, display: "flex" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "0.3"}><X size={12} /></button>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 4, paddingRight: 20 }}>{suggestion.title}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5, marginBottom: 12 }}>{suggestion.desc}</div>
                  <button onClick={() => createFromSuggestion(suggestion)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6,
                    background: C.goldMuted, border: `1px solid ${C.gold}30`, color: C.gold,
                    fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}><Sparkles size={12} /> Let AI do this</button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: isMobile ? 14 : 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: C.bgCard, borderRadius: 8, padding: 3, border: `1px solid ${C.borderDefault}` }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              background: filter === f.id ? "rgba(0,0,0,0.06)" : "transparent",
              color: filter === f.id ? C.textPrimary : C.textTertiary,
              fontFamily: FONT_SANS, fontSize: 13, fontWeight: filter === f.id ? 600 : 500,
            }}>{f.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, background: C.bgCard, borderRadius: 8, padding: 3, border: `1px solid ${C.borderDefault}` }}>
          {[{ id: "active", label: "Active" }, { id: "complete", label: "Done" }, { id: "all", label: "All" }].map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)} style={{
              padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              background: statusFilter === f.id ? "rgba(0,0,0,0.06)" : "transparent",
              color: statusFilter === f.id ? C.textPrimary : C.textTertiary,
              fontFamily: FONT_SANS, fontSize: 13, fontWeight: statusFilter === f.id ? 600 : 500,
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.textTertiary, fontFamily: FONT_BODY, fontSize: 14 }}>
          {tasks.length === 0 ? "No tasks yet. Create one or pick a suggestion above." : "No tasks match this filter."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map(task => {
            const isOverdue = task.status !== "complete" && task.dueDate && new Date(task.dueDate) < new Date();
            const daysUntil = task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / 86400000) : null;
            const hasAiOutput = aiOutput[task.id] || task.aiOutput;
            const isDrafting = aiDrafting === task.id;
            const taskTypeLabel = (task.type === "strategic" || task.type === "portfolio") ? "Strategic" : "Account";
            const taskTypeColor = (task.type === "strategic" || task.type === "portfolio") ? C.gold : C.aiBlue;
            const taskTypeBg = (task.type === "strategic" || task.type === "portfolio") ? C.goldMuted : C.aiBlueMuted;

            return (
              <div key={task.id} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                borderRadius: 12, overflow: "hidden", opacity: task.status === "complete" ? 0.6 : 1,
              }}>
                <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 10 : 12, padding: isMobile ? "12px 14px" : "14px 18px", flexWrap: isMobile ? "wrap" : undefined }}>
                  <button onClick={() => cycleStatus(task)} style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                    border: `2px solid ${task.status === "complete" ? C.green : task.status === "in_progress" ? C.aiBlue : C.borderSubtle}`,
                    background: task.status === "complete" ? C.green + "20" : task.status === "in_progress" ? C.aiBlue + "15" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {task.status === "complete" && <Check size={12} style={{ color: C.green }} />}
                    {task.status === "in_progress" && <div style={{ width: 8, height: 8, borderRadius: 2, background: C.aiBlue }} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, textDecoration: task.status === "complete" ? "line-through" : "none" }}>{task.title}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, color: taskTypeColor, background: taskTypeBg, letterSpacing: "0.04em" }}>{taskTypeLabel}</span>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIORITY_COLORS[task.priority] || C.textTertiary }} title={`${task.priority} priority`} />
                      {task.recurrence && task.recurrence !== "none" && (
                        <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.textTertiary, display: "flex", alignItems: "center", gap: 3 }}>
                          <RefreshCw size={10} /> {task.recurrence}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                      {task.accountName && (
                        <button onClick={() => navigate("/app/accounts", { state: { accountId: task.accountId } })} style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", textDecorationColor: C.borderDefault }}>{task.accountName}</button>
                      )}
                      {task.dueDate && (
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, display: "flex", alignItems: "center", gap: 4, color: isOverdue ? C.red : daysUntil <= 3 ? C.amber : C.textTertiary }}>
                          <Calendar size={10} /> {isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Today" : `${daysUntil}d`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => aiDraft(task)} disabled={isDrafting} title="AI Draft" style={{
                      padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.borderDefault}`,
                      background: isDrafting ? C.aiBlueMuted : "transparent", color: isDrafting ? C.aiBlue : C.textTertiary,
                      fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, cursor: isDrafting ? "wait" : "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <Sparkles size={12} style={{ animation: isDrafting ? "aiPulse 2s ease-in-out infinite" : "none" }} />
                      {isDrafting ? "Drafting..." : "AI Draft"}
                    </button>
                    <button onClick={() => deleteTask(task.id)} title="Delete" style={{ padding: "6px", borderRadius: 6, border: "none", background: "transparent", color: C.textTertiary, cursor: "pointer", display: "flex", opacity: 0.4 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}><Trash2 size={14} /></button>
                  </div>
                </div>
                {hasAiOutput && (
                  <div style={{ padding: isMobile ? "12px 14px" : "14px 18px", borderTop: `1px solid ${C.borderDefault}`, background: C.bgAI }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <Sparkles size={12} style={{ color: C.aiBlue }} />
                      <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.aiBlue }}>AI Draft</span>
                      <button onClick={() => navigator.clipboard.writeText(aiOutput[task.id] || task.aiOutput)} style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 4, border: `1px solid ${C.borderDefault}`, background: "transparent", color: C.textTertiary, fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer" }}>Copy</button>
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto" }}>
                      {aiOutput[task.id] || task.aiOutput}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateTaskModal accounts={accounts} isMobile={isMobile} onClose={() => setShowCreate(false)} onCreate={async (task) => {
          await renewalStore.saveTaskItem(task);
          setTasks(await renewalStore.getTaskItems());
          setShowCreate(false);
        }} />
      )}
    </div>
  );
}

// ─── Create Task Modal ──────────────────────────────────────────────────────
function CreateTaskModal({ accounts, isMobile, onClose, onCreate }) {
  const [type, setType] = useState("account");
  const [title, setTitle] = useState("");
  const [accountId, setAccountId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState("none");

  const selectedAccount = accountId ? accounts.find(a => a.id === accountId) : null;

  function handleSubmit() {
    if (!title.trim()) return;
    if (type === "account" && !accountId) return;
    const task = {
      id: `task-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(), type,
      accountId: type === "account" ? accountId : null,
      accountName: type === "account" ? selectedAccount?.name || "" : null,
      status: "pending", dueDate: dueDate || null,
      recurrence: type === "strategic" ? recurrence : "none",
      priority, aiOutput: null,
      createdAt: new Date().toISOString(), completedAt: null,
    };
    onCreate(task);
  }

  return (
    <Modal title="New Task" onClose={onClose} width={isMobile ? "calc(100vw - 32px)" : 520}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexDirection: isMobile ? "column" : "row" }}>
        {[
          { id: "account", label: "Account Action", desc: "Tied to a specific account" },
          { id: "strategic", label: "Strategic", desc: "Portfolio-level renewal work" },
        ].map(t => (
          <button key={t.id} onClick={() => setType(t.id)} style={{
            flex: 1, padding: isMobile ? "12px 14px" : "14px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
            border: `1px solid ${type === t.id ? C.gold + "60" : C.borderDefault}`,
            background: type === t.id ? C.goldMuted : "transparent",
          }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: type === t.id ? C.textPrimary : C.textSecondary, marginBottom: 2 }}>{t.label}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>{t.desc}</div>
          </button>
        ))}
      </div>
      <FormField label="Task" required>
        <Input value={title} onChange={setTitle}
          placeholder={type === "strategic" ? "e.g., Compile Q1 forecast, Send weekly exec summary" : "e.g., Schedule renewal call, Send proposal"}
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />
      </FormField>
      {type === "account" && (
        <FormField label="Account" required>
          <select value={accountId} onChange={e => setAccountId(e.target.value)} style={{
            width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgCard,
            border: `1px solid ${C.borderDefault}`, color: accountId ? C.textPrimary : C.textTertiary,
            fontFamily: FONT_SANS, fontSize: 14, outline: "none", boxSizing: "border-box",
          }}>
            <option value="">Select an account</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — ${(a.arr || 0).toLocaleString()}</option>)}
          </select>
        </FormField>
      )}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : (type === "strategic" ? "1fr 1fr 1fr" : "1fr 1fr"), gap: 12 }}>
        <FormField label="Priority">
          <div style={{ display: "flex", gap: 6 }}>
            {["low", "medium", "high"].map(level => (
              <button key={level} onClick={() => setPriority(level)} style={{
                flex: 1, padding: "8px", borderRadius: 6, cursor: "pointer", textTransform: "capitalize",
                border: `1px solid ${priority === level ? PRIORITY_COLORS[level] + "60" : C.borderDefault}`,
                background: priority === level ? PRIORITY_COLORS[level] + "14" : "transparent",
                color: priority === level ? PRIORITY_COLORS[level] : C.textSecondary,
                fontFamily: FONT_SANS, fontSize: 12, fontWeight: priority === level ? 600 : 500,
              }}>{level}</button>
            ))}
          </div>
        </FormField>
        <FormField label="Due Date">
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{
            width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgCard,
            border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_SANS,
            fontSize: 14, outline: "none", colorScheme: "dark", boxSizing: "border-box",
          }} />
        </FormField>
        {type === "strategic" && (
          <FormField label="Recurrence">
            <select value={recurrence} onChange={e => setRecurrence(e.target.value)} style={{
              width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgCard,
              border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_SANS,
              fontSize: 14, outline: "none", boxSizing: "border-box",
            }}>
              <option value="none">None</option><option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
            </select>
          </FormField>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={!title.trim() || (type === "account" && !accountId)}>Create Task</Btn>
      </div>
    </Modal>
  );
}
