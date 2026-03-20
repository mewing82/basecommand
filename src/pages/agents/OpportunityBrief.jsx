import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Sparkles, Loader, DollarSign, Copy, Check, ArrowRight } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { renewalStore } from "../../lib/storage";
import { callAI } from "../../lib/ai";
import { PageLayout } from "../../components/layout/PageLayout";
import { Btn } from "../../components/ui/index";
import { computePortfolioHealth, ARCHETYPES } from "../../lib/healthScore";
import { buildCompanyContext } from "../../lib/prompts";
import { formatARR } from "../../lib/utils";
import { AILoadingProgress, ActionMenu } from "../../components/ui/AgentWidgets";

function OPPORTUNITY_BRIEF_PROMPT(accountData, companyContext) {
  return `You are a strategic expansion advisor for SaaS renewal operations. Generate pre-call expansion briefs.

${companyContext}

For each account, create an opportunity brief that includes:
1. **opportunity_summary** — What the expansion opportunity is and why now
2. **talking_points** — 3-4 specific talking points for the expansion conversation
3. **pricing_approach** — Recommended pricing strategy (upgrade path, discount strategy, bundle opportunity)
4. **competitive_positioning** — How to position against alternatives the customer might consider
5. **risk_factors** — What could derail the expansion
6. **recommended_ask** — The specific ask for this conversation
7. **estimated_expansion** — Estimated additional ARR if successful

Accounts with expansion potential:
${accountData}

Return JSON: { "briefs": [{ "accountId": "...", "accountName": "...", "opportunity_summary": "...", "talking_points": ["..."], "pricing_approach": "...", "competitive_positioning": "...", "risk_factors": "...", "recommended_ask": "...", "estimated_expansion": "$50K" }] }

Be specific to each account. Reference their actual data, archetype, and context. Explain WHY each recommendation makes sense.`;
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{
      background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
      fontFamily: FONT_MONO, fontSize: 10, color: copied ? C.green : C.textTertiary, padding: "4px 8px", borderRadius: 4,
    }}>{copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}</button>
  );
}

export default function OpportunityBrief() {
  const { isMobile } = useMediaQuery();
  const navigate = useNavigate();
  const [healthResults, setHealthResults] = useState([]);
  const [briefs, setBriefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genStartedAt, setGenStartedAt] = useState(null);
  const [error, setError] = useState(null);
  const [expandedBrief, setExpandedBrief] = useState(null);

  useEffect(() => {
    (async () => {
      const accounts = await renewalStore.getAccounts();
      const contextMap = {};
      await Promise.all(accounts.map(async (a) => {
        try { const ctx = await renewalStore.getContext(a.id); if (ctx?.length) contextMap[a.id] = ctx; } catch { /* skip */ }
      }));
      setHealthResults(computePortfolioHealth(accounts, contextMap));
      setLoading(false);
    })();
  }, []);

  // Growth-ready accounts
  const growthAccounts = healthResults.filter(r =>
    ["power_user", "enthusiastic_adopter", "convert"].includes(r.health.archetype)
  );

  async function generateBriefs() {
    if (growthAccounts.length === 0) return;
    setGenerating(true); setGenStartedAt(Date.now()); setError(null);
    try {
      const settings = await renewalStore.getSettings();
      const companyContext = buildCompanyContext(settings?.companyProfile);
      const accountData = growthAccounts.slice(0, 6).map(({ account, health }) => {
        return `Account: ${account.name}
  ARR: ${formatARR(account.arr)} | Renewal: ${account.renewalDate || "Not set"}
  Health: ${health.score}/10 | Archetype: ${health.archetypeInfo.label}
  Contacts: ${(account.contacts || []).map(c => `${c.name} (${c.role || "no role"})`).join(", ") || "None"}
  Summary: ${account.summary || "None"}`;
      }).join("\n\n---\n\n");

      const response = await callAI(
        [{ role: "user", content: `Generate expansion opportunity briefs for these ${growthAccounts.length} accounts:\n\n${accountData}` }],
        OPPORTUNITY_BRIEF_PROMPT(accountData, companyContext),
        4000
      );
      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      setBriefs(parsed.briefs || []);
      if (parsed.briefs?.length > 0) setExpandedBrief(0);
    } catch (err) { setError(err.message); } finally { setGenerating(false); }
  }

  return (
    <PageLayout maxWidth={900}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px rgba(52, 211, 153, 0.6)" }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Growth Agent</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><Loader size={24} style={{ color: C.textTertiary, animation: "spin 1s linear infinite" }} /></div>
      ) : growthAccounts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <TrendingUp size={32} style={{ color: C.textTertiary }} />
          <div style={{ fontFamily: FONT_SANS, fontSize: fs(18, 16, isMobile), fontWeight: 600, color: C.textPrimary, marginTop: 16 }}>No expansion-ready accounts</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 4 }}>
            Accounts classified as Power Users, Converts, or Enthusiastic Adopters will appear here.
          </div>
        </div>
      ) : (
        <>
          <div style={{
            background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
            border: `1px solid ${C.green}25`, borderLeft: `3px solid ${C.green}`,
            borderRadius: 12, padding: isMobile ? "14px 12px" : "20px 24px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <DollarSign size={16} style={{ color: C.green }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>
                {growthAccounts.length} expansion opportunities
              </span>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>
              AI will generate pre-call expansion briefs with talking points, pricing strategy, and competitive positioning — calibrated to each account's archetype and health profile.
            </div>
            {!briefs && (
              <Btn variant="ai" onClick={generateBriefs} disabled={generating}>
                <><Sparkles size={14} /> Generate Upsell Opportunity Briefs</>
              </Btn>
            )}
          </div>

          {generating && (
            <AILoadingProgress
              startedAt={genStartedAt}
              phases={[
                { label: "Analyzing growth-ready accounts...", duration: 4000 },
                { label: "Building expansion strategies...", duration: 8000 },
                { label: "Crafting opportunity briefs...", duration: 10000 },
                { label: "Finalizing pricing approaches...", duration: 8000 },
              ]}
            />
          )}

          {error && <div style={{ color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          {briefs && briefs.map((brief, i) => {
            const isExpanded = expandedBrief === i;
            return (
              <div key={i} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                borderLeft: `3px solid ${C.green}60`, borderRadius: 10, marginBottom: 8, overflow: "hidden",
              }}>
                <button onClick={() => setExpandedBrief(isExpanded ? null : i)} style={{
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, padding: isMobile ? "12px 12px" : "14px 20px", textAlign: "left",
                }}>
                  <TrendingUp size={16} style={{ color: C.green, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{brief.accountName}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>{brief.opportunity_summary?.slice(0, 100)}...</div>
                  </div>
                  {brief.estimated_expansion && <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: C.green }}>{brief.estimated_expansion}</span>}
                </button>

                {isExpanded && (
                  <div style={{ padding: isMobile ? "0 12px 14px" : "0 20px 20px", borderTop: `1px solid ${C.borderDefault}` }}>
                    <div style={{ marginTop: 14, marginBottom: 14 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", marginBottom: 6 }}>Opportunity</div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{brief.opportunity_summary}</div>
                    </div>

                    {brief.talking_points?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase" }}>Talking Points</div>
                          <CopyBtn text={brief.talking_points.join("\n• ")} />
                        </div>
                        {brief.talking_points.map((tp, ti) => (
                          <div key={ti} style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.5, padding: "4px 0 4px 12px", borderLeft: `2px solid ${C.green}40`, marginTop: 4 }}>{tp}</div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      <div style={{ padding: "10px 14px", background: C.bgPrimary, borderRadius: 8, border: `1px solid ${C.borderDefault}` }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", marginBottom: 4 }}>Pricing Approach</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{brief.pricing_approach}</div>
                      </div>
                      <div style={{ padding: "10px 14px", background: C.bgPrimary, borderRadius: 8, border: `1px solid ${C.borderDefault}` }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", marginBottom: 4 }}>Competitive Position</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{brief.competitive_positioning}</div>
                      </div>
                    </div>

                    <div style={{ padding: "10px 14px", background: C.goldMuted, borderRadius: 8, border: `1px solid ${C.gold}20` }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.gold, textTransform: "uppercase", marginBottom: 4 }}>Recommended Ask</div>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{brief.recommended_ask}</div>
                    </div>

                    {brief.risk_factors && (
                      <div style={{ marginTop: 10, fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5, padding: "8px 12px", background: C.redMuted, borderRadius: 6, border: `1px solid ${C.red}15` }}>
                        <strong style={{ color: C.red }}>Risk:</strong> {brief.risk_factors}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {briefs && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Btn variant="ghost" onClick={generateBriefs} disabled={generating}><Sparkles size={14} /> Regenerate</Btn>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
