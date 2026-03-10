# Base Command
### Executive Decision Intelligence Platform
**Status:** Active Development · **Version:** v3 (Claude Artifact)
**Owner:** Michael Ewing, Renewals — Customer Experience, Quickbase
**Domain:** basecommand.ai

---

## What We Are Building

Base Command is an AI-powered executive operations platform built for leaders who need to move faster, think more clearly, and stay on top of a high-volume operational environment. It is not a chatbot. It is a structured intelligence layer that sits between a leader and their work — handling prioritization, meeting intelligence, decision tracking, task management, and strategic communication in one place.

The original concept was to replace a ChatGPT custom GPT (a static, memoryless prompt) with a real persistent agent that knows your context, tracks your history, and operates at board-ready rigor. The AI persona at the core — the "Chief of Staff" — is blunt, direct, challenges weak thinking, and operates across defined strategic modes rather than just answering questions.

The near-term goal is to get this off Claude's artifact environment and onto the owned domain `basecommand.ai`, positioned not just as a personal tool but as a platform that other Quickbase leaders can adopt.

---

## The Problem It Solves

Leaders at Quickbase — particularly in Renewals and Customer Experience — operate across a constant flood of meetings, decisions, tasks, priorities, and communications. The work is fragmented across tools (Slack, email, Salesforce, Gainsight, calendar) with no single place that synthesizes it into what actually matters.

Specific pain points addressed:

- **No unified priority stack.** What is T1 today vs. what is noise? This changes constantly and there is no system to force that clarity.
- **Meeting intelligence is lost.** Notes get taken, summaries get filed, and the decisions and tasks buried inside them are never systematically extracted or tracked.
- **Decisions drift.** Open questions stay open. There is no registry that tracks what is decided, what is pending, and what keeps getting avoided.
- **Communication takes too long.** Drafting replies to complex threads, preparing for meetings, structuring leadership updates — all done from scratch every time.
- **No strategic advisor available on-demand.** The kind of direct, challenging, outcome-focused thinking a Chief of Staff provides is not always accessible. Base Command fills that role.

---

## What Has Been Built

### Core Tabs

**Home**
Dashboard showing key metrics at a glance: open decisions, T1 priorities, weekly entries, and upcoming meetings. Includes a setup wizard that guides first-time configuration and Quick Action buttons for the most common AI commands (Brief me for today, Prioritize my stack, Weekly Reset, Where should I focus?).

**Inbox**
Universal capture tab. Accepts anything — tasks, priorities, decisions, reminders, notes — in free text. Base Command auto-classifies each item using the Claude API, routes it to the appropriate section of the app, and responds with a structured acknowledgment. Also contains the full persistent CoS chat interface for open-ended strategic conversation. Two modes: Capture and Chat.

**Respond To**
Paste any email thread, Slack message, or communication. Base Command reads it, auto-detects the intent (Reply professionally, Decline gracefully, Escalate, Ask for more time, Delegate, etc.), explains its recommendation, and drafts a response. Multiple tones available. Full iterative refinement loop — you can push back, change the intent, and regenerate.

**Meetings**
Meeting intelligence hub. Paste any meeting summary or transcript. Base Command extracts: title, executive summary, all decisions made, every action item (with owner and deadline), priority flags worth adding to the stack, risks, and a follow-up brief for the next meeting of that type. Extracted tasks flow directly into the Task List. Extracted priorities are flagged for the Priority Stack. Meeting type taxonomy covers: Team standup, 1:1, Customer QBR, Executive/Board, Strategy, Partner/Channel, Pipeline Review, and more.

**Task List**
Every action item extracted from ingested meetings, surfaced in one place. Filterable by My Tasks / All Tasks / Completed. Each task is an expandable card with a visible **Work with AI** button that opens a full-width AI panel with six actions:
- **Break it down** — concrete executable steps, dependencies, fastest path to done
- **Draft an update** — 2-3 sentence executive-caliber status update
- **Identify blockers** — what could stop this, what to watch
- **Delegate it** — full delegation message with owner, deliverable, deadline
- **Push back?** — honest assessment of whether this task deserves your time
- **Ask anything** — open-ended free-text input, no predefined prompt

All AI actions run in the background — fire and navigate away, result is waiting when you return. Nav badge shows a gold ✦ indicator when results are ready.

**Decisions**
Decision registry. Log any open question, pending choice, or unresolved issue with a status (Open, In Progress, Decided, Delegated, Deferred). Each decision card has five inline AI actions: Advise me, Push me to decide, Map the tradeoffs, Surface the risks, and How do I frame this. All run in the background. Follow-up input routes to the full Base Command chat.

**Priorities**
Tiered priority stack. Four tiers: T1 (High Impact / High Urgency), T2 (High Impact / Lower Urgency), T3 (Operational), T4 (Nice to Have). Each item is scored by category (Strategy, RevOps, Forecast, AI/Enablement, Commercial/Renewals, Team/Org, Executive/Board) and effort level. Three inline AI actions per item: Next action, Challenge it, Stakeholder angle. Background execution with result badges.

**Daily Log**
Timestamped entry log with category tagging. Categories: Decision, Task, Blocker, Win, Priority, Note. Serves as a running record of what happened and when. Used as live context fed into every AI conversation.

**Upcoming**
Forward-looking calendar of events, deadlines, and reminders. Date-tagged. Feeds into the AI context so Base Command knows what is coming when advising on priorities and preparation.

**Activity Ledger**
Auto-populated log of every substantive AI exchange. Captures: topic, category, revenue relevance, decision made, priority impact. Provides an audit trail of what was discussed and what was decided.

**Agenda Builder**
Templates for recurring meeting types. AI-enhanced agenda generation with context injection. Export-ready for meeting prep.

---

## The AI Architecture

### Persona and Modes
The AI operates as a Chief of Staff with a defined character: blunt, direct, no flattery, accountable for outcomes. It auto-detects the appropriate operating mode from each input:

| Mode | Purpose |
|---|---|
| Prioritization | Score and tier items by impact, urgency, effort |
| Executive Structuring | Organize raw input into signal vs. noise |
| Leadership Output | 5-8 tight bullets, outcomes and trajectory |
| Meeting Prep | Narrative, talking points, objections, risks |
| Strategy | Stress-test logic, surface second-order consequences |
| Forecast Analysis | Drivers, credibility, scenarios, sensitivity |
| Decision Push | Force a decision, identify what is blocking it |
| Weekly Reset | Re-rank priorities, patterns, outcomes for the week |
| Quarterly Reset | Strategic themes, gaps vs. goals, what to stop |

### Background Execution
A key architectural decision made in v3: AI actions across Tasks, Decisions, and Priorities all run as non-blocking background operations. The user triggers an action and can immediately navigate to another tab. Results are stored in component state keyed by item ID. A gold ✦ badge on the nav tab signals when results are ready. This makes the tool feel fast and non-interruptive.

### Auto-Logging
Every substantive AI exchange appends a structured log entry to the Activity Ledger automatically, using a `%%LOG%%...%%END%%` parsing pattern stripped from the visible response.

---

## Technical Architecture

### Current Stack (Claude Artifact)
- **Runtime:** React 18, functional components, hooks only
- **Styling:** Inline JavaScript style objects, no CSS framework
- **Persistence:** `window.storage` (Claude artifact key-value API)
- **AI:** Direct browser `fetch()` to `https://api.anthropic.com/v1/messages`
- **Model:** `claude-sonnet-4-20250514`
- **Bundler:** None (Claude artifact environment handles rendering)
- **Font:** DM Mono via Google Fonts

### Storage Keys
All data is namespaced under `bc2-` prefix and stored as JSON:
`bc2-entries`, `bc2-chat`, `bc2-decisions`, `bc2-upcoming`, `bc2-ledger`, `bc2-priorities`, `bc2-meetings`, `bc2-meeting-tasks`, `bc2-agendas`

### What Needs to Change for External Deployment

| Item | Current | Target |
|---|---|---|
| API key | Injected by Claude artifact | Serverless proxy on Vercel |
| Storage | `window.storage` | `localStorage` (personal) or Vercel KV / Supabase (multi-user) |
| Bundler | Claude artifact renderer | Vite |
| Hosting | Claude.ai | Vercel → `basecommand.ai` |
| Auth | None | Clerk or NextAuth (if multi-user) |

Estimated migration effort to single-user production deployment: **one afternoon**. The storage helper functions (`load()` / `save()`) are the only abstraction layer that needs to be swapped.

---

## Licensing and Access

An internal CAB (Change Advisory Board) proposal has been submitted to Quickbase IT requesting an enterprise-managed Anthropic Claude API license. Key points of the proposal:

- **Requestor:** Michael Ewing, Renewals / Customer Experience
- **Use case:** Executive operations platform — Phase 1 (operational workflow), Phase 2 (renewal data integration including churn forecasts, ARR, deal values, KPIs)
- **Stakeholder alignment:** Accounting has independently requested Claude access; proposal suggests consolidating under a single IT-managed license
- **SRE contact:** Kim Heriza (SRE team already holds internal Claude licenses)
- **Data classification:** Phase 1 — Internal/Confidential. Phase 2 — Confidential/Business Sensitive
- **Timeline:** No hard external deadline; current workaround is a personal Claude.ai subscription which is suboptimal from a governance standpoint
- **Priority:** High

---

## Vision: From Personal Tool to Leadership Platform

The current build is a single-user personal productivity tool. The intended direction is a platform available to all Quickbase leaders — not just Renewals. This reframing changes the licensing conversation from "one person wants a tool" to "the company is investing in a leadership intelligence layer."

Phase 2 capabilities planned:
- Live renewal data integration (churn forecasts, ARR, deal values, account KPIs)
- Read-only connection to CRM/BI systems (Salesforce, Gainsight, or internal BI — TBD with IT)
- Multi-user support with role-based access
- Deployment on `basecommand.ai` under IT-managed infrastructure

The platform framing also changes the hosting conversation. Rather than a side project running on a personal subscription, Base Command becomes a sanctioned internal tool with proper data governance, secrets management, and access controls.

---

## Key Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| AI provider | Anthropic Claude | Superior long-context handling, reasoning quality, and structured output reliability vs. GPT-4 |
| Product name | Base Command | Authoritative, platform-appropriate, not tied to a single persona |
| Domain | basecommand.ai | Acquired via Namecheap |
| Hosting target | Vercel | Fastest path from React artifact to production, native serverless functions for API proxy |
| Storage (Phase 1) | localStorage or Vercel KV | Simplest migration from `window.storage` |
| Background execution | Non-blocking `.then()` | Keeps the tool fast and non-interruptive; critical UX decision |
| CoS branding | Removed from UI, kept in system prompt | Product is Base Command; the AI persona remains a Chief of Staff internally |
| Task UI | Card-based with visible Work with AI button | Previous table layout hid AI interaction behind a tiny arrow — unusable |

---

*Document generated March 2026 · Base Command v3*
*Prepared by Michael Ewing with AI assistance (Anthropic Claude). All content reviewed and approved by the author.*
