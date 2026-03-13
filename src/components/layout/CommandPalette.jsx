import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Diamond, CheckSquare, ChevronUp } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { statusColor } from "../../lib/utils";
import { Badge } from "../ui/index";
import { useEntityStore } from "../../store/entityStore";

export default function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const { decisions, tasks, priorities, projects } = useEntityStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function nav(path) { navigate(path); onClose(); }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = query.toLowerCase().trim();
      if (!q) { setResults([]); setSelectedIdx(0); return; }

      // Action shortcuts
      if (q.startsWith("/")) {
        const actions = [
          { type: "action", label: "Intel", cmd: "/intel", action: () => nav("/app/intel") },
          { type: "action", label: "Meeting Log", cmd: "/meetings", action: () => nav("/app/meetings") },
          { type: "action", label: "New Decision", cmd: "/new decision", action: () => nav("/app/decisions") },
          { type: "action", label: "New Task", cmd: "/new task", action: () => nav("/app/tasks") },
          { type: "action", label: "Projects", cmd: "/projects", action: () => nav("/app/projects") },
          { type: "action", label: "Library", cmd: "/library", action: () => nav("/app/library") },
          { type: "action", label: "Renewals", cmd: "/renewals", action: () => nav("/app/renewals") },
          { type: "action", label: "Weekly Briefing", cmd: "/briefing", action: () => nav("/app") },
          { type: "action", label: "Export Data", cmd: "/export", action: () => nav("/app/settings") },
        ].filter(a => a.cmd.includes(q));
        setResults(actions);
        setSelectedIdx(0);
        return;
      }

      const hits = [];
      decisions.forEach(d => {
        if (d.title?.toLowerCase().includes(q) || (d.tags || []).some(t => t.toLowerCase().includes(q))) {
          hits.push({ type: "decision", icon: <Diamond size={13} />, entity: d, action: () => nav("/app/decisions") });
        }
      });
      tasks.forEach(t => {
        if (t.title?.toLowerCase().includes(q) || (t.tags || []).some(tag => tag.toLowerCase().includes(q))) {
          hits.push({ type: "task", icon: <CheckSquare size={13} />, entity: t, action: () => nav("/app/tasks") });
        }
      });
      priorities.forEach(p => {
        if (p.title?.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q))) {
          hits.push({ type: "priority", icon: <ChevronUp size={13} />, entity: p, action: () => nav("/app/priorities") });
        }
      });
      projects.forEach(p => {
        if (p.title?.toLowerCase().includes(q)) {
          hits.push({ type: "project", icon: <Diamond size={13} />, entity: p, action: () => nav("/app/projects") });
        }
      });
      setResults(hits.slice(0, 12));
      setSelectedIdx(0);
    }, 200);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIdx]) { results[selectedIdx].action(); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(1,4,9,0.80)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 2000,
      display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C.bgElevated, border: `1px solid ${C.borderSubtle}`, borderRadius: 14,
        width: "100%", maxWidth: 580, overflow: "hidden",
        boxShadow: "0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.borderDefault}` }}>
          <span style={{ color: C.textTertiary, fontSize: 16, opacity: 0.6 }}>⌕</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search or type / for commands..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 400, letterSpacing: "-0.01em" }}
          />
          <kbd style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.06)" }}>ESC</kbd>
        </div>

        {results.length > 0 && (
          <div style={{ maxHeight: 380, overflow: "auto", padding: "4px 0" }}>
            {results.map((r, i) => (
              <button key={i} onClick={r.action} style={{
                width: "100%", background: i === selectedIdx ? "rgba(255,255,255,0.06)" : "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", textAlign: "left", transition: "background 0.1s ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; setSelectedIdx(i); }}
                onMouseLeave={e => { if (i !== selectedIdx) e.currentTarget.style.background = "none"; }}
              >
                {r.type === "action" ? (
                  <>
                    <span style={{ color: C.gold, fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600 }}>/</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textPrimary, fontWeight: 500 }}>{r.label}</span>
                    <span style={{ marginLeft: "auto", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{r.cmd}</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: C.textTertiary, fontSize: 13, opacity: 0.7 }}>{r.icon}</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textPrimary, flex: 1, fontWeight: 450 }}>{r.entity.title}</span>
                    <Badge label={r.entity.status} color={statusColor(r.entity.status)} />
                  </>
                )}
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div style={{ padding: "24px 18px", fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, textAlign: "center" }}>No results for "{query}"</div>
        )}

        {!query && (
          <div style={{ padding: "14px 18px" }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600, color: C.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Quick actions</div>
            {[
              { cmd: "/new decision", label: "Create a new decision" },
              { cmd: "/new task", label: "Create a new task" },
              { cmd: "/intel", label: "Open Command Chat" },
              { cmd: "/briefing", label: "Get your strategic briefing" },
              { cmd: "/export", label: "Export your data" },
            ].map(item => (
              <div key={item.cmd} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.gold, fontWeight: 500, minWidth: 120 }}>{item.cmd}</span>
                <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
