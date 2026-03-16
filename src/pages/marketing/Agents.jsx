import { Link } from "react-router-dom";
import { Upload, Bot, Crown, ArrowRight, Sparkles } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";

const AGENTS = [
  {
    icon: Upload,
    title: "CRM Data Parser",
    description: "Paste messy CRM data — Salesforce exports, spreadsheets, call notes, even rough text — and get clean, structured renewal accounts back instantly.",
    standalone: "Clean and structure any CRM data for free. No sign-up required.",
    cta: "Try CRM Data Parser",
    link: "#", // TODO: Replace with agent.ai link
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.20)",
  },
  {
    icon: Bot,
    title: "Renewal Autopilot",
    description: "Give it account details and context, and get a ready-to-use renewal action plan — draft emails, risk assessments, next steps, and expansion signals.",
    standalone: "Get an AI-generated renewal action plan for any account. Free to use.",
    cta: "Try Renewal Autopilot",
    link: "#", // TODO: Replace with agent.ai link
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.12)",
    border: "rgba(52, 211, 153, 0.20)",
  },
  {
    icon: Crown,
    title: "Exec Brief Generator",
    description: "Paste your portfolio data and get a board-ready executive brief — forecast by confidence tier, health signals, strategic recommendations, and talking points.",
    standalone: "Generate a leadership-ready renewal brief from raw data. No account needed.",
    cta: "Try Exec Brief Generator",
    link: "#", // TODO: Replace with agent.ai link
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.20)",
  },
];

export default function Agents() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        padding: "100px 40px 60px", maxWidth: 1200, margin: "0 auto", textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 20, marginBottom: 24,
          background: C.goldMuted, border: `1px solid ${C.gold}20`,
          fontSize: 13, fontWeight: 500, color: C.gold, fontFamily: FONT_SANS,
        }}>
          <Sparkles size={14} />
          Powered by BaseCommand AI
        </div>

        <h1 className="bc-hero-title" style={{
          fontFamily: FONT_SANS, fontSize: 48, fontWeight: 700,
          color: C.textPrimary, letterSpacing: "-0.04em", lineHeight: 1.1,
          margin: "0 auto 16px", maxWidth: 700,
        }}>
          Free AI Agents for{" "}
          <span style={{
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover}, ${C.aiBlue})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Renewal Teams</span>
        </h1>

        <p style={{
          fontFamily: FONT_BODY, fontSize: 18, color: C.textTertiary, lineHeight: 1.7,
          maxWidth: 560, margin: "0 auto 20px",
        }}>
          Try BaseCommand's AI capabilities without signing up. Each agent runs standalone on agent.ai — paste your data, get instant results.
        </p>
      </section>

      {/* Agent Cards */}
      <section className="bc-features-section" style={{ padding: "0 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {AGENTS.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <div key={i} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                borderRadius: 16, padding: "36px 40px",
                display: "flex", gap: 32, alignItems: "flex-start",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = agent.border; e.currentTarget.style.boxShadow = `0 8px 32px ${agent.bg}`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                  background: agent.bg, border: `1px solid ${agent.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={26} color={agent.color} strokeWidth={1.75} />
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontFamily: FONT_SANS, fontSize: 22, fontWeight: 700,
                    color: C.textPrimary, margin: "0 0 8px", letterSpacing: "-0.02em",
                  }}>
                    {agent.title}
                  </h3>
                  <p style={{
                    fontFamily: FONT_BODY, fontSize: 15, color: C.textSecondary,
                    lineHeight: 1.7, margin: "0 0 16px",
                  }}>
                    {agent.description}
                  </p>
                  <div style={{
                    fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary,
                    padding: "10px 14px", background: C.bgPrimary,
                    borderRadius: 8, border: `1px solid ${C.borderDefault}`,
                    marginBottom: 20, lineHeight: 1.5,
                  }}>
                    {agent.standalone}
                  </div>
                  <a
                    href={agent.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "12px 24px", borderRadius: 10,
                      background: agent.bg, border: `1px solid ${agent.border}`,
                      color: agent.color, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
                      textDecoration: "none", transition: "all 0.15s",
                    }}
                  >
                    {agent.cta} <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "40px 40px 80px", maxWidth: 800, margin: "0 auto", textAlign: "center",
      }}>
        <div className="bc-cta-box" style={{
          background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
          border: `1px solid ${C.borderAI}`, borderRadius: 16, padding: "48px 40px",
        }}>
          <h2 className="bc-cta-heading" style={{
            fontFamily: FONT_SANS, fontSize: 28, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Want the full platform?
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 15, color: C.textTertiary, marginBottom: 28, lineHeight: 1.6,
          }}>
            These agents are a taste of what BaseCommand does. Sign up for the full renewal intelligence platform — autopilot actions across your entire portfolio, executive briefs, and more.
          </p>
          <Link to="/signup" style={{
            display: "inline-block", padding: "14px 36px", borderRadius: 10,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
            textDecoration: "none", boxShadow: `0 4px 20px ${C.goldGlow}`,
          }}>
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
