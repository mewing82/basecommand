import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, CheckSquare,
  Settings as SettingsIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, LogOut,
  Bot, BarChart3, Crown, Shield,
} from "lucide-react";
import { C, FONT_SANS, FONT_MONO } from "../../lib/tokens";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";
import { renewalStore } from "../../lib/storage";
import { supabase } from "../../lib/supabase";
import { PILLARS, isPillarActive, getActivePillarCount } from "../../lib/pillars";

// ─── Nav Configuration — 5 workflow-stage groups ─────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Command Center" },
  { id: "accounts", icon: BarChart3, label: "Portfolio" },
  { id: "agents", icon: Bot, label: "Agents", expandable: true },
  { id: "tasks", icon: CheckSquare, label: "Actions" },
  { id: "intelligence", icon: Crown, label: "Intelligence" },
];

// ─── Org Display (replaces workspace switcher) ──────────────────────────────
function OrgDisplay({ collapsed }) {
  const { userOrgs, activeOrgId } = useAuthStore();
  const activeOrg = userOrgs.find(o => o.id === activeOrgId) || { name: "Organization" };
  const initial = activeOrg.name.charAt(0).toUpperCase();

  if (collapsed) {
    return (
      <div style={{ padding: "0 0 8px", display: "flex", justifyContent: "center" }}>
        <div title={activeOrg.name} style={{
          width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.borderDefault}`,
          background: C.bgCard, color: C.gold, fontFamily: FONT_SANS, fontSize: 12,
          fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {initial}
        </div>
      </div>
    );
  }

  return (
    <div className="bc-sidebar-ws-expanded" style={{ padding: "0 0 8px" }}>
      <div style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "7px 16px 7px 20px", borderRadius: 0,
        background: "transparent",
        border: "1px solid transparent",
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: 5, background: C.goldMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: C.gold, fontFamily: FONT_SANS, flexShrink: 0,
        }}>{initial}</span>
        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {activeOrg.name}
        </span>
      </div>
    </div>
  );
}

// ─── Profile Dropdown ────────────────────────────────────────────────────────
function ProfileDropdown({ user, displayName, avatarUrl, initials, isExpanded, activeView, onNavigate, signOut }) {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!user || !supabase) return;
    supabase.from("subscriptions").select("role").eq("user_id", user.id).single()
      .then(({ data }) => { if (data?.role === "admin") setIsAdmin(true); });
  }, [user?.id]);

  if (!user) return null;

  const avatar = avatarUrl ? (
    <img src={avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, border: `1px solid ${C.borderDefault}` }} referrerPolicy="no-referrer" />
  ) : (
    <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: C.goldMuted, border: `1px solid ${C.gold}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: C.gold, fontFamily: FONT_SANS }}>{initials}</div>
  );

  return (
    <div ref={ref} style={{ position: "relative", padding: "8px 0 16px" }}>
      <button onClick={() => setOpen(prev => !prev)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: isExpanded ? "8px 16px 8px 20px" : "8px 0", borderRadius: 0, cursor: "pointer",
        background: open ? "rgba(255,255,255,0.07)" : "transparent",
        border: "none", justifyContent: isExpanded ? "flex-start" : "center", transition: "all 0.15s",
      }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        {avatar}
        {isExpanded && (
          <>
            <span className="bc-sidebar-text" style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, flex: 1, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</span>
            <ChevronUp size={12} style={{ color: C.textTertiary, flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(0deg)" : "rotate(180deg)" }} />
          </>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", bottom: "100%", left: isExpanded ? 0 : -4, right: isExpanded ? 0 : -4,
          minWidth: isExpanded ? undefined : 200, zIndex: 200,
          background: C.bgElevated, border: `1px solid ${C.borderSubtle}`,
          borderRadius: 10, padding: 4, marginBottom: 4, boxShadow: "0 -8px 30px rgba(0,0,0,0.4)",
        }}>
          <div style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${C.borderDefault}`, marginBottom: 4 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{displayName}</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, marginTop: 1 }}>{user.email}</div>
          </div>
          <button onClick={() => { onNavigate("settings"); setOpen(false); }} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: 6, cursor: "pointer",
            background: activeView === "settings" ? C.goldMuted : "transparent",
            border: "none", textAlign: "left", transition: "background 0.12s",
          }}
            onMouseEnter={e => { if (activeView !== "settings") e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { if (activeView !== "settings") e.currentTarget.style.background = "transparent"; }}
          >
            <SettingsIcon size={14} style={{ color: activeView === "settings" ? C.gold : C.textTertiary }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: activeView === "settings" ? 600 : 400, color: activeView === "settings" ? C.textPrimary : C.textSecondary }}>Settings</span>
          </button>
          {isAdmin && (
            <button onClick={() => { onNavigate("admin"); setOpen(false); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 6, cursor: "pointer",
              background: activeView === "admin" ? `${C.red}14` : "transparent",
              border: "none", textAlign: "left", transition: "background 0.12s",
            }}
              onMouseEnter={e => { if (activeView !== "admin") e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (activeView !== "admin") e.currentTarget.style.background = "transparent"; }}
            >
              <Shield size={14} style={{ color: activeView === "admin" ? C.red : C.textTertiary }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: activeView === "admin" ? 600 : 400, color: activeView === "admin" ? C.textPrimary : C.textSecondary }}>Admin</span>
            </button>
          )}
          <div style={{ height: 1, background: C.borderDefault, margin: "4px 8px" }} />
          <button onClick={() => { signOut(); setOpen(false); }} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: 6, cursor: "pointer",
            background: "transparent", border: "none", textAlign: "left", transition: "background 0.12s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={14} style={{ color: C.red }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.red }}>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export default function Sidebar({ activeView, onNavigate }) {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const { user, profile, signOut } = useAuthStore();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [agentsExpanded, setAgentsExpanded] = useState(() => activeView.startsWith("agents/") || activeView.startsWith("pillars/"));
  const isExpanded = !sidebarCollapsed;

  // Count active pillars using shared detection
  const [activePillarCount] = useState(() => getActivePillarCount());
  const [pillarStatus] = useState(() => {
    const m = {};
    for (const p of PILLARS) m[p.id] = isPillarActive(p);
    return m;
  });

  // Pending actions count for Actions badge
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    renewalStore.getAutopilotActions().then(actions => {
      setPendingCount(actions.filter(a => a.status === "pending").length);
    });
  }, []);

  const displayName = profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
  const initials = displayName ? displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div style={{
      width: isExpanded ? 240 : 56, minWidth: isExpanded ? 240 : 56,
      background: C.bgSidebar, borderRight: `1px solid ${C.borderDefault}`,
      display: "flex", flexDirection: "column",
      transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      overflow: "hidden", zIndex: 100, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: isExpanded ? "20px 16px 16px 20px" : "20px 0 16px", display: "flex", alignItems: "center", gap: 10, justifyContent: isExpanded ? "flex-start" : "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: C.bgSidebar, fontFamily: FONT_MONO, flexShrink: 0,
          }}>B</div>
          {isExpanded && (
            <span className="bc-sidebar-text" style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 17, color: C.textPrimary, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
              BaseCommand
            </span>
          )}
        </div>
        {isExpanded && (
          <button className="bc-sidebar-collapse-btn" onClick={() => setSidebarCollapsed(true)} style={{
            marginLeft: "auto", flexShrink: 0,
            background: "rgba(255,255,255,0.04)", border: "none", color: C.textTertiary, cursor: "pointer",
            fontSize: 12, padding: "4px 6px", borderRadius: 6, transition: "all 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
          ><ChevronLeft size={14} /></button>
        )}
      </div>

      {!isExpanded && (
        <button onClick={() => setSidebarCollapsed(false)} style={{
          background: "none", border: "none", color: C.textTertiary, cursor: "pointer",
          fontSize: 14, padding: "6px 0", marginBottom: 4, width: "100%", transition: "color 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = C.textPrimary}
          onMouseLeave={e => e.currentTarget.style.color = C.textTertiary}
        ><ChevronRight size={14} /></button>
      )}

      <OrgDisplay collapsed={!isExpanded} />

      {/* Navigation — 5 workflow-stage groups */}
      <nav style={{ flex: 1, padding: "4px 0", overflow: "auto", display: "flex", flexDirection: "column" }}>
        {NAV_ITEMS.map(item => {
          const active = item.id === "agents"
            ? activeView === "agents" || activeView.startsWith("agents/") || activeView.startsWith("pillars/")
            : activeView === item.id;
          const isHovered = hoveredItem === item.id;
          const isAgents = item.expandable;

          return (
            <div key={item.id}>
              <button
                className="bc-sidebar-nav-btn"
                onClick={() => {
                  if (isAgents && isExpanded) {
                    onNavigate(item.id);
                    if (!agentsExpanded) setAgentsExpanded(true);
                  } else {
                    onNavigate(item.id);
                  }
                }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  width: "100%",
                  background: active ? "rgba(255,255,255,0.07)" : isHovered ? "rgba(255,255,255,0.04)" : "none",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center",
                  padding: isExpanded ? "10px 16px 10px 52px" : "10px 0",
                  justifyContent: isExpanded ? "flex-start" : "center",
                  color: active ? C.textPrimary : isHovered ? C.textPrimary : C.textSecondary,
                  borderRight: active ? `2px solid ${C.gold}` : "2px solid transparent",
                  transition: "all 0.12s ease", position: "relative",
                }}
              >
                <div style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)" }}>
                  <item.icon size={18} strokeWidth={active ? 2 : 1.75} style={{ opacity: active ? 1 : 0.75, display: "block" }} />
                  {isAgents && !isExpanded && activePillarCount > 0 && (
                    <div style={{
                      position: "absolute", top: -2, right: -4,
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#34D399", border: `1.5px solid ${C.bgSidebar}`,
                      boxShadow: "0 0 4px rgba(52, 211, 153, 0.6)",
                    }} />
                  )}
                </div>
                {isExpanded && (
                  <span className="bc-sidebar-text" style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: active ? 600 : 500, whiteSpace: "nowrap", flex: 1 }}>{item.label}</span>
                )}
                {/* Pending count badge on Actions */}
                {item.id === "tasks" && isExpanded && pendingCount > 0 && (
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9, color: C.amber,
                    background: C.amberMuted, padding: "1px 6px", borderRadius: 3,
                    lineHeight: "14px", fontWeight: 600, marginLeft: "auto",
                  }}>{pendingCount}</span>
                )}
                {isAgents && isExpanded && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                    {activePillarCount > 0 && (
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 9, color: "#34D399",
                        background: "rgba(52, 211, 153, 0.12)", padding: "1px 6px", borderRadius: 3,
                        lineHeight: "14px", fontWeight: 600,
                      }}>{activePillarCount}/5</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setAgentsExpanded(prev => !prev); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer", padding: 2,
                        color: C.textTertiary, display: "flex", alignItems: "center",
                        transition: "transform 0.15s, color 0.15s",
                        transform: agentsExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = C.textPrimary}
                      onMouseLeave={e => e.currentTarget.style.color = C.textTertiary}
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                )}
              </button>

              {/* Pillar sub-items */}
              {isAgents && isExpanded && agentsExpanded && (
                <div style={{ overflow: "hidden" }}>
                  {PILLARS.map(p => {
                    const on = pillarStatus[p.id];
                    const pillarActive = activeView === `pillars/${p.id}`;
                    const pillarHovered = hoveredItem === `pillar-${p.id}`;
                    const PIcon = p.icon;
                    return (
                      <button
                        key={p.id}
                        className="bc-sidebar-nav-btn"
                        onClick={() => onNavigate(`pillars/${p.id}`)}
                        onMouseEnter={() => setHoveredItem(`pillar-${p.id}`)}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{
                          width: "100%", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "6px 16px 6px 38px",
                          background: pillarActive ? "rgba(255,255,255,0.05)" : pillarHovered ? "rgba(255,255,255,0.03)" : "transparent",
                          borderRight: pillarActive ? `2px solid ${p.color}` : "2px solid transparent",
                          transition: "all 0.12s ease",
                          color: pillarActive ? C.textPrimary : pillarHovered ? C.textSecondary : C.textTertiary,
                        }}
                      >
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                          background: on ? p.color : p.color + "40",
                          boxShadow: on ? `0 0 5px ${p.color}50` : "none",
                          transition: "all 0.15s",
                        }} />
                        <PIcon size={12} style={{ color: pillarActive ? p.color : on ? p.color : C.textTertiary, flexShrink: 0 }} />
                        <span className="bc-sidebar-text" style={{
                          fontFamily: FONT_MONO, fontSize: 11, fontWeight: pillarActive ? 600 : 400,
                          letterSpacing: "0.02em",
                        }}>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Settings gear */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ height: 1, background: C.borderDefault, margin: "4px 0" }} />
      </div>
      <button
        className="bc-sidebar-nav-btn"
        onClick={() => onNavigate("settings")}
        onMouseEnter={() => setHoveredItem("settings-gear")}
        onMouseLeave={() => setHoveredItem(null)}
        title={isExpanded ? undefined : "Settings"}
        style={{
          width: "100%", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center",
          padding: isExpanded ? "10px 16px 10px 52px" : "10px 0",
          justifyContent: isExpanded ? "flex-start" : "center",
          position: "relative",
          background: activeView === "settings"
            ? "rgba(255,255,255,0.07)"
            : hoveredItem === "settings-gear" ? "rgba(255,255,255,0.04)" : "none",
          borderRight: activeView === "settings" ? `2px solid ${C.gold}` : "2px solid transparent",
          color: activeView === "settings" ? C.textPrimary : hoveredItem === "settings-gear" ? C.textPrimary : C.textSecondary,
          transition: "all 0.12s ease",
        }}
      >
        <div style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)" }}>
          <SettingsIcon size={18} strokeWidth={activeView === "settings" ? 2 : 1.75} style={{ opacity: activeView === "settings" ? 1 : 0.75, display: "block" }} />
        </div>
        {isExpanded && (
          <span className="bc-sidebar-text" style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: activeView === "settings" ? 600 : 500, whiteSpace: "nowrap" }}>Settings</span>
        )}
      </button>

      <ProfileDropdown
        user={user} displayName={displayName} avatarUrl={avatarUrl} initials={initials}
        isExpanded={isExpanded} activeView={activeView} onNavigate={onNavigate} signOut={signOut}
      />
    </div>
  );
}
