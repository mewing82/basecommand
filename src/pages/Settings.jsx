import { useState, useEffect } from "react";
import { AlertTriangle, Sparkles, Key, ChevronDown, ChevronUp } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, AI_PROVIDERS } from "../lib/tokens";
import { store, renewalStore, getWorkspaces, getActiveWorkspaceId } from "../lib/storage";
import { callAI, getModelLabel, setActiveAIConfig } from "../lib/ai";
import { getAIUsage } from "../lib/supabaseStorage";
import { PageLayout } from "../components/layout/PageLayout";
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
  const [showBYOK, setShowBYOK] = useState(false);
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
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [aiUsage, setAiUsage] = useState({ callCount: 0, limit: 50 });

  useEffect(() => { renewalStore.getSettings().then(s => setSelectedPersona(s.persona || null)); }, []);
  useEffect(() => { store.list("ai-key").then(setApiKeys); store.list("ai-config").then(setAiConfigs); }, []);
  useEffect(() => { getAIUsage().then(setAiUsage); }, []);

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
    <PageLayout maxWidth={640}>
      <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", marginBottom: 32 }}>Settings</div>

      <SettingsSection title="Your Role">
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginBottom: 14, lineHeight: 1.5 }}>This helps BaseCommand personalize task suggestions and AI recommendations for your workflow.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { id: "specialist", title: "Renewal Specialist", desc: "Running the renewal process day-to-day" },
            { id: "director", title: "Renewal Leader", desc: "Managing a renewal portfolio and team" },
            { id: "revenue_leader", title: "Revenue Leader", desc: "VP/CRO managing sales with renewal responsibility" },
            { id: "revops", title: "RevOps", desc: "Operationalizing revenue processes and data" },
            { id: "founder", title: "Founder", desc: "Running a SaaS company, managing renewals directly" },
          ].map(p => {
            const isSelected = selectedPersona === p.id;
            return (
              <button key={p.id} onClick={async () => { setSelectedPersona(p.id); const current = await renewalStore.getSettings(); await renewalStore.saveSettings({ ...current, persona: p.id }); }} style={{ padding: "14px 18px", borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%", border: `1px solid ${isSelected ? C.gold + "60" : C.borderDefault}`, background: isSelected ? C.goldMuted : "transparent" }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: isSelected ? C.textPrimary : C.textSecondary }}>{p.title}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginTop: 2 }}>{p.desc}</div>
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="AI Configuration">
        {/* AI Included Banner */}
        <div style={{ padding: "16px 18px", background: C.goldMuted, border: `1px solid ${C.gold}30`, borderRadius: 10, marginBottom: 16 }}>
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
        <div style={{ padding: "14px 18px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textSecondary }}>AI Usage This Month</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: aiUsage.callCount >= aiUsage.limit ? C.red : C.textPrimary }}>
              {aiUsage.callCount} / {aiUsage.limit}
            </span>
          </div>
          <div style={{ width: "100%", height: 6, background: C.borderDefault, borderRadius: 3, overflow: "hidden" }}>
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
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.red, marginTop: 8 }}>
              You've reached your free tier limit. Upgrade to Pro for unlimited AI with Claude Opus.
            </div>
          ) : aiUsage.callCount >= aiUsage.limit * 0.8 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.amber, marginTop: 8 }}>
              {aiUsage.limit - aiUsage.callCount} calls remaining this month.
            </div>
          ) : null}
        </div>

        {/* Test Connection */}
        <div style={{ marginBottom: 16 }}>
          <Btn variant="outline" size="sm" onClick={testConnection}>Test AI Connection</Btn>
          {testStatus && <span style={{ marginLeft: 12, fontFamily: FONT_MONO, fontSize: 12, color: testStatus.startsWith("Error") ? C.red : C.green }}>{testStatus}</span>}
        </div>

        {/* BYOK Advanced Section */}
        <button onClick={() => setShowBYOK(!showBYOK)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showBYOK ? 12 : 0 }}>
          <Key size={12} style={{ color: C.textTertiary }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>Use Your Own API Key (Advanced)</span>
          {showBYOK ? <ChevronUp size={12} style={{ color: C.textTertiary }} /> : <ChevronDown size={12} style={{ color: C.textTertiary }} />}
        </button>

        {showBYOK && (
          <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, marginTop: 8 }}>
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
                <button onClick={async () => { await store.delete("ai-key", k.id); setApiKeys(prev => prev.filter(x => x.id !== k.id)); for (const cfg of aiConfigs.filter(c => c.keyId === k.keyId)) { await store.delete("ai-config", cfg.id); } setAiConfigs(prev => prev.filter(c => c.keyId !== k.keyId)); }} style={{ background: "none", border: "none", color: C.textTertiary, cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO }}>Remove</button>
              </div>
            ))}

            {showAddKey ? (
              <div style={{ padding: 12, background: C.bgPrimary, border: `1px solid ${C.borderDefault}`, borderRadius: 6, marginBottom: 8 }}>
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
        <SettingsRow label="Storage" value="Supabase Postgres + localStorage fallback" />
        <SettingsRow label="Workspace" value={(() => { const ws = getWorkspaces().find(w => w.id === getActiveWorkspaceId()); return ws ? ws.name : "Default"; })()} />
        <SettingsRow label="App" value="BaseCommand v3.0 — Renewal Operations Platform" />
      </SettingsSection>
    </PageLayout>
  );
}
