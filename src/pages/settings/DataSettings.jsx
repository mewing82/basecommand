import { useState } from "react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { store, getWorkspaces, getActiveWorkspaceId } from "../../lib/storage";
import { Btn } from "../../components/ui/index";
import { SettingsSection, SettingsRow } from "./SettingsShared";

export default function DataSettings() {
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
    <>
      <SettingsSection title="Data Management">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn variant="outline" onClick={exportData}>Export JSON</Btn>
          <Btn variant="outline" onClick={importData}>Import JSON</Btn>
          {clearConfirm ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.red }}>This will delete all data.</span>
              <Btn variant="danger" onClick={() => { store.clearAll(); window.location.reload(); }}>Confirm Clear</Btn>
              <Btn variant="ghost" onClick={() => setClearConfirm(false)}>Cancel</Btn>
            </div>
          ) : (<Btn variant="danger" onClick={() => setClearConfirm(true)}>Clear All Data</Btn>)}
        </div>
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow label="Schema Version" value={localStorage.getItem("bc2-meta:schema-version") || "—"} />
        <SettingsRow label="Storage" value="Supabase Postgres + localStorage fallback" />
        <SettingsRow label="Workspace" value={(() => { const ws = getWorkspaces().find(w => w.id === getActiveWorkspaceId()); return ws ? ws.name : "Default"; })()} />
        <SettingsRow label="App" value="BaseCommand v3.0 — Renewal Operations Platform" />
      </SettingsSection>
    </>
  );
}
