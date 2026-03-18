import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight, ChevronRight, Zap } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "After your 14-day Pro trial, keep using BaseCommand free — no credit card, no commitment.",
    features: [
      "10 accounts",
      "50 AI calls per month",
      "All agent categories (Renewal, Growth, Coaching)",
      "AI co-pilot mode",
      "Portfolio dashboard & health scores",
      "Data import (CSV, paste, manual)",
    ],
    cta: "Start Free",
    ctaLink: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "Founding member pricing — locked in for life. Normally $149/mo.",
    features: [
      "Everything in Free, plus:",
      "Unlimited accounts",
      "Unlimited AI calls (powered by Claude)",
      "Supervised autopilot workflows",
      "Email connectors (Gmail & Outlook)",
      "Cloud sync across devices",
      "Priority support",
      "Early access to new agents",
    ],
    cta: "Start 14-Day Pro Trial",
    ctaLink: "/signup?plan=monthly",
    highlight: true,
    badge: "Founding Member",
    annualNote: "Or $39/mo billed annually ($468/yr)",
  },
];

export default function Pricing() {
  const { isMobile } = useMediaQuery();

  return (
    <div style={{ padding: isMobile ? "60px 20px" : "80px 40px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <h1 style={{
          fontFamily: FONT_SANS, fontSize: isMobile ? 28 : 40, fontWeight: 700,
          color: C.textPrimary, letterSpacing: "-0.04em", margin: "0 0 14px",
        }}>
          Start free. Upgrade when you're ready.
        </h1>
        <p style={{
          fontFamily: FONT_BODY, fontSize: isMobile ? 15 : 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
          maxWidth: 560, margin: "0 auto",
        }}>
          Every signup starts with 14 days of full Pro access — no credit card required. After that, keep the free tier forever or lock in founding member pricing.
        </p>
      </div>

      {/* Trial callout */}
      <div style={{
        background: `linear-gradient(135deg, ${C.bgAI}, ${C.bgCard})`,
        border: `1px solid ${C.borderAI}`, borderRadius: 14,
        padding: isMobile ? "20px 16px" : "24px 32px",
        display: "flex", alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 12 : 16, textAlign: isMobile ? "center" : "left",
        maxWidth: 760, margin: isMobile ? "0 auto 24px" : "0 auto 32px",
      }}>
        <Zap size={24} color={C.aiBlue} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
            color: C.textPrimary, marginBottom: 2,
          }}>
            14-day Pro trial — every signup, automatically
          </div>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 14, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.5,
          }}>
            Experience unlimited accounts, unlimited AI, and the full agent fleet. No credit card. After 14 days, choose free forever or upgrade to Pro.
          </div>
        </div>
      </div>

      {/* Tier cards */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20,
        maxWidth: 760, margin: isMobile ? "0 auto 40px" : "0 auto 60px",
      }}>
        {TIERS.map((tier) => (
          <div key={tier.name} style={{
            background: C.bgCard,
            border: `1px solid ${tier.highlight ? C.gold + "40" : C.borderDefault}`,
            borderRadius: 16, padding: isMobile ? "24px 20px" : "32px 28px", position: "relative",
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

            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{
                fontFamily: FONT_MONO, fontSize: isMobile ? 32 : 40, fontWeight: 700,
                color: C.textPrimary, letterSpacing: "-0.02em",
              }}>
                {tier.price}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>
                {tier.period}
              </span>
              {tier.highlight && (
                <span style={{
                  fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary,
                  textDecoration: "line-through", marginLeft: 8, opacity: 0.6,
                }}>
                  $149/mo
                </span>
              )}
            </div>

            {tier.annualNote && (
              <div style={{
                fontFamily: FONT_MONO, fontSize: 11, color: C.gold,
                marginBottom: 8,
              }}>
                {tier.annualNote}
              </div>
            )}

            <div style={{
              fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary,
              marginBottom: 24, lineHeight: 1.5,
            }}>
              {tier.description}
            </div>

            <Link to={tier.ctaLink} style={{
              display: "block", textAlign: "center",
              padding: "12px 0", borderRadius: 10, textDecoration: "none", minHeight: 44,
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

      {/* FAQ / Details */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: FONT_SANS, fontSize: isMobile ? 20 : 24, fontWeight: 700,
          color: C.textPrimary, letterSpacing: "-0.02em",
          textAlign: "center", margin: "0 0 32px",
        }}>
          Common questions
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              q: "What happens after my 14-day Pro trial?",
              a: "You automatically move to the Free tier — 10 accounts, 50 AI calls/month. No credit card was ever required, so nothing gets charged. You can upgrade to Pro anytime to unlock unlimited access.",
            },
            {
              q: "What is founding member pricing?",
              a: "The first 100 Pro customers get $49/mo locked in for life (normally $149/mo). As we grow, new customers will pay the standard price — but founders keep their rate forever.",
            },
            {
              q: "Do I need my own AI API key?",
              a: "No. AI is included in both Free and Pro tiers — powered by Claude. If you prefer to use your own keys (for compliance or cost control), that's available as an advanced option in Settings.",
            },
            {
              q: "What does 'supervised autopilot' mean?",
              a: "In co-pilot mode, AI drafts and you execute. In supervised autopilot, AI executes actions (sends emails, updates accounts) based on rules you set — but you approve each batch before it runs. Full autonomous mode is on the roadmap.",
            },
            {
              q: "Can I try BaseCommand on agent.ai first?",
              a: "Yes! We have free standalone agents on agent.ai — no signup needed. Try CRM Data Parser, Renewal Autopilot, Exec Brief Generator, or Forecast Intelligence. They're a great way to see the AI quality before committing.",
            },
          ].map((faq, i) => (
            <div key={i} style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 12, padding: isMobile ? "16px 16px" : "20px 24px",
            }}>
              <div style={{
                fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
                color: C.textPrimary, marginBottom: 8,
              }}>
                {faq.q}
              </div>
              <div style={{
                fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary,
                lineHeight: 1.7,
              }}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>

        {/* agent.ai callout */}
        <div style={{
          textAlign: "center", marginTop: 40,
          padding: isMobile ? "24px 20px" : "32px", borderRadius: 14,
          background: `linear-gradient(135deg, ${C.bgAI}, ${C.bgCard})`,
          border: `1px solid ${C.borderAI}`,
        }}>
          <Sparkles size={20} color={C.aiBlue} style={{ marginBottom: 12 }} />
          <div style={{
            fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600,
            color: C.textPrimary, marginBottom: 8,
          }}>
            Not ready to sign up? Try our free agents on agent.ai
          </div>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 14, color: C.textPrimary, fontWeight: 400, opacity: 0.75, marginBottom: 16,
          }}>
            No account needed. Paste your data, get instant results.
          </div>
          <Link to="/agents" style={{
            fontFamily: FONT_SANS, fontSize: 14, color: C.aiBlue,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44,
          }}>
            See all free agents <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
