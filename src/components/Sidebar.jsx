// ─── Sidebar + Workspace Switcher + Command Palette ──────────────────────────
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Inbox, Diamond, CheckSquare, TrendingUp,
  FolderKanban, Users, Library, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, ChevronUp, Search,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, R, S, HOVER } from "../theme/tokens.js";
import { WS_DEFAULT_ID } from "../lib/store.js";
import { statusColor } from "../lib/helpers.js";
import { Badge } from "./ui.jsx";

// ─── Workspace Switcher ───────────────────────────────────────────────────────
function WorkspaceSwitcher({ workspaces, activeWsId, onSwitch, onCreate, onRename, onDelete, collapsed }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const ref = useRef(null);

  const activeWs = workspaces.find(w => w.id === activeWsId) || { name: "Default", icon: "" };

  useEffect(() => {
    if (!open) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (collapsed) {
    return (
      <div style={{ padding: "0 0 8px", display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => setOpen(!open)}
          title={activeWs.name}
          aria-label={`Switch workspace (current: ${activeWs.name})`}
          style={{
            width: 28, height: 28, borderRadius: R.sm + 2, border: `1px solid ${C.borderDefault}`,
            background: C.bgCard, color: C.gold, fontFamily: FONT_SANS, fontSize: 12,
            fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {activeWs.icon || activeWs.name.charAt(0).toUpperCase()}
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ padding: "0 12px 8px", position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Switch workspace (current: ${activeWs.name})`}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: S.sm,
          padding: "7px 10px", borderRadius: R.sm + 2, cursor: "pointer",
          background: open ? C.bgCardHover : "transparent",
          border: `1px solid ${open ? C.borderSubtle : "transparent"}`,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = C.bgCardHover; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{
          width: 22, height: 22, borderRadius: 5, background: C.goldMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: C.gold, fontFamily: FONT_SANS, flexShrink: 0,
        }}>
          {activeWs.icon || activeWs.name.charAt(0).toUpperCase()}
        </span>
        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {activeWs.name}
        </span>
        <span style={{ fontSize: 11, color: C.textTertiary, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {open && (
        <div role="menu" style={{
          position: "absolute", top: "100%", left: 12, right: 12, zIndex: 200,
          background: C.bgElevated, border: `1px solid ${C.borderSubtle}`,
          borderRadius: R.md, padding: S.xs, marginTop: S.xs,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}>
          {workspaces.map(ws => (
            <div key={ws.id} role="menuitem">
              {renamingId === ws.id ? (
                <div style={{ display: "flex", gap: S.xs, padding: "4px 6px" }}>
                  <input
                    autoFocus
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && renameVal.trim()) { onRename(ws.id, renameVal); setRenamingId(null); }
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    aria-label="Rename workspace"
                    style={{
                      flex: 1, background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                      borderRadius: R.sm, padding: "4px 8px", color: C.textPrimary,
                      fontFamily: FONT_SANS, fontSize: 12, outline: "none",
                    }}
                  />
                  <button onClick={() => { if (renameVal.trim()) { onRename(ws.id, renameVal); setRenamingId(null); } }}
                    aria-label="Confirm rename"
                    style={{ background: "none", border: "none", color: C.green, cursor: "pointer", fontSize: 12 }}>✓</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => { onSwitch(ws.id); setOpen(false); }}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", gap: S.sm,
                      padding: "7px 8px", borderRadius: 5, cursor: "pointer",
                      background: ws.id === activeWsId ? C.goldMuted : "transparent",
                      border: "none", textAlign: "left", transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { if (ws.id !== activeWsId) e.currentTarget.style.background = HOVER.subtle; }}
                    onMouseLeave={e => { if (ws.id !== activeWsId) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{
                      width: 20, height: 20, borderRadius: R.sm, background: ws.id === activeWsId ? C.gold + "20" : C.bgSurface,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: ws.id === activeWsId ? C.gold : C.textTertiary, fontFamily: FONT_SANS,
                    }}>
                      {ws.icon || ws.name.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: ws.id === activeWsId ? C.textPrimary : C.textSecondary }}>
                      {ws.name}
                    </span>
                    {ws.id === activeWsId && <span style={{ fontSize: 10, color: C.gold, marginLeft: "auto" }}>●</span>}
                  </button>
                  <button
                    onClick={() => { setRenamingId(ws.id); setRenameVal(ws.name); }}
                    aria-label={`Rename ${ws.name}`}
                    style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 10, padding: "4px", flexShrink: 0 }}
                  >✎</button>
                  {ws.id !== WS_DEFAULT_ID && (
                    confirmDeleteId === ws.id ? (
                      <button
                        onClick={() => { onDelete(ws.id); setConfirmDeleteId(null); setOpen(false); }}
                        aria-label={`Confirm delete ${ws.name}`}
                        style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 10, padding: "4px", flexShrink: 0 }}
                      >✓</button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(ws.id)}
                        aria-label={`Delete ${ws.name}`}
                        style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 10, padding: "4px", flexShrink: 0 }}
                      >✕</button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}

          <div style={{ height: 1, background: C.borderDefault, margin: "4px 6px" }} role="separator" />

          {creating ? (
            <div style={{ padding: "4px 6px" }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Workspace name..."
                aria-label="New workspace name"
                onKeyDown={e => {
                  if (e.key === "Enter" && newName.trim()) { onCreate(newName); setNewName(""); setCreating(false); setOpen(false); }
                  if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
                style={{
                  width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                  borderRadius: R.sm, padding: "6px 8px", color: C.textPrimary,
                  fontFamily: FONT_SANS, fontSize: 12, outline: "none",
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: S.sm,
                padding: "7px 8px", borderRadius: 5, cursor: "pointer",
                background: "transparent", border: "none", textAlign: "left",
              }}
              onMouseEnter={e => e.currentTarget.style.background = HOVER.subtle}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ width: 20, height: 20, borderRadius: R.sm, background: C.bgSurface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.textTertiary }}>+</span>
              <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textTertiary }}>New Workspace</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Command Palette ──────────────────────────────────────────────────────────
export function CommandPalette({ onClose, setView, decisions, tasks, priorities }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = query.toLowerCase().trim();
      if (!q) { setResults([]); return; }

      if (q.startsWith("/")) {
        const actions = [
          { type: "action", label: "Ingest Content", cmd: "/ingest", action: () => { setView("ingest"); onClose(); } },
          { type: "action", label: "Meeting Log", cmd: "/meetings", action: () => { setView("meetings"); onClose(); } },
          { type: "action", label: "New Decision", cmd: "/new decision", action: () => { setView("decisions"); onClose(); } },
          { type: "action", label: "New Task", cmd: "/new task", action: () => { setView("tasks"); onClose(); } },
          { type: "action", label: "Projects", cmd: "/projects", action: () => { setView("projects"); onClose(); } },
          { type: "action", label: "Library", cmd: "/library", action: () => { setView("library"); onClose(); } },
          { type: "action", label: "Weekly Briefing", cmd: "/briefing", action: () => { setView("dashboard"); onClose(); } },
          { type: "action", label: "Export Data", cmd: "/export", action: () => { setView("settings"); onClose(); } },
        ].filter(a => a.cmd.includes(q));
        setResults(actions);
        return;
      }

      const hits = [];
      decisions.forEach(d => {
        if (d.title?.toLowerCase().includes(q) || (d.tags || []).some(t => t.toLowerCase().includes(q))) {
          hits.push({ type: "decision", icon: <Diamond size={13} />, entity: d, action: () => { setView("decisions"); onClose(); } });
        }
      });
      tasks.forEach(t => {
        if (t.title?.toLowerCase().includes(q) || (t.tags || []).some(tag => tag.toLowerCase().includes(q))) {
          hits.push({ type: "task", icon: <CheckSquare size={13} />, entity: t, action: () => { setView("tasks"); onClose(); } });
        }
      });
      priorities.forEach(p => {
        if (p.title?.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q))) {
          hits.push({ type: "priority", icon: <ChevronUp size={13} />, entity: p, action: () => { setView("priorities"); onClose(); } });
        }
      });
      setResults(hits.slice(0, 10));
    }, 200);
  }, [query]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(1,4,9,0.80)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 2000,
        display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="bc-modal-content" style={{
        background: C.bgElevated, border: `1px solid ${C.borderSubtle}`, borderRadius: R.xl,
        width: "100%", maxWidth: 580, overflow: "hidden",
        boxShadow: "0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: S.md, padding: "14px 18px", borderBottom: `1px solid ${C.borderDefault}` }}>
          <span style={{ color: C.textTertiary, fontSize: 16, opacity: 0.6 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") onClose(); }}
            placeholder="Search or type / for commands..."
            aria-label="Search commands and entities"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 400,
              letterSpacing: "-0.01em",
            }}
          />
          <kbd style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, background: HOVER.default, padding: "3px 8px", borderRadius: 5, border: `1px solid ${HOVER.default}` }}>ESC</kbd>
        </div>
        {results.length > 0 && (
          <div style={{ maxHeight: 380, overflow: "auto", padding: "4px 0" }} role="listbox">
            {results.map((r, i) => (
              <button key={i} onClick={r.action} role="option" style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: S.md,
                padding: "10px 18px", textAlign: "left",
                transition: "background 0.1s ease",
              }}
                onMouseEnter={e => e.currentTarget.style.background = HOVER.subtle}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
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
              { cmd: "/briefing", label: "Get your strategic briefing" },
              { cmd: "/export", label: "Export your data" },
            ].map(item => (
              <div key={item.cmd} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.gold, fontWeight: 500, minWidth: 110 }}>{item.cmd}</span>
                <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({ activeView, setView, collapsed, setCollapsed, aiNotifications, workspaces, activeWsId, onSwitchWorkspace, onCreateWorkspace, onRenameWorkspace, onDeleteWorkspace, onToggleMobile }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const isExpanded = !collapsed;

  const navSections = [
    { label: "Command", items: [
      { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { id: "ingest", icon: Inbox, label: "Ingest" },
    ]},
    { label: "Work", items: [
      { id: "decisions", icon: Diamond, label: "Decisions" },
      { id: "tasks", icon: CheckSquare, label: "Tasks" },
      { id: "priorities", icon: TrendingUp, label: "Priorities" },
      { id: "projects", icon: FolderKanban, label: "Projects" },
    ]},
    { label: "Reference", items: [
      { id: "meetings", icon: Users, label: "Meetings" },
      { id: "library", icon: Library, label: "Library" },
    ]},
  ];

  return (
    <nav
      className={`bc-sidebar ${collapsed ? "collapsed" : ""}`}
      aria-label="Main navigation"
      style={{
        width: isExpanded ? 240 : 56,
        minWidth: isExpanded ? 240 : 56,
        background: C.bgSidebar,
        borderRight: `1px solid ${C.borderDefault}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: isExpanded ? "20px 20px 16px" : "20px 0 16px", display: "flex", alignItems: "center", gap: 10, justifyContent: isExpanded ? "space-between" : "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: R.md,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: C.bgSidebar,
            fontFamily: FONT_MONO, flexShrink: 0,
          }}>B</div>
          {isExpanded && (
            <span style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 17, color: C.textPrimary, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
              Base Command
            </span>
          )}
        </div>
        {isExpanded && (
          <button onClick={() => { setCollapsed(true); localStorage.setItem("bc2-ui:sidebar-collapsed", "true"); }} aria-label="Collapse sidebar" style={{
            background: HOVER.subtle, border: "none", color: C.textTertiary, cursor: "pointer",
            fontSize: 12, padding: "4px 6px", borderRadius: R.sm + 2, transition: "all 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = HOVER.strong}
            onMouseLeave={e => e.currentTarget.style.background = HOVER.subtle}
          ><ChevronLeft size={14} /></button>
        )}
      </div>

      {!isExpanded && (
        <button onClick={() => { setCollapsed(false); localStorage.setItem("bc2-ui:sidebar-collapsed", "false"); }} aria-label="Expand sidebar" style={{
          background: "none", border: "none", color: C.textTertiary, cursor: "pointer",
          fontSize: 14, padding: "6px 0", marginBottom: 4, width: "100%",
          transition: "color 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = C.textPrimary}
          onMouseLeave={e => e.currentTarget.style.color = C.textTertiary}
        ><ChevronRight size={14} /></button>
      )}

      <WorkspaceSwitcher
        workspaces={workspaces}
        activeWsId={activeWsId}
        onSwitch={onSwitchWorkspace}
        onCreate={onCreateWorkspace}
        onRename={onRenameWorkspace}
        onDelete={onDeleteWorkspace}
        collapsed={!isExpanded}
      />

      <div style={{ flex: 1, padding: "4px 0", overflow: "hidden" }}>
        {navSections.map((section, si) => (
          <div key={si} style={{ marginBottom: S.sm }}>
            {isExpanded && (
              <div style={{
                fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, color: C.textTertiary,
                padding: "8px 20px 4px", textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{section.label}</div>
            )}
            {!isExpanded && si > 0 && (
              <div style={{ width: 20, height: 1, background: C.borderDefault, margin: "6px auto" }} role="separator" />
            )}
            {section.items.map(item => {
              const active = activeView === item.id;
              const isHovered = hoveredItem === item.id;
              const hasNotif = aiNotifications && aiNotifications[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); if (onToggleMobile) onToggleMobile(); }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  aria-current={active ? "page" : undefined}
                  style={{
                    width: "100%",
                    background: active ? "rgba(255,255,255,0.07)" : isHovered ? HOVER.subtle : "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: S.md,
                    padding: isExpanded ? "12px 20px" : "12px 0",
                    justifyContent: isExpanded ? "flex-start" : "center",
                    color: active ? C.textPrimary : isHovered ? C.textPrimary : C.textSecondary,
                    borderRight: active ? `2px solid ${C.gold}` : "2px solid transparent",
                    transition: "all 0.12s ease",
                    position: "relative",
                  }}
                >
                  <item.icon size={18} strokeWidth={active ? 2 : 1.75} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
                  {isExpanded && (
                    <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: active ? 600 : 500, whiteSpace: "nowrap" }}>{item.label}</span>
                  )}
                  {hasNotif && (
                    <span style={{
                      marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                      background: C.aiBlue, boxShadow: `0 0 8px ${C.aiBlue}60`,
                    }} aria-label="New notification" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ width: isExpanded ? "85%" : 20, height: 1, background: C.borderDefault, margin: "4px auto 8px" }} role="separator" />

      <button
        onClick={() => { setView("settings"); if (onToggleMobile) onToggleMobile(); }}
        onMouseEnter={() => setHoveredItem("settings")}
        onMouseLeave={() => setHoveredItem(null)}
        aria-current={activeView === "settings" ? "page" : undefined}
        style={{
          width: "100%", background: activeView === "settings" ? "rgba(255,255,255,0.07)" : hoveredItem === "settings" ? HOVER.subtle : "none",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: S.md, padding: isExpanded ? "12px 20px 20px" : "12px 0 20px",
          justifyContent: isExpanded ? "flex-start" : "center",
          color: activeView === "settings" ? C.textPrimary : hoveredItem === "settings" ? C.textPrimary : C.textSecondary,
          borderRight: activeView === "settings" ? `2px solid ${C.gold}` : "2px solid transparent",
          transition: "all 0.12s ease",
        }}
      >
        <SettingsIcon size={18} strokeWidth={activeView === "settings" ? 2 : 1.75} style={{ flexShrink: 0, opacity: activeView === "settings" ? 1 : 0.75 }} />
        {isExpanded && <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: activeView === "settings" ? 600 : 500, whiteSpace: "nowrap" }}>Settings</span>}
      </button>
    </nav>
  );
}
