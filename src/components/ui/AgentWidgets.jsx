/**
 * Shared agent UI widgets: AILoadingProgress, ActionMenu.
 * Used across all agent pages for consistent UX.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, MessageSquare, CheckSquare, Sparkles, ChevronDown } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { renewalStore } from "../../lib/storage";

// ─── AI Loading Progress ─────────────────────────────────────────────────────
// Animated multi-phase progress bar with contextual status messages.
// phases: array of { label, duration } where duration is in ms

const DEFAULT_PHASES = [
  { label: "Analyzing accounts...", duration: 4000 },
  { label: "Identifying patterns...", duration: 6000 },
  { label: "Building recommendations...", duration: 8000 },
  { label: "Finalizing...", duration: 12000 },
];

export function AILoadingProgress({ phases = DEFAULT_PHASES, startedAt }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = startedAt || Date.now();
    const interval = setInterval(() => setElapsed(Date.now() - start), 200);
    return () => clearInterval(interval);
  }, [startedAt]);

  // Calculate which phase we're in and overall progress
  let totalDuration = 0;
  for (const p of phases) totalDuration += p.duration;

  const clampedElapsed = Math.min(elapsed, totalDuration * 0.95); // never hit 100% until done
  const progress = Math.round((clampedElapsed / totalDuration) * 100);

  let currentPhase = phases[0].label;
  let accumulated = 0;
  for (const p of phases) {
    accumulated += p.duration;
    if (elapsed < accumulated) { currentPhase = p.label; break; }
    currentPhase = p.label;
  }

  return (
    <div style={{
      padding: "32px 24px", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
    }}>
      {/* Animated icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${C.aiBlue}12`, border: `1px solid ${C.aiBlue}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Sparkles size={22} style={{ color: C.aiBlue, animation: "aiPulse 2s ease-in-out infinite" }} />
      </div>

      {/* Phase label */}
      <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.textSecondary }}>
        {currentPhase}
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 300 }}>
        <div style={{
          height: 4, borderRadius: 2, background: C.borderDefault, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${C.aiBlue}, ${C.gold})`,
            transition: "width 0.3s ease",
          }} />
        </div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary,
          marginTop: 6, letterSpacing: "0.03em",
        }}>
          {Math.floor(elapsed / 1000)}s elapsed
        </div>
      </div>
    </div>
  );
}

// ─── Action Menu ─────────────────────────────────────────────────────────────
// Quick-action buttons for AI-generated recommendations.
// Provides: Draft outreach, Start conversation, Log as task

export function ActionMenu({ accountName, accountId, actionText, compact = false }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleLogTask() {
    const task = {
      id: `task-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: actionText.slice(0, 120),
      type: "account",
      accountId: accountId || null,
      accountName: accountName || "",
      status: "pending",
      priority: "high",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await renewalStore.saveTaskItem(task);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDraftOutreach() {
    navigate("/app/agents/renewal/outreach-drafter");
  }

  function handleStartConversation() {
    if (accountId) {
      navigate(`/app/accounts?id=${accountId}`);
    } else {
      navigate("/app/accounts");
    }
  }

  if (compact) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            background: "transparent", border: `1px solid ${C.borderDefault}`,
            color: C.textTertiary, fontFamily: FONT_MONO, fontSize: 10,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
          onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textTertiary; } }}
        >
          Act <ChevronDown size={10} />
        </button>
        {open && (
          <ActionDropdown
            onDraft={handleDraftOutreach}
            onChat={handleStartConversation}
            onTask={handleLogTask}
            saved={saved}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
      <ActionBtn icon={Mail} label="Draft outreach" onClick={handleDraftOutreach} />
      <ActionBtn icon={MessageSquare} label="Chat" onClick={handleStartConversation} />
      <ActionBtn
        icon={CheckSquare}
        label={saved ? "Saved!" : "Log task"}
        onClick={handleLogTask}
        highlight={saved}
      />
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, highlight }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "5px 10px", borderRadius: 6, cursor: "pointer",
      background: highlight ? C.greenMuted : "transparent",
      border: `1px solid ${highlight ? C.green + "40" : C.borderDefault}`,
      color: highlight ? C.green : C.textTertiary,
      fontFamily: FONT_SANS, fontSize: 11, fontWeight: 500,
      transition: "all 0.15s",
    }}
      onMouseEnter={e => { if (!highlight) { e.currentTarget.style.borderColor = C.gold + "60"; e.currentTarget.style.color = C.gold; } }}
      onMouseLeave={e => { if (!highlight) { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textTertiary; } }}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function ActionDropdown({ onDraft, onChat, onTask, saved, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (!e.target.closest("[data-action-dropdown]")) onClose(); };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, [onClose]);

  return (
    <div data-action-dropdown style={{
      position: "absolute", top: "100%", right: 0, marginTop: 4, zIndex: 50,
      minWidth: 160, padding: 4, borderRadius: 8,
      background: C.bgCard, border: `1px solid ${C.borderDefault}`,
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }}>
      <DropdownItem icon={Mail} label="Draft outreach" onClick={() => { onDraft(); onClose(); }} />
      <DropdownItem icon={MessageSquare} label="Start conversation" onClick={() => { onChat(); onClose(); }} />
      <DropdownItem icon={CheckSquare} label={saved ? "Saved!" : "Log as task"} onClick={() => { onTask(); onClose(); }} highlight={saved} />
    </div>
  );
}

function DropdownItem({ icon: Icon, label, onClick, highlight }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8, width: "100%",
      padding: "8px 10px", borderRadius: 6, cursor: "pointer",
      background: highlight ? C.greenMuted : "transparent",
      border: "none", textAlign: "left",
      color: highlight ? C.green : C.textSecondary,
      fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500,
      transition: "background 0.12s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = highlight ? C.greenMuted : "rgba(255,255,255,0.05)"}
      onMouseLeave={e => e.currentTarget.style.background = highlight ? C.greenMuted : "transparent"}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
