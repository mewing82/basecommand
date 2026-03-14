import { Search } from "lucide-react";
import { C, FONT_SANS, FONT_MONO } from "../../lib/tokens";

const VIEW_TITLES = {
  dashboard: "Renewal Command Center",
  intel: "Intel",
  decisions: "Decisions",
  tasks: "Tasks",
  priorities: "Priorities",
  projects: "Projects",
  meetings: "Meetings",
  library: "Library",
  renewals: "Renewal Operations",
  settings: "Settings",
};

export default function TopBar({ currentView, onCommandPalette }) {
  return (
    <>
      <div style={{ flex: 1, fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>
        {VIEW_TITLES[currentView] || currentView}
      </div>

      <button
        className="bc-search-trigger"
        onClick={onCommandPalette}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderDefault}`,
          borderRadius: 8, padding: "6px 14px", cursor: "pointer",
          color: C.textTertiary, fontFamily: FONT_SANS, fontSize: 13,
          transition: "all 0.15s ease", minWidth: 200,
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
