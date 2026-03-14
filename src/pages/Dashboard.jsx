import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, AlertTriangle, Check, Diamond, Grid3X3, ArrowRight } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";
import { callAI } from "../lib/ai";
import { store } from "../lib/storage";
import { getGreeting, isOverdue } from "../lib/utils";
import { useEntityStore } from "../store/entityStore";

const USER_NAME = "Michael";

export default function Dashboard() {
  const navigate = useNavigate();
  const { decisions, tasks, priorities, projects } = useEntityStore();

  const CACHE_KEY = `bc2-${store._ws}-copilot-dashboard`;
  const [insight, setInsight] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const hasData = tasks.length > 0 || decisions.length > 0 || projects.length > 0;

  const completedTasks = tasks.filter(t => t.status === "complete");
  const completedThisWeek = completedTasks.filter(t => {
    if (!t.updatedAt) return false;
    const d = new Date(t.updatedAt);
    const now = new Date();
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1); mon.setHours(0,0,0,0);
    return d >= mon;
  });
  const activeTasks = tasks.filter(t => !["complete", "cancelled"].includes(t.status));
  const overdueTasks = activeTasks.filter(t => isOverdue(t.dueDate));
  const openDecisions = decisions.filter(d => ["draft", "analyzing"].includes(d.status));
  const activeProjects = projects.filter(p => p.status !== "complete" && p.status !== "archived");

  async function generateInsights() {
    setLoading(true); setError("");
    try {
      const snapshot = {
        tasks: tasks.slice(-30).map(t => ({ title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate, updatedAt: t.updatedAt, subtasks: (t.subtasks || []).length, subtasksDone: (t.subtasks || []).filter(s => s.done).length })),
        decisions: decisions.slice(-15).map(d => ({ title: d.title, status: d.status, createdAt: d.createdAt, updatedAt: d.updatedAt })),
        priorities: priorities.map(p => ({ title: p.title, status: p.status, healthScore: p.healthScore, timeframe: p.timeframe })),
        projects: projects.slice(-8).map(p => ({ title: p.title, status: p.status, description: (p.description || "").slice(0, 100) })),
        stats: { totalTasks: tasks.length, completedTasks: completedTasks.length, completedThisWeek: completedThisWeek.length, overdueTasks: overdueTasks.length, openDecisions: openDecisions.length, activeProjects: activeProjects.length },
        today: today.toISOString().split("T")[0],
        dayOfWeek: today.toLocaleDateString("en-US", { weekday: "long" }),
      };

      const prompt = `You are BC, an AI-powered renewal operations co-pilot. Analyze this user's current state and return a JSON response that powers their dashboard. Be direct, strategic, and personal.

DATA:
${JSON.stringify(snapshot)}

Return ONLY valid JSON (no markdown fences):
{
  "brief": "3-4 sentence strategic read of their situation right now. Reference actual task/decision names. End with one forward-looking insight.",
  "moves": [
    { "action": "Specific thing to do (reference actual entity name)", "rationale": "Why this matters RIGHT NOW. 1-2 sentences.", "type": "task|decision|priority|project", "nav": "tasks|decisions|priorities|projects" }
  ],
  "momentum": "1-2 sentence read on their pace and energy. Specific numbers.",
  "projectSpotlights": [
    { "title": "Project name", "read": "2-3 sentence strategic assessment.", "progress": 65, "tasksRemaining": 5 }
  ]
}

RULES:
- "moves" should be 2-3 items, ordered by impact. Think strategically.
- "projectSpotlights" should be 1-2 active projects. Skip if none.
- Be specific — use real names from the data.
- Tone: confident co-pilot, not corporate dashboard.`;

      const response = await callAI([{ role: "user", content: prompt }], undefined, 2000);
      let text = String(response).trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(text);
      parsed._generatedAt = Date.now();
      setInsight(parsed);
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (hasData && !insight && !loading) generateInsights();
  }, [hasData]);

  const cachedAgo = insight?._generatedAt
    ? (() => { const m = Math.floor((Date.now() - insight._generatedAt) / 60000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`; })()
    : null;

  const onNavigate = (view) => navigate(view === "dashboard" ? "/" : `/${view}`);

  // ─── Empty State ───
  if (!hasData) {
    return (
      <div style={{ padding: "80px 40px", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: "0 auto 24px",
          background: `linear-gradient(135deg, ${C.goldMuted}, ${C.aiBlueMuted})`,
          border: `1px solid ${C.gold}20`,
          display: "flex", alignItems: "center", justifyContent: "center", color: C.gold,
        }}><Sparkles size={28} /></div>
        <h1 style={{ fontFamily: FONT_SANS, fontSize: 28, fontWeight: 700, color: C.textPrimary, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
          Your renewal command center is ready
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.textSecondary, lineHeight: 1.7, maxWidth: 460, margin: "0 auto 36px" }}>
          BaseCommand is your AI-powered renewal operations partner. Import your portfolio, automate renewal workflows, and surface expansion opportunities — all from one platform.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => navigate("/projects")} style={{
            padding: "12px 28px", borderRadius: 10, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`, color: C.bgPrimary,
            fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, boxShadow: `0 4px 16px ${C.goldGlow}`,
            transition: "all 0.15s ease",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >Create a Project</button>
          <button onClick={() => navigate("/projects")} style={{
            padding: "12px 28px", borderRadius: 10, border: `1px solid ${C.borderDefault}`, cursor: "pointer",
            background: "transparent", color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500,
            transition: "all 0.15s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.color = C.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}
          >Import a Plan</button>
        </div>
      </div>
    );
  }

  // ─── Main Dashboard ───
  return (
    <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em" }}>
            {getGreeting()}, {USER_NAME}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 6, fontWeight: 400 }}>{dateStr}</div>
        </div>
        <button onClick={generateInsights} disabled={loading} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10,
          border: `1px solid ${loading ? C.aiBlue + "30" : C.borderDefault}`,
          background: loading ? C.aiBlueMuted : "transparent",
          cursor: loading ? "wait" : "pointer",
          fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: loading ? C.aiBlue : C.textSecondary,
          transition: "all 0.2s ease",
        }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.color = C.textPrimary; } }}
          onMouseLeave={e => { if (!loading) { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; } }}
        >
          <span style={{ color: loading ? C.aiBlue : C.gold, animation: loading ? "aiPulse 2s ease-in-out infinite" : "none", display: "flex", alignItems: "center" }}><Sparkles size={14} /></span>
          {loading ? "Analyzing..." : "Refresh"}
          {cachedAgo && !loading && <span style={{ color: C.textTertiary, fontSize: 12 }}>· {cachedAgo}</span>}
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Completed this week", value: completedThisWeek.length, total: activeTasks.length + completedThisWeek.length, color: C.green, icon: <TrendingUp size={11} /> },
          { label: "Overdue", value: overdueTasks.length, total: null, color: overdueTasks.length > 0 ? C.red : C.green, icon: overdueTasks.length > 0 ? <AlertTriangle size={11} /> : <Check size={11} /> },
          { label: "Open decisions", value: openDecisions.length, total: null, color: openDecisions.length > 3 ? C.amber : C.blue, icon: <Diamond size={11} /> },
          { label: "Active projects", value: activeProjects.length, total: null, color: C.gold, icon: <Grid3X3 size={11} /> },
        ].map((stat, i) => (
          <div key={i} style={{
            background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12, padding: "18px 16px",
            transition: "border-color 0.15s ease",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.borderSubtle}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.borderDefault}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textTertiary, fontWeight: 500 }}>{stat.label}</span>
              <span style={{ fontSize: 11, color: stat.color, opacity: 0.6 }}>{stat.icon}</span>
            </div>
            <span style={{ fontFamily: FONT_MONO, fontSize: 32, fontWeight: 700, color: stat.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{stat.value}</span>
            {stat.total !== null && stat.total > 0 && (
              <div style={{ marginTop: 10, width: "100%", height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${(stat.value / stat.total) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${stat.color}, ${stat.color}AA)`, borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <div style={{ color: C.red, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={14} /> {error}</div>}

      {/* Strategic Brief */}
      <div style={{
        background: `linear-gradient(135deg, ${C.bgAI} 0%, ${C.bgCard} 100%)`,
        border: `1px solid ${C.borderAI}`, borderLeft: `2px solid ${C.aiBlue}40`,
        borderRadius: 14, padding: "24px 26px", marginBottom: 28, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${C.aiBlueGlow} 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, position: "relative" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.aiBlueMuted, border: `1px solid ${C.aiBlue}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={12} color={C.aiBlue} />
          </div>
          <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>Strategic Brief</span>
          {cachedAgo && <span style={{ marginLeft: "auto", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{cachedAgo}</span>}
        </div>

        {loading && !insight ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.aiBlue, animation: "aiPulse 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Analyzing your tasks, decisions, and projects...</span>
          </div>
        ) : insight?.brief ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.8, letterSpacing: "-0.005em" }}>{insight.brief}</div>
        ) : (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary, lineHeight: 1.7 }}>Click "Refresh" to get BC's strategic assessment.</div>
        )}

        {insight?.momentum && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.borderDefault}`, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.7, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <TrendingUp size={12} style={{ color: C.gold, marginTop: 2, flexShrink: 0 }} />
            <span>{insight.momentum}</span>
          </div>
        )}
      </div>

      {/* Recommended Moves */}
      {insight?.moves && insight.moves.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>Recommended moves</span>
            <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insight.moves.map((move, i) => (
              <div key={i} onClick={() => move.nav && onNavigate(move.nav)} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12,
                padding: "16px 20px", cursor: move.nav ? "pointer" : "default",
                display: "flex", gap: 16, alignItems: "flex-start", transition: "all 0.15s ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold + "40"; e.currentTarget.style.background = C.bgCardHover; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.background = C.bgCard; }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: C.goldMuted, border: `1px solid ${C.gold}20`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: C.gold,
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, marginBottom: 4, letterSpacing: "-0.01em" }}>{move.action}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>{move.rationale}</div>
                </div>
                {move.nav && <ArrowRight size={16} style={{ color: C.textTertiary, flexShrink: 0, marginTop: 2, opacity: 0.5 }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Spotlights */}
      {insight?.projectSpotlights && insight.projectSpotlights.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>Project spotlight</span>
            <div style={{ flex: 1, height: 1, background: C.borderDefault }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: insight.projectSpotlights.length === 1 ? "1fr" : "1fr 1fr", gap: 12 }}>
            {insight.projectSpotlights.map((proj, i) => (
              <div key={i} onClick={() => navigate("/projects")} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12,
                padding: "20px 22px", cursor: "pointer", transition: "all 0.15s ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>{proj.title}</span>
                  {proj.progress !== undefined && <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, color: proj.progress >= 75 ? C.green : proj.progress >= 40 ? C.gold : C.textTertiary }}>{proj.progress}%</span>}
                </div>
                {proj.progress !== undefined && (
                  <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ width: `${proj.progress}%`, height: "100%", background: `linear-gradient(90deg, ${proj.progress >= 75 ? C.green : proj.progress >= 40 ? C.gold : C.blue}, ${proj.progress >= 75 ? C.green : proj.progress >= 40 ? C.gold : C.blue}AA)`, borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                  </div>
                )}
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.7 }}>{proj.read}</div>
                {proj.tasksRemaining !== undefined && (
                  <div style={{ marginTop: 12, fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{proj.tasksRemaining} task{proj.tasksRemaining !== 1 ? "s" : ""} remaining</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && insight && (
        <div style={{ textAlign: "center", padding: "16px 0", fontFamily: FONT_BODY, fontSize: 13, color: C.aiBlue, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.aiBlue, animation: "aiPulse 2s ease-in-out infinite" }} />
          BC is refreshing your intelligence...
        </div>
      )}
    </div>
  );
}
