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

## Open Questions

1. ~~Which "operating system" features actually serve renewal personas vs. are generic filler?~~ **Resolved**
2. ~~Should renewal sub-features be top-level nav items?~~ **Resolved — yes, promoted**
3. ~~What's the right mobile nav?~~ **Resolved — draft confirmed above**
4. ~~How does the agent.ai funnel change the onboarding flow?~~ **Resolved — Quick Add flow solves cold-start for all funnels**
5. ~~Should Import be top-level or tucked away?~~ **Resolved — top-level with separator**
6. ~~Does Tasks stay as own nav item?~~ **Resolved — yes, plus inline in Accounts/Autopilot**
7. ~~What happens to cut features?~~ **Resolved — archive (keep files, remove from nav/routes)**
8. ~~Naming for merged Intel/Expansion?~~ **Resolved — "Intel" (short, contextually clear)**
