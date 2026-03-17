import { useState, useEffect } from "react";
import { Building2, Plus, X, Loader } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { renewalStore } from "../../lib/storage";
import { callAI } from "../../lib/ai";
import { COMPANY_EXTRACT_PROMPT } from "../../lib/prompts";
import { safeParse } from "../../lib/utils";
import { Btn } from "../../components/ui/index";
import { SettingsSection } from "./SettingsShared";

export default function CompanySettings() {
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
      if (s.companyProfile) {
        setCompanyProfile(s.companyProfile);
        setRenewalWants(s.companyProfile.renewalStrategy?.wants || []);
        setRenewalGives(s.companyProfile.renewalStrategy?.gives || []);
        setRenewalRules(s.companyProfile.renewalStrategy?.rules || "");
      }
    });
  }, []);

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

  return (
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
  );
}
