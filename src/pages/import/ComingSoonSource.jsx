import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";

export default function ComingSoonSource({ label, color, icon: Icon, description }) {
  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>{label}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>Integration coming soon</div>
      </div>

      {/* Coming soon card */}
      <div style={{
        padding: "40px 24px",
        background: C.bgCard,
        border: `1px solid ${C.borderDefault}`,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 16,
      }}>
        {/* Large icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: color + "14",
          border: `1px solid ${color}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={26} style={{ color: color, opacity: 0.8 }} />
        </div>

        {/* Badge */}
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
          color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em",
          padding: "3px 10px", borderRadius: 4,
          border: `1px solid ${C.borderDefault}`,
          background: "rgba(0,0,0,0.02)",
        }}>Coming Soon</span>

        {/* Description */}
        <p style={{
          fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary,
          lineHeight: 1.6, maxWidth: 360, margin: 0,
        }}>{description}</p>

        <p style={{
          fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary,
          opacity: 0.6, margin: 0,
        }}>We'll notify you when this integration is available.</p>
      </div>
    </div>
  );
}
