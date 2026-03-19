import { Link } from "react-router-dom";
import {
  ArrowRight, Bot, CheckCircle2, Calendar, Sparkles,
  ChevronRight, ExternalLink,
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

export default function GetStarted() {
  const { isMobile } = useMediaQuery();
  usePageMeta(PAGE_SEO.getStarted);
  return (
    <article>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        padding: isMobile ? "60px 20px 40px" : "100px 40px 60px", maxWidth: 900, margin: "0 auto", textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 20px", borderRadius: 20, marginBottom: 24,
          background: C.goldMuted, border: `1px solid ${C.gold}20`,
          fontSize: isMobile ? 12 : 14, fontWeight: 600, color: C.gold, fontFamily: FONT_MONO,
          letterSpacing: "0.03em", textTransform: "uppercase",
        }}>
          <Calendar size={12} />
          Implementation Blueprint
        </div>

        <h1 style={{
          fontFamily: FONT_SANS, fontSize: isMobile ? 32 : 48, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.15,
          color: C.textPrimary, margin: "0 0 20px",
        }}>
          Live in 4 Weeks.{" "}
          <span style={{
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Value from Day One.</span>
        </h1>

        <p style={{
          fontFamily: FONT_BODY, fontSize: isMobile ? 16 : 18, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.8,
          maxWidth: 560, margin: "0 auto",
        }}>
          You don't need a 6-month implementation. BaseCommand delivers value incrementally — each week activates a new layer of the architecture.
        </p>

        <p style={{
          fontFamily: FONT_BODY, fontSize: isMobile ? 13 : 14, color: C.textSecondary, lineHeight: 1.7,
          maxWidth: 620, margin: "20px auto 0", padding: "12px 16px",
          background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid rgba(255,255,255,0.06)`,
        }}>
          <strong style={{ color: C.textPrimary }}>Go from spreadsheets to AI-powered renewals in 4 weeks.</strong> Week 1: import and health scoring. Week 2: outreach and forecasting. Week 3: expansion intelligence. Week 4: full supervised autopilot. Free 14-day Pro trial, no credit card required.
        </p>
      </section>

      {/* ─── Implementation Blueprint ─────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "32px 20px 60px" : "40px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: isMobile ? 12 : 14 }}>
          {[
            {
              week: "Week 1", title: "Data Foundation", color: C.textTertiary,
              tasks: ["Import accounts via CSV or paste", "Connect Gmail / Outlook", "Inventory your health signals", "AI extracts company profile"],
              layer: "Telemetry Data",
            },
            {
              week: "Week 2", title: "Monitoring Setup", color: C.aiBlue,
              tasks: ["Deploy health-scoring agents", "Define early-warning thresholds", "Set up archetype classification", "Review initial health scores"],
              layer: "AI Reasoning Engine",
            },
            {
              week: "Week 3", title: "Outreach Automation", color: C.gold,
              tasks: ["Build templates for risk tiers", "Configure AI to draft with context", "Set up approval workflows", "Send first AI-assisted outreach"],
              layer: "Agents",
            },
            {
              week: "Week 4", title: "Expansion Detection", color: "#34D399",
              tasks: ["Define PQL triggers", "Configure automated routing", "Activate Expansion Scout", "Run first forecast with scenarios"],
              layer: "Full Stack Active",
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 14, padding: isMobile ? "18px 14px" : "24px 20px", position: "relative",
            }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                color: item.color, letterSpacing: "0.05em", textTransform: "uppercase",
                marginBottom: 6,
              }}>
                {item.week}
              </div>
              <div style={{
                fontFamily: FONT_SANS, fontSize: 16, fontWeight: 700,
                color: C.textPrimary, marginBottom: 14, letterSpacing: "-0.01em",
              }}>
                {item.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {item.tasks.map((task, j) => (
                  <div key={j} style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.5,
                  }}>
                    <CheckCircle2 size={12} color={`${item.color}80`} style={{ flexShrink: 0, marginTop: 2 }} />
                    {task}
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: item.color, opacity: 0.7 }}>
                Activates: {item.layer}
              </div>
              {i < 3 && (
                <div style={{
                  position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 18, color: C.textTertiary, opacity: 0.3, zIndex: 1,
                  display: isMobile ? "none" : "block",
                }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── ROI Calculator ───────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "0 20px 60px" : "0 40px 80px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          background: `linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(99, 102, 241, 0.08))`,
          border: `1px solid rgba(52, 211, 153, 0.15)`,
          borderRadius: 20, padding: isMobile ? "32px 20px" : "48px 40px", textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 22 : 28, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            What does this mean for your portfolio?
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 14 : 16, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 480, margin: "0 auto 28px",
          }}>
            A small retention improvement compounds into serious revenue. Here's the math on three portfolio sizes.
          </p>

          <div style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 12 : 20,
            maxWidth: 700, margin: "0 auto 24px",
          }}>
            {[
              { portfolio: "$2.4M ARR", improvement: "3% GRR improvement", result: "$72K retained", color: C.green },
              { portfolio: "$5M ARR", improvement: "3% GRR improvement", result: "$150K retained", color: C.gold },
              { portfolio: "$10M ARR", improvement: "3% GRR improvement", result: "$300K retained", color: C.aiBlue },
            ].map((ex, i) => (
              <div key={i} style={{
                background: C.bgCard, borderRadius: 12, padding: "20px 16px",
                border: `1px solid ${C.borderDefault}`,
              }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.textTertiary, marginBottom: 4 }}>{ex.portfolio}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 8 }}>{ex.improvement}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: ex.color }}>{ex.result}</div>
              </div>
            ))}
          </div>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 14, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 460, margin: "0 auto",
          }}>
            A 3% GRR improvement on a $2.4M portfolio retains $72K — that's more than 10x the cost of BaseCommand Pro.
          </p>
        </div>
      </section>

      {/* ─── Try Free on agent.ai ─────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "0 20px 60px" : "0 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
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
              Paste your data. Get instant results. No account needed. See the AI quality before committing.
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
                textDecoration: "none", transition: "border-color 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.30)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.borderDefault}
              >
                <Bot size={20} color={C.aiBlue} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>{agent.name}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>{agent.desc}</div>
                </div>
                <ExternalLink size={14} color={C.textTertiary} style={{ marginLeft: "auto", flexShrink: 0 }} />
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

      {/* ─── Pricing CTA ──────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "0 20px 60px" : "0 40px 80px", maxWidth: 900, margin: "0 auto" }}>
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
            fontFamily: FONT_BODY, fontSize: isMobile ? 14 : 15, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.7,
            maxWidth: 520, margin: "0 auto 28px",
          }}>
            Start with a 14-day Pro trial — full access, no credit card. Then choose free forever or lock in founding member pricing before it's gone.
          </p>

          <div style={{
            display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 8 : 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 28,
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

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, justifyContent: "center" }}>
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
              textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              textAlign: "center", minHeight: 44,
            }}>
              Compare plans <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
