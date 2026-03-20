import { useState, useEffect, useRef } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, AI_PROVIDERS, S, R, HOVER, APP_MOBILE_PX } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { store } from "../../lib/storage";
import { getActiveAIConfig, getModelLabel } from "../../lib/ai";
import { healthColor } from "../../lib/utils";

// ─── Badge ───────────────────────────────────────────────────────────────────
export function Badge({ label, color, bg }) {
  const c = color || C.textSecondary;
  return (
    <span style={{
      display: "inline-block", padding: "3px 8px", borderRadius: 6,
      fontSize: 11, fontFamily: FONT_MONO, fontWeight: 500,
      color: c, background: bg || `${c}18`,
      letterSpacing: "0.02em", lineHeight: 1, border: `1px solid ${c}15`,
    }}>{label}</span>
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "ghost", disabled, style: extraStyle, size = "md" }) {
  const [hovered, setHovered] = useState(false);
  const base = {
    cursor: disabled ? "not-allowed" : "pointer", border: "none", borderRadius: 8,
    fontFamily: FONT_SANS, fontWeight: 500, fontSize: 13,
    opacity: disabled ? 0.4 : 1, transition: "all 0.15s ease",
    display: "inline-flex", alignItems: "center", gap: 6,
    letterSpacing: "-0.01em", ...extraStyle,
  };
  const sizes = {
    sm: { padding: "5px 10px", fontSize: 13 },
    md: { padding: "8px 16px", fontSize: 13 },
    lg: { padding: "10px 22px", fontSize: 14 },
  };
  const variants = {
    primary: { background: hovered ? C.goldHover : C.gold, color: C.textOnPrimary, fontWeight: 600, boxShadow: hovered ? `0 0 20px ${C.goldGlow}` : "none" },
    ghost: { background: hovered ? "rgba(0,0,0,0.04)" : "transparent", color: hovered ? C.textPrimary : C.textSecondary },
    danger: { background: hovered ? C.redMuted : "transparent", color: C.red, border: `1px solid ${hovered ? C.red + "40" : "transparent"}` },
    outline: { background: hovered ? "rgba(0,0,0,0.03)" : "transparent", color: hovered ? C.textPrimary : C.textSecondary, border: `1px solid ${hovered ? C.borderSubtle : C.borderDefault}` },
    ai: { background: hovered ? C.aiBlueMuted : C.aiBlueGlow, color: C.aiBlue, border: `1px solid ${hovered ? C.aiBlue + "30" : "transparent"}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
    >{children}</button>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, multiline, rows = 3, style: extraStyle, onKeyDown }) {
  const base = {
    background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8,
    color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14,
    padding: "10px 14px", width: "100%", outline: "none", boxSizing: "border-box",
    resize: multiline ? "vertical" : "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease", lineHeight: 1.5,
    ...extraStyle,
  };
  const focusStyle = `border-color: ${C.borderSubtle}; box-shadow: 0 0 0 3px ${C.goldGlow};`;
  if (multiline) {
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base} onKeyDown={onKeyDown}
      onFocus={e => e.target.style.cssText += focusStyle} onBlur={e => { e.target.style.borderColor = C.borderDefault; e.target.style.boxShadow = "none"; }} />;
  }
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} onKeyDown={onKeyDown}
    onFocus={e => e.target.style.cssText += focusStyle} onBlur={e => { e.target.style.borderColor = C.borderDefault; e.target.style.boxShadow = "none"; }} />;
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({ value, onChange, options, style: extraStyle }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8,
      color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14,
      padding: "10px 14px", outline: "none", cursor: "pointer",
      transition: "border-color 0.15s ease", ...extraStyle,
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 580 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(1,4,9,0.80)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C.bgElevated, border: `1px solid ${C.borderSubtle}`, borderRadius: 14,
        width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto",
        padding: 28, position: "relative",
        boxShadow: "0 24px 48px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.02)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.02em" }}>{title}</div>
          <button onClick={onClose} style={{
            background: "rgba(0,0,0,0.04)", border: "none", color: C.textTertiary, cursor: "pointer",
            fontSize: 14, padding: "4px 8px", borderRadius: 6, transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = C.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = C.textTertiary; }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── FormField ───────────────────────────────────────────────────────────────
export function FormField({ label, children, required }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8, letterSpacing: "-0.01em" }}>
        {label}{required && <span style={{ color: C.gold, marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 32px", color: C.textTertiary }}>
      {icon && <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.5 }}>{icon}</div>}
      <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: C.textSecondary, marginBottom: 8, letterSpacing: "-0.01em" }}>{title}</div>
      {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 14, marginBottom: 24, lineHeight: 1.6, maxWidth: 400, margin: "0 auto 24px" }}>{sub}</div>}
      {action && <Btn variant="outline" onClick={onAction}>{action}</Btn>}
    </div>
  );
}

// ─── HealthBar ───────────────────────────────────────────────────────────────
export function HealthBar({ score }) {
  const color = healthColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 3, background: "rgba(0,0,0,0.04)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${score || 0}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}CC)`, borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color, minWidth: 30, fontWeight: 500 }}>{score !== null && score !== undefined ? `${score}%` : "—"}</span>
    </div>
  );
}

// ─── AI Panel ────────────────────────────────────────────────────────────────
export function AIPanel({ response, loading, error }) {
  if (!loading && !response && !error) return null;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
      border: `1px solid ${C.borderAI}`, borderLeft: `2px solid ${C.aiBlue}40`,
      borderRadius: 10, padding: "16px 18px", marginTop: 14, position: "relative",
    }}>
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.textTertiary }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.aiBlueMuted, display: "flex", alignItems: "center", justifyContent: "center", animation: "aiPulse 2s ease-in-out infinite" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.aiBlueMuted, border: `1px solid ${C.aiBlue}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
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

// ─── Section Header ──────────────────────────────────────────────────────────
export function Section({ title, count, children, onViewAll, action }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>{title}</span>
          {count !== undefined && <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary, fontWeight: 500 }}>{count}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {action}
          {onViewAll && <Btn variant="ghost" size="sm" onClick={onViewAll}>View all →</Btn>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Project Filter Pills ────────────────────────────────────────────────────
export function useProjectLinks(projects) {
  const [linkMap, setLinkMap] = useState({});
  useEffect(() => {
    if (!projects || projects.length === 0) { setLinkMap({}); return; }
    Promise.all(projects.map(p => store.getLinks("project", p.id).then(links => ({ id: p.id, links })))).then(results => {
      const map = {};
      for (const { id, links } of results) { map[id] = new Set(links.map(l => l.id)); }
      setLinkMap(map);
    });
  }, [projects]);
  return linkMap;
}

export function ProjectFilterPills({ projects, filterProject, setFilterProject }) {
  if (!projects || projects.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
      <button onClick={() => setFilterProject(null)} style={{
        padding: "5px 12px", borderRadius: 8, cursor: "pointer",
        border: `1px solid ${filterProject === null ? C.borderSubtle : C.borderDefault}`,
        background: filterProject === null ? "rgba(0,0,0,0.05)" : "transparent",
        color: filterProject === null ? C.textPrimary : C.textSecondary,
        fontFamily: FONT_SANS, fontSize: 12, fontWeight: filterProject === null ? 600 : 400,
        transition: "all 0.15s ease",
      }}>All</button>
      {projects.map(p => (
        <button key={p.id} onClick={() => setFilterProject(filterProject === p.id ? null : p.id)} style={{
          padding: "5px 12px", borderRadius: 8, cursor: "pointer",
          border: `1px solid ${filterProject === p.id ? C.borderSubtle : C.borderDefault}`,
          background: filterProject === p.id ? "rgba(0,0,0,0.05)" : "transparent",
          color: filterProject === p.id ? C.textPrimary : C.textSecondary,
          fontFamily: FONT_SANS, fontSize: 12, fontWeight: filterProject === p.id ? 600 : 400,
          transition: "all 0.15s ease", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{p.title}</button>
      ))}
    </div>
  );
}

export function filterByProject(items, filterProject, linkMap) {
  if (!filterProject) return items;
  const ids = linkMap[filterProject];
  if (!ids) return items;
  return items.filter(item => ids.has(item.id));
}

// ─── Lifecycle Bar ───────────────────────────────────────────────────────────
export function LifecycleBar({ status, onAdvance, statuses, statusLabels }) {
  const STATUSES = statuses || ["draft", "analyzing", "decided", "implementing", "evaluating", "closed"];
  const currentIdx = STATUSES.indexOf(status);
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 12, alignItems: "center" }}>
      {STATUSES.map((s, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isNext = i === currentIdx + 1;
        return (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <button onClick={() => isNext && onAdvance && onAdvance(s)}
              title={statusLabels?.[s] || s}
              style={{
                width: "100%", height: 4, borderRadius: 2, border: "none",
                cursor: isNext ? "pointer" : "default",
                background: isCurrent ? `linear-gradient(90deg, ${C.gold}, ${C.goldHover})` : isPast ? `${C.gold}50` : "rgba(0,0,0,0.04)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isCurrent ? `0 0 8px ${C.goldGlow}` : "none",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Markdown Rendering ──────────────────────────────────────────────────────
export function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") { elements.push(<br key={key++} />); continue; }
    if (line.startsWith("### ")) {
      elements.push(<div key={key++} style={{ fontWeight: 600, fontSize: 15, color: C.textPrimary, marginTop: 12, marginBottom: 4, fontFamily: FONT_SANS }}>{inlineMarkdownJsx(line.slice(4))}</div>);
    } else if (line.startsWith("## ")) {
      elements.push(<div key={key++} style={{ fontWeight: 700, fontSize: 15, color: C.textPrimary, marginTop: 14, marginBottom: 4, fontFamily: FONT_SANS }}>{inlineMarkdownJsx(line.slice(3))}</div>);
    } else if (line.startsWith("# ")) {
      elements.push(<div key={key++} style={{ fontWeight: 700, fontSize: 16, color: C.textPrimary, marginTop: 16, marginBottom: 6, fontFamily: FONT_SANS }}>{inlineMarkdownJsx(line.slice(2))}</div>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: 8, marginBottom: 3, fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary }}>
          <span style={{ color: C.gold, flexShrink: 0 }}>•</span>
          <span>{inlineMarkdownJsx(line.slice(2))}</span>
        </div>
      );
    } else {
      elements.push(<div key={key++} style={{ marginBottom: 4, fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>{inlineMarkdownJsx(line)}</div>);
    }
  }
  return elements;
}

function inlineMarkdownJsx(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: C.textPrimary, fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} style={{ fontFamily: FONT_MONO, fontSize: 12, background: "rgba(0,0,0,0.03)", padding: "1px 4px", borderRadius: 3 }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ─── AI Config Picker ───────────────────────────────────────────────────────
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
        <span style={{ fontSize: 7, opacity: 0.5 }}>&#9662;</span>
      </button>
      {open && (
        <div role="listbox" style={{
          position: "absolute", bottom: "100%", right: 0, zIndex: 200,
          background: C.bgElevated, border: `1px solid ${C.borderSubtle}`,
          borderRadius: R.sm + 2, padding: 3, marginBottom: 4, minWidth: 180,
          boxShadow: "0 6px 20px rgba(0,0,0,0.10)",
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

// ─── Skeleton ───────────────────────────────────────────────────────────────
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

// ─── Responsive Grid ────────────────────────────────────────────────────────
export function ResponsiveGrid({ cols = { desktop: 4, tablet: 2, mobile: 1 }, gap, children, style }) {
  const { isMobile, isTablet } = useMediaQuery();
  const count = isMobile ? cols.mobile : isTablet ? cols.tablet : cols.desktop;
  const g = gap ?? (isMobile ? APP_MOBILE_PX : S.xl);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: g, ...style }}>
      {children}
    </div>
  );
}

// ─── Agent Stat Grid (shorthand) ────────────────────────────────────────────
export function AgentStatGrid({ children, style }) {
  return <ResponsiveGrid cols={{ desktop: 4, tablet: 2, mobile: 2 }} gap={16} style={style}>{children}</ResponsiveGrid>;
}

// ─── Scrollable Table ───────────────────────────────────────────────────────
export function ScrollableTable({ children, style }) {
  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", ...style }}>
      {children}
    </div>
  );
}
