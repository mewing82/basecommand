import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { C, FONT_SANS, FONT_BODY } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { useAuthStore } from "../../store/authStore";
import { ONBOARDING } from "../../lib/demoData";
import { ProgressBar, ButtonGroup } from "../../components/onboarding/OnboardingWidgets";

const ROLES = [
  { value: "csm", label: "CSM" },
  { value: "cs_leader", label: "CS Leader" },
  { value: "renewal_mgr", label: "Renewal Manager" },
  { value: "revops", label: "RevOps" },
  { value: "founder", label: "Founder / CEO" },
  { value: "other", label: "Other" },
];

const ACCOUNT_COUNTS = [
  { value: "1-25", label: "1-25" },
  { value: "25-100", label: "25-100" },
  { value: "100-500", label: "100-500" },
  { value: "500+", label: "500+" },
];

const CHALLENGES = [
  { value: "churn", label: "Churn prediction" },
  { value: "execution", label: "Renewal execution" },
  { value: "health", label: "Account health" },
  { value: "all", label: "All of the above" },
];

export default function Personalize() {
  const navigate = useNavigate();
  const { isMobile } = useMediaQuery();
  const { user, loading: authLoading } = useAuthStore();
  const [answers, setAnswers] = useState({ role: null, accountCount: null, challenge: null });

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate("/signup", { replace: true });
  }, [user, authLoading, navigate]);

  // Already completed onboarding? Go to app
  useEffect(() => {
    if (localStorage.getItem(ONBOARDING.step) === "complete") {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  function handleContinue() {
    localStorage.setItem(ONBOARDING.profile, JSON.stringify(answers));
    localStorage.setItem(ONBOARDING.step, "setup");
    navigate("/onboarding/setup");
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING.step, "setup");
    navigate("/onboarding/setup");
  }

  if (authLoading || !user) return null;

  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || "";
  const hasAnyAnswer = answers.role || answers.accountCount || answers.challenge;

  return (
    <div style={{ minHeight: "100vh", background: C.bgPrimary, fontFamily: FONT_SANS }}>
      <ProgressBar step={2} total={3} />

      <div style={{
        maxWidth: 560, margin: "0 auto",
        padding: isMobile ? "60px 24px 40px" : "80px 24px 40px",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", marginBottom: 8 }}>
            {userName ? `Welcome, ${userName.split(" ")[0]}` : "Tell us about yourself"}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, lineHeight: 1.6 }}>
            Help us personalize your experience — takes 30 seconds
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Role */}
          <div>
            <label style={{
              display: "block", fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
              color: C.textPrimary, marginBottom: 12,
            }}>
              What's your role?
            </label>
            <ButtonGroup
              options={ROLES}
              value={answers.role}
              onChange={v => setAnswers(a => ({ ...a, role: v }))}
            />
          </div>

          {/* Account count */}
          <div>
            <label style={{
              display: "block", fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
              color: C.textPrimary, marginBottom: 12,
            }}>
              How many accounts do you manage?
            </label>
            <ButtonGroup
              options={ACCOUNT_COUNTS}
              value={answers.accountCount}
              onChange={v => setAnswers(a => ({ ...a, accountCount: v }))}
            />
          </div>

          {/* Challenge */}
          <div>
            <label style={{
              display: "block", fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
              color: C.textPrimary, marginBottom: 12,
            }}>
              What's your biggest challenge?
            </label>
            <ButtonGroup
              options={CHALLENGES}
              value={answers.challenge}
              onChange={v => setAnswers(a => ({ ...a, challenge: v }))}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <button onClick={handleContinue} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", maxWidth: 320, padding: "13px 0", borderRadius: 10, border: "none",
            background: hasAnyAnswer
              ? `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`
              : C.bgCard,
            color: hasAnyAnswer ? C.bgPrimary : C.textTertiary,
            fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
            cursor: "pointer",
            boxShadow: hasAnyAnswer ? `0 4px 16px ${C.goldGlow}` : "none",
            transition: "all 0.2s",
          }}>
            Continue <ArrowRight size={16} />
          </button>

          <button onClick={handleSkip} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary,
            padding: 4, textDecoration: "underline", opacity: 0.7,
          }}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
