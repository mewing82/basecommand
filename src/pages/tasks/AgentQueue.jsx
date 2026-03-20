import { useState } from "react";
import {
  Check, ArrowRight, Bot, Clock, ThumbsUp, ThumbsDown, Activity,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../../lib/tokens";
import { Btn } from "../../components/ui/index";
import { getPillarForAction } from "../../lib/pillars";
import { executeAction, dismissAction } from "../../lib/executionEngine";

const URGENCY_COLORS = { critical: C.red, high: C.amber, medium: C.textTertiary };
const URGENCY_ORDER = { critical: 0, high: 1, medium: 2 };

export default function AgentQueue({ actions, onRefresh, navigate, isMobile }) {
  const [selected, setSelected] = useState(new Set());
  const [executing, setExecuting] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Filter
  let filtered = [...actions];
  if (filterUrgency !== "all") filtered = filtered.filter(a => a.urgency === filterUrgency);
  if (filterType !== "all") filtered = filtered.filter(a => a.type === filterType);
  const sorted = filtered.sort((a, b) => (URGENCY_ORDER[a.urgency] || 2) - (URGENCY_ORDER[b.urgency] || 2));

  // Unique action types for filter
  const actionTypes = [...new Set(actions.map(a => a.type).filter(Boolean))];

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === sorted.length) setSelected(new Set());
    else setSelected(new Set(sorted.map(a => a.id)));
  }

  async function handleApprove(action) {
    setExecuting(true);
    try {
      const result = await executeAction(action);
      if (result.success) showToast(`Approved: ${action.title}`);
      else showToast(`Failed: ${result.error}`);
    } finally {
      setExecuting(false);
      onRefresh();
    }
  }

  async function handleDismiss(action) {
    await dismissAction(action);
    onRefresh();
  }

  async function handleBatchApprove() {
    setExecuting(true);
    const toApprove = sorted.filter(a => selected.has(a.id));
    for (const action of toApprove) {
      await executeAction(action);
    }
    setSelected(new Set());
    setExecuting(false);
    onRefresh();
    showToast(`Approved ${toApprove.length} action${toApprove.length !== 1 ? "s" : ""}`);
  }

  async function handleBatchDismiss() {
    const toDismiss = sorted.filter(a => selected.has(a.id));
    for (const action of toDismiss) {
      await dismissAction(action);
    }
    setSelected(new Set());
    onRefresh();
    showToast(`Dismissed ${toDismiss.length} action${toDismiss.length !== 1 ? "s" : ""}`);
  }

  if (sorted.length === 0 && actions.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: C.greenMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Check size={28} style={{ color: C.green }} />
      </div>
      <div style={{ fontFamily: FONT_SANS, fontSize: fs(18, 16, isMobile), fontWeight: 600, color: C.textPrimary }}>Queue is clear</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, maxWidth: 400, lineHeight: 1.6, padding: isMobile ? "0 8px" : 0 }}>
        No agent proposals waiting for review. Run your Renewal Agents to generate actions.
      </div>
      <Btn variant="ghost" onClick={() => navigate("/app/agents/renewal/health-monitor")}>
        <Activity size={14} /> Go to Portfolio Health Monitor
      </Btn>
    </div>
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 999,
          padding: "10px 18px", borderRadius: 8, background: C.bgCard,
          border: `1px solid ${C.green}40`, color: C.green,
          fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600,
          boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
        }}>{toast}</div>
      )}

      {/* Header with batch ops */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Bot size={16} style={{ color: C.aiBlue }} />
        <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
          {sorted.length} proposal{sorted.length !== 1 ? "s" : ""} awaiting review
        </span>
        <span style={{ flex: 1 }} />
        {selected.size > 0 && (
          <div style={{ display: "flex", gap: 6 }}>
            <Btn variant="primary" size="sm" onClick={handleBatchApprove} disabled={executing}>
              <ThumbsUp size={12} /> Approve ({selected.size})
            </Btn>
            <Btn variant="danger" size="sm" onClick={handleBatchDismiss}>
              <ThumbsDown size={12} /> Dismiss ({selected.size})
            </Btn>
          </div>
        )}
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {/* Urgency filter */}
        {["all", "critical", "high", "medium"].map(u => (
          <button key={u} onClick={() => setFilterUrgency(u)} style={{
            padding: "4px 10px", borderRadius: 5, border: `1px solid ${filterUrgency === u ? (URGENCY_COLORS[u] || C.aiBlue) + "40" : C.borderDefault}`,
            background: filterUrgency === u ? (URGENCY_COLORS[u] || C.aiBlue) + "14" : "transparent",
            color: filterUrgency === u ? (URGENCY_COLORS[u] || C.textPrimary) : C.textTertiary,
            fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
          }}>{u === "all" ? "All urgency" : u}</button>
        ))}
        {/* Action type filter */}
        {actionTypes.length > 1 && actionTypes.map(t => (
          <button key={t} onClick={() => setFilterType(filterType === t ? "all" : t)} style={{
            padding: "4px 10px", borderRadius: 5, border: `1px solid ${filterType === t ? C.aiBlue + "40" : C.borderDefault}`,
            background: filterType === t ? C.aiBlueMuted : "transparent",
            color: filterType === t ? C.aiBlue : C.textTertiary,
            fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, cursor: "pointer",
          }}>{t.replace("_", " ")}</button>
        ))}
      </div>

      {/* Select all */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <button onClick={toggleSelectAll} style={{
          width: 18, height: 18, borderRadius: 4, cursor: "pointer", flexShrink: 0,
          border: `2px solid ${selected.size === sorted.length && sorted.length > 0 ? C.aiBlue : C.borderSubtle}`,
          background: selected.size === sorted.length && sorted.length > 0 ? C.aiBlue + "20" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {selected.size === sorted.length && sorted.length > 0 && <Check size={10} style={{ color: C.aiBlue }} />}
        </button>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </span>
      </div>

      {/* Action cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map(action => {
          const urgColor = URGENCY_COLORS[action.urgency] || C.textTertiary;
          const pillar = getPillarForAction(action);
          const isSelected = selected.has(action.id);
          return (
            <div key={action.id} style={{
              background: C.bgCard, border: `1px solid ${isSelected ? C.aiBlue + "40" : C.borderDefault}`,
              borderLeft: `3px solid ${urgColor}60`, borderRadius: 10, overflow: "hidden",
            }}>
              <div style={{ padding: isMobile ? "12px 14px" : "16px 20px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: isMobile ? "wrap" : undefined }}>
                  <button onClick={() => toggleSelect(action.id)} style={{
                    width: 18, height: 18, borderRadius: 4, cursor: "pointer", flexShrink: 0,
                    border: `2px solid ${isSelected ? C.aiBlue : C.borderSubtle}`,
                    background: isSelected ? C.aiBlue + "20" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isSelected && <Check size={10} style={{ color: C.aiBlue }} />}
                  </button>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600, textTransform: "uppercase",
                    color: urgColor, background: urgColor + "18", padding: "2px 6px", borderRadius: 3,
                    letterSpacing: "0.04em",
                  }}>{action.urgency}</span>
                  {pillar && (
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600, textTransform: "uppercase",
                      color: pillar.color, background: pillar.color + "14", padding: "2px 6px", borderRadius: 3,
                      letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 3,
                    }}><pillar.icon size={9} /> {pillar.label}</span>
                  )}
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600, textTransform: "uppercase",
                    color: C.aiBlue, background: C.aiBlueMuted, padding: "2px 6px", borderRadius: 3,
                  }}>{action.type?.replace("_", " ") || "action"}</span>
                  {action.accountName && (
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>
                      {action.accountName}
                    </span>
                  )}
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginLeft: "auto" }}>
                    <Clock size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />
                    {new Date(action.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Title + description */}
                <div style={{ fontFamily: FONT_SANS, fontSize: fs(15, 14, isMobile), fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>
                  {action.title}
                </div>
                {action.description && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 8 }}>
                    {action.description}
                  </div>
                )}

                {/* Reasoning */}
                {action.reasoning && (
                  <div style={{
                    padding: "8px 12px", background: C.bgAI, borderRadius: 6,
                    border: `1px solid ${C.borderAI}`, marginBottom: 12,
                  }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.aiBlue, textTransform: "uppercase", marginBottom: 3 }}>Why this matters</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5 }}>
                      {action.reasoning}
                    </div>
                  </div>
                )}

                {/* Draft preview */}
                {action.draft && (
                  <div style={{
                    padding: "10px 14px", background: C.bgPrimary, borderRadius: 6,
                    border: `1px solid ${C.borderDefault}`, marginBottom: 12,
                    fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.6,
                    maxHeight: 120, overflow: "auto", whiteSpace: "pre-wrap",
                  }}>
                    {action.draft}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="primary" size="sm" onClick={() => handleApprove(action)} disabled={executing}>
                    <ThumbsUp size={13} /> Approve
                  </Btn>
                  <Btn variant="danger" size="sm" onClick={() => handleDismiss(action)}>
                    <ThumbsDown size={13} /> Dismiss
                  </Btn>
                  {action.accountId && (
                    <button onClick={() => navigate("/app/accounts", { state: { accountId: action.accountId } })} style={{
                      marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", background: "transparent", border: `1px solid ${C.borderDefault}`,
                      borderRadius: 6, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary,
                    }}><ArrowRight size={10} /> View Account</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
