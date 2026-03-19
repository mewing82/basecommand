import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { useAuthStore } from "../../store/authStore";
import { renewalStore } from "../../lib/storage";

const VIEW_META = {
  dashboard: { title: "Command Center" },
  accounts: { title: "Portfolio", subtitle: "Portfolio management and AI co-pilot" },
  agents: { title: "Agents", subtitle: "Your AI-powered renewal operations fleet" },
  // Renewal Agents
  "agents/renewal/health-monitor": { title: "Health Monitor", subtitle: "Continuous health scoring and risk signal detection" },
  "agents/renewal/rescue-planner": { title: "Rescue Planner", subtitle: "AI-generated intervention playbooks for at-risk accounts" },
  "agents/renewal/outreach-drafter": { title: "Outreach Drafter", subtitle: "Personalized renewal emails calibrated to health and archetype" },
  // Growth Agents
  "agents/growth/expansion-scout": { title: "Expansion Scout", subtitle: "PQL detection, upsell triggers, and expansion signals" },
  "agents/growth/forecast-engine": { title: "Forecast Engine", subtitle: "GRR/NRR forecasts with industry benchmarks" },
  "agents/growth/opportunity-brief": { title: "Opportunity Brief", subtitle: "Pre-call expansion briefs with pricing strategy" },
  // Coaching Agents
  "agents/coaching/executive-brief": { title: "Executive Brief", subtitle: "Board-ready summaries and strategic recommendations" },
  "agents/coaching/meeting-prep": { title: "Meeting Prep", subtitle: "Pre-call briefs with relationship context" },
  "agents/coaching/playbook-builder": { title: "Playbook Builder", subtitle: "90/60/30 day renewal action plans" },
  // Intelligence Hub
  intelligence: { title: "Intelligence", subtitle: "Executive briefs, forecasts, and strategic reports" },
  // Pillar pages
  "pillars/monitor": { title: "Monitor", subtitle: "Continuous health scoring and risk detection" },
  "pillars/predict": { title: "Predict", subtitle: "GRR/NRR forecasting and scenario modeling" },
  "pillars/generate": { title: "Generate", subtitle: "AI-drafted emails and intervention playbooks" },
  "pillars/identify": { title: "Identify", subtitle: "Expansion signals and upsell opportunities" },
  "pillars/orchestrate": { title: "Orchestrate", subtitle: "Board-ready briefs, playbooks, and meeting prep" },
  // Other
  tasks: { title: "Action Center", subtitle: "Agent proposals, your tasks, and activity history" },
  import: { title: "Data Sources & Import", subtitle: "Connect and sync your renewal data" },
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
  const { isMobile } = useMediaQuery();

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
  const [settings, setSettingsState] = useState(null);
  useEffect(() => { renewalStore.getSettings().then(setSettingsState); }, []);
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
        <div style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>
          {meta.title}
        </div>
        {meta.subtitle && !isMobile && (
          <div style={{
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
          display: isMobile ? "none" : "flex", alignItems: "center", gap: 10,
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
              minWidth: isMobile ? 180 : 220,
              maxWidth: isMobile ? "calc(100vw - 32px)" : undefined,
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
