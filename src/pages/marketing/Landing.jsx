import { Link } from "react-router-dom";
import {
  ArrowRight, Brain, Target, FileText, Users,
  Activity, ChevronRight, Bot, CheckCircle2,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { usePageMeta, PAGE_SEO } from "../../lib/seo";

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
          maxWidth: 560, margin: "0 auto 28px",
        }}>
          Health scoring, outreach drafts, expansion signals, board-ready forecasts — from co-pilot to supervised autopilot.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : undefined, marginBottom: 32 }}>
          <Link to="/signup?plan=monthly" style={{
            padding: "14px 32px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            color: C.textOnPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
            textDecoration: "none", boxShadow: `0 4px 20px ${C.goldGlow}`,
            transition: "all 0.15s", textAlign: "center", minHeight: 44,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            Start 14-Day Pro Trial
          </Link>
          <Link to="/agents" style={{
            padding: "14px 32px", borderRadius: 10,
            background: "transparent", border: `1px solid ${C.borderSubtle}`,
            color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 500,
            textDecoration: "none", transition: "all 0.15s",
            display: "inline-flex", alignItems: "center", gap: 8,
            textAlign: "center", minHeight: 44, justifyContent: "center",
          }}>
            Try free on agent.ai <ChevronRight size={14} />
          </Link>
        </div>

        {/* SEO detail — below the fold */}
        <p style={{
          fontFamily: FONT_BODY, fontSize: isMobile ? 13 : 14, color: C.textSecondary, lineHeight: 1.7,
          maxWidth: 620, margin: "0 auto", padding: "12px 16px",
          background: "rgba(0,0,0,0.02)", borderRadius: 8, border: `1px solid rgba(0,0,0,0.04)`,
        }}>
          <strong style={{ color: C.textPrimary }}>BaseCommand is an AI-powered renewal intelligence platform.</strong> Nine specialized agents monitor account health, draft outreach, forecast retention, and surface expansion signals — running your entire renewal workflow from co-pilot mode to supervised autopilot.
        </p>
      </section>

      {/* ─── The Shift — compact stats ─────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "20px 20px 60px" : "20px 40px 80px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 24 : 32, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            The shift is already happening
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 15 : 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 520, margin: "0 auto",
          }}>
            Traditional renewal playbooks are breaking down. AI-powered renewal operations are replacing them.
          </p>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12,
        }}>
          {[
            { stat: "90 days", label: "Earlier risk detection", sub: "vs 30-day reactive scrambles" },
            { stat: "71%", label: "Churn prevented", sub: "with AI-powered interventions" },
            { stat: "9 agents", label: "Running your workflow", sub: "from health scoring to board reports" },
          ].map((item, i) => (
            <div key={i} style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 14, padding: isMobile ? "20px 16px" : "28px 24px", textAlign: "center",
            }}>
              <div style={{
                fontFamily: FONT_SANS, fontSize: isMobile ? 28 : 36, fontWeight: 700,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                marginBottom: 4,
              }}>
                {item.stat}
              </div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>
                {item.sub}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/why" style={{
            fontFamily: FONT_BODY, fontSize: 14, color: C.gold,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
            minHeight: 44,
          }}>
            See the full breakdown <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ─── The AI-Powered Renewal Workflow ──────────────────────────────── */}
      <section style={{ padding: isMobile ? "20px 20px 60px" : "20px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center",
            padding: isMobile ? "8px 16px" : "8px 20px", borderRadius: 20, marginBottom: 16,
            background: C.goldMuted, border: `1px solid ${C.gold}20`,
            fontSize: isMobile ? 11 : 14, fontWeight: 600, color: C.gold, fontFamily: FONT_SANS,
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
            { fn: "Monitor", desc: "Scans health signals 24/7 across unified systems.", icon: Activity, color: "#16A368" },
            { fn: "Predict", desc: "Scores churn risk 90–180 days before the renewal.", icon: Brain, color: "#C07D10" },
            { fn: "Generate", desc: "Drafts hyper-personalized, context-rich outreach.", icon: FileText, color: "#069572" },
            { fn: "Identify", desc: "Flags expansion and upsell triggers automatically.", icon: Target, color: "#F59E0B" },
            { fn: "Orchestrate", desc: "Keeps humans focused solely on high-value, strategic conversations.", icon: Users, color: "#8B5CF6" },
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
                  fontFamily: FONT_SANS, fontSize: 10, fontWeight: 600,
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

      {/* ─── Try Free on agent.ai — compact callout ──────────────────────── */}
      <section style={{ padding: isMobile ? "20px 20px 60px" : "20px 40px 80px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
          border: `1px solid ${C.borderAI}`, borderRadius: 16,
          padding: isMobile ? "24px 20px" : "28px 36px",
          display: "flex", alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 16 : 24, flexDirection: isMobile ? "column" : "row",
        }}>
          <Bot size={28} color={C.aiBlue} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>
              Not ready to sign up? Try free on agent.ai
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.5 }}>
              4 standalone AI agents — paste your data, get instant results. No account needed.
            </div>
          </div>
          <Link to="/agents" style={{
            padding: "10px 24px", borderRadius: 10, whiteSpace: "nowrap",
            background: "rgba(6, 149, 114, 0.08)", border: `1px solid rgba(6, 149, 114, 0.20)`,
            color: C.aiBlue, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
            minHeight: 44, flexShrink: 0,
          }}>
            Try agents <ArrowRight size={14} />
          </Link>
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
            fontSize: isMobile ? 11 : 14, fontWeight: 600, color: C.gold, fontFamily: FONT_SANS,
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
              color: C.textOnPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
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
