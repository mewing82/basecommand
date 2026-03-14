import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with your own AI keys",
    features: [
      "Full renewal operations platform",
      "AI co-pilot powered by your own API keys",
      "Email connector (Gmail & Outlook)",
      "Portfolio analytics & health scores",
      "Local data storage",
    ],
    cta: "Get Started",
    ctaLink: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Cloud sync and premium AI — coming soon",
    features: [
      "Everything in Free",
      "Cloud data persistence across devices",
      "Included AI credits (no keys needed)",
      "Team workspaces & sharing",
      "Priority support",
      "Advanced analytics",
    ],
    cta: "Join Waitlist",
    ctaLink: "/signup",
    highlight: true,
    badge: "Coming Soon",
  },
];

export default function Pricing() {
  return (
    <div className="bc-pricing-section" style={{ padding: "80px 40px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <h1 className="bc-pricing-heading" style={{
          fontFamily: FONT_SANS, fontSize: 40, fontWeight: 700,
          color: C.textPrimary, letterSpacing: "-0.04em", margin: "0 0 14px",
        }}>
          Simple, transparent pricing
        </h1>
        <p style={{
          fontFamily: FONT_BODY, fontSize: 17, color: C.textTertiary, lineHeight: 1.6,
        }}>
          Start free with your own AI keys. Upgrade when you need cloud sync and team features.
        </p>
      </div>

      <div className="bc-pricing-grid" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
        maxWidth: 760, margin: "0 auto",
      }}>
        {TIERS.map((tier) => (
          <div key={tier.name} style={{
            background: C.bgCard,
            border: `1px solid ${tier.highlight ? C.gold + "40" : C.borderDefault}`,
            borderRadius: 16, padding: "32px 28px", position: "relative",
            boxShadow: tier.highlight ? `0 0 40px ${C.goldGlow}` : "none",
          }}>
            {tier.badge && (
              <div style={{
                position: "absolute", top: 16, right: 16,
                padding: "4px 10px", borderRadius: 6,
                background: C.goldMuted, color: C.gold,
                fontSize: 11, fontWeight: 600, fontFamily: FONT_MONO,
              }}>
                {tier.badge}
              </div>
            )}

            <div style={{
              fontFamily: FONT_SANS, fontSize: 18, fontWeight: 600,
              color: C.textPrimary, marginBottom: 4, letterSpacing: "-0.01em",
            }}>
              {tier.name}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 40, fontWeight: 700,
                color: C.textPrimary, letterSpacing: "-0.02em",
              }}>
                {tier.price}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>
                {tier.period}
              </span>
            </div>

            <div style={{
              fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary,
              marginBottom: 24, lineHeight: 1.5,
            }}>
              {tier.description}
            </div>

            <Link to={tier.ctaLink} style={{
              display: "block", textAlign: "center",
              padding: "12px 0", borderRadius: 10, textDecoration: "none",
              background: tier.highlight
                ? `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`
                : "transparent",
              border: tier.highlight ? "none" : `1px solid ${C.borderDefault}`,
              color: tier.highlight ? C.bgPrimary : C.textSecondary,
              fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
              transition: "all 0.15s",
              boxShadow: tier.highlight ? `0 4px 16px ${C.goldGlow}` : "none",
            }}>
              {tier.cta}
            </Link>

            <div style={{
              marginTop: 24, paddingTop: 24,
              borderTop: `1px solid ${C.borderDefault}`,
            }}>
              {tier.features.map((feature, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, marginBottom: 12,
                  fontSize: 14, fontFamily: FONT_BODY, color: C.textSecondary,
                }}>
                  <Check size={16} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
