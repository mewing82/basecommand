import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useAuthStore } from "../../store/authStore";
import { renewalStore } from "../../lib/storage";

const VIEW_META = {
  dashboard: { title: "Renewal Command Center" },
  accounts: { title: "Accounts", subtitle: "Portfolio management and AI co-pilot" },
  agents: { title: "Agents", subtitle: "Your AI-powered renewal specialists" },
  "agents/autopilot": { title: "Autopilot", subtitle: "AI-generated renewal actions" },
  "agents/forecast": { title: "Forecast", subtitle: "AI-powered renewal forecasting" },
  "agents/intel": { title: "Intel", subtitle: "Expansion signals, risk analysis, and renewal intelligence" },
  "agents/briefs": { title: "Briefs", subtitle: "Executive briefs, talking points, and strategic recommendations" },
  "agents/playbook": { title: "Renewal Playbook", subtitle: "90/60/30 day renewal action plans" },
  "agents/meeting-prep": { title: "Meeting Prep", subtitle: "Prep briefs for renewal meetings" },
  tasks: { title: "Tasks", subtitle: "Account actions and strategic tasks" },
  import: { title: "Import", subtitle: "Import and sync your renewal portfolio data" },
  settings: { title: "Settings" },
};

const PERSONA_LABELS = {
  specialist: "Renewal Specialist",
  director: "Renewal Leader",
  revenue_leader: "Revenue Leader",
  revops: "RevOps",
  founder: "Founder",
};

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

export default function TopBar({ currentView, onCommandPalette }) {
  const meta = VIEW_META[currentView] || { title: currentView };
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        avatarRef.current && !avatarRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  const settings = renewalStore.getSettings();
  const persona = settings?.persona;
  const personaLabel = persona ? PERSONA_LABELS[persona] || persona : null;

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
  };

  const handlePreferences = () => {
    setDropdownOpen(false);
    navigate("/app/settings");
  };

  return (
    <>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>
          {meta.title}
        </div>
        {meta.subtitle && (
          <div className="bc-hide-mobile" style={{
            fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary,
            marginTop: 2, letterSpacing: "0.02em", opacity: 0.7,
          }}>
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
        <span style={{ opacity: 0.5 }}>&#x2315;</span>
        <span>Search...</span>
        <kbd style={{
          marginLeft: "auto", fontFamily: FONT_MONO,
          background: "rgba(255,255,255,0.06)", padding: "2px 7px",
          borderRadius: 5, fontSize: 11, border: "1px solid rgba(255,255,255,0.06)",
        }}>&#x2318;K</kbd>
      </button>

      {/* Profile Avatar + Dropdown */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          ref={avatarRef}
          onClick={() => setDropdownOpen(prev => !prev)}
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            cursor: "pointer",
            border: `2px solid ${avatarHovered ? C.gold : "transparent"}`,
            transition: "border-color 0.15s ease",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: avatarUrl ? "transparent" : C.goldMuted,
            flexShrink: 0,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
            />
          ) : (
            <span style={{
              fontFamily: FONT_SANS,
              fontSize: 12,
              fontWeight: 600,
              color: C.gold,
              lineHeight: 1,
              userSelect: "none",
            }}>
              {getInitials(userName)}
            </span>
          )}
        </div>

        {dropdownOpen && (
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: 220,
              background: C.bgElevated,
              border: `1px solid ${C.borderSubtle}`,
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
              zIndex: 9999,
              padding: "12px 0",
              fontFamily: FONT_SANS,
            }}
          >
            {/* User info */}
            <div style={{ padding: "0 14px 10px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3 }}>
                {userName}
              </div>
              {userEmail && (
                <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2, lineHeight: 1.3 }}>
                  {userEmail}
                </div>
              )}
              {personaLabel && (
                <div style={{
                  display: "inline-block",
                  marginTop: 6,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 500,
                  color: C.gold,
                  background: C.goldMuted,
                  borderRadius: 4,
                  letterSpacing: "0.02em",
                }}>
                  {personaLabel}
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: C.borderSubtle, margin: "2px 0" }} />

            {/* Preferences */}
            <button
              onClick={handlePreferences}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: C.textSecondary,
                fontSize: 13,
                fontFamily: FONT_SANS,
                textAlign: "left",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <SettingsIcon size={14} style={{ opacity: 0.6 }} />
              Preferences
            </button>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: C.textSecondary,
                fontSize: 13,
                fontFamily: FONT_SANS,
                textAlign: "left",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <LogOut size={14} style={{ opacity: 0.6 }} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
