import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "./store/appStore";
import { useEntityStore } from "./store/entityStore";
import { C, FONT_SANS, FONT_MONO } from "./lib/tokens";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import CommandPalette from "./components/layout/CommandPalette";
import Dashboard from "./pages/Dashboard";
import Decisions from "./pages/Decisions";
import Tasks from "./pages/Tasks";
import Priorities from "./pages/Priorities";
import Intel from "./pages/Intel";
import Meetings from "./pages/Meetings";
import Library from "./pages/Library";
import Projects from "./pages/Projects";
import Settings from "./pages/Settings";
import Renewals from "./pages/Renewals";

// ─── App Layout ──────────────────────────────────────────────────────────────
function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, loading, setLoading } = useAppStore();
  const { loadAll } = useEntityStore();
  const [showPalette, setShowPalette] = useState(false);

  // Derive current view from pathname for sidebar active state
  const currentView = location.pathname === "/" ? "dashboard" : location.pathname.slice(1);

  useEffect(() => {
    loadAll().then(() => setLoading(false));
  }, []);

  // ⌘K / Ctrl+K to toggle command palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowPalette(prev => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (loading) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: C.bgPrimary,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 700, color: C.bgPrimary,
          fontFamily: FONT_MONO, animation: "aiPulse 2s ease-in-out infinite",
        }}>B</div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textTertiary, fontWeight: 500 }}>
          Loading Base Command...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", height: "100vh", background: C.bgPrimary,
      color: C.textPrimary, fontFamily: FONT_SANS, overflow: "hidden",
      letterSpacing: "-0.01em",
    }}>
      <Sidebar
        activeView={currentView}
        onNavigate={(view) => navigate(view === "dashboard" ? "/" : `/${view}`)}
      />

      <main style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <TopBar currentView={currentView} onCommandPalette={() => setShowPalette(true)} />

        <div style={{ minHeight: "calc(100vh - 48px)" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/intel" element={<Intel />} />
            <Route path="/decisions" element={<Decisions />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/priorities" element={<Priorities />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/library" element={<Library />} />
            <Route path="/renewals" element={<Renewals />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>

      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
