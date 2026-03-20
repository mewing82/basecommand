/**
 * Shared onboarding components: ProgressBar, ButtonGroup, OnboardingChecklist, TrialBanner.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, CheckCircle, Circle, ArrowRight, X, Sparkles, Bot, Settings, Activity, BarChart3 } from "lucide-react";
import { C, FONT_SANS, FONT_BODY } from "../../lib/tokens";
import { ONBOARDING } from "../../lib/demoData";

// ─── Progress Bar ────────────────────────────────────────────────────────────
export function ProgressBar({ step, total }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 3, background: C.borderDefault }}>
      <div style={{
        height: "100%", width: `${pct}%`,
        background: `linear-gradient(90deg, ${C.gold}, ${C.goldHover})`,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

// ─── Button Group Selector ───────────────────────────────────────────────────
export function ButtonGroup({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map(opt => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "10px 18px", borderRadius: 8, cursor: "pointer",
              background: isSelected ? C.goldMuted : "transparent",
              border: `1px solid ${isSelected ? C.gold : C.borderDefault}`,
              color: isSelected ? C.textPrimary : C.textSecondary,
              fontFamily: FONT_SANS, fontSize: 13, fontWeight: isSelected ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Onboarding Checklist ────────────────────────────────────────────────────
const CHECKLIST_ITEMS = [
  { id: "explore-fleet", label: "Explore your agent fleet", route: "/app/agents", icon: Bot },
  { id: "configure-autonomy", label: "Configure fleet autonomy levels", route: "/app/agents?configure=fleet", icon: Settings },
  { id: "run-first-agent", label: "Run your first agent", route: "/app/agents/renewal/health-monitor", icon: Activity },
  { id: "review-results", label: "Review agent results in your portfolio", route: "/app/accounts", icon: BarChart3 },
];

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(ONBOARDING.dismissed) === "true");
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ONBOARDING.checklist) || "[]"); }
    catch { return []; }
  });

  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(ONBOARDING.dismissed, "true");
    setDismissed(true);
  }

  function handleClick(item) {
    if (!completed.includes(item.id)) {
      const updated = [...completed, item.id];
      setCompleted(updated);
      localStorage.setItem(ONBOARDING.checklist, JSON.stringify(updated));
    }
    navigate(item.route);
  }

  const allDone = completed.length >= CHECKLIST_ITEMS.length;

  return (
    <div style={{
      padding: "18px 20px", borderRadius: 12, marginBottom: 16,
      background: C.bgCard, border: `1px solid ${C.borderDefault}`,
      borderLeft: `3px solid ${C.gold}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={14} style={{ color: C.gold }} />
          <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
            {allDone ? "Fleet activated!" : "Activate Your Fleet"}
          </span>
        </div>
        <button onClick={handleDismiss} style={{
          background: "none", border: "none", cursor: "pointer", padding: 4,
          color: C.textTertiary, opacity: 0.5,
        }}>
          <X size={14} />
        </button>
      </div>
      {!allDone && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 12, marginTop: -6 }}>
          Complete these steps to get your AI agents running
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CHECKLIST_ITEMS.map(item => {
          const done = completed.includes(item.id);
          return (
            <button key={item.id} onClick={() => handleClick(item)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 8, cursor: "pointer",
              background: "transparent", border: "none", textAlign: "left",
              transition: "background 0.12s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {done
                ? <CheckCircle size={16} style={{ color: C.green, flexShrink: 0 }} />
                : <Circle size={16} style={{ color: C.textTertiary, flexShrink: 0 }} />
              }
              {item.icon && <item.icon size={14} style={{ color: done ? C.textTertiary : C.gold, flexShrink: 0 }} />}
              <span style={{
                fontFamily: FONT_BODY, fontSize: 13,
                color: done ? C.textTertiary : C.textSecondary,
                textDecoration: done ? "line-through" : "none",
              }}>{item.label}</span>
              {!done && <ArrowRight size={12} style={{ color: C.textTertiary, marginLeft: "auto" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Trial Banner ────────────────────────────────────────────────────────────
const TRIAL_BANNER_DISMISSED_KEY = "bc-trial-banner-dismissed";

export function TrialBanner({ trialDaysLeft }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(TRIAL_BANNER_DISMISSED_KEY) === "true");

  if (!trialDaysLeft || trialDaysLeft <= 0 || dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(TRIAL_BANNER_DISMISSED_KEY, "true");
    setDismissed(true);
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 16px", borderRadius: 10, marginBottom: 16,
      background: `${C.aiBlue}08`, border: `1px solid ${C.aiBlue}20`,
    }}>
      <Zap size={14} style={{ color: C.aiBlue, flexShrink: 0 }} />
      <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.aiBlue, flex: 1 }}>
        {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} of Pro trial — all agents unlocked
      </span>
      <button onClick={handleDismiss} style={{
        background: "none", border: "none", cursor: "pointer", padding: 4,
        color: C.textTertiary, opacity: 0.5, flexShrink: 0,
      }}>
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Demo Data Banner ────────────────────────────────────────────────────────
export function DemoDataBanner() {
  const isDemo = localStorage.getItem(ONBOARDING.demo) === "true";
  const navigate = useNavigate();
  if (!isDemo) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 16px", borderRadius: 10, marginBottom: 16,
      background: `${C.purple}08`, border: `1px solid ${C.purple}20`,
    }}>
      <Sparkles size={14} style={{ color: C.purple, flexShrink: 0 }} />
      <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary }}>
        Exploring with demo data.{" "}
        <button onClick={() => navigate("/app/import")} style={{
          background: "none", border: "none", color: C.gold, cursor: "pointer",
          fontFamily: FONT_BODY, fontSize: 12, padding: 0, textDecoration: "underline",
        }}>Import your real accounts</button>
      </span>
    </div>
  );
}
