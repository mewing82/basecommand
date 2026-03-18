import { useState, useEffect } from "react";
import { Mail, Upload, Database, Phone, Video } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { PageLayout } from "../components/layout/PageLayout";
import { useAuthStore } from "../store/authStore";
import ManualImport from "./import/ManualImport";
import EmailSource from "./import/EmailSource";
import ComingSoonSource from "./import/ComingSoonSource";

// ─── Source Configuration ────────────────────────────────────────────────────
const SOURCES = [
  { id: "gmail", label: "Gmail", icon: Mail, color: "#EA4335", type: "email" },
  { id: "outlook", label: "Outlook", icon: Mail, color: "#0078D4", type: "email" },
  { id: "gong", label: "Gong", icon: Phone, color: "#7C3AED", type: "coming_soon", description: "Import call transcripts and conversation intelligence from your Gong recordings." },
  { id: "zoom", label: "Zoom", icon: Video, color: "#2D8CFF", type: "coming_soon", description: "Extract action items and renewal signals from Zoom meeting recordings." },
  { id: "salesforce", label: "Salesforce", icon: Database, color: "#00A1E0", type: "coming_soon", description: "Sync renewal opportunities, account data, and pipeline from Salesforce." },
  { id: "hubspot", label: "HubSpot", icon: Database, color: "#FF7A59", type: "coming_soon", description: "Import deals, customer engagement data, and renewal timelines from HubSpot." },
];

// ─── Data Sources & Import Hub ───────────────────────────────────────────────
export default function Import() {
  const { user } = useAuthStore();
  const { isMobile } = useMediaQuery();
  const [activeSource, setActiveSource] = useState("gmail");
  const [connectorStatuses, setConnectorStatuses] = useState({});

  // Fetch connection status for email providers (sidebar indicators)
  useEffect(() => {
    if (!user?.id) return;
    for (const provider of ["gmail", "outlook"]) {
      fetch(`/api/connectors/${provider}/status?userId=${user.id}`)
        .then(r => r.json())
        .then(data => setConnectorStatuses(prev => ({ ...prev, [provider]: data })))
        .catch(() => {});
    }
  }, [user?.id]);

  // Check for OAuth callback success params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") {
      setActiveSource("gmail");
      setConnectorStatuses(prev => ({ ...prev, gmail: { connected: true } }));
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("outlook") === "connected") {
      setActiveSource("outlook");
      setConnectorStatuses(prev => ({ ...prev, outlook: { connected: true } }));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const connectedSources = SOURCES.filter(s => s.type !== "coming_soon");
  const comingSoonSources = SOURCES.filter(s => s.type === "coming_soon");

  return (
    <PageLayout maxWidth={960}>
      <div style={{ fontFamily: FONT_SANS, fontSize: fs(26, 20, isMobile), fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", marginBottom: isMobile ? 16 : 28 }}>
        Data Sources & Import
      </div>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 32, alignItems: "flex-start" }} className="bc-import-layout">
        {/* ─── Left Sidebar Nav ─────────────────────────────────────────── */}
        <nav className="bc-import-nav" style={{
          width: isMobile ? "100%" : 180,
          minWidth: isMobile ? undefined : 180,
          flexShrink: 0,
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          gap: 2,
          overflowX: isMobile ? "auto" : undefined,
          WebkitOverflowScrolling: "touch",
        }}>
          {/* Connected Sources section */}
          {!isMobile && <div style={{
            fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary,
            textTransform: "uppercase", letterSpacing: "0.08em",
            padding: "0 12px 6px", marginBottom: 2,
          }}>Connected Sources</div>}

          {connectedSources.map(source => {
            const Icon = source.icon;
            const isActive = activeSource === source.id;
            const status = connectorStatuses[source.id];
            return (
              <button
                key={source.id}
                onClick={() => setActiveSource(source.id)}
                style={{
                  display: "flex", alignItems: "center", gap: isMobile ? 6 : 10,
                  width: isMobile ? "auto" : "100%",
                  padding: isMobile ? "8px 14px" : "9px 12px", borderRadius: 8, cursor: "pointer",
                  background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                  border: "none",
                  borderLeft: isMobile ? "none" : (isActive ? `2px solid ${C.gold}` : "2px solid transparent"),
                  borderBottom: isMobile ? (isActive ? `2px solid ${C.gold}` : "2px solid transparent") : "none",
                  color: isActive ? C.textPrimary : C.textSecondary,
                  fontFamily: FONT_SANS, fontSize: 13, fontWeight: isActive ? 600 : 400,
                  transition: "all 0.15s",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = C.textPrimary; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSecondary; } }}
              >
                <Icon size={15} strokeWidth={1.75} style={{ color: source.color }} />
                <span style={{ flex: isMobile ? undefined : 1 }}>{source.label}</span>
                {status?.connected && (
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: C.green, boxShadow: `0 0 4px ${C.green}60` }} />
                )}
              </button>
            );
          })}

          {/* Coming Soon section */}
          {!isMobile && <div style={{
            fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary,
            textTransform: "uppercase", letterSpacing: "0.08em",
            padding: "12px 12px 6px", marginTop: 4,
          }}>Coming Soon</div>}

          {comingSoonSources.map(source => {
            const Icon = source.icon;
            const isActive = activeSource === source.id;
            return (
              <button
                key={source.id}
                onClick={() => setActiveSource(source.id)}
                style={{
                  display: "flex", alignItems: "center", gap: isMobile ? 6 : 10,
                  width: isMobile ? "auto" : "100%",
                  padding: isMobile ? "8px 14px" : "9px 12px", borderRadius: 8, cursor: "pointer",
                  background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                  border: "none",
                  borderLeft: isMobile ? "none" : (isActive ? `2px solid ${C.gold}` : "2px solid transparent"),
                  borderBottom: isMobile ? (isActive ? `2px solid ${C.gold}` : "2px solid transparent") : "none",
                  color: isActive ? C.textPrimary + "60" : C.textTertiary + "80",
                  fontFamily: FONT_SANS, fontSize: 13, fontWeight: isActive ? 600 : 400,
                  transition: "all 0.15s", opacity: isActive ? 0.8 : 0.5,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.opacity = "0.5"; }}
              >
                <Icon size={15} strokeWidth={1.75} style={{ color: source.color, opacity: 0.6 }} />
                <span style={{ flex: isMobile ? undefined : 1 }}>{source.label}</span>
                {!isMobile && <span style={{
                  fontFamily: FONT_MONO, fontSize: 8, color: C.textTertiary,
                  padding: "1px 4px", borderRadius: 2,
                  border: `1px solid ${C.borderDefault}`,
                }}>SOON</span>}
              </button>
            );
          })}

          {/* Divider */}
          {!isMobile && <div style={{ height: 1, background: C.borderDefault, margin: "10px 12px" }} />}

          {/* Manual Import */}
          <button
            onClick={() => setActiveSource("manual")}
            style={{
              display: "flex", alignItems: "center", gap: isMobile ? 6 : 10,
              width: isMobile ? "auto" : "100%",
              padding: isMobile ? "8px 14px" : "9px 12px", borderRadius: 8, cursor: "pointer",
              background: activeSource === "manual" ? "rgba(255,255,255,0.07)" : "transparent",
              border: "none",
              borderLeft: isMobile ? "none" : (activeSource === "manual" ? `2px solid ${C.gold}` : "2px solid transparent"),
              borderBottom: isMobile ? (activeSource === "manual" ? `2px solid ${C.gold}` : "2px solid transparent") : "none",
              color: activeSource === "manual" ? C.textPrimary : C.textSecondary,
              fontFamily: FONT_SANS, fontSize: 13, fontWeight: activeSource === "manual" ? 600 : 400,
              transition: "all 0.15s",
              whiteSpace: "nowrap", flexShrink: 0,
            }}
            onMouseEnter={e => { if (activeSource !== "manual") { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = C.textPrimary; } }}
            onMouseLeave={e => { if (activeSource !== "manual") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSecondary; } }}
          >
            <Upload size={15} strokeWidth={1.75} />
            <span style={{ flex: isMobile ? undefined : 1 }}>Manual Import</span>
          </button>
        </nav>

        {/* ─── Right Content Panel ─────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: isMobile ? "100%" : 660 }}>
          {activeSource === "gmail" && <EmailSource provider="gmail" label="Gmail" color="#EA4335" userId={user?.id} />}
          {activeSource === "outlook" && <EmailSource provider="outlook" label="Outlook" color="#0078D4" userId={user?.id} />}
          {activeSource === "manual" && <ManualImport />}
          {comingSoonSources.map(s =>
            activeSource === s.id ? <ComingSoonSource key={s.id} label={s.label} color={s.color} icon={s.icon} description={s.description} /> : null
          )}
        </div>
      </div>
    </PageLayout>
  );
}
