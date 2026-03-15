import { useState } from "react";
import { Sparkles, CheckSquare, Diamond, ChevronUp } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { callAIForEntity } from "../lib/ai";
import { PageLayout } from "../components/layout/PageLayout";
import { useEntityStore } from "../store/entityStore";
import { AIPanel, renderMarkdown } from "../components/ui/index";

export default function Meetings() {
  const { meetings } = useEntityStore();
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");

  const sorted = [...meetings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filtered = search.trim() ? sorted.filter(m => m.title.toLowerCase().includes(search.toLowerCase()) || (m.attendees || "").toLowerCase().includes(search.toLowerCase()) || (m.summary || "").toLowerCase().includes(search.toLowerCase())) : sorted;

  return (
    <PageLayout maxWidth={760} largePadding>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Meetings</h1>
            <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, fontFamily: FONT_BODY }}>A log of meetings you've ingested. Ask BC anything about any of them.</p>
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary, marginTop: 4 }}>{meetings.length} logged</span>
        </div>
      </div>
      {meetings.length > 0 && (
        <div style={{ position: "relative", marginBottom: 20 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meetings..." style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: "9px 14px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
      )}
      {filtered.length === 0 ? (
        meetings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 32, color: C.borderDefault, marginBottom: 16 }}>◎</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: C.textSecondary, marginBottom: 8 }}>No meetings logged yet</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, maxWidth: 340, margin: "0 auto" }}>Go to Intel → Extract, switch to <strong style={{ color: C.textSecondary }}>Meeting</strong> mode, and paste your notes.</div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>No meetings match "{search}"</div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(m => <MeetingCard key={m.id} meeting={m} expanded={expandedId === m.id} onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)} />)}
        </div>
      )}
    </PageLayout>
  );
}

function MeetingCard({ meeting, expanded, onToggle }) {
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [headerHovered, setHeaderHovered] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  async function askBC() {
    const q = customPrompt.trim(); if (!q || aiLoading) return;
    setCustomPrompt(""); setAiLoading(true); setAiError(""); setAiResponse("");
    try {
      const ctx = `Meeting: ${meeting.title}\nDate: ${meeting.date}\nAttendees: ${meeting.attendees || "not specified"}\nSummary: ${meeting.summary}`;
      const response = await callAIForEntity("meeting", meeting.id, `${ctx}\n\nQuestion: ${q}`);
      setAiResponse(response);
    } catch (err) { setAiError(err.message); } finally { setAiLoading(false); }
  }

  const { extractedCounts: ec = {} } = meeting;
  const totalExtracted = (ec.tasks || 0) + (ec.decisions || 0) + (ec.priorities || 0);
  const dateLabel = meeting.date ? new Date(meeting.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "No date";

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, overflow: "hidden" }}>
      <div onClick={onToggle} onMouseEnter={() => setHeaderHovered(true)} onMouseLeave={() => setHeaderHovered(false)}
        style={{ padding: "16px 18px", cursor: "pointer", background: headerHovered ? C.bgCardHover : "transparent", transition: "background 0.15s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.4, flex: 1 }}>{meeting.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, fontFamily: FONT_MONO, fontSize: 11, color: headerHovered ? C.gold : C.textSecondary, border: `1px solid ${headerHovered ? C.gold : C.borderDefault}`, borderRadius: 10, padding: "2px 8px", transition: "all 0.15s" }}>{expanded ? "▴ Close" : "▾ Open"}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>◎ {dateLabel}</span>
          {meeting.attendees && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>· {meeting.attendees}</span>}
          {totalExtracted > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>· {ec.tasks > 0 && `${ec.tasks}t `}{ec.decisions > 0 && `${ec.decisions}d `}{ec.priorities > 0 && `${ec.priorities}p`} extracted</span>}
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}`, padding: "16px 18px" }}>
          {meeting.summary && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>BC Summary</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.7, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 8, padding: "12px 14px" }}>{meeting.summary}</div>
            </div>
          )}
          {totalExtracted > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {ec.tasks > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue, background: `${C.blue}18`, padding: "3px 10px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><CheckSquare size={11} /> {ec.tasks} task{ec.tasks !== 1 ? "s" : ""}</span>}
              {ec.decisions > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, background: `${C.gold}18`, padding: "3px 10px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><Diamond size={11} /> {ec.decisions} decision{ec.decisions !== 1 ? "s" : ""}</span>}
              {ec.priorities > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.amber, background: `${C.amber}18`, padding: "3px 10px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><ChevronUp size={11} /> {ec.priorities} priorit{ec.priorities !== 1 ? "ies" : "y"}</span>}
            </div>
          )}
          {meeting.rawContent && (
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => setShowRaw(r => !r)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textDecoration: "underline" }}>{showRaw ? "Hide original" : "Show original content"}</button>
              {showRaw && <div style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "10px 14px", maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap" }}>{meeting.rawContent}</div>}
            </div>
          )}
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ask BC</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && askBC()} placeholder="What decisions came out of this?..." disabled={aiLoading} style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "7px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }} />
            <button onClick={askBC} disabled={!customPrompt.trim() || aiLoading} style={{ background: customPrompt.trim() && !aiLoading ? C.gold : "transparent", border: `1px solid ${customPrompt.trim() && !aiLoading ? C.gold : C.borderAI}`, borderRadius: 6, padding: "7px 14px", cursor: customPrompt.trim() && !aiLoading ? "pointer" : "not-allowed", color: customPrompt.trim() && !aiLoading ? C.bgPrimary : C.textTertiary, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600 }}><Sparkles size={12} /></button>
          </div>
          <AIPanel response={aiResponse} loading={aiLoading} error={aiError} />
        </div>
      )}
    </div>
  );
}
