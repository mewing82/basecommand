import { useState } from "react";
import { HardDrive, Download, Upload, AlertTriangle, Info } from "lucide-react";
import { C, FONT_SANS, FONT_BODY } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { store } from "../../lib/storage";
import { useAuthStore } from "../../store/authStore";
import { Btn } from "../../components/ui/index";
import { SettingsRow } from "./SettingsShared";

const cardStyle = { padding: "18px 20px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, marginBottom: 12 };
const cardHeaderStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 };
const cardLabelStyle = { fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 };

export default function DataSettings() {
  const { isMobile } = useMediaQuery();
  const [clearConfirm, setClearConfirm] = useState(false);

  function exportData() {
    const data = store.exportAll(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `base-command-export-${new Date().toISOString().split("T")[0]}.json`; a.click(); URL.revokeObjectURL(url);
  }

  function importData() {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => { const file = e.target.files[0]; if (!file) return; try { const data = JSON.parse(await file.text()); store.importAll(data); window.location.reload(); } catch { alert("Invalid JSON file"); } };
    input.click();
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>Data</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>Export, import, and manage your BaseCommand data</div>
      </div>

      {/* Backup & Restore card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <HardDrive size={16} style={{ color: C.gold }} />
          <span style={cardLabelStyle}>Backup & Restore</span>
        </div>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12 }}>
          {/* Export card */}
          <div style={{ flex: 1, padding: "14px 16px", background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Download size={16} style={{ color: C.aiBlue }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>Export to JSON</span>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5, marginBottom: 12 }}>
              Download all your data as a JSON file for backup or migration.
            </div>
            <Btn variant="outline" size="sm" onClick={exportData}>Export</Btn>
          </div>
          {/* Import card */}
          <div style={{ flex: 1, padding: "14px 16px", background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Upload size={16} style={{ color: C.green }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>Import from JSON</span>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5, marginBottom: 12 }}>
              Restore data from a previously exported JSON backup file.
            </div>
            <Btn variant="outline" size="sm" onClick={importData}>Import</Btn>
          </div>
        </div>
      </div>

      {/* Danger Zone card */}
      <div style={{ ...cardStyle, border: `1px solid ${C.red}30` }}>
        <div style={cardHeaderStyle}>
          <AlertTriangle size={16} style={{ color: C.red }} />
          <span style={{ ...cardLabelStyle, color: C.red }}>Danger Zone</span>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.5, marginBottom: 12 }}>
          Permanently delete all BaseCommand data. This action cannot be undone.
        </div>
        {clearConfirm ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.red }}>This will delete all data.</span>
            <Btn variant="danger" onClick={() => { store.clearAll(); window.location.reload(); }}>Confirm Clear</Btn>
            <Btn variant="ghost" onClick={() => setClearConfirm(false)}>Cancel</Btn>
          </div>
        ) : (<Btn variant="danger" onClick={() => setClearConfirm(true)}>Clear All Data</Btn>)}
      </div>

      {/* System Info card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Info size={16} style={{ color: C.textTertiary }} />
          <span style={cardLabelStyle}>System</span>
        </div>
        <SettingsRow label="Schema Version" value={localStorage.getItem("bc2-meta:schema-version") || "—"} />
        <SettingsRow label="Storage" value="Supabase Postgres + localStorage fallback" />
        <SettingsRow label="Organization" value={(() => { const orgs = useAuthStore.getState().userOrgs; const activeId = useAuthStore.getState().activeOrgId; const org = orgs.find(o => o.id === activeId); return org ? org.name : "—"; })()} />
        <SettingsRow label="App" value="BaseCommand v3.0 — Renewal Operations Platform" />
      </div>
    </div>
  );
}
