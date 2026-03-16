# BaseCommand — Product Context & Strategy Document

> **Last updated:** 2026-03-15
> **Purpose:** Canonical reference for all Claude sessions (terminal, web, project). This document captures product positioning, target personas, go-to-market strategy, agent.ai partnership details, and architectural decisions. All future work should align with this baseline.

---

## 1. Product Positioning

### Tagline
**"BaseCommand: The AI-Powered Renewal Operations Platform"**

### One-Liner
BaseCommand automates renewal operations for SaaS companies — turning messy CRM data into structured portfolios, generating autopilot actions for AEs, surfacing expansion opportunities, and producing executive briefs for leadership.

### Positioning Shift
- **Before:** "Executive Decision Intelligence Platform" — generic productivity tool for execs
- **After:** Renewals-first, single product. The chief-of-staff features (Decisions, Tasks, Priorities, Projects) are the **built-in operating system**, not a separate product. Renewals is the hero use case and primary entry point.

### Why Renewals-First
1. Renewal ops is an acute pain point with no dominant AI-native solution
2. Clear ROI story — every saved renewal and surfaced expansion is measurable revenue
3. Natural expansion path: renewals → full revenue operations → executive operating system
4. The "operating system" features (tasks, decisions, priorities) become stickier when they serve a specific workflow rather than competing as generic productivity tools

---

## 2. Target Market

### Segment
- **Primary:** SMB SaaS companies (< $50M ARR)
- **Secondary:** Smaller mid-market SaaS ($50M–$200M ARR)
- **Explicitly NOT solving for:** Enterprise (large ENT has dedicated renewal ops teams, complex Salesforce instances, and procurement-heavy buying cycles)

### Company Maturity Spectrum
BaseCommand serves companies across a wide maturity range:
- **Early stage:** May not have formal renewal processes at all
- **Growth stage:** Have renewals but manage them in spreadsheets or basic CRM
- **Scaling stage:** Have CRM data but it's messy; AEs are doing renewal work instead of selling

---

## 3. Target Personas

### Persona 1: Founder / CEO (Early Stage)
- **Context:** Running a SaaS company with < 50 customers. Renewals are tracked in spreadsheets or not tracked at all.
- **Pain:** No visibility into upcoming renewals. Discovers churn reactively. No time to build renewal processes.
- **Value prop:** "Import your customer list (even if it's a mess) and BaseCommand gives you a renewal calendar, risk flags, and autopilot actions — in minutes, not months."
- **Entry point:** Import tab → dump spreadsheet data → instant portfolio

### Persona 2: Revenue Leader / CRO / VP Sales (Growth Stage)
- **Context:** Managing a sales team at a growing SaaS company. Renewals are "someone's job" but there's no dedicated team.
- **Pain:** AEs are spending time on renewals instead of new business. No systematic approach to renewal risk or expansion. Forecasting renewals is guesswork.
- **Value prop:** "Stop making your AEs manage renewals. BaseCommand runs renewal autopilot — draft emails, flag risks, surface expansion — so AEs only see upsell opportunities."
- **Entry point:** Autopilot tab → see what BaseCommand would do for their portfolio

### Persona 3: RevOps / CS Ops (Scaling Stage)
- **Context:** Responsible for operationalizing revenue processes. Has CRM data but it's inconsistent, duplicated, or spread across systems.
- **Pain:** Spends days cleaning CRM data for renewal reviews. Building renewal reports manually. No single source of truth for renewal health.
- **Value prop:** "Paste your messy CRM export and BaseCommand extracts clean, structured accounts with AI. No more data cleanup sprints."
- **Entry point:** Import tab → paste CRM export → AI extraction with dedup

### Persona 4: Renewal Leader / Director of Renewals / VP CS (Mid-Market)
- **Context:** Senior Director or VP level. Manages a renewal portfolio across multiple segments. Reports to CRO or CEO.
- **Pain:** Needs portfolio-level visibility, not account-level execution. Spends hours building exec briefs and forecast decks. Wants to know where to focus leadership attention.
- **Value prop:** "Get an AI-generated executive brief, forecast by confidence tier, and strategic recommendations — ready for your board meeting or leadership sync."
- **Entry point:** Leadership tab → generate exec brief → copy to clipboard
- **Note:** This persona is modeled after our own user (Michael), who is a Senior Director of Global Renewals at a larger mid-market / small enterprise company.

---

## 4. Feature Architecture (Current State)

### Renewals Module (Primary — 5 Tabs)

| Tab | Component | Purpose | AI Prompt |
|-----|-----------|---------|-----------|
| **Autopilot** | `RenewalsAutopilot` | Portfolio stats, autopilot actions (approve/copy/dismiss), expansion highlights, attention items | `RENEWAL_AUTOPILOT_PROMPT` |
| **Accounts** | `RenewalsAccountsView` | Individual account management, context items, AI chat per account | (per-account prompts) |
| **Import** | `RenewalsImport` | 3-phase flow: input → AI extraction → bulk create. Handles unstructured CRM data, call notes, emails | `RENEWAL_IMPORT_PROMPT` |
| **Expansion** | `RenewalsExpansion` | AI analysis of expansion signals: usage growth, feature requests, team expansion, contract timing, competitive displacement, product gaps | `RENEWAL_EXPANSION_PROMPT` |
| **Leadership** | `RenewalsLeadership` | Executive brief generator (copy-to-clipboard), forecast view (4 periods × 3 confidence tiers), portfolio health signals, strategic recommendations, escalations | `RENEWAL_LEADERSHIP_PROMPT` |

### Operating System Features (Supporting)

| Feature | Route | Purpose |
|---------|-------|---------|
| Dashboard | `/` | Renewal command center with strategic brief, recommended moves, project spotlights |
| Decisions | `/decisions` | Decision tracking with AI analysis |
| Tasks | `/tasks` | Task management with subtasks, priorities, due dates |
| Priorities | `/priorities` | Strategic priority tracking with health scores |
| Projects | `/projects` | Project planning with AI-generated task breakdowns |
| Intel | `/intel` | Intelligence feed |
| Meetings | `/meetings` | Meeting management |
| Library | `/library` | Reference library |

### Key Technical Patterns
- **Data persistence:** localStorage via `renewalStore` (accounts, autopilot actions, expansion cache, leadership cache)
- **AI integration:** All calls via `callAI()` → proxied through `/api/ai` → supports Anthropic + OpenAI
- **Import deduplication:** Levenshtein similarity via `similarity()` function from `utils.js`
- **Autopilot action lifecycle:** `pending` → `approved` | `dismissed`
- **Caching:** AI-generated analysis (expansion, leadership) cached in localStorage with manual refresh

---

## 5. agent.ai Partnership & Distribution

### Overview
- **Contact:** Michael knows the owner of agent.ai personally
- **Platform:** agent.ai has **3M+ users** and growing
- **Opportunity:** The owner will heavily promote BaseCommand agents on the platform
- **Timeline:** Ready now — awaiting Michael's outreach

### agent.ai Platform Details
- **Builder:** No-code drag-and-drop agent builder
- **Actions:** "Invoke Web API" action for calling external APIs
- **LLM Support:** Multi-LLM (agents can use various AI providers)
- **Distribution:** Built-in marketplace with millions of users

### Three Agents to Build on agent.ai

#### Agent 1: CRM Data Parser
- **What it does:** Takes messy CRM data (pasted text, CSV snippets, notes) and returns clean, structured renewal accounts
- **Source prompt:** `RENEWAL_IMPORT_PROMPT` from `src/lib/prompts.js`
- **Standalone value:** Anyone can use this without a BaseCommand account
- **Funnel:** Shows the power of AI extraction → drives signups for full portfolio management

#### Agent 2: Renewal Autopilot
- **What it does:** Given account details + context, generates ready-to-use renewal actions (email drafts, risk assessments, next steps)
- **Source prompt:** `RENEWAL_AUTOPILOT_PROMPT` from `src/lib/prompts.js`
- **Standalone value:** Get a renewal action plan for any account
- **Funnel:** Shows automation value → drives signups for full autopilot dashboard

#### Agent 3: Exec Brief Generator
- **What it does:** Given portfolio data, generates an executive brief with forecast, health signals, and strategic recommendations
- **Source prompt:** `RENEWAL_LEADERSHIP_PROMPT` from `src/lib/prompts.js`
- **Standalone value:** Generate a board-ready renewal brief from raw data
- **Funnel:** Shows leadership value → drives signups for ongoing portfolio intelligence

### Implementation Approach
- **No codebase changes needed** — agents are configured directly on agent.ai's no-code builder
- Existing prompts from `src/lib/prompts.js` can be directly copied into agent.ai's platform
- Each agent can optionally call BaseCommand's API endpoints for deeper integration
- Agents serve as top-of-funnel: free standalone tools that demonstrate BaseCommand's AI capabilities

### Message to agent.ai Contact (Approved, Ready to Send)
Three key questions to discuss:
1. Can agents call external APIs (BaseCommand endpoints) for deeper integration?
2. What's the best way to structure agents for maximum marketplace visibility?
3. Can we get featured/promoted placement given the relationship?

---

## 6. Pricing Model (Planned)

| Tier | Price | Limits | Target |
|------|-------|--------|--------|
| **Free** | $0 | 10 accounts, basic autopilot | Founders trying it out, agent.ai converts |
| **Pro** | $99–149/mo | Unlimited accounts, full autopilot, expansion intelligence, leadership briefs | Individual revenue leaders, small teams |
| **Team** | $299–499/mo | Multi-user, shared portfolio, team dashboards, API access | RevOps teams, CS organizations |

---

## 7. Branding & Copy Guidelines

### Brand Name
- **Correct:** "BaseCommand" (one word, camelCase in logos/UI)
- **Incorrect:** "Base Command" (two words — legacy, being phased out)

### Taglines & Descriptions
- **Primary tagline:** "The AI-Powered Renewal Operations Platform"
- **Dashboard empty state:** "Your renewal command center is ready"
- **Dashboard description:** "Import your portfolio, automate renewal workflows, and surface expansion opportunities — all from one platform."
- **AI persona:** "BC" — described as "AI-powered renewal operations co-pilot"
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

## 8. Technical Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, Zustand, Vite |
| Language | JavaScript (JSX) — no TypeScript |
| Styling | Inline styles with design tokens (`src/lib/tokens.js`) |
| Fonts | Space Grotesk (headings), Inter (body), JetBrains Mono (code/data) |
| State | Zustand (`entityStore`, `appStore`) + localStorage (`renewalStore`) |
| AI | `callAI()` → `/api/ai` proxy → Anthropic or OpenAI |
| Backend | Vercel Serverless Functions |
| Storage | Vercel KV (production), localStorage (client) |
| Auth | OAuth2 (Gmail, Outlook connectors) |
| Build | Vite, ESLint (flat config) |

---

## 9. Roadmap & Pending Work

### Completed
- [x] Renewal Import (3-phase: input → AI extraction → bulk create)
- [x] Renewal Autopilot (action cards with approve/copy/dismiss)
- [x] Renewal Expansion (AI signal analysis with categories)
- [x] Renewal Leadership (exec brief, forecast, health signals, recommendations)
- [x] Guided empty states for new users
- [x] Marketing copy update to renewals-first positioning

### In Progress
- [ ] agent.ai agent configuration (awaiting contact response)

### Planned (Phase 2)
- [ ] Automated email sequences (configurable autopilot that sends, not just drafts)
- [ ] Multi-user / team features
- [ ] API endpoints for agent.ai deep integration
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Pricing & billing implementation

---

## 10. Key Files Reference

| File | Purpose |
|------|---------|
| `src/pages/Renewals.jsx` | Main renewals page (all 5 tabs) |
| `src/lib/prompts.js` | All AI prompt definitions (import, autopilot, expansion, leadership) |
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
| `BASECOMMAND_CONTEXT.md` | **This file** — product strategy & persona reference |
