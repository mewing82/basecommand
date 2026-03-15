import { Link } from "react-router-dom";
import { RefreshCw, Shield, TrendingUp, Sparkles, BarChart3, Zap } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";

const FEATURES = [
  {
    icon: RefreshCw,
    title: "See every renewal at a glance",
    description: "One AI-powered dashboard for your entire portfolio. Risk signals, next actions, and renewal timelines — no more hunting through spreadsheets.",
  },
  {
    icon: Shield,
    title: "Catch churn before it happens",
    description: "AI analyzes engagement patterns, support tickets, and usage trends to flag at-risk accounts weeks before renewal — so you can act, not react.",
  },
  {
    icon: TrendingUp,
    title: "Find expansion in your book",
    description: "Surface upsell and cross-sell opportunities automatically. AI identifies which accounts are primed for growth and why.",
  },
  {
    icon: BarChart3,
    title: "Know your numbers in real time",
    description: "GRR, NRR, and renewal rates updated live. AI-powered forecasts and health scores give you confidence walking into any QBR.",
  },
  {
    icon: Zap,
    title: "Automate the busywork",
    description: "AI generates renewal playbooks, stakeholder briefs, and risk assessments automatically. Spend your time on relationships, not admin.",
  },
  {
    icon: Sparkles,
    title: "An AI partner for every view",
    description: "Built on Claude and GPT-4. Every screen has an AI co-pilot that understands your full portfolio context and speaks your language.",
  },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="bc-hero" style={{
        padding: "100px 40px 80px", maxWidth: 1200, margin: "0 auto", textAlign: "center",
      }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20, marginBottom: 24,
          background: C.goldMuted, border: `1px solid ${C.gold}20`,
          fontSize: 13, fontWeight: 500, color: C.gold, fontFamily: FONT_SANS,
        }}>
          The AI command center for renewal revenue
        </div>

        <h1 style={{
          fontFamily: FONT_SANS, fontSize: 56, fontWeight: 700,
          color: C.textPrimary, letterSpacing: "-0.04em", lineHeight: 1.1,
          margin: "0 auto 20px", maxWidth: 700,
        }}>
          Protect revenue.
          <br />
          <span style={{
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover}, ${C.aiBlue})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Expand accounts.</span>
          <br />
          Hit your number.
        </h1>

        <p className="bc-hero-sub" style={{
          fontFamily: FONT_BODY, fontSize: 18, color: C.textTertiary, lineHeight: 1.7,
          maxWidth: 520, margin: "0 auto 40px",
        }}>
          Base Command replaces spreadsheet tracking and CRM guesswork with AI-powered portfolio intelligence — real-time churn risk scores, expansion signals, and automated renewal playbooks in one view.
        </p>

        <div className="bc-hero-buttons" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link to="/signup" style={{
            padding: "14px 32px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
            textDecoration: "none", boxShadow: `0 4px 20px ${C.goldGlow}`,
            transition: "all 0.15s",
          }}>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bc-features-section" style={{ padding: "40px 40px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 className="bc-features-heading" style={{
            fontFamily: FONT_SANS, fontSize: 32, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Everything you need to grow and protect renewal revenue
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: C.textTertiary, lineHeight: 1.6 }}>
            Six integrated modules that replace spreadsheets, guesswork, and gut feelings.
          </p>
        </div>

        <div className="bc-feature-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
        }}>
          {FEATURES.map((feature, i) => (
            <div key={i} style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 14, padding: "28px 24px",
              transition: "border-color 0.15s, transform 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: 16,
                background: C.goldMuted, border: `1px solid ${C.gold}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <feature.icon size={18} color={C.gold} />
              </div>
              <div style={{
                fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600,
                color: C.textPrimary, marginBottom: 8, letterSpacing: "-0.01em",
              }}>
                {feature.title}
              </div>
              <div style={{
                fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, lineHeight: 1.7,
              }}>
                {feature.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bc-cta-section" style={{
        padding: "60px 40px", maxWidth: 800, margin: "0 auto", textAlign: "center",
      }}>
        <div className="bc-cta-box" style={{
          background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
          border: `1px solid ${C.borderAI}`, borderRadius: 16, padding: "48px 40px",
        }}>
          <h2 className="bc-cta-heading" style={{
            fontFamily: FONT_SANS, fontSize: 28, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Ready to take command of your renewals?
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 15, color: C.textTertiary, marginBottom: 28, lineHeight: 1.6,
          }}>
            Free to start. Bring your own AI keys. No credit card required. Works alongside your CRM.
          </p>
          <Link to="/signup" style={{
            display: "inline-block", padding: "14px 36px", borderRadius: 10,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
            textDecoration: "none", boxShadow: `0 4px 20px ${C.goldGlow}`,
          }}>
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
