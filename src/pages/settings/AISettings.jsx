import { useState, useEffect } from "react";
import { Sparkles, Key, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, AI_PROVIDERS } from "../../lib/tokens";
import { store } from "../../lib/storage";
import { callAI } from "../../lib/ai";
import { getAIUsage } from "../../lib/supabaseStorage";
import { Btn } from "../../components/ui/index";

const cardStyle = { padding: "18px 20px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, marginBottom: 12 };
const cardHeaderStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 };
const cardLabelStyle = { fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 };

export default function AISettings() {
  const [testStatus, setTestStatus] = useState("");
  const [showBYOK, setShowBYOK] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [aiConfigs, setAiConfigs] = useState([]);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState("anthropic");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyLoading, setNewKeyLoading] = useState(false);
  const [newKeyError, setNewKeyError] = useState("");
  const [aiUsage, setAiUsage] = useState({ callCount: 0, limit: 50 });

  useEffect(() => { store.list("ai-key").then(setApiKeys); store.list("ai-config").then(setAiConfigs); }, []);
  useEffect(() => { getAIUsage().then(setAiUsage); }, []);

  async function testConnection() {
    setTestStatus("Testing...");
    try { const r = await callAI([{ role: "user", content: "Reply with exactly: BC online." }]); setTestStatus(r.trim() ? "Connected — " + r.trim() : "Connected"); }
    catch (err) { setTestStatus("Error: " + err.message); }
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>AI</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>Powered by Claude — zero configuration required</div>
      </div>

      {/* AI Included Banner */}
      <div style={{ ...cardStyle, background: C.goldMuted, border: `1px solid ${C.gold}30` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Sparkles size={16} style={{ color: C.gold }} />
          <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>AI is included</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, padding: "2px 8px", borderRadius: 4, background: C.gold + "20", color: C.gold }}>Free Tier</span>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
          BaseCommand provides AI powered by Claude. No API key needed — it just works.
        </div>
      </div>

      {/* Usage Meter */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Zap size={16} style={{ color: C.gold }} />
          <span style={cardLabelStyle}>Usage</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: aiUsage.callCount >= aiUsage.limit ? C.red : C.textPrimary, marginLeft: "auto" }}>
            {aiUsage.callCount} / {aiUsage.limit}
          </span>
        </div>
        <div style={{ width: "100%", height: 6, background: C.borderDefault, borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
          <div style={{
            width: `${Math.min((aiUsage.callCount / aiUsage.limit) * 100, 100)}%`,
            height: "100%",
            borderRadius: 3,
            background: aiUsage.callCount >= aiUsage.limit * 0.8
              ? (aiUsage.callCount >= aiUsage.limit ? C.red : C.amber)
              : `linear-gradient(90deg, ${C.gold}, ${C.goldHover})`,
            transition: "width 0.3s ease",
          }} />
        </div>
        {aiUsage.callCount >= aiUsage.limit ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.red, marginBottom: 10 }}>
            You've reached your free tier limit. Upgrade to Pro for unlimited AI with Claude Opus.
          </div>
        ) : aiUsage.callCount >= aiUsage.limit * 0.8 ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.amber, marginBottom: 10 }}>
            {aiUsage.limit - aiUsage.callCount} calls remaining this month.
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>Model: Claude Sonnet</span>
          </div>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.gold, cursor: "pointer" }}>Upgrade to Pro for Claude Opus</span>
        </div>
      </div>

      {/* Test Connection */}
      <div style={{ marginBottom: 12 }}>
        <Btn variant="outline" size="sm" onClick={testConnection}>Test AI Connection</Btn>
        {testStatus && <span style={{ marginLeft: 12, fontFamily: FONT_MONO, fontSize: 12, color: testStatus.startsWith("Error") ? C.red : C.green }}>{testStatus}</span>}
      </div>

      {/* BYOK Advanced Section */}
      <button onClick={() => setShowBYOK(!showBYOK)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showBYOK ? 12 : 0 }}>
        <Key size={12} style={{ color: C.textTertiary }} />
        <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>Use Your Own API Key (Advanced)</span>
        {showBYOK ? <ChevronUp size={12} style={{ color: C.textTertiary }} /> : <ChevronDown size={12} style={{ color: C.textTertiary }} />}
      </button>

      {showBYOK && (
        <div style={{ ...cardStyle, marginTop: 8 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 12, lineHeight: 1.5 }}>
            For enterprise or compliance requirements, you can use your own API key instead of BaseCommand's built-in AI. BYOK usage is not metered.
          </div>

          {apiKeys.map(k => (
            <div key={k.keyId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: C.bgPrimary, border: `1px solid ${C.borderDefault}`, borderRadius: 6, marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: k.provider === "anthropic" ? C.goldMuted : C.aiBlueMuted, color: k.provider === "anthropic" ? C.gold : C.aiBlue }}>{AI_PROVIDERS[k.provider]?.label || k.provider}</span>
                <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textPrimary }}>{k.label}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>...{k.lastFour}</span>
              </div>
              <button onClick={async () => { await store.delete("ai-key", k.id); setApiKeys(prev => prev.filter(x => x.id !== k.id)); for (const cfg of aiConfigs.filter(c => c.keyId === k.keyId)) { await store.delete("ai-config", cfg.id); } setAiConfigs(prev => prev.filter(c => c.keyId !== k.keyId)); }} style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_SANS }}>Remove</button>
            </div>
          ))}

          {showAddKey ? (
            <div style={{ padding: 12, background: C.bgPrimary, border: `1px solid ${C.borderDefault}`, borderRadius: 6, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {Object.entries(AI_PROVIDERS).map(([pid, p]) => (<button key={pid} onClick={() => setNewKeyProvider(pid)} style={{ padding: "4px 12px", borderRadius: 5, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600, border: `1px solid ${newKeyProvider === pid ? C.borderSubtle : C.borderDefault}`, background: newKeyProvider === pid ? "rgba(0,0,0,0.05)" : "transparent", color: newKeyProvider === pid ? C.textPrimary : C.textSecondary }}>{p.label}</button>))}
              </div>
              <input value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} placeholder="Label (e.g. Work key)" style={{ width: "100%", marginBottom: 8, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              <input type="password" value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} placeholder={AI_PROVIDERS[newKeyProvider]?.keyPlaceholder || "API key"} style={{ width: "100%", marginBottom: 10, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              {newKeyError && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.red, marginBottom: 8 }}>{newKeyError}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Btn variant="ghost" size="sm" onClick={() => { setShowAddKey(false); setNewKeyValue(""); setNewKeyLabel(""); setNewKeyError(""); }}>Cancel</Btn>
                <Btn variant="primary" size="sm" disabled={newKeyLoading || !newKeyValue.trim()} onClick={async () => {
                  setNewKeyLoading(true); setNewKeyError("");
                  try {
                    const keyVal = newKeyValue.trim(); const prov = newKeyProvider;
                    if (prov === "anthropic" && !keyVal.startsWith("sk-ant-")) throw new Error("Anthropic keys start with sk-ant-");
                    if (prov === "openai" && !keyVal.startsWith("sk-")) throw new Error("OpenAI keys start with sk-");
                    const keyId = `aikey_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                    const keyObj = { id: keyId, keyId, provider: prov, label: newKeyLabel.trim() || `${AI_PROVIDERS[prov]?.label} Key`, lastFour: keyVal.slice(-4), apiKey: keyVal, createdAt: new Date().toISOString() };
                    await store.save("ai-key", keyObj); setApiKeys(prev => [...prev, keyObj]);
                    setShowAddKey(false); setNewKeyValue(""); setNewKeyLabel("");
                  } catch (e) { setNewKeyError(e.message); }
                  setNewKeyLoading(false);
                }}>{newKeyLoading ? "Saving..." : "Save Key"}</Btn>
              </div>
            </div>
          ) : (<Btn variant="outline" size="sm" onClick={() => setShowAddKey(true)}>+ Add API Key</Btn>)}
        </div>
      )}
    </div>
  );
}
