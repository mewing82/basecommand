import { useState } from "react";
import { ChevronUp, ChevronDown, Diamond, Sparkles, TrendingUp } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, PRIORITY_STATUSES, PRIORITY_STATUS_LABELS, PRIORITY_TIMEFRAMES, PRIORITY_TIMEFRAME_LABELS, DECISION_STATUS_LABELS, TASK_STATUS_LABELS } from "../lib/tokens";
import { store } from "../lib/storage";
import { callAIForEntity, AI_ACTIONS } from "../lib/ai";
import { genId, isoNow, fmtRelative, statusColor, priorityColor } from "../lib/utils";
import { useEntityStore } from "../store/entityStore";
import { Badge, Btn, Input, Select, Modal, FormField, AIPanel, EmptyState, HealthBar, ProjectFilterPills, useProjectLinks, filterByProject } from "../components/ui/index";

export default function Priorities() {
  const { priorities, setPriorities, decisions, tasks, projects } = useEntityStore();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filterProject, setFilterProject] = useState(null);
  const [filterSource, setFilterSource] = useState(null);
  const linkMap = useProjectLinks(projects);

  async function createPriority(data) {
    const p = { id: genId("pri"), ...data, rank: priorities.length + 1, successMetrics: data.successMetrics || [], linkedDecisions: [], linkedTasks: [], tags: [], healthScore: null, source: data.source || "manual", createdAt: isoNow(), updatedAt: isoNow() };
    await store.save("priority", p);
    setPriorities([...priorities, p]);
    setShowForm(false);
  }
  async function updatePriority(id, updates) {
    const existing = priorities.find(p => p.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await store.save("priority", updated);
    setPriorities(priorities.map(p => p.id === id ? updated : p));
  }
  async function deletePriority(id) {
    await store.delete("priority", id);
    setPriorities(priorities.filter(p => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  }
  async function moveRank(id, dir) {
    const sorted = [...priorities].sort((a, b) => a.rank - b.rank);
    const idx = sorted.findIndex(p => p.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await updatePriority(a.id, { rank: b.rank });
    await updatePriority(b.id, { rank: a.rank });
  }

  const projectFiltered = filterByProject(priorities, filterProject, linkMap);
  const sourceFiltered = filterSource ? projectFiltered.filter(p => (p.source || "manual") === filterSource) : projectFiltered;
  const sorted = [...sourceFiltered].sort((a, b) => a.rank - b.rank);

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em" }}>Priorities</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, marginTop: 4 }}>{priorities.length} total</div>
        </div>
        <Btn variant="primary" onClick={() => setShowForm(true)}>＋ New Priority</Btn>
      </div>
      <ProjectFilterPills projects={projects} filterProject={filterProject} setFilterProject={setFilterProject} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18, alignItems: "center" }}>
        <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary, fontWeight: 500, marginRight: 2 }}>Source:</span>
        {[[null, "All"], ["ingest", "Extract"], ["project", "Project"], ["manual", "Manual"]].map(([val, lbl]) => (
          <button key={lbl} onClick={() => setFilterSource(val)} style={{
            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            border: `1px solid ${filterSource === val ? C.blue + "40" : "transparent"}`,
            background: filterSource === val ? C.blueMuted : "transparent",
            color: filterSource === val ? C.blue : C.textTertiary,
            fontSize: 12, fontFamily: FONT_SANS, fontWeight: filterSource === val ? 600 : 400, transition: "all 0.15s ease",
          }}>{lbl}</button>
        ))}
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={<TrendingUp size={36} />} title="No priorities defined" sub="Define your strategic priorities to track health and alignment." action="＋ New Priority" onAction={() => setShowForm(true)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sorted.map((p, i) => (
            <PriorityCard key={p.id} priority={p} rank={i + 1} expanded={expandedId === p.id} onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)} onUpdate={u => updatePriority(p.id, u)} onDelete={() => deletePriority(p.id)} onMoveUp={() => moveRank(p.id, "up")} onMoveDown={() => moveRank(p.id, "down")} canMoveUp={i > 0} canMoveDown={i < sorted.length - 1} tasks={tasks} decisions={decisions} />
          ))}
        </div>
      )}
      {showForm && <PriorityFormModal onClose={() => setShowForm(false)} onCreate={createPriority} />}
    </div>
  );
}

function PriorityCard({ priority, rank, expanded, onToggle, onUpdate, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown, tasks, decisions }) {
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: priority.title, description: priority.description || "", status: priority.status, timeframe: priority.timeframe, successMetrics: (priority.successMetrics || []).join("\n") });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  async function askBC() {
    const q = customPrompt.trim(); if (!q || aiLoading) return;
    setCustomPrompt(""); setAiLoading(true); setAiError(""); setAiResponse("");
    try {
      const ctx = `Priority: ${priority.title}\nStatus: ${priority.status}\nTimeframe: ${priority.timeframe}\nHealth: ${priority.healthScore ?? "not assessed"}`;
      const response = await callAIForEntity("priority", priority.id, `${ctx}\n\nQuestion: ${q}`);
      setAiResponse(response);
    } catch (err) { setAiError(err.message); } finally { setAiLoading(false); }
  }

  const linkedTasks = tasks.filter(t => t.linkedPriorities?.includes(priority.id));
  const linkedDecisions = decisions.filter(d => d.linkedPriorities?.includes(priority.id));

  async function runAssessHealth() {
    setAiLoading(true); setAiError(""); setAiResponse("");
    try {
      const prompt = AI_ACTIONS.assess_health.prompt(priority);
      const response = await callAIForEntity("priority", priority.id, prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) { try { const parsed = JSON.parse(jsonMatch[0]); if (parsed.score !== undefined) await onUpdate({ healthScore: parsed.score }); setAiResponse(parsed.assessment || response); } catch { setAiResponse(response); } }
      else setAiResponse(response);
    } catch (err) { setAiError(err.message); } finally { setAiLoading(false); }
  }

  async function saveEdit() { await onUpdate({ ...editData, successMetrics: editData.successMetrics.split("\n").map(s => s.trim()).filter(Boolean) }); setEditing(false); }

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, overflow: "hidden" }}>
      <div onClick={onToggle} onMouseEnter={() => setHeaderHovered(true)} onMouseLeave={() => setHeaderHovered(false)} style={{ padding: "16px 18px", cursor: "pointer", background: headerHovered ? C.bgCardHover : "transparent", transition: "background 0.15s" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 500, color: C.gold + "60", minWidth: 36, lineHeight: 1 }}>#{rank}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.4 }}>{priority.title}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                <button onClick={e => { e.stopPropagation(); onMoveUp(); }} disabled={!canMoveUp} style={{ background: "none", border: "none", cursor: canMoveUp ? "pointer" : "default", color: canMoveUp ? C.textSecondary : "rgba(255,255,255,0.1)", fontSize: 12, padding: "2px 4px", display: "flex" }}><ChevronUp size={12} /></button>
                <button onClick={e => { e.stopPropagation(); onMoveDown(); }} disabled={!canMoveDown} style={{ background: "none", border: "none", cursor: canMoveDown ? "pointer" : "default", color: canMoveDown ? C.textSecondary : "rgba(255,255,255,0.1)", fontSize: 12, padding: "2px 4px", display: "flex" }}><ChevronDown size={12} /></button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, marginBottom: 10, alignItems: "center" }}>
              <Badge label={PRIORITY_STATUS_LABELS[priority.status] || priority.status} color={statusColor(priority.status)} />
              <Badge label={PRIORITY_TIMEFRAME_LABELS[priority.timeframe] || priority.timeframe} />
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{fmtRelative(priority.createdAt)}</span>
            </div>
            <div style={{ marginBottom: 4 }}>
              {priority.healthScore !== null && priority.healthScore !== undefined ? <HealthBar score={priority.healthScore} /> : <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Not yet assessed</div>}
            </div>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}`, padding: 18 }}>
          {editing ? (
            <div>
              <FormField label="Title"><Input value={editData.title} onChange={v => setEditData(p => ({ ...p, title: v }))} /></FormField>
              <FormField label="Description"><Input multiline rows={3} value={editData.description} onChange={v => setEditData(p => ({ ...p, description: v }))} /></FormField>
              <div style={{ display: "flex", gap: 12 }}>
                <FormField label="Status"><Select value={editData.status} onChange={v => setEditData(p => ({ ...p, status: v }))} options={PRIORITY_STATUSES.map(s => ({ value: s, label: PRIORITY_STATUS_LABELS[s] }))} /></FormField>
                <FormField label="Timeframe"><Select value={editData.timeframe} onChange={v => setEditData(p => ({ ...p, timeframe: v }))} options={PRIORITY_TIMEFRAMES.map(t => ({ value: t, label: PRIORITY_TIMEFRAME_LABELS[t] }))} /></FormField>
              </div>
              <FormField label="Success Metrics (one per line)"><Input multiline rows={4} value={editData.successMetrics} onChange={v => setEditData(p => ({ ...p, successMetrics: v }))} /></FormField>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><Btn variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Btn><Btn variant="primary" size="sm" onClick={saveEdit}>Save</Btn></div>
            </div>
          ) : (
            <div>
              {priority.description && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>{priority.description}</div>}
              {(priority.successMetrics || []).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Success Metrics</div>
                  {priority.successMetrics.map((m, i) => (<div key={i} style={{ display: "flex", gap: 8, padding: "3px 0", fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary }}><span style={{ color: C.gold }}>•</span>{m}</div>))}
                </div>
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                <Btn variant="ghost" size="sm" onClick={runAssessHealth} disabled={aiLoading}>{aiLoading ? "Assessing..." : <><Sparkles size={12} /> Assess Health</>}</Btn>
                <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Btn>
                {confirmDelete ? (<><Btn variant="danger" size="sm" onClick={onDelete}>Confirm Delete</Btn><Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn></>) : (<Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>Delete</Btn>)}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && askBC()} placeholder="Ask BC about this priority..." disabled={aiLoading} style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "7px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }} />
                <button onClick={askBC} disabled={!customPrompt.trim() || aiLoading} style={{ background: customPrompt.trim() && !aiLoading ? C.gold : "transparent", border: `1px solid ${customPrompt.trim() && !aiLoading ? C.gold : C.borderAI}`, borderRadius: 6, padding: "7px 14px", cursor: customPrompt.trim() && !aiLoading ? "pointer" : "not-allowed", color: customPrompt.trim() && !aiLoading ? C.bgPrimary : C.textTertiary, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600 }}><Sparkles size={12} /></button>
              </div>
              <AIPanel response={aiResponse} loading={aiLoading} error={aiError} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PriorityFormModal({ onClose, onCreate }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [status, setStatus] = useState("active"); const [timeframe, setTimeframe] = useState("this_quarter"); const [successMetrics, setSuccessMetrics] = useState("");
  async function handleSubmit() { if (!title.trim()) return; await onCreate({ title: title.trim(), description, status, timeframe, successMetrics: successMetrics.split("\n").map(s => s.trim()).filter(Boolean) }); }
  return (
    <Modal title="New Priority" onClose={onClose}>
      <FormField label="Title" required><Input value={title} onChange={setTitle} placeholder="Strategic priority title..." /></FormField>
      <FormField label="Description"><Input multiline rows={3} value={description} onChange={setDescription} placeholder="What does success look like?" /></FormField>
      <div style={{ display: "flex", gap: 12 }}>
        <FormField label="Status"><Select value={status} onChange={setStatus} options={PRIORITY_STATUSES.map(s => ({ value: s, label: PRIORITY_STATUS_LABELS[s] }))} /></FormField>
        <FormField label="Timeframe"><Select value={timeframe} onChange={setTimeframe} options={PRIORITY_TIMEFRAMES.map(t => ({ value: t, label: PRIORITY_TIMEFRAME_LABELS[t] }))} /></FormField>
      </div>
      <FormField label="Success Metrics (one per line)"><Input multiline rows={4} value={successMetrics} onChange={setSuccessMetrics} placeholder={"Achieve X by Y\nReduce Z by W%"} /></FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={handleSubmit} disabled={!title.trim()}>Create Priority</Btn></div>
    </Modal>
  );
}
