import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { useAppStore } from "./store/appStore";
import { useEntityStore } from "./store/entityStore";
import { useAuthStore } from "./store/authStore";
import { C, FONT_SANS, FONT_MONO, APP_MOBILE_PX } from "./lib/tokens";
import { useMediaQuery } from "./lib/useMediaQuery";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import CommandPalette from "./components/layout/CommandPalette";
import BottomTabBar from "./components/layout/BottomTabBar";
import AuthGate from "./components/auth/AuthGate";
import MarketingLayout from "./components/layout/MarketingLayout";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import AgentHub from "./pages/AgentHub";
import Leadership from "./pages/Leadership";
import Tasks from "./pages/Tasks";
import Import from "./pages/Import";
import Settings from "./pages/Settings";
import Landing from "./pages/marketing/Landing";
import Pricing from "./pages/marketing/Pricing";
import Agents from "./pages/marketing/Agents";
import Why from "./pages/marketing/Why";
import HowItWorks from "./pages/marketing/HowItWorks";
import GetStarted from "./pages/marketing/GetStarted";
import Privacy from "./pages/marketing/Privacy";
import Terms from "./pages/marketing/Terms";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
// ─── New Agent Architecture (Epic 13) ────────────────────────────────────────
import HealthMonitor from "./pages/agents/HealthMonitor";
import RescuePlanner from "./pages/agents/RescuePlanner";
import OutreachDrafter from "./pages/agents/OutreachDrafter";
import ExpansionScout from "./pages/agents/ExpansionScout";
import ForecastEngine from "./pages/agents/ForecastEngine";
import OpportunityBrief from "./pages/agents/OpportunityBrief";
import PlaybookBuilder from "./pages/agents/PlaybookBuilder";
import Admin from "./pages/Admin";

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
  const { isMobile } = useMediaQuery();

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
    dashboard: "Command Center",
    accounts: "Accounts",
    agents: "Agents",
    // Renewal Agents
    "agents/renewal/health-monitor": "Health Monitor",
    "agents/renewal/rescue-planner": "Rescue Planner",
    "agents/renewal/outreach-drafter": "Outreach Drafter",
    // Growth Agents
    "agents/growth/expansion-scout": "Expansion Scout",
    "agents/growth/forecast-engine": "Forecast Engine",
    "agents/growth/opportunity-brief": "Opportunity Brief",
    // Coaching Agents
    "agents/coaching/executive-brief": "Executive Brief",
    "agents/coaching/meeting-prep": "Meeting Prep",
    "agents/coaching/playbook-builder": "Playbook Builder",
    // Legacy (backward compat)
    "agents/autopilot": "Autopilot",
    "agents/forecast": "Forecast",
    "agents/intel": "Intel",
    "agents/briefs": "Briefs",
    tasks: "Action Center",
    import: "Data Sources & Import",
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
          padding: isMobile ? "0 12px" : "0 24px", height: 56,
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

        <div className="bc-app-content" style={{ minHeight: "calc(100vh - 56px)", paddingBottom: isMobile ? 72 : 0 }}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="agents" element={<AgentHub />} />
            {/* ─── Renewal Agents ─────────────────────────────── */}
            <Route path="agents/renewal/health-monitor" element={<HealthMonitor />} />
            <Route path="agents/renewal/rescue-planner" element={<RescuePlanner />} />
            <Route path="agents/renewal/outreach-drafter" element={<OutreachDrafter />} />
            {/* ─── Growth Agents ──────────────────────────────── */}
            <Route path="agents/growth/expansion-scout" element={<ExpansionScout />} />
            <Route path="agents/growth/forecast-engine" element={<ForecastEngine />} />
            <Route path="agents/growth/opportunity-brief" element={<OpportunityBrief />} />
            {/* ─── Coaching Agents ────────────────────────────── */}
            <Route path="agents/coaching/executive-brief" element={<Leadership />} />
            <Route path="agents/coaching/meeting-prep" element={<AgentHub />} />
            <Route path="agents/coaching/playbook-builder" element={<PlaybookBuilder />} />
            {/* ─── Other ─────────────────────────────────────── */}
            <Route path="tasks" element={<Tasks />} />
            <Route path="import" element={<Import />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin" element={<Admin />} />
            {/* Backward-compatible redirects (old agent routes) */}
            <Route path="autopilot" element={<Navigate to="/app/agents/renewal/health-monitor" replace />} />
            <Route path="agents/autopilot" element={<Navigate to="/app/agents/renewal/health-monitor" replace />} />
            <Route path="forecast" element={<Navigate to="/app/agents/growth/forecast-engine" replace />} />
            <Route path="agents/forecast" element={<Navigate to="/app/agents/growth/forecast-engine" replace />} />
            <Route path="intel" element={<Navigate to="/app/agents/growth/expansion-scout" replace />} />
            <Route path="agents/intel" element={<Navigate to="/app/agents/growth/expansion-scout" replace />} />
            <Route path="briefs" element={<Navigate to="/app/agents/coaching/executive-brief" replace />} />
            <Route path="agents/briefs" element={<Navigate to="/app/agents/coaching/executive-brief" replace />} />
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
          <Route path="/why" element={<Why />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
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
