# BaseCommand Master Plan

> **Living document.** Updated as decisions are made. Single source of truth for vision, business model, and what we're building.
> **Last updated:** 2026-03-19 (Epic 19 — Agent Hub + Team + Company Profile redesign) | **Version:** 0.8.0
> **Previous versions:** `docs/archive/PLAN-v0.4.0-2026-03-17.md`

---

## Vision & BHAG

### The Big Hairy Audacious Goal
**BaseCommand becomes the autonomous revenue operations layer that every SaaS company runs on.**

Not a dashboard with AI features — a fleet of specialized agents that run renewal operations continuously, with a human command layer for oversight, approvals, and strategy.

### The Arc

| Phase | Mode | Experience |
|-------|------|-----------|
| **Now** | Co-pilot | AI drafts, analyzes, suggests. Human does everything. |
| **Next** | Supervised autopilot | AI sends emails, updates CRM on approval. Human sets rules, approves batches. |
| **Future** | Full autonomous | AI runs the renewal process. Monitors, acts, escalates only when needed. Human steers strategy. |

### The Moat
The defensibility isn't the AI — everyone has that. It's the **workflow graph**: the accumulated knowledge of how renewals actually get worked, what actions lead to saves, which patterns predict churn. Every account that flows through BaseCommand trains the system on what good renewal ops looks like.

### Operating Constraint
BaseCommand is a **side-hustle**, not a VC-backed startup. Michael has no intention of quitting his day job (Senior Director of Global Renewals). This shapes every decision:
- Architecture favors **low-maintenance** over scalable-at-all-costs
- Managed services over self-hosted. Fewer moving parts.
- Features favor **"works reliably unattended"** over "impressive but needs babysitting"
- **Support burden is the enemy** — self-serve onboarding, clear UX, agents that just work
- The product should run itself. BaseCommand is its own best customer.
- If MRR exceeds $25K, revisit the full-time question. Until then, optimize for semi-passive income.

---

## Business Model

### Target Market
- **Primary:** SMB SaaS companies (< $50M ARR)
- **Secondary:** Smaller mid-market SaaS ($50M–$200M ARR)
- **Not solving for:** Enterprise (dedicated renewal ops teams, complex Salesforce, procurement-heavy)

### Target Personas

| # | Persona | Context | Entry Point |
|---|---------|---------|-------------|
| 1 | **Founder / CEO** | < 50 customers, renewals in spreadsheets or not tracked | Import → dump data → instant portfolio |
| 2 | **Revenue Leader / CRO** | Sales team with renewal responsibility, no dedicated team | Autopilot → see what AI would do |
| 3 | **RevOps / CS Ops** | Operationalizing revenue processes, messy CRM data | Import → paste CRM export → AI extraction |
| 4 | **Renewal Director / VP CS** | Manages renewal portfolio across segments, reports to CRO/CEO | Leadership → exec brief → copy to clipboard |
| 5 | **Renewal Specialist (IC)** | Runs the renewal process day-to-day | Autopilot → account actions → task execution |

### Pricing

**Conversion model: 14-day Pro trial → Free forever or upgrade to founding member pricing.**

| Tier | List Price | Founding Member Price | Includes | Target |
|------|-----------|----------------------|----------|--------|
| **Free** | $0 | $0 | 10 accounts, 50 AI calls/mo (Sonnet), all agent categories, co-pilot mode | Founders trying it, agent.ai converts |
| **Individual** | $149/mo | **$49/mo locked for life** | 1 user, unlimited accounts, unlimited AI (Opus), supervised autopilot, email connectors, cloud sync | Solo revenue leaders |
| **Individual Annual** | $149/mo | **$39/mo ($468/yr) locked for life** | Same as Individual | Cost-conscious early adopters |
| **Team** | $299/mo | **$149/mo flat** | Unlimited users, shared portfolio, all Individual features, org-level billing | RevOps teams, CS organizations |
| **Enterprise** | Custom | TBD (post-SOC 2) | Custom agents, SSO, BYOK required, dedicated support | Mid-market (post-SOC 2) |

### 14-Day Pro Trial + Founding Member Program

**Every signup starts with 14 days of full Pro access — no credit card required.** After the trial, users choose: keep the free tier forever, or lock in founding member pricing.

- **14-day Pro trial** — automatic on every signup, no credit card needed
- **Free forever tier** after trial — 10 accounts, 50 AI calls/mo, all agent categories
- **Founding member pricing** — first 100 Pro customers get $49/mo locked for life (normally $149/mo)
- $39/mo billed annually ($468/yr) — best deal we'll ever offer, 74% off
- Framed as exclusive, not desperate: "You're getting in early. Help shape what we build next."

**Pricing evolution:**
- **Now → Gate 2:** Early adopter pricing ($49/mo) for first 100 customers
- **Gate 2 ($5K MRR):** New customers pay $99/mo. Early adopters keep $49.
- **Post-SOC 2 + autonomous agents:** Full price $149/mo for new customers. Early adopters still keep $49.

### Distribution
- **Primary channel:** agent.ai (3M+ users) — free agents as top-of-funnel
- **agent.ai is the free marketing engine** — no paid marketing spend until Gate 2
- **Conversion funnel:** Free agent → instant value → CTA → signup → Quick Add → portfolio → paid
- Personal relationship with agent.ai owner who will promote agents on platform

### Unit Economics
- **At early adopter pricing ($49/mo):** ~21 customers for Gate 1 ($1K MRR), ~102 for Gate 2 ($5K MRR)
- **Blended (mix of $49 early + $99-149 new):** Gate 2 becomes more achievable as pricing normalizes
- At 0.5% conversion of engaged agent.ai users, 50-80 Pro customers is achievable in 6-8 months
- **AI cost per user:** Free tier ~$1-2.50/mo (Sonnet, 50 calls), Pro ~$5-15/mo (Opus, unlimited) → 70-90% gross margin at $49, 90-97% at $149
- **AI is included, not BYOK:** Users never need an API key. BaseCommand provides AI as part of the product. BYOK is an advanced option in Settings for enterprise/compliance.
- **50 early adopters at $49/mo = $2,450 MRR** — enough to prove demand and fund Gate 1-2 investments

---

## Revenue-Gated Investment Model

**Principle: No gate-skipping. Time doesn't unlock gates — revenue does.**

Every major spending decision is unlocked by hitting a revenue milestone. No milestone, no spend. Each gate's revenue covers the gate's costs.

| Gate | Milestone | What It Proves | Unlocks | Investment |
|------|-----------|---------------|---------|------------|
| **0** | Pre-revenue | — | Your time + minimal infra + AI API costs | ~$50-150/mo (scales with free users) |
| **1** | $1K MRR (~21 early adopter Pro) | People will pay. Multiple customers, not a fluke. | Basic business ops: Stripe, ToS, monitoring | ~$500 one-time + $50/mo |
| **2** | $5K MRR (~50 early + new Pro mix) | Repeatable demand. Funnel converts. PMF signal. | Growth: contractor help, pen test, paid marketing, native mobile app (iOS + Android). Raise new customer price to $99. | ~$10-15K one-time + $1-2K/mo |
| **3** | $25-50K total revenue | Real business. Customers retaining, not just trying. | "Trusted" compliance: SOC 2, legal, DPA. Mobile app v2 with push notifications. | ~$30-50K one-time |
| **4** | $10K MRR (~70 Pro) | Unit economics work. Growth is predictable. | Scale: first hire, CRM integrations, enterprise features | ~$5-10K/mo |
| **5** | $25K+ MRR | This could be more than a side-hustle. | Revisit full-time. Raise or reinvest aggressively. | TBD |

### Gate Principles
1. Each gate's revenue should cover the gate's costs — no burning cash ahead of proof
2. agent.ai is free marketing until Gate 2 — zero paid acquisition spend before then
3. Revenue-gated, not time-gated — if Gate 1 takes 3 months or 12, the spend stays locked
4. $25K+ MRR triggers the full-time conversation — that's a great problem to have

### Advertising Readiness Checklist — "Ready to Promote"

Before asking for featured placement on agent.ai or driving significant traffic, **all of these must be checked off:**

| # | Requirement | Epic | Status |
|---|-------------|------|--------|
| 1 | **User auth working end-to-end** | 9 | **Done** |
| 2 | **Data persists server-side (Postgres)** | 9 | **Done** (`5284f80`) |
| 3 | **Stripe billing live** | 10 | **Done** (`6dfcf0d`) — checkout, webhooks, tier enforcement, billing UI |
| 4 | **AI works without API key** | 10 | **Done** — server-side key fallback, BYOK optional in Settings |
| 5 | **Usage metering + free tier limits** | 10 | **Done** — 50 calls/mo free, HTTP 429 enforcement, usage meter in Settings |
| 6 | **Onboarding flow (Quick Add)** | 3 | **Done** (`8ff8cf7`) — multi-step signup + onboarding |
| 7 | **Early adopter pricing live** | 10 | **Done** (`cbdda51`) — plan toggle Free Trial vs Pro $49/mo |
| 8 | **Privacy policy + ToS published** | 9 | **Done** (`4ff20ed`) |
| 9 | **agent.ai workflow pipeline** | 15 | **Done** (`af0b0d9`) — external import API + integration keys |
| 10 | **HubSpot connector** | 15 | **Blocked** — waiting on Matthew Stein call (2026-03-19) for agent.ai HubSpot connector details |
| 11 | **Stress test with real data** | — | **Done** (`5e7d1aa`) — 20 realistic accounts with context |
| 12 | **Marketing site complete** | 14 | **Done** |
| 13 | **Mobile-responsive marketing site** | 14 | **Done** (`a9e310c` + `561fde0` + `331d4c9`) — all 6 marketing pages + 21 app pages |

**Status: 12 of 13 complete.** Only HubSpot connector remains, blocked on external dependency (Matthew Stein / agent.ai).

**Target: End of week (2026-03-21)** — ready to start taking customers. HubSpot can ship post-launch if Matthew call doesn't unblock in time.

### Decision Log Addition

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 53 | Don't request agent.ai featured placement until advertising readiness checklist is complete | Driving traffic to a product that can't persist data, accept payments, or provide AI without API keys wastes the distribution opportunity. One shot to make a first impression. | 2026-03-16 |

---

## Epic Roadmap Summary

| Epic | Name | Status | Description |
|------|------|--------|-------------|
| 1 | Navigation & Feature Overhaul | **Completed** | Cut generic features, promote renewals to core nav |
| 2 | agent.ai Integration | **Completed** | 4 agents live on agent.ai + /agents marketing page + Quick Add |
| 3 | Post-Login Experience & Onboarding | **Completed** | Smart routing, dashboard rewrite, onboarding flow |
| 4 | Tasks Overhaul | **Completed** | AI-powered renewal task engine (account actions + strategic) |
| 5 | Forecast Intelligence | **Completed** | Standalone forecast with GRR/NRR, confidence tiers, scenarios |
| 6 | AI-Initiated Value Delivery | **Completed** | Persona-driven task suggestions + persona picker |
| 7 | Agent Hub | **Completed** | AI agents as the product experience, hub + workspaces |
| 8 | Autonomous Agents — Phase 1 | **Completed** | Execution engine, audit trail, autonomy controls, batch approve/dismiss, Tasks split |
| 9 | Security & Foundation | **Completed** | Auth (Supabase), server-side data persistence, Privacy Policy + ToS, admin dashboard + RBAC |
| 10 | AI Access & Monetization | **Completed** | Server-side AI (no API key needed), 50-call/mo free tier metering, Stripe billing + checkout + webhooks, plan toggle, tier enforcement |
| 11 | Brand & Operations | **Deferred** | Google Workspace, social media campaigns, content marketing, demo videos (post-launch) |
| 12 | My Company — Company Profile & Renewal Strategy | **In Progress** | AI-first company data ingestion, product catalog, renewal strategy, negotiation exchange framework |
| 13 | Agent Architecture Overhaul | **Completed** | Restructure into Renewal/Growth/Coaching categories, health scoring, industry-standard naming, unified intelligence layer |
| 14 | Marketing Site Overhaul | **Completed** | AI Revenue Engine positioning, 6 marketing pages, agent.ai integration, 14-day trial model |
| 15 | agent.ai Deep Integration + HubSpot | **Near Complete** | Workflow pipeline done (`af0b0d9`), stress test done (`5e7d1aa`). HubSpot connector blocked on Matthew call. |
| 16 | v2 Design — Unified App Redesign | **Completed** | Sidebar restructure (5 groups), Mission Control dashboard, Intelligence Hub, Agent Hub (Active/Catalog + autonomy dial), portfolio filtering, archetype badges, NRR waterfall, export toolbar |
| 17 | Organization & Team Model (Phase 1) | **Completed** | Org/team data model, org-scoped queries, auto-create org on signup, backfill existing users, billing scoped to org, workspace CRUD replaced with org display |
| 18 | Discovery Optimization — SEO, AEO, GEO Foundation | **Planned** | Schema.org markup, semantic HTML, LLMs.txt, per-page meta/OG tags, robots.txt, sitemap, answer-first content, FAQ schema |

---

## The Unified AI Revenue Architecture

> Based on "Architecting Intelligence: The AI-Driven Revenue Engine" — a research synthesis on AI-powered renewal operations that validates and extends the BaseCommand vision. This section defines the product's DNA.

### The 4-Layer Stack

```
┌─────────────────────────────────────────────────────────┐
│  ORCHESTRATION — Command Center (Dashboard)             │
│  NRR waterfall, intervention queue, agent activity feed │
├─────────────────────────────────────────────────────────┤
│  AGENTS — Renewal │ Growth │ Coaching                   │
│  Specialized sub-agents organized by mission            │
├─────────────────────────────────────────────────────────┤
│  AI REASONING ENGINE — Health Scores + Archetypes       │
│  Composite scoring, behavioral classification, signals  │
├─────────────────────────────────────────────────────────┤
│  DATA LAYER — Data Sources & Import Hub                 │
│  Email, CRM, meetings, manual import, telemetry (future)│
└─────────────────────────────────────────────────────────┘
```

### The 5-Function Pipeline (Cross-Cutting)

These are capabilities that run across all agent categories, not nav items:

| Function | What It Does | Primary Agent(s) |
|----------|-------------|-------------------|
| **Monitor** | Scans health signals 24/7 across unified data | Health Monitor |
| **Predict** | Scores churn risk 90–180 days before renewal | Forecast Engine + Health Monitor |
| **Generate** | Drafts hyper-personalized, context-rich outreach | Outreach Drafter |
| **Identify** | Flags expansion, upsell, and contraction triggers | Expansion Scout |
| **Orchestrate** | Focuses humans on high-value strategic conversations | Command Center + Executive Brief |

### Agent Categories & Sub-Agents

#### Renewal Agents
| Agent | Mission | Key Outputs |
|-------|---------|-------------|
| **Health Monitor** | Continuous health scoring, risk signal detection, champion tracking | Composite health score (decomposable), severity flags, archetype classification |
| **Rescue Planner** | At-risk intervention strategies, archetype-aware playbooks | Rescue playbook per account, intervention timeline, recommended actions |
| **Outreach Drafter** | Personalized renewal emails, follow-ups, context-rich drafts | Draft emails referencing past wins, health context, relationship history |

#### Growth Agents
| Agent | Mission | Key Outputs |
|-------|---------|-------------|
| **Expansion Scout** | PQL detection, upsell triggers, expansion signals, budget signals | Expansion opportunity cards, trigger alerts, recommended upsell approach |
| **Forecast Engine** | GRR/NRR modeling, scenario analysis, benchmark comparisons | Board-ready forecast, confidence tiers, "your GRR vs. best-in-class" |
| **Opportunity Brief** | Expansion talking points, pricing recommendations | Pre-call expansion brief, competitive positioning, pricing scenarios |

#### Coaching Agents
| Agent | Mission | Key Outputs |
|-------|---------|-------------|
| **Executive Brief** | Board-ready summaries, leadership intel, strategic recommendations | Exec summary, portfolio health overview, talking points for CRO/CEO |
| **Meeting Prep** | Pre-call briefs, relationship context, recommended asks | Account brief, attendee profiles, conversation guide, risk/opportunity callouts |
| **Playbook Builder** | 90/60/30 day action plans, milestone checklists | Time-sequenced action plan, task generation, reminder cadence |

### Account Health Score — The Connective Tissue

The health score is the shared data point that all agents read and write. It synthesizes multiple signals into a single composite score (0–10) with full decomposition.

**Health Signals:**

| Signal | Source | Weight | Detection Method |
|--------|--------|--------|-----------------|
| Renewal proximity | Account data | High | Days to renewal date (urgency curve) |
| Activity recency | Email scan + manual | High | Days since last meaningful interaction |
| Email sentiment | Email scanner (Claude) | Medium | Sentiment scoring during inbox scan |
| Champion status | Contact tracking | Critical | Email bounce, LinkedIn departure, role change |
| Contraction signals | Email scan + context | High | Downsell mentions, scope reduction language |
| Expansion signals | Email scan + context | Positive | Growth mentions, new use cases, team expansion |
| Engagement trend | Activity over time | Medium | 30/60/90 day activity trend line |

**Behavioral Archetypes (auto-classified per account):**

| Archetype | Characteristics | Renewal Probability | Agent Strategy |
|-----------|----------------|--------------------:|---------------|
| Power User | High ARR, long tenure, multiple products | ~90% | Expansion play (Expansion Scout) |
| Enthusiastic Adopter | High feature breadth, growing usage | ~80% | Safe renewal, nurture (Outreach Drafter) |
| Convert | Rising usage, recent expansion | ~68% | Targeted upsell (Expansion Scout + Opportunity Brief) |
| Explorer | Broad but shallow, trying features | ~50% | Guided adoption (Coaching: Playbook Builder) |
| Struggler | Usage cliffs, support issues | ~28% | Immediate intervention (Rescue Planner) |
| Disconnected | Zero engagement, unresponsive | ~5% | Last-resort rescue or managed churn (Rescue Planner) |

### NRR Waterfall — The Command Center View

The primary Dashboard visualization shows money flow:
```
Starting MRR → [+Expansion] → [-Contraction] → [-Churn] → Net MRR
                    ↑                ↑               ↑
              Intervention 1   Intervention 2   Intervention 3
              (Expansion Scout  (Health Monitor   (Health Monitor
               identifies PQLs)  detects scope    flags at-risk
                                 reduction)        90 days out)
```

### Revenue Impact Calculator

Show users the dollar value of retention improvement based on their actual portfolio:
- "Your portfolio: $2.4M ARR across 47 accounts"
- "A 3% GRR improvement = $72K in retained revenue"
- "A 5% GRR improvement = $120K — that's 2.5x the cost of BaseCommand Pro"

### Feedback Loop (The Moat)

Every human action on agent output is stored:
- Agent proposed action → User approved / rejected / modified
- Agent risk score → User agreed / overrode
- Agent-drafted email → User sent as-is / edited / discarded

This data accumulates into the **workflow graph** — the knowledge of how renewals actually get worked. This is the long-term defensibility.

### Key Market Data (from "AI Revenue Engine" research)

- 58% of SaaS companies report lower NRR than two years ago
- CS spending at all-time high, retention rates falling — the human playbook has broken down
- +5% retention → 25–95% profitability boost → higher EV multiples (AI SaaS: 6.3x–6.9x EV/TTM)
- Solution usage alone accounts for 80% of commercial outcomes (160B telemetry points, 9,100 accounts)
- Behavior predicts renewals with 90% accuracy up to 12 months in advance
- AI + human effort prevents up to 71% of churn (vs. AI or human alone)
- Positioning: "AI doesn't replace Customer Success; it makes them superhuman"
- Tagline candidate: "Stop negotiating exits. Start predicting growth."

### Decision Log Additions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 54 | Restructure agents into 3 categories (Renewal/Growth/Coaching) with industry-standard naming | User tests show "Autopilot" requires inference while "Renewal Agent" produces instant trust. Category model maps to Unified AI Revenue Architecture. | 2026-03-17 |
| 55 | Split Autopilot into Health Monitor + Rescue Planner + Outreach Drafter before launch | The monolithic Autopilot conflates three distinct concerns. Splitting enables the health score to be the connective tissue across all agents. | 2026-03-17 |
| 56 | Add computed Account Health Score (0–10) as the shared data point across all agents | Without a shared health score, agents operate in silos. The score enables: trigger-based automation, archetype classification, cross-agent intelligence. | 2026-03-17 |
| 57 | Reframe Dashboard as Command Center with NRR Waterfall as primary visualization | The Command Center is the Orchestration layer — it shows where money flows and where agents are intervening. A stat dashboard doesn't convey the intelligence. | 2026-03-17 |
| 58 | Track all human approve/reject/edit actions on agent suggestions as feedback loop data | This data becomes the "workflow graph" moat — accumulated knowledge of how renewals get worked. Collect now, leverage for ML later. | 2026-03-17 |
| 59 | 14-day Pro trial for every signup, no credit card required | Reduces friction to zero. Users experience full value before deciding. Free tier catches users who don't convert — they're still in the funnel. | 2026-03-17 |
| 60 | "Traditional Renewals" not "Traditional CS" in all positioning | We compete with renewal workflows, not CS platforms. Gainsight/ChurnZero own "CS" — we own "AI-powered renewal workflow." | 2026-03-17 |
| 61 | Split marketing into 3 education pages: /why, /how-it-works, /get-started | One long page tried to serve 3 reader intents. VPs need the wake-up call, RevOps needs the architecture, champions need the blueprint + ROI. | 2026-03-17 |
| 62 | Coming soon data connectors: HubSpot, Salesforce, Snowflake, BigQuery, Zendesk, Intercom | Telemetry data is the foundation layer. Show the roadmap to build confidence. HubSpot first (agent.ai has native connector). | 2026-03-17 |
| 63 | Marketing text hierarchy: textPrimary + fontWeight 400 + opacity 0.75 for subtitles | Premium sites use weight differentiation, not color dimming. Prevents subtitle text from getting swallowed on dark backgrounds. | 2026-03-17 |
| 64 | Build agent.ai workflow pipeline for "save to BaseCommand" | Knowledge Agent → Workflow Agent → BaseCommand API. Enables users to save parsed accounts to their portfolio from inside agent.ai chat. | 2026-03-17 |
| 65 | HubSpot as first CRM connector (via agent.ai native connector) | agent.ai has native HubSpot connector with per-agent auth. First telemetry data integration. Builds credibility on "coming soon" promise. | 2026-03-17 |
| 66 | Stress test with 20-account dummy portfolio before launch | Must validate the full workflow with realistic data before taking real customers. Catches data model issues, UI edge cases, and AI prompt failures. | 2026-03-17 |
| 67 | Target end of week (2026-03-21) for customer readiness | Gate 0 advertising readiness checklist must be complete. agent.ai pipeline, HubSpot, Stripe, legal, and stress testing all by Friday. | 2026-03-17 |
| 68 | Mobile-responsive marketing site required for Gate 0 | Most agent.ai traffic will be mobile. Marketing pages must render well on phones before driving traffic. | 2026-03-17 |
| 69 | Native mobile app (iOS + Android) deferred to Gate 2 | PWA/responsive web is sufficient for Gate 0-1. Native apps are a Gate 2 investment when PMF is proven and revenue supports the dev cost. | 2026-03-17 |
| 70 | Org model replaces workspaces entirely; portfolio filtering handles data segmentation | Workspaces were a localStorage concept. Orgs are the billing/collaboration container. Adding workspace-like filtering within an org is simpler than managing workspace→org migration later. | 2026-03-19 |
| 71 | Team tier: $149/mo flat (unlimited users), no seat counting | Seat-based pricing adds entitlement complexity, billing edge cases, and sales friction. Flat tier is operationally simple and aligns with "runs itself" constraint. | 2026-03-19 |
| 72 | Keep user_id on all tables as created_by provenance, never drop it | Provenance (who created what) is essential for audit trails and coaching agents. org_id is for access scoping, user_id is for attribution. Both serve different purposes. | 2026-03-19 |
| 73 | Auto-create personal org on signup via Postgres trigger | Every user gets an org immediately. No "orgless" state to handle. Simplifies all downstream code — can always assume org_id exists. | 2026-03-19 |
| 74 | user_settings and ai_usage stay user-scoped (no org_id) | Personal preferences (theme, persona, AI config) and per-user metering are inherently individual. Org-scoping them would create confusing shared state. | 2026-03-19 |
| 75 | Phase 1 org model is invisible to users — no team UI, no invites | Lay the data foundation now so there's no migration nightmare. Team features (invite flow, role management UI) come in Phase 2 when Team tier launches. | 2026-03-19 |

---

## Epic 17: Organization & Team Model (Phase 1)

**Status: Completed (2026-03-19)**

Invisible org/team foundation so the data model supports teams from day one. No user-facing team features yet — all infrastructure.

### What was built

**Database layer:**
- `organizations` table (billing/collaboration container)
- `org_members` table (user→org mapping with roles: owner/admin/manager/member)
- `org_invites` table (Phase 2 schema, created now to avoid future migration)
- `org_id` column added to all data tables (renewal_accounts, context_items, conversation_threads, conversation_messages, task_items, autopilot_actions, kb_documents, analysis_cache, renewal_metrics, subscriptions)
- `assigned_to` column added to renewal_accounts, task_items, autopilot_actions
- `founding_member` boolean added to subscriptions
- `user_org_ids()` RLS helper function for org-scoped access policies
- Auto-create org on signup trigger
- Backfill SQL for existing users

**API layer:**
- Shared auth helper (`api/lib/auth.js`) with `resolveUser()` and `resolveOrgMember()`
- Org API endpoint (`api/org.js`) for info + settings update
- All API endpoints updated to resolve org context from `X-Org-Id` header
- Stripe checkout/webhooks scoped to org
- Integration keys scoped to org in Vercel KV

**Frontend layer:**
- `authStore` tracks `activeOrgId` and `userOrgs`
- `supabaseStorage` queries by `org_id` (with `user_id` fallback for pre-migration data)
- Workspace CRUD removed from `appStore`
- Sidebar: workspace switcher replaced with org name display
- CompanySettings reads/writes from `organizations.settings`
- AI calls include `X-Org-Id` header

### Pricing model update

| Tier | Price | Users | Notes |
|------|-------|-------|-------|
| **Individual** | $49/mo founding, $149/mo list | 1 | Renamed from "Pro" for clarity |
| **Team** | $149/mo flat | Unlimited | No seat counting. Outcome-framed. |

### Phase 2 (partially completed 2026-03-19)
- ✅ Team Management settings page (view members, roles, join dates)
- ✅ Invite flow API (invite by email → org_invites table → auto-accept on signup)
- ✅ Role management UI (promote/demote members, remove members)
- ✅ Accept-invites API (auto-joins org on login if pending invite exists)
- ⏸️ Invite email delivery — blocked on Google Workspace SMTP setup
- ⏸️ Org switcher in sidebar (for users in multiple orgs)
- ⏸️ Team activity feed
- ⏸️ Portfolio filtering by assigned_to

---

## Epic 19: Agent Hub + Team + Company Profile Redesign

**Status: Completed (2026-03-19)**

Major UX pass across three areas: Agent Hub redesign, Team Management, and AI-powered Company Profile setup.

### What was built

**Agent Hub redesign:**
- Phase-driven layout: welcome → activating → operational (adapts to user progress)
- FleetWelcome hero with 3-mode explainer (Suggest/Draft/Execute)
- 5 PillarSections replace dual-zone Operations Center / Co-Pilot Workbench
- Each pillar in a bordered card with color-accented top border
- Pillar labels rendered in their own color for visual hierarchy
- Compact Fleet Status Header with pipeline dots + stats
- Prominent "Configure Fleet" button (solid indigo fill)
- Page header with Bot icon and agent/pillar count

**Team Management (Settings → Team):**
- Full team settings page: org info, member list, role badges
- Invite flow with org_invites table (avoids Supabase trigger conflicts)
- Role management (admin/member dropdown for owners/admins)
- Member removal with confirmation
- Auto-accept pending invites on login via acceptPendingInvites()

**Company Profile — AI Website Scanner:**
- URL-only extraction: enter website, AI crawls homepage + 5 subpages
- Extracts: company name, products, pricing, competitors, value props, contract terms
- Brand Kit: logo URL, favicon, primary/secondary/accent colors, fonts, social links
- AI uses training knowledge for SPA sites that return empty HTML
- Google Favicon API fallback for reliable favicons
- Overwrite mode: new URL replaces all fields (preserves sender name + strategy)

**Infrastructure fixes:**
- Sidebar nav redesigned: flexbox layout replaces absolute positioning (6+ failed patches)
- global.css imported (was never loaded — root cause of zero padding across all pages)
- Double padding eliminated (horizontal padding on main, vertical on PageLayout)
- Merged website-extract into ai.js to stay under Vercel 12-function Hobby limit

### Decision Log Additions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 84 | Agent Hub: pillar-grouped layout over dual-zone | Agents belong to their renewal function, not their autonomy mode. Mode badge + border accent show mode within pillar context. | 2026-03-19 |
| 85 | Team invites via org_invites table, not inviteUserByEmail | Supabase's inviteUserByEmail triggers auto-org-creation which conflicts. org_invites + auto-accept on login is cleaner. | 2026-03-19 |
| 86 | Website scanner uses AI training knowledge for SPAs | Modern sites (Dropbox, Quickbase) return empty HTML. Claude already knows brand colors, products, and pricing for major companies. | 2026-03-19 |
| 87 | Consolidate API endpoints to stay under Vercel 12-function limit | Hobby plan caps at 12. Use action query params on existing endpoints rather than new files. Upgrade to Pro when consolidation hurts design. | 2026-03-19 |
| 88 | Horizontal padding on main element, not PageLayout | Single source of truth prevents double-padding. TopBar uses negative margins to stretch edge-to-edge. | 2026-03-19 |

---

## Epic 18: Discovery Optimization — SEO, AEO, GEO Foundation

**Status: Planned**
**Priority: Pre-Launch (Gate 0)** — must ship before requesting agent.ai featured placement
**Research basis:** 3 in-depth articles in `/lmnotebooks/Adaptive Web Design/`

### The Problem

BaseCommand is about to start driving traffic from agent.ai (3M+ users). The 2026 discovery landscape has shifted fundamentally:

- **60% of Google searches end without a click** — AI-generated summaries satisfy intent on the results page
- **25% of search volume has migrated to AI-native answer engines** (ChatGPT, Perplexity, Claude)
- **Traditional SEO alone is no longer sufficient** — brands must optimize for SEO + AEO (Answer Engine Optimization) + GEO (Generative Engine Optimization)

BaseCommand's marketing site currently has:
- **No Schema.org markup** — AI systems can't verify our entity identity
- **No per-page meta tags or OG tags** — all 6 marketing pages share one generic title/description
- **No robots.txt or sitemap** — crawlers have no guidance
- **Minimal semantic HTML** — `<section>` and `<nav>` only, no `<main>`, `<article>`, `<aside>`
- **No LLMs.txt** — the emerging standard for LLM crawler guidance
- **No FAQ schema** — despite FAQ content on the Pricing page
- **No answer-first content structure** — pages lack the 40-60 word TL;DR summaries that RAG systems extract

This means: AI systems won't cite BaseCommand. Social shares show blank previews. Search results show generic snippets. We're invisible to the 2026 discovery ecosystem.

### The 2026 Discovery Trifecta

| Attribute | SEO | AEO (Answer Engine) | GEO (Generative Engine) |
|-----------|-----|---------------------|------------------------|
| **Goal** | Rank pages in SERPs | Get featured as direct answers | Be cited in AI-synthesized responses |
| **Unit** | The Page (URL-level) | The Snippet (Q&A) | The Passage (chunk-level retrieval) |
| **Strategy** | Keywords, backlinks, technical health | FAQs, clear structure, conversational | Entity clarity, topical authority, RAG-friendly |
| **Metric** | Rankings, traffic, CTR | Answer inclusion, snippet visibility | Citation frequency, Share of Influence |

### The Bifurcated Strategy

BaseCommand must run two separate discovery plays:

1. **Rank-First (Google AI Overviews):** 81.1% of citations in Google's AI summaries come from the top-10 organic results. Traditional SEO is the prerequisite.
2. **Presence-First (ChatGPT/Perplexity/Reddit):** These platforms favor encyclopedic and community-driven sources. Entity authority and contextual brand mentions matter more than rankings.

### RAG Pipeline Optimization

AI search engines use Retrieval-Augmented Generation (RAG) to find and cite sources. Content must win two battles:

1. **Retrieval (technical):** Content must be easy to "chunk" — modular, semantic HTML, clean heading hierarchy
2. **Generation (trust):** Content must demonstrate E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) to be selected as the "source of truth"

### Implementation Steps

#### Step 1: Per-Page SEO Infrastructure (~80 lines)

**New utility: `src/lib/seo.js`**
- `usePageMeta(config)` hook — updates `document.title`, meta description, OG tags, canonical URL on route change
- Config per page: title, description, og:image, og:type, canonical path

**Apply to all 6 marketing pages + auth pages:**

| Page | Title | Description |
|------|-------|-------------|
| `/` | BaseCommand — AI-Powered Renewal Intelligence | AI agents that run your entire renewal workflow, from health scoring to outreach drafts to board-ready forecasts. |
| `/why` | Why Renewal Teams Need AI — BaseCommand | 58% of SaaS companies report lower NRR. Traditional renewal playbooks have broken down. Here's what's changed. |
| `/how-it-works` | How BaseCommand Works — AI Revenue Engine | 5 AI functions, 9 specialized agents, continuous monitoring. See the architecture behind AI-powered renewal ops. |
| `/get-started` | Get Started with BaseCommand — Implementation Blueprint | 4-week implementation, ROI calculator, free trial. Go from spreadsheets to AI-powered renewals. |
| `/agents` | AI Agents for Renewal Teams — BaseCommand | Free AI agents on agent.ai: CRM Parser, Renewal Autopilot, Exec Brief Generator, Forecast Intelligence. |
| `/pricing` | Pricing — BaseCommand | Free forever tier, 14-day Pro trial, founding member pricing. AI-powered renewal intelligence from $49/mo. |

**OG tags per page:** og:title, og:description, og:image, og:url, og:type, og:site_name, twitter:card, twitter:title, twitter:description

#### Step 2: Schema.org JSON-LD Markup

**Organization schema** (global, in MarketingLayout):
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "BaseCommand",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "AI-powered renewal intelligence platform",
  "url": "https://basecommand.ai",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free tier with 10 accounts and 50 AI calls/month"
  },
  "publisher": {
    "@type": "Organization",
    "name": "BaseCommand",
    "url": "https://basecommand.ai",
    "logo": "https://basecommand.ai/favicon.svg"
  }
}
```

**FAQPage schema** (on `/pricing`):
- Extract existing FAQ content into structured Q&A pairs with FAQPage schema
- Acts as "pre-formatted injection for RAG systems"

**Article schema** (on `/why`, `/how-it-works`):
- Links content to organization entity
- Proves accountability and freshness

#### Step 3: Semantic HTML Upgrade

**MarketingLayout.jsx:**
- Wrap `<Outlet />` content area in `<main>` tag
- Add `role` attributes to `<nav>` and `<footer>`

**All marketing pages:**
- Wrap page content in `<article>` tag
- Use `<header>` for hero sections
- Use `<aside>` for callout/CTA cards where appropriate

#### Step 4: Answer-First Content Blocks

Add **bolded 40-60 word TL;DR summaries** immediately under each page's H1:

- **Landing:** "BaseCommand is an AI-powered renewal intelligence platform. Nine specialized agents monitor account health, draft outreach, forecast retention, and surface expansion signals — running your entire renewal workflow from co-pilot mode to supervised autopilot."
- **Why:** "Traditional renewal playbooks have broken down. 58% of SaaS companies report lower NRR despite record CS spending. AI-powered renewal operations detect risk 90 days earlier, prevent up to 71% of churn, and turn retention from cost center to growth engine."
- **How It Works:** "BaseCommand runs a 5-function AI pipeline — Monitor, Predict, Generate, Identify, Orchestrate — powered by 9 specialized agents organized into Renewal, Growth, and Coaching categories. The system scores health continuously, drafts outreach automatically, and surfaces expansion signals from your data."
- **Pricing:** "BaseCommand offers a free forever tier (10 accounts, 50 AI calls/month) and a 14-day Pro trial with no credit card required. Founding member pricing: $49/month locked for life for the first 100 Pro customers."

#### Step 5: Static Discovery Files

**`public/robots.txt`:**
```
User-agent: *
Allow: /
Sitemap: https://basecommand.ai/sitemap.xml

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /
```

**`public/sitemap.xml`:**
Static XML listing all 6 marketing pages + login/signup with lastmod dates and priority values.

**`public/llms.txt`:**
```
# BaseCommand — AI-Powered Renewal Intelligence
# https://basecommand.ai

## About
BaseCommand is an AI-powered renewal intelligence platform for SaaS companies.
Nine specialized agents run the entire renewal workflow: health monitoring,
risk detection, outreach drafting, expansion signals, forecasting, and executive reporting.

## Key Pages
- /: Product overview and value proposition
- /why: The problem BaseCommand solves — declining NRR, broken renewal playbooks
- /how-it-works: Architecture — 5-function pipeline, 9 agents, 3 categories
- /pricing: Free tier, Pro trial, founding member pricing
- /agents: Free AI agents on agent.ai platform
- /get-started: Implementation blueprint and ROI calculator

## Product Details
- Categories: Renewal Agents, Growth Agents, Coaching Agents
- Key Agents: Health Monitor, Forecast Engine, Outreach Drafter, Expansion Scout, Executive Brief
- Pricing: Free ($0, 10 accounts), Individual ($49/mo founding), Team ($149/mo flat)
- Trial: 14-day Pro trial, no credit card required
```

#### Step 6: Interrogative Heading Audit

Review all marketing page H2/H3 headings and convert statement headings to question format where appropriate for conversational AI retrieval:

| Before | After |
|--------|-------|
| "The AI Revenue Engine" | "How Does the AI Revenue Engine Work?" |
| "Pricing" | "How Much Does BaseCommand Cost?" |
| "Implementation Blueprint" | "How Do I Get Started with BaseCommand?" |

Only convert where it improves discoverability without hurting the page's narrative flow.

### Files Changed

| File | Action | Notes |
|------|--------|-------|
| `src/lib/seo.js` | New | usePageMeta hook + SEO config per page |
| `src/components/layout/MarketingLayout.jsx` | Modify | Semantic `<main>` wrapper, Organization JSON-LD |
| `src/pages/marketing/Landing.jsx` | Modify | usePageMeta, `<article>`, answer-first summary |
| `src/pages/marketing/Why.jsx` | Modify | usePageMeta, `<article>`, answer-first summary |
| `src/pages/marketing/HowItWorks.jsx` | Modify | usePageMeta, `<article>`, answer-first summary |
| `src/pages/marketing/GetStarted.jsx` | Modify | usePageMeta, `<article>`, answer-first summary |
| `src/pages/marketing/Pricing.jsx` | Modify | usePageMeta, `<article>`, answer-first summary, FAQPage schema |
| `src/pages/marketing/Agents.jsx` | Modify | usePageMeta, `<article>`, answer-first summary |
| `public/robots.txt` | New | Crawler instructions + AI bot allowances |
| `public/sitemap.xml` | New | Static sitemap for all marketing pages |
| `public/llms.txt` | New | LLM-specific content index |
| `index.html` | Modify | Add fallback OG tags for non-JS crawlers |

### New KPIs (Post-Launch Tracking)

| KPI | What It Measures | How to Track |
|-----|-----------------|-------------|
| **Answer Inclusion Rate** | How often BaseCommand is cited in AI answers | Manual checks on ChatGPT, Perplexity, Google AI Overviews |
| **Branded Search Volume** | People searching "BaseCommand" by name | Google Search Console |
| **Share of Influence** | % of AI answer informed by our content | Perplexity citation tracking |
| **Entity Authority Score** | Brand presence in the knowledge graph | Schema validation + manual audits |
| **Social Share Preview Quality** | OG tags rendering correctly on LinkedIn/X/Slack | Manual verification |

### What's Deferred

| Item | Why | When |
|------|-----|------|
| AI-powered site personalization | Overengineering for Gate 0 | Gate 2+ |
| Kinetic typography / motion design | Nice-to-have, not discovery-critical | Post-launch |
| Paid SEO tools (Ahrefs, SEMrush) | Budget item | Gate 2 |
| Content marketing / blog | Requires sustained effort | Gate 2 (Epic 11) |
| Dynamic OG images per page | Needs image generation service | Gate 1 |
| International SEO (hreflang) | Single-language product for now | Gate 3+ |

### Build Order

1. **Foundation** — `seo.js` hook + `index.html` fallback OG tags (Step 1)
2. **Static files** — robots.txt, sitemap.xml, llms.txt (Step 5)
3. **Schema.org** — Organization JSON-LD in MarketingLayout, FAQPage on Pricing (Step 2)
4. **Semantic HTML** — `<main>`, `<article>`, `<header>` wrappers (Step 3)
5. **Answer-first content** — TL;DR blocks on all marketing pages (Step 4)
6. **Heading audit** — Interrogative headings where appropriate (Step 6)
7. **Per-page meta** — Apply usePageMeta to all 6 marketing pages (Step 1 continued)

### Decision Log Additions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 76 | Ship SEO/AEO/GEO foundation before agent.ai featured placement | One shot at first impressions with 3M-user platform. AI systems must be able to discover and cite BaseCommand when traffic arrives. | 2026-03-19 |
| 77 | Schema.org Organization + FAQPage + Article as minimum viable schema | Research calls these "non-negotiable" for AI citation eligibility. Organization proves entity identity, FAQPage provides RAG-ready Q&A, Article proves accountability. | 2026-03-19 |
| 78 | LLMs.txt as early-mover advantage | Emerging standard (like robots.txt was in 2005). Low effort, high signal to LLM crawlers. Few competitors will have this. | 2026-03-19 |
| 79 | Answer-first content structure on all marketing pages | RAG systems retrieve passage-level content. A 40-60 word summary under H1 acts as "feature snippet bait" — the AI's preferred citation format. | 2026-03-19 |
| 80 | Allow all major AI crawlers (GPTBot, ClaudeBot, PerplexityBot) in robots.txt | Blocking AI crawlers means blocking discovery. BaseCommand wants to be cited, not hidden. | 2026-03-19 |
| 81 | Per-page meta tags via React hook, not SSR | BaseCommand is a client-rendered SPA. SSR is overengineering for Gate 0. React hook covers social crawlers that execute JS (most do in 2026). Fallback OG tags in index.html for non-JS crawlers. | 2026-03-19 |
| 82 | Interrogative headings only where they improve discoverability | Don't break the marketing narrative. Convert "The AI Revenue Engine" to "How Does the AI Revenue Engine Work?" only where it serves both human readability and AI retrieval. | 2026-03-19 |
| 83 | Defer dynamic OG images to Gate 1 | Static OG image is sufficient for launch. Dynamic per-page images need an image generation service — not worth the complexity pre-revenue. | 2026-03-19 |

---

## Epic 15: agent.ai Deep Integration + HubSpot Connector

**Status: In Progress**
**Target: 2026-03-21 (end of week)**

### agent.ai Workflow Pipeline

Enable "save to BaseCommand" from inside agent.ai chat. Architecture:

```
User chats with Knowledge Agent (e.g., CRM Data Parser)
    → Agent parses data, structures accounts
    → User says "save these to my portfolio"
    → Knowledge Agent invokes Workflow Agent
    → Workflow Agent POSTs to BaseCommand API with auth token
    → Accounts saved to user's portfolio in Supabase
```

**What we need to build:**
- Public API endpoint: `POST /api/import/external` accepting structured account JSON
- Auth: API key header (generated per user in Settings)
- Workflow Agent configuration on agent.ai (Matthew can guide this on the call)
- Update Knowledge Agent prompts to offer the "save" action

### HubSpot Connector

First CRM integration. Leverages agent.ai's native HubSpot connector.

**What we need to build:**
- Data mapping: HubSpot Deals/Companies → BaseCommand account model
- Import flow: user authorizes HubSpot on agent.ai → agent pulls deal data → structures as BaseCommand accounts
- Sync strategy: one-time import first, recurring sync later

### Stress Testing with Real Data

Create a realistic 20-account dummy portfolio that matches what a user would actually upload:
- Mix of account sizes ($10K to $500K ARR)
- Mix of health states (healthy, at-risk, churning, expanding)
- Realistic renewal dates (some past due, some 30/60/90/180 days out)
- Realistic contact data, product info, engagement history
- Test: CSV import, health scoring, agent outputs, dashboard views, forecast

---

## Epic 14: Marketing Site Overhaul (v0.5.0)

**Status: Completed (2026-03-17)**

Complete rewrite of all marketing pages based on AI Revenue Engine research ("Architecting Intelligence: The AI-Driven Revenue Engine").

### What was built

**6 marketing pages with distinct jobs:**

| Page | Route | Job | Key Content |
|------|-------|-----|-------------|
| Landing | `/` | Convert (30-60 sec) | Hero, Shift table, 5-function workflow, agent.ai, pricing |
| The Problem | `/why` | Wake-up call (2-3 min) | Problem stats, 6 failure mode cards, Shift table, opportunity proof |
| How It Works | `/how-it-works` | Show the system (5 min) | Agentic Flywheel, NRR Waterfall, 4-layer architecture, archetypes |
| Get Started | `/get-started` | Remove objections, drive action | 4-week blueprint, ROI calculator, agent.ai, pricing CTA |
| Agents | `/agents` | agent.ai gateway | 4 live agents + full fleet by category |
| Pricing | `/pricing` | Pricing details | Free/Pro tiers, 14-day trial, FAQ |

**Key frameworks visualized from AI Revenue Engine slides:**
- Slide 5: Traditional Renewals vs AI-Driven RevOps (comparison table)
- Slide 11: AI-Powered Renewal Workflow (5-function pipeline)
- Slide 15: The Agentic Flywheel (3-stage continuous loop)
- Slide 16: AI-Optimized NRR Waterfall (3 intervention points)
- Slide 17: Unified AI Revenue Architecture (4-layer stack)
- Slide 18: Implementation Blueprint (4-week ramp)

**Pricing model updated:** 14-day Pro trial → Free forever or $49/mo founding member

**Nav:** Pricing | Agents | The Problem | How It Works

---
---

## Epic 1: Navigation & Feature Overhaul

### The Problem
The current nav has 10 items organized like a generic productivity suite with renewals bolted on:
- **Command:** Dashboard, Intel
- **Work:** Decisions, Tasks, Priorities, Projects
- **Reference:** Meetings, Library
- **Renewals:** Renewal Ops (single item, buried last)

This contradicts our positioning as "The AI-Powered Renewal Operations Platform." A user landing in the app sees a productivity tool, not a renewal intelligence platform.

### Feature Audit — Decisions Made

| Feature | Verdict | Notes |
|---------|---------|-------|
| **Dashboard** | KEEP — reframe | Renewal command center. Already aligned. |
| **Renewals** | KEEP — promote | Core product. Sub-features may become top-level nav items. |
| **Intel** | MERGE → Renewal Intel | See below. |
| **Expansion** | MERGE → Renewal Intel | Expansion signals become a category within Renewal Intel, not standalone. |
| **Tasks** | KEEP — reframe | Only if scoped to renewal actions (follow-ups, risk mitigation, prep). Not generic task management. |
| **Decisions** | CUT | Doesn't map to any persona's pain point for renewal ops. |
| **Priorities** | CUT / MERGE | Overlaps with Autopilot attention items and Leadership recommendations. Redundant. |
| **Projects** | CUT | Generic project management doesn't serve renewal ops personas. |
| **Meetings** | CUT as nav item | Meeting data is an *input*, not a destination. See Meeting Intelligence below. |
| **Library** | CUT | No clear renewal ops use case. Playbook content can live inside Autopilot. |
| **Settings** | KEEP | Utility — always needed. |

### Meeting Intelligence (New Concept)

Meetings are cut as a standalone nav item, but meeting data is critical input for renewal intelligence.

**Two ingestion paths:**
1. **Integration path (Phase 2):** Gong, Chorus, Fireflies API → pull AI-generated meeting summaries automatically, attach to accounts
2. **Manual path (Phase 1):** Low-friction paste flow (similar to Import) → AI extracts renewal-relevant signals → attaches to accounts

**Where it lives:** Either within Import (as another ingestion method) or a dedicated "Connect/Integrations" area. Not a top-level nav item.

**Open:** Explore Gong API feasibility, pricing, and whether their API is accessible to SMB SaaS companies.

### Renewal Intel (New Concept — Merged from Intel + Expansion)

"Expansion" is too narrow as a standalone destination. "Renewal Intel" is the bigger container:

| Signal Category | Source | Description |
|----------------|--------|-------------|
| Expansion signals | AI analysis (current Expansion tab) | Upsell/cross-sell opportunities |
| Risk signals | AI analysis | Churn indicators, engagement drops |
| Competitive intel | User input, meeting notes, AI | Competitor mentions, displacement risk |
| Meeting insights | Gong/manual ingestion | Key takeaways from renewal calls, QBRs |
| Usage/engagement trends | Future integrations | Product usage patterns |

**Persona fit:**
- Persona 4 (Renewal Leader) wants the full intelligence picture, not just expansion
- Persona 2 (Rev Leader) wants to know where to focus attention
- Persona 3 (RevOps) wants data-driven signals across the portfolio

### Renewal Sub-Features — Current Tabs

Now that we've cut/merged the "OS" features, the renewal sub-features become the core nav. Decision needed: **do these stay as tabs inside one "Renewals" page, or become top-level nav items?**

| Current Tab | Proposed Treatment | Notes |
|------------|-------------------|-------|
| **Autopilot** | Top-level nav? | Core differentiator. Action engine. |
| **Accounts** | Top-level nav? | Where users spend the most time. |
| **Import** | Top-level nav or Settings? | Onboarding entry point. Less frequent after setup. |
| **Expansion** | Merged into Renewal Intel | See above. |
| **Leadership** | Top-level nav? | Key for Persona 4 (Renewal Leader). |

### Proposed Nav Structure

**CONFIRMED — Final Nav Structure:**

```
SIDEBAR (renewals-first)
├─ Dashboard          (Renewal Command Center — portfolio overview, strategic brief)
├─ Accounts           (Portfolio — individual account management + per-account AI chat)
├─ Autopilot          (AI-generated actions across portfolio — approve/copy/dismiss)
├─ Intel              (Expansion + risk + competitive + meeting signals)
├─ Leadership         (Exec briefs, forecasts, health signals, recommendations)
├─ Tasks              (Renewal action items — also surfaced inline in Accounts & Autopilot)
├─ ─────────────────  (separator — daily use above, utility below)
├─ Import             (Data ingestion — CRM paste, meeting notes. Key onboarding entry point)
└─ Settings           (AI config, integrations, account)
```

**Mobile bottom bar (5 items max):**
```
Dashboard | Accounts | Autopilot | Intel  | More
                                          └─ Leadership, Tasks, Import, Settings
```

**Tasks — dual pattern:**
- Own nav item for cross-portfolio task management (ICs and Leadership)
- Also surfaced contextually inside Accounts (per-account tasks) and Autopilot (approved actions → tasks)

### Decision Log

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 1 | Cut Decisions | No persona maps to standalone decision tracking for renewal ops | 2026-03-15 |
| 2 | Cut Priorities | Redundant with Autopilot attention items + Leadership recommendations | 2026-03-15 |
| 3 | Cut Projects | Generic project management doesn't serve renewal personas | 2026-03-15 |
| 4 | Cut Meetings as nav item | Meeting data is an input (ingestion), not a destination. Phase 1: manual paste. Phase 2: Gong/Chorus integration | 2026-03-15 |
| 5 | Cut Library | No clear renewal ops use case. Playbook content lives inside Autopilot | 2026-03-15 |
| 6 | Merge Intel + Expansion → Renewal Intel | Expansion alone is too narrow. Renewal Intel is a richer container for all portfolio signals | 2026-03-15 |
| 7 | Keep Tasks — reframe | Scoped to renewal actions only (follow-ups, risk mitigation, prep). Not generic task management | 2026-03-15 |
| 8 | Promote renewal sub-features to top-level nav | Renewals IS the app, not a subsection. Each feature deserves its own nav item | 2026-03-15 |
| 9 | Import stays top-level with separator | Critical for onboarding (every persona's entry point). Separator signals "utility" vs "daily use" | 2026-03-15 |
| 10 | Tasks as own nav item + contextual inline | Cross-portfolio view for ICs and Leadership, plus surfaced inside Accounts and Autopilot for context | 2026-03-15 |
| 11 | Archive cut features | Keep files in repo, remove from nav/routes. No premature deletion | 2026-03-15 |
| 12 | Nav label: "Intel" not "Renewal Intel" | Short and punchy. Context makes renewal focus obvious | 2026-03-15 |
| 13 | Agents stay external on agent.ai | Top-of-funnel belongs where the users are (3M). No embedding. Clean separation: agents = free taste, app = full product | 2026-03-15 |
| 14 | Quick Add flow for zero-friction onboarding | Solves cold-start for all personas + agent.ai converts. Minimal fields → instant Autopilot/Intel/Leadership value | 2026-03-15 |
| 15 | `/agents` marketing page | Showcases 3 agents, links to agent.ai. Scalable as we add more. Shareable link for agent.ai contact | 2026-03-15 |
| 16 | "Agents" in marketing nav only | Not in app nav — agents are external distribution, not an app feature | 2026-03-15 |

---

## Epic 2: agent.ai Integration

### The Opportunity
- 3M+ users on agent.ai platform
- Personal relationship with platform owner who will promote our agents
- Three agents planned: CRM Parser, Renewal Autopilot, Exec Brief Generator
- Owner will heavily promote regardless of integration depth

### Strategy: External Agents, Native Product

**Agents stay on agent.ai as standalone free tools. BaseCommand is the full product.**

Rationale:
- Agents' job = top-of-funnel distribution on a 3M-user platform. Embedding behind a login wall defeats the purpose
- BaseCommand's job = the full product experience. Once signed up, users get the real thing, not a lite agent
- Clean separation avoids iframe/embed complexity and agent.ai platform dependency
- Conversion CTA inside each agent drives signups: "Want this across your whole portfolio? → basecommand.ai/signup"

### Agent-to-App Conversion Funnel

```
agent.ai (3M users)
  └─ User tries free agent (no sign-up needed)
       └─ Gets instant value (cleaned data / action plan / exec brief)
            └─ Sees CTA: "Want this running across your whole portfolio?"
                 └─ Signs up at basecommand.ai/signup
                      └─ Onboarding: Quick Add a few accounts (zero friction)
                           └─ Sees Autopilot / Intel / Leadership on THEIR data
                                └─ "Wow" moment → imports full portfolio
```

### Agent Specs

| Agent | Free Standalone Value | Conversion Hook | In-Agent CTA |
|-------|----------------------|-----------------|--------------|
| **CRM Data Parser** | Paste messy CRM data → get clean structured accounts | "I want to keep tracking these" | "Save to your BaseCommand portfolio →" |
| **Renewal Autopilot** | Paste account details → get action plan (emails, risk flags, next steps) | "I want this for my whole book" | "Automate your entire portfolio →" |
| **Exec Brief Generator** | Paste portfolio data → get board-ready renewal brief | "I want this updated live" | "Get live briefs from your portfolio →" |

### Lightweight Quick-Add (New — Solves Cold-Start)

The agent.ai funnel (and general onboarding) needs a frictionless way to try BaseCommand before committing to a full import. New concept:

**Quick Add flow** — minimal-field account entry:
```
[Company Name]  [ARR/Value]  [Renewal Date]  [+ Add Another]
─────────────────────────────────────────────────────────────
"Add a few accounts to see BaseCommand in action.
 Ready for your full portfolio? Import or sync →"
```

- Default state of Import when portfolio is empty (before showing paste/CSV flow)
- Also accessible as a persistent "Quick Add" button from Accounts
- User adds 2-3 accounts → immediately sees Autopilot actions, Intel signals, Leadership brief on THEIR data
- Serves all 4 personas: founder with 5 customers, rev leader kicking the tires, agent.ai convert

### Marketing: `/agents` Page

New marketing page at `/agents` showcasing the 3 agents:
- Description of each agent with clear standalone value
- "Try it free on agent.ai" links to each agent
- Explains BaseCommand + agent.ai relationship
- Scales as we add more agents
- Gives the agent.ai contact a shareable link: "Check out basecommand.ai/agents"

**Nav impact:** Add "Agents" link to marketing nav (alongside Pricing), not to the app nav.

### Implementation Plan

**Phase 1 (Build with Epic 1):**
- [ ] Quick Add flow in Import (zero-account onboarding state)
- [ ] `/agents` marketing page (static — links to agent.ai)
- [ ] Add "Agents" to marketing nav

**Phase 2 (After Epic 1 ships):**
- [ ] Build 3 agents on agent.ai platform (using existing prompts from `src/lib/prompts.js`)
- [ ] Configure conversion CTAs inside each agent pointing to basecommand.ai/signup
- [ ] Deep dive into agent.ai builder capabilities (API actions, multi-step flows)
- [ ] Test end-to-end funnel: agent.ai → signup → quick add → aha moment

**Phase 3 (Post-Launch):**
- [ ] API endpoints for deeper agent.ai integration (agents can write directly to user portfolios)
- [ ] Additional agents based on user demand
- [ ] Referral tracking (which agent drove which signup)

---

---

## Epic 3: Post-Login Experience & Onboarding

### The Problem
1. **Logged-in users see marketing:** Visiting `/` shows the Landing page even when authenticated. They should be redirected to `/app`.
2. **Dashboard is stale:** Built around old "executive productivity" features (completed tasks, open decisions, active projects). None of this maps to renewal ops.
3. **No onboarding:** New users land on an empty Dashboard with a "Create a Project" button that links to a cut feature. Zero guidance on what to do.
4. **No Quick Add:** Users can't try the product without committing to a full import.

### Implementation Plan

#### 1. Smart Routing for Authenticated Users
- If logged-in user visits `/`, `/pricing`, or `/agents` → redirect to `/app`
- Marketing site is for prospects only

#### 2. Dashboard Rewrite — Renewal Command Center

**For users WITH accounts (has renewal data):**

| Section | Content | Priority |
|---------|---------|----------|
| **Header** | Personalized greeting + date + refresh button | Must have |
| **Portfolio Snapshot** | Total ARR, # accounts, at-risk ARR, renewals due 30/60/90d | Must have |
| **Pending Actions** | Top 3-5 Autopilot actions awaiting review (approve/dismiss inline) | Must have |
| **Upcoming Renewals** | Next 5 renewals by date with risk indicators | Must have |
| **AI Strategic Brief** | AI-generated portfolio summary (replaces old brief) | Must have |
| **Recent Intel** | Latest 2-3 expansion/risk signals | Nice to have |
| **Quick Links** | Cards linking to Autopilot, Intel, Leadership, Import | Nice to have |

**Data sources:** All from `renewalStore` — accounts, autopilot actions, expansion cache, leadership cache. No dependency on old entityStore.

#### 3. New User Onboarding (Zero Accounts)

When `renewalStore.getAccounts().length === 0`:

```
┌─────────────────────────────────────────────────┐
│  Welcome to BaseCommand, [Name]                 │
│                                                 │
│  Get started in under a minute.                 │
│  Add a few accounts to see AI in action.        │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ Quick Add                                │    │
│  │ [Company] [ARR] [Renewal Date] [+Add]   │    │
│  │ [Company] [ARR] [Renewal Date] [+Add]   │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ── or ──                                       │
│                                                 │
│  [Import from CRM]  [Paste Spreadsheet Data]    │
│                                                 │
│  "Added accounts? Head to Autopilot to see      │
│   AI-generated actions for your portfolio."      │
└─────────────────────────────────────────────────┘
```

- Quick Add: inline form, minimal fields (company name, ARR, renewal date)
- Each added account appears below in a mini-list
- "Go to Autopilot" CTA appears after first account is added
- Import buttons link to `/app/import`

#### 4. Personalization
- Greeting with user's name (already have from auth)
- Time-of-day aware greeting (already have `getGreeting()`)
- Activity-aware: "You have X pending actions" / "Y renewals due this month"

### Decision Log

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 17 | Redirect authenticated users from marketing to /app | Marketing is for prospects, not logged-in users | 2026-03-15 |
| 18 | Full Dashboard rewrite with renewal data | Old dashboard references cut features (decisions, projects). Must reflect renewal ops | 2026-03-15 |
| 19 | Quick Add as primary onboarding in Dashboard | Lower friction than Import for first-time users. Immediate value from 1-2 accounts | 2026-03-15 |
| 20 | Dashboard reads from renewalStore, not entityStore | Renewal data is the product. Old entity data is from archived features | 2026-03-15 |

---

---

## Epic 4: Tasks Overhaul — AI-Powered Renewal Task Engine

### The Problem
Current Tasks page is a generic task list (title, status, priority, due date, subtasks) built for personal task management. It doesn't serve renewal ops personas:
- **Founder/CEO:** Needs to see "what do I need to do for renewals this week" without managing tasks manually
- **Revenue Leader/CRO:** Needs cross-team visibility — what actions are in flight across the portfolio
- **RevOps/CS Ops:** Needs to track operational follow-ups and data hygiene tasks
- **Renewal Leader:** Needs portfolio-level task health — are renewal playbooks being executed, what's falling behind

### What Tasks Should Be
Not a todo list. A **renewal action center** that:
1. Auto-generates tasks from Autopilot actions (approved actions become trackable tasks)
2. Surfaces per-account action items with renewal context
3. Provides portfolio-wide task visibility for leadership
4. Links every task to an account, a renewal, or a portfolio-level initiative

### Design Decisions

**Two task types, one surface:**

| Type | Scope | Examples | Tied to |
|------|-------|----------|---------|
| **Account Actions** | Per-account renewal work | Follow up, send proposal, schedule alignment call | Specific account |
| **Portfolio Operations** | Running the renewal org | Compile forecast, churn analysis, QBR prep, weekly exec summary | Portfolio (no account) |

**Scope boundary:** If it's renewal work, it belongs. If it's not, it doesn't. Not a generic todo list.

**What makes this NOT a todo list:**
1. AI execution layer — tasks trigger AI to do the work (draft exec summary from portfolio data, compile forecast from accounts)
2. Recurring cadences — portfolio ops auto-regenerate on schedule (weekly, monthly, quarterly)
3. Context-aware — every task has full renewal context (ARR, risk, timelines) behind it

**No over-engineering:**
- No projects, tags, or Kanban boards
- No collaboration features (not Asana)
- No subtasks in v1 (keep it flat)

**Task sources (v1):**
1. Manual creation (account task or portfolio operation)
2. Approved Autopilot actions → auto-create as account tasks
3. AI-suggested tasks (future: auto-generate renewal playbook tasks)

**Data model:**
```
{
  id: string,
  title: string,
  type: "account" | "portfolio",     // the two categories
  accountId: string | null,           // null for portfolio ops
  accountName: string | null,
  status: "pending" | "in_progress" | "complete",
  dueDate: string | null,
  recurrence: "none" | "weekly" | "monthly" | "quarterly" | null,  // portfolio ops
  priority: "high" | "medium" | "low",
  aiOutput: string | null,            // AI-generated content for this task
  createdAt: string,
  completedAt: string | null,
}
```

**UI structure:**
- Unified view with two filter tabs: "All" | "Account Actions" | "Portfolio Ops"
- Sorted by: due date (soonest first), then priority
- Quick-create bar at top (type selector: account action vs portfolio op)
- Account actions show account name + risk badge
- Portfolio ops show recurrence badge if recurring
- AI assist button on each task: "Draft this" → AI generates output using portfolio context

**Storage:** `renewalStore` with new methods (getTaskItems, saveTaskItem, etc.) — separate from old entityStore tasks

### Decision Log Additions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 21 | Two task types: Account Actions + Portfolio Operations | Directors need portfolio-level ops tasks (forecast, QBR, exec summary), not just account follow-ups | 2026-03-15 |
| 22 | AI execution layer on tasks | Tasks trigger AI to draft outputs (exec summary, forecast) using portfolio data — not just reminders | 2026-03-15 |
| 23 | Recurring cadences for portfolio ops | Weekly/monthly/quarterly ops tasks auto-regenerate — supports operational rhythm | 2026-03-15 |
| 24 | Scope guard: renewal work only | No generic todos. If it's not renewal ops, it doesn't belong. Keeps product niche | 2026-03-15 |
| 25 | Build both types together | Share same data model and UI surface. Separating would mean touching same code twice | 2026-03-15 |
| 26 | New storage in renewalStore | Separate from old entityStore tasks which are archived generic task management | 2026-03-15 |

---

---

## Epic 5: Forecast — AI-Powered Renewal Forecast Intelligence

### The Vision
Forecast is the #1 reason companies hire $200K+ renewal directors. If BaseCommand can deliver that output to a founder, VP, or director through AI — the product sells itself. This needs to be the most compelling feature in the app.

### Why It Deserves Its Own Tab
- Forecast was buried inside Leadership as one section among many
- It's the highest-stakes output in renewal ops (board visibility, resource allocation, revenue planning)
- Every persona needs it: Founder wants confidence in revenue, CRO wants pipeline coverage, RevOps wants data integrity, Director wants accuracy

### Nav Change
- Pull Forecast out to its own top-level nav item
- Rename Leadership → Briefs (exec briefs + strategic recs, serves ICs and leaders equally)
- Add Forecast agent to agent.ai page

```
├─ Dashboard
├─ Accounts
├─ Autopilot
├─ Forecast    ← NEW
├─ Intel
├─ Briefs      ← renamed from Leadership
├─ Tasks
├─ ─────────
├─ Import
└─ Settings
```

### Forecast Feature Set (Full Vision)

#### Core Forecast View
| Feature | Description |
|---------|-------------|
| **Period Cards** | This month, next month, this quarter, next quarter — each showing total ARR, account count |
| **Confidence Tiers** | Committed (high confidence), Best Case (medium), At Risk (low) — per period |
| **Visual Bars** | Stacked bar per period showing tier breakdown |
| **Overall Metrics** | GRR (Gross Retention Rate), NRR (Net Retention Rate), forecast accuracy score |

#### AI Forecast Analysis
| Feature | Description |
|---------|-------------|
| **Forecast Narrative** | AI-generated summary: "Your Q2 forecast is $X with Y% at risk. Key drivers: ..." |
| **Risk Callouts** | "3 accounts totaling $450K are at risk of churning before renewal" |
| **Confidence Assessment** | AI rates overall forecast confidence with reasoning |
| **Recommended Actions** | AI suggests moves to improve forecast (de-risk, accelerate, expand) |

#### Forecast Trends (Week-over-Week)
| Feature | Description |
|---------|-------------|
| **Snapshot History** | Auto-save forecast state weekly, show trend over time |
| **Movement Tracking** | Which accounts moved between tiers? Which were added/lost? |
| **Forecast Drift** | Is the forecast getting better or worse over time? |

#### Scenario Modeling
| Feature | Description |
|---------|-------------|
| **"What If" Analysis** | "What if we lose Acme Corp?" → instant recalculation |
| **Downside / Upside** | Show worst-case and best-case portfolio outcomes |
| **Segment Analysis** | Forecast by customer segment, size tier, or risk level |

#### Export & Reporting
| Feature | Description |
|---------|-------------|
| **Copy Forecast** | One-click copy of formatted forecast for email/Slack/board deck |
| **Forecast Summary** | Board-ready paragraph with key numbers and narrative |

### Implementation Phases

**Phase 1 (v1 — build now):**
- Period cards with confidence tiers (committed/best case/at risk)
- GRR/NRR calculation from account data
- AI forecast narrative + risk callouts + recommended actions
- Scenario modeling ("what if we lose X?")
- Copy-to-clipboard formatted forecast
- Forecast page + nav changes + Briefs rename

**Phase 2 (post-launch):**
- Snapshot history (auto-save weekly, show trends)
- Movement tracking between tiers
- Forecast drift visualization
- Segment/cohort breakdown

**Phase 3 (future):**
- Forecast agent on agent.ai
- API endpoint for forecast data
- Forecast accuracy scoring (predicted vs actual)

### Decision Log Additions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 27 | Forecast gets own top-level nav | Too important to be buried in Leadership. Highest-stakes output in renewal ops | 2026-03-15 |
| 28 | Rename Leadership → Briefs | "Leadership" implies director-only. Briefs serves ICs too. More descriptive | 2026-03-15 |
| 29 | Full vision for Forecast v1 | Forecast is the impulse-buy feature. Needs to be compelling enough to justify $200K director replacement | 2026-03-15 |
| 30 | Forecast agent planned for agent.ai | "Paste data, get board-ready forecast" is a killer standalone tool | 2026-03-15 |

---

## Epic 6: AI-Initiated Value Delivery — Persona-Driven Task Suggestions

### The Vision
BaseCommand doesn't wait for users to figure out what to do — it tells them. The product knows what good renewal operators do at every level, and proactively suggests the work, pre-built with AI execution.

**Core principle:** AI-initiated value delivery instead of user-initiated. This is a product differentiator AND a marketing message.

### Naming Fix
- Rename "Portfolio Ops" → **"Strategic"** across Tasks
- Task types become: **Account Action** + **Strategic Task**

### Implementation

#### 1. Enhanced Profile (Settings)
Add role/persona selection to Settings:

| Persona | Label | Description |
|---------|-------|-------------|
| **Founder/CEO** | Founder | Running a SaaS company, managing renewals directly |
| **Revenue Leader** | Revenue Leader | VP/CRO managing a sales team with renewal responsibility |
| **RevOps/CS Ops** | RevOps | Operationalizing revenue processes and data |
| **Renewal Director** | Renewal Leader | Director/VP managing a renewal portfolio and team |
| **Renewal Specialist** | Renewal Specialist | IC running the renewal process day-to-day |

Stored in user profile / localStorage. Drives task suggestions.

#### 2. AI Task Suggestions by Persona

**Renewal Specialist (IC)**
| Suggestion | AI Can Do |
|-----------|-----------|
| "Prep for your next upcoming renewal call" | Draft prep brief with account context, risk signals, talking points |
| "Draft renewal outreach for accounts due in 30 days" | Write personalized emails for each upcoming renewal |
| "Review and update account health notes" | Summarize recent activity and flag gaps |
| "Build a save strategy for at-risk accounts" | Generate tactical save plan with steps |
| "Identify accounts missing key contacts" | Scan portfolio for stakeholder gaps |
| "Summarize last quarter's renewal outcomes" | Compile win/loss analysis with patterns |

**Renewal Director/VP**
| Suggestion | AI Can Do |
|-----------|-----------|
| "Compile weekly renewal forecast update" | Generate forecast summary from current data |
| "Conduct quarterly churn analysis" | Analyze churn patterns, root causes, trends |
| "Deep dive into top 10 ARR accounts" | Strategic brief per account with risk/opportunity |
| "Build board-ready retention narrative" | Draft board paragraph with GRR/NRR and narrative |
| "Create QBR prep materials" | Generate QBR deck content with data points |
| "Send weekly executive summary" | Draft exec summary from portfolio state |
| "Analyze forecast accuracy vs last quarter" | Compare predicted vs actual outcomes |

**Revenue Leader (CRO/VP Sales)**
| Suggestion | AI Can Do |
|-----------|-----------|
| "Identify which accounts need exec alignment" | Flag accounts where exec sponsor engagement is needed |
| "Build a renewal pipeline summary for leadership" | Generate pipeline report with confidence tiers |
| "Analyze AE workload across renewal portfolio" | Show account distribution and capacity gaps |
| "Create expansion playbook for top accounts" | Generate upsell strategies per account |

**Founder/CEO**
| Suggestion | AI Can Do |
|-----------|-----------|
| "Review your top 3 accounts by ARR" | Brief on your most important renewals |
| "Build a renewal calendar for the quarter" | Visual timeline of upcoming renewals |
| "Identify your riskiest renewal this month" | Deep dive on highest-risk account |
| "Generate investor-ready retention metrics" | GRR/NRR with narrative for board/investors |

**RevOps/CS Ops**
| Suggestion | AI Can Do |
|-----------|-----------|
| "Audit account data completeness" | Identify missing fields across portfolio |
| "Identify accounts missing renewal dates" | List accounts with data gaps |
| "Run a duplicate account check" | Find potential duplicates by name similarity |
| "Standardize risk level assessment" | AI re-evaluate risk levels based on context |
| "Generate data quality report" | Portfolio data health score with recommendations |

#### 3. "Suggested For You" Section in Tasks
- Shows 3-5 persona-relevant suggestions above the task list
- Each suggestion has: title, description, "Let AI do this" button
- Clicking creates the task AND immediately triggers AI Draft
- Suggestions rotate/refresh — don't repeat dismissed ones
- "See more suggestions" link for full list

#### 4. Future: Smart Timing
- Suggestions based on calendar proximity: "You have 3 renewals in 14 days — prep for them now"
- Monday suggestions: "Start your week — compile this week's renewal actions"
- End of quarter: "Build your QBR deck — AI has your data ready"

### Decision Log Additions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 31 | Rename Portfolio Ops → Strategic | "Ops" doesn't resonate. "Strategic" pairs naturally with "Account Action" | 2026-03-15 |
| 32 | Add Renewal Specialist persona | ICs are the most frequent users — can't forget them in task suggestions | 2026-03-15 |
| 33 | AI-initiated value delivery as core principle | Product differentiator: we tell users what to do, not wait for them to figure it out | 2026-03-15 |
| 34 | Enhanced profile with persona selection | Drives personalized task suggestions. Simple role picker in Settings | 2026-03-15 |
| 35 | Suggested tasks trigger AI Draft immediately | One-click from suggestion to AI-generated output. Maximum "wow" factor | 2026-03-15 |

---

---

## Epic 7: Agent Hub — AI Agents as the Product Experience

### The Vision
BaseCommand's AI features aren't just features — they're agents. The Agent Hub reframes the product as a platform of purpose-built AI agents that work your renewal portfolio. Pre-installed agents cover the core workflows, installable agents let users unlock new capabilities, and the whole experience feels like having a team of AI specialists on staff.

### Nav Consolidation

```
CURRENT (9 items):              NEW (7 items):
├─ Dashboard                    ├─ Dashboard
├─ Accounts                     ├─ Accounts
├─ Autopilot                    ├─ Agents        ← hub for all AI agents
├─ Forecast                     ├─ Tasks
├─ Intel                        ├─ ─────────
├─ Briefs                       ├─ Import
├─ Tasks                        └─ Settings
├─ ─────────
├─ Import
└─ Settings
```

Autopilot, Forecast, Intel, and Briefs move inside the Agent Hub. Nav gets simpler, product feels more powerful.

### Agent Hub Page (`/app/agents`)

**Layout: Two sections**

**Active Agents** — grid of installed/enabled agents with live status:
- Each card shows: icon, name, live metric (pending actions, last run, signals found)
- "Open" button takes user into the agent's full workspace
- Cards sorted by most recently used

**Available Agents** — agents that can be activated:
- Each card shows: icon, name, description, what it does
- "Activate" button enables instantly (no install, just unlocks)
- Activated agents move to Active section

### Pre-Installed Agents (Existing Features, Reframed)

| Agent | Icon | Live Status | Workspace |
|-------|------|-------------|-----------|
| **Autopilot** | ⚡ Bot | "X pending actions" | Existing Autopilot page |
| **Forecast** | 📊 BarChart3 | "GRR: X% · Updated Xh ago" | Existing Forecast page |
| **Intel** | 📡 Radio | "X signals found" | Existing Intel page |
| **Briefs** | 👑 Crown | "Ready to generate" or "Updated Xh ago" | Existing Briefs/Leadership page |

These are the 4 existing features wrapped in the agent frame. Zero functional changes — just a new home and live status cards.

### New Installable Agents (v1 — Build 2)

| Agent | What It Does | Experience | Persona Value |
|-------|-------------|------------|---------------|
| **Renewal Playbook** | Auto-generates 90/60/30 day action checklist per account | Select account → get timestamped playbook → creates tasks in Tasks | Specialist, Director |
| **Meeting Prep** | Prep brief for any upcoming renewal meeting | Select account → talking points, risk summary, ask recommendations, relationship map | Specialist, Revenue Leader |

### Future Installable Agents (v2+)

| Agent | What It Does |
|-------|-------------|
| **Churn Predictor** | Weekly churn probability score per account with reasoning |
| **Win/Loss Analyst** | Retrospective analysis of completed renewals for patterns |
| **Stakeholder Mapper** | Per-account stakeholder map with engagement signals and gaps |
| **Data Quality** | Portfolio data health score with specific fix recommendations |
| **Expansion Scout** | Deep expansion analysis beyond Intel's signal detection |

### Agent Workspace Experience

When a user clicks "Open" on an agent card, they enter the agent's workspace:
- **Back navigation:** "← Agents" link at top to return to hub
- **Agent header:** Agent name + icon + status + "Refresh" button
- **Full workspace:** The agent's complete UI (existing pages for pre-installed, new UIs for installable)
- **Consistent frame:** Every agent workspace feels the same structurally

### Agent Card Component (Shared)

```
┌──────────────────────────────┐
│  [Icon]  Agent Name          │
│                              │
│  Brief description of what   │
│  this agent does             │
│                              │
│  STATUS: Live metric here    │
│                              │
│  [Open] or [Activate]        │
└──────────────────────────────┘
```

### Routing

```
/app/agents              → Agent Hub (grid of all agents)
/app/agents/autopilot    → Autopilot workspace
/app/agents/forecast     → Forecast workspace
/app/agents/intel        → Intel workspace
/app/agents/briefs       → Briefs workspace
/app/agents/playbook     → Renewal Playbook workspace (new)
/app/agents/meeting-prep → Meeting Prep workspace (new)
```

Old routes (/app/autopilot, /app/forecast, etc.) redirect to new paths for backward compatibility.

### Implementation Plan

**Phase 1: Hub + Reframe Existing (build now)**
- [ ] Create Agent Hub page with Active/Available grid
- [ ] Move Autopilot, Forecast, Intel, Briefs into agent sub-routes
- [ ] Add back-navigation ("← Agents") to each workspace
- [ ] Update Sidebar nav (consolidate 4 items → 1 "Agents" item)
- [ ] Update BottomTabBar, TopBar, CommandPalette
- [ ] Add redirects for old routes
- [ ] Live status on agent cards (pending actions count, cache timestamps, signal counts)

**Phase 2: New Agents (build now)**
- [ ] Renewal Playbook agent (select account → generate 90/60/30 day checklist → create tasks)
- [ ] Meeting Prep agent (select account → generate prep brief with talking points)

**Phase 3: Agent Storage + Activation (build now)**
- [ ] Store activated/deactivated state in renewalStore settings
- [ ] Available agents show "Activate" button
- [ ] Activated agents persist across sessions

### Decision Log Additions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 36 | Consolidate Autopilot/Forecast/Intel/Briefs into Agent Hub | Simpler nav (9→7 items), frames AI as agents, creates platform feel | 2026-03-15 |
| 37 | Forecast lives in hub, not top-level nav | One clear path to each feature. Hub card with live GRR makes it visible. Can promote back if needed | 2026-03-15 |
| 38 | Pre-installed agents = existing features reframed | Zero functional changes for v1. New home + live status cards | 2026-03-15 |
| 39 | Renewal Playbook + Meeting Prep as first installable agents | Most immediately valuable for Specialist and Director personas | 2026-03-15 |
| 40 | Agent workspace pattern with back-navigation | Consistent frame for all agents. User always knows they're "inside" an agent | 2026-03-15 |

---

---

## Epic 8: Premium Autonomous Agents — The Roadmap

### The Vision
Move from co-pilot (drafts for human approval) to full autonomous execution (runs the renewal process). This is where BaseCommand becomes indispensable and justifies premium pricing.

### Three Phases

| Phase | Mode | What It Does | Pricing Tier |
|-------|------|-------------|-------------|
| **v1 (now)** | Co-pilot | Drafts emails, generates forecasts, suggests actions. Human approves everything | Free / Pro |
| **v2 (next)** | Supervised autopilot | Sends emails, updates CRM on approval. User sets rules and approves batches | Pro / Team |
| **v3 (future)** | Full autonomous | Runs the entire renewal process. Monitors, acts, escalates only when needed | Team / Enterprise |

### v2: Supervised Autopilot — Technical Requirements

**Email Send (not just draft):**
- Gmail API write access (send on behalf of user)
- Outlook/Microsoft Graph API send
- Email templates with merge fields from account data
- Send queue with batch approval ("approve all 5 low-risk renewal emails")
- Delivery tracking (sent, opened, replied)

**CRM Write Integration:**
- Salesforce API (create tasks, update opportunities, log activities)
- HubSpot API (same)
- Field mapping UI (BaseCommand fields → CRM fields)
- Sync log with rollback capability

**Rules Engine:**
- User-defined guardrails per action type
- Examples: "Auto-send renewal reminders for accounts under $50K ARR"
- "Never send without approval for accounts over $500K"
- "Auto-update CRM notes after every AI interaction"
- Rule builder UI (condition → action → approval level)

**Execution Log:**
- Audit trail of every autonomous action
- What was done, when, to which account, by which agent
- Undo/rollback capability for reversible actions
- Dashboard showing agent activity feed

**Escalation Framework:**
- Agent knows when to stop and ask the human
- Risk-based: high-ARR accounts always escalate
- Anomaly-based: unusual response patterns trigger human review
- Configurable thresholds per user/persona

### v3: Full Autonomous — Future Vision

- Agents monitor email responses and auto-reply in threads
- Agents detect renewal risk from email sentiment and escalate
- Agents send quotes and proposals based on templates
- Agents schedule meetings via calendar integration
- Agents build and update forecasts weekly on schedule
- Agents generate and distribute exec summaries automatically
- Human only involved for strategic decisions and exceptions

### Revenue Model for Premium Agents

| Tier | Agents | Autonomy | Price |
|------|--------|----------|-------|
| Free | 4 pre-installed (co-pilot only) | Draft only | $0 |
| Pro | All agents + supervised autopilot | Send with approval | $99-149/mo |
| Team | Multi-user + full autonomous | Rules-based auto-execution | $299-499/mo |
| Enterprise | Custom agents + API access | Full autonomous + custom rules | Custom |

### Implementation Priority (v2 — next to build)

1. Gmail send integration (already have OAuth, need write scope)
2. Execution log UI (show what agents have done)
3. Batch approval workflow ("approve these 5 actions at once")
4. Basic rules engine (per-action approval thresholds)
5. CRM write integration (Salesforce first)

---
---

## Epic 9: Security & Foundation

### The Problem
BaseCommand needs to earn the trust of companies before they'll let it touch their CRM, email, or renewal data. As we move toward autonomous agents that *act* on behalf of users (sending emails, updating CRM), the trust bar goes up dramatically.

### Strategy: Security Milestones Mapped to Revenue Gates
We don't over-invest in compliance before proving demand. Each security milestone unlocks the next tier of customers and maps to a revenue gate.

### Milestone 1 — "Credible" (Gate 0–1: Pre-revenue → $1K MRR)

Gets past a small company's informal review. Minimum bar for real users.

| Requirement | Details | Status |
|-------------|---------|--------|
| **User authentication** | Email/password + Google OAuth via Supabase Auth | **DONE** — authStore.js, AuthGate.jsx, Login/Signup pages |
| **Session management** | Secure tokens, expiry, logout | **DONE** — Supabase Auth handles sessions + onAuthStateChange listener |
| **HTTPS everywhere** | Handled by Vercel | **DONE** |
| **Secrets management** | API keys in Vercel env vars / KV, never client-side | **DONE** |
| **Server-side data** | Supabase Postgres replaces localStorage for all renewal data | **NOT DONE** — only `profiles` table exists. All business data in localStorage |
| **Tenant isolation** | Row-level security — users can only access their own data | **NOT DONE** — needs Postgres migration first |
| **Basic audit log** | Log agent actions (what, when, which account) to database | **NOT DONE** |
| **Cost** | Engineering time only. Supabase free tier to start. | — |

### Milestone 2 — "Vetted" (Gate 2: $5K MRR)

Gets through a mid-market procurement process. Required before selling to companies with security questionnaires.

| Requirement | Details |
|-------------|---------|
| **Penetration test** | Third-party pen test, remediate findings, publish summary |
| **Security questionnaire** | Pre-built answers for common vendor security questionnaires |
| **Privacy policy + ToS** | Legally reviewed, published on site |
| **DPA template** | Data Processing Agreement for customers who need it |
| **Dependency scanning** | Automated CVE scanning in CI (npm audit, Dependabot) |
| **RBAC** | Admin / member roles within organizations |
| **MFA** | Optional multi-factor auth for users who want it |
| **Cost** | ~$5-15K (pen test + legal templates) |

### Milestone 3 — "Trusted" (Gate 3: $25-50K total revenue)

Full compliance posture. Required for mid-market and enterprise customers.

| Requirement | Details |
|-------------|---------|
| **SOC 2 Type I → Type II** | Compliance platform (Vanta/Drata/Secureframe) + auditor |
| **Compliance platform** | Automated evidence collection, policy management |
| **Bug bounty program** | Responsible disclosure program, possibly via HackerOne |
| **Data residency controls** | Choose where customer data is stored (US/EU) |
| **Incident response plan** | Documented, tested procedure for security incidents |
| **Full audit trail** | Immutable, queryable log of all system actions |
| **Data retention & deletion** | Right-to-delete, configurable retention policies |
| **Backup & recovery** | Automated backups, tested restore procedures |
| **Cost** | ~$25-40K year one, ~$20-30K ongoing |

### Why Security Is Harder with Autonomous Agents
When BaseCommand is just a dashboard, a security failure means data exposure. When BaseCommand is sending emails and updating CRM on behalf of users, a security failure means:
- Unauthorized emails sent from user accounts
- CRM data modified or deleted
- Customer communications compromised
- Business relationship damage

This is why the execution log, approval workflows, and rules engine (Epic 8) are security features as much as product features.

### Implementation Priority
1. ~~**Supabase Auth**~~ — **DONE** (email/password, Google OAuth, session management, auth gate)
2. **Postgres data migration** — move renewal data from localStorage to Supabase Postgres
3. **Row-level security** — tenant isolation from day one
4. **Audit log table** — every agent action logged
5. Everything else follows revenue gates

### Decision Log Additions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 41 | Security milestones mapped to revenue gates | Don't over-invest before proving demand. Each milestone unlocks next customer tier | 2026-03-16 |
| 42 | Supabase Auth + Postgres as foundation | Managed service, low maintenance (side-hustle constraint). Free tier to start, scales with revenue | 2026-03-16 |
| 43 | Row-level security from day one | Tenant isolation can't be retrofitted safely. Must be foundational | 2026-03-16 |
| 44 | SOC 2 only after $25-50K total revenue | Compliance costs ~$30-50K. Must be funded by proven demand, not speculation | 2026-03-16 |
| 45 | Autonomous agents raise the security bar | Agents that act (send emails, update CRM) require stricter security than read-only dashboards | 2026-03-16 |

---

---

## Epic 10: AI Access & Monetization — Zero-Friction AI That Pays For Itself

### The Problem
Today, users must bring their own Anthropic API key before any AI feature works. This is a massive onboarding killer:
- Most users don't know what an API key is
- Those who do still have to leave the app, create an Anthropic account, generate a key, and paste it in
- The "wow moment" (AI analyzing their portfolio) is gated behind a technical hurdle
- The agent.ai → BaseCommand funnel breaks: users come from an AI agent that "just worked" and land in an app that asks them to configure AI themselves

**This is the difference between "cool tool for developers" and "product that businesses pay for."**

### The Solution: BaseCommand Provides AI

AI is included in the product. Users never see an API key unless they want to.

| Tier | Model | Limits | How It Works |
|------|-------|--------|-------------|
| **Free** | Claude Sonnet | 50 AI calls/month | BaseCommand API key on server, metered per user |
| **Pro** | Claude Opus | Unlimited | BaseCommand API key, included in $49/mo (founding) / $149/mo (standard) |
| **Team/Enterprise** | Claude Opus + BYOK option | Unlimited | Use ours or bring your own for compliance |

### Why This Is A Big Deal

1. **Conversion:** Sign up → add accounts → AI works instantly. No friction, no drop-off.
2. **Natural paywall:** Free users hit 50-call limit after experiencing real value → upgrade prompt → Pro.
3. **Revenue justification:** "Unlimited AI-powered renewal operations for $149/mo" is a clear value prop. "Access to a dashboard where you configure your own AI" is not.
4. **Competitive moat:** Every AI SaaS works this way — Notion AI, Jasper, Copy.ai. BYOK is niche, not mainstream.

### The Economics

| | Cost Per Call | Cost Per User/Month | Notes |
|---|---|---|---|
| **Free (Sonnet, 50 calls)** | ~$0.01-0.05 | ~$0.50-2.50 | 90% of free users will be low-activity |
| **Pro (Opus, unlimited)** | ~$0.05-0.15 | ~$5-15 | At $149/mo, that's 90-97% gross margin |

**Break-even on free users:** If 1,000 free users from agent.ai cost ~$1-2K/mo in API fees, that's covered by ~10-15 Pro customers. The free tier is marketing spend, not a loss center.

**At scale:** 100 Pro customers × $149 = $14,900 MRR. API costs ~$1,500/mo. That's 90% margin before infra.

### The BYOK Option (Advanced, Not Default)

Available in Settings → AI Configuration:
- Toggle: "Use BaseCommand AI (recommended)" vs "Use your own API key"
- When BYOK is selected: existing API key input fields appear
- Use case: enterprise customers whose security team requires it, power users who want Opus on free tier
- BYOK users bypass metering — they're paying Anthropic directly

### Implementation

**Dependencies:** Requires Epic 9 (Supabase Auth + Postgres) for user identity and usage tracking.

**Phase 1 — BaseCommand-Provided AI (build with Epic 9):**

| Task | Details |
|------|---------|
| **Master API key** | Store BaseCommand's Anthropic API key as Vercel env var (already supported by `/api/ai.js` fallback) |
| **Remove API key requirement from onboarding** | New users get AI immediately — no setup needed |
| **Model routing** | Free users → Sonnet, Pro users → Opus. Route in `/api/ai.js` based on user tier |
| **Usage tracking table** | Supabase table: `ai_usage` (user_id, call_count, period, model, tokens_used) |
| **Usage metering** | Increment counter on each `/api/ai` call. Check against tier limits. |
| **Limit enforcement** | At 50 calls: soft block with "You've used your free AI calls this month. Upgrade to Pro for unlimited Opus-powered AI." |
| **Usage display** | Show "X/50 AI calls used" in free tier UI (Settings or subtle indicator) |

**Phase 2 — Monetization Integration (build with Stripe at Gate 1):**

| Task | Details |
|------|---------|
| **Tier detection** | Check user's subscription status (Stripe) to determine model + limits |
| **Upgrade prompts** | Contextual "Upgrade to Pro" when free limit hit or when trying Pro features |
| **BYOK toggle in Settings** | "Use BaseCommand AI" (default) vs "Use your own key" |
| **Billing page** | Usage stats: AI calls this month, model used, estimated cost savings vs DIY |

**Phase 3 — Optimization (post-launch):**

| Task | Details |
|------|---------|
| **Smart model routing** | Use Sonnet for simple tasks (data parsing), Opus for complex (forecasts, briefs) even on Pro |
| **Caching** | Cache identical AI requests (same portfolio, same prompt) to reduce costs |
| **Token budgeting** | Track token usage, not just call count, for more accurate cost management |
| **Cost dashboard** | Internal dashboard showing total API spend, per-user averages, margin tracking |

### What Changes in the Existing Code

The `/api/ai.js` proxy already supports this pattern — it resolves API keys from Vercel KV first, falls back to env vars. The changes:

1. **Default behavior flips:** Instead of "require user key, fall back to env var," it becomes "use BaseCommand key by default, override with user key if BYOK"
2. **Add user context to API calls:** Pass user ID and tier so the proxy can route to correct model and enforce limits
3. **Add metering middleware:** Count and log each call before proxying to Anthropic

### The User Experience

**New user (free tier):**
```
Sign up → Add first account → Click "Generate Autopilot Actions"
→ AI just works (Sonnet) → Sees draft emails, risk assessments
→ "Wow, this is useful"
→ Uses 50 calls over 2 weeks exploring the product
→ Hits limit → "Upgrade to Pro for unlimited AI with our most powerful model"
→ Pays $149/mo → Opus unlocks → Everything is faster and smarter
```

**Enterprise user (BYOK):**
```
Sign up → Settings → AI Configuration → "Use your own API key"
→ Pastes company Anthropic key → All AI calls use their key
→ No metering, no limits — they're paying Anthropic directly
→ Satisfies security team's requirement for direct API relationship
```

### Decision Log Additions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 46 | BaseCommand provides AI — no API key required for users | API key requirement kills onboarding. Every successful AI SaaS includes AI in the product. | 2026-03-16 |
| 47 | Free tier: Sonnet, 50 calls/month | Sonnet is 10x cheaper than Opus. 50 calls is enough to experience value but creates natural upgrade pressure. | 2026-03-16 |
| 48 | Pro tier: Opus, unlimited | Opus is the premium perk. "Faster, smarter AI" is a tangible upgrade users can feel immediately. | 2026-03-16 |
| 49 | BYOK as advanced option, not default | Enterprise/compliance use case only. Buried in Settings. 99% of users should never see an API key field. | 2026-03-16 |
| 50 | Free tier API cost is marketing spend | ~$1-2/mo per free user is cheaper than any ad channel. Covered by ~10-15 Pro conversions. | 2026-03-16 |
| 51 | Early adopter pricing: $49/mo ($39 annual), first 100, locked for life | $149 causes sticker shock for first audience (founders, agent.ai converts). $49 is impulse-buy territory. Proves demand at 70-90% margin. Price rises for new customers at Gate 2. | 2026-03-16 |
| 52 | Pricing evolution: $49 → $99 at Gate 2 → $149 post-SOC 2 | Anchor high, discount early. Early adopters keep their rate forever. New customers pay more as product matures. | 2026-03-16 |

---

---

## Epic 11: Brand & Operations (Deferred — Post-Launch)

### The Vision
Once the product is functioning end-to-end (Postgres, Stripe, AI access), shift focus to building the brand and driving awareness. This epic is intentionally deferred — product first, marketing second.

### What's Done (Pre-Launch)
- Email forwarding: michael@basecommand.ai, hello@basecommand.ai, catch-all (free via Namecheap)
- LinkedIn company page secured
- YouTube channel secured
- 4 agents live on agent.ai
- `/agents` marketing page with real links

### Phase 1 — At Gate 1 ($1K MRR)

| Task | Details | Cost |
|------|---------|------|
| **Google Workspace** | michael@basecommand.ai as proper mailbox with SMTP send, calendar, Drive | $7/mo |
| **Migrate accounts** | Update all services (Vercel, Supabase, Stripe, social, agent.ai) to basecommand.ai email | Free |
| **Privacy Policy + ToS** | Publish on site, required for Stripe and customer trust | Template or ~$500 legal |

### Phase 2 — At Gate 2 ($5K MRR)

| Task | Details | Cost |
|------|---------|------|
| **Demo videos** | 60-second screen recordings for each agent.ai agent and key product features | Free (screen recording) |
| **Social media presence** | Start posting on LinkedIn and X — product updates, renewal ops insights, customer wins | Free |
| **Content marketing** | Blog posts, LinkedIn articles on renewal ops best practices | Free |
| **agent.ai featured placement** | Request promotion once advertising readiness checklist is complete | Free (relationship) |

### Phase 3 — At Gate 3+ ($10K+ MRR)

| Task | Details | Cost |
|------|---------|------|
| **Paid marketing experiments** | LinkedIn ads, Google ads targeting renewal ops keywords | $500-1K/mo |
| **Case studies** | Customer success stories with real metrics | Free |
| **Product Hunt launch** | Coordinated launch with early adopter testimonials | Free |
| **Community building** | Discord or Slack community for renewal ops professionals | Free |

### Social Handles Secured

| Platform | Status | Handle |
|----------|--------|--------|
| LinkedIn | Secured | BaseCommand company page |
| YouTube | Secured | BaseCommand channel |
| X / Twitter | Pending | Need to update email + username |
| GitHub | Pending | basecommand or basecommandai |
| Product Hunt | Pending | basecommand |
| Reddit | Pending | u/basecommand |
| Bluesky | Pending | basecommand |

### Decision Log Additions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 54 | Defer brand/marketing epic until product is functioning | Product must accept payments and persist data before driving traffic. One shot at first impressions. | 2026-03-16 |
| 55 | Free email forwarding now, Google Workspace at Gate 1 | $84/yr isn't justified before revenue. Forwarding covers receiving for free. | 2026-03-16 |
| 56 | Social campaigns start at Gate 2, not before | Need product maturity and early customer wins before public marketing push | 2026-03-16 |

---

---

## Epic 12: My Company — Company Profile & Renewal Strategy

### The Problem
The AI doesn't know what the user's company sells. When generating renewal emails, it recommends competitor products. When assessing expansion, it can't reference actual product tiers or pricing. When drafting forecasts, it doesn't know uplift rules or contract term structures. Every AI output is generic instead of company-specific.

### The Solution: AI-First Company Profile + Renewal Strategy

A "My Company" section where users input their company context through an AI-assisted flow — paste messy data, AI extracts structure, user confirms. Plus a renewal strategy framework that captures what the company wants at renewal and what it offers in exchange.

### Company Profile Data Model

**P0 — Required for basic functionality:**

| Field | Why | Used By |
|-------|-----|---------|
| Company name | Every email draft, every reference | All prompts |
| Product description (1-2 sentences) | AI must know what product is being renewed | Autopilot, Expansion |
| Product/SKU list with prices | Correct product references, upsell paths | Autopilot, Intel |
| Standard contract terms (length, billing) | Forecasting, renewal date logic | Forecast, Autopilot |
| Standard uplift/escalation rate | Renewal pricing guidance | Autopilot, Forecast |
| User name and title | Email signatures, exec briefs | Autopilot |

**P1 — Significantly improves output:**

| Field | Why | Used By |
|-------|-----|---------|
| Top 3-5 competitors + differentiation | Competitive displacement, risk assessment | Intel, Autopilot |
| Value propositions | Talk tracks, renewal justification | Autopilot, Leadership |
| Discounting rules/guardrails | Realistic pricing in drafts | Autopilot |
| Upsell/cross-sell paths | Expansion recommendations | Intel/Expansion |
| Fiscal year start month | Quarterly reporting alignment | Forecast, Leadership |

**P2 — Advanced:**

| Field | Why | Used By |
|-------|-----|---------|
| ICP description | Risk scoring for accounts outside ICP | Intel, Leadership |
| Retention/expansion targets | Forecast benchmarking | Forecast, Leadership |
| Renewal playbook description | AI aligns to your process | Autopilot |

### Renewal Strategy Framework

**Negotiation Exchange Configuration:**

Two-sided framework capturing what the company wants from customers at renewal and what it's willing to give in exchange:

**"What We Want" (renewal objectives):**
- Multi-year commitment
- New product adoption
- Upfront/annual payment (better payment terms)
- Case study or reference
- Executive sponsor access
- Custom items

**"What We'll Give" (negotiation levers):**
- Lower annual price lifts
- Waived implementation fees
- Extended support hours
- Early access to features
- Dedicated CSM
- Custom items

**Renewal Strategy Rules (free text):**
Example: "Lead with 3-year options. 1-year = 7% lift (or flat if at list price). 3-year = 3% annual lift locked in. Never discount for multi-year — we offer lower lifts instead."

This framework lets the AI draft emails like: "I'd like to propose a 3-year renewal at a locked 3% annual adjustment — that saves you $X compared to annual renewals over the same period."

### User Experience

**Step 1 — Quick Start (30 seconds):**
Single textarea: "Tell us about your company. Paste your website, pitch deck, pricing page, or just describe what you sell."
AI extracts structured profile via `COMPANY_EXTRACT_PROMPT`. Shows result as editable cards.

**Step 2 — Review & Edit (60 seconds):**
Organized cards: Company Info, Products/Pricing, Contract Terms, Competitive Landscape, Renewal Strategy.
Missing P0 fields flagged with amber "Add this to improve AI output" indicator.

**Step 3 — Progressive Prompting (over time):**
Contextual banners on agent pages: "Your email drafts would be more specific with competitor info. Add now?"

### Technical Design

**Storage:** No new tables. Company profile nests inside existing `user_settings.settings` JSONB column.

**Prompt Integration:** A `buildCompanyContext()` helper serializes the profile into a text block. Each renewal prompt gains a `companyContext` parameter (~3 lines per caller).

**Data shape:**
```json
{
  "companyProfile": {
    "companyName": "Acme SaaS",
    "productDescription": "Cloud project management for enterprise",
    "products": [
      { "name": "Team Plan", "price": "$15/user/mo", "description": "Up to 50 users" },
      { "name": "Enterprise", "price": "$45/user/mo", "description": "Unlimited, SSO, API" }
    ],
    "contractTerms": "Annual contracts, net-30 billing",
    "upliftRate": "7% annual (1-year), 3% annual (3-year)",
    "senderName": "Michael",
    "senderTitle": "Sr. Director of Global Renewals",
    "competitors": [
      { "name": "Monday.com", "differentiation": "Deeper enterprise integrations, SOC2" }
    ],
    "valueProps": "Enterprise security, 99.99% uptime, dedicated CSM >$50K",
    "discountRules": "Max 15% without VP approval. Multi-year = lower lifts, not discounts.",
    "upsellPaths": "Team → Enterprise at 50+ users. All plans → Analytics Add-on.",
    "renewalStrategy": {
      "wants": ["Multi-year commitment", "New product adoption", "Upfront payment"],
      "gives": ["Lower annual price lifts", "Waived implementation", "Early access"],
      "rules": "Lead with 3-year. 1-year = 7% lift. 3-year = 3%/yr locked. Never discount for multi-year."
    }
  }
}
```

### Implementation Plan

**Phase 1 — MVP (this session):**
- [ ] `COMPANY_EXTRACT_PROMPT` in prompts.js
- [ ] `buildCompanyContext()` helper in prompts.js
- [ ] Add companyContext parameter to all 4 renewal prompts
- [ ] "My Company" section in Settings with paste-and-extract wizard
- [ ] Renewal strategy / negotiation exchange UI
- [ ] Update all AI callers to inject company context

**Phase 2 — Polish (next session):**
- [ ] Progressive nudge banners on agent pages
- [ ] Product catalog add/remove/edit UI
- [ ] AI extraction preview with inline editing

### Decision Log Additions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 57 | Company profile stored in existing settings JSONB | No new tables needed. One document per user, no relational queries. | 2026-03-16 |
| 58 | AI-first ingestion (paste → extract → confirm) | Users shouldn't fill out 50 form fields. Paste pitch deck, AI does the work. | 2026-03-16 |
| 59 | Negotiation exchange framework (wants vs. gives) | Every renewal team has this playbook, usually undocumented. Makes AI drafts strategically accurate. | 2026-03-16 |
| 60 | Renewal strategy rules as free text | Too varied across companies to structure. Free text lets the AI interpret context-specific rules. | 2026-03-16 |

---

---

## agent.ai Agent Specs (Ready to Build)

### Agent 1: CRM Data Parser
- **Platform:** agent.ai
- **Source prompt:** `RENEWAL_IMPORT_PROMPT` from `src/lib/prompts.js`
- **Input:** User pastes messy CRM data (Salesforce exports, spreadsheets, notes)
- **Output:** Clean, structured renewal accounts (name, ARR, renewal date, risk level, contacts)
- **CTA:** "Save these accounts to your BaseCommand portfolio → basecommand.ai/signup"

### Agent 2: Renewal Autopilot
- **Platform:** agent.ai
- **Source prompt:** `RENEWAL_AUTOPILOT_PROMPT` from `src/lib/prompts.js`
- **Input:** User pastes account details + context
- **Output:** Action plan with draft emails, risk assessments, next steps
- **CTA:** "Automate this across your entire portfolio → basecommand.ai/signup"

### Agent 3: Exec Brief Generator
- **Platform:** agent.ai
- **Source prompt:** `RENEWAL_LEADERSHIP_PROMPT` from `src/lib/prompts.js`
- **Input:** User pastes portfolio data
- **Output:** Board-ready executive brief with forecast, health signals, recommendations
- **CTA:** "Get live briefs from your portfolio → basecommand.ai/signup"

### Agent 4: Forecast Intelligence (NEW)
- **Platform:** agent.ai
- **Source prompt:** `RENEWAL_FORECAST_PROMPT` from `src/lib/prompts.js`
- **Input:** User pastes renewal portfolio data
- **Output:** Full forecast with GRR/NRR, confidence tiers, scenario analysis, risk callouts
- **CTA:** "Get live forecasting from your portfolio → basecommand.ai/signup"

---

## Branding & Copy Guidelines

### Brand Name
- **Correct:** "BaseCommand" (one word, camelCase in logos/UI)
- **Incorrect:** "Base Command" (two words — legacy, being phased out)

### Taglines & Descriptions
- **Primary tagline:** "AI-Powered Renewal Intelligence"
- **Hero subtitle:** "Your entire renewal workflow — powered by AI agents that work alongside you or run autonomously."
- **Pill badge:** "AI-powered renewal workflows — from co-pilot to fully autonomous"
- **Dashboard empty state:** "Your renewal command center is ready"
- **Dashboard description:** "Import your portfolio, automate renewal workflows, and surface expansion opportunities — all from one platform."
- **AI persona:** "BC" — described as "AI-powered renewal intelligence co-pilot"
- **Renewals subtitle:** "AI-powered renewal automation, expansion intelligence, and executive reporting"

### Navigation Labels
- Dashboard → "Renewal Command Center" (in TopBar)
- Renewals section → "Renewal Ops" (in Sidebar)
- Renewals page title → "Renewal Operations" (in TopBar)

### Tone
- Confident but not corporate
- Direct and actionable
- "Co-pilot" not "assistant"
- Strategic, not administrative

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, Zustand, Vite |
| Language | JavaScript (JSX) — no TypeScript |
| Styling | Inline styles with design tokens (`src/lib/tokens.js`) |
| Fonts | Space Grotesk (headings), Inter (body), JetBrains Mono (code/data) |
| State | Zustand (`entityStore`, `appStore`) + localStorage (`renewalStore`) |
| AI | `callAI()` → `/api/ai` proxy → Anthropic or OpenAI |
| Backend | Vercel Serverless Functions |
| Storage | Vercel KV (production), localStorage (client) → migrating to Supabase (Epic 9) |
| Auth | OAuth2 (Gmail, Outlook connectors) → adding Supabase Auth (Epic 9) |
| Build | Vite, ESLint (flat config) |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/pages/Renewals.jsx` | Main renewals page (all 5 tabs) |
| `src/lib/prompts.js` | All AI prompt definitions (import, autopilot, expansion, leadership, forecast) |
| `src/lib/storage.js` | Data persistence layer (`renewalStore` for accounts, actions, caches) |
| `src/lib/ai.js` | AI call abstraction (`callAI()`) |
| `src/lib/tokens.js` | Design tokens (colors, fonts, spacing) |
| `src/lib/utils.js` | Utilities (similarity, formatting, date helpers) |
| `src/pages/Dashboard.jsx` | Renewal command center / home page |
| `src/components/layout/Sidebar.jsx` | Navigation sidebar |
| `src/components/layout/TopBar.jsx` | Top bar with view titles |
| `src/pages/Settings.jsx` | Settings & AI configuration |
| `api/ai.js` | Serverless AI proxy (Anthropic + OpenAI) |
| `api/connectors/` | Gmail/Outlook OAuth flows + email scanning |
| `CLAUDE.md` | Claude Code instructions (technical guidance) |
| `PLAN.md` | **This file** — vision, business model, and master plan |

---

## Epic 16: v2 Design — Unified App Redesign (v0.6.0)

**Status:** Completed (2026-03-19)

**Problem:** The marketing site sells an AI Revenue Operating System — continuous monitoring, NRR waterfall, behavioral archetypes, graduated autonomy — but the app delivered a co-pilot tool with 9 agent sub-pages. This disconnect would disappoint users who sign up based on the marketing promise.

**Mental model shift:** From "a list of 9 agent tools organized by category" to "an AI Revenue Engine that runs continuously, with a human command layer for oversight."

### What shipped

**Phase 1 — Sidebar + Command Center:**
1. Sidebar restructured to 5 workflow-stage groups (Command Center, Portfolio, Agents, Actions, Intelligence) — down from 7+ items with 9 sub-agents
2. Agent Status Strip on dashboard — shows all 9 agents with active/idle status
3. NRR Waterfall visualization on dashboard — expansion, contraction, churn, net impact
4. Approval Queue with approve/dismiss buttons — the "supervised autopilot" experience
5. Activity Feed — proves agents are working continuously
6. Archetype Distribution chart — surfaces the behavioral archetype data already computed

**Phase 2 — Portfolio Filtering + Intelligence Hub:**
7. Global filter bar on Portfolio page — risk level, renewal window, archetype pills
8. Archetype badges on every account with renewal probability
9. Intelligence Hub combining Executive Brief + Forecast in a tabbed view
10. Segment filter placeholder (Enterprise/Mid-Market/SMB)

**Phase 3 — Agent Hub + Autonomy + Export:**
11. Agent Hub redesigned with Active (running agents) vs Catalog (available agents) tabs
12. Autonomy dial per agent (Suggest active, Draft/Execute locked for future)
13. Export toolbar (Copy/PDF/Slides/Email) on Intelligence outputs

### Files changed
- `src/components/layout/Sidebar.jsx` — full restructure
- `src/components/layout/BottomTabBar.jsx` — updated to match sidebar
- `src/components/layout/TopBar.jsx` — added Intelligence, renamed Accounts → Portfolio
- `src/components/dashboard/DashboardWidgets.jsx` — **new** (AgentStatusStrip, NRRWaterfall, ApprovalQueue, ActivityFeed)
- `src/components/ui/AgentWidgets.jsx` — added ExportToolbar
- `src/pages/Dashboard.jsx` — Mission Control redesign
- `src/pages/Intelligence.jsx` — **new** Intelligence Hub
- `src/pages/IntelligenceTabs.jsx` — **new** Brief + Forecast tab content
- `src/pages/AgentHub.jsx` — Active/Catalog + autonomy dial
- `src/pages/Accounts.jsx` — filter bar, archetype badges
- `src/App.jsx` — Intelligence route + redirects

### Decision Log Additions
- **Sidebar to 5 groups:** Reduces visual overload. Data Sources moves to Settings (setup task, not daily workflow). Individual agent links removed from sidebar — navigation happens in Agent Hub.
- **Intelligence Hub over Leadership:** "Leadership" was unclear. "Intelligence" positions the page as the analytical command center combining briefs + forecasts + future presentations.
- **Autonomy dial (Suggest/Draft/Execute):** Foreshadows the product roadmap without overpromising. Draft and Execute modes locked until Epic 8 (Premium Autonomous Agents) ships.
- **Client-side export strategy:** PDF via browser print, PPTX via pptxgenjs (future), Google Slides as premium connector. No server cost for MVP.
- **Simulated activity feed:** Uses account lastActivity dates and deterministic hashing for stable display. Will be replaced with real agent event log when agent scheduling ships.

---

## Open Questions

1. ~~Which "operating system" features actually serve renewal personas vs. are generic filler?~~ **Resolved**
2. ~~Should renewal sub-features be top-level nav items?~~ **Resolved — yes, promoted**
3. ~~What's the right mobile nav?~~ **Resolved — draft confirmed above**
4. ~~How does the agent.ai funnel change the onboarding flow?~~ **Resolved — Quick Add flow solves cold-start for all funnels**
5. ~~Should Import be top-level or tucked away?~~ **Resolved — top-level with separator**
6. ~~Does Tasks stay as own nav item?~~ **Resolved — yes, plus inline in Accounts/Autopilot**
7. ~~What happens to cut features?~~ **Resolved — archive (keep files, remove from nav/routes)**
8. ~~Naming for merged Intel/Expansion?~~ **Resolved — "Intel" (short, contextually clear)**
9. When to build Supabase Auth — before or after agent.ai agents? (Epic 9 vs Epic 2 sequencing)
10. Gong API feasibility and pricing for meeting intelligence ingestion
