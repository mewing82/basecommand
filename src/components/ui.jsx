// ─── Reusable UI Components ───────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, S, R, HOVER, AI_PROVIDERS } from "../lib/tokens";
import { store } from "../lib/storage";
import { getActiveAIConfig, getModelLabel } from "../lib/ai.js";
import { healthColor } from "../lib/helpers.js";
import { renderMarkdown } from "./Markdown.jsx";

export function Badge({ label, color, bg }) {
  const c = color || C.textSecondary;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: R.sm + 2,
      fontSize: 11,
      fontFamily: FONT_MONO,
      fontWeight: 500,
      color: c,
      background: bg || `${c}18`,
      letterSpacing: "0.02em",
      lineHeight: 1,
      border: `1px solid ${c}15`,
    }}>{label}</span>
  );
}

export function Btn({ children, onClick, variant = "ghost", disabled, style: extraStyle, size = "md", ariaLabel }) {
  const [hovered, setHovered] = useState(false);
  const base = {
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    borderRadius: R.md,
    fontFamily: FONT_SANS,
    fontWeight: 500,
    fontSize: 13,
    opacity: disabled ? 0.4 : 1,
    transition: "all 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    letterSpacing: "-0.01em",
    ...extraStyle,
  };
  const sizes = {
    sm: { padding: "5px 10px", fontSize: 13 },
    md: { padding: `${S.sm}px ${S.lg}px`, fontSize: 13 },
    lg: { padding: "10px 22px", fontSize: 14 },
  };
  const variants = {
    primary: {
      background: hovered ? C.goldHover : C.gold, color: "#0F1013",
      fontWeight: 600,
      boxShadow: hovered ? `0 0 20px ${C.goldGlow}` : "none",
    },
    ghost: {
      background: hovered ? HOVER.default : "transparent",
      color: hovered ? C.textPrimary : C.textSecondary,
    },
    danger: {
      background: hovered ? C.redMuted : "transparent",
      color: C.red,
      border: `1px solid ${hovered ? C.red + "40" : "transparent"}`,
    },
    outline: {
      background: hovered ? HOVER.subtle : "transparent",
      color: hovered ? C.textPrimary : C.textSecondary,
      border: `1px solid ${hovered ? C.borderSubtle : C.borderDefault}`,
    },
    ai: {
      background: hovered ? C.aiBlueMuted : C.aiBlueGlow,
      color: C.aiBlue,
      border: `1px solid ${hovered ? C.aiBlue + "30" : "transparent"}`,
    },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
    >{children}</button>
  );
}

export function Input({ value, onChange, placeholder, multiline, rows = 3, style: extraStyle, onKeyDown, ariaLabel }) {
  const base = {
    background: C.bgCard,
    border: `1px solid ${C.borderDefault}`,
    borderRadius: R.md,
    color: C.textPrimary,
    fontFamily: FONT_SANS,
    fontSize: 14,
    padding: "10px 14px",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    resize: multiline ? "vertical" : "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    lineHeight: 1.5,
    ...extraStyle,
  };
  const focusStyle = `border-color: ${C.borderSubtle}; box-shadow: 0 0 0 3px ${C.goldGlow};`;
  if (multiline) {
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base} onKeyDown={onKeyDown} onFocus={e => e.target.style.cssText += focusStyle} onBlur={e => { e.target.style.borderColor = C.borderDefault; e.target.style.boxShadow = "none"; }} aria-label={ariaLabel || placeholder} />;
  }
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} onKeyDown={onKeyDown} onFocus={e => e.target.style.cssText += focusStyle} onBlur={e => { e.target.style.borderColor = C.borderDefault; e.target.style.boxShadow = "none"; }} aria-label={ariaLabel || placeholder} />;
}

export function Select({ value, onChange, options, style: extraStyle, ariaLabel }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={ariaLabel}
      style={{
        background: C.bgCard,
        border: `1px solid ${C.borderDefault}`,
        borderRadius: R.md,
        color: C.textPrimary,
        fontFamily: FONT_SANS,
        fontSize: 14,
        padding: "10px 14px",
        outline: "none",
        cursor: "pointer",
        transition: "border-color 0.15s ease",
        ...extraStyle,
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Modal({ title, onClose, children, width = 580 }) {
  const contentRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Trap focus inside modal
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) focusable[0].focus();

    function trapFocus(e) {
      if (e.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, []);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(1,4,9,0.80)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: S.xl,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div ref={contentRef} className="bc-modal-content" style={{
        background: C.bgElevated, border: `1px solid ${C.borderSubtle}`, borderRadius: R.xl,
        width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto",
        padding: 28, position: "relative",
        boxShadow: "0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: S.xl }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.02em" }}>{title}</div>
          <button onClick={onClose} aria-label="Close dialog" style={{
            background: HOVER.default, border: "none", color: C.textTertiary, cursor: "pointer",
            fontSize: 14, padding: "4px 8px", borderRadius: R.sm + 2, transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = HOVER.strong; e.currentTarget.style.color = C.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.background = HOVER.default; e.currentTarget.style.color = C.textTertiary; }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AIConfigPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    store.list("ai-config").then(setConfigs);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (configs.length === 0) return null;

  const active = value ? configs.find(c => c.id === value.id) : (getActiveAIConfig() || null);
  const label = active ? `${getModelLabel(active.provider, active.model)}` : "Default";

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Switch AI model"
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "3px 8px", borderRadius: R.sm, cursor: "pointer",
          background: "transparent", border: `1px solid ${C.borderDefault}`,
          fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary,
          transition: "all 0.12s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.color = C.textSecondary; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textTertiary; }}
      >
        <Sparkles size={8} color={C.aiBlue} />
        {label}
        <span style={{ fontSize: 7, opacity: 0.5 }}>▾</span>
      </button>
      {open && (
        <div role="listbox" style={{
          position: "absolute", bottom: "100%", right: 0, zIndex: 200,
          background: C.bgElevated, border: `1px solid ${C.borderSubtle}`,
          borderRadius: R.sm + 2, padding: 3, marginBottom: 4, minWidth: 180,
          boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        }}>
          <button
            role="option"
            aria-selected={!value && !active}
            onClick={() => { onChange(null); setOpen(false); }}
            style={{
              width: "100%", padding: "6px 8px", borderRadius: R.sm, cursor: "pointer",
              background: !value && !active ? HOVER.strong : "transparent",
              border: "none", textAlign: "left", fontFamily: FONT_MONO, fontSize: 11,
              color: !value && !active ? C.textPrimary : C.textSecondary,
            }}
            onMouseEnter={e => e.currentTarget.style.background = HOVER.subtle}
            onMouseLeave={e => { if (value || active) e.currentTarget.style.background = "transparent"; }}
          >
            Workspace Default
          </button>
          {configs.map(cfg => {
            const isSelected = value ? cfg.id === value.id : (active?.id === cfg.id);
            return (
              <button
                key={cfg.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(cfg); setOpen(false); }}
                style={{
                  width: "100%", padding: "6px 8px", borderRadius: R.sm, cursor: "pointer",
                  background: isSelected ? HOVER.strong : "transparent",
                  border: "none", textAlign: "left", display: "flex", flexDirection: "column", gap: 1,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = HOVER.subtle; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{cfg.name}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                  {AI_PROVIDERS[cfg.provider]?.label} · {getModelLabel(cfg.provider, cfg.model)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AIPanel({ response, loading, error }) {
  if (!loading && !response && !error) return null;
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
        border: `1px solid ${C.borderAI}`,
        borderLeft: `2px solid ${C.aiBlue}40`,
        borderRadius: R.lg - 2,
        padding: `${S.lg}px ${S.lg + 2}px`, marginTop: S.lg - 2,
        position: "relative",
      }}
      role="status"
      aria-live="polite"
    >
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.textTertiary }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: C.aiBlueMuted,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "aiPulse 2s ease-in-out infinite",
          }}>
            <Sparkles size={10} color={C.aiBlue} />
          </div>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary }}>BC is analyzing...</span>
        </div>
      )}
      {error && <div style={{ color: C.red, fontFamily: FONT_BODY, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={14} /> {error}
      </div>}
      {response && !loading && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: S.md }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: C.aiBlueMuted, border: `1px solid ${C.aiBlue}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={10} color={C.aiBlue} />
            </div>
            <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.aiBlue, letterSpacing: "-0.01em" }}>BC Intelligence</span>
          </div>
          <div style={{ color: C.textSecondary }}>{renderMarkdown(response)}</div>
        </div>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, sub, action, onAction, suggestions }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 32px", color: C.textTertiary }}>
      {icon && <div style={{ fontSize: 36, marginBottom: S.lg, opacity: 0.5 }}>{icon}</div>}
      <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: C.textSecondary, marginBottom: S.sm, letterSpacing: "-0.01em" }}>{title}</div>
      {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 14, marginBottom: S.xl, lineHeight: 1.6, maxWidth: 400, margin: "0 auto 24px" }}>{sub}</div>}
      {suggestions && suggestions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: S.sm, maxWidth: 320, margin: "0 auto 24px", textAlign: "left" }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={s.onClick}
              style={{
                display: "flex", alignItems: "center", gap: S.sm,
                padding: `${S.sm}px ${S.md}px`, borderRadius: R.md,
                background: HOVER.subtle, border: `1px solid ${C.borderDefault}`,
                color: C.textSecondary, fontFamily: FONT_BODY, fontSize: 13,
                cursor: "pointer", transition: "all 0.15s", textAlign: "left",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.background = HOVER.default; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.background = HOVER.subtle; }}
            >
              {s.icon && <span style={{ flexShrink: 0 }}>{s.icon}</span>}
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
      {action && <Btn variant="outline" onClick={onAction}>{action}</Btn>}
    </div>
  );
}

export function HealthBar({ score }) {
  const color = healthColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }} role="meter" aria-valuenow={score || 0} aria-valuemin={0} aria-valuemax={100} aria-label="Health score">
      <div style={{ flex: 1, height: 3, background: HOVER.default, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${score || 0}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}CC)`, borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color, minWidth: 30, fontWeight: 500 }}>{score !== null && score !== undefined ? `${score}%` : "—"}</span>
    </div>
  );
}

export function FormField({ label, children, required }) {
  return (
    <div style={{ marginBottom: S.lg + 2 }}>
      <label style={{ display: "block", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: S.sm, letterSpacing: "-0.01em" }}>
        {label}{required && <span style={{ color: C.gold, marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export function Skeleton({ width, height = 16, style: extraStyle }) {
  return (
    <div className="skeleton" style={{ width: width || "100%", height, ...extraStyle }} aria-hidden="true" />
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: R.lg, padding: S.lg + 2, display: "flex", flexDirection: "column", gap: S.md }}>
      <Skeleton height={14} width="60%" />
      <Skeleton height={12} width="80%" />
      <Skeleton height={12} width="40%" />
    </div>
  );
}
