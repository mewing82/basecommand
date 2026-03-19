import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Sparkles, Loader, Check, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { renewalStore } from "../../lib/storage";
import { callAI } from "../../lib/ai";
import { PageLayout } from "../../components/layout/PageLayout";
import { Btn } from "../../components/ui/index";
import { computeHealthScore, ARCHETYPES } from "../../lib/healthScore";
import { buildCompanyContext } from "../../lib/prompts";
import { formatARR } from "../../lib/utils";
import { AILoadingProgress, ActionMenu } from "../../components/ui/AgentWidgets";

function PLAYBOOK_PROMPT(accountData, companyContext) {
  return `You are a renewal operations strategist. Generate a 90/60/30 day renewal playbook for each account.

${companyContext}

For each account, create a time-sequenced action plan:
1. **90_day_actions** — Strategic positioning (3-4 actions with owner hints)
2. **60_day_actions** — Active engagement (3-4 actions)
3. **30_day_actions** — Close and secure (3-4 actions)
4. **key_milestones** — 3-4 critical milestones that must happen for a successful renewal
5. **archetype_notes** — How this account's behavioral archetype should influence the approach
6. **success_criteria** — What "success" looks like for this specific renewal

Each action should include: action, owner_hint (who should do it), and why (brief rationale).

Accounts:
${accountData}

Return JSON: { "playbooks": [{ "accountId": "...", "accountName": "...", "arr": 0, "renewalDate": "...", "90_day_actions": [{ "action": "...", "owner_hint": "...", "why": "..." }], "60_day_actions": [...], "30_day_actions": [...], "key_milestones": ["..."], "archetype_notes": "...", "success_criteria": "..." }] }

Be specific. Reference account data. Explain WHY each action matters for this particular renewal.`;
}

export default function PlaybookBuilder() {
  const { isMobile } = useMediaQuery();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [playbooks, setPlaybooks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genStartedAt, setGenStartedAt] = useState(null);
  const [error, setError] = useState(null);
  const [expandedPlaybook, setExpandedPlaybook] = useState(null);

  useEffect(() => { renewalStore.getAccounts().then(a => { setAccounts(a); setLoading(false); }); }, []);

  // Accounts with renewals in next 120 days
  const upcomingAccounts = accounts.filter(a => {
    if (!a.renewalDate) return false;
    const daysOut = Math.floor((new Date(a.renewalDate) - Date.now()) / 86400000);
    return daysOut > 0 && daysOut <= 120;
  }).sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

  async function generatePlaybooks() {
    if (upcomingAccounts.length === 0) return;
    setGenerating(true); setGenStartedAt(Date.now()); setError(null);
    try {
      const settings = await renewalStore.getSettings();
      const companyContext = buildCompanyContext(settings?.companyProfile);

      const accountData = await Promise.all(upcomingAccounts.slice(0, 6).map(async account => {
        const ctx = await renewalStore.getContext(account.id);
        const health = computeHealthScore(account, { contextItems: ctx });
        const daysOut = Math.floor((new Date(account.renewalDate) - Date.now()) / 86400000);
        return `Account: ${account.name}
  ARR: ${formatARR(account.arr)} | Renewal: ${account.renewalDate} (${daysOut} days)
  Health: ${health.score}/10 | Archetype: ${health.archetypeInfo.label}
  Risk: ${account.riskLevel} | Contacts: ${(account.contacts || []).map(c => `${c.name} (${c.role || ""})`).join(", ") || "None"}
  Summary: ${account.summary || "None"}`;
      }));

      const response = await callAI(
        [{ role: "user", content: `Generate 90/60/30 day renewal playbooks for these ${upcomingAccounts.length} upcoming renewals:\n\n${accountData.join("\n\n---\n\n")}` }],
        PLAYBOOK_PROMPT(accountData.join("\n\n---\n\n"), companyContext),
        4000
      );
      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      setPlaybooks(parsed.playbooks || []);
      if (parsed.playbooks?.length > 0) setExpandedPlaybook(0);
    } catch (err) { setError(err.message); } finally { setGenerating(false); }
  }

  const phaseColors = { "90": "#6366F1", "60": "#FBBF24", "30": "#F87171" };

  return (
    <PageLayout maxWidth={900}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px rgba(52, 211, 153, 0.6)" }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Coaching Agent</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><Loader size={24} style={{ color: C.textTertiary, animation: "spin 1s linear infinite" }} /></div>
      ) : upcomingAccounts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <FileText size={32} style={{ color: C.textTertiary }} />
          <div style={{ fontFamily: FONT_SANS, fontSize: fs(18, 16, isMobile), fontWeight: 600, color: C.textPrimary, marginTop: 16 }}>No upcoming renewals</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 4 }}>
            Accounts with renewals in the next 120 days will appear here for playbook generation.
          </div>
          <Btn variant="primary" onClick={() => navigate("/app/import")} style={{ marginTop: 16 }}>Import Accounts</Btn>
        </div>
      ) : (
        <>
          <div style={{
            background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
            border: `1px solid ${C.gold}25`, borderLeft: `3px solid ${C.gold}`,
            borderRadius: 12, padding: isMobile ? "14px 12px" : "20px 24px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
              <FileText size={16} style={{ color: C.gold }} />
              <span style={{ fontFamily: FONT_SANS, fontSize: fs(16, 14, isMobile), fontWeight: 600, color: C.textPrimary }}>
                {upcomingAccounts.length} renewal{upcomingAccounts.length !== 1 ? "s" : ""} in next 120 days
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: isMobile ? 12 : 13, color: C.gold, fontWeight: 600, marginLeft: isMobile ? 0 : "auto" }}>
                {formatARR(upcomingAccounts.reduce((s, a) => s + (a.arr || 0), 0))} at stake
              </span>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>
              AI generates 90/60/30 day action plans calibrated to each account's archetype and health profile. Never miss a critical milestone.
            </div>
            {!playbooks && (
              <Btn variant="ai" onClick={generatePlaybooks} disabled={generating}>
                <><Sparkles size={14} /> Generate Playbooks</>
              </Btn>
            )}
          </div>

          {generating && (
            <AILoadingProgress
              startedAt={genStartedAt}
              phases={[
                { label: "Analyzing upcoming renewals...", duration: 4000 },
                { label: "Building 90/60/30-day timelines...", duration: 8000 },
                { label: "Crafting archetype-aware strategies...", duration: 10000 },
                { label: "Finalizing playbooks...", duration: 8000 },
              ]}
            />
          )}

          {error && <div style={{ color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          {playbooks && playbooks.map((pb, i) => {
            const isExpanded = expandedPlaybook === i;
            const daysOut = pb.renewalDate ? Math.floor((new Date(pb.renewalDate) - Date.now()) / 86400000) : null;
            return (
              <div key={i} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                borderRadius: 10, marginBottom: 8, overflow: "hidden",
              }}>
                <button onClick={() => setExpandedPlaybook(isExpanded ? null : i)} style={{
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, padding: isMobile ? "12px 12px" : "14px 20px", textAlign: "left",
                }}>
                  <FileText size={16} style={{ color: C.gold, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{pb.accountName}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                      {formatARR(pb.arr)} · {daysOut != null ? `${daysOut}d to renewal` : pb.renewalDate}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={14} style={{ color: C.textTertiary }} /> : <ChevronDown size={14} style={{ color: C.textTertiary }} />}
                </button>

                {isExpanded && (
                  <div style={{ padding: isMobile ? "0 12px 14px" : "0 20px 20px", borderTop: `1px solid ${C.borderDefault}` }}>
                    {pb.archetype_notes && (
                      <div style={{ marginTop: 14, padding: "10px 14px", background: C.bgAI, borderRadius: 8, border: `1px solid ${C.borderAI}`, marginBottom: 14 }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.aiBlue, textTransform: "uppercase", marginBottom: 3 }}>Archetype Strategy</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{pb.archetype_notes}</div>
                      </div>
                    )}

                    {/* 90/60/30 phases */}
                    {[
                      { key: "90_day_actions", label: "90 Days Out", phase: "90" },
                      { key: "60_day_actions", label: "60 Days Out", phase: "60" },
                      { key: "30_day_actions", label: "30 Days Out", phase: "30" },
                    ].map(({ key, label, phase }) => {
                      const actions = pb[key] || [];
                      if (actions.length === 0) return null;
                      const color = phaseColors[phase];
                      return (
                        <div key={key} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                            <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color }}>{label}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {actions.map((action, ai) => (
                              <div key={ai} style={{
                                padding: "10px 14px", background: C.bgPrimary, borderRadius: 8,
                                border: `1px solid ${C.borderDefault}`, borderLeft: `3px solid ${color}40`,
                              }}>
                                <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{action.action}</div>
                                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                                  {action.owner_hint && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>Owner: {action.owner_hint}</span>}
                                  {action.why && <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary }}>{action.why}</span>}
                                </div>
                                <ActionMenu accountName={pb.accountName} actionText={action.action} compact />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {pb.key_milestones?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", marginBottom: 6 }}>Key Milestones</div>
                        {pb.key_milestones.map((m, mi) => (
                          <div key={mi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                            <Check size={12} style={{ color: C.green }} />
                            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary }}>{m}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {pb.success_criteria && (
                      <div style={{ padding: "10px 14px", background: C.greenMuted, borderRadius: 8, border: `1px solid ${C.green}20` }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.green, textTransform: "uppercase", marginBottom: 3 }}>Success Criteria</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textPrimary }}>{pb.success_criteria}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {playbooks && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Btn variant="ghost" onClick={generatePlaybooks} disabled={generating}><Sparkles size={14} /> Regenerate</Btn>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
