import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { useAppStore } from "./store/appStore";
import { useEntityStore } from "./store/entityStore";
import { useAuthStore } from "./store/authStore";
import { C, FONT_SANS, FONT_MONO } from "./lib/tokens";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import CommandPalette from "./components/layout/CommandPalette";
import BottomTabBar from "./components/layout/BottomTabBar";
import AuthGate from "./components/auth/AuthGate";
import MarketingLayout from "./components/layout/MarketingLayout";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Autopilot from "./pages/Autopilot";
import Intel from "./pages/Intel";
import Leadership from "./pages/Leadership";
import Forecast from "./pages/Forecast";
import Tasks from "./pages/Tasks";
import Import from "./pages/Import";
import Settings from "./pages/Settings";
import Landing from "./pages/marketing/Landing";
import Pricing from "./pages/marketing/Pricing";
import Agents from "./pages/marketing/Agents";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

// ─── Redirect authenticated users from marketing home to app ────────────────
function AuthRedirect({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

// ─── App Layout (authenticated) ─────────────────────────────────────────────
function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, setLoading } = useAppStore();
  const { loadAll } = useEntityStore();
  const [showPalette, setShowPalette] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Derive current view from /app/... pathname
  const pathAfterApp = location.pathname.replace(/^\/app\/?/, "") || "dashboard";
  const currentView = pathAfterApp;

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

  const VIEW_TITLES = {
    dashboard: "Renewal Command Center",
    accounts: "Accounts",
    autopilot: "Autopilot",
    forecast: "Forecast",
    intel: "Intel",
    briefs: "Briefs",
    tasks: "Tasks",
    import: "Import",
    settings: "Settings",
  };

  return (
    <div style={{
      display: "flex", height: "100vh", background: C.bgPrimary,
      color: C.textPrimary, fontFamily: FONT_SANS, overflow: "hidden",
      letterSpacing: "-0.01em",
    }}>
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="bc-sidebar-overlay bc-sidebar-overlay--open"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className={`bc-sidebar${mobileSidebarOpen ? " bc-sidebar--open" : ""}`} style={{ display: "flex", flexShrink: 0 }}>
        <Sidebar
          activeView={currentView}
          onNavigate={(view) => {
            navigate(view === "dashboard" ? "/app" : `/app/${view}`);
            setMobileSidebarOpen(false);
          }}
        />
      </div>

      <main style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <div className="bc-top-bar" style={{
          position: "sticky", top: 0, zIndex: 50,
          background: `${C.bgPrimary}F2`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${C.borderDefault}`,
          padding: "0 24px", height: 56,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button
            className="bc-mobile-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
            style={{
              background: "none", border: "none", color: C.textSecondary,
              cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center",
            }}
          >
            <Menu size={20} />
          </button>
          <TopBar currentView={currentView} onCommandPalette={() => setShowPalette(true)} />
          {/* Mobile search button — replaces hidden command palette trigger */}
          <button
            className="bc-mobile-search-btn"
            onClick={() => setShowPalette(true)}
            aria-label="Search"
            style={{
              background: "none", border: "none", color: C.textTertiary,
              cursor: "pointer", padding: 6, borderRadius: 6,
              display: "none", alignItems: "center",
            }}
          >
            <Search size={18} />
          </button>
        </div>

        <div className="bc-app-content" style={{ minHeight: "calc(100vh - 56px)" }}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="autopilot" element={<Autopilot />} />
            <Route path="intel" element={<Intel />} />
            <Route path="forecast" element={<Forecast />} />
            <Route path="briefs" element={<Leadership />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="import" element={<Import />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </div>
      </main>

      {/* Bottom tab bar — visible on mobile only via CSS */}
      <BottomTabBar
        activeView={currentView}
        onNavigate={(view) => {
          navigate(view === "dashboard" ? "/app" : `/app/${view}`);
        }}
      />

      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public marketing routes */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<AuthRedirect><Landing /></AuthRedirect>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/agents" element={<Agents />} />
        </Route>

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Authenticated app routes */}
        <Route path="/app/*" element={
          <AuthGate>
            <AppLayout />
          </AuthGate>
        } />

        {/* Catch-all: redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
