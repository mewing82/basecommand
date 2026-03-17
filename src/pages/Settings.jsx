import { useState } from "react";
import { User, Building2, Sparkles, Plug, Database, CreditCard, Users } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
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
  const [activeTab, setActiveTab] = useState("company");

  return (
    <PageLayout maxWidth={920}>
      <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", marginBottom: 28 }}>Settings</div>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }} className="bc-settings-layout">
        {/* Sidebar Nav */}
        <nav className="bc-settings-nav" style={{
          width: 180, minWidth: 180, flexShrink: 0,
        }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => !tab.soon && setActiveTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 12px", borderRadius: 8, cursor: tab.soon ? "default" : "pointer",
                background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                border: "none", borderLeft: isActive ? `2px solid ${C.gold}` : "2px solid transparent",
                color: tab.soon ? C.textTertiary + "60" : (isActive ? C.textPrimary : C.textSecondary),
                fontFamily: FONT_SANS, fontSize: 13, fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s", opacity: tab.soon ? 0.5 : 1,
              }}
                onMouseEnter={e => { if (!isActive && !tab.soon) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = C.textPrimary; } }}
                onMouseLeave={e => { if (!isActive && !tab.soon) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSecondary; } }}
              >
                <Icon size={15} strokeWidth={1.75} />
                <span style={{ flex: 1 }}>{tab.label}</span>
                {tab.soon && <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, padding: "1px 5px", borderRadius: 3, border: `1px solid ${C.borderDefault}` }}>SOON</span>}
              </button>
            );
          })}
        </nav>

        {/* Content Panel */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 660 }}>
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
