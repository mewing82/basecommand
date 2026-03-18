import { useState, useEffect } from "react";
import { ShieldAlert, Sparkles, Loader, AlertTriangle, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { renewalStore } from "../../lib/storage";
import { callAI } from "../../lib/ai";
import { PageLayout } from "../../components/layout/PageLayout";
import { Btn } from "../../components/ui/index";
import { computePortfolioHealth, getSeverity, ARCHETYPES, ARCHETYPE_RENEWAL_PROB } from "../../lib/healthScore";
import { buildCompanyContext } from "../../lib/prompts";
import { formatARR } from "../../lib/utils";

function RESCUE_PROMPT(accountData, companyContext) {
  return `You are an expert renewal strategist AI. Generate a rescue intervention plan for at-risk accounts.

${companyContext}

For each account below, create a personalized rescue plan that includes:
1. **diagnosis** — Why this account is at risk (be specific, cite the signals)
2. **archetype_strategy** — What approach works for this behavioral archetype
3. **actions** — 3-5 specific, time-sequenced actions (each with: action, timeline, owner_hint, priority)
4. **talking_points** — 2-3 key talking points for the human conversation
5. **risk_if_no_action** — What happens if we do nothing (quantify if possible)
6. **save_probability** — Estimated probability of saving this account with intervention (0-100%)

Accounts requiring intervention:
${accountData}

Return JSON: { "plans": [{ "accountId": "...", "accountName": "...", "diagnosis": "...", "archetype_strategy": "...", "actions": [{ "action": "...", "timeline": "...", "owner_hint": "...", "priority": "critical|high|medium" }], "talking_points": ["..."], "risk_if_no_action": "...", "save_probability": 75 }] }

Be specific and actionable. Reference the account's actual data. Explain WHY each action matters.`;
}

export default function RescuePlanner() {
  const { isMobile } = useMediaQuery();
  const [atRiskAccounts, setAtRiskAccounts] = useState([]);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [expandedPlan, setExpandedPlan] = useState(null);

  useEffect(() => { loadAtRisk(); }, []);

  async function loadAtRisk() {
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
    // Filter to at-risk: health score <= 5
    const atRisk = results.filter(r => r.health.score <= 5);
    setAtRiskAccounts(atRisk);
    setLoading(false);
  }

  async function generatePlans() {
    if (atRiskAccounts.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const settings = await renewalStore.getSettings();
      const companyContext = buildCompanyContext(settings?.companyProfile);

      const accountData = atRiskAccounts.map(({ account, health }) => {
        const signals = Object.entries(health.signals)
          .map(([key, s]) => `  ${s.label}: ${s.score}/10 — ${s.reason}`)
          .join("\n");
        return `Account: ${account.name}
  ARR: ${formatARR(account.arr)}
  Renewal Date: ${account.renewalDate || "Not set"}
  Health Score: ${health.score}/10 (${health.severity.label})
  Archetype: ${health.archetypeInfo.label} — ${health.archetypeInfo.description}
  Renewal Probability: ${Math.round(health.renewalProbability * 100)}%
  Contacts: ${(account.contacts || []).map(c => `${c.name} (${c.role || "no role"})`).join(", ") || "None"}
  Summary: ${account.summary || "None"}
  Signals:
${signals}`;
      }).join("\n\n---\n\n");

      const response = await callAI(
        [{ role: "user", content: `Generate rescue plans for these ${atRiskAccounts.length} at-risk accounts:\n\n${accountData}` }],
        RESCUE_PROMPT(accountData, companyContext),
        4000
      );

      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      setPlans(parsed.plans || []);
      if (parsed.plans?.length > 0) setExpandedPlan(parsed.plans[0].accountId);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const totalAtRiskARR = atRiskAccounts.reduce((sum, r) => sum + (r.account.arr || 0), 0);

  return (
    <PageLayout maxWidth={900}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#34D399", boxShadow: "0 0 8px rgba(52, 211, 153, 0.6)",
          }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Renewal Agent
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Loader size={24} style={{ color: C.textTertiary, animation: "spin 1s linear infinite" }} />
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 12 }}>
            Analyzing portfolio health...
          </div>
        </div>
      ) : atRiskAccounts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <CheckCircle size={32} style={{ color: C.green }} />
          <div style={{ fontFamily: FONT_SANS, fontSize: fs(18, 16, isMobile), fontWeight: 600, color: C.textPrimary, marginTop: 16 }}>
            Portfolio is healthy
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 4 }}>
            No accounts need immediate intervention. The Health Monitor is watching.
          </div>
        </div>
      ) : (
        <>
          {/* At-risk summary banner */}
          <div style={{
            background: `linear-gradient(135deg, ${C.redMuted} 0%, ${C.bgCard} 100%)`,
            border: `1px solid ${C.red}25`,
            borderLeft: `3px solid ${C.red}`,
            borderRadius: 12, padding: isMobile ? "14px 12px" : "20px 24px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
              <ShieldAlert size={18} style={{ color: C.red }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>
                {atRiskAccounts.length} account{atRiskAccounts.length !== 1 ? "s" : ""} need intervention
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.red, marginLeft: isMobile ? 0 : "auto" }}>
                {formatARR(totalAtRiskARR)} at risk
              </span>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
              These accounts have health scores of 5.0 or below. AI will generate personalized rescue plans with archetype-aware strategies.
            </div>
            {!plans && (
              <Btn variant="ai" onClick={generatePlans} disabled={generating} style={{ marginTop: 12 }}>
                {generating
                  ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating rescue plans...</>
                  : <><Sparkles size={14} /> Generate Rescue Plans</>
                }
              </Btn>
            )}
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: C.red, fontFamily: FONT_BODY, fontSize: 13 }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Generated rescue plans */}
          {plans && plans.map((plan, i) => {
            const isExpanded = expandedPlan === plan.accountId;
            const matchedHealth = atRiskAccounts.find(r => r.account.id === plan.accountId || r.account.name === plan.accountName);
            const severity = matchedHealth ? matchedHealth.health.severity : getSeverity(3);

            return (
              <div key={plan.accountId || i} style={{
                background: C.bgCard,
                border: `1px solid ${severity.color}30`,
                borderLeft: `3px solid ${severity.color}60`,
                borderRadius: 10, marginBottom: 10, overflow: "hidden",
              }}>
                {/* Plan header */}
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : (plan.accountId || i))}
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: isMobile ? 8 : 12,
                    padding: isMobile ? "12px 12px" : "16px 20px", textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: severity.color + "14", border: `1px solid ${severity.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: severity.color,
                  }}>
                    {plan.save_probability}%
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>
                      {plan.accountName}
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginTop: 2 }}>
                      {plan.diagnosis?.slice(0, 120)}{plan.diagnosis?.length > 120 ? "..." : ""}
                    </div>
                  </div>
                  <ArrowRight size={14} style={{
                    color: C.textTertiary, flexShrink: 0,
                    transition: "transform 0.15s",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  }} />
                </button>

                {/* Expanded plan */}
                {isExpanded && (
                  <div style={{ padding: isMobile ? "0 12px 14px" : "0 20px 20px", borderTop: `1px solid ${C.borderDefault}` }}>
                    {/* Diagnosis */}
                    <div style={{ marginTop: 16, marginBottom: 16 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                        Diagnosis
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
                        {plan.diagnosis}
                      </div>
                    </div>

                    {/* Archetype strategy */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                        Archetype Strategy
                      </div>
                      <div style={{
                        fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6,
                        padding: "10px 14px", background: C.bgAI, borderRadius: 8, border: `1px solid ${C.borderAI}`,
                      }}>
                        {plan.archetype_strategy}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                        Action Plan
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {(plan.actions || []).map((action, ai) => {
                          const pc = { critical: C.red, high: C.amber, medium: C.textTertiary };
                          return (
                            <div key={ai} style={{
                              display: "flex", alignItems: "flex-start", gap: 10,
                              padding: "10px 14px", background: C.bgPrimary, borderRadius: 8,
                              border: `1px solid ${C.borderDefault}`,
                            }}>
                              <div style={{
                                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                background: (pc[action.priority] || C.textTertiary) + "18",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
                                color: pc[action.priority] || C.textTertiary,
                              }}>{ai + 1}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                                  {action.action}
                                </div>
                                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>
                                    <Clock size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />{action.timeline}
                                  </span>
                                  {action.owner_hint && (
                                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>
                                      Owner: {action.owner_hint}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Talking points */}
                    {plan.talking_points?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                          Talking Points
                        </div>
                        {plan.talking_points.map((tp, ti) => (
                          <div key={ti} style={{
                            fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5,
                            padding: "4px 0 4px 12px", borderLeft: `2px solid ${C.gold}40`, marginBottom: 4,
                          }}>
                            {tp}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Risk if no action */}
                    <div style={{
                      padding: "10px 14px", borderRadius: 8,
                      background: C.redMuted, border: `1px solid ${C.red}20`,
                    }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.red, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                        Risk If No Action
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                        {plan.risk_if_no_action}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Regenerate button if plans exist */}
          {plans && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Btn variant="ghost" onClick={generatePlans} disabled={generating}>
                <Sparkles size={14} /> Regenerate Plans
              </Btn>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
