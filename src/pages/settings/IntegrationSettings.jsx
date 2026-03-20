import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Trash2, Plus, Key, AlertTriangle } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";

export default function IntegrationSettings() {
  const { user } = useAuthStore();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState(null); // full key shown once after generation
  const [copied, setCopied] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  }, []);

  // Fetch existing keys
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch("/api/integration-keys?userId=" + user?.id, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setKeys(data.keys || []);
      } catch {
        // KV not available in local dev
      }
      setLoading(false);
    })();
  }, [user?.id, getToken]);

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/integration-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: label.trim() || "agent.ai Integration" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate key");
      setNewKey(data.key);
      setKeys(prev => [...prev, { keyId: data.keyId, label: data.label, lastFour: data.lastFour, createdAt: new Date().toISOString() }]);
      setLabel("");
    } catch (err) {
      setError(err.message);
    }
    setGenerating(false);
  }

  async function handleRevoke(keyId) {
    const token = await getToken();
    await fetch(`/api/integration-keys?userId=${user?.id}&keyId=${keyId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setKeys(prev => prev.filter(k => k.keyId !== keyId));
  }

  function handleCopy() {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>
          Integration API Keys
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>
          API keys allow external services like agent.ai workflow agents to save data directly to your BaseCommand portfolio.
        </div>
      </div>

      {/* New key reveal (shown once) */}
      {newKey && (
        <div style={{
          padding: 16, borderRadius: 10, background: C.goldMuted, border: `1px solid ${C.gold}30`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={14} color={C.amber} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.amber }}>
              Copy this key now — it won't be shown again
            </span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: C.bgPrimary, borderRadius: 8, padding: "10px 14px",
            border: `1px solid ${C.borderDefault}`,
          }}>
            <code style={{
              flex: 1, fontFamily: FONT_MONO, fontSize: 13, color: C.textPrimary,
              wordBreak: "break-all", userSelect: "all",
            }}>
              {newKey}
            </code>
            <button onClick={handleCopy} style={{
              background: "none", border: "none", cursor: "pointer", color: copied ? C.green : C.textTertiary,
              padding: 4, display: "flex", alignItems: "center", flexShrink: 0,
            }}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} style={{
            marginTop: 10, background: "none", border: "none", cursor: "pointer",
            fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary,
          }}>
            I've saved the key — dismiss
          </button>
        </div>
      )}

      {/* Generate new key */}
      <div style={{
        padding: 16, borderRadius: 10, background: C.bgCard, border: `1px solid ${C.borderDefault}`,
      }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 12 }}>
          Generate New Key
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: "block", fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary, marginBottom: 4 }}>
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. agent.ai Integration"
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8, boxSizing: "border-box",
                background: C.bgPrimary, border: `1px solid ${C.borderDefault}`,
                color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none",
              }}
            />
          </div>
          <button onClick={handleGenerate} disabled={generating} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
            background: C.gold, border: "none", color: C.textOnPrimary, fontFamily: FONT_SANS,
            fontSize: 13, fontWeight: 600, cursor: generating ? "wait" : "pointer",
            opacity: generating ? 0.7 : 1, whiteSpace: "nowrap",
          }}>
            <Plus size={14} />
            {generating ? "Generating..." : "Generate Key"}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 12, color: C.red }}>{error}</div>
        )}
      </div>

      {/* Existing keys */}
      <div style={{
        padding: 16, borderRadius: 10, background: C.bgCard, border: `1px solid ${C.borderDefault}`,
      }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 12 }}>
          Active Keys
        </div>
        {loading ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary }}>Loading...</div>
        ) : keys.length === 0 ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary }}>
            No integration keys yet. Generate one to connect agent.ai or other services.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {keys.map(k => (
              <div key={k.keyId} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                background: C.bgPrimary, borderRadius: 8, border: `1px solid ${C.borderDefault}`,
              }}>
                <Key size={14} color={C.textTertiary} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: C.textPrimary }}>
                    {k.label}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                    bc_live_...{k.lastFour} &middot; Created {new Date(k.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={() => handleRevoke(k.keyId)} style={{
                  background: "none", border: "none", cursor: "pointer", color: C.textTertiary,
                  padding: 6, borderRadius: 6, display: "flex", alignItems: "center",
                  transition: "color 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.color = C.red}
                  onMouseLeave={e => e.currentTarget.style.color = C.textTertiary}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage guide */}
      <div style={{
        padding: 16, borderRadius: 10, background: C.bgCard, border: `1px solid ${C.borderDefault}`,
      }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 10 }}>
          How to Use
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.7 }}>
          Send a POST request to save accounts to your portfolio:
        </div>
        <pre style={{
          margin: "10px 0 0", padding: 14, borderRadius: 8,
          background: C.bgPrimary, border: `1px solid ${C.borderDefault}`,
          fontFamily: FONT_MONO, fontSize: 12, color: C.textSecondary,
          lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre-wrap",
        }}>{`POST https://basecommand.ai/api/import/external
Authorization: Bearer bc_live_your_key_here
Content-Type: application/json

{
  "accounts": [
    {
      "name": "Acme Corp",
      "arr": 150000,
      "renewalDate": "2026-09-15",
      "riskLevel": "medium",
      "contacts": [{"name": "Jane", "role": "VP", "email": "jane@acme.com"}],
      "notes": "Large account, expanding usage"
    }
  ]
}`}</pre>
      </div>
    </div>
  );
}
