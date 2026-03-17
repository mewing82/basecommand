import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Sparkles, CheckSquare,
  Settings as SettingsIcon, Upload,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, LogOut, MessageSquare,
  Bot, BarChart3, Radio, Crown, FileText, Users,
} from "lucide-react";
import { C, FONT_SANS, FONT_MONO } from "../../lib/tokens";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";
import { renewalStore } from "../../lib/storage";

const WS_DEFAULT_ID = "ws_default";

// ─── Agent Categories (Unified AI Revenue Architecture) ─────────────────────
import { Activity, ShieldAlert, Mail as MailIcon, TrendingUp, DollarSign } from "lucide-react";

const AGENT_CATEGORIES = [
  {
    id: "renewal", label: "Renewal", color: "#6B8AFF",
    agents: [
      { id: "health-monitor", label: "Health Monitor", icon: Activity, color: "#6B8AFF", route: "agents/renewal/health-monitor" },
      { id: "rescue-planner", label: "Rescue Planner", icon: ShieldAlert, color: "#F87171", route: "agents/renewal/rescue-planner" },
      { id: "outreach-drafter", label: "Outreach Drafter", icon: MailIcon, color: "#22D3EE", route: "agents/renewal/outreach-drafter" },
    ],
  },
  {
    id: "growth", label: "Growth", color: "#34D399",
    agents: [
      { id: "expansion-scout", label: "Expansion Scout", icon: TrendingUp, color: "#34D399", route: "agents/growth/expansion-scout" },
      { id: "forecast-engine", label: "Forecast Engine", icon: BarChart3, color: "#A78BFA", route: "agents/growth/forecast-engine" },
      { id: "opportunity-brief", label: "Opportunity Brief", icon: DollarSign, color: "#34D399", route: "agents/growth/opportunity-brief" },
    ],
  },
  {
    id: "coaching", label: "Coaching", color: "#D4A843",
    agents: [
      { id: "executive-brief", label: "Executive Brief", icon: Crown, color: "#D4A843", route: "agents/coaching/executive-brief" },
      { id: "meeting-prep", label: "Meeting Prep", icon: Users, color: "#22D3EE", route: "agents/coaching/meeting-prep" },
      { id: "playbook-builder", label: "Playbook Builder", icon: FileText, color: "#FB923C", route: "agents/coaching/playbook-builder" },
    ],
  },
];

const ALL_SIDEBAR_AGENTS = AGENT_CATEGORIES.flatMap(c => c.agents);

// ─── Nav Configuration ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Command Center" },
  { id: "accounts", icon: MessageSquare, label: "Accounts" },
  { id: "agents", icon: Sparkles, label: "Agents", expandable: true },
  { id: "tasks", icon: CheckSquare, label: "Action Center" },
];

const SECONDARY_ITEMS = [
  { id: "import", icon: Upload, label: "Data Sources" },
];

// ─── Workspace Switcher ──────────────────────────────────────────────────────
function WorkspaceSwitcher({ collapsed }) {
  const { workspaces, activeWsId, switchWorkspace, createWorkspace, renameWorkspace, deleteWorkspace } = useAppStore();
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
        <button onClick={() => setOpen(!open)} title={activeWs.name} style={{
          width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.borderDefault}`,
          background: C.bgCard, color: C.gold, fontFamily: FONT_SANS, fontSize: 12,
          fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {activeWs.icon || activeWs.name.charAt(0).toUpperCase()}
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="bc-sidebar-ws-expanded" style={{ padding: "0 12px 8px", position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "7px 10px", borderRadius: 6, cursor: "pointer",
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
        }}>{activeWs.icon || activeWs.name.charAt(0).toUpperCase()}</span>
        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {activeWs.name}
        </span>
        <span style={{ fontSize: 11, color: C.textTertiary, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 12, right: 12, zIndex: 200,
          background: C.bgElevated, border: `1px solid ${C.borderSubtle}`,
          borderRadius: 8, padding: 4, marginTop: 4,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}>
          {workspaces.map(ws => (
            <div key={ws.id}>
              {renamingId === ws.id ? (
                <div style={{ display: "flex", gap: 4, padding: "4px 6px" }}>
                  <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && renameVal.trim()) { renameWorkspace(ws.id, renameVal); setRenamingId(null); }
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    style={{ flex: 1, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 4, padding: "4px 8px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 12, outline: "none" }}
                  />
                  <button onClick={() => { if (renameVal.trim()) { renameWorkspace(ws.id, renameVal); setRenamingId(null); } }}
                    style={{ background: "none", border: "none", color: C.green, cursor: "pointer", fontSize: 12 }}>✓</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => { switchWorkspace(ws.id); setOpen(false); }} style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 8px", borderRadius: 5, cursor: "pointer",
                    background: ws.id === activeWsId ? C.goldMuted : "transparent",
                    border: "none", textAlign: "left", transition: "background 0.12s",
                  }}
                    onMouseEnter={e => { if (ws.id !== activeWsId) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (ws.id !== activeWsId) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{
                      width: 20, height: 20, borderRadius: 4, background: ws.id === activeWsId ? C.gold + "20" : C.bgSurface,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: ws.id === activeWsId ? C.gold : C.textTertiary, fontFamily: FONT_SANS,
                    }}>{ws.icon || ws.name.charAt(0).toUpperCase()}</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: ws.id === activeWsId ? C.textPrimary : C.textSecondary }}>{ws.name}</span>
                    {ws.id === activeWsId && <span style={{ fontSize: 10, color: C.gold, marginLeft: "auto" }}>●</span>}
                  </button>
                  <button onClick={() => { setRenamingId(ws.id); setRenameVal(ws.name); }} title="Rename"
                    style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 10, padding: "4px", flexShrink: 0 }}>✎</button>
                  {ws.id !== WS_DEFAULT_ID && (
                    confirmDeleteId === ws.id ? (
                      <button onClick={() => { deleteWorkspace(ws.id); setConfirmDeleteId(null); setOpen(false); }} title="Confirm delete"
                        style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 10, padding: "4px", flexShrink: 0 }}>✓</button>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(ws.id)} title="Delete workspace"
                        style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 10, padding: "4px", flexShrink: 0 }}>✕</button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
          <div style={{ height: 1, background: C.borderDefault, margin: "4px 6px" }} />
          {creating ? (
            <div style={{ padding: "4px 6px" }}>
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Workspace name..."
                onKeyDown={e => {
                  if (e.key === "Enter" && newName.trim()) { createWorkspace(newName); setNewName(""); setCreating(false); setOpen(false); }
                  if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
                style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 4, padding: "6px 8px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 12, outline: "none" }}
              />
            </div>
          ) : (
            <button onClick={() => setCreating(true)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "7px 8px", borderRadius: 5, cursor: "pointer", background: "transparent", border: "none", textAlign: "left",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ width: 20, height: 20, borderRadius: 4, background: C.bgSurface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.textTertiary }}>+</span>
              <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textTertiary }}>New Workspace</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Profile Dropdown ────────────────────────────────────────────────────────
function ProfileDropdown({ user, displayName, avatarUrl, initials, isExpanded, activeView, onNavigate, signOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!user) return null;

  const avatar = avatarUrl ? (
    <img src={avatarUrl} alt="" style={{
      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      border: `1px solid ${C.borderDefault}`,
    }} referrerPolicy="no-referrer" />
  ) : (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      background: C.goldMuted, border: `1px solid ${C.gold}20`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 600, color: C.gold, fontFamily: FONT_SANS,
    }}>{initials}</div>
  );

  return (
    <div ref={ref} style={{ position: "relative", padding: isExpanded ? "8px 12px 16px" : "8px 0 16px" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: isExpanded ? "8px 8px" : "8px 0",
          borderRadius: 8, cursor: "pointer",
          background: open ? "rgba(255,255,255,0.07)" : activeView === "settings" ? "rgba(255,255,255,0.05)" : "transparent",
          border: "none",
          justifyContent: isExpanded ? "flex-start" : "center",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        onMouseLeave={e => { if (!open && activeView !== "settings") e.currentTarget.style.background = "transparent"; }}
      >
        {avatar}
        {isExpanded && (
          <>
            <span className="bc-sidebar-text" style={{
              fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600,
              color: C.textPrimary, flex: 1, textAlign: "left",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{displayName}</span>
            <ChevronUp size={12} style={{
              color: C.textTertiary, flexShrink: 0,
              transition: "transform 0.15s",
              transform: open ? "rotate(0deg)" : "rotate(180deg)",
            }} />
          </>
        )}
      </button>

      {/* Upward dropdown menu */}
      {open && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: isExpanded ? 12 : -4,
          right: isExpanded ? 12 : -4,
          minWidth: isExpanded ? undefined : 200,
          zIndex: 200,
          background: C.bgElevated,
          border: `1px solid ${C.borderSubtle}`,
          borderRadius: 10,
          padding: 4,
          marginBottom: 4,
          boxShadow: "0 -8px 30px rgba(0,0,0,0.4)",
        }}>
          {/* Email header */}
          <div style={{
            padding: "10px 12px 8px",
            borderBottom: `1px solid ${C.borderDefault}`,
            marginBottom: 4,
          }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
              {displayName}
            </div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, marginTop: 1 }}>
              {user.email}
            </div>
          </div>

          {/* Settings */}
          <button
            onClick={() => { onNavigate("settings"); setOpen(false); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 6, cursor: "pointer",
              background: activeView === "settings" ? C.goldMuted : "transparent",
              border: "none", textAlign: "left",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => { if (activeView !== "settings") e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { if (activeView !== "settings") e.currentTarget.style.background = "transparent"; }}
          >
            <SettingsIcon size={14} style={{ color: activeView === "settings" ? C.gold : C.textTertiary }} />
            <span style={{
              fontFamily: FONT_SANS, fontSize: 13,
              fontWeight: activeView === "settings" ? 600 : 400,
              color: activeView === "settings" ? C.textPrimary : C.textSecondary,
            }}>Settings</span>
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: C.borderDefault, margin: "4px 8px" }} />

          {/* Sign out */}
          <button
            onClick={() => { signOut(); setOpen(false); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 6, cursor: "pointer",
              background: "transparent", border: "none", textAlign: "left",
              transition: "background 0.12s",
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
  const [agentsExpanded, setAgentsExpanded] = useState(false);
  const isExpanded = !sidebarCollapsed;

  // Auto-expand agents section when viewing an agent page
  useEffect(() => {
    if (activeView.startsWith("agents/")) setAgentsExpanded(true);
  }, [activeView]);

  const displayName = profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
  const initials = displayName ? displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div style={{
      width: isExpanded ? 240 : 56,
      minWidth: isExpanded ? 240 : 56,
      background: C.bgSidebar,
      borderRight: `1px solid ${C.borderDefault}`,
      display: "flex", flexDirection: "column",
      transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      overflow: "hidden", zIndex: 100, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: isExpanded ? "20px 20px 16px" : "20px 0 16px", display: "flex", alignItems: "center", gap: 10, justifyContent: isExpanded ? "space-between" : "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: C.bgSidebar,
            fontFamily: FONT_MONO, flexShrink: 0,
          }}>B</div>
          {isExpanded && (
            <span className="bc-sidebar-text" style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 17, color: C.textPrimary, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
              BaseCommand
            </span>
          )}
        </div>
        {isExpanded && (
          <button className="bc-sidebar-collapse-btn" onClick={() => setSidebarCollapsed(true)} style={{
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

      <WorkspaceSwitcher collapsed={!isExpanded} />

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "4px 0", overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Primary nav items */}
        <div>
          {NAV_ITEMS.map(item => {
            const active = activeView === item.id || activeView.startsWith(item.id + "/");
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
                    display: "flex", alignItems: "center", gap: 12,
                    padding: isExpanded ? "10px 20px" : "10px 0",
                    justifyContent: isExpanded ? "flex-start" : "center",
                    color: active ? C.textPrimary : isHovered ? C.textPrimary : C.textSecondary,
                    borderRight: active ? `2px solid ${C.gold}` : "2px solid transparent",
                    transition: "all 0.12s ease", position: "relative",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0, width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <item.icon size={18} strokeWidth={active ? 2 : 1.75} style={{ opacity: active ? 1 : 0.75 }} />
                    {isAgents && !isExpanded && (
                      <div style={{
                        position: "absolute", top: -2, right: -2,
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#34D399", border: `1.5px solid ${C.bgSidebar}`,
                        boxShadow: "0 0 4px rgba(52, 211, 153, 0.6)",
                      }} />
                    )}
                  </div>
                  {isExpanded && (
                    <span className="bc-sidebar-text" style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: active ? 600 : 500, whiteSpace: "nowrap", flex: 1 }}>{item.label}</span>
                  )}
                  {isAgents && isExpanded && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary,
                        background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 3,
                        lineHeight: "14px",
                      }}>{ALL_SIDEBAR_AGENTS.length}</span>
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

                {/* Agent categories with sub-items */}
                {isAgents && isExpanded && agentsExpanded && (
                  <div style={{ overflow: "hidden" }}>
                    {AGENT_CATEGORIES.map(category => (
                      <div key={category.id}>
                        <div style={{
                          fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600,
                          color: category.color, textTransform: "uppercase",
                          letterSpacing: "0.08em", padding: "8px 20px 3px 34px",
                          opacity: 0.7,
                        }}>{category.label}</div>
                        {category.agents.map(agent => {
                          const agentActive = activeView === agent.route;
                          const agentHovered = hoveredItem === agent.route;
                          return (
                            <button
                              key={agent.id}
                              className="bc-sidebar-nav-btn"
                              onClick={() => onNavigate(agent.route)}
                              onMouseEnter={() => setHoveredItem(agent.route)}
                              onMouseLeave={() => setHoveredItem(null)}
                              style={{
                                width: "100%", border: "none", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "6px 20px 6px 38px",
                                background: agentActive ? "rgba(255,255,255,0.05)" : agentHovered ? "rgba(255,255,255,0.03)" : "transparent",
                                borderRight: agentActive ? `2px solid ${agent.color}` : "2px solid transparent",
                                transition: "all 0.12s ease",
                                color: agentActive ? C.textPrimary : agentHovered ? C.textSecondary : C.textTertiary,
                              }}
                            >
                              <div style={{
                                width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                                background: agentActive ? agent.color : agent.color + "60",
                                boxShadow: agentActive ? `0 0 6px ${agent.color}60` : "none",
                                transition: "all 0.15s",
                              }} />
                              <span className="bc-sidebar-text" style={{
                                fontFamily: FONT_SANS, fontSize: 12,
                                fontWeight: agentActive ? 600 : 400,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              }}>{agent.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Divider + Secondary items */}
        <div>
          <div style={{ width: isExpanded ? "85%" : 20, height: 1, background: C.borderDefault, margin: "4px auto 4px" }} />
          {SECONDARY_ITEMS.map(item => {
            const active = activeView === item.id;
            const isHovered = hoveredItem === item.id;
            return (
              <button
                key={item.id}
                className="bc-sidebar-nav-btn"
                onClick={() => onNavigate(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  width: "100%",
                  background: active ? "rgba(255,255,255,0.07)" : isHovered ? "rgba(255,255,255,0.04)" : "none",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  padding: isExpanded ? "10px 20px" : "10px 0",
                  justifyContent: isExpanded ? "flex-start" : "center",
                  color: active ? C.textPrimary : isHovered ? C.textPrimary : C.textTertiary,
                  borderRight: active ? `2px solid ${C.gold}` : "2px solid transparent",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.icon size={18} strokeWidth={active ? 2 : 1.75} style={{ opacity: active ? 1 : 0.6 }} />
                </div>
                {isExpanded && (
                  <span className="bc-sidebar-text" style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: active ? 600 : 500, whiteSpace: "nowrap" }}>{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── Profile Dropdown (Linear/Notion pattern) ──────────────────────── */}
      <ProfileDropdown
        user={user}
        displayName={displayName}
        avatarUrl={avatarUrl}
        initials={initials}
        isExpanded={isExpanded}
        activeView={activeView}
        onNavigate={onNavigate}
        signOut={signOut}
      />
    </div>
  );
}
