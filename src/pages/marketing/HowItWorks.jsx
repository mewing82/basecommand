import { Link } from "react-router-dom";
import {
  ArrowRight, Bot, Cpu, Database, Users, RefreshCw,
  Activity, Brain, FileText, Target, CheckCircle2,
  Upload, Mail, Table, Cloud,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";

// ─── Archetypes ──────────────────────────────────────────────────────────────

const ARCHETYPES = [
  { name: "Power User", probability: 90, strategy: "Expansion play", color: "#34D399" },
  { name: "Enthusiastic Adopter", probability: 80, strategy: "Safe renewal, nurture", color: "#22D3EE" },
  { name: "Convert", probability: 68, strategy: "Targeted upsell", color: "#6366F1" },
  { name: "Explorer", probability: 50, strategy: "Guided adoption", color: "#F59E0B" },
  { name: "Struggler", probability: 28, strategy: "Immediate intervention", color: "#FB923C" },
  { name: "Disconnected", probability: 5, strategy: "Last-resort rescue", color: "#F87171" },
];

export default function HowItWorks() {
  const { isMobile } = useMediaQuery();

  return (
    <div>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        padding: isMobile ? "60px 20px 40px" : "100px 40px 60px", maxWidth: 900, margin: "0 auto", textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 20px", borderRadius: 20, marginBottom: 24,
          background: "rgba(34, 211, 238, 0.10)", border: "1px solid rgba(34, 211, 238, 0.20)",
          fontSize: 14, fontWeight: 600, color: C.aiBlue, fontFamily: FONT_MONO,
          letterSpacing: "0.03em", textTransform: "uppercase",
        }}>
          The AI Revenue Engine
        </div>

        <h1 style={{
          fontFamily: FONT_SANS, fontSize: isMobile ? 32 : 48, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.15,
          color: C.textPrimary, margin: "0 0 20px",
        }}>
          How BaseCommand{" "}
          <span style={{
            background: `linear-gradient(135deg, ${C.aiBlue}, #34D399)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Actually Works</span>
        </h1>

        <p style={{
          fontFamily: FONT_BODY, fontSize: isMobile ? 16 : 18, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.8,
          maxWidth: 600, margin: "0 auto",
        }}>
          A unified intelligence layer — not a dashboard with AI bolted on. Four architectural layers, a continuous flywheel, and AI interventions at every critical revenue moment.
        </p>
      </section>

      {/* ─── The Agentic Flywheel ─────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "32px 20px 60px" : "40px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 20px", borderRadius: 20, marginBottom: 16,
            background: "rgba(34, 211, 238, 0.10)", border: "1px solid rgba(34, 211, 238, 0.20)",
            fontSize: 14, fontWeight: 600, color: C.aiBlue, fontFamily: FONT_MONO,
            letterSpacing: "0.03em", textTransform: "uppercase",
          }}>
            The Agentic Flywheel
          </div>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 24 : 32, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Agents handle the heavy lifting. You close the loop.
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 600, margin: "0 auto",
          }}>
            A continuous cycle that gets smarter with every revolution. Agents parse data, detect signals, and draft actions. Orchestration routes and prioritizes. Humans close the loop on strategy and relationships.
          </p>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 48px 1fr 48px 1fr", alignItems: "center", gap: isMobile ? 16 : 0,
          }}>
            {[
              {
                stage: "Autonomous Agents",
                desc: "Data parsing, signal detection, outreach drafting, risk scoring — running continuously without manual effort.",
                items: ["Parse & structure CRM data", "Score account health in real-time", "Draft personalized renewal emails", "Detect expansion & churn signals"],
                icon: Bot, color: C.aiBlue,
                bg: "rgba(34, 211, 238, 0.06)", border: "rgba(34, 211, 238, 0.20)",
              },
              {
                stage: "Continuous Orchestration",
                desc: "The AI reasoning engine synthesizes signals, routes work to the right agent, and surfaces what needs human attention.",
                items: ["Prioritize the intervention queue", "Route to specialized agents", "Escalate strategic decisions", "Learn from every human action"],
                icon: RefreshCw, color: C.gold,
                bg: C.goldMuted, border: `${C.gold}30`,
              },
              {
                stage: "Human Execution",
                desc: "You handle what humans do best — strategy, relationship building, negotiation, and high-value conversations.",
                items: ["Approve or modify AI drafts", "Lead strategic conversations", "Build champion relationships", "Make judgment calls on saves"],
                icon: Users, color: "#34D399",
                bg: "rgba(52, 211, 153, 0.06)", border: "rgba(52, 211, 153, 0.20)",
              },
            ].flatMap((item, i) => {
              const Icon = item.icon;
              const card = (
                <div key={`card-${i}`} style={{
                  background: item.bg, border: `1px solid ${item.border}`,
                  borderRadius: 16, padding: "28px 22px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${item.color}18`, border: `1px solid ${item.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={20} color={item.color} />
                    </div>
                    <div style={{
                      fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700,
                      color: item.color, letterSpacing: "-0.01em",
                    }}>
                      {item.stage}
                    </div>
                  </div>
                  <p style={{
                    fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary,
                    lineHeight: 1.6, margin: "0 0 14px",
                  }}>
                    {item.desc}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {item.items.map((li, j) => (
                      <div key={j} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary,
                      }}>
                        <div style={{
                          width: 4, height: 4, borderRadius: "50%",
                          background: item.color, flexShrink: 0, opacity: 0.7,
                        }} />
                        {li}
                      </div>
                    ))}
                  </div>
                </div>
              );
              if (i < 2) {
                return [card, (
                  <div key={`arrow-${i}`} style={{ display: isMobile ? "none" : "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                      <path d="M4 12h20M20 6l6 6-6 6" stroke={C.textTertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                    </svg>
                  </div>
                )];
              }
              return [card];
            })}
          </div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px 0 8px",
          }}>
            <svg width="460" height="40" viewBox="0 0 460 40" fill="none" style={{ display: isMobile ? "none" : "block" }}>
              <path d="M420 4 C440 4, 450 14, 450 20 C450 26, 440 36, 420 36 L40 36 C20 36, 10 26, 10 20 C10 14, 20 4, 40 4" stroke={C.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="6 4" opacity="0.3" fill="none" />
              <polygon points="44,0 36,4 44,8" fill={C.textTertiary} opacity="0.4" transform="translate(-2, 0)" />
            </svg>
          </div>
          <div style={{
            textAlign: "center", fontFamily: FONT_MONO, fontSize: 11,
            color: C.textTertiary, opacity: 0.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <RefreshCw size={11} />
            Every cycle makes the system smarter
          </div>
        </div>
      </section>

      {/* ─── AI-Optimized NRR Waterfall ───────────────────────────────────── */}
      <section style={{ padding: isMobile ? "32px 20px 60px" : "40px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 20px", borderRadius: 20, marginBottom: 16,
            background: "rgba(52, 211, 153, 0.10)", border: "1px solid rgba(52, 211, 153, 0.20)",
            fontSize: 14, fontWeight: 600, color: "#34D399", fontFamily: FONT_MONO,
            letterSpacing: "0.03em", textTransform: "uppercase",
          }}>
            AI-Optimized NRR Waterfall
          </div>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: 28, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Three AI intervention points across your revenue waterfall
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 600, margin: "0 auto",
          }}>
            Without AI, revenue leaks at every stage. With BaseCommand, agents intervene at three critical points — boosting expansion, reducing contraction, and catching churn 90 days before renewal.
          </p>
        </div>

        <div style={{
          background: C.bgCard, border: `1px solid ${C.borderDefault}`,
          borderRadius: 20, padding: isMobile ? "24px 16px" : "40px 36px",
        }}>
          {/* Horizontal waterfall flow */}
          <div style={{
            display: "flex", alignItems: isMobile ? "stretch" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 4 : 8,
            marginBottom: 32, justifyContent: "center", flexWrap: isMobile ? "nowrap" : "wrap",
          }}>
            {[
              { label: "Starting MRR", color: C.gold, bg: `${C.gold}20`, border: `${C.gold}30`, width: 140 },
              { label: "+ Expansion", color: "#34D399", bg: "rgba(52, 211, 153, 0.15)", border: "rgba(52, 211, 153, 0.30)", width: 120, ai: "Expansion Scout" },
              { label: "− Contraction", color: C.amber, bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.25)", width: 110, ai: "Value reinforcement" },
              { label: "− Churn", color: C.red, bg: "rgba(248, 113, 113, 0.12)", border: "rgba(248, 113, 113, 0.25)", width: 100, ai: "90-day early warning" },
              { label: "= Net MRR", color: "#34D399", bg: "rgba(52, 211, 153, 0.18)", border: "rgba(52, 211, 153, 0.35)", width: 140 },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: isMobile ? 1 : undefined }}>
                  {isMobile ? null : (item.ai ? (
                    <div style={{
                      fontFamily: FONT_MONO, fontSize: 10, color: C.aiBlue,
                      padding: "4px 10px", borderRadius: 6,
                      background: "rgba(34, 211, 238, 0.10)", border: "1px solid rgba(34, 211, 238, 0.20)",
                      whiteSpace: "nowrap",
                    }}>
                      AI: {item.ai}
                    </div>
                  ) : <div style={{ height: 28 }} />)}
                  <div style={{
                    width: isMobile ? "100%" : item.width, height: isMobile ? 44 : 56, borderRadius: 10,
                    background: item.bg, border: `1px solid ${item.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
                      color: item.color, whiteSpace: "nowrap",
                    }}>
                      {item.label}
                    </span>
                  </div>
                </div>
                {i < 4 && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: isMobile ? 0 : 28, display: isMobile ? "none" : undefined }}>
                    <path d="M4 10h10M11 6l4 4-4 4" stroke={C.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Intervention cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
            {[
              { num: "1", title: "Expansion Scout identifies PQLs", desc: "Agent detects upsell signals — new use cases, team growth, budget expansion language — and triggers expansion workflows before the opportunity window closes.", impact: "Drives NRR above 100%", color: "#34D399" },
              { num: "2", title: "AI detects scope reduction signals", desc: "Agent catches contraction indicators in emails, usage patterns, and support interactions. Prescribes value-reinforcement outreach before the customer downsells.", impact: "Reduces contraction losses", color: C.amber },
              { num: "3", title: "90-day churn early warning", desc: "Predictive health scores flag at-risk accounts 90 days before renewal date. Health Monitor assigns behavioral archetypes and Rescue Planner generates intervention playbooks.", impact: "Prevents up to 71% of churn", color: C.red },
            ].map((item, i) => (
              <div key={i} style={{
                padding: "24px 20px", borderRadius: 14,
                background: C.bgPrimary, border: `1px solid ${C.borderDefault}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: `${item.color}18`, border: `1px solid ${item.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: item.color,
                  }}>
                    {item.num}
                  </div>
                  <div style={{
                    fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
                    color: C.aiBlue, letterSpacing: "0.03em", textTransform: "uppercase",
                  }}>
                    AI Intervention
                  </div>
                </div>
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>{item.desc}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: item.color, fontWeight: 600 }}>{item.impact}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Unified AI Revenue Architecture ──────────────────────────────── */}
      <section style={{ padding: isMobile ? "32px 20px 60px" : "40px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 20px", borderRadius: 20, marginBottom: 16,
            background: C.goldMuted, border: `1px solid ${C.gold}20`,
            fontSize: 14, fontWeight: 600, color: C.gold, fontFamily: FONT_MONO,
            letterSpacing: "0.03em", textTransform: "uppercase",
          }}>
            Unified AI Revenue Architecture
          </div>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 24 : 32, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            You bring the data. We bring the intelligence.
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 640, margin: "0 auto",
          }}>
            Four layers working together. Your telemetry data is the foundation — BaseCommand provides the reasoning engine, the agents, and the human escalation layer on top.
          </p>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Layer 4 */}
          <div style={{
            background: "rgba(52, 211, 153, 0.08)", border: "1px solid rgba(52, 211, 153, 0.20)",
            borderRadius: 14, padding: isMobile ? "16px 16px" : "20px 28px", display: "flex", alignItems: "center", gap: isMobile ? 12 : 20,
          }}>
            <Users size={20} color="#34D399" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700, color: C.textPrimary, marginBottom: 2 }}>Human CSM Escalation</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary }}>High-value strategic execution — relationship building, negotiation, judgment calls.</div>
            </div>
            <div style={{
              padding: "4px 10px", borderRadius: 6,
              background: "rgba(52, 211, 153, 0.12)", border: "1px solid rgba(52, 211, 153, 0.20)",
              fontFamily: FONT_MONO, fontSize: 10, color: "#34D399", whiteSpace: "nowrap",
              display: isMobile ? "none" : undefined,
            }}>BaseCommand</div>
          </div>

          {/* Layer 3 */}
          <div style={{
            background: C.goldMuted, border: `1px solid ${C.gold}25`,
            borderRadius: 14, padding: isMobile ? "16px 16px" : "20px 28px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14 }}>
              <Bot size={20} color={C.gold} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700, color: C.textPrimary, marginBottom: 2 }}>Specialized Agent Fleet</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary }}>Three agent categories — growing library with new agents added continuously.</div>
              </div>
              <div style={{
                padding: "4px 10px", borderRadius: 6,
                background: C.goldMuted, border: `1px solid ${C.gold}25`,
                fontFamily: FONT_MONO, fontSize: 10, color: C.gold, whiteSpace: "nowrap",
                display: isMobile ? "none" : undefined,
              }}>BaseCommand</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 10, paddingLeft: isMobile ? 0 : 40 }}>
              {[
                { name: "Renewal Agents", agents: "Health Monitor, Rescue Planner, Outreach Drafter", color: "#34D399" },
                { name: "Growth Agents", agents: "Expansion Scout, Forecast Engine, Opportunity Brief", color: "#6366F1" },
                { name: "Coaching Agents", agents: "Executive Brief, Meeting Prep, Playbook Builder", color: "#F59E0B" },
              ].map((cat, i) => (
                <div key={i} style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: C.bgPrimary, border: `1px solid ${C.borderDefault}`,
                }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, color: cat.color, marginBottom: 3 }}>{cat.name}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, lineHeight: 1.5 }}>{cat.agents}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Layer 2 */}
          <div style={{
            background: "rgba(34, 211, 238, 0.06)", border: "1px solid rgba(34, 211, 238, 0.20)",
            borderRadius: 14, padding: isMobile ? "16px 16px" : "20px 28px", display: "flex", alignItems: "center", gap: isMobile ? 12 : 20,
          }}>
            <Cpu size={20} color={C.aiBlue} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700, color: C.textPrimary, marginBottom: 2 }}>AI Reasoning Engine</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary }}>Composite health scoring (0–10), behavioral archetype classification, signal synthesis. The shared intelligence layer all agents read from and write to.</div>
            </div>
            <div style={{
              padding: "4px 10px", borderRadius: 6,
              background: "rgba(34, 211, 238, 0.10)", border: "1px solid rgba(34, 211, 238, 0.20)",
              fontFamily: FONT_MONO, fontSize: 10, color: C.aiBlue, whiteSpace: "nowrap",
              display: isMobile ? "none" : undefined,
            }}>BaseCommand</div>
          </div>

          {/* Layer 1 */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            borderRadius: 14, padding: isMobile ? "16px 16px" : "20px 28px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14 }}>
              <Database size={20} color={C.textTertiary} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700, color: C.textPrimary, marginBottom: 2 }}>Your Telemetry Data</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary }}>The foundation. Bring it any way you can — the more data flows in, the smarter the engine gets.</div>
              </div>
              <div style={{
                padding: "4px 10px", borderRadius: 6,
                background: C.bgSurface, border: `1px solid ${C.borderSubtle}`,
                fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, whiteSpace: "nowrap",
                display: isMobile ? "none" : undefined,
              }}>You connect</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingLeft: isMobile ? 0 : 40 }}>
              {[
                { name: "CSV / Paste", icon: Upload, live: true },
                { name: "Gmail", icon: Mail, live: true },
                { name: "Outlook", icon: Mail, live: true },
                { name: "Manual Entry", icon: Table, live: true },
              ].map((src, i) => {
                const Icon = src.icon;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 10px", borderRadius: 6,
                    background: C.bgPrimary, border: `1px solid ${C.borderDefault}`,
                  }}>
                    <Icon size={11} color={C.green} />
                    <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.textSecondary }}>{src.name}</span>
                    <CheckCircle2 size={9} color={C.green} />
                  </div>
                );
              })}
              {["HubSpot", "Salesforce", "Snowflake", "BigQuery", "Zendesk", "Intercom"].map((name, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 10px", borderRadius: 6,
                  background: C.bgPrimary, border: `1px dashed ${C.borderSubtle}`,
                }}>
                  <Cloud size={11} color={C.textTertiary} style={{ opacity: 0.5 }} />
                  <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary }}>{name}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, opacity: 0.6 }}>soon</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Behavioral Archetypes ────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "32px 20px 60px" : "40px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 22 : 28, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Not all accounts are the same
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 560, margin: "0 auto",
          }}>
            The AI Reasoning Engine auto-classifies each account into behavioral archetypes — each requiring a fundamentally different renewal strategy.
          </p>
        </div>

        <div style={{
          background: C.bgCard, border: `1px solid ${C.borderDefault}`,
          borderRadius: 16, padding: isMobile ? "16px" : "32px",
        }}>
          {ARCHETYPES.map((arch, i) => (
            <div key={i} style={{
              display: "flex", alignItems: isMobile ? "flex-start" : "center",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 8 : 20,
              padding: "16px 0",
              borderBottom: i < ARCHETYPES.length - 1 ? `1px solid ${C.borderDefault}` : "none",
            }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: arch.color, minWidth: isMobile ? "auto" : 180 }}>{arch.name}</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, width: isMobile ? "100%" : undefined }}>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: C.bgPrimary }}>
                  <div style={{
                    width: `${arch.probability}%`, height: "100%", borderRadius: 4,
                    background: `linear-gradient(90deg, ${arch.color}60, ${arch.color})`,
                  }} />
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, color: arch.color, minWidth: 40, textAlign: "right" }}>{arch.probability}%</span>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, minWidth: isMobile ? "auto" : 180, textAlign: isMobile ? "left" : "right" }}>{arch.strategy}</div>
            </div>
          ))}
          <div style={{
            display: "flex", justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row", gap: isMobile ? 4 : 0,
            marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.borderDefault}`,
          }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>Behavioral archetype</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>Renewal probability → AI strategy</span>
          </div>
        </div>
      </section>

      {/* ─── Next Step ────────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "0 20px 60px" : "0 40px 80px", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          background: C.bgCard, border: `1px solid ${C.borderDefault}`,
          borderRadius: 20, padding: isMobile ? "32px 20px" : "48px 40px",
        }}>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 22 : 28, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Ready to see the implementation plan?
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 15, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            marginBottom: 28,
          }}>
            4 weeks to live. ROI math on your actual portfolio. Free agents to try right now.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link to="/get-started" style={{
              padding: "14px 32px", borderRadius: 10,
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
              color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
              textDecoration: "none", boxShadow: `0 4px 20px ${C.goldGlow}`,
              display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44,
            }}>
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
