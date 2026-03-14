import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, AI_PROVIDERS } from "../lib/tokens";
import { store, getWorkspaces, getActiveWorkspaceId } from "../lib/storage";
import { callAI, getModelLabel, setActiveAIConfig } from "../lib/ai";
import { useAppStore } from "../store/appStore";
import { Btn } from "../components/ui/index";

function SettingsSection({ title, children }) {
  return (<div style={{ marginBottom: 32 }}><div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textTertiary, letterSpacing: "-0.01em", marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.borderDefault}` }}>{title}</div>{children}</div>);
}
function SettingsRow({ label, value }) {
  return (<div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}><span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textSecondary }}>{label}</span><span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{value}</span></div>);
}

export default function Settings() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [testStatus, setTestStatus] = useState("");
  const [clearConfirm, setClearConfirm] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [aiConfigs, setAiConfigs] = useState([]);
  const [activeConfigId, setActiveConfigIdLocal] = useState(() => localStorage.getItem(`bc2-${store._ws}-ai-active-config`) || "");
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState("anthropic");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyLoading, setNewKeyLoading] = useState(false);
  const [newKeyError, setNewKeyError] = useState("");
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ name: "", provider: "anthropic", keyId: "", model: "" });

  useEffect(() => { store.list("ai-key").then(setApiKeys); store.list("ai-config").then(setAiConfigs); }, []);

  async function testConnection() {
    setTestStatus("Testing...");
    try { const r = await callAI([{ role: "user", content: "Reply with exactly: BC online." }]); setTestStatus(r.trim() ? "Connected — " + r.trim() : "Connected"); }
    catch (err) { setTestStatus("Error: " + err.message); }
  }
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
    <div style={{ padding: "32px 40px", maxWidth: 640 }}>
      <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", marginBottom: 32 }}>Settings</div>

      <SettingsSection title="AI Configuration">
        {(() => { const active = aiConfigs.find(c => c.id === activeConfigId); return active ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 12px", background: C.goldMuted, border: `1px solid ${C.gold}30`, borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: C.gold }}>●</span>
            <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{active.name}</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{AI_PROVIDERS[active.provider]?.label} · {getModelLabel(active.provider, active.model)}</span>
          </div>
        ) : (<div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 16 }}>No AI config set — add an API key below.</div>); })()}

        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>API Keys</div>
        {apiKeys.length === 0 && !showAddKey && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 8 }}>No API keys added yet. Keys are stored locally — never sent to any server.</div>}
        {apiKeys.map(k => (
          <div key={k.keyId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 6, marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: k.provider === "anthropic" ? C.goldMuted : C.aiBlueMuted, color: k.provider === "anthropic" ? C.gold : C.aiBlue }}>{AI_PROVIDERS[k.provider]?.label || k.provider}</span>
              <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textPrimary }}>{k.label}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>...{k.lastFour}</span>
            </div>
            <button onClick={async () => { await store.delete("ai-key", k.id); setApiKeys(prev => prev.filter(x => x.id !== k.id)); for (const cfg of aiConfigs.filter(c => c.keyId === k.keyId)) { await store.delete("ai-config", cfg.id); } setAiConfigs(prev => prev.filter(c => c.keyId !== k.keyId)); }} style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO }}>Remove</button>
          </div>
        ))}
        {showAddKey ? (
          <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {Object.entries(AI_PROVIDERS).map(([pid, p]) => (<button key={pid} onClick={() => setNewKeyProvider(pid)} style={{ padding: "4px 12px", borderRadius: 5, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, border: `1px solid ${newKeyProvider === pid ? C.borderSubtle : C.borderDefault}`, background: newKeyProvider === pid ? "rgba(255,255,255,0.08)" : "transparent", color: newKeyProvider === pid ? C.textPrimary : C.textSecondary }}>{p.label}</button>))}
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
                  if (prov === "anthropic") {
                    const testRes = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": keyVal, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 10, messages: [{ role: "user", content: "hi" }] }) });
                    if (!testRes.ok) { const e = await testRes.json(); throw new Error(e.error?.message || "Key validation failed"); }
                  } else if (prov === "openai") {
                    const testRes = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${keyVal}` } });
                    if (!testRes.ok) throw new Error("OpenAI key validation failed");
                  }
                  const keyId = `aikey_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                  const keyObj = { id: keyId, keyId, provider: prov, label: newKeyLabel.trim() || `${AI_PROVIDERS[prov]?.label} Key`, lastFour: keyVal.slice(-4), apiKey: keyVal, createdAt: new Date().toISOString() };
                  await store.save("ai-key", keyObj); setApiKeys(prev => [...prev, keyObj]);
                  setShowAddKey(false); setNewKeyValue(""); setNewKeyLabel("");
                } catch (e) { setNewKeyError(e.message); }
                setNewKeyLoading(false);
              }}>{newKeyLoading ? "Validating..." : "Save Key"}</Btn>
            </div>
          </div>
        ) : (<Btn variant="outline" size="sm" onClick={() => setShowAddKey(true)} style={{ marginBottom: 16 }}>+ Add API Key</Btn>)}

        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Model Configurations</div>
        {aiConfigs.length === 0 && !showAddConfig && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 8 }}>Add an API key above, then create a named configuration.</div>}
        {aiConfigs.map(cfg => { const isActive = cfg.id === activeConfigId; return (
          <div key={cfg.id} onClick={() => { setActiveAIConfig(cfg.id); setActiveConfigIdLocal(cfg.id); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: isActive ? C.goldMuted : C.bgCard, border: `1px solid ${isActive ? C.gold + "40" : C.borderDefault}`, borderRadius: 6, marginBottom: 6, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${isActive ? C.gold : C.borderDefault}`, background: isActive ? C.gold : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{isActive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.bgPrimary }} />}</span>
              <div><div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{cfg.name}</div><div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{AI_PROVIDERS[cfg.provider]?.label} · {getModelLabel(cfg.provider, cfg.model)}</div></div>
            </div>
            <button onClick={async (e) => { e.stopPropagation(); await store.delete("ai-config", cfg.id); setAiConfigs(prev => prev.filter(c => c.id !== cfg.id)); if (activeConfigId === cfg.id) { setActiveAIConfig(""); setActiveConfigIdLocal(""); } }} style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO, flexShrink: 0 }}>Remove</button>
          </div>
        ); })}
        {showAddConfig ? (
          <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, marginBottom: 12 }}>
            <input value={configForm.name} onChange={e => setConfigForm(f => ({ ...f, name: e.target.value }))} placeholder="Config name (e.g. Work Opus)" style={{ width: "100%", marginBottom: 10, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}><div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 4, textTransform: "uppercase" }}>Provider</div>
                <select value={configForm.provider} onChange={e => setConfigForm(f => ({ ...f, provider: e.target.value, keyId: "", model: "" }))} style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}>
                  {Object.entries(AI_PROVIDERS).map(([pid, p]) => <option key={pid} value={pid}>{p.label}</option>)}
                </select></div>
              <div style={{ flex: 1 }}><div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 4, textTransform: "uppercase" }}>API Key</div>
                <select value={configForm.keyId} onChange={e => setConfigForm(f => ({ ...f, keyId: e.target.value }))} style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }}>
                  <option value="">Select a key...</option>
                  {apiKeys.filter(k => k.provider === configForm.provider).map(k => <option key={k.keyId} value={k.keyId}>{k.label} (...{k.lastFour})</option>)}
                </select></div>
            </div>
            <div style={{ marginBottom: 10 }}><div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 4, textTransform: "uppercase" }}>Model</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(AI_PROVIDERS[configForm.provider]?.models || []).map(m => (<button key={m.id} onClick={() => setConfigForm(f => ({ ...f, model: m.id }))} style={{ padding: "5px 12px", borderRadius: 5, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, border: `1px solid ${configForm.model === m.id ? C.borderSubtle : C.borderDefault}`, background: configForm.model === m.id ? "rgba(255,255,255,0.08)" : "transparent", color: configForm.model === m.id ? C.textPrimary : C.textSecondary }}>{m.label} <span style={{ fontSize: 11, color: C.textTertiary, marginLeft: 4 }}>({m.tier})</span></button>))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" size="sm" onClick={() => { setShowAddConfig(false); setConfigForm({ name: "", provider: "anthropic", keyId: "", model: "" }); }}>Cancel</Btn>
              <Btn variant="primary" size="sm" disabled={!configForm.name.trim() || !configForm.model || !configForm.keyId} onClick={async () => {
                const keyMeta = apiKeys.find(k => k.keyId === configForm.keyId);
                const cfg = { id: `aiconf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: configForm.name.trim(), provider: configForm.provider, keyId: configForm.keyId, keyLastFour: keyMeta?.lastFour || "???", model: configForm.model, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                await store.save("ai-config", cfg); setAiConfigs(prev => [...prev, cfg]);
                if (!activeConfigId) { setActiveAIConfig(cfg.id); setActiveConfigIdLocal(cfg.id); }
                setShowAddConfig(false); setConfigForm({ name: "", provider: "anthropic", keyId: "", model: "" });
              }}>Create Config</Btn>
            </div>
          </div>
        ) : (<Btn variant="outline" size="sm" onClick={() => setShowAddConfig(true)}>+ Add Configuration</Btn>)}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.borderDefault}` }}>
          <Btn variant="outline" size="sm" onClick={testConnection}>Test Active Config</Btn>
          {testStatus && <span style={{ marginLeft: 12, fontFamily: FONT_MONO, fontSize: 12, color: testStatus.startsWith("Error") ? C.red : C.green }}>{testStatus}</span>}
        </div>
      </SettingsSection>

      <SettingsSection title="Connectors">
        <div style={{ padding: "12px 14px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><AlertTriangle size={14} style={{ color: C.amber, flexShrink: 0 }} /><span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>Requires approved backend</span></div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>Email connectors (Gmail, Outlook) require a server-side backend for OAuth. All AI processing happens directly between your browser and the AI provider.</div>
        </div>
      </SettingsSection>

      <SettingsSection title="Display Preferences">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary }}>Sidebar collapsed by default</span>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: sidebarCollapsed ? C.gold : C.borderDefault, position: "relative", transition: "background 0.2s" }}>
            <span style={{ position: "absolute", top: 3, left: sidebarCollapsed ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </button>
        </div>
      </SettingsSection>

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
        <SettingsRow label="Storage" value="localStorage" />
        <SettingsRow label="Workspace" value={(() => { const ws = getWorkspaces().find(w => w.id === getActiveWorkspaceId()); return ws ? ws.name : "Default"; })()} />
        <SettingsRow label="App" value="BaseCommand v3.0 — Renewal Operations Platform" />
      </SettingsSection>
    </div>
  );
}
