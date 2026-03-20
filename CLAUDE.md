# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BaseCommand is an AI-powered renewal intelligence platform — a React SPA with serverless API functions deployed on Vercel. It provides a fleet of specialized AI agents organized into Renewal, Growth, and Coaching categories that run the entire renewal workflow, from data import to execution, with human oversight at every step.

**Current version:** 0.8.0
**Positioning:** AI-Powered Renewal Intelligence — "AI-powered renewal workflows, from co-pilot to fully autonomous"

## Commands

- `npm run dev` — Start Vite dev server (port 5173) + local API proxy (port 3001)
- `npm run build` — Production build via Vite
- `npm run lint` — ESLint across all JS/JSX files
- `npm run preview` — Preview production build locally
- `vercel dev` — Full-stack local dev with Vercel KV and OAuth connectors (required for connector testing)

## Architecture

### Frontend (React SPA)
- **Entry:** `index.html` → `src/main.jsx` → `src/App.jsx`
- **Stack:** React 19, React Router v7, Zustand for state management
- **Language:** JavaScript (JSX), no TypeScript
- **Styling:** Inline styles with design tokens from `src/lib/tokens.js` (Command Indigo theme). Dark background (`#0F1013`), indigo primary (`#6366F1`), cyan AI accent (`#22D3EE`). Fonts: Space Grotesk (display/headings), Inter (body), JetBrains Mono (code/data).

### Routing

**Marketing site (public, uses `MarketingLayout`):**
- `/` — Landing page (hero, shift table, workflow, agent.ai, pricing)
- `/pricing` — Free/Pro tiers with 14-day trial, FAQ
- `/agents` — agent.ai free agents + full agent fleet by category
- `/why` — "The Problem" — problem stats, failure modes, opportunity proof
- `/how-it-works` — Flywheel, NRR Waterfall, architecture, archetypes
- `/get-started` — Implementation blueprint, ROI calculator, agent.ai, pricing CTA
- `/login`, `/signup` — Auth pages

**App (authenticated, uses Sidebar + TopBar layout at `/app/*`):**
Sidebar has 5 workflow-stage groups: Command Center, Portfolio, Agents, Actions, Intelligence.
- `/app` — Dashboard (Mission Control — agent status, NRR waterfall, approval queue, activity feed)
- `/app/accounts` — Portfolio (filterable account list with archetype badges + AI co-pilot)
- `/app/agents` — Agent Hub (Active agents with status vs Available catalog + autonomy dial)
- `/app/agents/renewal/health-monitor`, `/rescue-planner`, `/outreach-drafter` — Renewal Agents
- `/app/agents/growth/expansion-scout`, `/forecast-engine`, `/opportunity-brief` — Growth Agents
- `/app/agents/coaching/executive-brief`, `/meeting-prep`, `/playbook-builder` — Coaching Agents
- `/app/intelligence` — Intelligence Hub (Executive Brief + Forecast tabs, export toolbar)
- `/app/leadership` — Executive briefs
- `/app/tasks` — Action Center
- `/app/import` — Data import
- `/app/settings` — Settings (profile, company, API keys, billing)

### Key Directories

```
src/
  components/
    layout/       — Sidebar, TopBar, MarketingLayout, BottomTabBar, CommandPalette
    auth/         — AuthGate
    renewals/     — Renewal-specific components
    ui/           — Shared UI components
  pages/
    marketing/    — Landing, Why, HowItWorks, GetStarted, Agents, Pricing
    agents/       — HealthMonitor, RescuePlanner, OutreachDrafter, ExpansionScout,
                    ForecastEngine, OpportunityBrief, PlaybookBuilder (+ ExecutiveBrief, MeetingPrep via Leadership)
    auth/         — Login, Signup
    Dashboard, Accounts, AgentHub, Leadership, Tasks, Import, Settings
  store/
    appStore.js   — UI state (sidebar, theme)
    authStore.js  — Auth state (Supabase user, org context)
    entityStore.js — Legacy entity CRUD (decisions, tasks, priorities)
  lib/
    tokens.js     — Design tokens (colors, fonts, constants)
    healthScore.js — Account health scoring engine (composite 0-10 scores, archetypes)
    prompts.js    — AI system prompts for each agent
    ai.js         — AI call helpers
    supabase.js   — Supabase client
    storage.js    — Storage adapter (local ↔ Supabase)
    helpers.js, utils.js — Shared utilities
```

### Backend (Vercel Serverless Functions)
- **`api/ai.js`** — Main AI proxy. Routes to Anthropic or OpenAI based on `provider` field. Normalizes all responses to Anthropic message format. Resolves tier from org subscription.
- **`api/claude.js`** — Simple Anthropic-only proxy (legacy/direct endpoint).
- **`api/ai-keys.js`** — CRUD for user API keys stored in Vercel KV.
- **`api/lib/auth.js`** — Shared auth helpers: `resolveUser()`, `resolveOrgMember()`, `getSupabaseAdmin()`.
- **`api/org.js`** — Organization API: get info + members, update name/settings.
- **`api/connectors/`** — Gmail and Outlook OAuth2 flows (auth, callback, disconnect, status) plus `scan.js` for email extraction.
- **`scripts/dev-api.js`** — Local dev API server (port 3001).

### Key Patterns
- All AI responses normalized to Anthropic's `{ content: [{ text }], stop_reason, model, usage }` shape
- Vercel KV for persistent storage (OAuth tokens, API keys) with `bc2-` key prefix
- Design tokens define the entire visual system — no CSS files, all inline styles
- Account health scoring engine (`src/lib/healthScore.js`) produces composite 0-10 scores with archetype classification (Power User → Disconnected)
- Agent architecture: 3 categories (Renewal/Growth/Coaching) with a growing fleet of sub-agents sharing a unified reasoning engine
- **Organization model:** All data tables have `org_id` for team scoping. `user_id` retained as created-by provenance. Auto-created org per signup. `user_settings` and `ai_usage` stay user-scoped. Org context tracked in `authStore.activeOrgId` and sent via `X-Org-Id` header to API.

### Marketing Site Patterns
- Section subtitles use `color: C.textPrimary, fontWeight: 400, opacity: 0.75` (premium hierarchy via weight, not color dimming)
- Pill badges: `fontSize: 14, padding: "8px 20px"`, mono font, uppercase
- "Traditional Renewals" (not "Traditional CS") — positioning against renewal workflow
- agent.ai woven throughout as zero-friction entry point
- 14-day Pro trial + $49/mo founding member pricing (first 100 customers). Team tier: $149/mo flat, unlimited users.

## Code Quality Rules

### No Dead Code
- Never leave unused files, components, or imports in the codebase. If something is replaced, delete the old version in the same commit.
- Before creating a new file, check if an existing file already serves the same purpose.

### Single Source of Truth
- **Tokens:** `src/lib/tokens.js` is the ONLY source for design tokens (colors, fonts, constants). Never create parallel token files.
- **UI Components:** `src/components/ui/index.jsx` is the ONLY shared component library. Never create parallel component files.
- **Storage:** `src/lib/storage.js` (localStorage) and `src/lib/supabaseStorage.js` (Supabase) are the two storage adapters. No other storage files.

### DRY Patterns
- Utility functions used by 2+ files must live in `src/lib/` (helpers.js, utils.js, or a descriptive filename). Never duplicate a helper across page files.
- Shared UI patterns used 3+ times must be extracted into a component in `src/components/`.
- Marketing pages should import shared patterns (pill badges, section wrappers, CTA buttons) from `src/components/marketing/` rather than duplicating inline styles.

### Mobile-First Responsive
- Every `fontSize` above 14px in marketing pages MUST have an `isMobile` ternary using the `useMediaQuery()` hook.
- Every card/section `padding` MUST have mobile scaling to prevent compounding (outer 16px + inner 14px max on mobile).
- Use `fs(desktop, mobile, isMobile)` from `src/lib/tokens.js` for font sizes.
- The CSS safety net in `index.css` (overflow-x hidden, box-sizing, overflow-wrap) must not be removed.

### File Size Limits
- No single file should exceed 500 lines. If it does, split into sub-components or extract logic into hooks/utilities.
- Page components should import sub-components rather than defining everything inline.

## Environment

Copy `.env.example` to `.env.local`. Required for local AI calls: `ANTHROPIC_API_KEY`. Optional: `OPENAI_API_KEY`. Vercel KV and OAuth credentials are only needed for connector features (use `vercel dev` for those).

## ESLint

Uses flat config (`eslint.config.js`). Notable rule: `no-unused-vars` ignores variables starting with uppercase or underscore (`varsIgnorePattern: '^[A-Z_]'`).

## Documentation

- **`docs/PLAN.md`** — Master plan (single source of truth): vision, business model, revenue gates, epic roadmap, decision log, AI Revenue Architecture
- **`docs/PLAN-ONE-PAGER.md`** — Compressed summary of the master plan
- **`docs/PLAN-FAMILY.md`** — Plain-language explanation for non-technical audience
- **`docs/AGENT-AI-BUILD-GUIDE.md`** — Configuration guide for agent.ai Knowledge Agents
- **`docs/archive/`** — Historical versions of plan documents
