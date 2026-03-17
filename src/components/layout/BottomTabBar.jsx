import { useState } from "react";
import {
  LayoutDashboard, MessageSquare, Sparkles,
  MoreHorizontal, CheckSquare, Upload,
  Settings as SettingsIcon, X,
} from "lucide-react";
import { C, FONT_SANS } from "../../lib/tokens";

// Primary tabs shown in the bottom bar
const PRIMARY_TABS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "accounts", icon: MessageSquare, label: "Accounts" },
  { id: "agents", icon: Sparkles, label: "Agents" },
  { id: "tasks", icon: CheckSquare, label: "Tasks" },
];

// Overflow items shown in the "More" bottom sheet
const MORE_ITEMS = [
  { id: "import", icon: Upload, label: "Data Sources" },
  { id: "settings", icon: SettingsIcon, label: "Settings" },
];

export default function BottomTabBar({ activeView, onNavigate }) {
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = MORE_ITEMS.some(item => item.id === activeView) || (!["dashboard", "accounts", "agents", "tasks"].includes(activeView) && !activeView.startsWith("agents/"));

  const handleNavigate = (id) => {
    onNavigate(id);
    setShowMore(false);
  };

  return (
    <>
      {/* Bottom sheet overlay */}
      {showMore && (
        <div
          onClick={() => setShowMore(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 998,
            background: "rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      {/* More bottom sheet */}
      {showMore && (
        <div style={{
          position: "fixed", bottom: 56, left: 0, right: 0, zIndex: 999,
          background: C.bgElevated,
          borderTop: `1px solid ${C.borderSubtle}`,
          borderRadius: "16px 16px 0 0",
          padding: "12px 0 8px",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.4)",
        }}>
          {/* Drag handle */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: C.borderSubtle, margin: "0 auto 12px",
          }} />

          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0 20px 12px",
            borderBottom: `1px solid ${C.borderDefault}`,
          }}>
            <span style={{
              fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary,
            }}>More</span>
            <button
              onClick={() => setShowMore(false)}
              style={{
                background: "none", border: "none", color: C.textTertiary,
                cursor: "pointer", padding: 4, borderRadius: 6,
                display: "flex", alignItems: "center",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Grid of items */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 4, padding: "12px 12px 8px",
          }}>
            {MORE_ITEMS.map(item => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "14px 8px", borderRadius: 12, border: "none",
                    background: active ? C.goldMuted : "transparent",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                >
                  <item.icon
                    size={22}
                    strokeWidth={active ? 2 : 1.5}
                    style={{ color: active ? C.gold : C.textSecondary }}
                  />
                  <span style={{
                    fontFamily: FONT_SANS, fontSize: 12, fontWeight: active ? 600 : 500,
                    color: active ? C.textPrimary : C.textSecondary,
                  }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="bc-bottom-tab-bar" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000,
        height: 56,
        background: `${C.bgSidebar}F5`,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderTop: `1px solid ${C.borderDefault}`,
        display: "none", /* shown via CSS media query */
        alignItems: "center", justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {PRIMARY_TABS.map(tab => {
          const active = activeView === tab.id || activeView.startsWith(tab.id + "/");
          return (
            <button
              key={tab.id}
              onClick={() => handleNavigate(tab.id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3, padding: "6px 0",
                background: "none", border: "none", cursor: "pointer",
                minHeight: 44, /* touch target */
              }}
            >
              <tab.icon
                size={20}
                strokeWidth={active ? 2.25 : 1.5}
                style={{
                  color: active ? C.gold : C.textTertiary,
                  transition: "color 0.15s",
                }}
              />
              <span style={{
                fontFamily: FONT_SANS, fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? C.gold : C.textTertiary,
                letterSpacing: "0.02em",
                transition: "color 0.15s",
              }}>{tab.label}</span>
              {active && (
                <div style={{
                  position: "absolute", top: 0, width: 24, height: 2,
                  borderRadius: "0 0 2px 2px",
                  background: C.gold,
                }} />
              )}
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore(prev => !prev)}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 3, padding: "6px 0",
            background: "none", border: "none", cursor: "pointer",
            minHeight: 44,
          }}
        >
          <MoreHorizontal
            size={20}
            strokeWidth={isMoreActive ? 2.25 : 1.5}
            style={{
              color: isMoreActive ? C.gold : C.textTertiary,
              transition: "color 0.15s",
            }}
          />
          <span style={{
            fontFamily: FONT_SANS, fontSize: 10, fontWeight: isMoreActive ? 700 : 500,
            color: isMoreActive ? C.gold : C.textTertiary,
            letterSpacing: "0.02em",
            transition: "color 0.15s",
          }}>More</span>
          {isMoreActive && (
            <div style={{
              position: "absolute", top: 0, width: 24, height: 2,
              borderRadius: "0 0 2px 2px",
              background: C.gold,
            }} />
          )}
        </button>
      </nav>
    </>
  );
}
