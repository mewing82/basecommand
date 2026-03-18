/**
 * Demo account data for onboarding "Explore with demo data" path.
 * Matches the exact schema used by renewalStore.saveAccount().
 */
import { renewalStore } from "./storage";

// ─── Onboarding localStorage keys ────────────────────────────────────────────
export const ONBOARDING = {
  step: "bc-onboarding-step",
  profile: "bc-onboarding-profile",
  demo: "bc-onboarding-demo",
  plan: "bc-signup-plan",
  checklist: "bc-onboarding-checklist",
  dismissed: "bc-onboarding-dismissed",
};

// ─── Helper: future date from today ─────────────────────────────────────────
function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function pastDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ─── Sample accounts ─────────────────────────────────────────────────────────
export const DEMO_ACCOUNTS = [
  {
    name: "Meridian Health Systems",
    arr: 420000,
    renewalDate: futureDate(18),
    riskLevel: "high",
    contacts: [{ name: "Sarah Chen", role: "VP Operations", email: "schen@meridianhealth.com" }],
    summary: "Multi-year contract, but engagement dropped 40% last quarter. Champion left the company in January. New stakeholder unresponsive to last 3 outreach attempts.",
  },
  {
    name: "TechForge Solutions",
    arr: 185000,
    renewalDate: futureDate(12),
    riskLevel: "high",
    contacts: [{ name: "Marcus Rivera", role: "CTO", email: "mrivera@techforge.io" }],
    summary: "Filed 14 support tickets in 60 days. Evaluating competitor products. Wants enterprise features we don't have yet. Renewal at risk without executive intervention.",
  },
  {
    name: "Pinnacle Financial Group",
    arr: 310000,
    renewalDate: futureDate(45),
    riskLevel: "medium",
    contacts: [{ name: "James Park", role: "Director of IT", email: "jpark@pinnaclefg.com" }],
    summary: "Satisfied overall but pushing for a 15% discount at renewal. Using 70% of licensed seats. Expansion opportunity if we can demonstrate ROI to their CFO.",
  },
  {
    name: "Velocity Commerce",
    arr: 95000,
    renewalDate: futureDate(30),
    riskLevel: "medium",
    contacts: [{ name: "Lisa Nakamura", role: "Head of Product", email: "lnakamura@velocitycom.co" }],
    summary: "Good product fit but budget constrained after recent layoffs. Team size went from 45 to 28. May need to downgrade from Enterprise to Pro tier.",
  },
  {
    name: "Atlas Digital Agency",
    arr: 62000,
    renewalDate: futureDate(60),
    riskLevel: "low",
    contacts: [{ name: "Chris Hartley", role: "Managing Director", email: "chartley@atlasdigital.com" }],
    summary: "Power user. Highest adoption scores in portfolio. Already asking about new features coming in Q3. Strong expansion candidate — want to add 3 more seats.",
  },
  {
    name: "NovaBridge Consulting",
    arr: 148000,
    renewalDate: futureDate(75),
    riskLevel: "low",
    contacts: [{ name: "Priya Sharma", role: "COO", email: "psharma@novabridge.com" }],
    summary: "Renewed last year with a 12% uplift. Active in community forums. Referred two new customers. Executive sponsor is a strong advocate internally.",
  },
  {
    name: "Ember Analytics",
    arr: 225000,
    renewalDate: futureDate(22),
    riskLevel: "medium",
    contacts: [{ name: "David Kim", role: "VP Engineering", email: "dkim@emberanalytics.com" }],
    summary: "Integration issues causing frustration. Their team built workarounds instead of using our native features. Need a technical deep-dive to re-engage.",
  },
  {
    name: "Clearpath Logistics",
    arr: 38000,
    renewalDate: futureDate(90),
    riskLevel: "low",
    contacts: [{ name: "Rachel Torres", role: "Operations Manager", email: "rtorres@clearpath.io" }],
    summary: "Small account but highly engaged. 100% seat utilization. Has been steadily adding users each quarter. Natural expansion path to their parent company.",
  },
];

// ─── Load demo data into storage ─────────────────────────────────────────────
export async function loadDemoData() {
  let count = 0;
  for (const demo of DEMO_ACCOUNTS) {
    const account = {
      id: `demo-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: demo.name,
      arr: demo.arr,
      renewalDate: demo.renewalDate,
      riskLevel: demo.riskLevel,
      contacts: demo.contacts || [],
      summary: demo.summary || "",
      tags: ["demo"],
      lastActivity: pastDate(Math.floor(Math.random() * 14) + 1),
      createdAt: new Date().toISOString(),
    };
    await renewalStore.saveAccount(account);
    count++;
  }
  localStorage.setItem(ONBOARDING.demo, "true");
  return count;
}
