import { Mail, Database, MessageSquare } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { Btn } from "../../components/ui/index";

const cardStyle = { padding: "18px 20px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, marginBottom: 12 };
const cardHeaderStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 };
const cardLabelStyle = { fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 };
const comingSoonBadge = { fontFamily: FONT_MONO, fontSize: 9, padding: "2px 6px", borderRadius: 3, border: `1px solid ${C.borderDefault}`, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.03em" };
const statusBadge = { fontFamily: FONT_MONO, fontSize: 9, padding: "2px 6px", borderRadius: 3, border: `1px solid ${C.borderDefault}`, color: C.textTertiary };
const rowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid rgba(0,0,0,0.03)` };
const rowLeftStyle = { display: "flex", alignItems: "center", gap: 10 };
const rowRightStyle = { display: "flex", alignItems: "center", gap: 8 };

function ConnectorIcon({ color, children }) {
  return <div style={{ width: 28, height: 28, borderRadius: 6, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{children}</div>;
}

export default function ConnectorSettings() {
  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>Connectors</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>Connect your tools to enrich renewal intelligence</div>
      </div>

      {/* Email card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Mail size={16} style={{ color: C.gold }} />
          <span style={cardLabelStyle}>Email</span>
        </div>
        {/* Gmail row */}
        <div style={rowStyle}>
          <div style={rowLeftStyle}>
            <ConnectorIcon color="#EA4335">
              <Mail size={14} style={{ color: "#EA4335" }} />
            </ConnectorIcon>
            <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textPrimary }}>Gmail</span>
          </div>
          <div style={rowRightStyle}>
            <span style={statusBadge}>Not connected</span>
            <Btn variant="outline" size="sm" disabled>Connect</Btn>
          </div>
        </div>
        {/* Outlook row */}
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div style={rowLeftStyle}>
            <ConnectorIcon color="#0078D4">
              <Mail size={14} style={{ color: "#0078D4" }} />
            </ConnectorIcon>
            <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textPrimary }}>Outlook</span>
          </div>
          <div style={rowRightStyle}>
            <span style={statusBadge}>Not connected</span>
            <Btn variant="outline" size="sm" disabled>Connect</Btn>
          </div>
        </div>
      </div>

      {/* CRM card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Database size={16} style={{ color: C.aiBlue }} />
          <span style={cardLabelStyle}>CRM</span>
        </div>
        {/* Salesforce row */}
        <div style={rowStyle}>
          <div style={rowLeftStyle}>
            <ConnectorIcon color="#00A1E0">
              <Database size={14} style={{ color: "#00A1E0" }} />
            </ConnectorIcon>
            <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textPrimary }}>Salesforce</span>
          </div>
          <div style={rowRightStyle}>
            <span style={comingSoonBadge}>Coming soon</span>
          </div>
        </div>
        {/* HubSpot row */}
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div style={rowLeftStyle}>
            <ConnectorIcon color="#FF7A59">
              <Database size={14} style={{ color: "#FF7A59" }} />
            </ConnectorIcon>
            <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textPrimary }}>HubSpot</span>
          </div>
          <div style={rowRightStyle}>
            <span style={comingSoonBadge}>Coming soon</span>
          </div>
        </div>
      </div>

      {/* Communication card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <MessageSquare size={16} style={{ color: "#8B5CF6" }} />
          <span style={cardLabelStyle}>Communication</span>
        </div>
        {/* Slack row */}
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div style={rowLeftStyle}>
            <ConnectorIcon color="#E01E5A">
              <MessageSquare size={14} style={{ color: "#E01E5A" }} />
            </ConnectorIcon>
            <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textPrimary }}>Slack</span>
          </div>
          <div style={rowRightStyle}>
            <span style={comingSoonBadge}>Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
