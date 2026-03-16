import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckSquare, Plus, Check, Calendar, Sparkles, ArrowRight, RefreshCw, Briefcase, Trash2 } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { renewalStore } from "../lib/storage";
import { callAI } from "../lib/ai";
import { PageLayout } from "../components/layout/PageLayout";
import { Btn, Modal, FormField, Input } from "../components/ui/index";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "account", label: "Account Actions" },
  { id: "portfolio", label: "Portfolio Ops" },
];

const PRIORITY_COLORS = { high: C.red, medium: C.amber, low: C.green };

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(() => renewalStore.getTaskItems());
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showCreate, setShowCreate] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(null);
  const [aiOutput, setAiOutput] = useState({});
  const accounts = renewalStore.getAccounts();

  const filtered = tasks.filter(t => {
    if (filter !== "all" && t.type !== filter) return false;
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
    if (a.dueDate && b.dueDate) {
      const diff = new Date(a.dueDate) - new Date(b.dueDate);
      if (diff !== 0) return diff;
    }
    return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
  });

  function updateTask(id, updates) {
    renewalStore.updateTaskItem(id, updates);
    setTasks(renewalStore.getTaskItems());
  }

  function deleteTask(id) {
    renewalStore.deleteTaskItem(id);
    setTasks(renewalStore.getTaskItems());
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
      const portfolioContext = accounts.map(a => ({
        name: a.name, arr: a.arr, renewalDate: a.renewalDate, riskLevel: a.riskLevel,
      }));
      const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

      let contextStr = "";
      if (task.type === "account" && task.accountId) {
        const acct = accounts.find(a => a.id === task.accountId);
        const ctx = acct ? renewalStore.getContext(acct.id) : [];
        contextStr = `\nTARGET ACCOUNT: ${task.accountName} | ARR: $${acct?.arr?.toLocaleString() || 0} | Risk: ${acct?.riskLevel || "unknown"} | Renewal: ${acct?.renewalDate || "not set"}\nContext items: ${ctx.length}`;
      }

      const prompt = `You are BC, an AI-powered renewal operations co-pilot. Help execute this task.

TASK: "${task.title}"
TYPE: ${task.type === "account" ? "Account Action" : "Portfolio Operation"}
${contextStr}

PORTFOLIO (${accounts.length} accounts, $${accounts.reduce((s, a) => s + (a.arr || 0), 0).toLocaleString()} total ARR):
${JSON.stringify(portfolioContext)}

TODAY: ${today}

Generate a complete, ready-to-use output for this task. If it's an exec summary, write the summary. If it's a forecast compilation, compile it. If it's an account follow-up, draft the email. Be specific, use real data, and make it actionable.

Format with markdown. Be concise but thorough.`;

      const response = await callAI([{ role: "user", content: prompt }], undefined, 3000);
      const text = String(response).trim();
      setAiOutput(prev => ({ ...prev, [task.id]: text }));
      updateTask(task.id, { aiOutput: text });
    } catch (err) {
      setAiOutput(prev => ({ ...prev, [task.id]: `**Error:** ${err.message}` }));
    } finally {
      setAiDrafting(null);
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
  }

  const activeCount = tasks.filter(t => t.status !== "complete").length;
  const overdueCount = tasks.filter(t => t.status !== "complete" && t.dueDate && new Date(t.dueDate) < new Date()).length;

  return (
    <PageLayout maxWidth={1000}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: FONT_SANS, fontSize: "var(--bc-heading-size, 24px)", fontWeight: 700, color: C.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>Tasks</h1>
          <p className="bc-hide-mobile" style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, margin: "4px 0 0" }}>
            Account actions and portfolio operations
            {activeCount > 0 && <span> · <span style={{ color: C.textSecondary }}>{activeCount} active</span></span>}
            {overdueCount > 0 && <span> · <span style={{ color: C.red }}>{overdueCount} overdue</span></span>}
          </p>
        </div>
        <Btn variant="primary" onClick={() => setShowCreate(true)} size="sm"><Plus size={14} /> New Task</Btn>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: C.bgCard, borderRadius: 8, padding: 3, border: `1px solid ${C.borderDefault}` }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              background: filter === f.id ? "rgba(255,255,255,0.1)" : "transparent",
              color: filter === f.id ? C.textPrimary : C.textTertiary,
              fontFamily: FONT_SANS, fontSize: 13, fontWeight: filter === f.id ? 600 : 500,
              transition: "all 0.15s",
            }}>{f.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, background: C.bgCard, borderRadius: 8, padding: 3, border: `1px solid ${C.borderDefault}` }}>
          {[
            { id: "active", label: "Active" },
            { id: "complete", label: "Done" },
            { id: "all", label: "All" },
          ].map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)} style={{
              padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              background: statusFilter === f.id ? "rgba(255,255,255,0.1)" : "transparent",
              color: statusFilter === f.id ? C.textPrimary : C.textTertiary,
              fontFamily: FONT_SANS, fontSize: 13, fontWeight: statusFilter === f.id ? 600 : 500,
              transition: "all 0.15s",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {tasks.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center", padding: "40px 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${C.goldMuted}, ${C.aiBlueMuted})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckSquare size={32} style={{ color: C.gold }} />
          </div>
          <div>
            <h2 style={{ fontFamily: FONT_SANS, fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px" }}>Your Renewal Task Center</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, maxWidth: 480, lineHeight: 1.6, margin: "0 auto" }}>
              Track account actions and portfolio operations in one place. Create tasks manually, or approve Autopilot actions to add them here automatically.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn variant="primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create a Task</Btn>
            <Btn variant="ghost" onClick={() => navigate("/app/autopilot")}><Sparkles size={14} /> Go to Autopilot</Btn>
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.textTertiary, fontFamily: FONT_BODY, fontSize: 14 }}>
          No tasks match this filter.
        </div>
      ) : (
        /* Task List */
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map(task => {
            const isOverdue = task.status !== "complete" && task.dueDate && new Date(task.dueDate) < new Date();
            const daysUntil = task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / 86400000) : null;
            const hasAiOutput = aiOutput[task.id] || task.aiOutput;
            const isDrafting = aiDrafting === task.id;

            return (
              <div key={task.id} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                borderRadius: 12, overflow: "hidden",
                opacity: task.status === "complete" ? 0.6 : 1,
                transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
                  {/* Status toggle */}
                  <button onClick={() => cycleStatus(task)} style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                    border: `2px solid ${task.status === "complete" ? C.green : task.status === "in_progress" ? C.aiBlue : C.borderSubtle}`,
                    background: task.status === "complete" ? C.green + "20" : task.status === "in_progress" ? C.aiBlue + "15" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {task.status === "complete" && <Check size={12} style={{ color: C.green }} />}
                    {task.status === "in_progress" && <div style={{ width: 8, height: 8, borderRadius: 2, background: C.aiBlue }} />}
                  </button>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary,
                        textDecoration: task.status === "complete" ? "line-through" : "none",
                      }}>{task.title}</span>

                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                        textTransform: "uppercase", padding: "2px 6px", borderRadius: 3,
                        color: task.type === "portfolio" ? C.gold : C.aiBlue,
                        background: task.type === "portfolio" ? C.goldMuted : C.aiBlueMuted,
                      }}>{task.type === "portfolio" ? "Portfolio" : "Account"}</span>

                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: PRIORITY_COLORS[task.priority] || C.textTertiary,
                        flexShrink: 0,
                      }} title={`${task.priority} priority`} />

                      {task.recurrence && task.recurrence !== "none" && (
                        <span style={{
                          fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary,
                          display: "flex", alignItems: "center", gap: 3,
                        }}>
                          <RefreshCw size={10} /> {task.recurrence}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                      {task.accountName && (
                        <button
                          onClick={() => navigate("/app/accounts", { state: { accountId: task.accountId } })}
                          style={{
                            fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary,
                            background: "none", border: "none", cursor: "pointer", padding: 0,
                            textDecoration: "underline", textDecorationColor: C.borderDefault,
                          }}
                        >{task.accountName}</button>
                      )}
                      {task.dueDate && (
                        <span style={{
                          fontFamily: FONT_MONO, fontSize: 11, display: "flex", alignItems: "center", gap: 4,
                          color: isOverdue ? C.red : daysUntil <= 3 ? C.amber : C.textTertiary,
                        }}>
                          <Calendar size={10} />
                          {isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Today" : `${daysUntil}d`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => aiDraft(task)}
                      disabled={isDrafting}
                      title="AI Draft"
                      style={{
                        padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.borderDefault}`,
                        background: isDrafting ? C.aiBlueMuted : "transparent",
                        color: isDrafting ? C.aiBlue : C.textTertiary,
                        fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500,
                        cursor: isDrafting ? "wait" : "pointer",
                        display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                      }}
                    >
                      <Sparkles size={12} style={{ animation: isDrafting ? "aiPulse 2s ease-in-out infinite" : "none" }} />
                      {isDrafting ? "Drafting..." : "AI Draft"}
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      title="Delete"
                      style={{
                        padding: "6px", borderRadius: 6, border: "none",
                        background: "transparent", color: C.textTertiary,
                        cursor: "pointer", display: "flex", opacity: 0.4,
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {hasAiOutput && (
                  <div style={{
                    padding: "14px 18px", borderTop: `1px solid ${C.borderDefault}`,
                    background: C.bgAI,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <Sparkles size={12} style={{ color: C.aiBlue }} />
                      <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.aiBlue }}>AI Draft</span>
                      <button
                        onClick={() => handleCopy(hasAiOutput)}
                        style={{
                          marginLeft: "auto", padding: "3px 10px", borderRadius: 4,
                          border: `1px solid ${C.borderDefault}`, background: "transparent",
                          color: C.textTertiary, fontFamily: FONT_MONO, fontSize: 11,
                          cursor: "pointer",
                        }}
                      >Copy</button>
                    </div>
                    <div style={{
                      fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary,
                      lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto",
                    }}>
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
        <CreateTaskModal
          accounts={accounts}
          onClose={() => setShowCreate(false)}
          onCreate={(task) => {
            renewalStore.saveTaskItem(task);
            setTasks(renewalStore.getTaskItems());
            setShowCreate(false);
          }}
        />
      )}
    </PageLayout>
  );
}

function CreateTaskModal({ accounts, onClose, onCreate }) {
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
      title: title.trim(),
      type,
      accountId: type === "account" ? accountId : null,
      accountName: type === "account" ? selectedAccount?.name || "" : null,
      status: "pending",
      dueDate: dueDate || null,
      recurrence: type === "portfolio" ? recurrence : "none",
      priority,
      aiOutput: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    onCreate(task);
  }

  return (
    <Modal title="New Task" onClose={onClose} width={520}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "account", label: "Account Action", desc: "Tied to a specific account" },
          { id: "portfolio", label: "Portfolio Op", desc: "Renewal org operations" },
        ].map(t => (
          <button key={t.id} onClick={() => setType(t.id)} style={{
            flex: 1, padding: "14px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
            border: `1px solid ${type === t.id ? C.gold + "60" : C.borderDefault}`,
            background: type === t.id ? C.goldMuted : "transparent",
            transition: "all 0.15s",
          }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: type === t.id ? C.textPrimary : C.textSecondary, marginBottom: 2 }}>{t.label}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>{t.desc}</div>
          </button>
        ))}
      </div>

      <FormField label="Task" required>
        <Input
          value={title}
          onChange={setTitle}
          placeholder={type === "portfolio" ? "e.g., Compile Q1 forecast, Send weekly exec summary" : "e.g., Schedule renewal call, Send proposal"}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />
      </FormField>

      {type === "account" && (
        <FormField label="Account" required>
          <select
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              color: accountId ? C.textPrimary : C.textTertiary,
              fontFamily: FONT_SANS, fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          >
            <option value="">Select an account</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} — ${(a.arr || 0).toLocaleString()}</option>
            ))}
          </select>
        </FormField>
      )}

      <div style={{ display: "grid", gridTemplateColumns: type === "portfolio" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12 }}>
        <FormField label="Priority">
          <div style={{ display: "flex", gap: 6 }}>
            {["low", "medium", "high"].map(level => (
              <button key={level} onClick={() => setPriority(level)} style={{
                flex: 1, padding: "8px 8px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${priority === level ? PRIORITY_COLORS[level] + "60" : C.borderDefault}`,
                background: priority === level ? PRIORITY_COLORS[level] + "14" : "transparent",
                color: priority === level ? PRIORITY_COLORS[level] : C.textSecondary,
                fontFamily: FONT_SANS, fontSize: 12, fontWeight: priority === level ? 600 : 500,
                textTransform: "capitalize",
              }}>{level}</button>
            ))}
          </div>
        </FormField>

        <FormField label="Due Date">
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 14,
              outline: "none", colorScheme: "dark", boxSizing: "border-box",
            }}
          />
        </FormField>

        {type === "portfolio" && (
          <FormField label="Recurrence">
            <select
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14,
                outline: "none", boxSizing: "border-box",
              }}
            >
              <option value="none">None</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </FormField>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn
          variant="primary"
          onClick={handleSubmit}
          disabled={!title.trim() || (type === "account" && !accountId)}
        >
          Create Task
        </Btn>
      </div>
    </Modal>
  );
}
