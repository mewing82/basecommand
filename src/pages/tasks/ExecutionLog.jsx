import { useState, useEffect, useRef } from "react";
import {
  Check, ThumbsUp, ThumbsDown, AlertTriangle, History, Bot, ChevronDown,
  Zap, Shield, Mail,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { renewalStore } from "../../lib/storage";
import { AGENT_DETAILS } from "../../lib/pillars";

const STATUS_CONFIG = {
  executed:         { icon: Check, color: C.green, label: "Executed" },
  approved:         { icon: ThumbsUp, color: C.green, label: "Approved" },
  dismissed:        { icon: ThumbsDown, color: C.textTertiary, label: "Dismissed" },
  failed:           { icon: AlertTriangle, color: C.red, label: "Failed" },
  generated:        { icon: Bot, color: C.aiBlue, label: "Generated" },
  pending_approval: { icon: Bot, color: C.amber, label: "Pending" },
};

const ACTION_TYPE_ICONS = {
  email_draft: Mail,
  risk_assessment: Shield,
  next_action: Zap,
};

const PAGE_SIZE = 30;

async function fetchExecutions(statusFilter, agentFilter, offset = 0) {
  const filters = { limit: PAGE_SIZE + 1 };
  if (statusFilter !== "all") filters.status = statusFilter;
  if (agentFilter !== "all") filters.agentId = agentFilter;
  if (offset) filters.offset = offset;
  return renewalStore.getExecutions(filters);
}

export default function ExecutionLog({ isMobile }) {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [expanded, setExpanded] = useState(new Set());
  const [hasMore, setHasMore] = useState(false);
  const countRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetchExecutions(statusFilter, agentFilter).then(data => {
      if (cancelled) return;
      const more = data.length > PAGE_SIZE;
      const trimmed = data.slice(0, PAGE_SIZE);
      setExecutions(trimmed);
      setHasMore(more);
      countRef.current = trimmed.length;
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [statusFilter, agentFilter]);

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Collect unique agents for filter
  const uniqueAgents = [...new Set(executions.map(e => e.agentId).filter(Boolean))];

  const STATUS_FILTERS = ["all", "executed", "approved", "dismissed", "failed"];

  if (!loading && executions.length === 0 && statusFilter === "all" && agentFilter === "all") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16, textAlign: "center" }}>
        <History size={32} style={{ color: C.textTertiary }} />
        <div style={{ fontFamily: FONT_SANS, fontSize: fs(18, 16, isMobile), fontWeight: 600, color: C.textPrimary }}>No execution history</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, maxWidth: 400, lineHeight: 1.6, padding: isMobile ? "0 8px" : 0 }}>
          When you approve or dismiss agent proposals, every action is logged here as an audit trail.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <History size={16} style={{ color: C.textTertiary }} />
        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
          Execution Log
        </span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginLeft: "auto" }}>
          Full audit trail
        </span>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setLoading(true); }} style={{
            padding: "4px 10px", borderRadius: 5,
            border: `1px solid ${statusFilter === s ? (STATUS_CONFIG[s]?.color || C.aiBlue) + "40" : C.borderDefault}`,
            background: statusFilter === s ? (STATUS_CONFIG[s]?.color || C.aiBlue) + "14" : "transparent",
            color: statusFilter === s ? (STATUS_CONFIG[s]?.color || C.textPrimary) : C.textTertiary,
            fontFamily: FONT_SANS, fontSize: 10, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
          }}>{s === "all" ? "All" : s}</button>
        ))}
        {uniqueAgents.length > 1 && (
          <>
            <span style={{ width: 1, height: 20, background: C.borderDefault, margin: "0 4px" }} />
            {uniqueAgents.map(a => {
              const detail = AGENT_DETAILS[a];
              return (
                <button key={a} onClick={() => { setAgentFilter(agentFilter === a ? "all" : a); setLoading(true); }} style={{
                  padding: "4px 10px", borderRadius: 5,
                  border: `1px solid ${agentFilter === a ? C.aiBlue + "40" : C.borderDefault}`,
                  background: agentFilter === a ? C.aiBlueMuted : "transparent",
                  color: agentFilter === a ? C.aiBlue : C.textTertiary,
                  fontFamily: FONT_SANS, fontSize: 10, fontWeight: 600, cursor: "pointer",
                }}>{detail?.name || a}</button>
              );
            })}
          </>
        )}
      </div>

      {/* Entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {executions.map(entry => {
          const config = STATUS_CONFIG[entry.status] || STATUS_CONFIG.generated;
          const Icon = config.icon;
          const TypeIcon = ACTION_TYPE_ICONS[entry.actionType] || Zap;
          const agentDetail = AGENT_DETAILS[entry.agentId];
          const isExpanded = expanded.has(entry.id);
          const ts = new Date(entry.createdAt);
          const timeStr = ts.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + ts.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

          return (
            <div key={entry.id} style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 8, overflow: "hidden",
              opacity: entry.status === "dismissed" ? 0.6 : 1,
            }}>
              <button onClick={() => toggleExpand(entry.id)} style={{
                display: "flex", alignItems: "center", gap: isMobile ? 10 : 12,
                padding: isMobile ? "10px 12px" : "10px 16px",
                width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: config.color + "14", border: `1px solid ${config.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={13} style={{ color: config.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.inputSummary || entry.actionType}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    {entry.accountName && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>{entry.accountName}</span>}
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: config.color }}>{config.label}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.aiBlue, background: C.aiBlueMuted, padding: "1px 5px", borderRadius: 3 }}>
                      {agentDetail?.name || entry.agentId}
                    </span>
                    <TypeIcon size={10} style={{ color: C.textTertiary }} />
                    <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary }}>{entry.actionType?.replace("_", " ")}</span>
                  </div>
                </div>
                <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.textTertiary, flexShrink: 0 }}>
                  {timeStr}
                </span>
                <ChevronDown size={12} style={{
                  color: C.textTertiary, flexShrink: 0,
                  transform: isExpanded ? "rotate(180deg)" : "none",
                  transition: "transform 0.15s",
                }} />
              </button>

              {isExpanded && (
                <div style={{ padding: "0 16px 12px", borderTop: `1px solid ${C.borderDefault}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
                    {entry.inputSummary && (
                      <div>
                        <div style={{ fontFamily: FONT_SANS, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", marginBottom: 4 }}>Input</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{entry.inputSummary}</div>
                      </div>
                    )}
                    {entry.outputSummary && (
                      <div>
                        <div style={{ fontFamily: FONT_SANS, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", marginBottom: 4 }}>Output</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{entry.outputSummary}</div>
                      </div>
                    )}
                  </div>
                  {entry.errorMessage && (
                    <div style={{ marginTop: 8, padding: "6px 10px", background: C.red + "10", borderRadius: 6, border: `1px solid ${C.red}20` }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.red }}>{entry.errorMessage}</span>
                    </div>
                  )}
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", marginBottom: 4 }}>Metadata</div>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, lineHeight: 1.5 }}>
                        {Object.entries(entry.metadata).map(([k, v]) => (
                          <span key={k} style={{ marginRight: 12 }}>{k}: {String(v)}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {entry.executedAt && (
                    <div style={{ marginTop: 6, fontFamily: FONT_SANS, fontSize: 10, color: C.textTertiary }}>
                      Executed: {new Date(entry.executedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <button onClick={async () => {
          setLoading(true);
          const data = await fetchExecutions(statusFilter, agentFilter, countRef.current);
          const more = data.length > PAGE_SIZE;
          const trimmed = data.slice(0, PAGE_SIZE);
          setExecutions(prev => [...prev, ...trimmed]);
          countRef.current += trimmed.length;
          setHasMore(more);
          setLoading(false);
        }} disabled={loading} style={{
          marginTop: 12, width: "100%", padding: "8px 12px", borderRadius: 8,
          border: `1px solid ${C.borderDefault}`, background: "transparent",
          color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500,
          cursor: loading ? "wait" : "pointer", textAlign: "center",
        }}>{loading ? "Loading..." : "Load More"}</button>
      )}
    </div>
  );
}
