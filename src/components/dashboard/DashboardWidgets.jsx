import { useState } from "react";
import { Activity, Bot, CheckCircle, X, AlertTriangle, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { store } from "../../lib/storage";
import { formatARR } from "../../lib/utils";

// ─── Agent Status Strip ─────────────────────────────────────────────────────
const AGENTS = [
  { key: "health-monitor", label: "Health Monitor", ck: ["health-cache"] },
  { key: "rescue-planner", label: "Rescue Planner", ck: ["rescue-cache"] },
  { key: "outreach-drafter", label: "Outreach Drafter", ck: ["outreach-cache"] },
  { key: "expansion-scout", label: "Expansion Scout", ck: ["expansion-cache"] },
  { key: "forecast-engine", label: "Forecast Engine", ck: ["forecast"] },
  { key: "opportunity-brief", label: "Opportunity Brief", ck: ["opportunity-cache"] },
  { key: "executive-brief", label: "Executive Brief", ck: ["leadership-cache"] },
  { key: "meeting-prep", label: "Meeting Prep", ck: ["meeting-prep-cache"] },
  { key: "playbook-builder", label: "Playbook Builder", ck: ["playbook-cache"] },
];

function isAgentActive(cacheKeys) {
  const pre = `bc2-${store._ws}-`;
  return cacheKeys.some(ck => localStorage.getItem(`${pre}${ck}`) || localStorage.getItem(`${pre}renewals-${ck}`));
}

export function AgentStatusStrip() {
  const { isMobile } = useMediaQuery();
  const [st] = useState(() => {
    const m = {};
    for (const a of AGENTS) m[a.key] = isAgentActive(a.ck);
    return m;
  });

  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 24, WebkitOverflowScrolling: "touch", scrollbarWidth: "thin" }}>
      {AGENTS.map(a => {
        const on = st[a.key];
        return (
          <div key={a.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: isMobile ? "6px 10px" : "7px 14px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 20, flexShrink: 0, whiteSpace: "nowrap" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: on ? C.green : C.textTertiary, boxShadow: on ? `0 0 6px ${C.green}40` : "none", opacity: on ? 1 : 0.5 }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: on ? C.textPrimary : C.textTertiary }}>{a.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── NRR Waterfall ──────────────────────────────────────────────────────────
export function NRRWaterfall({ accounts, isMobile }) {
  const base = accounts.reduce((s, a) => s + (a.arr || 0), 0);
  const churn = accounts.filter(a => a.riskLevel === "high").reduce((s, a) => s + (a.arr || 0), 0);
  const contraction = accounts.filter(a => a.riskLevel === "medium").reduce((s, a) => s + (a.arr || 0) * 0.10, 0);
  const expansion = accounts.filter(a => a.riskLevel === "low").reduce((s, a) => s + (a.arr || 0) * 0.05, 0);
  const net = base - churn - contraction + expansion;
  const max = Math.max(base, net, 1);

  const bars = [
    { label: "Base ARR", value: base, color: C.textSecondary, Icon: null },
    { label: "+Expansion", value: expansion, color: C.green, Icon: TrendingUp },
    { label: "-Contraction", value: contraction, color: C.amber, Icon: TrendingDown },
    { label: "-Churn Risk", value: churn, color: C.red, Icon: AlertTriangle },
    { label: "=Net ARR", value: net, color: C.gold, Icon: Zap },
  ];

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 14, padding: isMobile ? "16px 14px" : "20px 22px" }}>
      <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <TrendingUp size={16} style={{ color: C.green }} /> NRR Waterfall
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bars.map((b, i) => {
          const pct = Math.max((b.value / max) * 100, 4);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: isMobile ? 80 : 100, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                {b.Icon && <b.Icon size={12} style={{ color: b.color }} />}
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: b.color, fontWeight: i === 4 ? 600 : 400 }}>{b.label}</span>
              </div>
              <div style={{ flex: 1, position: "relative", height: 22 }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, borderRadius: 4, background: i === 4 ? `linear-gradient(90deg, ${b.color}, ${C.goldHover})` : `${b.color}30`, border: `1px solid ${b.color}40`, transition: "width 0.4s ease" }} />
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: b.color, fontWeight: i === 4 ? 600 : 500, minWidth: 56, textAlign: "right" }}>{formatARR(Math.round(b.value))}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Approval Queue ─────────────────────────────────────────────────────────
export function ApprovalQueue({ items, onApprove, onDismiss, onViewAll }) {
  const { isMobile } = useMediaQuery();
  const uColors = { critical: C.red, high: C.amber, medium: C.blue };
  const cardPad = isMobile ? "16px 14px" : "20px 22px";

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 14, padding: cardPad }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Bot size={16} style={{ color: C.aiBlue }} />
        <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>Approval Queue</span>
        {items.length > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.amber, marginLeft: "auto" }}>{items.length}</span>}
      </div>
      {items.length === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>No pending approvals. Agents will surface recommendations here.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.slice(0, 4).map(action => {
            const c = uColors[action.urgency] || C.textTertiary;
            return (
              <div key={action.id} style={{ padding: "10px 12px", background: C.bgPrimary, borderRadius: 8, border: `1px solid ${C.borderDefault}`, borderLeft: `3px solid ${c}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{action.accountName}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => onApprove?.(action.id)} style={{ padding: "3px 8px", borderRadius: 5, border: "none", background: C.greenMuted, color: C.green, fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                      <CheckCircle size={10} /> Approve
                    </button>
                    <button onClick={() => onDismiss?.(action.id)} style={{ padding: "3px 8px", borderRadius: 5, border: "none", background: "transparent", color: C.textTertiary, fontFamily: FONT_SANS, fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                      <X size={10} /> Dismiss
                    </button>
                  </div>
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.4 }}>{action.title}</div>
              </div>
            );
          })}
        </div>
      )}
      {onViewAll && items.length > 0 && (
        <button onClick={onViewAll} style={{ marginTop: 12, width: "100%", padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.borderDefault}`, background: "transparent", color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.aiBlue + "40"; e.currentTarget.style.color = C.aiBlue; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}
        >View All ({items.length})</button>
      )}
    </div>
  );
}

// ─── Activity Feed ──────────────────────────────────────────────────────────
const FEED_AGENTS = ["Health Monitor", "Rescue Planner", "Outreach Drafter", "Expansion Scout", "Forecast Engine", "Executive Brief"];
const FEED_VERBS = ["flagged", "analyzed", "scored", "reviewed", "updated forecast for", "generated brief for", "identified risk in", "prepared outreach for"];

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return h; }

function buildFeedItems(accounts) {
  if (!accounts?.length) return [];
  const now = Date.now();
  const items = [];
  for (const a of accounts) {
    if (!a.lastActivity) continue;
    const t = new Date(a.lastActivity).getTime();
    if (now - t > 7 * 86400000) continue;
    items.push({
      id: `act-${a.id}`, agent: FEED_AGENTS[Math.abs(hash(a.id)) % FEED_AGENTS.length],
      verb: FEED_VERBS[Math.abs(hash(a.id + "v")) % FEED_VERBS.length],
      account: a.name, timestamp: t,
      icon: a.riskLevel === "high" ? "warn" : a.riskLevel === "low" ? "ok" : "info",
    });
  }
  items.sort((a, b) => b.timestamp - a.timestamp);
  return items.slice(0, 6);
}

function relTime(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function clockTime(ts) { return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }); }

const ICON_MAP = { warn: { I: AlertTriangle, c: C.amber }, ok: { I: CheckCircle, c: C.green }, info: { I: Activity, c: C.aiBlue } };

export function ActivityFeed({ accounts }) {
  const { isMobile } = useMediaQuery();
  const items = buildFeedItems(accounts);
  if (!items.length) return null;

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 14, padding: isMobile ? "16px 14px" : "20px 22px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Activity size={16} style={{ color: C.aiBlue }} />
        <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary }}>Agent Activity</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginLeft: "auto" }}>Last 7 days</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(item => {
          const { I: Icon, c: color } = ICON_MAP[item.icon] || ICON_MAP.info;
          return (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: C.bgPrimary, border: `1px solid ${C.borderDefault}` }}>
              <Icon size={13} style={{ color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary }}>
                  <span style={{ fontWeight: 600, color: C.textPrimary }}>{item.agent}</span> {item.verb} <span style={{ fontWeight: 500, color: C.textPrimary }}>{item.account}</span>
                </span>
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, flexShrink: 0, whiteSpace: "nowrap" }}>{clockTime(item.timestamp)} · {relTime(item.timestamp)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
