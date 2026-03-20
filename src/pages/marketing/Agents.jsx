import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Bot, ExternalLink,
  Activity, Shield, FileText,
  TrendingUp, BarChart3, Target,
  Crown, Users, ClipboardList,
  ChevronRight,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { usePageMeta, PAGE_SEO } from "../../lib/seo";

// ─── Agent.ai Free Agents (live now) ─────────────────────────────────────────

const LIVE_AGENTS = [
  {
    name: "CRM Data Parser",
    description: "Paste messy CRM data — Salesforce exports, spreadsheets, call notes — and get clean, structured renewal accounts back instantly.",
    tryIt: "Paste any CRM data. Get clean accounts in seconds.",
    link: "https://agent.ai/agent/basecommand-crm-parser",
    icon: BarChart3,
    color: "#3B82F6",
  },
  {
    name: "Renewal Autopilot",
    description: "Describe an account and its context. Get a complete renewal action plan — draft emails, risk assessment, expansion signals, and prioritized next steps.",
    tryIt: "Describe any account. Get a ready-to-use action plan.",
    link: "https://agent.ai/agent/basecommand-autopilot",
    icon: Shield,
    color: "#34D399",
  },
  {
    name: "Exec Brief Generator",
    description: "Paste portfolio data and get a board-ready executive brief — forecast by confidence tier, health signals, strategic recommendations, and talking points for leadership.",
    tryIt: "Paste portfolio data. Get a board-ready brief.",
    link: "https://agent.ai/agent/basecommand-exec-brief",
    icon: Crown,
    color: "#F59E0B",
  },
  {
    name: "Forecast Intelligence",
    description: "Paste your renewal portfolio and get a full forecast — GRR/NRR metrics, confidence tiers, period breakdown, scenario analysis, and prioritized actions to improve your number.",
    tryIt: "Paste renewal data. Get a full GRR/NRR forecast.",
    link: "https://agent.ai/agent/basecommand-forecast",
    icon: TrendingUp,
    color: "#A78BFA",
  },
];

// ─── Full Platform Agent Categories ──────────────────────────────────────────

const PLATFORM_CATEGORIES = [
  {
    title: "Renewal Agents",
    tagline: "Protect revenue",
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.10)",
    border: "rgba(52, 211, 153, 0.20)",
    agents: [
      { name: "Portfolio Health Monitor", icon: Activity, desc: "Continuous health scoring, risk signal detection, champion tracking. The connective tissue across all agents.", outputs: "Composite health score (0-10), severity flags, archetype classification" },
      { name: "At-Risk Rescue Planner", icon: Shield, desc: "At-risk intervention strategies with archetype-aware playbooks. Know what to do before you need to.", outputs: "Rescue playbook per account, intervention timeline, recommended actions" },
      { name: "Renewal Outreach Drafter", icon: FileText, desc: "Personalized renewal emails that reference past wins, health context, and relationship history. Not mail-merge.", outputs: "Context-rich draft emails, follow-up sequences, personalized messaging" },
    ],
  },
  {
    title: "Growth Agents",
    tagline: "Find expansion",
    color: "#6366F1",
    bg: "rgba(99, 102, 241, 0.10)",
    border: "rgba(99, 102, 241, 0.20)",
    agents: [
      { name: "Expansion Signal Scout", icon: Target, desc: "PQL detection, upsell triggers, budget signals, and expansion opportunities surfaced automatically.", outputs: "Expansion opportunity cards, trigger alerts, upsell recommendations" },
      { name: "Revenue Forecast Engine", icon: TrendingUp, desc: "GRR/NRR modeling with confidence tiers, scenario analysis, and benchmark comparisons.", outputs: "Board-ready forecast, confidence tiers, best-in-class comparison" },
      { name: "Upsell Opportunity Brief", icon: BarChart3, desc: "Pre-call expansion briefs with competitive positioning and pricing scenarios.", outputs: "Expansion talking points, pricing recommendations, competitive intel" },
    ],
  },
  {
    title: "Coaching Agents",
    tagline: "Prepare leaders",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.10)",
    border: "rgba(245, 158, 11, 0.20)",
    agents: [
      { name: "Executive Strategy Brief", icon: Crown, desc: "Board-ready summaries, leadership intel, and strategic recommendations in minutes, not hours.", outputs: "Exec summary, portfolio health overview, CRO/CEO talking points" },
      { name: "Renewal Meeting Prep", icon: Users, desc: "Pre-call briefs with relationship context, attendee profiles, and conversation guides.", outputs: "Account brief, attendee profiles, risk/opportunity callouts" },
      { name: "Renewal Playbook Builder", icon: ClipboardList, desc: "90/60/30 day action plans with milestone checklists and task generation.", outputs: "Time-sequenced action plan, task generation, reminder cadence" },
    ],
  },
];

export default function Agents() {
  const { isMobile } = useMediaQuery();
  usePageMeta(PAGE_SEO.agents);

  return (
    <article>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        padding: isMobile ? "60px 20px 40px" : "100px 40px 60px", maxWidth: 1200, margin: "0 auto", textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 20px", borderRadius: 20, marginBottom: 24,
          background: "rgba(34, 211, 238, 0.10)", border: "1px solid rgba(34, 211, 238, 0.20)",
          fontSize: isMobile ? 12 : 14, fontWeight: 500, color: C.aiBlue, fontFamily: FONT_SANS,
          flexWrap: "wrap", maxWidth: "100%",
        }}>
          <Bot size={14} />
          Powered by BaseCommand AI
        </div>

        <h1 style={{
          fontFamily: FONT_SANS, fontSize: isMobile ? 32 : 48, fontWeight: 700,
          color: C.textPrimary, letterSpacing: "-0.04em", lineHeight: 1.1,
          margin: "0 auto 16px", maxWidth: 750,
        }}>
          Try Our AI Agents{" "}
          <span style={{
            background: `linear-gradient(135deg, ${C.aiBlue}, #34D399)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Free on agent.ai</span>
        </h1>

        <p style={{
          fontFamily: FONT_BODY, fontSize: isMobile ? 16 : 18, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.7,
          maxWidth: 580, margin: "0 auto 12px",
        }}>
          No signup. No API key. Just paste your data and get instant results. These standalone agents are a taste of what BaseCommand does continuously across your entire portfolio.
        </p>

        <p style={{
          fontFamily: FONT_BODY, fontSize: isMobile ? 13 : 14, color: C.textSecondary, lineHeight: 1.7,
          maxWidth: 620, margin: "0 auto", padding: "12px 16px",
          background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid rgba(255,255,255,0.06)`,
        }}>
          <strong style={{ color: C.textPrimary }}>Free AI agents on agent.ai:</strong> CRM Data Parser cleans messy data into structured accounts. Renewal Autopilot generates action plans with draft emails. Exec Brief Generator creates board-ready summaries. Forecast Intelligence produces GRR/NRR forecasts with confidence tiers.
        </p>
      </section>

      {/* ─── Live Free Agents ─────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "0 20px 48px" : "0 40px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: C.green, boxShadow: `0 0 8px ${C.green}80`,
          }} />
          <span style={{
            fontFamily: FONT_MONO, fontSize: isMobile ? 12 : 14, fontWeight: 600,
            color: C.green, letterSpacing: "0.05em", textTransform: "uppercase",
            padding: isMobile ? "8px 0" : "8px 20px",
          }}>
            Live on agent.ai — try now
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
          {LIVE_AGENTS.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <div key={i} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                borderRadius: 16, padding: isMobile ? "20px 16px" : "28px 28px",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${agent.color}40`; e.currentTarget.style.boxShadow = `0 8px 32px ${agent.color}10`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${agent.color}18`, border: `1px solid ${agent.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={20} color={agent.color} />
                  </div>
                  <h3 style={{
                    fontFamily: FONT_SANS, fontSize: isMobile ? 16 : 18, fontWeight: 700,
                    color: C.textPrimary, margin: 0, letterSpacing: "-0.02em",
                  }}>
                    {agent.name}
                  </h3>
                </div>

                <p style={{
                  fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary,
                  lineHeight: 1.7, margin: "0 0 14px",
                }}>
                  {agent.description}
                </p>

                <div style={{
                  fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary,
                  padding: "8px 12px", background: C.bgPrimary,
                  borderRadius: 8, border: `1px solid ${C.borderDefault}`,
                  marginBottom: 16,
                }}>
                  {agent.tryIt}
                </div>

                <a
                  href={agent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", borderRadius: 10, minHeight: 44,
                    background: `${agent.color}18`, border: `1px solid ${agent.color}30`,
                    color: agent.color, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600,
                    textDecoration: "none", transition: "all 0.15s",
                  }}
                >
                  Try on agent.ai <ExternalLink size={13} />
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Conversion Bridge ────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "16px 20px 48px" : "20px 40px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.bgAI}, ${C.bgCard})`,
          border: `1px solid ${C.borderAI}`, borderRadius: 16,
          padding: isMobile ? "24px 20px" : "36px 40px",
          display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 20 : 32,
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontFamily: FONT_SANS, fontSize: isMobile ? 16 : 20, fontWeight: 700,
              color: C.textPrimary, letterSpacing: "-0.02em", margin: "0 0 8px",
            }}>
              Like what you see? The full platform runs these continuously.
            </h3>
            <p style={{
              fontFamily: FONT_BODY, fontSize: 14, color: C.textPrimary, fontWeight: 400, opacity: 0.75,
              lineHeight: 1.6, margin: 0,
            }}>
              The agents above give you a snapshot. BaseCommand runs a growing fleet of specialized agents across your entire renewal workflow 24/7 — from data import to renewal execution, with you in control at every step.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, flexShrink: isMobile ? "unset" : 0, width: isMobile ? "100%" : "auto" }}>
            <Link to="/signup" style={{
              padding: "12px 24px", borderRadius: 10, minHeight: 44,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
              color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
              textDecoration: "none", whiteSpace: "nowrap", textAlign: "center",
            }}>
              Start Free
            </Link>
            <Link to="/why" style={{
              padding: "12px 24px", borderRadius: 10, minHeight: 44,
              background: "transparent", border: `1px solid ${C.borderSubtle}`,
              color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500,
              textDecoration: "none", whiteSpace: "nowrap", textAlign: "center",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              Learn why <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Full Platform Agents ─────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "32px 20px 60px" : "40px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 24 : 32, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            The Full Agent Fleet
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 15 : 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 540, margin: "0 auto",
          }}>
            A growing library of specialized agents organized into 3 mission categories — all sharing intelligence through a unified scoring engine.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {PLATFORM_CATEGORIES.map((cat, i) => (
            <div key={i}>
              {/* Category header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap",
              }}>
                <div style={{
                  width: 4, height: 24, borderRadius: 2,
                  background: cat.color,
                }} />
                <span style={{
                  fontFamily: FONT_SANS, fontSize: isMobile ? 17 : 20, fontWeight: 700,
                  color: cat.color, letterSpacing: "-0.02em",
                }}>
                  {cat.title}
                </span>
                <span style={{
                  fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary,
                }}>
                  — {cat.tagline}
                </span>
              </div>

              {/* Agent cards */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
                {cat.agents.map((agent, j) => {
                  const Icon = agent.icon;
                  return (
                    <div key={j} style={{
                      background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                      borderRadius: 14, padding: isMobile ? "20px 16px" : "24px 22px",
                      transition: "border-color 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = cat.border}
                      onMouseLeave={e => e.currentTarget.style.borderColor = C.borderDefault}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <Icon size={18} color={cat.color} />
                        <span style={{
                          fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
                          color: C.textPrimary,
                        }}>
                          {agent.name}
                        </span>
                      </div>
                      <p style={{
                        fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary,
                        lineHeight: 1.6, margin: "0 0 12px",
                      }}>
                        {agent.desc}
                      </p>
                      <div style={{
                        fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary,
                        padding: "8px 10px", background: C.bgPrimary,
                        borderRadius: 6, border: `1px solid ${C.borderDefault}`,
                        lineHeight: 1.5, opacity: 0.8, overflowWrap: "break-word",
                      }}>
                        Outputs: {agent.outputs}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA ───────────────────────────────────────────────────── */}
      <section style={{
        padding: isMobile ? "16px 20px 60px" : "20px 40px 80px", maxWidth: 800, margin: "0 auto", textAlign: "center",
      }}>
        <div style={{
          background: C.bgCard, border: `1px solid ${C.borderDefault}`,
          borderRadius: 20, padding: isMobile ? "32px 20px" : "48px 40px",
        }}>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 22 : 28, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Ready to put your renewals on autopilot?
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 14 : 15, color: C.textPrimary, fontWeight: 400, opacity: 0.75, marginBottom: 28, lineHeight: 1.6,
          }}>
            Free to start. AI included. Founding member pricing: $49/mo locked for life.
          </p>
          <Link to="/signup" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "14px 36px", borderRadius: 10, minHeight: 44,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
            textDecoration: "none", boxShadow: `0 4px 20px ${C.goldGlow}`,
          }}>
            Get Started Free
          </Link>
        </div>
      </section>
    </article>
  );
}
