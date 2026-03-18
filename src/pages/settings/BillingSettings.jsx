import { useState, useEffect, useCallback } from "react";
import { CreditCard, Zap, Clock, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";

export default function BillingSettings() {
  const { user } = useAuthStore();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch("/api/stripe/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSub(data);
      } catch {
        // Stripe not configured in dev
      }
      setLoading(false);
    })();
  }, [getToken]);

  async function handleUpgrade(plan) {
    setError("");
    setUpgrading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout");
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setUpgrading(false);
    }
  }

  async function handleManageBilling() {
    try {
      const token = await getToken();
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, padding: 24 }}>Loading billing info...</div>;
  }

  const isPro = sub?.tier === "pro";
  const isTrialing = sub?.status === "trialing" && sub?.trialDaysLeft > 0;
  const isFree = !isPro && !isTrialing;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Current Plan */}
      <div style={{
        padding: 20, borderRadius: 12, border: `1px solid ${C.borderDefault}`,
        background: isPro ? C.goldMuted : isTrialing ? `${C.aiBlue}08` : C.bgCard,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          {isPro ? <Zap size={18} color={C.gold} /> : isTrialing ? <Clock size={18} color={C.aiBlue} /> : <CreditCard size={18} color={C.textTertiary} />}
          <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
            {isPro ? "Pro" : isTrialing ? "Pro Trial" : "Free"}
          </div>
          {isPro && (
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, padding: "2px 8px", borderRadius: 4,
              background: C.gold, color: C.bgPrimary, fontWeight: 600, textTransform: "uppercase",
            }}>ACTIVE</span>
          )}
        </div>

        {isTrialing && (
          <div style={{
            fontFamily: FONT_BODY, fontSize: 14, color: C.aiBlue, marginBottom: 12,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Clock size={14} />
            {sub.trialDaysLeft} day{sub.trialDaysLeft !== 1 ? "s" : ""} remaining in your Pro trial
          </div>
        )}

        {isPro && sub.billingCycle && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, marginBottom: 4 }}>
            {sub.billingCycle === "annual" ? "$39/mo (billed annually)" : "$49/mo"} &middot; Founding member pricing
          </div>
        )}

        {isPro && sub.currentPeriodEnd && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary }}>
            {sub.cancelAtPeriodEnd
              ? `Cancels ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
              : `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
            }
          </div>
        )}

        {isFree && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>
            10 accounts &middot; 50 AI calls/month &middot; All agent categories
          </div>
        )}
      </div>

      {/* Upgrade CTA (show for free/trial) */}
      {!isPro && (
        <div style={{
          padding: 20, borderRadius: 12, background: C.bgCard, border: `1px solid ${C.borderDefault}`,
        }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>
            {isTrialing ? "Lock in founding member pricing" : "Upgrade to Pro"}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6, marginBottom: 16 }}>
            Unlimited accounts, unlimited AI calls (powered by Claude), supervised autopilot,
            email connectors, and cloud sync. First 100 customers get founding member pricing — locked for life.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => handleUpgrade("monthly")} disabled={upgrading} style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
              color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
              cursor: upgrading ? "wait" : "pointer", opacity: upgrading ? 0.7 : 1,
            }}>
              $49/mo &middot; Monthly
            </button>
            <button onClick={() => handleUpgrade("annual")} disabled={upgrading} style={{
              padding: "10px 20px", borderRadius: 10,
              border: `1px solid ${C.gold}40`, background: "transparent",
              color: C.gold, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
              cursor: upgrading ? "wait" : "pointer", opacity: upgrading ? 0.7 : 1,
            }}>
              $39/mo &middot; Annual (save 20%)
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 10, fontFamily: FONT_BODY, fontSize: 12, color: C.red }}>{error}</div>
          )}
        </div>
      )}

      {/* Manage billing (show for paid users) */}
      {isPro && sub.hasStripeSubscription && (
        <button onClick={handleManageBilling} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "12px 20px",
          borderRadius: 10, border: `1px solid ${C.borderDefault}`, background: C.bgCard,
          color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500,
          cursor: "pointer", transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.color = C.textPrimary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}
        >
          <ExternalLink size={14} />
          Manage billing, invoices & payment method
        </button>
      )}

      {/* What's included */}
      <div style={{
        padding: 20, borderRadius: 12, background: C.bgCard, border: `1px solid ${C.borderDefault}`,
      }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 12 }}>
          {isPro ? "Your Pro plan includes" : "Pro plan includes"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Unlimited accounts",
            "Unlimited AI calls (powered by Claude)",
            "All agent categories (Renewal, Growth, Coaching)",
            "Supervised autopilot workflows",
            "Email connectors (Gmail & Outlook)",
            "Cloud sync across devices",
            "Priority support",
            "Early access to new agents",
          ].map(feature => (
            <div key={feature} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={14} color={isPro ? C.green : C.textTertiary} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: isPro ? C.textSecondary : C.textTertiary }}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
