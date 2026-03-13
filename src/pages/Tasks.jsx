import { useState } from "react";
import { CheckSquare, Sparkles, AlertTriangle } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, TASK_STATUSES, TASK_STATUS_LABELS, TASK_PRIORITIES } from "../lib/tokens";
import { store } from "../lib/storage";
import { callAI, callAIForEntity, AI_ACTIONS } from "../lib/ai";
import { genId, isoNow, fmtRelative, isOverdue, statusColor, priorityColor } from "../lib/utils";
import { useEntityStore } from "../store/entityStore";
import { Badge, Btn, Input, Select, Modal, FormField, EmptyState, ProjectFilterPills, useProjectLinks, filterByProject } from "../components/ui/index";

export default function Tasks() {
  const { tasks, setTasks, decisions, projects, ingestSessions } = useEntityStore();
  const [groupBy, setGroupBy] = useState("status");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [filterSource, setFilterSource] = useState(null);
  const linkMap = useProjectLinks(projects);

  async function createTask(data) {
    const t = { id: genId("task"), ...data, source: data.source || "manual", subtasks: [], tags: [], createdAt: isoNow(), updatedAt: isoNow() };
    await store.save("task", t);
    if (data.sourceDecisionId) await store.link("task", t.id, "decision", data.sourceDecisionId);
    setTasks([...tasks, t]);
    setShowForm(false);
  }
  async function updateTask(id, updates) {
    const existing = tasks.find(t => t.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates, updatedAt: isoNow() };
    await store.save("task", updated);
    setTasks(tasks.map(t => t.id === id ? updated : t));
  }
  async function deleteTask(id) {
    await store.delete("task", id);
    setTasks(tasks.filter(t => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  const projectFiltered = filterByProject(tasks, filterProject, linkMap);
  const sourceFiltered = filterSource ? projectFiltered.filter(t => (t.source || "manual") === filterSource) : projectFiltered;
  const searchFiltered = searchTerm ? sourceFiltered.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.description || "").toLowerCase().includes(searchTerm.toLowerCase())) : sourceFiltered;
  const filtered = sortBy === "newest" ? [...searchFiltered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : sortBy === "oldest" ? [...searchFiltered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : searchFiltered;

  function getGroups() {
    if (groupBy === "status") return TASK_STATUSES.map(s => ({ key: s, label: TASK_STATUS_LABELS[s], color: statusColor(s), items: filtered.filter(t => t.status === s) })).filter(g => g.items.length > 0);
    if (groupBy === "priority") return TASK_PRIORITIES.map(p => ({ key: p, label: p.charAt(0).toUpperCase() + p.slice(1), color: priorityColor(p), items: filtered.filter(t => t.priority === p) })).filter(g => g.items.length > 0);
    return [{ key: "all", label: "All Tasks", color: C.textTertiary, items: filtered }].filter(g => g.items.length > 0);
  }
  const groups = getGroups();
  const completedCount = tasks.filter(t => t.status === "complete").length;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.textPrimary, margin: 0, fontFamily: FONT_SANS, letterSpacing: "-0.03em" }}>Tasks</h1>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, marginTop: 4, display: "block" }}>{completedCount}/{tasks.length} completed</span>
        </div>
      </div>

      {tasks.length > 0 && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%`, height: "100%", background: completedCount === tasks.length ? C.green : `linear-gradient(90deg, ${C.blue}, ${C.gold})`, borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </div>
      )}

      <div style={{ position: "relative", marginBottom: 14 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.textTertiary, fontSize: 14, opacity: 0.5 }}>⌕</span>
        <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px 14px 10px 36px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, color: C.textPrimary, fontSize: 14, fontFamily: FONT_SANS, outline: "none", boxSizing: "border-box" }}
          onFocus={e => (e.target.style.borderColor = C.borderSubtle)} onBlur={e => (e.target.style.borderColor = C.borderDefault)} />
      </div>

      <ProjectFilterPills projects={projects} filterProject={filterProject} setFilterProject={setFilterProject} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary, fontWeight: 500, alignSelf: "center", marginRight: 2 }}>Source:</span>
        {[[null, "All"], ["ingest", "Extract"], ["project", "Project"], ["decision", "Decision"], ["manual", "Manual"]].map(([val, lbl]) => (
          <button key={lbl} onClick={() => setFilterSource(val)} style={{
            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            border: `1px solid ${filterSource === val ? C.blue + "40" : "transparent"}`,
            background: filterSource === val ? C.blueMuted : "transparent",
            color: filterSource === val ? C.blue : C.textTertiary,
            fontSize: 12, fontFamily: FONT_SANS, fontWeight: filterSource === val ? 600 : 400, transition: "all 0.15s ease",
          }}>{lbl}</button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {[["status", "Status"], ["priority", "Priority"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setGroupBy(val)} style={{
              padding: "5px 14px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${groupBy === val ? C.borderSubtle : C.borderDefault}`,
              background: groupBy === val ? "rgba(255,255,255,0.08)" : "transparent",
              color: groupBy === val ? C.textPrimary : C.textSecondary,
              fontSize: 13, fontFamily: FONT_SANS, fontWeight: groupBy === val ? 600 : 400, transition: "all 0.15s ease",
            }}>{lbl}</button>
          ))}
          <span style={{ width: 1, height: 16, background: C.borderDefault, margin: "0 2px" }} />
          {[["default", "Default"], ["newest", "Newest"], ["oldest", "Oldest"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setSortBy(val)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: sortBy === val ? "rgba(255,255,255,0.08)" : "transparent",
              color: sortBy === val ? C.textPrimary : C.textSecondary,
              fontSize: 13, fontFamily: FONT_SANS, fontWeight: sortBy === val ? 500 : 400,
            }}>{lbl}</button>
          ))}
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowForm(true)}>+ New Task</Btn>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={<CheckSquare size={36} />} title="No tasks yet" sub="Create tasks to track execution on your decisions." action="+ New Task" onAction={() => setShowForm(true)} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.textTertiary, fontFamily: FONT_BODY, fontSize: 14 }}>No tasks match "{searchTerm}"</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {groups.map(group => (
            <div key={group.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.borderDefault}` }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: group.color || C.textTertiary, opacity: 0.7 }} />
                <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{group.label}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{group.items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {group.items.map(t => (
                  <TaskRow key={t.id} task={t} expanded={expandedId === t.id} onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)} onUpdate={u => updateTask(t.id, u)} onDelete={() => deleteTask(t.id)} decisions={decisions} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <TaskFormModal onClose={() => setShowForm(false)} onCreate={createTask} decisions={decisions} />}
    </div>
  );
}

// ─── Task Row ────────────────────────────────────────────────────────────────
function TaskRow({ task, expanded, onToggle, onUpdate, onDelete, decisions }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: task.title, description: task.description || "", status: task.status, priority: task.priority, dueDate: task.dueDate || "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const [completedGuideSteps, setCompletedGuideSteps] = useState({});

  const isDone = task.status === "complete";
  const overdue = isOverdue(task.dueDate) && !["complete", "cancelled"].includes(task.status);
  const subsDone = (task.subtasks || []).filter(s => s.complete).length;
  const subsTotal = (task.subtasks || []).length;
  const guide = task.bcGuide;
  const guideDone = guide ? Object.values(completedGuideSteps).filter(Boolean).length : 0;
  const guideTotal = guide ? (guide.steps || []).length : 0;

  async function breakDown() {
    setAiLoading(true);
    try {
      const response = await callAIForEntity("task", task.id, AI_ACTIONS.break_down.prompt(task));
      const m = response.match(/\[[\s\S]*\]/);
      if (m) { const subs = JSON.parse(m[0]).map(s => ({ id: genId("sub"), title: s.title, complete: false })); await onUpdate({ subtasks: [...(task.subtasks || []), ...subs] }); }
    } catch (_) {}
    finally { setAiLoading(false); }
  }

  async function generateGuide() {
    if (guide) { setGuideOpen(!guideOpen); return; }
    setGuideLoading(true); setGuideOpen(true);
    try {
      const subtaskList = (task.subtasks || []).map(s => `- ${s.title}`).join("\n") || "No subtasks yet.";
      const prompt = `You are a hands-on mentor helping someone accomplish a task.\n\nTask: ${task.title}\nDescription: ${task.description || "none"}\nSubtasks:\n${subtaskList}\n\nReturn ONLY valid JSON:\n{"overview":"...","steps":[{"action":"...","how":"...","done_looks_like":"..."}]}\n\nRULES: 4-8 steps, be practical not theoretical.`;
      const raw = await callAI([{ role: "user", content: prompt }], "You are a practical mentor. Return only valid JSON.", 4000);
      const clean = String(raw).replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed && Array.isArray(parsed.steps)) await onUpdate({ bcGuide: parsed });
    } catch (_) {}
    finally { setGuideLoading(false); }
  }

  async function toggleSubtask(subId) { await onUpdate({ subtasks: (task.subtasks || []).map(s => s.id === subId ? { ...s, complete: !s.complete } : s) }); }
  async function saveEdit() { await onUpdate(editData); setEditing(false); }

  return (
    <div style={{ background: expanded ? C.bgCard : "#111827", borderRadius: 6, borderLeft: `3px solid ${expanded ? priorityColor(task.priority) : "transparent"}`, transition: "all 0.15s" }}>
      <div onClick={onToggle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <button onClick={e => { e.stopPropagation(); onUpdate({ status: isDone ? "open" : "complete" }); }} style={{
            width: 18, height: 18, borderRadius: 3, flexShrink: 0,
            background: isDone ? C.green : "transparent", border: `2px solid ${isDone ? C.green : "#444"}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700,
          }}>{isDone ? "✓" : ""}</button>
          <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: isDone ? C.textTertiary : C.textPrimary, textDecoration: isDone ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {subsTotal > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: subsDone === subsTotal ? C.green : C.textTertiary }}>{subsDone}/{subsTotal}</span>}
          {guide && <Sparkles size={10} style={{ color: C.gold }} />}
          {overdue && <AlertTriangle size={10} style={{ color: C.red }} />}
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: priorityColor(task.priority) }}>{task.priority}</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: statusColor(task.status) }}>{TASK_STATUS_LABELS[task.status]}</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{fmtRelative(task.createdAt)}</span>
        </div>
      </div>

      {expanded && !editing && (
        <div style={{ padding: "0 14px 10px" }}>
          {task.description && !guideOpen && (
            <div style={{ padding: "6px 10px", background: "#0F1013", borderRadius: 4, borderLeft: `2px solid ${priorityColor(task.priority)}44`, fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, fontStyle: "italic", marginBottom: 8 }}>
              {task.description.split("\n")[0].slice(0, 150)}
            </div>
          )}
          {subsTotal > 0 && !guideOpen && (
            <div style={{ marginBottom: 8 }}>
              {task.subtasks.map(sub => (
                <div key={sub.id} onClick={() => toggleSubtask(sub.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", cursor: "pointer", borderRadius: 3, background: sub.complete ? `${C.green}08` : "transparent" }}>
                  <span style={{ color: sub.complete ? C.green : "#555", fontSize: 11, flexShrink: 0 }}>{sub.complete ? "✓" : "○"}</span>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: sub.complete ? C.textTertiary : C.textSecondary, textDecoration: sub.complete ? "line-through" : "none" }}>{sub.title}</span>
                </div>
              ))}
            </div>
          )}

          {guideOpen && guide && (
            <div style={{ background: "#0B1120", borderRadius: 8, border: `1px solid ${C.gold}22`, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gold}15`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}><Sparkles size={10} /> BC Guide</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: guideDone === guideTotal && guideTotal > 0 ? C.green : C.textTertiary }}>{guideDone}/{guideTotal}</span>
              </div>
              {guide.overview && <div style={{ padding: "8px 12px", fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5, borderBottom: `1px solid rgba(255,255,255,0.04)` }}>{guide.overview}</div>}
              <div>
                {(guide.steps || []).map((step, i) => {
                  const stepDone = completedGuideSteps[i];
                  const isStepExpanded = expandedStep === i;
                  return (
                    <div key={i} style={{ borderBottom: i < guide.steps.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none" }}>
                      <div onClick={() => setExpandedStep(isStepExpanded ? null : i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", background: isStepExpanded ? "#111827" : "transparent", transition: "background 0.1s" }}>
                        <button onClick={e => { e.stopPropagation(); setCompletedGuideSteps(p => ({ ...p, [i]: !p[i] })); }} style={{
                          width: 18, height: 18, borderRadius: "50%", flexShrink: 0, background: stepDone ? C.green : "transparent", border: `2px solid ${stepDone ? C.green : "#333"}`,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700,
                        }}>{stepDone ? "✓" : <span style={{ color: "#555", fontSize: 11 }}>{i + 1}</span>}</button>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: stepDone ? C.textTertiary : C.textPrimary, textDecoration: stepDone ? "line-through" : "none", flex: 1, lineHeight: 1.4 }}>{step.action}</span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: isStepExpanded ? C.gold : C.textTertiary, flexShrink: 0 }}>{isStepExpanded ? "▴" : "how?"}</span>
                      </div>
                      {isStepExpanded && (
                        <div style={{ padding: "0 12px 10px 38px" }}>
                          <div style={{ padding: "8px 10px", background: `${C.gold}08`, borderRadius: 4, borderLeft: `2px solid ${C.gold}44` }}>
                            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{step.how}</div>
                            {step.done_looks_like && <div style={{ marginTop: 6, fontFamily: FONT_MONO, fontSize: 11, color: C.green }}>Done when: {step.done_looks_like}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {guideOpen && guideLoading && !guide && (
            <div style={{ padding: "16px 12px", background: "#0B1120", borderRadius: 8, border: `1px solid ${C.gold}22`, marginBottom: 8, textAlign: "center" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Sparkles size={10} /> Building your guide...</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={generateGuide} style={{ padding: "3px 10px", borderRadius: 3, border: "none", cursor: "pointer", background: guideOpen ? `${C.gold}22` : `${C.gold}15`, color: C.gold, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600 }}>
              {guideOpen && guide ? "hide guide" : guide ? "show guide" : <><Sparkles size={10} style={{ display: "inline" }} /> guide me</>}
            </button>
            <span style={{ color: "rgba(255,255,255,0.06)", margin: "0 2px" }}>|</span>
            {TASK_STATUSES.map(s => (
              <button key={s} onClick={() => onUpdate({ status: s })} style={{
                padding: "2px 7px", borderRadius: 3, border: "none",
                background: task.status === s ? `${statusColor(s)}22` : "rgba(255,255,255,0.04)",
                color: task.status === s ? statusColor(s) : C.textTertiary,
                fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer",
              }}>{TASK_STATUS_LABELS[s]}</button>
            ))}
            <span style={{ color: "rgba(255,255,255,0.06)", margin: "0 2px" }}>|</span>
            {subsTotal === 0 && !aiLoading && <button onClick={breakDown} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.blue, padding: "2px 0" }}>break down</button>}
            <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, padding: "2px 0" }}>edit</button>
            {confirmDelete ? (
              <><button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.red, padding: "2px 0" }}>confirm</button>
              <button onClick={() => setConfirmDelete(false)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, padding: "2px 0" }}>cancel</button></>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, padding: "2px 0" }}>delete</button>
            )}
          </div>
        </div>
      )}

      {expanded && editing && (
        <div style={{ padding: "8px 14px 10px" }}>
          <FormField label="Title"><Input value={editData.title} onChange={v => setEditData(p => ({ ...p, title: v }))} /></FormField>
          <FormField label="Description"><Input multiline rows={2} value={editData.description} onChange={v => setEditData(p => ({ ...p, description: v }))} /></FormField>
          <div style={{ display: "flex", gap: 12 }}>
            <FormField label="Status"><Select value={editData.status} onChange={v => setEditData(p => ({ ...p, status: v }))} options={TASK_STATUSES.map(s => ({ value: s, label: TASK_STATUS_LABELS[s] }))} /></FormField>
            <FormField label="Priority"><Select value={editData.priority} onChange={v => setEditData(p => ({ ...p, priority: v }))} options={TASK_PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} /></FormField>
          </div>
          <FormField label="Due Date"><Input value={editData.dueDate} onChange={v => setEditData(p => ({ ...p, dueDate: v }))} placeholder="YYYY-MM-DD" /></FormField>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Btn>
            <Btn variant="primary" size="sm" onClick={saveEdit}>Save</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Task Form Modal ─────────────────────────────────────────────────────────
function TaskFormModal({ onClose, onCreate, decisions }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [sourceDecisionId, setSourceDecisionId] = useState("");

  async function handleSubmit() {
    if (!title.trim()) return;
    await onCreate({ title: title.trim(), description, status, priority, dueDate: dueDate || null, sourceDecisionId: sourceDecisionId || null, linkedPriorities: [] });
  }

  return (
    <Modal title="New Task" onClose={onClose}>
      <FormField label="Title" required><Input value={title} onChange={setTitle} placeholder="What needs to be done?" onKeyDown={e => e.key === "Enter" && handleSubmit()} /></FormField>
      <FormField label="Description"><Input multiline rows={3} value={description} onChange={setDescription} placeholder="Details, context..." /></FormField>
      <div style={{ display: "flex", gap: 12 }}>
        <FormField label="Status"><Select value={status} onChange={setStatus} options={TASK_STATUSES.map(s => ({ value: s, label: TASK_STATUS_LABELS[s] }))} /></FormField>
        <FormField label="Priority"><Select value={priority} onChange={setPriority} options={TASK_PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} /></FormField>
      </div>
      <FormField label="Due Date"><Input value={dueDate} onChange={setDueDate} placeholder="YYYY-MM-DD" /></FormField>
      {decisions.length > 0 && (
        <FormField label="Link to Decision"><Select value={sourceDecisionId} onChange={setSourceDecisionId} options={[{ value: "", label: "None" }, ...decisions.map(d => ({ value: d.id, label: d.title }))]} /></FormField>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={!title.trim()}>Create Task</Btn>
      </div>
    </Modal>
  );
}
