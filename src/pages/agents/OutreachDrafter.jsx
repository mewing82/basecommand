import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, Sparkles, Loader, Copy, Check, RefreshCw, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { renewalStore } from "../../lib/storage";
import { callAI } from "../../lib/ai";
import { PageLayout } from "../../components/layout/PageLayout";
import { Btn } from "../../components/ui/index";
import { computePortfolioHealth, getSeverity, ARCHETYPES } from "../../lib/healthScore";
import { buildCompanyContext } from "../../lib/prompts";
import { formatARR } from "../../lib/utils";
import { AILoadingProgress } from "../../components/ui/AgentWidgets";

// ─── Batch prompt (multiple accounts, one email each) ────────────────────────
function OUTREACH_PROMPT(accountData, companyContext, outreachType) {
  return `You are an expert renewal outreach AI. Draft hyper-personalized, context-rich ${outreachType} emails.

${companyContext}

For each account, generate an email that:
1. References the specific relationship context (contacts, past interactions, account history)
2. Is calibrated to the account's behavioral archetype and health status
3. Has a clear call-to-action appropriate to the situation
4. Feels human, warm, and strategic — NOT generic or templated
5. Explains WHY this outreach matters now (timing, signals, context)

Accounts:
${accountData}

Return JSON: { "drafts": [{ "accountId": "...", "accountName": "...", "subject": "...", "body": "...", "tone": "warm|professional|urgent|celebratory", "context_used": "brief note on what context informed this draft", "recommended_send_window": "e.g. within 48 hours" }] }

Write emails that a senior renewal professional would be proud to send. Reference specific details from the account data.`;
}

// ─── Single-account prompt (multiple strategic variations) ───────────────────
function FOCUSED_OUTREACH_PROMPT(accountData, companyContext, contextData) {
  return `You are an expert renewal outreach AI. Generate 5 strategically different email drafts for a SINGLE account, each with a unique angle and approach.

${companyContext}

ACCOUNT DATA:
${accountData}

CONTEXT DATA (ingested from CRM, emails, notes):
${contextData}

Generate 5 email variations, each with a DIFFERENT strategic angle:
1. **Renewal / Retention** — focused on securing the renewal, addressing any concerns, reinforcing value delivered
2. **Expansion / Upsell** — pitch additional seats, higher tier, or new features based on their usage patterns
3. **Executive Engagement** — targeted at a senior stakeholder, board-ready language, strategic partnership framing
4. **Value Reinforcement** — ROI recap, success metrics, "here's what you've achieved" positioning
5. **Risk Mitigation** — address specific risk signals head-on, proactive problem-solving, show you're paying attention

Each draft MUST:
- Reference specific data from the account (contacts by name, ARR figures, renewal dates, specific issues)
- Use the appropriate contact for the angle (exec for executive engagement, day-to-day for check-ins)
- Feel like it was written by someone who deeply knows this account
- Include a specific, clear call-to-action

Return JSON: { "drafts": [{ "strategy": "renewal|expansion|executive|value|risk_mitigation", "strategy_label": "human-readable label", "subject": "...", "body": "...", "tone": "warm|professional|urgent|celebratory", "target_contact": "who this email is for", "context_used": "what data points informed this draft", "recommended_send_window": "timing recommendation" }] }`;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handleCopy} style={{
      background: "none", border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 4,
      fontFamily: FONT_MONO, fontSize: 10, color: copied ? C.green : C.textTertiary,
      padding: "4px 8px", borderRadius: 4,
    }}>
      {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

const STRATEGY_COLORS = {
  renewal: { color: C.gold, label: "Renewal" },
  expansion: { color: C.green, label: "Expansion" },
  executive: { color: C.purple || "#A78BFA", label: "Executive" },
  value: { color: C.aiBlue, label: "Value" },
  risk_mitigation: { color: C.red, label: "Risk Mitigation" },
};

export default function OutreachDrafter() {
  const { isMobile } = useMediaQuery();
  const [searchParams] = useSearchParams();
  const targetAccountId = searchParams.get("accountId");

  const [healthResults, setHealthResults] = useState([]);
  const [targetAccount, setTargetAccount] = useState(null);
  const [targetContext, setTargetContext] = useState([]);
  const [drafts, setDrafts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genStartedAt, setGenStartedAt] = useState(null);
  const [error, setError] = useState(null);
  const [outreachType, setOutreachType] = useState("renewal");
  const [expandedDraft, setExpandedDraft] = useState(null);

  const isFocusedMode = !!targetAccountId;

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    setLoading(true);
    const accounts = await renewalStore.getAccounts();
    const contextMap = {};
    for (const acct of accounts) {
      try {
        const ctx = await renewalStore.getContext(acct.id);
        if (ctx?.length) contextMap[acct.id] = ctx;
      } catch { /* skip */ }
    }
    const results = computePortfolioHealth(accounts, contextMap);
    setHealthResults(results);

    // Focused mode: find the target account and auto-generate
    if (targetAccountId) {
      const found = results.find(r => r.account.id === targetAccountId);
      if (found) {
        setTargetAccount(found);
        setTargetContext(contextMap[targetAccountId] || []);
      }
    }
    setLoading(false);
  }

  // Auto-generate when target account loads in focused mode
  useEffect(() => {
    if (isFocusedMode && targetAccount && !drafts && !generating) {
      generateFocusedDrafts();
    }
  }, [targetAccount]);

  // ─── Focused mode: generate strategic variations for one account ──────
  async function generateFocusedDrafts() {
    if (!targetAccount) return;
    setGenerating(true);
    setGenStartedAt(Date.now());
    setError(null);
    try {
      const settings = await renewalStore.getSettings();
      const companyContext = buildCompanyContext(settings?.companyProfile || settings);

      const { account, health } = targetAccount;
      const dtr = account.renewalDate ? Math.ceil((new Date(account.renewalDate) - new Date()) / 86400000) : null;
      const accountData = `Account: ${account.name}
  ARR: ${formatARR(account.arr)}
  Renewal Date: ${account.renewalDate || "Not set"}${dtr !== null ? ` (${dtr} days away)` : ""}
  Risk Level: ${account.riskLevel}
  Health Score: ${health.score}/10 (${health.severity.label})
  Archetype: ${health.archetypeInfo.label} — ${health.archetypeInfo.description}
  Renewal Probability: ${Math.round(health.renewalProbability * 100)}%
  Contacts: ${(account.contacts || []).map(c => `${c.name} (${c.role || "no role"}, ${c.email || "no email"})`).join("; ") || "None"}
  Summary: ${account.summary || "No notes"}
  Key signals: ${Object.values(health.signals).map(s => `${s.label}: ${s.score}/10 — ${s.reason}`).join("; ")}`;

      const contextData = targetContext.length > 0
        ? targetContext.map(ci => `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 600)}`).join("\n\n")
        : "No additional context data ingested.";

      const response = await callAI(
        [{ role: "user", content: `Generate 5 strategic outreach variations for ${account.name}:\n\n${accountData}\n\nContext:\n${contextData}` }],
        FOCUSED_OUTREACH_PROMPT(accountData, companyContext, contextData),
        4000
      );

      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      setDrafts(parsed.drafts || []);
      if (parsed.drafts?.length > 0) setExpandedDraft(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  // ─── Batch mode: generate one email per account ───────────────────────
  function getTargetAccounts() {
    if (outreachType === "renewal") {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 90);
      return healthResults.filter(r => r.account.renewalDate && new Date(r.account.renewalDate) <= cutoff).slice(0, 8);
    } else if (outreachType === "re-engage") {
      return healthResults.filter(r => r.health.score <= 5).slice(0, 8);
    } else {
      return healthResults.filter(r => r.health.score > 5).slice(0, 8);
    }
  }

  async function generateBatchDrafts() {
    const targets = getTargetAccounts();
    if (targets.length === 0) return;
    setGenerating(true);
    setGenStartedAt(Date.now());
    setError(null);
    try {
      const settings = await renewalStore.getSettings();
      const companyContext = buildCompanyContext(settings?.companyProfile || settings);
      const accountData = targets.map(({ account, health }) => {
        return `Account: ${account.name}
  ARR: ${formatARR(account.arr)}
  Renewal Date: ${account.renewalDate || "Not set"}
  Health Score: ${health.score}/10 (${health.severity.label})
  Archetype: ${health.archetypeInfo.label}
  Contacts: ${(account.contacts || []).map(c => `${c.name} (${c.role || "no role"}, ${c.email || "no email"})`).join(", ") || "None"}
  Summary: ${account.summary || "No notes"}
  Key signals: ${Object.values(health.signals).filter(s => s.score <= 5).map(s => s.reason).join("; ") || "All healthy"}`;
      }).join("\n\n---\n\n");
      const typeLabels = { renewal: "renewal follow-up", "check-in": "proactive check-in", "re-engage": "re-engagement" };
      const response = await callAI(
        [{ role: "user", content: `Draft ${typeLabels[outreachType]} emails for these ${targets.length} accounts:\n\n${accountData}` }],
        OUTREACH_PROMPT(accountData, companyContext, typeLabels[outreachType]),
        4000
      );
      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      setDrafts(parsed.drafts || []);
      if (parsed.drafts?.length > 0) setExpandedDraft(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const targets = getTargetAccounts();

  // ═══════════════════════════════════════════════════════════════════════
  // FOCUSED MODE — single account, strategic variations
  // ═══════════════════════════════════════════════════════════════════════
  if (isFocusedMode) {
    const acct = targetAccount?.account;
    return (
      <PageLayout maxWidth={900}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => window.history.back()} style={{
            display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
            cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, padding: 0, marginBottom: 12,
          }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px rgba(52, 211, 153, 0.6)" }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Renewal Agent</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Loader size={24} style={{ color: C.textTertiary, animation: "spin 1s linear infinite" }} />
          </div>
        ) : !acct ? (
          <div style={{ textAlign: "center", padding: 60, fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>
            Account not found.
          </div>
        ) : (
          <>
            {/* Account context banner */}
            <div style={{
              background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
              border: `1px solid ${C.borderAI}`, borderLeft: `3px solid ${C.aiBlue}`,
              borderRadius: 12, padding: isMobile ? "14px 12px" : "18px 24px", marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Mail size={18} style={{ color: C.aiBlue }} />
                <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 700, color: C.textPrimary }}>
                  {acct.name}
                </span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary, marginBottom: 10 }}>
                {formatARR(acct.arr)} · {acct.renewalDate || "No renewal date"} · {acct.riskLevel} risk
                {targetContext.length > 0 && ` · ${targetContext.length} context items`}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
                Generating 5 strategic outreach variations — each with a unique angle tailored to this account's data, health signals, and your company context.
              </div>
            </div>

            {generating && (
              <AILoadingProgress
                startedAt={genStartedAt}
                phases={[
                  { label: `Deep-analyzing ${acct.name}...`, duration: 4000 },
                  { label: "Reading context data and signals...", duration: 6000 },
                  { label: "Crafting 5 strategic variations...", duration: 12000 },
                  { label: "Personalizing tone and CTAs...", duration: 8000 },
                ]}
              />
            )}

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: C.red, fontFamily: FONT_BODY, fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Draft cards */}
            {drafts && drafts.map((draft, i) => {
              const isExpanded = expandedDraft === i;
              const stratInfo = STRATEGY_COLORS[draft.strategy] || { color: C.textTertiary, label: draft.strategy_label || draft.strategy };

              return (
                <div key={i} style={{
                  background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                  borderLeft: `3px solid ${stratInfo.color}60`,
                  borderRadius: 10, marginBottom: 8, overflow: "hidden",
                }}>
                  <button onClick={() => setExpandedDraft(isExpanded ? null : i)} style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: isMobile ? 8 : 12,
                    padding: isMobile ? "12px 12px" : "14px 20px", textAlign: "left",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: stratInfo.color + "14", border: `1px solid ${stratInfo.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Mail size={14} style={{ color: stratInfo.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
                          {draft.strategy_label || stratInfo.label}
                        </span>
                        <span style={{
                          fontFamily: FONT_MONO, fontSize: 9, color: stratInfo.color,
                          background: stratInfo.color + "14", padding: "2px 6px", borderRadius: 3,
                          textTransform: "uppercase",
                        }}>{draft.tone}</span>
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                        {draft.subject}
                      </div>
                    </div>
                    {draft.target_contact && (
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, flexShrink: 0, display: isMobile ? "none" : "block" }}>
                        To: {draft.target_contact}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={14} style={{ color: C.textTertiary }} /> : <ChevronDown size={14} style={{ color: C.textTertiary }} />}
                  </button>

                  {isExpanded && (
                    <div style={{ padding: isMobile ? "0 12px 14px" : "0 20px 20px", borderTop: `1px solid ${C.borderDefault}` }}>
                      {draft.target_contact && (
                        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginTop: 10, marginBottom: 4 }}>
                          To: {draft.target_contact}
                        </div>
                      )}
                      <div style={{ marginTop: 10, marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject</div>
                          <CopyButton text={draft.subject} />
                        </div>
                        <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, padding: "8px 12px", background: C.bgPrimary, borderRadius: 6, border: `1px solid ${C.borderDefault}`, marginTop: 4 }}>
                          {draft.subject}
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Body</div>
                          <CopyButton text={draft.body} />
                        </div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.7, padding: "12px 14px", background: C.bgPrimary, borderRadius: 8, border: `1px solid ${C.borderDefault}`, marginTop: 4, whiteSpace: "pre-wrap" }}>
                          {draft.body}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
                        {draft.context_used && (
                          <div style={{ flex: 1, padding: "8px 12px", background: C.bgAI, borderRadius: 6, border: `1px solid ${C.borderAI}` }}>
                            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.aiBlue, textTransform: "uppercase", marginBottom: 3 }}>Context Used</div>
                            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, lineHeight: 1.4 }}>{draft.context_used}</div>
                          </div>
                        )}
                        {draft.recommended_send_window && (
                          <div style={{ padding: "8px 12px", background: C.bgPrimary, borderRadius: 6, border: `1px solid ${C.borderDefault}` }}>
                            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", marginBottom: 3 }}>Send Window</div>
                            <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{draft.recommended_send_window}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {drafts && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <Btn variant="ghost" onClick={generateFocusedDrafts} disabled={generating}>
                  <RefreshCw size={14} /> Regenerate Variations
                </Btn>
              </div>
            )}
          </>
        )}
      </PageLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BATCH MODE — multiple accounts, one email each (default view)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <PageLayout maxWidth={900}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px rgba(52, 211, 153, 0.6)" }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Renewal Agent</span>
        </div>
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, padding: isMobile ? "12px 12px" : "16px 20px", marginBottom: 20 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Outreach Type</div>
        <div style={{ display: "flex", gap: 8, flexDirection: isMobile ? "column" : "row" }}>
          {[
            { id: "renewal", label: "Renewal Follow-up", desc: "Accounts renewing within 90 days", color: C.gold },
            { id: "re-engage", label: "Re-engagement", desc: "Silent or at-risk accounts", color: C.red },
            { id: "check-in", label: "Proactive Check-in", desc: "Healthy accounts — nurture the relationship", color: C.green },
          ].map(type => (
            <button key={type.id} onClick={() => { setOutreachType(type.id); setDrafts(null); }} style={{
              flex: 1, padding: "12px 14px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${outreachType === type.id ? type.color + "60" : C.borderDefault}`,
              background: outreachType === type.id ? type.color + "10" : "transparent",
              textAlign: "left", transition: "all 0.15s",
            }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: outreachType === type.id ? C.textPrimary : C.textSecondary }}>{type.label}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginTop: 2 }}>{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Loader size={24} style={{ color: C.textTertiary, animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <>
          <div style={{
            background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
            border: `1px solid ${C.borderAI}`, borderLeft: `3px solid ${C.aiBlue}`,
            borderRadius: 12, padding: isMobile ? "14px 12px" : "18px 24px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Mail size={16} style={{ color: C.aiBlue }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>
                {targets.length} account{targets.length !== 1 ? "s" : ""} ready for outreach
              </span>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>
              AI will draft personalized emails calibrated to each account's health score, behavioral archetype, and relationship context.
            </div>
            {!generating && (
              <Btn variant="ai" onClick={generateBatchDrafts} disabled={targets.length === 0}>
                <Sparkles size={14} /> Generate {targets.length} Draft{targets.length !== 1 ? "s" : ""}
              </Btn>
            )}
          </div>

          {generating && (
            <AILoadingProgress startedAt={genStartedAt} phases={[
              { label: `Analyzing ${targets.length} accounts...`, duration: 4000 },
              { label: "Reading relationship context...", duration: 6000 },
              { label: "Drafting personalized emails...", duration: 10000 },
              { label: "Calibrating tone and timing...", duration: 10000 },
            ]} />
          )}

          {error && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: C.red, fontFamily: FONT_BODY, fontSize: 13 }}>{error}</div>}

          {drafts && drafts.map((draft, i) => {
            const isExpanded = expandedDraft === i;
            const toneColors = { warm: C.amber, professional: C.gold, urgent: C.red, celebratory: C.green };
            const toneColor = toneColors[draft.tone] || C.textTertiary;
            return (
              <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                <button onClick={() => setExpandedDraft(isExpanded ? null : i)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, padding: isMobile ? "12px 12px" : "14px 20px", textAlign: "left" }}>
                  <Mail size={16} style={{ color: C.aiBlue, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{draft.accountName}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{draft.subject}</div>
                  </div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: toneColor, background: toneColor + "14", padding: "2px 6px", borderRadius: 3, textTransform: "uppercase" }}>{draft.tone}</span>
                  {isExpanded ? <ChevronUp size={14} style={{ color: C.textTertiary }} /> : <ChevronDown size={14} style={{ color: C.textTertiary }} />}
                </button>
                {isExpanded && (
                  <div style={{ padding: isMobile ? "0 12px 14px" : "0 20px 20px", borderTop: `1px solid ${C.borderDefault}` }}>
                    <div style={{ marginTop: 14, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject</div>
                        <CopyButton text={draft.subject} />
                      </div>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, padding: "8px 12px", background: C.bgPrimary, borderRadius: 6, border: `1px solid ${C.borderDefault}`, marginTop: 4 }}>{draft.subject}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Body</div>
                        <CopyButton text={draft.body} />
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.7, padding: "12px 14px", background: C.bgPrimary, borderRadius: 8, border: `1px solid ${C.borderDefault}`, marginTop: 4, whiteSpace: "pre-wrap" }}>{draft.body}</div>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
                      {draft.context_used && (
                        <div style={{ flex: 1, padding: "8px 12px", background: C.bgAI, borderRadius: 6, border: `1px solid ${C.borderAI}` }}>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.aiBlue, textTransform: "uppercase", marginBottom: 3 }}>Context Used</div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, lineHeight: 1.4 }}>{draft.context_used}</div>
                        </div>
                      )}
                      {draft.recommended_send_window && (
                        <div style={{ padding: "8px 12px", background: C.bgPrimary, borderRadius: 6, border: `1px solid ${C.borderDefault}` }}>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", marginBottom: 3 }}>Send Window</div>
                          <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{draft.recommended_send_window}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {drafts && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Btn variant="ghost" onClick={generateBatchDrafts} disabled={generating}>
                <RefreshCw size={14} /> Regenerate Drafts
              </Btn>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
