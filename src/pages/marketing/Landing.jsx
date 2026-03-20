import { Link } from "react-router-dom";
import {
  Sparkles, ArrowRight, Brain, Target, FileText, Users,
  Activity, ChevronRight, Bot, CheckCircle2,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { usePageMeta, PAGE_SEO } from "../../lib/seo";

// ─── Free Agent.ai Agents ────────────────────────────────────────────────────

const FREE_AGENTS = [
  { name: "CRM Data Parser", desc: "Paste messy data, get clean accounts", link: "https://agent.ai/agent/basecommand-crm-parser" },
  { name: "Renewal Autopilot", desc: "Account details in, action plan out", link: "https://agent.ai/agent/basecommand-autopilot" },
  { name: "Exec Brief Generator", desc: "Portfolio data to board-ready brief", link: "https://agent.ai/agent/basecommand-exec-brief" },
  { name: "Forecast Intelligence", desc: "Renewal data to GRR/NRR forecast", link: "https://agent.ai/agent/basecommand-forecast" },
];

export default function Landing() {
  const { isMobile } = useMediaQuery();
  usePageMeta(PAGE_SEO.landing);

  return (
    <article>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        padding: isMobile ? "60px 20px 48px" : "100px 40px 80px", maxWidth: 1200, margin: "0 auto", textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center",
          padding: isMobile ? "8px 16px" : "8px 20px", borderRadius: 20, marginBottom: 24,
          background: C.goldMuted, border: `1px solid ${C.gold}20`,
          fontSize: isMobile ? 12 : 14, fontWeight: 500, color: C.gold, fontFamily: FONT_SANS,
          maxWidth: "100%", textAlign: "center",
        }}>
          <Bot size={14} />
          AI-powered renewal workflows — from co-pilot to fully autonomous
        </div>

        <h1 style={{
          fontFamily: FONT_SANS, fontSize: isMobile ? 32 : 56, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.1,
          margin: "0 auto 20px", maxWidth: 820,
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover}, ${C.aiBlue})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          AI-Powered Renewal Intelligence
        </h1>

        <p style={{
          fontFamily: FONT_SANS, fontSize: isMobile ? 18 : 24, fontWeight: 500,
          color: C.textPrimary, letterSpacing: "-0.02em",
          margin: "0 auto 16px", maxWidth: 700,
        }}>
          Your entire renewal workflow — powered by AI agents that work alongside you or run autonomously.
        </p>

        <p style={{
          fontFamily: FONT_BODY, fontSize: isMobile ? 15 : 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.7,
          maxWidth: 560, margin: "0 auto 36px",
        }}>
          BaseCommand gives you the AI reasoning engine, specialized agents, and a human escalation layer — everything you need to run renewals at AI speed with human judgment.
        </p>

        <p style={{
          fontFamily: FONT_BODY, fontSize: isMobile ? 13 : 14, color: C.textSecondary, lineHeight: 1.7,
          maxWidth: 620, margin: "0 auto 36px", padding: "12px 16px",
          background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid rgba(255,255,255,0.06)`,
        }}>
          <strong style={{ color: C.textPrimary }}>BaseCommand is an AI-powered renewal intelligence platform.</strong> Nine specialized agents monitor account health, draft outreach, forecast retention, and surface expansion signals — running your entire renewal workflow from co-pilot mode to supervised autopilot.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : undefined }}>
          <Link to="/signup?plan=monthly" style={{
            padding: "14px 32px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
            textDecoration: "none", boxShadow: `0 4px 20px ${C.goldGlow}`,
            transition: "all 0.15s", textAlign: "center", minHeight: 44,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            Start 14-Day Pro Trial
          </Link>
          <Link to="/why" style={{
            padding: "14px 32px", borderRadius: 10,
            background: "transparent", border: `1px solid ${C.borderSubtle}`,
            color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 500,
            textDecoration: "none", transition: "all 0.15s",
            display: "inline-flex", alignItems: "center", gap: 8,
            textAlign: "center", minHeight: 44, justifyContent: "center",
          }}>
            See why the playbook is broken <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ─── The Shift ──────────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "20px 20px 60px" : "20px 40px 80px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 24 : 32, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            The shift is already happening
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 15 : 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 520, margin: "0 auto 8px",
          }}>
            Traditional Renewals is reactive, siloed, and manual. AI-Driven RevOps is proactive, unified, and agentic. Which side are you on?
          </p>
        </div>

        {isMobile ? (
          /* Mobile: stacked cards per dimension */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { dimension: "Timing", old: "Reactive", oldSub: "30 days to renewal", new_: "Proactive", newSub: "Predictive signals 90–180 days out" },
              { dimension: "Data Scope", old: "Siloed", oldSub: "CRM notes, NPS surveys", new_: "Unified", newSub: "160 billion telemetry points" },
              { dimension: "Action Engine", old: "Manual", oldSub: "Spreadsheets, generic emails", new_: "Agentic", newSub: "Automated workflows, AI-drafted outreach" },
              { dimension: "Core Focus", old: "Firefighting", oldSub: "Saving the churn", new_: "Strategic Growth", newSub: "Surfacing the expansion" },
            ].map((row, i) => (
              <div key={i} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                borderRadius: 12, padding: "16px",
              }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.gold, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
                  {row.dimension}
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: C.bgPrimary }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textTertiary, opacity: 0.7, marginBottom: 2 }}>{row.old}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, opacity: 0.5, lineHeight: 1.4 }}>{row.oldSub}</div>
                  </div>
                  <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "rgba(34, 211, 238, 0.04)", border: "1px solid rgba(34, 211, 238, 0.10)" }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>{row.new_}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.aiBlue, lineHeight: 1.4 }}>{row.newSub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop: comparison table */
          <div style={{
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            borderRadius: 16, overflow: "hidden",
          }}>
            <div style={{
              display: "grid", gridTemplateColumns: "140px 1fr 1fr",
              borderBottom: `1px solid ${C.borderDefault}`,
            }}>
              <div style={{ padding: "16px 24px" }} />
              <div style={{
                padding: "16px 24px", fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700,
                color: C.textTertiary, borderLeft: `1px solid ${C.borderDefault}`,
              }}>
                Traditional Renewals
              </div>
              <div style={{
                padding: "16px 24px", fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700,
                color: C.aiBlue, borderLeft: `1px solid ${C.borderDefault}`,
                background: "rgba(34, 211, 238, 0.04)",
              }}>
                AI-Driven RevOps
              </div>
            </div>
            {[
              { dimension: "Timing", old: "Reactive", oldSub: "30 days to renewal", new_: "Proactive", newSub: "Predictive signals 90–180 days out" },
              { dimension: "Data Scope", old: "Siloed", oldSub: "CRM notes, NPS surveys", new_: "Unified", newSub: "160 billion telemetry points" },
              { dimension: "Action Engine", old: "Manual", oldSub: "Spreadsheets, generic emails", new_: "Agentic", newSub: "Automated workflows, AI-drafted outreach" },
              { dimension: "Core Focus", old: "Firefighting", oldSub: "Saving the churn", new_: "Strategic Growth", newSub: "Surfacing the expansion" },
            ].map((row, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "140px 1fr 1fr",
                borderBottom: i < 3 ? `1px solid ${C.borderDefault}` : "none",
              }}>
                <div style={{
                  padding: "18px 24px", fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
                  color: C.gold, display: "flex", alignItems: "center",
                }}>
                  {row.dimension}
                </div>
                <div style={{ padding: "18px 24px", borderLeft: `1px solid ${C.borderDefault}` }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textTertiary, opacity: 0.7, marginBottom: 2 }}>{row.old}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, opacity: 0.5 }}>{row.oldSub}</div>
                </div>
                <div style={{
                  padding: "18px 24px", borderLeft: `1px solid ${C.borderDefault}`,
                  background: "rgba(34, 211, 238, 0.04)",
                }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>{row.new_}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.aiBlue }}>{row.newSub}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── The AI-Powered Renewal Workflow ──────────────────────────────── */}
      <section style={{ padding: isMobile ? "20px 20px 60px" : "20px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center",
            padding: isMobile ? "8px 16px" : "8px 20px", borderRadius: 20, marginBottom: 16,
            background: C.goldMuted, border: `1px solid ${C.gold}20`,
            fontSize: isMobile ? 11 : 14, fontWeight: 600, color: C.gold, fontFamily: FONT_MONO,
            letterSpacing: "0.03em", textTransform: "uppercase", maxWidth: "100%", textAlign: "center",
          }}>
            The AI-Powered Renewal Workflow
          </div>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 24 : 32, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Five continuous functions. One agentic system.
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 15 : 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 580, margin: "0 auto 8px",
          }}>
            A properly configured agentic system executes five continuous functions — replacing manual effort with AI speed while keeping humans focused on strategic conversations.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)", gap: isMobile ? 12 : 10 }}>
          {[
            { fn: "Monitor", desc: "Scans health signals 24/7 across unified systems.", icon: Activity, color: "#34D399" },
            { fn: "Predict", desc: "Scores churn risk 90–180 days before the renewal.", icon: Brain, color: "#6366F1" },
            { fn: "Generate", desc: "Drafts hyper-personalized, context-rich outreach.", icon: FileText, color: "#22D3EE" },
            { fn: "Identify", desc: "Flags expansion and upsell triggers automatically.", icon: Target, color: "#F59E0B" },
            { fn: "Orchestrate", desc: "Keeps humans focused solely on high-value, strategic conversations.", icon: Users, color: "#A78BFA" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                borderRadius: 14, padding: isMobile ? "20px 14px" : "28px 18px", textAlign: "center",
                position: "relative",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, margin: "0 auto 14px",
                  background: `${item.color}14`, border: `1px solid ${item.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color={item.color} />
                </div>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
                  color: item.color, letterSpacing: "0.06em", textTransform: "uppercase",
                  marginBottom: 8,
                }}>
                  {item.fn}
                </div>
                <div style={{
                  fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.6,
                }}>
                  {item.desc}
                </div>
                {i < 4 && (
                  <div style={{
                    position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)",
                    color: C.borderSubtle, fontSize: 16, zIndex: 1, opacity: 0.6,
                    display: isMobile ? "none" : "block",
                  }}>
                    ›
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link to="/how-it-works" style={{
            fontFamily: FONT_BODY, fontSize: 14, color: C.aiBlue,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
            minHeight: 44,
          }}>
            See the full architecture: Flywheel, NRR Waterfall, and more <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ─── Try Free on agent.ai ─────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "20px 20px 60px" : "20px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
          border: `1px solid ${C.borderAI}`, borderRadius: 20, padding: isMobile ? "32px 20px" : "48px 40px",
        }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 20, marginBottom: 16,
              background: "rgba(34, 211, 238, 0.10)", border: "1px solid rgba(34, 211, 238, 0.20)",
              fontSize: isMobile ? 12 : 14, fontWeight: 600, color: C.aiBlue, fontFamily: FONT_MONO,
              letterSpacing: "0.03em", textTransform: "uppercase",
            }}>
              <Sparkles size={12} />
              No signup required
            </div>
            <h2 style={{
              fontFamily: FONT_SANS, fontSize: isMobile ? 22 : 28, fontWeight: 700,
              color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 8px",
            }}>
              Try our agents free on agent.ai
            </h2>
            <p style={{
              fontFamily: FONT_BODY, fontSize: isMobile ? 14 : 16, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
              maxWidth: 480, margin: "0 auto",
            }}>
              Paste your data. Get instant results. No account needed. These standalone agents give you a taste of what the full platform does at scale.
            </p>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12,
            maxWidth: 720, margin: "0 auto",
          }}>
            {FREE_AGENTS.map((agent, i) => (
              <a key={i} href={agent.link} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px 20px", borderRadius: 12,
                background: C.bgPrimary, border: `1px solid ${C.borderDefault}`,
                textDecoration: "none", transition: "border-color 0.15s, box-shadow 0.15s",
                minHeight: 44,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.30)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(34, 211, 238, 0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.boxShadow = "none"; }}
              >
                <Bot size={20} color={C.aiBlue} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>{agent.name}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>{agent.desc}</div>
                </div>
                <ArrowRight size={14} color={C.textTertiary} style={{ marginLeft: "auto", flexShrink: 0 }} />
              </a>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link to="/agents" style={{
              fontFamily: FONT_BODY, fontSize: 13, color: C.aiBlue,
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
              minHeight: 44,
            }}>
              See all agents <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Early Adopter Pricing ────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "20px 20px 60px" : "20px 40px 80px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          background: C.bgCard, border: `1px solid ${C.borderDefault}`,
          borderRadius: 20, padding: isMobile ? "32px 20px" : "48px 40px", textAlign: "center",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center",
            padding: isMobile ? "8px 16px" : "8px 20px", borderRadius: 20, marginBottom: 20,
            background: C.goldMuted, border: `1px solid ${C.gold}20`,
            fontSize: isMobile ? 11 : 14, fontWeight: 600, color: C.gold, fontFamily: FONT_MONO,
            letterSpacing: "0.03em", textTransform: "uppercase", maxWidth: "100%", textAlign: "center",
          }}>
            Founding member pricing — first 100 customers
          </div>

          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 24 : 32, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            <span style={{ textDecoration: "line-through", opacity: 0.4 }}>$149</span>{" "}
            <span style={{
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>$49/mo</span>{" "}
            <span style={{ fontSize: 16, fontWeight: 400, color: C.textTertiary }}>locked for life</span>
          </h2>

          <p style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 14 : 16, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.7,
            maxWidth: 520, margin: "0 auto 28px",
          }}>
            Start with a 14-day Pro trial — full access, no credit card. Then choose free forever or lock in founding member pricing before it's gone.
          </p>

          <div style={{
            display: "flex", gap: isMobile ? 8 : 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 28,
            flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center",
          }}>
            {["14-day Pro trial — no credit card", "AI included — no API key needed", "Free forever tier after trial", "Upgrade anytime, cancel anytime"].map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary,
              }}>
                <CheckCircle2 size={14} color={C.green} />
                {item}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : undefined }}>
            <Link to="/signup" style={{
              padding: "14px 36px", borderRadius: 10,
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
              color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
              textDecoration: "none", boxShadow: `0 4px 20px ${C.goldGlow}`,
              textAlign: "center", minHeight: 44,
            }}>
              Start Free
            </Link>
            <Link to="/pricing" style={{
              padding: "14px 36px", borderRadius: 10,
              background: "transparent", border: `1px solid ${C.borderSubtle}`,
              color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 500,
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
              textAlign: "center", minHeight: 44, justifyContent: "center",
            }}>
              Compare plans <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

    </article>
  );
}
