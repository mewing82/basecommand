import { useState, useEffect } from "react";
import { Mail, Sparkles, AlertTriangle, Clock, Check, Loader, Unplug } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { Btn } from "../../components/ui/index";

const cardStyle = { padding: "18px 20px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, marginBottom: 12 };

const TYPE_COLORS = {
  task: { color: C.green, label: "Task" },
  decision: { color: C.gold, label: "Decision" },
  priority: { color: C.purple, label: "Priority" },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

export default function EmailSource({ provider, label, color, userId }) {
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [timeframe, setTimeframe] = useState("24h");
  const [scanResults, setScanResults] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scannedHashes, setScannedHashes] = useState(() => {
    try {
      const stored = localStorage.getItem(`bc-scan-hashes-${provider}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [lastScanTime, setLastScanTime] = useState(() => {
    return localStorage.getItem(`bc-last-scan-${provider}`) || null;
  });
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Fetch connection status on mount
  useEffect(() => {
    if (!userId) { setStatusLoading(false); return; }
    fetch(`/api/connectors/${provider}?action=status&userId=${userId}`)
      .then(r => r.json())
      .then(data => { setStatus(data); setStatusLoading(false); })
      .catch(() => { setStatus({ connected: false }); setStatusLoading(false); });
  }, [provider, userId]);

  async function handleConnect() {
    window.location.href = `/api/connectors/${provider}?action=auth&userId=${userId}`;
  }

  async function handleScan() {
    setScanning(true);
    setScanError(null);
    try {
      const res = await fetch("/api/connectors/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, provider, timeframe, existingHashes: scannedHashes }),
      });
      if (!res.ok) throw new Error(`Scan failed (${res.status})`);
      const data = await res.json();
      setScanResults(data);
      const now = new Date().toISOString();
      setLastScanTime(now);
      localStorage.setItem(`bc-last-scan-${provider}`, now);
      if (data.newHashes?.length) {
        const updated = [...scannedHashes, ...data.newHashes];
        setScannedHashes(updated);
        localStorage.setItem(`bc-scan-hashes-${provider}`, JSON.stringify(updated));
      }
    } catch (err) {
      setScanError(err.message);
    } finally {
      setScanning(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch(`/api/connectors/${provider}?action=disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setStatus({ connected: false });
      setScanResults(null);
      localStorage.removeItem(`bc-scan-hashes-${provider}`);
      localStorage.removeItem(`bc-last-scan-${provider}`);
    } catch { /* best effort */ }
    setDisconnecting(false);
    setShowDisconnectConfirm(false);
  }

  // Loading state
  if (statusLoading) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary }}>{label}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>Checking connection...</div>
        </div>
        <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <Loader size={20} style={{ color: C.textTertiary, animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    );
  }

  // Not connected state
  if (!status?.connected) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary }}>{label}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>Connect your inbox to extract renewal intelligence</div>
        </div>

        <div style={{
          background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
          border: `1px solid ${C.borderAI}`,
          borderRadius: 12,
          padding: "40px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 20,
        }}>
          {/* Provider icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: color + "14",
            border: `1px solid ${color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 8px 24px ${color}10`,
          }}>
            <Mail size={28} style={{ color }} />
          </div>

          <div>
            <h3 style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 600, color: C.textPrimary, margin: "0 0 8px" }}>
              Connect your {label}
            </h3>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.6, maxWidth: 380, margin: 0 }}>
              BaseCommand will scan your inbox for renewal-related emails and automatically extract tasks, decisions, and priorities — so nothing falls through the cracks.
            </p>
          </div>

          <Btn variant="primary" onClick={handleConnect} style={{ padding: "10px 28px", fontSize: 14 }}>
            <Mail size={16} /> Connect {label}
          </Btn>

          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
            {[
              "Read-only access",
              "No emails stored",
              "Disconnect anytime",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Check size={11} style={{ color: C.green }} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Connected state
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary }}>{label}</div>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "2px 8px", borderRadius: 4,
            background: C.greenMuted, border: `1px solid ${C.green}30`,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: C.green }}>Connected</span>
          </div>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>
          Scanning inbox for renewal intelligence
        </div>
      </div>

      {/* Connection info card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: color + "18",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Mail size={14} style={{ color }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
              {status.email}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
              Connected {formatDate(status.connectedAt)}
              {lastScanTime && <> · Last scanned {formatTimeAgo(lastScanTime)}</>}
            </div>
          </div>
        </div>
      </div>

      {/* Scan controls card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Sparkles size={14} style={{ color: C.aiBlue }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            Email Scan
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Timeframe selector */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { value: "24h", label: "24h" },
              { value: "3d", label: "3 days" },
              { value: "7d", label: "7 days" },
            ].map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                style={{
                  padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                  border: `1px solid ${timeframe === tf.value ? C.gold + "60" : C.borderDefault}`,
                  background: timeframe === tf.value ? C.goldMuted : "transparent",
                  color: timeframe === tf.value ? C.textPrimary : C.textTertiary,
                  fontFamily: FONT_SANS, fontSize: 12, fontWeight: timeframe === tf.value ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >{tf.label}</button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <Btn variant="ai" onClick={handleScan} disabled={scanning}>
            {scanning
              ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Scanning...</>
              : <><Sparkles size={14} /> Scan Now</>
            }
          </Btn>
        </div>

        {scanError && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, color: C.red, fontFamily: FONT_BODY, fontSize: 12 }}>
            <AlertTriangle size={12} /> {scanError}
          </div>
        )}
      </div>

      {/* Scan results */}
      {scanResults && (
        <div>
          {/* Summary banner */}
          <div style={{
            background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
            border: `1px solid ${C.borderAI}`,
            borderLeft: `3px solid ${C.aiBlue}`,
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Sparkles size={14} style={{ color: C.aiBlue }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
                Scan Complete
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.aiBlue, marginLeft: "auto" }}>
                {scanResults.emailCount || 0} emails · {scanResults.items?.length || 0} items extracted
              </span>
            </div>
            {scanResults.summary && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
                {scanResults.summary}
              </div>
            )}
          </div>

          {/* Extracted items */}
          {scanResults.items?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {scanResults.items.map((item, i) => {
                const typeInfo = TYPE_COLORS[item.type] || { color: C.textTertiary, label: item.type };
                return (
                  <div key={i} style={{
                    ...cardStyle,
                    marginBottom: 0,
                    borderLeft: `3px solid ${typeInfo.color}40`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      {/* Type badge */}
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600,
                        color: typeInfo.color, textTransform: "uppercase",
                        background: typeInfo.color + "14",
                        padding: "2px 6px", borderRadius: 3,
                        letterSpacing: "0.04em",
                      }}>{typeInfo.label}</span>
                      {/* Priority badge */}
                      {item.priority && item.priority !== "medium" && (
                        <span style={{
                          fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600,
                          color: item.priority === "critical" || item.priority === "high" ? C.red : C.textTertiary,
                          textTransform: "uppercase",
                          background: (item.priority === "critical" || item.priority === "high" ? C.red : C.textTertiary) + "14",
                          padding: "2px 6px", borderRadius: 3,
                        }}>{item.priority}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>
                      {item.title}
                    </div>
                    {item.context && (
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.5, marginBottom: 6 }}>
                        {item.context}
                      </div>
                    )}
                    {(item.source_email || item.source_subject) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={10} style={{ color: C.textTertiary, opacity: 0.5 }} />
                        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, opacity: 0.6 }}>
                          {item.source_email}{item.source_subject ? ` — ${item.source_subject}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {scanResults.items?.length === 0 && (
            <div style={{ ...cardStyle, textAlign: "center", padding: "24px 20px" }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary }}>
                No actionable items found in the scanned emails. Try a longer timeframe.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disconnect section */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.borderDefault}` }}>
        {showDisconnectConfirm ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.red }}>
              Disconnect {label}? Scan history will be cleared.
            </span>
            <Btn variant="danger" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? "Disconnecting..." : "Confirm"}
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => setShowDisconnectConfirm(false)}>Cancel</Btn>
          </div>
        ) : (
          <button
            onClick={() => setShowDisconnectConfirm(true)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary,
              opacity: 0.6, transition: "opacity 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
          >
            <Unplug size={12} /> Disconnect {label}
          </button>
        )}
      </div>
    </div>
  );
}
