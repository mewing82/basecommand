import { useState } from "react";
import { User, Building2, Sparkles, Plug, Database, CreditCard, Users, Key, Bot } from "lucide-react";
import { C, FONT_SANS, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { PageLayout } from "../components/layout/PageLayout";
import ProfileSettings from "./settings/ProfileSettings";
import CompanySettings from "./settings/CompanySettings";
import AISettings from "./settings/AISettings";
import ConnectorSettings from "./settings/ConnectorSettings";
import DataSettings from "./settings/DataSettings";
import IntegrationSettings from "./settings/IntegrationSettings";
import BillingSettings from "./settings/BillingSettings";
import TeamSettings from "./settings/TeamSettings";
import AutonomySettings from "./settings/AutonomySettings";

const TABS = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "autonomy", label: "Autonomy", icon: Bot },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "integrations", label: "Integrations", icon: Key },
  { id: "connectors", label: "Connectors", icon: Plug },
  { id: "data", label: "Data", icon: Database },
];

export default function Settings() {
  const { isMobile } = useMediaQuery();
  const [activeTab, setActiveTab] = useState("company");

  return (
    <PageLayout maxWidth={920}>
      <div style={{ fontFamily: FONT_SANS, fontSize: fs(26, 20, isMobile), fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", marginBottom: isMobile ? 16 : 28 }}>Settings</div>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 32, alignItems: "flex-start" }} className="bc-settings-layout">
        {/* Sidebar Nav */}
        <nav className="bc-settings-nav" style={{
          width: isMobile ? "100%" : 180,
          minWidth: isMobile ? undefined : 180,
          flexShrink: 0,
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          overflowX: isMobile ? "auto" : undefined,
          WebkitOverflowScrolling: "touch",
          gap: isMobile ? 2 : 0,
        }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: isMobile ? 6 : 10,
                width: isMobile ? "auto" : "100%",
                padding: isMobile ? "8px 14px" : "9px 12px", borderRadius: 8,
                cursor: "pointer",
                background: isActive ? "rgba(0,0,0,0.05)" : "transparent",
                border: "none",
                borderLeft: isMobile ? "none" : (isActive ? `2px solid ${C.gold}` : "2px solid transparent"),
                borderBottom: isMobile ? (isActive ? `2px solid ${C.gold}` : "2px solid transparent") : "none",
                color: isActive ? C.textPrimary : C.textSecondary,
                fontFamily: FONT_SANS, fontSize: 13, fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.color = C.textPrimary; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSecondary; } }}
              >
                <Icon size={15} strokeWidth={1.75} />
                <span style={{ flex: isMobile ? undefined : 1 }}>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Panel */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: isMobile ? "100%" : 660 }}>
          {activeTab === "company" && <CompanySettings />}
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "ai" && <AISettings />}
          {activeTab === "autonomy" && <AutonomySettings />}
          {activeTab === "billing" && <BillingSettings />}
          {activeTab === "team" && <TeamSettings />}
          {activeTab === "integrations" && <IntegrationSettings />}
          {activeTab === "connectors" && <ConnectorSettings />}
          {activeTab === "data" && <DataSettings />}
        </div>
      </div>
    </PageLayout>
  );
}
