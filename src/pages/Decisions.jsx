import { useState } from "react";
import { Diamond, Sparkles, PlusCircle } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, DECISION_STATUSES, DECISION_STATUS_LABELS, DECISION_TEMPLATES, TASK_STATUS_LABELS } from "../lib/tokens";
import { store } from "../lib/storage";
import { callAI, callAIForEntity, AI_ACTIONS } from "../lib/ai";
import { genId, isoNow, fmtRelative, statusColor, priorityColor } from "../lib/utils";
import { useEntityStore } from "../store/entityStore";
import { Badge, Btn, Input, Modal, FormField, AIPanel, EmptyState, ProjectFilterPills, useProjectLinks, filterByProject } from "../components/ui/index";

export default function Decisions() {
  const { decisions, setDecisions, tasks, setTasks, priorities, projects, ingestSessions } = useEntityStore();
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filterProject, setFilterProject] = useState(null);
  const [filterSource, setFilterSource] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const linkMap = useProjectLinks(projects);

  const projectFiltered = filterByProject(decisions, filterProject, linkMap);
  const sourceFiltered = filterSource ? projectFiltered.filter(d => (d.source || "manual") === filterSource) : projectFiltered;
  const statusFiltered = sourceFiltered.filter(d => filterStatus === "all" || d.status === filterStatus);
  const filtered = sortBy === "newest"
    ? [...statusFiltered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : sortBy === "oldest"
    ? [...statusFiltered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : statusFiltered;

  async function createDecision(data) {
    const d = { id: genId("dec"), ...data, status: "draft", options: data.options || [], linkedTasks: [], linkedPriorities: [], tags: [], source: data.source || "manual", createdAt: isoNow(), updatedAt: isoNow() };
    await store.save("decision", d);
    setDecisions([...decisions, d]);
    setShowForm(false);
  }

  async function updateDecision(id, updates) {
    const existing = decisions.find(d => d.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await store.save("decision", updated);
    setDecisions(decisions.map(d => d.id === id ? updated : d));
  }

  async function deleteDecision(id) {
    await store.delete("decision", id);
    setDecisions(decisions.filter(d => d.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em" }}>Decisions</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, marginTop: 4 }}>{decisions.length} total</div>
        </div>
        <Btn variant="primary" onClick={() => setShowForm(true)}>＋ New Decision</Btn>
      </div>

      <ProjectFilterPills projects={projects} filterProject={filterProject} setFilterProject={setFilterProject} />

      {/* Status filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {["all", ...DECISION_STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            background: filterStatus === s ? "rgba(255,255,255,0.08)" : "transparent",
            border: `1px solid ${filterStatus === s ? C.borderSubtle : C.borderDefault}`,
            borderRadius: 8, color: filterStatus === s ? C.textPrimary : C.textSecondary,
            fontFamily: FONT_SANS, fontSize: 13, fontWeight: filterStatus === s ? 600 : 400, padding: "5px 12px", cursor: "pointer", transition: "all 0.15s ease",
          }}>{s === "all" ? "All" : DECISION_STATUS_LABELS[s]}</button>
        ))}
      </div>

      {/* Source + sort */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary, fontWeight: 500, marginRight: 2 }}>Source:</span>
          {[[null, "All"], ["ingest", "Extract"], ["project", "Project"], ["manual", "Manual"]].map(([val, lbl]) => (
            <button key={lbl} onClick={() => setFilterSource(val)} style={{
              padding: "4px 10px", borderRadius: 6, cursor: "pointer",
              border: `1px solid ${filterSource === val ? C.borderSubtle : C.borderDefault}`,
              background: filterSource === val ? "rgba(255,255,255,0.08)" : "transparent",
              color: filterSource === val ? C.textPrimary : C.textSecondary,
              fontSize: 13, fontFamily: FONT_SANS, fontWeight: filterSource === val ? 600 : 400, transition: "all 0.15s ease",
            }}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["default", "Default"], ["newest", "Newest"], ["oldest", "Oldest"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setSortBy(val)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: sortBy === val ? "rgba(255,255,255,0.08)" : "transparent",
              color: sortBy === val ? C.textPrimary : C.textSecondary,
              fontSize: 13, fontFamily: FONT_SANS, fontWeight: sortBy === val ? 500 : 400,
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Diamond size={36} />} title="No decisions yet" sub="Start by creating your first decision to track." action="＋ New Decision" onAction={() => setShowForm(true)} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {filtered.map(d => (
            <DecisionCard key={d.id} decision={d} expanded={expandedId === d.id}
              onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
              onUpdate={(updates) => updateDecision(d.id, updates)}
              onDelete={() => deleteDecision(d.id)}
              tasks={tasks} setTasks={setTasks}
            />
          ))}
        </div>
      )}

      {showForm && <DecisionFormModal onClose={() => setShowForm(false)} onCreate={createDecision} />}
    </div>
  );
}

// ─── Decision Card ───────────────────────────────────────────────────────────
function DecisionCard({ decision, expanded, onToggle, onUpdate, onDelete, tasks, setTasks }) {
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: decision.title, context: decision.context || "", outcome: decision.outcome || "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const linkedTasks = tasks.filter(t => t.sourceDecisionId === decision.id);
  const currentIdx = DECISION_STATUSES.indexOf(decision.status);
  const age = Math.floor((Date.now() - new Date(decision.createdAt).getTime()) / 86400000);

  async function askBC() {
    const q = customPrompt.trim();
    if (!q || aiLoading) return;
    setCustomPrompt(""); setAiLoading(true); setAiError(""); setAiResponse("");
    try {
      const ctx = `Decision: ${decision.title}\nStatus: ${decision.status}\nContext: ${decision.context || "none"}`;
      const response = await callAIForEntity("decision", decision.id, `${ctx}\n\nQuestion: ${q}`);
      setAiResponse(response);
    } catch (err) { setAiError(err.message); }
    finally { setAiLoading(false); }
  }

  async function runAIAction(actionKey) {
    const action = AI_ACTIONS[actionKey];
    if (!action) return;
    setAiLoading(true); setAiError(""); setAiResponse("");
    try {
      const prompt = action.prompt(decision);
      const response = await callAIForEntity("decision", decision.id, prompt);
      if (actionKey === "generate_tasks") {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const taskDefs = JSON.parse(jsonMatch[0]);
            const now = new Date();
            for (const td of taskDefs) {
              const dueDate = td.dueOffset ? new Date(now.getTime() + td.dueOffset * 86400000).toISOString().split("T")[0] : null;
              const newTask = { id: genId("task"), title: td.title, description: td.description || "", status: "open", priority: td.priority || "medium", dueDate, sourceDecisionId: decision.id, source: "decision", subtasks: [], tags: [], createdAt: isoNow(), updatedAt: isoNow() };
              await store.save("task", newTask);
              await store.link("task", newTask.id, "decision", decision.id);
              setTasks(prev => [...prev, newTask]);
            }
          } catch (_) {}
        }
        setAiResponse(`Created tasks from this decision.`);
      } else {
        setAiResponse(response);
      }
    } catch (err) { setAiError(err.message); }
    finally { setAiLoading(false); }
  }

  async function saveEdit() { await onUpdate(editData); setEditing(false); }

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${expanded ? C.gold + "30" : C.borderDefault}`, borderRadius: 12, overflow: "hidden", transition: "all 0.15s ease" }}>
      {/* Header */}
      <div onClick={onToggle} onMouseEnter={() => setHeaderHovered(true)} onMouseLeave={() => setHeaderHovered(false)}
        style={{ padding: "16px 18px 12px", cursor: "pointer", background: headerHovered ? C.bgCardHover : "transparent", transition: "background 0.12s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.45, flex: 1, letterSpacing: "-0.01em" }}>{decision.title}</div>
          <span style={{ fontSize: 11, color: headerHovered ? C.gold : C.textTertiary, flexShrink: 0, transition: "color 0.12s" }}>{expanded ? "▴" : "▾"}</span>
        </div>
        {decision.context && !expanded && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.5, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{decision.context}</div>
        )}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <Badge label={DECISION_STATUS_LABELS[decision.status]} color={statusColor(decision.status)} />
          {age > 5 && decision.status === "draft" && <Badge label={`${age}d in draft`} color={C.amber} />}
          {linkedTasks.length > 0 && <Badge label={`${linkedTasks.length} task${linkedTasks.length !== 1 ? "s" : ""}`} />}
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto" }}>{fmtRelative(decision.createdAt)}</span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}` }} onClick={e => e.stopPropagation()}>
          {/* Pipeline */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
            <div style={{ display: "flex", gap: 4 }}>
              {DECISION_STATUSES.map((s, i) => {
                const isPast = i < currentIdx;
                const isCurrent = i === currentIdx;
                const isNext = i === currentIdx + 1;
                return (
                  <button key={s} onClick={() => (isNext || isPast) ? onUpdate({ status: s }) : null} style={{
                    flex: 1, padding: "6px 4px", borderRadius: 6, border: "none",
                    background: isCurrent ? `${C.gold}25` : isPast ? `${C.gold}10` : "rgba(255,255,255,0.03)",
                    cursor: isNext || isPast ? "pointer" : "default",
                    fontFamily: FONT_MONO, fontSize: 11, fontWeight: isCurrent ? 700 : 400,
                    color: isCurrent ? C.gold : isPast ? C.gold + "90" : C.textTertiary,
                    textTransform: "uppercase", letterSpacing: "0.04em", transition: "all 0.15s",
                  }}>{DECISION_STATUS_LABELS[s]}</button>
                );
              })}
            </div>
          </div>

          {/* Context */}
          {editing ? (
            <div style={{ padding: "14px 16px" }}>
              <FormField label="Title"><Input value={editData.title} onChange={v => setEditData({ ...editData, title: v })} /></FormField>
              <FormField label="Context"><Input multiline rows={4} value={editData.context} onChange={v => setEditData({ ...editData, context: v })} /></FormField>
              <FormField label="Outcome"><Input multiline rows={3} value={editData.outcome} onChange={v => setEditData({ ...editData, outcome: v })} /></FormField>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="primary" size="sm" onClick={saveEdit}>Save</Btn>
                <Btn variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Btn>
              </div>
            </div>
          ) : decision.context ? (
            <div style={{ padding: "14px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{decision.context}</div>
              {decision.outcome && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.borderDefault}` }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Outcome</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textPrimary, lineHeight: 1.6 }}>{decision.outcome}</div>
                </div>
              )}
            </div>
          ) : null}

          {/* Linked tasks */}
          {linkedTasks.length > 0 && (
            <div style={{ padding: "10px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Linked Tasks ({linkedTasks.length})</div>
              {linkedTasks.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                  <span style={{ color: priorityColor(t.priority), fontSize: 8 }}>●</span>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textSecondary, flex: 1 }}>{t.title}</span>
                  <Badge label={TASK_STATUS_LABELS[t.status] || t.status} color={statusColor(t.status)} />
                </div>
              ))}
            </div>
          )}

          {/* Actions + Ask BC */}
          <div style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Btn>
              <Btn variant="ghost" size="sm" onClick={() => runAIAction("analyze_decision")}><Sparkles size={12} /> Analyze</Btn>
              {decision.status === "decided" && <Btn variant="ghost" size="sm" onClick={() => runAIAction("generate_tasks")}><Sparkles size={12} /> Generate Tasks</Btn>}
              {confirmDelete ? (
                <><Btn variant="danger" size="sm" onClick={onDelete}>Confirm</Btn><Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn></>
              ) : (
                <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>Delete</Btn>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && askBC()}
                placeholder="Ask BC about this decision..." disabled={aiLoading}
                style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "7px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 12, outline: "none" }}
              />
              <button onClick={askBC} disabled={!customPrompt.trim() || aiLoading} style={{
                background: customPrompt.trim() && !aiLoading ? C.gold : "transparent",
                border: `1px solid ${customPrompt.trim() && !aiLoading ? C.gold : C.borderAI}`,
                borderRadius: 6, padding: "7px 14px", cursor: customPrompt.trim() && !aiLoading ? "pointer" : "not-allowed",
                color: customPrompt.trim() && !aiLoading ? C.bgPrimary : C.textTertiary,
                fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
              }}><Sparkles size={12} /></button>
            </div>
            <AIPanel response={aiResponse} loading={aiLoading} error={aiError} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Decision Form Modal ─────────────────────────────────────────────────────
function DecisionFormModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [template, setTemplate] = useState("blank");
  const [options, setOptions] = useState("");

  function handleTemplateChange(t) { setTemplate(t); setContext(DECISION_TEMPLATES[t]?.context || ""); }

  async function handleSubmit() {
    if (!title.trim()) return;
    await onCreate({ title: title.trim(), context, templateType: template, options: options.split("\n").map(s => s.trim()).filter(Boolean) });
  }

  return (
    <Modal title="New Decision" onClose={onClose} width={560}>
      <FormField label="Template">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(DECISION_TEMPLATES).map(([key, t]) => (
            <button key={key} onClick={() => handleTemplateChange(key)} style={{
              padding: "4px 10px", borderRadius: 6, border: `1px solid ${template === key ? C.borderSubtle : C.borderDefault}`,
              background: template === key ? "rgba(255,255,255,0.08)" : "transparent",
              color: template === key ? C.textPrimary : C.textSecondary, fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>
      </FormField>
      <FormField label="Title" required><Input value={title} onChange={setTitle} placeholder="What decision needs to be made?" onKeyDown={e => e.key === "Enter" && handleSubmit()} /></FormField>
      <FormField label="Context"><Input multiline rows={5} value={context} onChange={setContext} placeholder="Background, constraints, criteria..." /></FormField>
      <FormField label="Options (one per line)"><Input multiline rows={3} value={options} onChange={setOptions} placeholder={"Option A\nOption B\nOption C"} /></FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={!title.trim()}>Create Decision</Btn>
      </div>
    </Modal>
  );
}
