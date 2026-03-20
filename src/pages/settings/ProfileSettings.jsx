import { useState, useEffect } from "react";
import { User, Target, Crown, TrendingUp, Settings2, Rocket, Monitor } from "lucide-react";
import { C, FONT_SANS, FONT_BODY } from "../../lib/tokens";
import { renewalStore } from "../../lib/storage";
import { useAppStore } from "../../store/appStore";

const cardStyle = { padding: "18px 20px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, marginBottom: 12 };
const cardHeaderStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 };
const cardLabelStyle = { fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 };

const PERSONAS = [
  { id: "specialist", title: "Renewal Specialist", desc: "Running the renewal process day-to-day", Icon: Target, color: C.aiBlue },
  { id: "director", title: "Renewal Leader", desc: "Managing a renewal portfolio and team", Icon: Crown, color: C.gold },
  { id: "revenue_leader", title: "Revenue Leader", desc: "VP/CRO managing sales with renewal responsibility", Icon: TrendingUp, color: C.green },
  { id: "revops", title: "RevOps", desc: "Operationalizing revenue processes and data", Icon: Settings2, color: C.amber },
  { id: "founder", title: "Founder", desc: "Running a SaaS company, managing renewals directly", Icon: Rocket, color: "#8B5CF6" },
];

export default function ProfileSettings() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [selectedPersona, setSelectedPersona] = useState(null);

  useEffect(() => {
    renewalStore.getSettings().then(s => {
      setSelectedPersona(s.persona || null);
    });
  }, []);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>Profile</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>Personalize your BaseCommand experience</div>
      </div>

      {/* Your Role card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <User size={16} style={{ color: C.gold }} />
          <span style={cardLabelStyle}>Your Role</span>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 14, lineHeight: 1.5 }}>This helps BaseCommand personalize task suggestions and AI recommendations for your workflow.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PERSONAS.map(p => {
            const isSelected = selectedPersona === p.id;
            return (
              <button key={p.id} onClick={async () => { setSelectedPersona(p.id); const current = await renewalStore.getSettings(); await renewalStore.saveSettings({ ...current, persona: p.id }); }} style={{ padding: "14px 18px", borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%", border: `1px solid ${isSelected ? C.gold + "60" : C.borderDefault}`, background: isSelected ? C.goldMuted : "transparent", display: "flex", alignItems: "center", gap: 12 }}>
                <p.Icon size={18} style={{ color: isSelected ? p.color : C.textTertiary, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: isSelected ? C.textPrimary : C.textSecondary }}>{p.title}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginTop: 2 }}>{p.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Display Preferences card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Monitor size={16} style={{ color: C.aiBlue }} />
          <span style={cardLabelStyle}>Display</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary }}>Sidebar collapsed by default</span>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: sidebarCollapsed ? C.gold : C.borderDefault, position: "relative", transition: "background 0.2s" }}>
            <span style={{ position: "absolute", top: 3, left: sidebarCollapsed ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary }}>Theme</span>
          <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary }}>Dark</span>
        </div>
      </div>
    </div>
  );
}
