import { useState, useEffect, useRef } from "react";
import { MessageSquare, Zap, Sparkles, Send, X, CheckSquare, Diamond, ChevronUp, Copy, Check } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { store } from "../lib/storage";
import { callAI } from "../lib/ai";
import { PageLayout } from "../components/layout/PageLayout";
import { INGEST_PROMPT, RESPOND_TO_PROMPT, RESPONSE_STYLES, RESPONSE_TONES } from "../lib/prompts";
import { genId, isoNow, safeParse } from "../lib/utils";
import { useEntityStore } from "../store/entityStore";
import { Btn, Badge, renderMarkdown } from "../components/ui/index";

export default function Intel() {
  const { decisions, tasks, priorities, projects, ingestSessions, setIngestSessions, setDecisions, setTasks, setPriorities, setMeetings } = useEntityStore();
  const [intelTab, setIntelTab] = useState("chat");
  const [hoveredTab, setHoveredTab] = useState(null);

  return (
    <PageLayout maxWidth={760} largePadding>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Intel</h1>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, fontFamily: FONT_BODY }}>
          {intelTab === "chat" ? "Think with BC — strategy, analysis, and open conversation." : "Paste any content — BC extracts what matters and drafts responses."}
        </p>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.borderDefault}`, paddingBottom: 0 }}>
        {[{ id: "chat", label: "Command Chat", icon: MessageSquare }, { id: "extract", label: "Extract", icon: Zap }].map(tab => {
          const active = intelTab === tab.id;
          const hovered = hoveredTab === tab.id;
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setIntelTab(tab.id)} onMouseEnter={() => setHoveredTab(tab.id)} onMouseLeave={() => setHoveredTab(null)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", cursor: "pointer", background: "none", border: "none",
                borderBottom: `2px solid ${active ? C.gold : "transparent"}`, color: active ? C.textPrimary : hovered ? C.textPrimary : C.textSecondary,
                fontFamily: FONT_SANS, fontSize: 14, fontWeight: active ? 600 : 500, transition: "all 0.15s ease", marginBottom: -1 }}>
              <Icon size={16} strokeWidth={active ? 2 : 1.75} style={{ opacity: active ? 1 : 0.7 }} />{tab.label}
            </button>
          );
        })}
      </div>
      {intelTab === "chat" && <CommandChat decisions={decisions} tasks={tasks} priorities={priorities} projects={projects} />}
      {intelTab === "extract" && <ExtractView />}
    </PageLayout>
  );
}

// ─── Command Chat ────────────────────────────────────────────────────────────
function CommandChat({ decisions, tasks, priorities, projects }) {
  const CACHE_KEY = `bc2-${store._ws}-intel-chat-history`;
  const [messages, setMessages] = useState(() => safeParse(localStorage.getItem(CACHE_KEY), []));
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { localStorage.setItem(CACHE_KEY, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  function buildSystemPrompt() {
    const snapshot = {
      tasks: tasks.slice(-20).map(t => ({ title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate })),
      decisions: decisions.slice(-10).map(d => ({ title: d.title, status: d.status })),
      priorities: priorities.map(p => ({ title: p.title, status: p.status, healthScore: p.healthScore })),
      projects: projects.slice(-8).map(p => ({ title: p.title, status: p.status })),
    };
    return `You are BC (Base Command), an executive decision intelligence co-pilot in Command Chat.\n\nWorkspace state:\n${JSON.stringify(snapshot)}\n\nToday: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}\n\nGUIDELINES:\n- Be direct, strategic, specific. Reference actual tasks, decisions, priorities by name.\n- Help them think — push back on fuzzy thinking, surface tradeoffs.\n- Format with markdown. **Bold** key points. Keep responses focused.`;
  }

  async function handleSend() {
    const text = input.trim(); if (!text || sending) return;
    setInput(""); setSending(true);
    const userMsg = { role: "user", content: text, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await callAI(apiMessages, buildSystemPrompt(), 4000);
      setMessages(prev => [...prev, { role: "assistant", content: response.toString(), timestamp: new Date().toISOString() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${err.message}`, timestamp: new Date().toISOString(), isError: true }]);
    }
    setSending(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 280px)", minHeight: 400 }}>
      <div style={{ flex: 1, overflow: "auto", marginBottom: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 16, padding: "60px 0", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.gold}20, ${C.aiBlue}20)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={28} style={{ color: C.aiBlue }} />
            </div>
            <div>
              <h3 style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 600, color: C.textPrimary, margin: "0 0 6px" }}>Command Chat</h3>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, maxWidth: 400, lineHeight: 1.5, margin: 0 }}>Open conversation with BC. Ask about priorities, think through decisions, prep for meetings.</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
              {["What should I focus on today?", "Help me prep for tomorrow's meeting", "What decisions are stalling?"].map((s, i) => (
                <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }} style={{
                  padding: "8px 14px", borderRadius: 8, cursor: "pointer", background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                  color: C.textSecondary, fontFamily: FONT_BODY, fontSize: 13, transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.color = C.textPrimary; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", gap: 12, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: msg.role === "user" ? C.goldMuted : C.aiBlueMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {msg.role === "user" ? <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, color: C.gold }}>M</span> : <Sparkles size={14} style={{ color: C.aiBlue }} />}
            </div>
            <div style={{ maxWidth: "80%", padding: "12px 16px", borderRadius: 12, background: msg.role === "user" ? C.bgElevated : C.bgAI, border: `1px solid ${msg.role === "user" ? C.borderSubtle : C.borderAI}`, ...(msg.isError ? { borderColor: C.red + "40" } : {}) }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textPrimary, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginTop: 6, textAlign: msg.role === "user" ? "right" : "left" }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: C.aiBlueMuted, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={14} style={{ color: C.aiBlue }} /></div>
            <div style={{ padding: "12px 16px", borderRadius: 12, background: C.bgAI, border: `1px solid ${C.borderAI}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, animation: "aiPulse 1.5s ease-in-out infinite" }}>Thinking...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12, padding: 8 }}>
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask BC anything..." rows={1}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 14, padding: "8px 12px", resize: "none", lineHeight: 1.5, maxHeight: 120, overflow: "auto" }}
          onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
        />
        <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "0 4px 4px" }}>
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); localStorage.removeItem(CACHE_KEY); }} title="Clear chat" style={{ background: "none", border: "none", cursor: "pointer", color: C.textTertiary, padding: 4, borderRadius: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = C.red} onMouseLeave={e => e.currentTarget.style.color = C.textTertiary}><X size={16} /></button>
          )}
          <button onClick={handleSend} disabled={!input.trim() || sending} style={{
            background: input.trim() && !sending ? `linear-gradient(135deg, ${C.gold}, ${C.goldHover})` : C.bgSurface,
            border: "none", borderRadius: 8, cursor: input.trim() && !sending ? "pointer" : "not-allowed",
            padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
          }}><Send size={16} style={{ color: input.trim() && !sending ? "#fff" : C.textTertiary }} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Extract View ────────────────────────────────────────────────────────────
function ExtractView() {
  const { setDecisions, setTasks, setPriorities, setMeetings, ingestSessions, setIngestSessions } = useEntityStore();
  const [sourceType, setSourceType] = useState("general");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0]);
  const [meetingAttendees, setMeetingAttendees] = useState("");
  const [responseStyle, setResponseStyle] = useState("Direct");
  const [responseTone, setResponseTone] = useState("Conversational");
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState({});
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const TYPE_META = {
    task: { label: "Task", color: C.blue, icon: <CheckSquare size={11} /> },
    decision: { label: "Decision", color: C.gold, icon: <Diamond size={11} /> },
    priority: { label: "Priority", color: C.amber, icon: <ChevronUp size={11} /> },
  };

  async function process_() {
    if (!input.trim() || processing) return;
    setProcessing(true); setResult(null); setCreated(null); setError(null);
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const context = `Today: ${today}`;
    try {
      const promptContent = sourceType === "respond_to" ? RESPOND_TO_PROMPT(input.trim(), responseStyle, responseTone, context) : INGEST_PROMPT(input.trim(), context);
      const raw = await callAI([{ role: "user", content: promptContent }], "You are a precise data extraction system. Return only valid JSON as instructed.");
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
      const sel = {}; (parsed.items || []).forEach((_, i) => { sel[i] = sourceType !== "respond_to"; }); setSelected(sel);
      const sessionId = `ingest_${Date.now()}`; setCurrentSessionId(sessionId);
      const session = { id: sessionId, mode: sourceType, responseStyle: sourceType === "respond_to" ? responseStyle : null, responseTone: sourceType === "respond_to" ? responseTone : null, draftedResponse: parsed.drafted_response || null, responseNotes: parsed.response_notes || null, meetingTitle: sourceType === "meeting" ? meetingTitle.trim() : null, meetingDate: sourceType === "meeting" ? meetingDate : null, rawContent: input.trim(), bcResponse: parsed.bc_response || null, allItems: parsed.items || [], createdAt: isoNow(), updatedAt: isoNow() };
      await store.save("ingest", session);
      setIngestSessions(await store.list("ingest"));
    } catch (e) { setError("Failed to process content. Check the API connection and try again."); }
    finally { setProcessing(false); }
  }

  async function commit() {
    if (!result || creating) return;
    setCreating(true);
    const counts = { tasks: 0, decisions: 0, priorities: 0 }; const ts = isoNow();
    for (const [i, item] of (result.items || []).entries()) {
      if (!selected[i]) continue;
      const id = `${item.type}_${Date.now()}_${i}`;
      if (item.type === "task") { await store.save("task", { id, title: item.title, description: item.description || "", status: "open", priority: item.priority || "medium", dueDate: item.dueDate || null, source: "ingest", ingestSessionId: currentSessionId, subtasks: [], tags: [], createdAt: ts, updatedAt: ts }); counts.tasks++; }
      else if (item.type === "decision") { await store.save("decision", { id, title: item.title, context: item.context || item.description || "", status: "draft", options: [], source: "ingest", ingestSessionId: currentSessionId, tags: [], createdAt: ts, updatedAt: ts }); counts.decisions++; }
      else if (item.type === "priority") { const existing = await store.list("priority"); await store.save("priority", { id, title: item.title, description: item.description || "", rank: existing.length + 1, timeframe: item.timeframe || "this_quarter", status: "active", healthScore: null, source: "ingest", ingestSessionId: currentSessionId, tags: [], createdAt: ts, updatedAt: ts }); counts.priorities++; }
    }
    if (sourceType === "meeting") {
      await store.save("meeting", { id: `meeting_${Date.now()}`, title: meetingTitle.trim() || `Meeting — ${meetingDate}`, date: meetingDate, attendees: meetingAttendees.trim(), summary: result.bc_response || "", rawContent: input.trim(), extractedCounts: counts, createdAt: ts, updatedAt: ts });
      setMeetings(await store.list("meeting"));
    }
    const [d, t, p] = await Promise.all([store.list("decision"), store.list("task"), store.list("priority")]);
    setDecisions(d); setTasks(t); setPriorities(p);
    setCreated(counts); setCreating(false); setResult(null); setSelected({}); setInput("");
  }

  function reset() { setResult(null); setCreated(null); setError(null); setInput(""); setSourceType("general"); setCopied(false); setCurrentSessionId(null); }

  // ─── Render ───
  if (created) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px", background: `${C.green}15`, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={28} style={{ color: C.green }} /></div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>{sourceType === "meeting" ? "Meeting Logged" : "Items Created"}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, marginBottom: 28, lineHeight: 1.8 }}>
          {created.decisions > 0 && <span>{created.decisions} decision{created.decisions !== 1 ? "s" : ""} created<br/></span>}
          {created.tasks > 0 && <span>{created.tasks} task{created.tasks !== 1 ? "s" : ""} created<br/></span>}
          {created.priorities > 0 && <span>{created.priorities} priorit{created.priorities !== 1 ? "ies" : "y"} created<br/></span>}
          {(created.decisions + created.tasks + created.priorities) === 0 && <span>No items extracted</span>}
        </div>
        <button onClick={reset} style={{ background: C.gold, color: C.bgPrimary, border: "none", borderRadius: 6, padding: "10px 24px", fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Extract More</button>
      </div>
    );
  }

  if (result) {
    return (
      <div>
        {/* Drafted response for respond_to mode */}
        {sourceType === "respond_to" && result.drafted_response && (
          <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>Drafted Response</span>
              <button onClick={() => { navigator.clipboard.writeText(result.drafted_response); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? C.green : C.textTertiary, display: "flex", alignItems: "center", gap: 4, fontFamily: FONT_MONO, fontSize: 11 }}>
                {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result.drafted_response}</div>
            {result.response_notes && <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, fontStyle: "italic" }}>{result.response_notes}</div>}
          </div>
        )}
        {/* BC analysis */}
        {result.bc_response && sourceType !== "respond_to" && (
          <div style={{ background: C.bgAI, border: `1px solid ${C.borderAI}`, borderLeft: `2px solid ${C.aiBlue}40`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>{result.bc_response}</div>
          </div>
        )}
        {/* Extracted items */}
        {(result.items || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 10 }}>Extracted Items ({result.items.length})</div>
            {result.items.map((item, i) => {
              const meta = TYPE_META[item.type] || TYPE_META.task;
              return (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: selected[i] ? `${meta.color}08` : "transparent", border: `1px solid ${selected[i] ? meta.color + "30" : C.borderDefault}`, borderRadius: 8, marginBottom: 6, cursor: "pointer" }}
                  onClick={() => setSelected(p => ({ ...p, [i]: !p[i] }))}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected[i] ? meta.color : "#444"}`, background: selected[i] ? meta.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, color: "#fff", fontSize: 11, fontWeight: 700 }}>{selected[i] ? "✓" : ""}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <Badge label={meta.label} color={meta.color} />
                      {item.priority && <Badge label={item.priority} />}
                    </div>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textPrimary }}>{item.title}</div>
                    {item.description && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>{item.description}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="primary" onClick={commit} disabled={creating || Object.values(selected).filter(Boolean).length === 0}>
            {creating ? "Creating..." : `Create ${Object.values(selected).filter(Boolean).length} items`}
          </Btn>
          <Btn variant="ghost" onClick={reset}>Start Over</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Source type toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ id: "general", label: "⊕ General" }, { id: "meeting", label: "◎ Meeting" }, { id: "respond_to", label: "↩ Respond To" }].map(({ id, label }) => (
          <button key={id} onClick={() => setSourceType(id)} style={{
            padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600,
            border: `1px solid ${sourceType === id ? C.borderSubtle : C.borderDefault}`,
            background: sourceType === id ? "rgba(255,255,255,0.08)" : "transparent",
            color: sourceType === id ? C.textPrimary : C.textSecondary, transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Respond To options */}
      {sourceType === "respond_to" && (
        <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Style</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {RESPONSE_STYLES.map(s => (<button key={s} onClick={() => setResponseStyle(s)} style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, border: `1px solid ${responseStyle === s ? C.borderSubtle : C.borderDefault}`, background: responseStyle === s ? "rgba(255,255,255,0.08)" : "transparent", color: responseStyle === s ? C.textPrimary : C.textSecondary }}>{s}</button>))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tone</div>
            <div style={{ display: "flex", gap: 6 }}>
              {RESPONSE_TONES.map(t => (<button key={t} onClick={() => setResponseTone(t)} style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, border: `1px solid ${responseTone === t ? C.borderSubtle : C.borderDefault}`, background: responseTone === t ? "rgba(255,255,255,0.08)" : "transparent", color: responseTone === t ? C.textPrimary : C.textSecondary }}>{t}</button>))}
            </div>
          </div>
        </div>
      )}

      {/* Meeting metadata */}
      {sourceType === "meeting" && (
        <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: 16, marginBottom: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "2 1 200px" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Meeting Title</div>
            <input value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} placeholder="e.g. Q2 Renewal Review" style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "6px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: "1 1 130px" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</div>
            <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "6px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", colorScheme: "dark", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: "2 1 200px" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Attendees</div>
            <input value={meetingAttendees} onChange={e => setMeetingAttendees(e.target.value)} placeholder="e.g. Sarah, Tom" style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "6px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
      )}

      {/* Main input */}
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={sourceType === "respond_to" ? "Paste the email, Slack message, or communication to respond to..." : sourceType === "meeting" ? "Paste meeting notes, transcript, or summary..." : "Paste anything — emails, notes, Slack threads, meeting notes..."}
        rows={10} style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: 16, color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", marginBottom: 12 }}
        onFocus={e => e.target.style.borderColor = C.borderSubtle} onBlur={e => e.target.style.borderColor = C.borderDefault} />

      {error && <div style={{ color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <Btn variant="primary" onClick={process_} disabled={!input.trim() || processing}>
        <Sparkles size={14} /> {processing ? "Processing..." : sourceType === "respond_to" ? "Draft Response" : sourceType === "meeting" ? "Process Meeting" : "Extract Items"}
      </Btn>
    </div>
  );
}
