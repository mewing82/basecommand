import { useState, useEffect } from "react";
import { AlertTriangle, Sparkles, Key, ChevronDown, ChevronUp, Building2, Plus, X, Loader } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, AI_PROVIDERS } from "../lib/tokens";
import { store, renewalStore, getWorkspaces, getActiveWorkspaceId } from "../lib/storage";
import { callAI, getModelLabel, setActiveAIConfig } from "../lib/ai";
import { COMPANY_EXTRACT_PROMPT } from "../lib/prompts";
import { getAIUsage } from "../lib/supabaseStorage";
import { safeParse } from "../lib/utils";
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
  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyRaw, setCompanyRaw] = useState("");
  const [companyExtracting, setCompanyExtracting] = useState(false);
  const [companyEditing, setCompanyEditing] = useState(false);
  const [renewalWants, setRenewalWants] = useState([]);
  const [renewalGives, setRenewalGives] = useState([]);
  const [renewalRules, setRenewalRules] = useState("");
  const [newWant, setNewWant] = useState("");
  const [newGive, setNewGive] = useState("");

  useEffect(() => {
    renewalStore.getSettings().then(s => {
      setSelectedPersona(s.persona || null);
      if (s.companyProfile) {
        setCompanyProfile(s.companyProfile);
        setRenewalWants(s.companyProfile.renewalStrategy?.wants || []);
        setRenewalGives(s.companyProfile.renewalStrategy?.gives || []);
        setRenewalRules(s.companyProfile.renewalStrategy?.rules || "");
      }
    });
  }, []);
  useEffect(() => { store.list("ai-key").then(setApiKeys); store.list("ai-config").then(setAiConfigs); }, []);
  useEffect(() => { getAIUsage().then(setAiUsage); }, []);

  async function extractCompanyProfile() {
    if (!companyRaw.trim()) return;
    setCompanyExtracting(true);
    try {
      const result = await callAI([{ role: "user", content: COMPANY_EXTRACT_PROMPT(companyRaw) }], "You are a data extraction system. Return only valid JSON.", 4000);
      const parsed = safeParse(result.toString(), null);
      if (parsed) {
        const profile = { ...parsed, renewalStrategy: { wants: renewalWants, gives: renewalGives, rules: renewalRules }, setupComplete: true, lastUpdated: new Date().toISOString() };
        setCompanyProfile(profile);
        const current = await renewalStore.getSettings();
        await renewalStore.saveSettings({ ...current, companyProfile: profile });
        setCompanyRaw("");
        setCompanyEditing(true);
      }
    } catch (e) { console.error("[company] extraction error:", e.message); }
    setCompanyExtracting(false);
  }

  async function saveCompanyProfile(profile) {
    const updated = { ...profile, renewalStrategy: { wants: renewalWants, gives: renewalGives, rules: renewalRules }, lastUpdated: new Date().toISOString() };
    setCompanyProfile(updated);
    const current = await renewalStore.getSettings();
    await renewalStore.saveSettings({ ...current, companyProfile: updated });
  }

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

      <SettingsSection title="My Company">
        {!companyProfile && !companyEditing ? (
          /* Setup Wizard — paste and extract */
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Building2 size={16} style={{ color: C.gold }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>Tell us about your company so AI can reference your products, pricing, and strategy in every recommendation.</span>
            </div>
            <textarea value={companyRaw} onChange={e => setCompanyRaw(e.target.value)} placeholder="Paste your website copy, pitch deck text, pricing page, sales materials — or just describe what you sell, your products, pricing tiers, and competitive advantages..." rows={6} style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: "12px 14px", color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
              <Btn variant="outline" size="sm" onClick={() => { setCompanyProfile({}); setCompanyEditing(true); }}>Set Up Manually</Btn>
              <Btn variant="primary" size="sm" disabled={!companyRaw.trim() || companyExtracting} onClick={extractCompanyProfile}>
                {companyExtracting ? <><Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> Extracting...</> : "Extract with AI"}
              </Btn>
            </div>
          </div>
        ) : companyEditing ? (
          /* Edit Mode — editable cards */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Company Basics */}
            <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Company Info</div>
              <input value={companyProfile.companyName || ""} onChange={e => setCompanyProfile(p => ({ ...p, companyName: e.target.value }))} placeholder="Company name" style={{ width: "100%", marginBottom: 8, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              <textarea value={companyProfile.productDescription || ""} onChange={e => setCompanyProfile(p => ({ ...p, productDescription: e.target.value }))} placeholder="What does your company sell? (1-2 sentences)" rows={2} style={{ width: "100%", marginBottom: 8, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <input value={companyProfile.senderName || ""} onChange={e => setCompanyProfile(p => ({ ...p, senderName: e.target.value }))} placeholder="Your name (for email signatures)" style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                <input value={companyProfile.senderTitle || ""} onChange={e => setCompanyProfile(p => ({ ...p, senderTitle: e.target.value }))} placeholder="Your title" style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Products */}
            <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Products & Pricing</div>
              {(companyProfile.products || []).map((prod, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                  <input value={prod.name} onChange={e => { const prods = [...(companyProfile.products || [])]; prods[i] = { ...prods[i], name: e.target.value }; setCompanyProfile(p => ({ ...p, products: prods })); }} placeholder="Product name" style={{ flex: 2, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "6px 8px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  <input value={prod.price || ""} onChange={e => { const prods = [...(companyProfile.products || [])]; prods[i] = { ...prods[i], price: e.target.value }; setCompanyProfile(p => ({ ...p, products: prods })); }} placeholder="Price" style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "6px 8px", color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  <button onClick={() => { const prods = (companyProfile.products || []).filter((_, j) => j !== i); setCompanyProfile(p => ({ ...p, products: prods })); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textTertiary, padding: 4 }}><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => setCompanyProfile(p => ({ ...p, products: [...(p.products || []), { name: "", price: "", description: "" }] }))} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: C.gold, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, padding: "4px 0" }}><Plus size={12} /> Add Product</button>
            </div>

            {/* Contract Terms */}
            <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contract & Pricing Terms</div>
              <input value={companyProfile.contractTerms || ""} onChange={e => setCompanyProfile(p => ({ ...p, contractTerms: e.target.value }))} placeholder="Standard contract terms (e.g., Annual contracts, net-30 billing)" style={{ width: "100%", marginBottom: 8, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              <input value={companyProfile.upliftRate || ""} onChange={e => setCompanyProfile(p => ({ ...p, upliftRate: e.target.value }))} placeholder="Standard uplift rate (e.g., 7% annual for 1-year, 3% for 3-year)" style={{ width: "100%", marginBottom: 8, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              <input value={companyProfile.discountRules || ""} onChange={e => setCompanyProfile(p => ({ ...p, discountRules: e.target.value }))} placeholder="Discounting rules (e.g., Max 15% without VP approval)" style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Competitive Landscape */}
            <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Competitive Landscape</div>
              {(companyProfile.competitors || []).map((comp, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                  <input value={comp.name} onChange={e => { const comps = [...(companyProfile.competitors || [])]; comps[i] = { ...comps[i], name: e.target.value }; setCompanyProfile(p => ({ ...p, competitors: comps })); }} placeholder="Competitor" style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "6px 8px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  <input value={comp.differentiation || ""} onChange={e => { const comps = [...(companyProfile.competitors || [])]; comps[i] = { ...comps[i], differentiation: e.target.value }; setCompanyProfile(p => ({ ...p, competitors: comps })); }} placeholder="How you differentiate" style={{ flex: 2, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "6px 8px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  <button onClick={() => { const comps = (companyProfile.competitors || []).filter((_, j) => j !== i); setCompanyProfile(p => ({ ...p, competitors: comps })); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textTertiary, padding: 4 }}><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => setCompanyProfile(p => ({ ...p, competitors: [...(p.competitors || []), { name: "", differentiation: "" }] }))} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: C.gold, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, padding: "4px 0" }}><Plus size={12} /> Add Competitor</button>
            </div>

            {/* Value Props & Upsell */}
            <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Value & Growth</div>
              <textarea value={companyProfile.valueProps || ""} onChange={e => setCompanyProfile(p => ({ ...p, valueProps: e.target.value }))} placeholder="Why do customers buy and stay? Key value propositions..." rows={2} style={{ width: "100%", marginBottom: 8, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              <input value={companyProfile.upsellPaths || ""} onChange={e => setCompanyProfile(p => ({ ...p, upsellPaths: e.target.value }))} placeholder="Upsell paths (e.g., Team → Enterprise at 50+ users)" style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Renewal Strategy — Negotiation Exchange */}
            <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Renewal Strategy</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>What We Want</div>
                  {renewalWants.map((w, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textPrimary, flex: 1 }}>{w}</span>
                      <button onClick={() => setRenewalWants(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: C.textTertiary, padding: 2 }}><X size={12} /></button>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 4 }}>
                    <input value={newWant} onChange={e => setNewWant(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newWant.trim()) { setRenewalWants(prev => [...prev, newWant.trim()]); setNewWant(""); } }} placeholder="Add..." style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 4, padding: "4px 6px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                    <button onClick={() => { if (newWant.trim()) { setRenewalWants(prev => [...prev, newWant.trim()]); setNewWant(""); } }} style={{ background: "none", border: "none", cursor: "pointer", color: C.gold, padding: 2 }}><Plus size={14} /></button>
                  </div>
                </div>
                <div style={{ width: 1, background: C.borderDefault }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>What We Give</div>
                  {renewalGives.map((g, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textPrimary, flex: 1 }}>{g}</span>
                      <button onClick={() => setRenewalGives(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: C.textTertiary, padding: 2 }}><X size={12} /></button>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 4 }}>
                    <input value={newGive} onChange={e => setNewGive(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newGive.trim()) { setRenewalGives(prev => [...prev, newGive.trim()]); setNewGive(""); } }} placeholder="Add..." style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 4, padding: "4px 6px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                    <button onClick={() => { if (newGive.trim()) { setRenewalGives(prev => [...prev, newGive.trim()]); setNewGive(""); } }} style={{ background: "none", border: "none", cursor: "pointer", color: C.gold, padding: 2 }}><Plus size={14} /></button>
                  </div>
                </div>
              </div>
              <textarea value={renewalRules} onChange={e => setRenewalRules(e.target.value)} placeholder="Renewal strategy rules (e.g., Lead with 3-year. 1-year = 7% lift. 3-year = 3%/yr locked. Never discount for multi-year — we offer lower lifts instead.)" rows={3} style={{ width: "100%", background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "7px 10px", color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }} />
            </div>

            {/* Save / Cancel */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" size="sm" onClick={() => setCompanyEditing(false)}>Cancel</Btn>
              <Btn variant="primary" size="sm" onClick={() => { saveCompanyProfile(companyProfile); setCompanyEditing(false); }}>Save Company Profile</Btn>
            </div>
          </div>
        ) : (
          /* View Mode — summary + edit button */
          <div>
            <div style={{ padding: 14, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 700, color: C.textPrimary }}>{companyProfile.companyName || "—"}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, marginTop: 4, lineHeight: 1.5 }}>{companyProfile.productDescription || "No description set"}</div>
                </div>
                <Btn variant="outline" size="sm" onClick={() => setCompanyEditing(true)}>Edit</Btn>
              </div>
              {companyProfile.products?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Products</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {companyProfile.products.map((p, i) => (
                      <span key={i} style={{ fontFamily: FONT_MONO, fontSize: 11, padding: "3px 8px", borderRadius: 4, background: C.goldMuted, color: C.gold }}>{p.name}{p.price ? ` · ${p.price}` : ""}</span>
                    ))}
                  </div>
                </div>
              )}
              {(renewalWants.length > 0 || renewalGives.length > 0) && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.borderDefault}` }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Renewal Strategy</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
                    {renewalWants.length > 0 && <div>Want: {renewalWants.join(", ")}</div>}
                    {renewalGives.length > 0 && <div>Give: {renewalGives.join(", ")}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SettingsSection>

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
