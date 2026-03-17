import { useState } from "react";
import { User, Building2, Sparkles, Plug, Database } from "lucide-react";
import { C, FONT_SANS, FONT_BODY } from "../lib/tokens";
import { PageLayout } from "../components/layout/PageLayout";
import ProfileSettings from "./settings/ProfileSettings";
import CompanySettings from "./settings/CompanySettings";
import AISettings from "./settings/AISettings";
import ConnectorSettings from "./settings/ConnectorSettings";
import DataSettings from "./settings/DataSettings";

const TABS = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "connectors", label: "Connectors", icon: Plug },
  { id: "data", label: "Data", icon: Database },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("company");

  return (
    <PageLayout maxWidth={880}>
      <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", marginBottom: 32 }}>Settings</div>

      <div className="bc-settings-layout">
        {/* Sidebar Nav */}
        <nav className="bc-settings-nav" style={{ width: 200, flexShrink: 0, position: "sticky", top: 80 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                border: "none", borderLeft: isActive ? `2px solid ${C.gold}` : "2px solid transparent",
                color: isActive ? C.textPrimary : C.textSecondary,
                fontFamily: FONT_SANS, fontSize: 13, fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = C.textPrimary; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSecondary; } }}
              >
                <Icon size={16} strokeWidth={1.75} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content Panel */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 640 }}>
          {activeTab === "company" && <CompanySettings />}
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "ai" && <AISettings />}
          {activeTab === "connectors" && <ConnectorSettings />}
          {activeTab === "data" && <DataSettings />}
        </div>
      </div>
    </PageLayout>
  );
}
