import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Radio, Bot, CheckSquare, Crown,
  Settings as SettingsIcon, Upload,
  ChevronLeft, ChevronRight, LogOut, MessageSquare,
} from "lucide-react";
import { C, FONT_SANS, FONT_MONO } from "../../lib/tokens";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";

const WS_DEFAULT_ID = "ws_default";

// ─── Nav Configuration ───────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { label: "Renewals", items: [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "accounts", icon: MessageSquare, label: "Accounts" },
    { id: "autopilot", icon: Bot, label: "Autopilot" },
    { id: "intel", icon: Radio, label: "Intel" },
    { id: "leadership", icon: Crown, label: "Leadership" },
    { id: "tasks", icon: CheckSquare, label: "Tasks" },
  ]},
  { label: "Utility", items: [
    { id: "import", icon: Upload, label: "Import" },
  ]},
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

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export default function Sidebar({ activeView, onNavigate }) {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const { user, profile, signOut } = useAuthStore();
  const [hoveredItem, setHoveredItem] = useState(null);
  const isExpanded = !sidebarCollapsed;

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

      {/* Nav sections */}
      <nav style={{ flex: 1, padding: "4px 0", overflow: "hidden" }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom: 8 }}>
            {isExpanded && (
              <div className="bc-sidebar-section-label" style={{
                fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, color: C.textTertiary,
                padding: "8px 20px 4px", textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{section.label}</div>
            )}
            {!isExpanded && si > 0 && (
              <div style={{ width: 20, height: 1, background: C.borderDefault, margin: "6px auto" }} />
            )}
            {section.items.map(item => {
              const active = activeView === item.id;
              const isHovered = hoveredItem === item.id;
              return (
                <button key={item.id}
                  className="bc-sidebar-nav-btn"
                  onClick={() => onNavigate(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    width: "100%",
                    background: active ? "rgba(255,255,255,0.07)" : isHovered ? "rgba(255,255,255,0.04)" : "none",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 12,
                    padding: isExpanded ? "12px 20px" : "12px 0",
                    justifyContent: isExpanded ? "flex-start" : "center",
                    color: active ? C.textPrimary : isHovered ? C.textPrimary : C.textSecondary,
                    borderRight: active ? `2px solid ${C.gold}` : "2px solid transparent",
                    transition: "all 0.12s ease", position: "relative",
                  }}
                >
                  <item.icon size={18} strokeWidth={active ? 2 : 1.75} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
                  {isExpanded && (
                    <span className="bc-sidebar-text" style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: active ? 600 : 500, whiteSpace: "nowrap" }}>{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User profile */}
      {user && (
        <div style={{
          padding: isExpanded ? "12px 16px" : "12px 0",
          display: "flex", alignItems: "center", gap: 10,
          justifyContent: isExpanded ? "flex-start" : "center",
        }}>
          {avatarUrl ? (
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
          )}
          {isExpanded && (
            <div className="bc-sidebar-user-details" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayName}
              </div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email}
              </div>
            </div>
          )}
          {isExpanded && (
            <button
              className="bc-sidebar-signout-btn"
              onClick={signOut}
              title="Sign out"
              style={{
                background: "none", border: "none", color: C.textTertiary, cursor: "pointer",
                padding: 4, borderRadius: 6, flexShrink: 0, transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.red}
              onMouseLeave={e => e.currentTarget.style.color = C.textTertiary}
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      )}

      <div style={{ width: isExpanded ? "85%" : 20, height: 1, background: C.borderDefault, margin: "4px auto 8px" }} />

      {/* Settings */}
      <button
        className="bc-sidebar-nav-btn"
        onClick={() => onNavigate("settings")}
        onMouseEnter={() => setHoveredItem("settings")}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          width: "100%", background: activeView === "settings" ? "rgba(255,255,255,0.07)" : hoveredItem === "settings" ? "rgba(255,255,255,0.04)" : "none",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12, padding: isExpanded ? "12px 20px 20px" : "12px 0 20px",
          justifyContent: isExpanded ? "flex-start" : "center",
          color: activeView === "settings" ? C.textPrimary : hoveredItem === "settings" ? C.textPrimary : C.textSecondary,
          borderRight: activeView === "settings" ? `2px solid ${C.gold}` : "2px solid transparent",
          transition: "all 0.12s ease",
        }}
      >
        <SettingsIcon size={18} strokeWidth={activeView === "settings" ? 2 : 1.75} style={{ flexShrink: 0, opacity: activeView === "settings" ? 1 : 0.75 }} />
        {isExpanded && <span className="bc-sidebar-text" style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: activeView === "settings" ? 600 : 500, whiteSpace: "nowrap" }}>Settings</span>}
      </button>
    </div>
  );
}
