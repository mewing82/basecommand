import { useState, useEffect } from "react";
import { C, FONT_SANS, FONT_BODY } from "../../lib/tokens";
import { renewalStore } from "../../lib/storage";
import { useAppStore } from "../../store/appStore";
import { Btn } from "../../components/ui/index";
import { SettingsSection } from "./SettingsShared";

export default function ProfileSettings() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [selectedPersona, setSelectedPersona] = useState(null);

  useEffect(() => {
    renewalStore.getSettings().then(s => {
      setSelectedPersona(s.persona || null);
    });
  }, []);

  return (
    <>
      <SettingsSection title="Your Role">
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 14, lineHeight: 1.5 }}>This helps BaseCommand personalize task suggestions and AI recommendations for your workflow.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { id: "specialist", title: "Renewal Specialist", desc: "Running the renewal process day-to-day" },
            { id: "director", title: "Renewal Leader", desc: "Managing a renewal portfolio and team" },
            { id: "revenue_leader", title: "Revenue Leader", desc: "VP/CRO managing sales with renewal responsibility" },
            { id: "revops", title: "RevOps", desc: "Operationalizing revenue processes and data" },
            { id: "founder", title: "Founder", desc: "Running a SaaS company, managing renewals directly" },
          ].map(p => {
            const isSelected = selectedPersona === p.id;
            return (
              <button key={p.id} onClick={async () => { setSelectedPersona(p.id); const current = await renewalStore.getSettings(); await renewalStore.saveSettings({ ...current, persona: p.id }); }} style={{ padding: "14px 18px", borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%", border: `1px solid ${isSelected ? C.gold + "60" : C.borderDefault}`, background: isSelected ? C.goldMuted : "transparent" }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: isSelected ? C.textPrimary : C.textSecondary }}>{p.title}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginTop: 2 }}>{p.desc}</div>
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="Display Preferences">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary }}>Sidebar collapsed by default</span>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: sidebarCollapsed ? C.gold : C.borderDefault, position: "relative", transition: "background 0.2s" }}>
            <span style={{ position: "absolute", top: 3, left: sidebarCollapsed ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </button>
        </div>
      </SettingsSection>
    </>
  );
}
