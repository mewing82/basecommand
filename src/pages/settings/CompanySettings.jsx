import { useState, useEffect } from "react";
import { Building2, Plus, X, Loader, Globe, Sparkles, Package, Shield, Swords, TrendingUp, HandshakeIcon, FileText, Check } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { renewalStore } from "../../lib/storage";
import { callAI } from "../../lib/ai";
import { COMPANY_EXTRACT_PROMPT } from "../../lib/prompts";
import { safeParse } from "../../lib/utils";
import { Btn } from "../../components/ui/index";

// ─── Shared styles ──────────────────────────────────────────────────────────
const cardStyle = { padding: "18px 20px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, marginBottom: 12 };
const cardHeaderStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 };
const cardLabelStyle = { fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 };
const inputStyle = { width: "100%", background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: "9px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" };
const textareaStyle = { ...inputStyle, fontFamily: FONT_BODY, lineHeight: 1.6, resize: "vertical" };
const smallInputStyle = { ...inputStyle, fontSize: 12, padding: "7px 10px" };
const tagStyle = { fontFamily: FONT_MONO, fontSize: 11, padding: "4px 10px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 6 };
const removeBtn = { background: "none", border: "none", cursor: "pointer", color: C.textTertiary, padding: 2, display: "flex", alignItems: "center" };

// ─── Preset negotiation items ───────────────────────────────────────────────
const WANT_PRESETS = ["Multi-year commitment", "New product adoption", "Upfront / annual payment", "Case study or reference", "Executive sponsor access", "Better payment terms", "Volume commitment"];
const GIVE_PRESETS = ["Lower annual price lifts", "Waived implementation fees", "Extended support hours", "Early access to features", "Dedicated CSM", "Volume discount", "Flexible payment terms"];

export default function CompanySettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [extractRaw, setExtractRaw] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // which card is expanded for editing
  const [renewalWants, setRenewalWants] = useState([]);
  const [renewalGives, setRenewalGives] = useState([]);
  const [renewalRules, setRenewalRules] = useState("");
  const [newWant, setNewWant] = useState("");
  const [newGive, setNewGive] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    renewalStore.getSettings().then(s => {
      if (s.companyProfile) {
        setProfile(s.companyProfile);
        setRenewalWants(s.companyProfile.renewalStrategy?.wants || []);
        setRenewalGives(s.companyProfile.renewalStrategy?.gives || []);
        setRenewalRules(s.companyProfile.renewalStrategy?.rules || "");
      }
      setLoading(false);
    });
  }, []);

  async function extractFromInput() {
    if (!extractRaw.trim()) return;
    setExtracting(true);
    try {
      const result = await callAI([{ role: "user", content: COMPANY_EXTRACT_PROMPT(extractRaw) }], "You are a data extraction system. Return only valid JSON.", 4000);
      const parsed = safeParse(result.toString(), null);
      if (parsed) {
        const merged = { ...(profile || {}), ...parsed, lastUpdated: new Date().toISOString() };
        setProfile(merged);
        await save(merged);
        setExtractRaw("");
      }
    } catch (e) { console.error("[company] extraction error:", e.message); }
    setExtracting(false);
  }

  async function save(p) {
    const updated = { ...(p || profile), renewalStrategy: { wants: renewalWants, gives: renewalGives, rules: renewalRules }, lastUpdated: new Date().toISOString() };
    setProfile(updated);
    const current = await renewalStore.getSettings();
    await renewalStore.saveSettings({ ...current, companyProfile: updated });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateProfile(updates) {
    setProfile(p => ({ ...(p || {}), ...updates }));
  }

  if (loading) return <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, padding: 20 }}>Loading...</div>;

  // ─── Completion score ───────────────────────────────────────────────────
  const fields = [profile?.companyName, profile?.productDescription, profile?.products?.length > 0, profile?.contractTerms, profile?.upliftRate, profile?.senderName, profile?.competitors?.length > 0, profile?.valueProps, renewalWants.length > 0];
  const filled = fields.filter(Boolean).length;
  const completionPct = Math.round((filled / fields.length) * 100);

  return (
    <div>
      {/* Header with completion */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>Company Profile</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>Powers all AI recommendations, email drafts, and forecasts</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 80, height: 6, background: C.borderDefault, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${completionPct}%`, height: "100%", borderRadius: 3, background: completionPct === 100 ? C.green : `linear-gradient(90deg, ${C.gold}, ${C.goldHover})`, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: completionPct === 100 ? C.green : C.textTertiary }}>{completionPct}%</span>
        </div>
      </div>

      {/* AI Quick Setup */}
      <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.borderAI}` }}>
        <div style={cardHeaderStyle}>
          <Sparkles size={16} style={{ color: C.aiBlue }} />
          <span style={{ ...cardLabelStyle, color: C.aiBlue }}>AI Quick Setup</span>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, marginBottom: 10, lineHeight: 1.5 }}>
          Paste anything about your company — website copy, pitch deck, pricing page, sales materials. AI will extract and structure your profile.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={profile?.websiteUrl || ""} onChange={e => updateProfile({ websiteUrl: e.target.value })} placeholder="https://yourcompany.com" style={{ ...inputStyle, flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 12px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, flexShrink: 0 }}>
            <Globe size={14} style={{ color: C.textTertiary }} />
          </div>
        </div>
        <textarea value={extractRaw} onChange={e => setExtractRaw(e.target.value)} placeholder="Paste website copy, pitch deck text, pricing page, competitive intel, or just describe your business..." rows={3} style={{ ...textareaStyle, marginTop: 8 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
          <Btn variant="primary" size="sm" disabled={!extractRaw.trim() || extracting} onClick={extractFromInput}>
            {extracting ? <><Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> Extracting...</> : <><Sparkles size={12} /> Extract with AI</>}
          </Btn>
        </div>
      </div>

      {/* Company Identity */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Building2 size={16} style={{ color: C.gold }} />
          <span style={cardLabelStyle}>Company Identity</span>
        </div>
        <input value={profile?.companyName || ""} onChange={e => updateProfile({ companyName: e.target.value })} placeholder="Company name" style={{ ...inputStyle, marginBottom: 8, fontWeight: 600 }} />
        <textarea value={profile?.productDescription || ""} onChange={e => updateProfile({ productDescription: e.target.value })} placeholder="What does your company sell? (1-2 sentences)" rows={2} style={{ ...textareaStyle, marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <input value={profile?.senderName || ""} onChange={e => updateProfile({ senderName: e.target.value })} placeholder="Your name (for email signatures)" style={{ ...inputStyle, flex: 1 }} />
          <input value={profile?.senderTitle || ""} onChange={e => updateProfile({ senderTitle: e.target.value })} placeholder="Your title" style={{ ...inputStyle, flex: 1 }} />
        </div>
      </div>

      {/* Products & Pricing */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Package size={16} style={{ color: "#3B82F6" }} />
          <span style={cardLabelStyle}>Products & Pricing</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginLeft: "auto" }}>{(profile?.products || []).length} products</span>
        </div>
        {(profile?.products || []).map((prod, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
            <input value={prod.name} onChange={e => { const prods = [...(profile.products || [])]; prods[i] = { ...prods[i], name: e.target.value }; updateProfile({ products: prods }); }} placeholder="Product name" style={{ ...smallInputStyle, flex: 2 }} />
            <input value={prod.description || ""} onChange={e => { const prods = [...(profile.products || [])]; prods[i] = { ...prods[i], description: e.target.value }; updateProfile({ products: prods }); }} placeholder="Description" style={{ ...smallInputStyle, flex: 2 }} />
            <input value={prod.price || ""} onChange={e => { const prods = [...(profile.products || [])]; prods[i] = { ...prods[i], price: e.target.value }; updateProfile({ products: prods }); }} placeholder="Price" style={{ ...smallInputStyle, flex: 1, fontFamily: FONT_MONO }} />
            <button onClick={() => updateProfile({ products: (profile.products || []).filter((_, j) => j !== i) })} style={removeBtn}><X size={14} /></button>
          </div>
        ))}
        <button onClick={() => updateProfile({ products: [...(profile?.products || []), { name: "", price: "", description: "" }] })} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: C.gold, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, padding: "6px 0" }}><Plus size={12} /> Add Product</button>
        <input value={profile?.upsellPaths || ""} onChange={e => updateProfile({ upsellPaths: e.target.value })} placeholder="Upsell paths (e.g., Team → Enterprise at 50+ users, All → Analytics Add-on)" style={{ ...inputStyle, marginTop: 8, fontSize: 12 }} />
      </div>

      {/* Contract & Pricing Terms */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <FileText size={16} style={{ color: "#34D399" }} />
          <span style={cardLabelStyle}>Contract & Pricing Terms</span>
        </div>
        <input value={profile?.contractTerms || ""} onChange={e => updateProfile({ contractTerms: e.target.value })} placeholder="Standard contract terms (e.g., Annual contracts, net-30 billing)" style={{ ...inputStyle, marginBottom: 8 }} />
        <input value={profile?.upliftRate || ""} onChange={e => updateProfile({ upliftRate: e.target.value })} placeholder="Standard uplift / price increase (e.g., 7% annual for 1-year, 3% for 3-year)" style={{ ...inputStyle, marginBottom: 8 }} />
        <input value={profile?.discountRules || ""} onChange={e => updateProfile({ discountRules: e.target.value })} placeholder="Discounting rules (e.g., Max 15% without VP approval. No discounts on add-ons.)" style={inputStyle} />
      </div>

      {/* Renewal Strategy — Negotiation Exchange */}
      <div style={{ ...cardStyle, border: `1px solid ${C.gold}25` }}>
        <div style={cardHeaderStyle}>
          <HandshakeIcon size={16} style={{ color: C.gold }} />
          <span style={{ ...cardLabelStyle, color: C.gold }}>Renewal Negotiation Playbook</span>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 14, lineHeight: 1.5 }}>
          Configure what you want from customers at renewal and what you're willing to offer in exchange. AI will use this to craft strategically accurate proposals.
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          {/* What We Want */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <TrendingUp size={14} style={{ color: C.green }} /> What We Want
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              {renewalWants.map((w, i) => (
                <div key={i} style={{ ...tagStyle, background: C.greenMuted, color: C.green, justifyContent: "space-between" }}>
                  <span>{w}</span>
                  <button onClick={() => setRenewalWants(prev => prev.filter((_, j) => j !== i))} style={{ ...removeBtn, color: C.green + "80" }}><X size={12} /></button>
                </div>
              ))}
            </div>
            {/* Preset chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {WANT_PRESETS.filter(p => !renewalWants.includes(p)).map(p => (
                <button key={p} onClick={() => setRenewalWants(prev => [...prev, p])} style={{ ...tagStyle, background: "transparent", border: `1px dashed ${C.borderDefault}`, color: C.textTertiary, cursor: "pointer", fontSize: 10 }}><Plus size={10} /> {p}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <input value={newWant} onChange={e => setNewWant(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newWant.trim()) { setRenewalWants(prev => [...prev, newWant.trim()]); setNewWant(""); } }} placeholder="Custom..." style={{ ...smallInputStyle, flex: 1 }} />
              <button onClick={() => { if (newWant.trim()) { setRenewalWants(prev => [...prev, newWant.trim()]); setNewWant(""); } }} style={{ ...removeBtn, color: C.gold }}><Plus size={16} /></button>
            </div>
          </div>

          <div style={{ width: 1, background: C.borderDefault, flexShrink: 0 }} />

          {/* What We Give */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Shield size={14} style={{ color: C.aiBlue }} /> What We Offer
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              {renewalGives.map((g, i) => (
                <div key={i} style={{ ...tagStyle, background: C.aiBlueMuted, color: C.aiBlue, justifyContent: "space-between" }}>
                  <span>{g}</span>
                  <button onClick={() => setRenewalGives(prev => prev.filter((_, j) => j !== i))} style={{ ...removeBtn, color: C.aiBlue + "80" }}><X size={12} /></button>
                </div>
              ))}
            </div>
            {/* Preset chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {GIVE_PRESETS.filter(p => !renewalGives.includes(p)).map(p => (
                <button key={p} onClick={() => setRenewalGives(prev => [...prev, p])} style={{ ...tagStyle, background: "transparent", border: `1px dashed ${C.borderDefault}`, color: C.textTertiary, cursor: "pointer", fontSize: 10 }}><Plus size={10} /> {p}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <input value={newGive} onChange={e => setNewGive(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newGive.trim()) { setRenewalGives(prev => [...prev, newGive.trim()]); setNewGive(""); } }} placeholder="Custom..." style={{ ...smallInputStyle, flex: 1 }} />
              <button onClick={() => { if (newGive.trim()) { setRenewalGives(prev => [...prev, newGive.trim()]); setNewGive(""); } }} style={{ ...removeBtn, color: C.gold }}><Plus size={16} /></button>
            </div>
          </div>
        </div>

        {/* Strategy Rules */}
        <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>Strategy Rules</div>
        <textarea value={renewalRules} onChange={e => setRenewalRules(e.target.value)} placeholder="Your renewal strategy playbook. Example:&#10;&#10;• Lead with 3-year options showing cost savings over single year&#10;• 1-year = 7% lift (flat if at list price)&#10;• 3-year = 3% annual lift locked in — never discount for multi-year&#10;• Always present pricing comparison table in proposals&#10;• Escalate to VP for accounts over $500K ARR" rows={5} style={{ ...textareaStyle, fontSize: 12 }} />
      </div>

      {/* Competitive Landscape */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Swords size={16} style={{ color: "#F59E0B" }} />
          <span style={cardLabelStyle}>Competitive Landscape</span>
        </div>
        {(profile?.competitors || []).map((comp, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
            <input value={comp.name} onChange={e => { const comps = [...(profile.competitors || [])]; comps[i] = { ...comps[i], name: e.target.value }; updateProfile({ competitors: comps }); }} placeholder="Competitor name" style={{ ...smallInputStyle, flex: 1 }} />
            <input value={comp.differentiation || ""} onChange={e => { const comps = [...(profile.competitors || [])]; comps[i] = { ...comps[i], differentiation: e.target.value }; updateProfile({ competitors: comps }); }} placeholder="How you win against them" style={{ ...smallInputStyle, flex: 2 }} />
            <button onClick={() => updateProfile({ competitors: (profile.competitors || []).filter((_, j) => j !== i) })} style={removeBtn}><X size={14} /></button>
          </div>
        ))}
        <button onClick={() => updateProfile({ competitors: [...(profile?.competitors || []), { name: "", differentiation: "" }] })} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: C.gold, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, padding: "6px 0" }}><Plus size={12} /> Add Competitor</button>
      </div>

      {/* Value Propositions */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <TrendingUp size={16} style={{ color: "#A78BFA" }} />
          <span style={cardLabelStyle}>Value Propositions</span>
        </div>
        <textarea value={profile?.valueProps || ""} onChange={e => updateProfile({ valueProps: e.target.value })} placeholder="Why do customers buy and stay? What makes you different?&#10;&#10;Example: Enterprise-grade security (SOC2, SSO), 99.99% uptime SLA, dedicated CSM for accounts over $50K, fastest time-to-value in the category." rows={3} style={textareaStyle} />
      </div>

      {/* Save Bar */}
      <div style={{ position: "sticky", bottom: 0, padding: "12px 0", background: C.bgPrimary, borderTop: `1px solid ${C.borderDefault}`, display: "flex", justifyContent: "flex-end", gap: 8, zIndex: 10 }}>
        {saved && <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_SANS, fontSize: 13, color: C.green }}><Check size={14} /> Saved</div>}
        <Btn variant="primary" onClick={() => save()}>Save Company Profile</Btn>
      </div>
    </div>
  );
}
