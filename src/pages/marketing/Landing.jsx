import { Link } from "react-router-dom";
import { RefreshCw, Shield, TrendingUp, Sparkles, BarChart3, Zap } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";

const FEATURES = [
  {
    icon: RefreshCw,
    title: "See every renewal at a glance",
    description: "One AI-powered dashboard for your entire portfolio. Risk signals, next actions, and renewal timelines — no more hunting through spreadsheets.",
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.20)",
    glow: "rgba(59, 130, 246, 0.08)",
  },
  {
    icon: Shield,
    title: "Catch churn before it happens",
    description: "AI analyzes engagement patterns, support tickets, and usage trends to flag at-risk accounts weeks before renewal — so you can act, not react.",
    color: "#F87171",
    bg: "rgba(248, 113, 113, 0.12)",
    border: "rgba(248, 113, 113, 0.20)",
    glow: "rgba(248, 113, 113, 0.08)",
  },
  {
    icon: TrendingUp,
    title: "Never miss a renewal again",
    description: "AI tracks every renewal date, stakeholder change, and contract detail so nothing slips through the cracks — even across hundreds of accounts.",
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.12)",
    border: "rgba(52, 211, 153, 0.20)",
    glow: "rgba(52, 211, 153, 0.08)",
  },
  {
    icon: BarChart3,
    title: "Know your numbers in real time",
    description: "GRR, NRR, and renewal rates updated live. AI-powered forecasts and health scores give you confidence walking into any QBR.",
    color: "#A78BFA",
    bg: "rgba(167, 139, 250, 0.12)",
    border: "rgba(167, 139, 250, 0.20)",
    glow: "rgba(167, 139, 250, 0.08)",
  },
  {
    icon: Zap,
    title: "Automate the busywork",
    description: "AI generates renewal playbooks, stakeholder briefs, and risk assessments automatically. Spend your time on relationships, not admin.",
    color: "#FB923C",
    bg: "rgba(251, 146, 60, 0.12)",
    border: "rgba(251, 146, 60, 0.20)",
    glow: "rgba(251, 146, 60, 0.08)",
  },
  {
    icon: Sparkles,
    title: "An AI partner for every view",
    description: "Built on Claude and GPT-4. Every screen has an AI co-pilot that understands your full portfolio context and speaks your language.",
    color: "#22D3EE",
    bg: "rgba(34, 211, 238, 0.12)",
    border: "rgba(34, 211, 238, 0.20)",
    glow: "rgba(34, 211, 238, 0.08)",
  },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="bc-hero" style={{
        padding: "100px 40px 80px", maxWidth: 1200, margin: "0 auto", textAlign: "center",
      }}>
        <h1 className="bc-hero-title" style={{
          fontFamily: FONT_SANS, fontSize: 56, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.1,
          margin: "0 auto 16px", maxWidth: 800,
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover}, ${C.aiBlue})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          AI-Powered Renewal Intelligence
        </h1>

        <p style={{
          fontFamily: FONT_SANS, fontSize: 32, fontWeight: 600,
          color: C.textPrimary, letterSpacing: "-0.03em",
          margin: "0 auto 24px",
        }}>
          Your renewal portfolio, under control.
        </p>

        <p className="bc-hero-sub" style={{
          fontFamily: FONT_BODY, fontSize: 18, color: C.textTertiary, lineHeight: 1.7,
          maxWidth: 520, margin: "0 auto 40px",
        }}>
          Stop chasing renewals through spreadsheets and CRM tabs. One view for risk scores, renewal timelines, next actions, and automated playbooks across your entire book.
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
            Smarter renewals at every step
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: C.textTertiary, lineHeight: 1.6 }}>
            Six AI-powered modules that replace spreadsheets, guesswork, and manual tracking.
          </p>
        </div>

        <div className="bc-feature-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
        }}>
          {FEATURES.map((feature, i) => (
            <div key={i} style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 14, padding: "28px 24px",
              transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = feature.border; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${feature.glow}`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, marginBottom: 18,
                background: feature.bg, border: `1px solid ${feature.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 16px ${feature.glow}`,
              }}>
                <feature.icon size={22} color={feature.color} strokeWidth={1.75} />
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
