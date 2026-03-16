# BaseCommand Master Plan

> **Living document.** Updated as decisions are made. Source of truth for what we're building and why.

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

## Open Questions

1. ~~Which "operating system" features actually serve renewal personas vs. are generic filler?~~ **Resolved**
2. ~~Should renewal sub-features be top-level nav items?~~ **Resolved — yes, promoted**
3. ~~What's the right mobile nav?~~ **Resolved — draft confirmed above**
4. ~~How does the agent.ai funnel change the onboarding flow?~~ **Resolved — Quick Add flow solves cold-start for all funnels**
5. ~~Should Import be top-level or tucked away?~~ **Resolved — top-level with separator**
6. ~~Does Tasks stay as own nav item?~~ **Resolved — yes, plus inline in Accounts/Autopilot**
7. ~~What happens to cut features?~~ **Resolved — archive (keep files, remove from nav/routes)**
8. ~~Naming for merged Intel/Expansion?~~ **Resolved — "Intel" (short, contextually clear)**
