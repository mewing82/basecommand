import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Sparkles, AlertTriangle, Check, X, FileText, MessageSquare, Mail } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { renewalStore } from "../lib/storage";
import { callAI } from "../lib/ai";
import { PageLayout } from "../components/layout/PageLayout";
import { similarity } from "../lib/utils";
import { Btn, FormField } from "../components/ui/index";
import { RENEWAL_IMPORT_PROMPT } from "../lib/prompts";

export default function Import() {
  const navigate = useNavigate();
  const [existingAccounts, setExistingAccounts] = useState(() => renewalStore.getAccounts());

  const [phase, setPhase] = useState("input"); // input | review | done
  const [rawData, setRawData] = useState("");
  const [source, setSource] = useState("Salesforce");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extracted, setExtracted] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [createdCount, setCreatedCount] = useState(0);
  const fileInputRef = useRef(null);

  async function handleProcess() {
    if (!rawData.trim()) return; setLoading(true); setError(null);
    try {
      // Chunk large inputs
      const chunks = [];
      const maxChunk = 12000;
      if (rawData.length <= maxChunk) { chunks.push(rawData); }
      else { let start = 0; while (start < rawData.length) { chunks.push(rawData.slice(start, start + maxChunk)); start += maxChunk; } }

      let allAccounts = [];
      let allWarnings = [];
      let summary = "";
      for (const chunk of chunks) {
        const response = await callAI([{ role: "user", content: `Process this data and extract renewal accounts:\n\n${chunk}` }], RENEWAL_IMPORT_PROMPT(chunk, source), 4000);
        let text = String(response).trim(); if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        const parsed = JSON.parse(text);
        if (parsed.accounts) allAccounts = allAccounts.concat(parsed.accounts);
        if (parsed.warnings) allWarnings = allWarnings.concat(parsed.warnings);
        if (parsed.summary) summary = parsed.summary;
      }

      // Deduplicate extracted accounts
      const deduped = [];
      for (const acct of allAccounts) {
        const isDup = deduped.some(d => similarity(d.name.toLowerCase(), acct.name.toLowerCase()) > 0.8);
        if (!isDup) deduped.push(acct);
      }

      // Flag accounts that match existing ones
      for (const acct of deduped) {
        const existingMatch = existingAccounts.find(e => similarity(e.name.toLowerCase(), acct.name.toLowerCase()) > 0.7);
        if (existingMatch) acct._existingMatch = existingMatch.name;
      }

      setExtracted(deduped); setWarnings(allWarnings); setAiSummary(summary); setPhase("review");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setRawData(prev => prev ? prev + "\n\n---\n\n" + ev.target.result : ev.target.result); };
    reader.readAsText(file); e.target.value = "";
  }

  function removeExtracted(idx) { setExtracted(prev => prev.filter((_, i) => i !== idx)); }
  function updateExtracted(idx, field, value) { setExtracted(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a)); }

  function handleCreateAccounts() {
    let created = 0;
    for (const acct of extracted) {
      if (acct._existingMatch && acct._skip) continue;
      const account = {
        id: `acct-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: acct.name.trim(),
        arr: parseFloat(acct.arr) || 0,
        renewalDate: acct.renewalDate || "",
        riskLevel: acct.riskLevel || "medium",
        contacts: acct.contacts || [],
        summary: acct.notes || "",
        tags: [],
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      renewalStore.saveAccount(account);
      // Attach raw source data as context item
      renewalStore.addContextItem(account.id, {
        id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        accountId: account.id,
        type: "text",
        label: `Import: ${source}`,
        source: source.toLowerCase(),
        content: rawData.slice(0, 5000),
        metadata: { words: rawData.split(/\s+/).length, size: (new Blob([rawData]).size / 1024).toFixed(1) + " KB" },
        uploadedAt: new Date().toISOString()
      });
      created++;
    }
    setCreatedCount(created); setExistingAccounts(renewalStore.getAccounts()); setPhase("done");
  }

  const confidenceColors = { high: C.green, medium: C.amber, low: C.red };

  // Phase: Input
  if (phase === "input") return (
    <PageLayout maxWidth={1200}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: FONT_SANS, fontSize: "var(--bc-heading-size, 24px)", fontWeight: 700, color: C.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>Import</h1>
          <p className="bc-hide-mobile" style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, margin: "4px 0 0" }}>Import and sync your renewal portfolio data</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.borderAI}`, borderLeft: `3px solid ${C.aiBlue}`, borderRadius: 12, padding: "22px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.aiBlueMuted, display: "flex", alignItems: "center", justifyContent: "center" }}><Upload size={14} color={C.aiBlue} /></div>
            <div>
              <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Import Unstructured Data</span>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, margin: "2px 0 0" }}>Don't worry about clean data. Paste messy CRM exports, spreadsheets, call notes, emails — AI will extract your accounts.</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <FormField label="Source">
            <select value={source} onChange={e => setSource(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 13, outline: "none" }}>
              {["Salesforce", "HubSpot", "Gong", "Spreadsheet", "Email", "Notes", "Other"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <div style={{ flex: 1 }} />
          <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv,.md" style={{ display: "none" }} onChange={handleFileUpload} />
          <Btn variant="ghost" onClick={() => fileInputRef.current?.click()}><FileText size={14} /> Upload File</Btn>
        </div>

        <textarea value={rawData} onChange={e => setRawData(e.target.value)} placeholder={"Paste your data here...\n\nExamples:\n- Salesforce CSV export\n- Spreadsheet copy/paste\n- CRM report\n- Call notes with account details\n- Email threads about renewals\n- Any mix of the above"} rows={14}
          style={{ width: "100%", padding: "16px 18px", borderRadius: 10, background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 13, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = C.aiBlue} onBlur={e => e.target.style.borderColor = C.borderDefault} />

        {rawData.trim() ? <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{rawData.split(/\s+/).length} words · {(new Blob([rawData]).size / 1024).toFixed(1)} KB</div>
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[{ title: "CRM Exports", desc: "Salesforce reports, HubSpot exports, even messy CSV files with inconsistent columns", icon: FileText, color: C.green },
              { title: "Call Notes & Transcripts", desc: "Gong summaries, meeting notes, or any text with customer details mentioned", icon: MessageSquare, color: C.amber },
              { title: "Emails & Messages", desc: "Renewal threads, customer check-ins, Slack conversations about accounts", icon: Mail, color: C.aiBlue }
            ].map((item, i) => { const Icon = item.icon; return (
              <div key={i} style={{ padding: "14px 16px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Icon size={14} style={{ color: item.color }} /><span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{item.title}</span></div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5 }}>{item.desc}</div>
              </div>);
            })}
          </div>}
        {error && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontFamily: FONT_BODY, fontSize: 13 }}><AlertTriangle size={14} /> {error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn variant="primary" onClick={handleProcess} disabled={!rawData.trim() || loading}>
            {loading ? <><Sparkles size={14} style={{ animation: "aiPulse 2s ease-in-out infinite" }} /> Processing...</> : <><Sparkles size={14} /> Process with AI</>}
          </Btn>
        </div>
      </div>
    </PageLayout>
  );

  // Phase: Review
  if (phase === "review") return (
    <PageLayout maxWidth={1200}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: FONT_SANS, fontSize: "var(--bc-heading-size, 24px)", fontWeight: 700, color: C.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>Import</h1>
          <p className="bc-hide-mobile" style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, margin: "4px 0 0" }}>Import and sync your renewal portfolio data</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.borderAI}`, borderLeft: `3px solid ${C.aiBlue}`, borderRadius: 12, padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Sparkles size={14} style={{ color: C.aiBlue }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>AI Extraction Complete</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.aiBlue, marginLeft: "auto" }}>{extracted.length} accounts found</span>
          </div>
          {aiSummary && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{aiSummary}</div>}
          {warnings.length > 0 && <div style={{ marginTop: 8 }}>{warnings.map((w, i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontFamily: FONT_BODY, fontSize: 12, color: C.amber, lineHeight: 1.4, marginTop: 4 }}><AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />{w}</div>)}</div>}
        </div>

        {extracted.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>No accounts could be extracted from the data. Try pasting different data or a larger sample.</p>
            <Btn variant="ghost" onClick={() => setPhase("input")} style={{ marginTop: 12 }}>Go Back</Btn>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {extracted.map((acct, idx) => {
                const confColor = confidenceColors[acct.confidence] || C.textTertiary;
                const rc = { high: C.red, medium: C.amber, low: C.green };
                return (
                  <div key={idx} style={{ background: C.bgCard, border: `1px solid ${acct._existingMatch ? C.amber + "40" : C.borderDefault}`, borderRadius: 10, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <input value={acct.name} onChange={e => updateExtracted(idx, "name", e.target.value)} style={{ flex: 1, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary, background: "transparent", border: "none", outline: "none", padding: 0 }} />
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, color: confColor, background: confColor + "18", padding: "2px 6px", borderRadius: 3, textTransform: "uppercase" }}>{acct.confidence || "medium"}</span>
                      <button onClick={() => removeExtracted(idx)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textTertiary, display: "flex", padding: 2, opacity: 0.5 }} onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}><X size={14} /></button>
                    </div>
                    {acct._existingMatch && <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "6px 10px", background: C.amber + "12", borderRadius: 6, border: `1px solid ${C.amber}25` }}><AlertTriangle size={12} style={{ color: C.amber }} /><span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.amber }}>Possible duplicate of "{acct._existingMatch}"</span></div>}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginBottom: 4 }}>ARR</div>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: C.textTertiary, fontFamily: FONT_MONO, fontSize: 12 }}>$</span>
                          <input type="number" value={acct.arr || ""} onChange={e => updateExtracted(idx, "arr", parseFloat(e.target.value) || 0)} style={{ width: "100%", padding: "6px 8px 6px 20px", borderRadius: 6, background: C.bgPrimary, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginBottom: 4 }}>Renewal Date</div>
                        <input type="date" value={acct.renewalDate || ""} onChange={e => updateExtracted(idx, "renewalDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, background: C.bgPrimary, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 12, outline: "none", colorScheme: "dark", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginBottom: 4 }}>Risk Level</div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {["low", "medium", "high"].map(level => (<button key={level} onClick={() => updateExtracted(idx, "riskLevel", level)} style={{ flex: 1, padding: "5px 4px", borderRadius: 5, cursor: "pointer", border: `1px solid ${acct.riskLevel === level ? rc[level] + "60" : C.borderDefault}`, background: acct.riskLevel === level ? rc[level] + "14" : "transparent", color: acct.riskLevel === level ? rc[level] : C.textTertiary, fontFamily: FONT_SANS, fontSize: 10, fontWeight: acct.riskLevel === level ? 600 : 500, textTransform: "capitalize" }}>{level}</button>))}
                        </div>
                      </div>
                    </div>
                    {acct.notes && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.5, padding: "8px 10px", background: C.bgPrimary, borderRadius: 6, border: `1px solid ${C.borderDefault}` }}>{acct.notes}</div>}
                    {acct.contacts?.length > 0 && <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>{acct.contacts.map((c, ci) => <span key={ci} style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, background: C.bgPrimary, padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.borderDefault}` }}>{c.name}{c.role ? ` · ${c.role}` : ""}</span>)}</div>}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => { setPhase("input"); setExtracted([]); }}>Back</Btn>
              <Btn variant="primary" onClick={handleCreateAccounts} disabled={extracted.length === 0}><Check size={14} /> Create {extracted.length} Account{extracted.length !== 1 ? "s" : ""}</Btn>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );

  // Phase: Done
  return (
    <PageLayout maxWidth={1200}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: FONT_SANS, fontSize: "var(--bc-heading-size, 24px)", fontWeight: 700, color: C.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>Import</h1>
          <p className="bc-hide-mobile" style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, margin: "4px 0 0" }}>Import and sync your renewal portfolio data</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: C.green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={28} style={{ color: C.green }} /></div>
        <h2 style={{ fontFamily: FONT_SANS, fontSize: 20, fontWeight: 600, color: C.textPrimary, margin: 0 }}>Import Complete</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, maxWidth: 400, lineHeight: 1.5, margin: 0 }}>{createdCount} account{createdCount !== 1 ? "s" : ""} created with source data attached. The Autopilot will start generating actions for them.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => { setPhase("input"); setRawData(""); setExtracted([]); }}>Import More</Btn>
          <Btn variant="primary" onClick={() => navigate('/app/autopilot')}>Go to Autopilot</Btn>
        </div>
      </div>
    </PageLayout>
  );
}
