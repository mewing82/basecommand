import { useState, useEffect } from "react";
import { Grid3X3, Sparkles, CheckSquare, Diamond, ChevronUp, ChevronDown, FolderKanban } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, TASK_PRIORITIES, PROJECT_STATUSES, PROJECT_STATUS_LABELS, PRIORITY_TIMEFRAME_LABELS } from "../lib/tokens";
import { store } from "../lib/storage";
import { callAI } from "../lib/ai";
import { PROJECT_BUILDER_PROMPT } from "../lib/prompts";
import { genId, isoNow, fmtRelative, statusColor, priorityColor } from "../lib/utils";
import { useEntityStore } from "../store/entityStore";
import { Badge, Btn, Input, Select, Modal, FormField, EmptyState, HealthBar, renderMarkdown } from "../components/ui/index";

export default function Projects() {
  const { projects, setProjects, tasks, setTasks, decisions, setDecisions, priorities, setPriorities, documents, setDocuments } = useEntityStore();
  const [expandedId, setExpandedId] = useState(null);
  const [createMode, setCreateMode] = useState(null);
  const [filterSource, setFilterSource] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  async function handleCommit({ project }) {
    const [d, t, p, projs, docs] = await Promise.all([store.list("decision"), store.list("task"), store.list("priority"), store.list("project"), store.list("document")]);
    setDecisions(d); setTasks(t); setPriorities(p); setProjects(projs); setDocuments(docs);
    setCreateMode(null); setExpandedId(project.id);
  }

  async function updateProject(id, updates) {
    const existing = projects.find(p => p.id === id); if (!existing) return;
    const updated = { ...existing, ...updates };
    await store.save("project", updated);
    setProjects(projects.map(p => p.id === id ? updated : p));
  }

  async function deleteProject(id) {
    const links = await store.getLinks("project", id);
    for (const link of links) await store.delete(link.type, link.id);
    await store.delete("project", id);
    const [d, t, p, projs, docs] = await Promise.all([store.list("decision"), store.list("task"), store.list("priority"), store.list("project"), store.list("document")]);
    setDecisions(d); setTasks(t); setPriorities(p); setProjects(projs); setDocuments(docs);
    if (expandedId === id) setExpandedId(null);
  }

  const sourceFiltered = filterSource ? projects.filter(p => (p.source || "manual") === filterSource) : projects;
  const sortedProjects = sortBy === "newest" ? [...sourceFiltered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : sortBy === "oldest" ? [...sourceFiltered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : sourceFiltered;
  const active = sortedProjects.filter(p => p.status === "active");
  const other = sortedProjects.filter(p => p.status !== "active");

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 40px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Projects</h1>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, fontFamily: FONT_BODY }}>
            {createMode ? "Describe your project and BC will build the plan." : "Your mission workstations. Link tasks, decisions, and documents."}
          </p>
        </div>
        {!createMode && <Btn variant="primary" onClick={() => setCreateMode("pick")}><Sparkles size={12} /> New Project</Btn>}
      </div>

      {!createMode && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 4 }}>Source:</span>
            {[[null, "All"], ["builder", "AI Builder"], ["import", "Import"], ["manual", "Manual"]].map(([val, lbl]) => (
              <button key={lbl} onClick={() => setFilterSource(val)} style={{ padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer", background: filterSource === val ? "rgba(255,255,255,0.08)" : "transparent", color: filterSource === val ? C.textPrimary : C.textSecondary, fontSize: 11, fontFamily: FONT_MONO, fontWeight: filterSource === val ? 700 : 400 }}>{lbl}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[["default", "Default"], ["newest", "Newest"], ["oldest", "Oldest"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setSortBy(val)} style={{ padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer", background: sortBy === val ? "rgba(255,255,255,0.08)" : "transparent", color: sortBy === val ? C.textPrimary : C.textSecondary, fontSize: 11, fontFamily: FONT_MONO, fontWeight: sortBy === val ? 600 : 400 }}>{lbl}</button>
            ))}
          </div>
        </div>
      )}

      {createMode === "pick" && <ProjectModePicker onSelect={setCreateMode} onCancel={() => setCreateMode(null)} />}
      {createMode === "ai" && <ProjectBuilder onCommit={handleCommit} onCancel={() => setCreateMode(null)} />}
      {createMode === "scratch" && <ProjectScratchForm onCommit={handleCommit} onCancel={() => setCreateMode(null)} />}

      {!createMode && (
        projects.length === 0 ? (
          <EmptyState icon={<Grid3X3 size={36} />} title="No projects yet" sub="Create a project to organize tasks, decisions, and documents." action="✦ New Project" onAction={() => setCreateMode("pick")} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {active.length > 0 && (
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Active ({active.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {active.map(p => <ProjectCard key={p.id} project={p} expanded={expandedId === p.id} onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)} onUpdate={u => updateProject(p.id, u)} onDelete={() => deleteProject(p.id)} tasks={tasks} decisions={decisions} priorities={priorities} />)}
                </div>
              </div>
            )}
            {other.length > 0 && (
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Other ({other.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {other.map(p => <ProjectCard key={p.id} project={p} expanded={expandedId === p.id} onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)} onUpdate={u => updateProject(p.id, u)} onDelete={() => deleteProject(p.id)} tasks={tasks} decisions={decisions} priorities={priorities} />)}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

// ─── Project Mode Picker ─────────────────────────────────────────────────────
function ProjectModePicker({ onSelect, onCancel }) {
  const [hovered, setHovered] = useState(null);
  const modes = [
    { id: "ai", icon: <Sparkles size={20} />, label: "AI Builder", desc: "Describe your project — BC builds the plan", color: C.gold },
    { id: "scratch", icon: <FolderKanban size={20} />, label: "From Scratch", desc: "Start blank, add items yourself", color: C.textSecondary },
  ];
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${modes.length}, 1fr)`, gap: 12, marginBottom: 12 }}>
        {modes.map(m => (
          <button key={m.id} onClick={() => onSelect(m.id)} onMouseEnter={() => setHovered(m.id)} onMouseLeave={() => setHovered(null)}
            style={{ background: hovered === m.id ? C.bgCardHover : C.bgCard, border: `1px solid ${hovered === m.id ? m.color + "40" : C.borderDefault}`, borderRadius: 12, padding: "24px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
            <div style={{ color: m.color, marginBottom: 12 }}>{m.icon}</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.5 }}>{m.desc}</div>
          </button>
        ))}
      </div>
      <Btn variant="ghost" size="sm" onClick={onCancel}>Cancel</Btn>
    </div>
  );
}

// ─── Project Scratch Form ────────────────────────────────────────────────────
function ProjectScratchForm({ onCommit, onCancel }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  async function handleSubmit() {
    if (!title.trim()) return;
    const ts = isoNow();
    const project = { id: genId("proj"), title: title.trim(), description, status: "active", xp: 0, milestones: [], source: "manual", createdAt: ts, updatedAt: ts };
    await store.save("project", project);
    onCommit({ project });
  }
  return (
    <div>
      <FormField label="Project Title" required><Input value={title} onChange={setTitle} placeholder="Project name" onKeyDown={e => e.key === "Enter" && handleSubmit()} /></FormField>
      <FormField label="Description"><Input multiline rows={3} value={description} onChange={setDescription} placeholder="What is this project about?" /></FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><Btn variant="ghost" onClick={onCancel}>Cancel</Btn><Btn variant="primary" onClick={handleSubmit} disabled={!title.trim()}>Create Project</Btn></div>
    </div>
  );
}

// ─── AI Project Builder ──────────────────────────────────────────────────────
function ProjectBuilder({ onCommit, onCancel }) {
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState({});
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [creating, setCreating] = useState(false);

  async function generate() {
    if (!input.trim() || processing) return;
    setProcessing(true); setPlan(null); setError("");
    try {
      const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      let raw = await callAI([{ role: "user", content: PROJECT_BUILDER_PROMPT(input.trim(), today) }], "You are a precise project planning system. Return only valid JSON as instructed.", 16000);
      let cleaned = raw.replace(/```json|```/g, "").trim();
      if (raw.stop_reason === "max_tokens") {
        try {
          const cont = await callAI([{ role: "user", content: PROJECT_BUILDER_PROMPT(input.trim(), today) }, { role: "assistant", content: String(raw) }, { role: "user", content: "Continue the JSON from exactly where you stopped. Output ONLY the remaining JSON." }], "You are a precise project planning system. Return only valid JSON as instructed.", 16000);
          cleaned = (String(raw) + String(cont)).replace(/```json|```/g, "").trim();
        } catch (_) {}
      }
      let parsed;
      try { parsed = JSON.parse(cleaned); } catch {
        const fixes = [cleaned + "]}", cleaned + '"}]}', cleaned + '"}],"decisions":[],"priorities":[],"milestones":[],"bc_analysis":"Plan parsed."}'];
        for (const fix of fixes) { try { parsed = JSON.parse(fix); break; } catch {} }
        if (!parsed) throw new Error("Invalid JSON");
      }
      setPlan(parsed);
      const sel = {};
      (parsed.tasks || []).forEach((_, i) => { sel[`task_${i}`] = true; });
      (parsed.decisions || []).forEach((_, i) => { sel[`decision_${i}`] = true; });
      (parsed.priorities || []).forEach((_, i) => { sel[`priority_${i}`] = true; });
      setSelected(sel);
    } catch (e) { setError("Failed to generate project plan. Check the API connection."); }
    finally { setProcessing(false); }
  }

  async function refine() {
    if (!refinePrompt.trim() || !plan || refining) return;
    const prompt = refinePrompt.trim(); setRefinePrompt(""); setRefining(true); setError("");
    try {
      const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const raw = await callAI([{ role: "user", content: PROJECT_BUILDER_PROMPT(input.trim(), today) }, { role: "assistant", content: JSON.stringify(plan) }, { role: "user", content: `Refine this project plan based on this feedback. Return the COMPLETE updated plan in the same JSON format. Feedback: ${prompt}` }], "You are a precise project planning system. Return only valid JSON as instructed.", 16000);
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setPlan(parsed);
      const sel = {};
      (parsed.tasks || []).forEach((_, i) => { sel[`task_${i}`] = true; });
      (parsed.decisions || []).forEach((_, i) => { sel[`decision_${i}`] = true; });
      (parsed.priorities || []).forEach((_, i) => { sel[`priority_${i}`] = true; });
      setSelected(sel);
    } catch (e) { setError("Failed to refine plan."); }
    finally { setRefining(false); }
  }

  async function commit() {
    if (!plan || creating) return;
    setCreating(true); const ts = isoNow(); const now = new Date();
    const project = { id: genId("proj"), title: plan.title, description: plan.description, status: "active", xp: 0, milestones: plan.milestones || [], originalPlan: plan, source: "builder", createdAt: ts, updatedAt: ts };
    await store.save("project", project);
    for (const [i, task] of (plan.tasks || []).entries()) {
      if (!selected[`task_${i}`]) continue;
      const dueDate = task.dueOffset ? new Date(now.getTime() + task.dueOffset * 86400000).toISOString().split("T")[0] : null;
      let fullDesc = task.description || "";
      if (task.guidance) {
        const g = task.guidance; const parts = [];
        if (g.instructions) parts.push(`## Instructions\n${typeof g.instructions === "string" ? g.instructions : JSON.stringify(g.instructions)}`);
        if (g.resources) parts.push(`## Resources\n${typeof g.resources === "string" ? g.resources : JSON.stringify(g.resources)}`);
        if (parts.length > 0) fullDesc += (fullDesc ? "\n\n---\n\n" : "") + parts.join("\n\n");
      }
      const t = { id: genId("task"), title: task.title, description: fullDesc, status: "open", priority: task.priority || "medium", dueDate, source: "project", subtasks: [], tags: task.phase ? [task.phase] : [], guidance: task.guidance || null, createdAt: ts, updatedAt: ts };
      await store.save("task", t); await store.link("project", project.id, "task", t.id);
    }
    for (const [i, dec] of (plan.decisions || []).entries()) {
      if (!selected[`decision_${i}`]) continue;
      const d = { id: genId("dec"), title: dec.title, context: dec.context || "", status: "draft", options: [], source: "project", tags: [], createdAt: ts, updatedAt: ts };
      await store.save("decision", d); await store.link("project", project.id, "decision", d.id);
    }
    const existingPri = await store.list("priority");
    for (const [i, pri] of (plan.priorities || []).entries()) {
      if (!selected[`priority_${i}`]) continue;
      const p = { id: genId("pri"), title: pri.title, description: pri.description || "", rank: existingPri.length + i + 1, timeframe: pri.timeframe || "this_quarter", status: "active", healthScore: null, source: "project", tags: [], createdAt: ts, updatedAt: ts };
      await store.save("priority", p); await store.link("project", project.id, "priority", p.id);
    }
    onCommit({ project });
  }

  const totalSelected = Object.values(selected).filter(Boolean).length;

  function groupTasksByPhase(tasks) {
    const phases = []; const phaseMap = {};
    for (const [i, t] of tasks.entries()) {
      const phase = t.phase || "General";
      if (!phaseMap[phase]) { phaseMap[phase] = { label: phase, items: [] }; phases.push(phaseMap[phase]); }
      phaseMap[phase].items.push({ ...t, _index: i });
    }
    return phases;
  }

  // Step 1: Describe
  if (!plan) return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> Describe Your Project</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 16 }}>Tell BC what you're working on. BC will build a full project plan with tasks, decisions, and milestones.</div>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={"Describe your project...\n\nExamples:\n• Building an AI-powered decision tool, ship MVP in 6 weeks\n• Evaluating a Senior AE role — research comp, prep interviews\n• Launching renewal AI agents, need pilot plan"} style={{ width: "100%", minHeight: 200, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: 16, resize: "vertical", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14, lineHeight: 1.6, outline: "none", boxSizing: "border-box" }} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate(); }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.textTertiary, fontFamily: FONT_MONO }}>{input.length > 0 ? `${input.length} chars` : "⌘↵ to generate"}</span>
          <Btn variant="ghost" size="sm" onClick={onCancel}>Cancel</Btn>
        </div>
        <button onClick={generate} disabled={!input.trim() || processing} style={{ background: input.trim() && !processing ? C.gold : "rgba(99,102,241,0.2)", color: input.trim() && !processing ? C.bgPrimary : C.textTertiary, border: "none", borderRadius: 6, padding: "9px 20px", fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, cursor: input.trim() && !processing ? "pointer" : "not-allowed" }}>
          {processing ? <><Sparkles size={12} /> Building Plan...</> : <><Sparkles size={12} /> Build Project Plan</>}
        </button>
      </div>
      {error && <div style={{ marginTop: 12, padding: "10px 14px", background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 6, fontSize: 13, color: C.red, fontFamily: FONT_BODY }}>{error}</div>}
    </div>
  );

  // Step 2: Review Plan
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{plan.title}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>{plan.description}</div>
      </div>
      {plan.bc_analysis && (
        <div style={{ background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 8, padding: "14px 18px", marginBottom: 24 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.aiBlue, marginBottom: 8, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> BC ANALYSIS</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textPrimary, lineHeight: 1.6 }}>{renderMarkdown(plan.bc_analysis)}</div>
        </div>
      )}
      {/* Milestones */}
      {(plan.milestones || []).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Milestones</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {plan.milestones.map((m, i) => (
              <div key={i} style={{ minWidth: 180, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: "12px 14px", flexShrink: 0 }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{m.title}</div>
                {m.description && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.4 }}>{m.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Tasks by phase */}
      {(plan.tasks || []).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tasks ({plan.tasks.length})</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { const s = { ...selected }; plan.tasks.forEach((_, i) => s[`task_${i}`] = true); setSelected(s); }} style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO }}>All</button>
              <button onClick={() => { const s = { ...selected }; plan.tasks.forEach((_, i) => s[`task_${i}`] = false); setSelected(s); }} style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO }}>None</button>
            </div>
          </div>
          {groupTasksByPhase(plan.tasks).map((phase, pi) => (
            <div key={pi} style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{phase.label}</div>
              {phase.items.map(task => {
                const i = task._index; const key = `task_${i}`; const isSelected = selected[key];
                return (
                  <div key={i} onClick={() => setSelected(s => ({ ...s, [key]: !s[key] }))} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: isSelected ? C.bgCardHover : C.bgCard, border: `1px solid ${isSelected ? C.borderActive : C.borderDefault}`, borderRadius: 8, padding: "12px 14px", marginBottom: 6, cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? C.gold : C.borderDefault}`, background: isSelected ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{isSelected && <span style={{ color: C.bgPrimary, fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <Badge label="Task" color={C.blue} /><span style={{ fontFamily: FONT_MONO, fontSize: 11, color: priorityColor(task.priority) }}>{task.priority}</span>
                        {task.dueOffset && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>+{task.dueOffset}d</span>}
                      </div>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary, marginBottom: task.description ? 3 : 0 }}>{task.title}</div>
                      {task.description && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{task.description}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {/* Decisions */}
      {(plan.decisions || []).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Decisions ({plan.decisions.length})</div>
          {plan.decisions.map((dec, i) => { const key = `decision_${i}`; const isSelected = selected[key]; return (
            <div key={i} onClick={() => setSelected(s => ({ ...s, [key]: !s[key] }))} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: isSelected ? C.bgCardHover : C.bgCard, border: `1px solid ${isSelected ? C.borderActive : C.borderDefault}`, borderRadius: 8, padding: "12px 14px", marginBottom: 6, cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? C.gold : C.borderDefault}`, background: isSelected ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{isSelected && <span style={{ color: C.bgPrimary, fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
              <div style={{ flex: 1 }}>
                <Badge label="Decision" color={C.gold} />
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary, marginTop: 3 }}>{dec.title}</div>
                {dec.context && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginTop: 2 }}>{dec.context}</div>}
              </div>
            </div>
          ); })}
        </div>
      )}
      {/* Priorities */}
      {(plan.priorities || []).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Priorities ({plan.priorities.length})</div>
          {plan.priorities.map((pri, i) => { const key = `priority_${i}`; const isSelected = selected[key]; return (
            <div key={i} onClick={() => setSelected(s => ({ ...s, [key]: !s[key] }))} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: isSelected ? C.bgCardHover : C.bgCard, border: `1px solid ${isSelected ? C.borderActive : C.borderDefault}`, borderRadius: 8, padding: "12px 14px", marginBottom: 6, cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? C.gold : C.borderDefault}`, background: isSelected ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{isSelected && <span style={{ color: C.bgPrimary, fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
              <div style={{ flex: 1 }}>
                <Badge label="Priority" color={C.amber} />
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary, marginTop: 3 }}>{pri.title}</div>
                {pri.description && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginTop: 2 }}>{pri.description}</div>}
              </div>
            </div>
          ); })}
        </div>
      )}
      {/* Refine */}
      <div style={{ marginBottom: 20, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 8, padding: "12px 14px" }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Refine with BC</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={refinePrompt} onChange={e => setRefinePrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && refine()} placeholder="Add more tasks, adjust timeline, split phases..." disabled={refining} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }} />
          <button onClick={refine} disabled={!refinePrompt.trim() || refining} style={{ background: refinePrompt.trim() && !refining ? C.gold : "transparent", border: `1px solid ${refinePrompt.trim() && !refining ? C.gold : C.borderAI}`, borderRadius: 6, padding: "7px 14px", cursor: refinePrompt.trim() && !refining ? "pointer" : "not-allowed", color: refinePrompt.trim() && !refining ? C.bgPrimary : C.textTertiary, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600 }}>{refining ? "..." : <Sparkles size={12} />}</button>
        </div>
      </div>
      {error && <div style={{ marginBottom: 12, padding: "10px 14px", background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 6, fontSize: 13, color: C.red, fontFamily: FONT_BODY }}>{error}</div>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={() => setPlan(null)}>Start Over</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <button onClick={commit} disabled={totalSelected === 0 || creating} style={{ background: totalSelected > 0 ? C.gold : "rgba(99,102,241,0.2)", color: totalSelected > 0 ? C.bgPrimary : C.textTertiary, border: "none", borderRadius: 6, padding: "9px 20px", fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, cursor: totalSelected > 0 ? "pointer" : "not-allowed" }}>
          {creating ? "Creating..." : `Create Project + ${totalSelected} Item${totalSelected !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

// ─── Project Card ────────────────────────────────────────────────────────────
function ProjectCard({ project, expanded, onToggle, onUpdate, onDelete, tasks, decisions, priorities }) {
  const [headerHovered, setHeaderHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [linkedItems, setLinkedItems] = useState({ tasks: [], decisions: [], priorities: [] });

  useEffect(() => {
    store.getLinks("project", project.id).then(links => {
      const t = links.filter(l => l.type === "task").map(l => tasks.find(x => x.id === l.id)).filter(Boolean);
      const d = links.filter(l => l.type === "decision").map(l => decisions.find(x => x.id === l.id)).filter(Boolean);
      const p = links.filter(l => l.type === "priority").map(l => priorities.find(x => x.id === l.id)).filter(Boolean);
      setLinkedItems({ tasks: t, decisions: d, priorities: p });
    });
  }, [project.id, tasks, decisions, priorities]);

  const totalTasks = linkedItems.tasks.length;
  const completedTasks = linkedItems.tasks.filter(t => t.status === "complete").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12, overflow: "hidden" }}>
      <div onClick={onToggle} onMouseEnter={() => setHeaderHovered(true)} onMouseLeave={() => setHeaderHovered(false)} style={{ padding: "18px 20px", cursor: "pointer", background: headerHovered ? C.bgCardHover : "transparent", transition: "background 0.15s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>{project.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <Badge label={PROJECT_STATUS_LABELS[project.status] || project.status} color={statusColor(project.status)} />
            {project.source && project.source !== "manual" && <Badge label={project.source} color={project.source === "builder" ? C.gold : C.blue} />}
          </div>
        </div>
        {project.description && <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.5, marginBottom: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{project.description}</div>}
        {totalTasks > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: progress === 100 ? C.green : `linear-gradient(90deg, ${C.blue}, ${C.gold})`, borderRadius: 2, transition: "width 0.5s" }} />
            </div>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: progress === 100 ? C.green : C.textTertiary }}>{completedTasks}/{totalTasks}</span>
          </div>
        )}
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginTop: 8 }}>{fmtRelative(project.createdAt)}</div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}`, padding: "16px 20px" }}>
          {/* Status selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {PROJECT_STATUSES.map(s => (
              <button key={s} onClick={() => onUpdate({ status: s })} style={{
                padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                background: project.status === s ? `${statusColor(s)}22` : "rgba(255,255,255,0.04)",
                color: project.status === s ? statusColor(s) : C.textTertiary,
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: project.status === s ? 600 : 400,
              }}>{PROJECT_STATUS_LABELS[s]}</button>
            ))}
          </div>

          {/* Linked tasks */}
          {linkedItems.tasks.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tasks ({linkedItems.tasks.length})</div>
              {linkedItems.tasks.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <span style={{ color: t.status === "complete" ? C.green : "#555", fontSize: 11 }}>{t.status === "complete" ? "✓" : "○"}</span>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: t.status === "complete" ? C.textTertiary : C.textSecondary, textDecoration: t.status === "complete" ? "line-through" : "none", flex: 1 }}>{t.title}</span>
                  <Badge label={t.priority} color={priorityColor(t.priority)} />
                </div>
              ))}
            </div>
          )}
          {/* Linked decisions */}
          {linkedItems.decisions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Decisions ({linkedItems.decisions.length})</div>
              {linkedItems.decisions.map(d => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <Diamond size={10} style={{ color: C.gold }} />
                  <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textSecondary, flex: 1 }}>{d.title}</span>
                  <Badge label={d.status} color={statusColor(d.status)} />
                </div>
              ))}
            </div>
          )}
          {/* Actions */}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {confirmDelete ? (
              <><Btn variant="danger" size="sm" onClick={onDelete}>Confirm Delete</Btn><Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn></>
            ) : (
              <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>Delete Project</Btn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
