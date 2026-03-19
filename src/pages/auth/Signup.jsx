import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Shield, CreditCard, Clock, Zap, CheckCircle } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { useAuthStore } from "../../store/authStore";
import { ONBOARDING } from "../../lib/demoData";
import { ProgressBar } from "../../components/onboarding/OnboardingWidgets";
import { usePageMeta, PAGE_SEO } from "../../lib/seo";

const FOUNDING_SPOTS_REMAINING = 67;

const PROOF_STATS = [
  { icon: Shield, text: "No credit card required" },
  { icon: Clock, text: "14-day Pro trial" },
  { icon: Zap, text: "Cancel anytime" },
];

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuthStore();
  const [searchParams] = useSearchParams();
  const { isMobile } = useMediaQuery();
  usePageMeta(PAGE_SEO.signup);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const urlPlan = searchParams.get("plan");
  const [selectedPlan, setSelectedPlan] = useState(urlPlan === "monthly" || urlPlan === "annual" ? "pro" : "trial");
  const isPro = selectedPlan === "pro";

  // Clear any stale plan param
  useEffect(() => {
    localStorage.removeItem(ONBOARDING.plan);
  }, []);

  // Store onboarding step
  useEffect(() => {
    localStorage.setItem(ONBOARDING.step, "personalize");
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      if (isPro) localStorage.setItem(ONBOARDING.plan, "monthly");
      await signUp(email, password, name);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.bgPrimary, fontFamily: FONT_SANS, padding: 24,
      }}>
        <ProgressBar step={1} total={3} />
        <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
            background: C.greenMuted, border: `1px solid ${C.green}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, color: C.green,
          }}>&#10003;</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, marginBottom: 12, letterSpacing: "-0.03em" }}>
            Check your email
          </div>
          <div style={{ fontSize: 14, color: C.textTertiary, fontFamily: FONT_BODY, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a confirmation link to <strong style={{ color: C.textSecondary }}>{email}</strong>.
          </div>
          <div style={{ fontSize: 13, color: C.textTertiary, fontFamily: FONT_BODY, lineHeight: 1.7, marginBottom: 28 }}>
            Click it to activate your account, then we'll help you set up your workspace.
          </div>
          <Link to="/login" style={{
            display: "inline-block", padding: "10px 24px", borderRadius: 8,
            background: "transparent", border: `1px solid ${C.borderDefault}`,
            color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500,
            textDecoration: "none",
          }}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bgPrimary, fontFamily: FONT_SANS }}>
      <ProgressBar step={1} total={3} />

      <div style={{
        display: "flex", flexDirection: isMobile ? "column" : "row",
        minHeight: "100vh", maxWidth: 1000, margin: "0 auto",
      }}>
        {/* ─── Left: Signup Form ──────────────────────────────────────── */}
        <div style={{
          flex: isMobile ? undefined : "0 0 55%",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: isMobile ? "40px 24px 24px" : "40px 48px",
        }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            {/* Logo + heading */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 20,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 700, color: C.bgPrimary, fontFamily: FONT_MONO,
              }}>B</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em" }}>
                {isPro ? "Subscribe to Pro" : "Start your free trial"}
              </div>
              <div style={{ fontSize: 14, color: C.textTertiary, marginTop: 6, fontFamily: FONT_BODY }}>
                See which renewals are at risk — in 5 minutes
              </div>
            </div>

            {/* Plan toggle */}
            <div style={{
              display: "flex", borderRadius: 10, overflow: "hidden", marginBottom: 24,
              border: `1px solid ${C.borderDefault}`, background: C.bgPrimary,
            }}>
              <button onClick={() => setSelectedPlan("trial")} style={{
                flex: 1, padding: "12px 8px", border: "none", cursor: "pointer",
                background: !isPro ? C.goldMuted : "transparent",
                borderRight: `1px solid ${C.borderDefault}`,
                transition: "all 0.15s",
              }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: !isPro ? C.textPrimary : C.textTertiary }}>
                  Free Trial
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: !isPro ? C.gold : C.textTertiary, marginTop: 2 }}>
                  14 days, no card
                </div>
              </button>
              <button onClick={() => setSelectedPlan("pro")} style={{
                flex: 1, padding: "12px 8px", border: "none", cursor: "pointer",
                background: isPro ? C.goldMuted : "transparent",
                transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Zap size={12} style={{ color: isPro ? C.gold : C.textTertiary }} />
                  <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: isPro ? C.textPrimary : C.textTertiary }}>
                    Pro — $49/mo
                  </span>
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: isPro ? C.gold : C.textTertiary, marginTop: 2 }}>
                  Founding member price
                </div>
              </button>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => {
                setError("");
                if (isPro) localStorage.setItem(ONBOARDING.plan, "monthly");
                signInWithGoogle(isPro ? "monthly" : null, "/onboarding/personalize")
                  .catch(err => setError(err.message || "Google sign-in failed"));
              }}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 10,
                border: `1px solid ${C.gold}40`,
                background: C.bgCard, color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = `${C.gold}08`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.gold}40`; e.currentTarget.style.background = C.bgCard; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
              <span style={{ fontSize: 12, color: C.textTertiary, fontFamily: FONT_BODY }}>or</span>
              <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 5 }}>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required
                  style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 5 }}>Work email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                  style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 5 }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required
                  style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, marginBottom: 14,
                  background: C.redMuted, color: C.red, fontSize: 13, fontFamily: FONT_BODY,
                  border: `1px solid ${C.red}20`,
                }}>{error}</div>
              )}

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
                color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
                cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
                boxShadow: `0 4px 16px ${C.goldGlow}`,
              }}>
                {loading ? "Creating account..." : isPro ? "Create account & subscribe" : "Start free trial"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: C.textTertiary, fontFamily: FONT_BODY, lineHeight: 1.6 }}>
              By creating an account, you agree to our{" "}
              <Link to="/terms" style={{ color: C.textSecondary, textDecoration: "underline" }}>Terms</Link>
              {" "}and{" "}
              <Link to="/privacy" style={{ color: C.textSecondary, textDecoration: "underline" }}>Privacy Policy</Link>.
            </p>

            <div style={{ textAlign: "center", marginTop: 12, fontSize: 14, color: C.textTertiary, fontFamily: FONT_BODY }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: C.gold, textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
            </div>
          </div>
        </div>

        {/* ─── Right: Social Proof Panel ──────────────────────────────── */}
        <div style={{
          flex: isMobile ? undefined : "0 0 45%",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: isMobile ? "24px 24px 40px" : "40px 48px",
          background: isMobile ? "transparent" : `${C.bgCard}80`,
          borderLeft: isMobile ? "none" : `1px solid ${C.borderDefault}`,
        }}>
          <div style={{ width: "100%", maxWidth: 340 }}>
            {/* Founding Member Counter */}
            <div style={{
              padding: "20px 22px", borderRadius: 14, marginBottom: 20,
              background: C.goldMuted, border: `1px solid ${C.gold}20`,
            }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontWeight: 600 }}>
                Founding Member
              </div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 28, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em" }}>
                {FOUNDING_SPOTS_REMAINING} <span style={{ fontSize: 14, fontWeight: 400, color: C.textTertiary }}>of 100 spots left</span>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
                $49/mo locked in for life. First 100 customers get founding member pricing — it never goes up.
              </div>
            </div>

            {/* ROI Stat */}
            <div style={{
              padding: "18px 22px", borderRadius: 14, marginBottom: 20,
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>
                Save 1 renewal = 2+ years paid for
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.5 }}>
                At $49/mo, saving a single $15K renewal pays for BaseCommand for over 25 months. Most teams see ROI in the first week.
              </div>
            </div>

            {/* Testimonial */}
            <div style={{
              padding: "18px 22px", borderRadius: 14, marginBottom: 20,
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, fontStyle: "italic", lineHeight: 1.6, marginBottom: 10 }}>
                "I replaced three spreadsheets and caught two at-risk renewals in my first session. This is what I've been looking for."
              </div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.textTertiary }}>
                — CS Manager, Series B SaaS
              </div>
            </div>

            {/* Trust Signals */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PROOF_STATS.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle size={14} style={{ color: C.green, flexShrink: 0 }} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary }}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared input styles ─────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
  background: C.bgCard, border: `1px solid ${C.borderDefault}`,
  color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14, outline: "none",
  transition: "border-color 0.15s",
};

function focusInput(e) { e.target.style.borderColor = C.borderSubtle; }
function blurInput(e) { e.target.style.borderColor = C.borderDefault; }
