import { Link } from "react-router-dom";
import {
  TrendingDown, AlertTriangle, BarChart3, ArrowRight,
  ChevronRight, Cloud, Activity, Database, FileText,
  Brain,
} from "lucide-react";
import { C, FONT_SANS, FONT_BODY } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { usePageMeta, PAGE_SEO } from "../../lib/seo";

export default function Why() {
  const { isMobile } = useMediaQuery();
  usePageMeta(PAGE_SEO.why);

  return (
    <article>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        padding: isMobile ? "60px 20px 40px" : "100px 40px 60px", maxWidth: 900, margin: "0 auto", textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 20px", borderRadius: 20, marginBottom: 24,
          background: "rgba(248, 113, 113, 0.10)", border: "1px solid rgba(248, 113, 113, 0.20)",
          fontSize: isMobile ? 12 : 14, fontWeight: 500, color: C.red, fontFamily: FONT_SANS,
          flexWrap: "wrap", justifyContent: "center", maxWidth: "100%", textAlign: "center",
        }}>
          <AlertTriangle size={14} />
          The data is clear. The playbook has changed.
        </div>

        <h1 style={{
          fontFamily: FONT_SANS, fontSize: isMobile ? 32 : 48, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.15,
          color: C.textPrimary, margin: "0 0 20px",
        }}>
          The Human Playbook for{" "}
          <span style={{
            background: `linear-gradient(135deg, ${C.red}, #FB923C)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Renewals Is Broken</span>
        </h1>

        <p style={{
          fontFamily: FONT_BODY, fontSize: isMobile ? 16 : 18, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.8,
          maxWidth: 640, margin: "0 auto",
        }}>
          SaaS companies are spending more on Customer Success than ever — and retention rates are still declining. The problem isn't effort. It's architecture. You need a unified intelligence layer, not more headcount.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : undefined, marginTop: 28 }}>
          <Link to="/how-it-works" style={{
            padding: "12px 28px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.aiBlue}, #16A368)`,
            color: "#FFFFFF", fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
            minHeight: 44,
          }}>
            See the solution <ArrowRight size={14} />
          </Link>
          <Link to="/signup" style={{
            padding: "12px 28px", borderRadius: 10,
            background: "transparent", border: `1px solid ${C.borderSubtle}`,
            color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
            minHeight: 44,
          }}>
            Start free trial
          </Link>
        </div>

        {/* SEO detail — below the fold */}
        <p style={{
          fontFamily: FONT_BODY, fontSize: isMobile ? 13 : 14, color: C.textSecondary, lineHeight: 1.7,
          maxWidth: 620, margin: "28px auto 0", padding: "12px 16px",
          background: "rgba(0,0,0,0.02)", borderRadius: 8, border: `1px solid rgba(0,0,0,0.04)`,
        }}>
          <strong style={{ color: C.textPrimary }}>Traditional renewal playbooks have broken down.</strong> 58% of SaaS companies report lower NRR despite record CS spending. AI-powered renewal operations detect risk 90 days earlier, prevent up to 71% of churn, and turn retention from cost center to growth engine.
        </p>
      </section>

      {/* ─── The Problem ──────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "32px 20px 60px" : "40px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 22 : 28, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Sound familiar?
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 15 : 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 520, margin: "0 auto",
          }}>
            Every renewal team hits the same walls. The question is whether you keep pushing harder or change the architecture.
          </p>
        </div>

        {/* Failure mode cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            {
              icon: Activity,
              title: "You can't monitor everything",
              problem: "Manual health checks can't run 24/7 across hundreds of accounts. By the time you spot a problem, it's already a fire.",
              color: C.red,
            },
            {
              icon: Database,
              title: "Your CRM is already stale",
              problem: "Data is outdated the moment it's entered. Reality moves faster than any human can update fields.",
              color: C.amber,
            },
            {
              icon: FileText,
              title: "Your outreach is generic",
              problem: "Renewal emails are templated, not personalized to each account's health, history, and context. Customers can tell.",
              color: "#FB923C",
            },
            {
              icon: Brain,
              title: "You see churn too late",
              problem: "Churn signals are visible in hindsight, invisible in foresight. By the time you notice, the customer has already decided.",
              color: "#DC4A3D",
            },
            {
              icon: TrendingDown,
              title: "Expansion hides in plain sight",
              problem: "Upsell opportunities are buried in usage data nobody's watching. Revenue growth goes uncaptured quarter after quarter.",
              color: "#8B5CF6",
            },
            {
              icon: BarChart3,
              title: "QBR prep is a nightmare",
              problem: "Hours of copy-paste from 6 different tools to build a single exec brief. Time that should be spent on strategy.",
              color: C.aiBlue,
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                borderRadius: 14, padding: isMobile ? "16px 14px" : "24px 22px",
                borderLeft: `3px solid ${item.color}50`,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
                }}>
                  <Icon size={18} color={item.color} />
                  <div style={{
                    fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700,
                    color: C.textPrimary, letterSpacing: "-0.01em",
                  }}>
                    {item.title}
                  </div>
                </div>
                <div style={{
                  fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary,
                  lineHeight: 1.7,
                }}>
                  {item.problem}
                </div>
              </div>
            );
          })}
        </div>

        {/* Supporting stats — horizontal strip */}
        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12,
        }}>
          {[
            { value: "58%", label: "of SaaS companies report declining NRR", color: C.red },
            { value: "↑ Spend ↓ Results", label: "CS budgets at all-time highs, retention still falling", color: C.amber },
            { value: "80%", label: "of outcomes predicted by usage data alone", color: C.aiBlue },
          ].map((stat, i) => (
            <div key={i} style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 10, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                fontFamily: FONT_SANS, fontSize: isMobile ? 16 : 20, fontWeight: 700,
                color: stat.color, flexShrink: 0, minWidth: isMobile ? "auto" : 70,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, lineHeight: 1.5,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        {/* Mid-page CTA */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link to="/how-it-works" style={{
            padding: "12px 28px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.aiBlue}, #16A368)`,
            color: "#FFFFFF", fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
            minHeight: 44,
          }}>
            See how BaseCommand solves this <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ─── The Shift ──────────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "0 20px 60px" : "0 40px 80px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 22 : 28, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Traditional Renewals vs. AI-Driven RevOps
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 14 : 16, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 520, margin: "0 auto",
          }}>
            The industry is shifting from reactive firefighting to proactive, agentic revenue operations. Where does your team fall?
          </p>
        </div>

        {(() => {
          const rows = [
            { dimension: "Timing", old: "Reactive", oldSub: "30 days to renewal", new_: "Proactive", newSub: "Predictive signals 90–180 days out" },
            { dimension: "Data Scope", old: "Siloed", oldSub: "CRM notes, NPS surveys", new_: "Unified", newSub: "160 billion telemetry points" },
            { dimension: "Action Engine", old: "Manual", oldSub: "Spreadsheets, generic emails", new_: "Agentic", newSub: "Automated workflows, AI-drafted outreach" },
            { dimension: "Core Focus", old: "Firefighting", oldSub: "Saving the churn", new_: "Strategic Growth", newSub: "Surfacing the expansion" },
          ];
          return isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {rows.map((row, i) => (
                <div key={i} style={{
                  background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                  borderRadius: 12, padding: "16px",
                }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600, color: C.gold, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
                    {row.dimension}
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: C.bgPrimary }}>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textTertiary, opacity: 0.7, marginBottom: 2 }}>{row.old}</div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, opacity: 0.5, lineHeight: 1.4 }}>{row.oldSub}</div>
                    </div>
                    <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "rgba(6, 149, 114, 0.04)", border: "1px solid rgba(6, 149, 114, 0.10)" }}>
                      <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>{row.new_}</div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.aiBlue, lineHeight: 1.4 }}>{row.newSub}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 16, overflow: "hidden",
            }}>
              <div style={{
                display: "grid", gridTemplateColumns: "140px 1fr 1fr",
                borderBottom: `1px solid ${C.borderDefault}`,
              }}>
                <div style={{ padding: "16px 24px" }} />
                <div style={{
                  padding: "16px 24px", fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700,
                  color: C.textTertiary, borderLeft: `1px solid ${C.borderDefault}`,
                }}>
                  Traditional Renewals
                </div>
                <div style={{
                  padding: "16px 24px", fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700,
                  color: C.aiBlue, borderLeft: `1px solid ${C.borderDefault}`,
                  background: "rgba(6, 149, 114, 0.04)",
                }}>
                  AI-Driven RevOps
                </div>
              </div>
              {rows.map((row, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "140px 1fr 1fr",
                  borderBottom: i < 3 ? `1px solid ${C.borderDefault}` : "none",
                }}>
                  <div style={{
                    padding: "18px 24px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600,
                    color: C.gold, display: "flex", alignItems: "center",
                  }}>
                    {row.dimension}
                  </div>
                  <div style={{ padding: "18px 24px", borderLeft: `1px solid ${C.borderDefault}` }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textTertiary, opacity: 0.7, marginBottom: 2 }}>{row.old}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, opacity: 0.5 }}>{row.oldSub}</div>
                  </div>
                  <div style={{
                    padding: "18px 24px", borderLeft: `1px solid ${C.borderDefault}`,
                    background: "rgba(6, 149, 114, 0.04)",
                  }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>{row.new_}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.aiBlue }}>{row.newSub}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </section>

      {/* ─── The Opportunity ──────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "0 20px 60px" : "0 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 22 : 28, fontWeight: 700,
            color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 12px",
          }}>
            Now the good news
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 15 : 17, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6,
            maxWidth: 480, margin: "0 auto",
          }}>
            Small retention improvements compound into massive results. And AI can predict churn before humans even see it coming.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
          {[
            {
              value: "+5%", headline: "retention improvement",
              detail: "drives a 25–95% profitability boost and higher valuation multiples",
              color: C.green,
            },
            {
              value: "90%", headline: "churn prediction accuracy",
              detail: "using behavioral signals — up to 12 months before the renewal date",
              color: C.gold,
            },
            {
              value: "71%", headline: "of churn is preventable",
              detail: "when AI and human effort work together — neither alone comes close",
              color: C.aiBlue,
            },
            {
              value: "6.3–6.9x", headline: "EV/TTM revenue multiples",
              detail: "for AI-powered SaaS companies vs. 3–4x for traditional operators",
              color: "#8B5CF6",
            },
          ].map((stat, i) => (
            <div key={i} style={{
              background: C.bgCard, border: `1px solid ${C.borderDefault}`,
              borderRadius: 14, padding: isMobile ? "20px 16px" : "28px 28px",
              display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "flex-start", gap: isMobile ? 8 : 20,
            }}>
              <div style={{
                fontFamily: FONT_SANS, fontSize: isMobile ? 24 : 28, fontWeight: 700,
                color: stat.color, letterSpacing: "-0.03em",
                flexShrink: 0, minWidth: 80,
              }}>
                {stat.value}
              </div>
              <div>
                <div style={{
                  fontFamily: FONT_SANS, fontSize: isMobile ? 14 : 16, fontWeight: 700,
                  color: C.textPrimary, marginBottom: 4, letterSpacing: "-0.01em",
                }}>
                  {stat.headline}
                </div>
                <div style={{
                  fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.6,
                }}>
                  {stat.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: `linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(224, 155, 32, 0.08))`,
          border: `1px solid rgba(52, 211, 153, 0.15)`,
          borderRadius: 14, padding: isMobile ? "20px 20px" : "24px 32px", marginTop: 20, textAlign: "center",
        }}>
          <p style={{
            fontFamily: FONT_SANS, fontSize: isMobile ? 15 : 18, fontWeight: 600,
            color: C.textPrimary, margin: 0, lineHeight: 1.6,
          }}>
            "AI doesn't replace Customer Success — it makes them superhuman."
          </p>
        </div>
      </section>

      {/* ─── Next Steps ───────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "0 20px 60px" : "0 40px 80px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16,
        }}>
          <Link to="/how-it-works" style={{
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            borderRadius: 16, padding: isMobile ? "20px 16px" : "32px 28px",
            textDecoration: "none", transition: "border-color 0.15s, box-shadow 0.15s",
            minHeight: 44,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6, 149, 114, 0.30)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(6, 149, 114, 0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{
              fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600,
              color: C.aiBlue, letterSpacing: "0.05em", textTransform: "uppercase",
              marginBottom: 10,
            }}>
              Next: How it works
            </div>
            <div style={{
              fontFamily: FONT_SANS, fontSize: isMobile ? 17 : 20, fontWeight: 700,
              color: C.textPrimary, marginBottom: 8, letterSpacing: "-0.02em",
            }}>
              The AI Revenue Engine
            </div>
            <div style={{
              fontFamily: FONT_BODY, fontSize: isMobile ? 14 : 15, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6, marginBottom: 16,
            }}>
              See the Agentic Flywheel, NRR Waterfall, unified architecture, and behavioral archetypes that power BaseCommand.
            </div>
            <div style={{
              fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.aiBlue,
              display: "flex", alignItems: "center", gap: 6, minHeight: 44,
            }}>
              Explore the framework <ArrowRight size={14} />
            </div>
          </Link>

          <Link to="/get-started" style={{
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            borderRadius: 16, padding: isMobile ? "20px 16px" : "32px 28px",
            textDecoration: "none", transition: "border-color 0.15s, box-shadow 0.15s",
            minHeight: 44,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.gold}40`; e.currentTarget.style.boxShadow = `0 8px 32px ${C.goldGlow}`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{
              fontFamily: FONT_SANS, fontSize: 11, fontWeight: 600,
              color: C.gold, letterSpacing: "0.05em", textTransform: "uppercase",
              marginBottom: 10,
            }}>
              Ready to act?
            </div>
            <div style={{
              fontFamily: FONT_SANS, fontSize: isMobile ? 17 : 20, fontWeight: 700,
              color: C.textPrimary, marginBottom: 8, letterSpacing: "-0.02em",
            }}>
              Get Started in 4 Weeks
            </div>
            <div style={{
              fontFamily: FONT_BODY, fontSize: isMobile ? 14 : 15, color: C.textPrimary, fontWeight: 400, opacity: 0.75, lineHeight: 1.6, marginBottom: 16,
            }}>
              Implementation blueprint, ROI calculator, free agents on agent.ai, and founding member pricing.
            </div>
            <div style={{
              fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.gold,
              display: "flex", alignItems: "center", gap: 6, minHeight: 44,
            }}>
              See the plan <ArrowRight size={14} />
            </div>
          </Link>
        </div>
      </section>
    </article>
  );
}
