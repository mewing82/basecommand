// ─── Base Command v3.0 — Thin App Shell ───────────────────────────────────────
// Architecture: App shell handles routing, state, and layout
// Views are imported from views/AllViews.jsx
// Shared components from components/
// Design tokens from theme/
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { C, FONT_SANS, FONT_MONO, S, R, HOVER } from "./theme/tokens.js";
import { store, getWorkspaces, getActiveWorkspaceId, createWorkspace, renameWorkspace, deleteWorkspace, WS_DEFAULT_ID } from "./lib/store.js";
import Sidebar, { CommandPalette } from "./components/Sidebar.jsx";
import { Skeleton } from "./components/ui.jsx";
import {
  DashboardView, DecisionsView, TasksView, PrioritiesView,
  IngestView, MeetingsView, LibraryView, ProjectsView, SettingsView,
} from "./views/AllViews.jsx";

export default function BaseCommand() {
  const [view, setView] = useState("dashboard");
  const [focusSessionId, setFocusSessionId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("bc2-ui:sidebar-collapsed") === "true";
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [decisions, setDecisions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [ingestSessions, setIngestSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWsId, setActiveWsId] = useState(() => getActiveWorkspaceId());
  const [workspaces, setWorkspaceList] = useState(() => getWorkspaces());

  function switchWorkspace(wsId) {
    store.setWorkspace(wsId);
    setActiveWsId(wsId);
    setView("dashboard");
    setLoading(true);
  }

  function handleCreateWorkspace(name, icon) {
    const ws = createWorkspace(name, icon);
    setWorkspaceList(getWorkspaces());
    switchWorkspace(ws.id);
    return ws;
  }

  function handleRenameWorkspace(wsId, newName) {
    renameWorkspace(wsId, newName);
    setWorkspaceList(getWorkspaces());
  }

  function handleDeleteWorkspace(wsId) {
    deleteWorkspace(wsId);
    setWorkspaceList(getWorkspaces());
    if (activeWsId === wsId) switchWorkspace(WS_DEFAULT_ID);
  }

  // Init: migrate + load all data (re-runs on workspace switch)
  useEffect(() => {
    async function init() {
      store._ws = activeWsId;
      await store.checkAndMigrate();
      const [d, t, p, m, s, docs, projs] = await Promise.all([
        store.list("decision"),
        store.list("task"),
        store.list("priority"),
        store.list("meeting"),
        store.list("ingest"),
        store.list("document"),
        store.list("project"),
      ]);
      setDecisions(d);
      setTasks(t);
      setPriorities(p);
      setMeetings(m);
      setIngestSessions(s);
      setDocuments(docs);
      setProjects(projs);
      setLoading(false);
    }
    init();
  }, [activeWsId]);

  // Command palette keyboard shortcut
  useEffect(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Loading state with skeleton
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bgPrimary, gap: S.lg }}>
        <div style={{
          width: 40, height: 40, borderRadius: R.lg,
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 700, color: C.bgPrimary,
          fontFamily: FONT_MONO, animation: "aiPulse 2s ease-in-out infinite",
        }}>B</div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textTertiary, fontWeight: 500 }}>Loading Base Command...</div>
        {/* Skeleton preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: S.sm, width: 300, marginTop: S.lg }}>
          <Skeleton height={12} width="80%" />
          <Skeleton height={12} width="60%" />
          <Skeleton height={12} width="90%" />
        </div>
      </div>
    );
  }

  const VIEW_TITLES = {
    dashboard: "Command Center",
    ingest: "Ingest",
    decisions: "Decisions",
    tasks: "Tasks",
    priorities: "Priorities",
    projects: "Projects",
    meetings: "Meetings",
    library: "Library",
    settings: "Settings",
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bgPrimary, color: C.textPrimary, fontFamily: FONT_SANS, overflow: "hidden", letterSpacing: "-0.01em" }}>
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-to-content">Skip to content</a>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="bc-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        activeView={view}
        setView={v => { setView(v); setMobileSidebarOpen(false); }}
        collapsed={mobileSidebarOpen ? false : sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        aiNotifications={{}}
        workspaces={workspaces}
        activeWsId={activeWsId}
        onSwitchWorkspace={switchWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onRenameWorkspace={handleRenameWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        onToggleMobile={() => setMobileSidebarOpen(false)}
      />

      <main id="main-content" style={{ flex: 1, overflow: "auto", position: "relative" }} role="main">
        {/* Top status bar */}
        <div className="bc-top-bar" style={{
          position: "sticky", top: 0, zIndex: 50,
          background: `${C.bgPrimary}F2`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${C.borderDefault}`,
          padding: "0 32px", height: 48,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: S.lg,
        }}>
          {/* Mobile hamburger */}
          <button
            className="bc-mobile-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation menu"
            style={{
              background: "none", border: "none", color: C.textSecondary,
              cursor: "pointer", padding: S.xs, borderRadius: R.sm,
            }}
          >
            <Menu size={20} />
          </button>

          {/* View title */}
          <h1 style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em", margin: 0 }}>
            {VIEW_TITLES[view] || view}
          </h1>

          {/* Command palette trigger */}
          <button
            className="bc-search-trigger"
            onClick={() => setShowCommandPalette(true)}
            aria-label="Open search (Cmd+K)"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: HOVER.subtle, border: `1px solid ${C.borderDefault}`,
              borderRadius: R.md, padding: "6px 14px", cursor: "pointer",
              color: C.textTertiary, fontFamily: FONT_SANS, fontSize: 13,
              transition: "all 0.15s ease", minWidth: 200,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.background = HOVER.default; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.background = HOVER.subtle; }}
          >
            <span style={{ opacity: 0.5 }}>⌕</span>
            <span>Search...</span>
            <kbd style={{ marginLeft: "auto", fontFamily: FONT_MONO, background: HOVER.default, padding: "2px 7px", borderRadius: 5, fontSize: 11, border: `1px solid ${HOVER.default}` }}>⌘K</kbd>
          </button>
        </div>

        {/* View content */}
        <div className="bc-main-content" style={{ minHeight: "calc(100vh - 48px)" }}>
          {view === "dashboard" && (
            <DashboardView decisions={decisions} tasks={tasks} priorities={priorities} projects={projects} onNavigate={setView} />
          )}
          {view === "ingest" && (
            <IngestView setDecisions={setDecisions} setTasks={setTasks} setPriorities={setPriorities} setMeetings={setMeetings} ingestSessions={ingestSessions} setIngestSessions={setIngestSessions} focusSessionId={focusSessionId} setFocusSessionId={setFocusSessionId} />
          )}
          {view === "meetings" && (
            <MeetingsView meetings={meetings} />
          )}
          {view === "decisions" && (
            <DecisionsView decisions={decisions} setDecisions={setDecisions} tasks={tasks} setTasks={setTasks} priorities={priorities} projects={projects} ingestSessions={ingestSessions} setView={setView} setFocusSessionId={setFocusSessionId} />
          )}
          {view === "tasks" && (
            <TasksView tasks={tasks} setTasks={setTasks} decisions={decisions} projects={projects} ingestSessions={ingestSessions} />
          )}
          {view === "priorities" && (
            <PrioritiesView priorities={priorities} setPriorities={setPriorities} decisions={decisions} tasks={tasks} projects={projects} />
          )}
          {view === "projects" && (
            <ProjectsView projects={projects} setProjects={setProjects} tasks={tasks} decisions={decisions} priorities={priorities} documents={documents} setTasks={setTasks} setDecisions={setDecisions} setPriorities={setPriorities} setDocuments={setDocuments} />
          )}
          {view === "library" && (
            <LibraryView documents={documents} setDocuments={setDocuments} projects={projects} />
          )}
          {view === "settings" && (
            <SettingsView sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
          )}
        </div>
      </main>

      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
          setView={setView}
          decisions={decisions}
          tasks={tasks}
          priorities={priorities}
        />
      )}
    </div>
  );
}
