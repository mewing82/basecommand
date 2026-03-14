import { Link } from "react-router-dom";
import { RefreshCw, Shield, TrendingUp, Sparkles, BarChart3, Zap } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";

const FEATURES = [
  {
    icon: RefreshCw,
    title: "Renewal Command Center",
    description: "See every renewal in your portfolio at a glance. AI surfaces risk signals, flags at-risk accounts, and recommends next actions.",
  },
  {
    icon: Shield,
    title: "Churn Prevention",
    description: "Identify at-risk accounts before it's too late. AI analyzes engagement patterns, support tickets, and usage trends to predict churn.",
  },
  {
    icon: TrendingUp,
    title: "Expansion Intelligence",
    description: "Spot upsell and cross-sell opportunities across your book of business. AI identifies accounts primed for growth.",
  },
  {
    icon: BarChart3,
    title: "Portfolio Analytics",
    description: "Track GRR, NRR, and renewal rates in real time. Get AI-powered forecasts and health scores for every account.",
  },
  {
    icon: Zap,
    title: "Automated Workflows",
    description: "Auto-generate renewal playbooks, stakeholder briefs, and risk assessments. Spend less time on admin, more on relationships.",
  },
  {
    icon: Sparkles,
    title: "AI Co-pilot",
    description: "Built on Claude and GPT-4. Every view has an AI partner that understands your full portfolio context.",
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
          AI-powered renewal operations platform
        </div>

        <h1 style={{
          fontFamily: FONT_SANS, fontSize: 56, fontWeight: 700,
          color: C.textPrimary, letterSpacing: "-0.04em", lineHeight: 1.1,
          margin: "0 auto 20px", maxWidth: 700,
        }}>
          Never lose a
          <br />
          <span style={{
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover}, ${C.aiBlue})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>renewal again</span>
        </h1>

        <p className="bc-hero-sub" style={{
          fontFamily: FONT_BODY, fontSize: 18, color: C.textTertiary, lineHeight: 1.7,
          maxWidth: 520, margin: "0 auto 40px",
        }}>
          Base Command gives renewal teams AI-powered visibility across their entire portfolio. Predict churn, drive expansion, and hit your retention targets.
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
          <Link to="/login" style={{
            padding: "14px 32px", borderRadius: 10,
            border: `1px solid ${C.borderDefault}`,
            background: "transparent", color: C.textSecondary,
            fontFamily: FONT_SANS, fontSize: 15, fontWeight: 500,
            textDecoration: "none", transition: "all 0.15s",
          }}>
            Sign in
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
            Everything you need to protect and grow revenue
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: C.textTertiary, lineHeight: 1.6 }}>
            Six integrated modules. One AI-powered renewal operations platform.
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
            Ready to protect your revenue?
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 15, color: C.textTertiary, marginBottom: 28, lineHeight: 1.6,
          }}>
            Free to start. Bring your own AI keys. No credit card required.
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
