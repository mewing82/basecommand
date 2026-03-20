import { C, FONT_SANS, FONT_MONO } from "../../lib/tokens";

export function SettingsSection({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textTertiary, letterSpacing: "-0.01em", marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.borderDefault}` }}>{title}</div>
      {children}
    </div>
  );
}

export function SettingsRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid rgba(0,0,0,0.03)` }}>
      <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textSecondary }}>{label}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{value}</span>
    </div>
  );
}
