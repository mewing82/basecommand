import { useState } from "react";
import { User, Building2, Sparkles, Plug, Database, CreditCard, Users } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
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
  { id: "billing", label: "Billing", icon: CreditCard, soon: true },
  { id: "team", label: "Team", icon: Users, soon: true },
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
              <button key={tab.id} onClick={() => !tab.soon && setActiveTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: isMobile ? 6 : 10,
                width: isMobile ? "auto" : "100%",
                padding: isMobile ? "8px 14px" : "9px 12px", borderRadius: 8,
                cursor: tab.soon ? "default" : "pointer",
                background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                border: "none",
                borderLeft: isMobile ? "none" : (isActive ? `2px solid ${C.gold}` : "2px solid transparent"),
                borderBottom: isMobile ? (isActive ? `2px solid ${C.gold}` : "2px solid transparent") : "none",
                color: tab.soon ? C.textTertiary + "60" : (isActive ? C.textPrimary : C.textSecondary),
                fontFamily: FONT_SANS, fontSize: 13, fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s", opacity: tab.soon ? 0.5 : 1,
                whiteSpace: "nowrap", flexShrink: 0,
              }}
                onMouseEnter={e => { if (!isActive && !tab.soon) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = C.textPrimary; } }}
                onMouseLeave={e => { if (!isActive && !tab.soon) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSecondary; } }}
              >
                <Icon size={15} strokeWidth={1.75} />
                <span style={{ flex: isMobile ? undefined : 1 }}>{tab.label}</span>
                {tab.soon && !isMobile && <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, padding: "1px 5px", borderRadius: 3, border: `1px solid ${C.borderDefault}` }}>SOON</span>}
              </button>
            );
          })}
        </nav>

        {/* Content Panel */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: isMobile ? "100%" : 660 }}>
          {activeTab === "company" && <CompanySettings />}
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "ai" && <AISettings />}
          {activeTab === "billing" && <BillingPlaceholder />}
          {activeTab === "team" && <TeamPlaceholder />}
          {activeTab === "connectors" && <ConnectorSettings />}
          {activeTab === "data" && <DataSettings />}
        </div>
      </div>
    </PageLayout>
  );
}

// ─── Placeholder components for upcoming tabs ────────────────────────────────
function BillingPlaceholder() {
  return (
    <div style={{ padding: 24, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, textAlign: "center" }}>
      <CreditCard size={32} style={{ color: C.textTertiary, marginBottom: 12 }} />
      <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>Billing & Subscription</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>Manage your subscription, view usage, and update payment methods. Coming soon.</div>
    </div>
  );
}

function TeamPlaceholder() {
  return (
    <div style={{ padding: 24, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, textAlign: "center" }}>
      <Users size={32} style={{ color: C.textTertiary, marginBottom: 12 }} />
      <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>Team Management</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>Invite team members, manage roles, and share your renewal portfolio. Coming soon.</div>
    </div>
  );
}
