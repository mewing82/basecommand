import { AlertTriangle } from "lucide-react";
import { C, FONT_SANS, FONT_BODY } from "../../lib/tokens";
import { SettingsSection } from "./SettingsShared";

export default function ConnectorSettings() {
  return (
    <SettingsSection title="Connectors">
      <div style={{ padding: "12px 14px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><AlertTriangle size={14} style={{ color: C.amber, flexShrink: 0 }} /><span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>Requires approved backend</span></div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>Email connectors (Gmail, Outlook) require a server-side backend for OAuth. All AI processing happens directly between your browser and the AI provider.</div>
      </div>
    </SettingsSection>
  );
}
