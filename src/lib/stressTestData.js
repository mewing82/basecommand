/**
 * Stress test dataset — 20 realistic accounts with context for end-to-end validation.
 * Run via browser console: import('/src/lib/stressTestData.js').then(m => m.loadStressTest())
 * Or trigger from /app/admin by adding a button (future enhancement).
 */
import { renewalStore } from "./storage";

function futureDate(days) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function pastDate(days) {
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ─── 20 Accounts (varied risk, ARR, renewal dates, archetypes) ───────────────
const ACCOUNTS = [
  // HIGH RISK — Imminent renewals, declining engagement
  { name: "Meridian Health Systems", arr: 420000, renewalDate: futureDate(14), riskLevel: "high",
    contacts: [{ name: "Sarah Chen", role: "VP Operations", email: "schen@meridianhealth.com" }],
    summary: "Multi-year contract, engagement dropped 40% last quarter. Champion (Lisa Park) left in January. New VP unresponsive to 3 outreach attempts. Uses 45% of licensed seats. Board meeting next week where they're reviewing vendor spend." },
  { name: "TechForge Solutions", arr: 185000, renewalDate: futureDate(18), riskLevel: "high",
    contacts: [{ name: "Marcus Rivera", role: "CTO", email: "mrivera@techforge.io" }, { name: "Amy Zhang", role: "Engineering Lead", email: "azhang@techforge.io" }],
    summary: "Filed 14 support tickets in 60 days, 6 unresolved. Evaluating Gainsight and ChurnZero. CTO frustrated with API reliability. Wants enterprise SSO we don't have. Their VP of Eng mentioned 'exploring options' in last QBR." },
  { name: "Orbit Dynamics", arr: 92000, renewalDate: futureDate(8), riskLevel: "high",
    contacts: [{ name: "Jake Morales", role: "Head of CS", email: "jmorales@orbitdyn.com" }],
    summary: "Acquired by larger company 3 months ago. New parent company has existing vendor for similar functionality. Jake is fighting to keep us but needs ROI data urgently. Budget review happening this Friday." },
  { name: "Redline Analytics", arr: 67000, renewalDate: futureDate(25), riskLevel: "high",
    contacts: [{ name: "Devon Patel", role: "Director of Ops", email: "dpatel@redlineanalytics.com" }],
    summary: "NPS dropped from 8 to 4 after last product update. Key workflow broke during our March release. Devon sent escalation email to our CEO. Team morale around the product is low. They stopped attending our monthly webinars." },

  // MEDIUM RISK — Some concerns, needs attention
  { name: "Pinnacle Financial Group", arr: 310000, renewalDate: futureDate(45), riskLevel: "medium",
    contacts: [{ name: "James Park", role: "Director of IT", email: "jpark@pinnaclefg.com" }, { name: "Maria Santos", role: "CFO", email: "msantos@pinnaclefg.com" }],
    summary: "Satisfied overall but pushing hard for 15% discount at renewal. Using 70% of licensed seats. CFO wants to consolidate vendors. Expansion opportunity if we can demonstrate ROI to their board. Competitors pitched them last month." },
  { name: "Velocity Commerce", arr: 95000, renewalDate: futureDate(30), riskLevel: "medium",
    contacts: [{ name: "Lisa Nakamura", role: "Head of Product", email: "lnakamura@velocitycom.co" }],
    summary: "Good product fit but budget constrained after layoffs (team went from 45 to 28). May need to downgrade from Enterprise to Pro tier. Lisa loves the product but has to justify every dollar. Exploring quarterly billing." },
  { name: "Ember Analytics", arr: 225000, renewalDate: futureDate(22), riskLevel: "medium",
    contacts: [{ name: "David Kim", role: "VP Engineering", email: "dkim@emberanalytics.com" }],
    summary: "Integration issues causing daily friction. Their team built workarounds instead of using our native features. Need a technical deep-dive to re-engage. David responded positively to our latest feature launch email. 2 open support tickets." },
  { name: "Summit Learning", arr: 145000, renewalDate: futureDate(55), riskLevel: "medium",
    contacts: [{ name: "Rachel Torres", role: "VP of CS", email: "rtorres@summitlearn.com" }],
    summary: "Steady usage but no expansion in 18 months. They added 200 students last quarter but didn't increase seats. Rachel mentioned they might need to 'rightsize' the contract. Education sector facing budget pressure." },
  { name: "Prism Design Co", arr: 48000, renewalDate: futureDate(40), riskLevel: "medium",
    contacts: [{ name: "Tom Chen", role: "Creative Director", email: "tchen@prismdesign.co" }],
    summary: "Small account but influencer in the design community. Tom tweets about tools regularly (12K followers). Hasn't logged in for 3 weeks. May have found a competitor. Worth a personal outreach." },
  { name: "GreenPath Energy", arr: 280000, renewalDate: futureDate(65), riskLevel: "medium",
    contacts: [{ name: "Anika Johansson", role: "COO", email: "ajohansson@greenpath.energy" }, { name: "Ben Carter", role: "IT Director", email: "bcarter@greenpath.energy" }],
    summary: "Happy with core product. Concerned about our AI features (data privacy in energy sector). Need to address their compliance questions before renewal. Board requires vendor security questionnaire completion." },

  // LOW RISK — Healthy, engaged, expansion candidates
  { name: "Atlas Digital Agency", arr: 62000, renewalDate: futureDate(60), riskLevel: "low",
    contacts: [{ name: "Chris Hartley", role: "Managing Director", email: "chartley@atlasdigital.com" }],
    summary: "Power user. Highest adoption scores in portfolio. Already asking about Q3 features. Strong expansion candidate — wants 3 more seats. Referred 2 new customers last quarter. NPS 10." },
  { name: "NovaBridge Consulting", arr: 148000, renewalDate: futureDate(75), riskLevel: "low",
    contacts: [{ name: "Priya Sharma", role: "COO", email: "psharma@novabridge.com" }],
    summary: "Renewed last year with 12% uplift. Active in community forums. Referred two new customers. Executive sponsor is a strong internal advocate. Interested in our API access." },
  { name: "Clearpath Logistics", arr: 38000, renewalDate: futureDate(90), riskLevel: "low",
    contacts: [{ name: "Sandra Kim", role: "Operations Manager", email: "skim@clearpath.io" }],
    summary: "Small account, highly engaged. 100% seat utilization. Adding users each quarter. Natural expansion path to parent company (GlobalFreight Inc, $200M revenue). Sandra presents our ROI at their quarterly all-hands." },
  { name: "Quantum SaaS", arr: 195000, renewalDate: futureDate(50), riskLevel: "low",
    contacts: [{ name: "Raj Patel", role: "CRO", email: "rpatel@quantumsaas.com" }, { name: "Emma Liu", role: "CS Director", email: "eliu@quantumsaas.com" }],
    summary: "Model customer. Uses every feature. Emma's team runs weekly workflows. Raj presented our case study at SaaStr. Exploring enterprise tier for their APAC expansion. 3-year deal discussion in progress." },
  { name: "Brightwave Media", arr: 110000, renewalDate: futureDate(35), riskLevel: "low",
    contacts: [{ name: "Alex Morgan", role: "VP Growth", email: "amorgan@brightwave.co" }],
    summary: "Consistent engagement. Team of 15 active daily users. Alex champions us internally. Want to integrate with their Slack workflow. Asking about our enterprise API. No competitive threats detected." },

  // OVERDUE / PAST DUE — Renewals that slipped
  { name: "Cobalt Systems", arr: 175000, renewalDate: futureDate(-15), riskLevel: "high",
    contacts: [{ name: "Frank Wilson", role: "VP Engineering", email: "fwilson@cobaltsys.com" }],
    summary: "Renewal was 15 days ago, still not signed. Frank says 'legal is reviewing.' Their legal team added 12 custom contract terms. Our legal responded 8 days ago, no reply since. Month-to-month risk." },

  // NEW / RECENTLY ONBOARDED
  { name: "LaunchPad Ventures", arr: 55000, renewalDate: futureDate(340), riskLevel: "low",
    contacts: [{ name: "Nina Okafor", role: "Partner", email: "nokafor@launchpadvc.com" }],
    summary: "Just signed 2 months ago. Onboarding 80% complete. Very engaged — Nina calls our product 'transformative.' Portfolio company referral opportunity (they manage 30 SaaS companies). Early adoption metrics are strong." },
  { name: "Ironclad Manufacturing", arr: 340000, renewalDate: futureDate(300), riskLevel: "medium",
    contacts: [{ name: "Robert Hayes", role: "CIO", email: "rhayes@ironcladmfg.com" }, { name: "Diana Reyes", role: "IT Manager", email: "dreyes@ironcladmfg.com" }],
    summary: "Signed 3 months ago. Large deal but slow adoption — only 30% of seats active. Robert championed the purchase but Diana's team is resistant to change. Need an enablement push. Training sessions scheduled but attendance was 40%." },

  // STRATEGIC / WHALE ACCOUNTS
  { name: "Horizon Enterprises", arr: 480000, renewalDate: futureDate(85), riskLevel: "low",
    contacts: [{ name: "Katherine Wu", role: "CEO", email: "kwu@horizonent.com" }, { name: "Michael Torres", role: "VP Revenue", email: "mtorres@horizonent.com" }, { name: "Linda Park", role: "CS Lead", email: "lpark@horizonent.com" }],
    summary: "Largest account. CEO personally championed the purchase. Multi-department rollout across Sales, CS, and RevOps. NPS 9. Wants to co-develop features. Board presentation coming where they'll share our ROI story. Reference customer for enterprise pitch." },
  { name: "Nexus Cloud Partners", arr: 260000, renewalDate: futureDate(70), riskLevel: "low",
    contacts: [{ name: "Olivia Hart", role: "CTO", email: "ohart@nexuscloud.io" }],
    summary: "Technical buyer who loves our architecture. Wrote a LinkedIn post about us (5K views). Integrates deeply via API. Wants to build custom agents on our platform. Strong candidate for co-marketing partnership." },
];

// ─── Context items for richer agent analysis ─────────────────────────────────
const CONTEXT_TEMPLATES = [
  { type: "text", label: "QBR Notes", source: "manual",
    content: "Quarterly Business Review notes: Customer expressed satisfaction with core features but raised concerns about onboarding new team members. Action items: Schedule training session, provide updated documentation, review usage analytics together." },
  { type: "text", label: "Support Ticket Summary", source: "email",
    content: "Open tickets: 3 (1 critical, 2 medium). Critical: API timeout during peak hours affecting their production workflow. Medium: Dashboard export formatting issue, SSO configuration question. Average resolution time: 4.2 days (above our 3-day SLA)." },
  { type: "text", label: "Usage Report - Last 30 Days", source: "manual",
    content: "DAU: 12 of 25 seats (48%). Feature adoption: Core workflows 89%, Advanced analytics 34%, API access 12%. Login frequency: Avg 4.2 sessions/week per active user. Trend: Slight decline from 5.1 sessions/week last quarter." },
  { type: "text", label: "Competitive Intel", source: "email",
    content: "Account mentioned evaluating alternatives during last call. Specifically named: Gainsight (too expensive, $60K+), ChurnZero (considering mid-market tier), and an internal spreadsheet solution. Key differentiator for us: AI-powered insights and speed of implementation." },
  { type: "text", label: "Renewal Discussion Notes", source: "manual",
    content: "Preliminary renewal discussion held. Customer wants multi-year option with 10% discount. Budget approved for current spend level. Decision maker is VP level, needs board sign-off for increases over 15%. Timeline: wants to finalize 30 days before renewal date." },
];

// ─── Company settings for agent context ──────────────────────────────────────
const COMPANY_SETTINGS = {
  persona: "renewal_director",
  companyName: "BaseCommand",
  products: "BaseCommand Pro ($49/mo): AI-powered renewal intelligence with unlimited accounts, AI agents, supervised autopilot, email connectors. BaseCommand Free: 10 accounts, 50 AI calls/mo.",
  competitors: "Gainsight ($30-105K/yr, enterprise), ChurnZero ($15-40K/yr, mid-market), Vitally ($6K+/yr, mid-market), Spreadsheets (free, no intelligence)",
  renewalStrategy: "Land with free trial, expand with AI value demonstration. Founding member pricing ($49/mo) locked for life for first 100 customers. Focus on time-to-value under 5 minutes.",
  negotiationWants: "Multi-year commits, case study participation, referrals, expansion to additional teams",
  negotiationGives: "Annual discount (20%), extended trial, priority support, early access to new agents, custom onboarding session",
};

// ─── Load everything ─────────────────────────────────────────────────────────
export async function loadStressTest() {
  console.log("[stress-test] Loading 20-account portfolio...");
  let accountCount = 0;

  for (const acct of ACCOUNTS) {
    const id = `stress-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const account = {
      id,
      name: acct.name,
      arr: acct.arr,
      renewalDate: acct.renewalDate,
      riskLevel: acct.riskLevel,
      contacts: acct.contacts || [],
      summary: acct.summary || "",
      tags: ["stress-test"],
      lastActivity: pastDate(Math.floor(Math.random() * 30) + 1),
      createdAt: new Date().toISOString(),
    };
    await renewalStore.saveAccount(account);

    // Add 2-3 context items per account
    const ctxCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < ctxCount; i++) {
      const template = CONTEXT_TEMPLATES[Math.floor(Math.random() * CONTEXT_TEMPLATES.length)];
      await renewalStore.addContextItem(id, {
        id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        accountId: id,
        ...template,
        content: template.content.replace("Customer", acct.name),
      });
    }
    accountCount++;
  }

  // Save company settings
  await renewalStore.saveSettings(COMPANY_SETTINGS);

  console.log(`[stress-test] Loaded ${accountCount} accounts with context items and company settings`);
  console.log("[stress-test] Reload the page to see the data");
  return accountCount;
}
