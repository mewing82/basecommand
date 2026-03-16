import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";

const VIEW_META = {
  dashboard: { title: "Renewal Command Center" },
  accounts: { title: "Accounts", subtitle: "Portfolio management and AI co-pilot" },
  autopilot: { title: "Autopilot", subtitle: "AI-generated renewal actions" },
  forecast: { title: "Forecast", subtitle: "AI-powered renewal forecasting" },
  intel: { title: "Intel", subtitle: "Expansion signals, risk analysis, and renewal intelligence" },
  briefs: { title: "Briefs", subtitle: "Executive briefs, talking points, and strategic recommendations" },
  tasks: { title: "Tasks", subtitle: "Account actions and strategic tasks" },
  import: { title: "Import", subtitle: "Import and sync your renewal portfolio data" },
  settings: { title: "Settings" },
};

export default function TopBar({ currentView, onCommandPalette }) {
  const meta = VIEW_META[currentView] || { title: currentView };

  return (
    <>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>
          {meta.title}
        </div>
        {meta.subtitle && (
          <div className="bc-hide-mobile" style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginTop: 1 }}>
            {meta.subtitle}
          </div>
        )}
      </div>

      <button
        className="bc-search-trigger"
        onClick={onCommandPalette}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderDefault}`,
          borderRadius: 8, padding: "6px 14px", cursor: "pointer",
          color: C.textTertiary, fontFamily: FONT_SANS, fontSize: 13,
          transition: "all 0.15s ease", minWidth: 200, flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      >
        <span style={{ opacity: 0.5 }}>⌕</span>
        <span>Search...</span>
        <kbd style={{
          marginLeft: "auto", fontFamily: FONT_MONO,
          background: "rgba(255,255,255,0.06)", padding: "2px 7px",
          borderRadius: 5, fontSize: 11, border: "1px solid rgba(255,255,255,0.06)",
        }}>⌘K</kbd>
      </button>
    </>
  );
}
