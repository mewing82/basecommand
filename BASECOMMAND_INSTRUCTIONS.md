# BASE COMMAND — Development Instructions

> **Purpose**: This document is the authoritative guide for any AI assistant (Claude) working on the Base Command codebase via terminal. Read this BEFORE making any changes. Every section contains both the "what" and the "how" so you can execute without ambiguity.
>
> **Owner**: Michael Ewing  
> **Last updated**: March 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Architecture](#2-current-architecture)
3. [Design System & Visual Identity](#3-design-system--visual-identity)
4. [Data Architecture Improvements](#4-data-architecture-improvements)
5. [Frontend UI Improvements](#5-frontend-ui-improvements)
6. [Feature Implementations](#6-feature-implementations)
7. [AI Integration Architecture](#7-ai-integration-architecture)
8. [Migration Path: Local → Production](#8-migration-path-local--production)
9. [File & Directory Structure](#9-file--directory-structure)
10. [Code Conventions](#10-code-conventions)
11. [Testing & Validation](#11-testing--validation)
12. [Work Order: Sequenced Build Plan](#12-work-order-sequenced-build-plan)

---

## 1. Project Overview

**Base Command** (basecommand.ai) is an AI-powered executive decision intelligence platform. It helps leaders make better decisions, manage strategic priorities, track execution, and (in Phase 2) monitor renewal portfolio health with predictive intelligence.

### Origin & Context

- Started as a ChatGPT custom GPT called "Chief of Staff"
- Evolved into a full React application running in Claude's artifact environment
- Currently a single-file React app with inline styles, no build step, no backend
- Uses `window.storage` (Claude artifact KV API) for persistence
- Uses direct browser `fetch()` to call the Anthropic Claude API
- All keys namespaced with `bc2-` prefix
- The app will eventually deploy to Vercel at basecommand.ai, but **all work described in this document should target the local/artifact version first**

### Product Positioning

Base Command is a **leadership platform for all leaders**, not a personal productivity tool. Design decisions should reflect this — multi-user capable architecture even before auth is added, professional UI quality, and features that scale beyond one person.

---

## 2. Current Architecture

### Frontend
- **Framework**: React (functional components with hooks)
- **Styling**: Inline styles only — no CSS files, no Tailwind, no UI libraries
- **Font**: DM Mono (monospace) — loaded via Google Fonts
- **Theme**: Dark background, gold accent (#D4A853), command-center aesthetic
- **Navigation**: Tab-based (Decisions, Tasks, Priorities)
- **File structure**: Single `.jsx` file containing everything

### Data Layer
- **Storage**: `window.storage` API (Claude artifact environment)
  - `await window.storage.get(key)` → `{key, value}` or throws on missing
  - `await window.storage.set(key, value)` → `{key, value}`
  - `await window.storage.delete(key)` → `{key, deleted}`
  - `await window.storage.list(prefix)` → `{keys}`
- **Key namespace**: All keys prefixed with `bc2-`
- **Data format**: JSON strings (must `JSON.stringify` on write, `JSON.parse` on read)
- **Limitations**: 5MB per key, rate-limited, last-write-wins, no relationships, no schema enforcement

### AI Layer
- **Provider**: Anthropic Claude API (via direct `fetch()` from browser)
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Model**: `claude-sonnet-4-20250514` (default for speed) — use Opus for deep analysis
- **Two call patterns**:
  1. **Synchronous**: Blocks the UI until response arrives. Used for inline AI panels.
  2. **Background (fire-and-forget)**: Triggers AI call, user can navigate away. Gold ✦ badge appears on the source tab when results are ready.
- **System prompt**: Internal persona is preserved from the "Chief of Staff" origin. All user-facing labels say "Base Command" or "BC".

---

## 3. Design System & Visual Identity

### Color Palette

```
Primary Background:    #0A0F1C  (deep navy/black)
Card Background:       #111827  (dark card surface)
Card Hover:            #1A2332  (subtle lift on hover)
Sidebar Background:    #0D1321  (slightly lighter than primary)
Border Default:        #1E293B  (subtle dark borders)
Border Active:         #D4A853  (gold highlight)

Text Primary:          #E2E8F0  (off-white for body text)
Text Secondary:        #94A3B8  (muted for labels, captions)
Text Tertiary:         #64748B  (very muted, timestamps)

Accent Gold:           #D4A853  (primary accent — badges, active states, CTAs)
Accent Gold Hover:     #E0B964  (lighter gold on hover)
Accent Gold Muted:     rgba(212, 168, 83, 0.15)  (gold tint for backgrounds)

Status Green:          #2D8653  (success, complete, healthy)
Status Amber:          #C17B1A  (warning, in-progress, moderate risk)
Status Red:            #B23A3A  (error, blocked, high risk)
Status Blue:           #3A7CA5  (info, neutral highlight)

AI Response BG:        #0F1A2E  (darker panel for AI output areas)
AI Response Border:    #1E3A5F  (blue-tinted border around AI content)
```

### Typography

**Dual-font system** — this is a key improvement:

```
Brand / UI Chrome:     "DM Mono", monospace
                       Used for: nav labels, badges, status tags, key-value pairs,
                       the "BC" logomark, code-like elements, timestamps

Body / Content:        "DM Sans", sans-serif
                       Used for: AI responses, decision descriptions, task details,
                       any paragraph-length text, empty state messages, tooltips

Fallback stack:        system-ui, -apple-system, sans-serif
```

**Scale** (use consistently):
```
xs:    11px   (timestamps, fine print)
sm:    12px   (captions, badges, secondary labels)
base:  14px   (body text, descriptions, AI responses)
md:    16px   (section headers, card titles)
lg:    20px   (page titles, view headers)
xl:    24px   (dashboard metrics, hero numbers)
```

**Weight**:
```
400 (regular):  Body text, descriptions
500 (medium):   Labels, nav items, secondary emphasis
600 (semibold): Card titles, section headers, active nav
700 (bold):     Page titles, metric values, CTAs
```

### Spacing System

Use a consistent 4px base grid:
```
xs:   4px     (tight internal padding)
sm:   8px     (between related elements)
md:   12px    (card internal padding)
lg:   16px    (between cards, section gaps)
xl:   24px    (between sections)
2xl:  32px    (major section dividers)
3xl:  48px    (page-level spacing)
```

### Component Patterns

All components use inline styles (no CSS classes). Define style objects at the top of component scope or as constants.

**Card Container**:
```javascript
const cardStyle = {
  background: '#111827',
  borderRadius: 8,
  border: '1px solid #1E293B',
  padding: 16,
  marginBottom: 12,
  transition: 'border-color 0.2s ease, background 0.2s ease',
  cursor: 'pointer',
};
// On hover: { borderColor: '#D4A853', background: '#1A2332' }
```

**Badge/Tag**:
```javascript
const badgeStyle = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontFamily: '"DM Mono", monospace',
  fontWeight: 500,
  color: color,
  background: `${color}22`,  // 13% opacity tint
  border: `1px solid ${color}44`,
});
```

**AI Panel Container**:
```javascript
const aiPanelStyle = {
  background: '#0F1A2E',
  borderRadius: 8,
  border: '1px solid #1E3A5F',
  padding: 16,
  marginTop: 12,
};
```

**Action Button (Gold Primary)**:
```javascript
const primaryBtnStyle = {
  background: '#D4A853',
  color: '#0A0F1C',
  border: 'none',
  borderRadius: 6,
  padding: '8px 16px',
  fontSize: 13,
  fontFamily: '"DM Mono", monospace',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.2s ease',
};
// On hover: { background: '#E0B964' }
```

**Action Button (Ghost/Secondary)**:
```javascript
const ghostBtnStyle = {
  background: 'transparent',
  color: '#94A3B8',
  border: '1px solid #1E293B',
  borderRadius: 6,
  padding: '8px 16px',
  fontSize: 13,
  fontFamily: '"DM Mono", monospace',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};
// On hover: { color: '#E2E8F0', borderColor: '#94A3B8' }
```

### Icons

Do NOT add icon libraries. Use Unicode characters for all icons:
```
Navigation:     ⌂ (home) │ ◆ (decisions) │ ☐ (tasks) │ ▲ (priorities) │ ◎ (renewals)
Actions:        ✦ (AI/magic) │ ＋ (add) │ ✕ (close) │ ▸ (expand) │ ▾ (collapse)
Status:         ● (active) │ ○ (inactive) │ ✓ (complete) │ ⚠ (warning) │ ✕ (error)
Navigation:     ← (back) │ → (forward) │ ⌘ (command key)
```

---

## 4. Data Architecture Improvements

### 4.1 Storage Key Redesign

The current `bc2-` prefix is fine but the key structure needs to support relationships. Adopt this pattern:

```
bc2-{entity}:{id}              → Individual record
bc2-{entity}:index             → List of all IDs for that entity
bc2-{entity}:{id}:ai-history   → AI conversation history for that entity
bc2-links:{source}:{id}        → Array of linked entity references
bc2-meta:schema-version        → Current schema version (for migrations)
bc2-meta:last-sync             → Timestamp of last data operation
```

**Entity types**: `decision`, `task`, `priority`, `theme`, `digest`

**Example keys**:
```
bc2-decision:d_1709901234567          → Decision record JSON
bc2-decision:index                     → ["d_1709901234567", "d_1709901299999"]
bc2-decision:d_1709901234567:ai-history → [{role, content, timestamp}, ...]
bc2-links:decision:d_1709901234567     → [{type:"task", id:"t_..."}, {type:"priority", id:"p_..."}]
bc2-meta:schema-version                → "2.0"
```

### 4.2 Entity Schemas

Every entity MUST conform to these TypeScript-style schemas. Validate on every write.

```typescript
// === DECISION ===
interface Decision {
  id: string;                    // "d_" + Date.now()
  title: string;
  context: string;               // Background/situation description
  status: 'draft' | 'analyzing' | 'decided' | 'implementing' | 'evaluating' | 'closed';
  options: string[];             // Options considered
  outcome: string | null;        // Final decision made
  rationale: string | null;      // Why this outcome was chosen
  risks: string | null;          // Identified risks
  linkedTasks: string[];         // Task IDs spawned from this decision
  linkedPriorities: string[];    // Priority IDs this maps to
  tags: string[];                // Freeform tags
  decidedAt: string | null;      // ISO timestamp
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}

// === TASK ===
interface Task {
  id: string;                    // "t_" + Date.now()
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'blocked' | 'complete' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate: string | null;       // ISO date (no time)
  sourceDecisionId: string | null;  // Decision that spawned this task
  linkedPriorities: string[];    // Priority IDs this supports
  tags: string[];
  subtasks: Subtask[];           // Inline subtasks (not separate entities)
  createdAt: string;
  updatedAt: string;
}

interface Subtask {
  id: string;                    // "st_" + Date.now()
  title: string;
  complete: boolean;
}

// === PRIORITY (Strategic Theme) ===
interface Priority {
  id: string;                    // "p_" + Date.now()
  title: string;
  description: string;
  rank: number;                  // 1 = highest priority
  timeframe: 'this_week' | 'this_month' | 'this_quarter' | 'this_year';
  status: 'active' | 'on_track' | 'at_risk' | 'paused' | 'achieved';
  successMetrics: string[];      // How we measure progress
  healthScore: number | null;    // 0-100, AI-computed
  linkedDecisions: string[];     // Decisions driving this priority
  linkedTasks: string[];         // Tasks executing this priority
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// === AI INTERACTION LOG ===
interface AIInteraction {
  id: string;                    // "ai_" + Date.now()
  entityType: 'decision' | 'task' | 'priority' | 'digest' | 'global';
  entityId: string | null;       // null for global interactions
  action: string;                // "analyze_decision", "break_down_task", etc.
  prompt: string;                // What was sent to the API
  response: string;              // What came back
  model: string;                 // "claude-sonnet-4-20250514" etc.
  tokensUsed: number | null;     // If available from response
  durationMs: number;            // How long the call took
  background: boolean;           // Was this a background operation?
  createdAt: string;
}
```

### 4.3 Data Access Layer

Create a unified data access module. **All storage reads/writes go through this layer** — no direct `window.storage` calls from components.

```javascript
// /src/data/store.js (or inline in the artifact as a section)

const SCHEMA_VERSION = '2.0';

const store = {
  // --- Generic CRUD ---
  async get(entityType, id) {
    try {
      const result = await window.storage.get(`bc2-${entityType}:${id}`);
      return result ? JSON.parse(result.value) : null;
    } catch {
      return null;
    }
  },

  async save(entityType, entity) {
    entity.updatedAt = new Date().toISOString();
    await window.storage.set(
      `bc2-${entityType}:${entity.id}`,
      JSON.stringify(entity)
    );
    await this._updateIndex(entityType, entity.id);
    return entity;
  },

  async delete(entityType, id) {
    await window.storage.delete(`bc2-${entityType}:${id}`);
    await this._removeFromIndex(entityType, id);
    // Also clean up links
    await window.storage.delete(`bc2-links:${entityType}:${id}`);
    await window.storage.delete(`bc2-${entityType}:${id}:ai-history`);
  },

  async list(entityType) {
    try {
      const result = await window.storage.get(`bc2-${entityType}:index`);
      const ids = result ? JSON.parse(result.value) : [];
      const entities = await Promise.all(
        ids.map(id => this.get(entityType, id))
      );
      return entities.filter(Boolean);
    } catch {
      return [];
    }
  },

  // --- Linking ---
  async link(sourceType, sourceId, targetType, targetId) {
    const key = `bc2-links:${sourceType}:${sourceId}`;
    let links = [];
    try {
      const result = await window.storage.get(key);
      links = result ? JSON.parse(result.value) : [];
    } catch { /* empty */ }
    if (!links.find(l => l.type === targetType && l.id === targetId)) {
      links.push({ type: targetType, id: targetId });
      await window.storage.set(key, JSON.stringify(links));
    }
  },

  async getLinks(sourceType, sourceId) {
    const key = `bc2-links:${sourceType}:${sourceId}`;
    try {
      const result = await window.storage.get(key);
      return result ? JSON.parse(result.value) : [];
    } catch {
      return [];
    }
  },

  // --- AI History per Entity ---
  async getAIHistory(entityType, entityId) {
    const key = `bc2-${entityType}:${entityId}:ai-history`;
    try {
      const result = await window.storage.get(key);
      return result ? JSON.parse(result.value) : [];
    } catch {
      return [];
    }
  },

  async appendAIHistory(entityType, entityId, interaction) {
    const history = await this.getAIHistory(entityType, entityId);
    history.push(interaction);
    // Keep last 50 interactions per entity to stay under 5MB
    const trimmed = history.slice(-50);
    await window.storage.set(
      `bc2-${entityType}:${entityId}:ai-history`,
      JSON.stringify(trimmed)
    );
  },

  // --- Internal ---
  async _updateIndex(entityType, id) {
    const key = `bc2-${entityType}:index`;
    let ids = [];
    try {
      const result = await window.storage.get(key);
      ids = result ? JSON.parse(result.value) : [];
    } catch { /* empty */ }
    if (!ids.includes(id)) {
      ids.push(id);
      await window.storage.set(key, JSON.stringify(ids));
    }
  },

  async _removeFromIndex(entityType, id) {
    const key = `bc2-${entityType}:index`;
    try {
      const result = await window.storage.get(key);
      let ids = result ? JSON.parse(result.value) : [];
      ids = ids.filter(i => i !== id);
      await window.storage.set(key, JSON.stringify(ids));
    } catch { /* empty */ }
  },

  // --- Migration ---
  async checkAndMigrate() {
    let version = null;
    try {
      const result = await window.storage.get('bc2-meta:schema-version');
      version = result ? result.value : null;
    } catch { /* empty */ }
    if (version !== SCHEMA_VERSION) {
      await this._migrateToV2();
      await window.storage.set('bc2-meta:schema-version', SCHEMA_VERSION);
    }
  },

  async _migrateToV2() {
    // Read all existing bc2- keys and restructure
    // This is a safety net — old data gets mapped to new schema
    // Implementation depends on current key structure
    console.log('[BC] Running migration to schema v2.0');
    // ... migration logic here
  }
};
```

### 4.4 Migration Strategy for Existing Data

When implementing the new schema, the app MUST gracefully handle old data:

1. On app load, call `store.checkAndMigrate()`
2. The migration reads all existing `bc2-` keys using `window.storage.list('bc2-')`
3. For each key, detect the old format and transform to the new schema
4. Write new keys, then delete old keys
5. Set `bc2-meta:schema-version` to `'2.0'`
6. If migration fails, leave old data intact and log the error — never delete data during a failed migration

---

## 5. Frontend UI Improvements

### 5.1 Layout: Sidebar Navigation

Replace the current top tab bar with a collapsible left sidebar.

**Structure**:
```
┌──────────────────────────────────────────────────────┐
│ ┌─────┐ ┌──────────────────────────────────────────┐ │
│ │     │ │                                          │ │
│ │  S  │ │                                          │ │
│ │  I  │ │          MAIN CONTENT AREA               │ │
│ │  D  │ │                                          │ │
│ │  E  │ │                                          │ │
│ │  B  │ │                                          │ │
│ │  A  │ │                                          │ │
│ │  R  │ │                                          │ │
│ │     │ │                                          │ │
│ └─────┘ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**Sidebar behavior**:
- Collapsed width: 56px (icon only)
- Expanded width: 220px
- Toggle: click the hamburger icon or hover (with 200ms delay)
- On narrow viewports (< 768px): overlay mode, dismissed on click-outside
- Persist collapsed/expanded state in storage: `bc2-ui:sidebar-collapsed`

**Sidebar contents** (top to bottom):
```
[BC Logo / Wordmark]           ← "BC" in DM Mono, gold, clickable → Home
─────────────────────
⌂  Dashboard                   ← Default landing view
◆  Decisions                   ← Current decisions tab
☐  Tasks                       ← Current tasks tab
▲  Priorities                  ← Current priorities tab (evolves to Strategic Themes)
─────────────────────
◎  Renewals                    ← Phase 2 — show as "Coming Soon" with lock icon
─────────────────────
⚙  Settings                    ← API key config, theme, data export/import
```

**Active state**: Gold left border (3px), gold icon color, white text.
**Badge indicator**: Gold ✦ dot appears next to the nav label when a background AI operation completes for that section.

**Implementation notes**:
- Sidebar is a `<div>` with fixed positioning, `left: 0`, `top: 0`, `height: 100vh`
- Main content area gets `marginLeft` equal to sidebar width
- Use `transition: width 0.2s ease` for collapse/expand animation
- Store active view in React state: `const [activeView, setActiveView] = useState('dashboard')`
- Render content conditionally based on `activeView`

### 5.2 Dashboard / Home View

This is the **default landing screen** — the executive intelligence surface.

**Layout** (single scrollable column):

```
┌─────────────────────────────────────────────────────┐
│  Good [morning/afternoon], Michael          [date]  │
│  ───────────────────────────────────────────────     │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  DECISIONS REQUIRING ATTENTION              │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │
│  │  │ Card    │ │ Card    │ │ Card    │       │    │
│  │  └─────────┘ └─────────┘ └─────────┘       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  TASKS DUE THIS WEEK                        │    │
│  │  ┌──────────────────────────────────────┐   │    │
│  │  │ Task row with inline actions         │   │    │
│  │  ├──────────────────────────────────────┤   │    │
│  │  │ Task row with inline actions         │   │    │
│  │  └──────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  PRIORITY HEALTH CHECK                      │    │
│  │  ▲ Priority 1 ████████████░░ 78%           │    │
│  │  ▲ Priority 2 ██████░░░░░░░░ 45%           │    │
│  │  ▲ Priority 3 ████████████████ 95%         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  WEEKLY AI BRIEFING              [Generate] │    │
│  │  AI-generated summary of the week's         │    │
│  │  activity, decisions, and recommendations   │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Decisions Requiring Attention**: Show decisions with status `draft` or `analyzing` that are older than 3 days. Horizontal scroll if > 3. Each card shows title, age (e.g., "5 days"), and status badge. Click navigates to Decisions view with that decision expanded.

**Tasks Due This Week**: Filter tasks where `dueDate` falls within the current Monday–Sunday. Sort by priority (critical → low), then by due date. Each row shows: priority badge, title, due date, and a ✦ "Quick AI" button for the most common action (varies by status).

**Priority Health Check**: Show all active priorities. Health score rendered as a progress bar with color coding: green (>70), amber (40–70), red (<40). If `healthScore` is null, show "Not yet assessed" and a button to trigger AI health evaluation.

**Weekly AI Briefing**: A section that generates (via background AI call) a narrative summary of the past 7 days. Shows: decisions made, tasks completed, priorities progressed, items needing attention, and one forward-looking recommendation. Cache the result in `bc2-digest:week-{YYYY-Wnn}`.

### 5.3 Decisions View Improvements

**Current state**: Decision cards with inline AI work panels. This is strong — enhance, don't redesign.

**Additions**:
- **Lifecycle status bar**: Visual pipeline showing Draft → Analyzing → Decided → Implementing → Evaluating → Closed. Current stage is gold-highlighted. Click a stage to advance (with confirmation).
- **Linked entities section**: Below the decision content, show linked tasks and priorities as clickable chips. Include a "+ Link Task" and "+ Link Priority" action.
- **Decision templates**: A "New Decision" dropdown that offers templates:
  - Blank (current behavior)
  - Hiring Decision (pre-populated fields: role, candidates, criteria, timeline)
  - Vendor Selection (pre-populated: vendors, criteria, budget, timeline)
  - Project Prioritization (pre-populated: projects, resources, impact, urgency)
  - Strategic Pivot (pre-populated: current state, proposed change, risks, stakeholders)
  - Budget Allocation (pre-populated: total budget, competing requests, criteria)
- **Outcome tracking**: When status moves to "Evaluating", the AI panel auto-generates a prompt asking to assess the outcome against the original analysis. Surface whether the decision played out as expected.

### 5.4 Tasks View Improvements

**Current state**: Expandable cards with 5 preset AI actions + free-text input. This is strong.

**Additions**:
- **Subtask support**: Each task card can contain subtasks (checkboxes). The "Break it down" AI action should generate subtasks and auto-populate them.
- **Source decision reference**: If `sourceDecisionId` exists, show a small chip at the top of the card: "From: [Decision Title]" — clickable, navigates to the decision.
- **Grouped view**: Add a toggle to group tasks by: Status (default), Priority, Due Date, or Source Decision. Implement as a dropdown in the view header.
- **Bulk status update**: Long-press (or checkbox) to select multiple tasks. Floating action bar appears with: Mark Complete, Change Priority, Delete.
- **Overdue highlighting**: Tasks past their `dueDate` get a red left border and an "Overdue" badge.
- **Empty state**: When no tasks exist, show a friendly prompt: "No tasks yet. Create one manually or let a Decision generate them."

### 5.5 Priorities View → Strategic Themes

This is a **significant redesign**. The current ranked list becomes a richer strategic view.

**Layout**: Cards arranged vertically (not a list). Each card is larger and richer than decision/task cards.

**Each Priority/Theme Card**:
```
┌────────────────────────────────────────────────────┐
│  ▲ #1                                    ACTIVE    │
│  ─────────────────────────────────────────────────  │
│  Drive 15% GDR Improvement in Enterprise Segment   │
│                                                    │
│  Timeframe: This Quarter                           │
│  Health: ██████████░░░░ 72%                        │
│                                                    │
│  Success Metrics:                                  │
│  · Reduce at-risk accounts from 12 to 5            │
│  · Close 3 early renewals                          │
│  · Launch proactive health check program           │
│                                                    │
│  Linked: 2 Decisions · 5 Tasks                     │
│                                                    │
│  [✦ Assess Health]  [View Linked Items]  [Edit]    │
└────────────────────────────────────────────────────┘
```

- **Drag-to-reorder**: Priority rank is set by vertical position. Drag handle on the left edge.
- **Health score**: Computed by AI based on linked decision outcomes and task completion rates. Trigger manually with "Assess Health" or auto-run weekly.
- **Linked items**: Click "View Linked Items" to expand an inline panel showing all connected decisions and tasks with their statuses.

### 5.6 Command Palette (Cmd+K)

**High-impact UX feature**. Implement as a modal overlay triggered by `Cmd+K` (Mac) or `Ctrl+K` (Windows).

**Behavior**:
- Full-width modal at 50% viewport width, centered horizontally, top-third vertically
- Search input auto-focused
- Results appear in real-time as user types
- Searches across: decision titles, task titles, priority titles, tags
- Each result shows: entity type icon, title, status badge
- Click or Enter navigates to that entity
- Also supports action shortcuts:
  - `/new decision` → opens new decision form
  - `/new task` → opens new task form
  - `/briefing` → generates weekly briefing
  - `/export` → opens export dialog

**Implementation**:
```javascript
// Listen for keyboard shortcut
useEffect(() => {
  const handler = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen(true);
    }
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### 5.7 Settings View

Accessible from sidebar. Contains:

- **API Configuration**: API key input field (masked), model selector dropdown, test connection button
- **Data Management**: Export all data as JSON, Import from JSON, Clear all data (with confirmation)
- **Display Preferences**: Sidebar default state (collapsed/expanded), compact mode toggle
- **About**: Version number, schema version, last sync timestamp

### 5.8 Empty States

Every view needs a thoughtful empty state. These are the first things a new user sees.

**Dashboard (empty)**:
```
Welcome to Base Command.
Your executive intelligence platform starts here.

[+ Create Your First Decision]    [+ Add a Priority]    [+ Add a Task]
```

**Decisions (empty)**:
```
No decisions yet.
Decisions are where Base Command shines — describe your situation,
and AI helps you analyze options, risks, and recommendations.

[+ New Decision]
```

**Tasks (empty)**:
```
No tasks on your radar.
Tasks can be created directly or generated from decisions.

[+ New Task]
```

**Priorities (empty)**:
```
No strategic priorities defined.
Set your top priorities and Base Command will track execution health.

[+ Define a Priority]
```

---

## 6. Feature Implementations

### 6.1 Cross-Entity Linking

This is the connective tissue that makes BC a decision intelligence platform.

**How linking works**:
1. When creating a task, optional "Link to Decision" dropdown (populated from existing decisions)
2. When creating a decision, optional "Maps to Priority" multi-select
3. AI actions can auto-link: "Break it down" on a decision creates tasks and auto-links them
4. Manual linking: In any entity's detail view, a "+ Link" button to search and connect other entities
5. Links are bidirectional: linking task→decision also updates decision→task

**Storage**: Uses the `bc2-links:` key pattern defined in section 4.1. Also updates the entity's own `linkedTasks`/`linkedDecisions`/`linkedPriorities` arrays for fast access.

**Display**: Linked entities appear as clickable chips with type icon + title. Clicking navigates to that entity.

### 6.2 Decision Lifecycle

Status transitions and their AI triggers:

| From | To | AI Action |
|------|----|-----------|
| `draft` | `analyzing` | Auto-trigger: analyze options, risks, recommendations |
| `analyzing` | `decided` | User commits to an outcome. AI summarizes rationale. |
| `decided` | `implementing` | AI generates implementation tasks (auto-linked) |
| `implementing` | `evaluating` | AI assesses: did linked tasks complete? Any blockers? |
| `evaluating` | `closed` | AI generates outcome assessment vs original analysis |

**Implementation**: Status transitions happen via a `transitionDecision(id, newStatus)` function that:
1. Validates the transition is legal (no skipping stages)
2. Updates the decision record
3. Triggers the appropriate AI action (background)
4. Logs the transition to AI interaction history

### 6.3 Per-Entity AI Conversation Memory

Each entity maintains its own AI conversation history. When calling the API for an entity, include the last N messages from that entity's history as context.

**Implementation**:
```javascript
async function callAIForEntity(entityType, entityId, userPrompt, systemContext) {
  const history = await store.getAIHistory(entityType, entityId);
  
  // Include last 10 exchanges as context
  const contextMessages = history.slice(-10).flatMap(h => [
    { role: 'user', content: h.prompt },
    { role: 'assistant', content: h.response }
  ]);

  const messages = [
    ...contextMessages,
    { role: 'user', content: userPrompt }
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemContext,
      messages
    })
  });

  const data = await response.json();
  const aiResponse = data.content.map(c => c.text || '').join('\n');

  // Save to history
  await store.appendAIHistory(entityType, entityId, {
    id: 'ai_' + Date.now(),
    prompt: userPrompt,
    response: aiResponse,
    model: 'claude-sonnet-4-20250514',
    createdAt: new Date().toISOString()
  });

  return aiResponse;
}
```

### 6.4 Weekly Digest / Briefing

A background AI operation that generates a narrative summary.

**Trigger**: Manual button on Dashboard, or auto-generate on Monday mornings (if app is open).

**Prompt construction**: Gather all entities modified in the past 7 days, then send to AI:
```
Given the following activity from the past week:

DECISIONS MADE: [list with outcomes]
DECISIONS PENDING: [list with age]
TASKS COMPLETED: [list]
TASKS OVERDUE: [list]
PRIORITY HEALTH: [list with scores]

Generate a concise executive briefing covering:
1. Key decisions and their implications
2. Execution progress (tasks completed vs pending)
3. Strategic alignment (how activity maps to priorities)
4. Items requiring immediate attention
5. One forward-looking recommendation for the coming week

Keep the tone direct and actionable. No fluff. Address the reader as "you".
```

**Storage**: Cache result in `bc2-digest:week-{YYYY-Wnn}` to avoid regenerating.

### 6.5 Decision Templates

Templates are JavaScript objects that pre-populate a new decision form:

```javascript
const DECISION_TEMPLATES = {
  blank: {
    label: 'Blank Decision',
    title: '',
    context: '',
    options: [],
    systemPromptAddition: ''
  },
  hiring: {
    label: 'Hiring Decision',
    title: 'Hire for [Role]',
    context: 'Role: \nCandidates: \nKey criteria: \nTimeline: \nBudget: ',
    options: [],
    systemPromptAddition: 'You are helping evaluate a hiring decision. Focus on candidate-role fit, team dynamics, growth potential, and risk of a bad hire. Be specific about trade-offs between candidates.'
  },
  vendor: {
    label: 'Vendor Selection',
    title: 'Select vendor for [Need]',
    context: 'Business need: \nVendors under evaluation: \nBudget: \nTimeline: \nKey requirements: ',
    options: [],
    systemPromptAddition: 'You are helping evaluate vendor options. Focus on total cost of ownership, integration complexity, vendor stability, and switching costs. Be explicit about what you would need to know to make a stronger recommendation.'
  },
  project_priority: {
    label: 'Project Prioritization',
    title: 'Prioritize: [Projects]',
    context: 'Competing projects: \nAvailable resources: \nStrategic priorities: \nTimeline constraints: ',
    options: [],
    systemPromptAddition: 'You are helping prioritize competing projects. Use a framework that considers strategic alignment, resource requirements, time-to-value, and opportunity cost. Recommend a rank order with clear justification.'
  },
  strategic_pivot: {
    label: 'Strategic Pivot',
    title: 'Evaluate: [Change]',
    context: 'Current state: \nProposed change: \nDriver for change: \nStakeholders affected: \nRisks: ',
    options: [],
    systemPromptAddition: 'You are helping evaluate a strategic pivot. Be rigorous about second-order effects, organizational readiness, and reversibility. Challenge the assumptions behind the proposed change.'
  },
  budget: {
    label: 'Budget Allocation',
    title: 'Allocate budget for [Period/Area]',
    context: 'Total budget: \nCompeting requests: \nStrategic priorities: \nConstraints: ',
    options: [],
    systemPromptAddition: 'You are helping allocate budget across competing priorities. Focus on ROI, strategic alignment, and the cost of underfunding vs overfunding each area. Identify where marginal dollars create the most value.'
  }
};
```

### 6.6 Export & Share

**Export All Data** (Settings view):
- Serialize all entities to a single JSON object: `{ version, exportedAt, decisions: [], tasks: [], priorities: [], aiHistory: {} }`
- Trigger browser download as `basecommand-export-{date}.json`

**Import Data** (Settings view):
- File upload input accepting `.json`
- Validate schema version compatibility
- Preview: show count of entities to be imported
- Confirm dialog: "This will merge with existing data. Conflicts will be resolved by keeping the newer version."
- Import logic: for each entity, check if ID already exists. If yes, keep whichever has a later `updatedAt`. If no, create.

**Export Single Decision** (future enhancement):
- Generate a formatted text summary of a single decision: title, context, analysis, outcome, linked tasks
- Copy to clipboard or download as `.md`

---

## 7. AI Integration Architecture

### 7.1 System Prompt

The AI system prompt is critical. It establishes Base Command's persona and analytical framework.

```
You are Base Command (BC), an executive decision intelligence system. You serve as a strategic advisor to leaders, helping them make better decisions, manage priorities, and track execution.

Core principles:
- Be direct. No filler, no preamble, no "Great question!" Start with substance.
- Be specific. Reference concrete details from the context provided. Vague advice is useless.
- Be honest. If a decision looks risky, say so. If a task is overdue, don't sugarcoat it.
- Be actionable. Every response should end with something the leader can do next.
- Be concise. Respect the leader's time. Use short paragraphs. Bold key points.

When analyzing decisions:
- Identify the core tension or trade-off
- Evaluate each option against stated criteria
- Flag risks and second-order effects
- Make a recommendation with clear reasoning
- Specify what additional information would strengthen the analysis

When working with tasks:
- Break complex tasks into specific, actionable subtasks
- Identify dependencies and blockers
- Suggest delegation opportunities
- Flag tasks that seem misaligned with stated priorities

When assessing priorities:
- Evaluate progress based on linked decisions and task completion
- Identify gaps between stated priorities and actual activity
- Surface tensions between competing priorities
- Recommend rebalancing when effort distribution doesn't match priority ranking

Format responses using markdown. Use **bold** for key points. Use bullet lists sparingly and only for genuinely parallel items. Keep responses under 500 words unless the complexity demands more.
```

### 7.2 Context Assembly

Every AI call should include relevant context beyond just the user's prompt. The pattern:

```javascript
function assembleContext(entityType, entity, linkedEntities) {
  let context = `CURRENT ${entityType.toUpperCase()}:\n`;
  context += `Title: ${entity.title}\n`;
  context += `Status: ${entity.status}\n`;
  
  if (entity.context) context += `Context: ${entity.context}\n`;
  if (entity.description) context += `Description: ${entity.description}\n`;
  
  if (linkedEntities.decisions?.length) {
    context += `\nLINKED DECISIONS:\n`;
    linkedEntities.decisions.forEach(d => {
      context += `- ${d.title} (${d.status})${d.outcome ? ': ' + d.outcome : ''}\n`;
    });
  }
  
  if (linkedEntities.tasks?.length) {
    context += `\nLINKED TASKS:\n`;
    linkedEntities.tasks.forEach(t => {
      context += `- ${t.title} [${t.status}] ${t.priority} priority\n`;
    });
  }
  
  if (linkedEntities.priorities?.length) {
    context += `\nRELATED PRIORITIES:\n`;
    linkedEntities.priorities.forEach(p => {
      context += `- #${p.rank}: ${p.title} (${p.status})\n`;
    });
  }
  
  return context;
}
```

### 7.3 AI Action Registry

Centralize all AI actions in a registry. Each action defines its prompt template, entity type, and whether it runs as background or synchronous.

```javascript
const AI_ACTIONS = {
  // Decision actions
  analyze_decision: {
    label: 'Analyze',
    entityType: 'decision',
    background: false,
    promptTemplate: (entity, context) =>
      `Analyze the following decision:\n\n${context}\n\nProvide: (1) core trade-offs, (2) evaluation of options, (3) risks, (4) recommendation.`
  },
  generate_tasks: {
    label: 'Generate Tasks',
    entityType: 'decision',
    background: true,
    promptTemplate: (entity, context) =>
      `Given this decided outcome:\n\n${context}\n\nGenerate 3-7 specific implementation tasks. For each task provide: title, description, priority (critical/high/medium/low), and suggested due date relative to today. Return as JSON array.`
  },
  evaluate_outcome: {
    label: 'Evaluate Outcome',
    entityType: 'decision',
    background: false,
    promptTemplate: (entity, context) =>
      `This decision was made and implemented:\n\n${context}\n\nEvaluate: Did the outcome match the original analysis? What was unexpected? What would you do differently?`
  },

  // Task actions
  break_down: {
    label: 'Break it down',
    entityType: 'task',
    background: false,
    promptTemplate: (entity, context) =>
      `Break this task into specific, actionable subtasks:\n\n${context}\n\nReturn 3-7 subtasks, each with a clear title and concrete completion criteria.`
  },
  draft_update: {
    label: 'Draft an update',
    entityType: 'task',
    background: false,
    promptTemplate: (entity, context) =>
      `Draft a brief status update for stakeholders on this task:\n\n${context}\n\nInclude: current status, progress made, blockers if any, next steps, expected completion.`
  },
  identify_blockers: {
    label: 'Identify blockers',
    entityType: 'task',
    background: false,
    promptTemplate: (entity, context) =>
      `Analyze this task for potential blockers:\n\n${context}\n\nIdentify: dependencies, resource gaps, unclear requirements, organizational friction, and suggest unblocking strategies.`
  },
  delegate_it: {
    label: 'Delegate it',
    entityType: 'task',
    background: false,
    promptTemplate: (entity, context) =>
      `Help me delegate this task:\n\n${context}\n\nSuggest: what to delegate, what to retain, how to brief the delegate, success criteria, and check-in cadence.`
  },
  push_back: {
    label: 'Push back?',
    entityType: 'task',
    background: false,
    promptTemplate: (entity, context) =>
      `Evaluate whether this task should be pushed back or declined:\n\n${context}\n\nConsider: strategic alignment, opportunity cost, timing, and alternatives. Draft a tactful pushback message if warranted.`
  },

  // Priority actions
  assess_health: {
    label: 'Assess Health',
    entityType: 'priority',
    background: true,
    promptTemplate: (entity, context) =>
      `Assess the health of this strategic priority:\n\n${context}\n\nEvaluate based on: linked decision progress, task completion rate, alignment of recent activity, and external risks. Provide a health score (0-100) and specific recommendations. Return the score as a number on the first line.`
  },

  // Global actions
  weekly_briefing: {
    label: 'Weekly Briefing',
    entityType: 'global',
    background: true,
    promptTemplate: (allData) =>
      `Generate an executive weekly briefing based on the following activity:\n\n${allData}\n\nCover: key decisions, execution progress, priority alignment, items needing attention, and one forward-looking recommendation. Be direct and concise.`
  }
};
```

### 7.4 Background Operation Handler

The existing fire-and-forget pattern works well. Standardize it:

```javascript
const pendingOps = {};  // { [viewName]: { status, result, action } }

async function runBackgroundAI(actionKey, entity, onComplete) {
  const action = AI_ACTIONS[actionKey];
  const viewName = action.entityType === 'global' ? 'dashboard' : action.entityType;
  
  pendingOps[viewName] = { status: 'running', action: actionKey };
  
  try {
    const context = await assembleContextForEntity(action.entityType, entity);
    const prompt = action.promptTemplate(entity, context);
    const response = await callAI(prompt);
    
    pendingOps[viewName] = { status: 'complete', result: response, action: actionKey };
    
    // Save to AI history
    if (entity?.id) {
      await store.appendAIHistory(action.entityType, entity.id, {
        id: 'ai_' + Date.now(),
        action: actionKey,
        prompt,
        response,
        model: 'claude-sonnet-4-20250514',
        background: true,
        createdAt: new Date().toISOString()
      });
    }
    
    if (onComplete) onComplete(response);
  } catch (err) {
    pendingOps[viewName] = { status: 'error', error: err.message, action: actionKey };
  }
}
```

**Badge indicator**: In the sidebar, check `pendingOps[viewName]?.status === 'complete'` and render the ✦ badge. Clear on navigation to that view.

---

## 8. Migration Path: Local → Production

> **Important**: This section is reference documentation for the FUTURE migration. All current development should target the local artifact version. Do NOT implement Vercel, Next.js, or server-side code until explicitly instructed.

### 8.1 Pre-Migration Checklist (Do These Locally First)

- [ ] All features in section 6 are implemented and working in artifact
- [ ] Data access layer (section 4.3) is abstracted — no direct `window.storage` calls in components
- [ ] Schema version tracking is working
- [ ] Export/Import data works (this is your backup mechanism)
- [ ] All AI calls go through a single `callAI()` function (not scattered `fetch()` calls)

### 8.2 Repository Setup

```bash
# Initialize
mkdir basecommand && cd basecommand
git init
npm init -y

# Core dependencies
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/node tailwindcss

# AI & Data
npm install ai @anthropic-ai/sdk drizzle-orm
npm install -D drizzle-kit

# Auth (choose one)
npm install @clerk/nextjs   # or next-auth
```

### 8.3 Directory Structure (Target — for reference only)

```
basecommand/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with sidebar
│   │   ├── page.tsx                # Dashboard (home)
│   │   ├── decisions/
│   │   │   └── page.tsx
│   │   ├── tasks/
│   │   │   └── page.tsx
│   │   ├── priorities/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── chat/route.ts       # Anthropic proxy
│   │       ├── data/route.ts       # CRUD operations
│   │       └── ingest/route.ts     # Phase 2: renewal data
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── AIPanel.tsx
│   │   ├── EntityLink.tsx
│   │   ├── EmptyState.tsx
│   │   └── Toast.tsx
│   ├── data/
│   │   ├── store.ts                # Data access layer
│   │   ├── schema.ts               # Drizzle schema
│   │   └── migrations/
│   ├── ai/
│   │   ├── actions.ts              # AI action registry
│   │   ├── context.ts              # Context assembly
│   │   └── prompts.ts              # System prompts
│   └── lib/
│       ├── types.ts                # TypeScript interfaces
│       └── utils.ts                # Shared utilities
├── public/
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.js
├── BASECOMMAND_INSTRUCTIONS.md     # This file
└── README.md
```

### 8.4 Migration Steps (Execute When Ready)

1. **Export all data** from the artifact version using the Export feature
2. **Set up Vercel project** → connect GitHub repo → configure domain
3. **Extract the single-file React app** into the directory structure above
4. **Replace `window.storage`** calls with API route calls (`/api/data`)
5. **Replace direct Anthropic `fetch()`** calls with `/api/chat` proxy
6. **Set up Vercel Postgres** → run Drizzle migrations → import exported data
7. **Add Clerk auth** → protect API routes → add user context to data operations
8. **Set up Vercel KV** for caching AI responses and session state
9. **DNS**: Point basecommand.ai to Vercel
10. **Verify**: All features work, data is intact, API key is server-side only

### 8.5 Environment Variables (Vercel)

```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgres://...
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

---

## 9. File & Directory Structure (Artifact Version)

While Base Command runs as a single `.jsx` artifact, the code should be mentally organized into logical sections. Use clear comment headers:

```javascript
// ============================================================
// BASE COMMAND v2.0
// ============================================================

// --- IMPORTS ---
import { useState, useEffect, useCallback, useRef } from 'react';

// --- CONSTANTS ---
// Colors, typography, spacing, templates, AI actions

// --- DATA ACCESS LAYER ---
// store object with all CRUD, linking, AI history methods

// --- AI ENGINE ---
// callAI, callAIForEntity, assembleContext, runBackgroundAI

// --- COMPONENTS ---
// Sidebar, CommandPalette, Card, Badge, AIPanel, EntityLink, EmptyState

// --- VIEWS ---
// DashboardView, DecisionsView, TasksView, PrioritiesView, SettingsView

// --- APP SHELL ---
// Main component with sidebar + content routing

// --- DEFAULT EXPORT ---
export default function BaseCommand() { ... }
```

---

## 10. Code Conventions

### General Rules

- **No external UI libraries**. React only. No Material UI, no Chakra, no shadcn.
- **Inline styles only**. Define style objects as constants. No CSS files.
- **Tailwind is NOT used in the artifact version**. It's reserved for the Vercel migration.
- **DM Mono + DM Sans** via Google Fonts `<link>` in a `useEffect` (or pre-loaded).
- **Functional components only**. No class components.
- **Hooks**: `useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`. No custom hook files (they stay inline in the single file).
- **No TypeScript in the artifact version**. Use JSDoc comments for type hints where helpful.
- **Error handling**: Every `window.storage` call wrapped in try/catch. Every `fetch()` call wrapped in try/catch. Never let an error crash the app silently.

### Naming

- Components: `PascalCase` (e.g., `DecisionsView`, `AIPanel`)
- Functions: `camelCase` (e.g., `runBackgroundAI`, `assembleContext`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `AI_ACTIONS`, `DECISION_TEMPLATES`)
- Entity IDs: `{type_prefix}_{timestamp}` (e.g., `d_1709901234567`, `t_1709901234567`)
- Storage keys: `bc2-{entity}:{id}` (e.g., `bc2-decision:d_1709901234567`)

### State Management

- Use React `useState` for all component state
- For cross-view state (active view, pending AI ops, sidebar state), lift to the root `BaseCommand` component
- For entity data, load from `store` on view mount, save on change
- No Redux, no Zustand, no Context API (overkill for single-file app)

### Performance

- Use `useCallback` for functions passed as props
- Use `useMemo` for expensive computations (e.g., filtering/sorting large task lists)
- Lazy-load entity data — only fetch when a view mounts, not on app init
- Debounce search inputs (command palette) at 200ms

---

## 11. Testing & Validation

### Manual Testing Checklist

Before any major change is considered complete, verify:

- [ ] **Data persistence**: Create an entity, reload the app, confirm it persists
- [ ] **CRUD operations**: Create, read, update, delete for all entity types
- [ ] **AI calls**: Both synchronous and background operations complete and store results
- [ ] **Navigation**: All sidebar links render the correct view
- [ ] **Command palette**: Opens on Cmd+K, searches across entities, navigates correctly
- [ ] **Linking**: Link a task to a decision, verify both sides show the link
- [ ] **Empty states**: View every section with no data, confirm empty state renders
- [ ] **Status transitions**: Walk a decision through the full lifecycle
- [ ] **Export/Import**: Export data, clear everything, import, verify all data restored
- [ ] **Error resilience**: Disconnect network, trigger an AI call, confirm graceful error handling

### Data Integrity Checks

After any migration or schema change:
- Count entities before and after — totals should match
- Spot-check 3 entities of each type — data should be identical
- Verify all links are bidirectional — if task→decision exists, decision→task should too
- Confirm AI history is preserved per entity

---

## 12. Work Order: Sequenced Build Plan

Execute these in order. Each step builds on the previous one. Do NOT skip ahead.

### Step 1: Data Access Layer
**What**: Implement the `store` object from section 4.3
**Where**: Add as a code section near the top of the app, after constants
**Why**: Everything else depends on this abstraction
**Acceptance**: All existing data loads correctly. No direct `window.storage` calls remain in component code.

### Step 2: Entity Schema Migration
**What**: Implement new key structure (section 4.1), add schema versioning, run migration
**Where**: `store.checkAndMigrate()` called on app init
**Why**: New features need structured data with relationships
**Acceptance**: Existing data migrated to new keys. `bc2-meta:schema-version` is `"2.0"`.

### Step 3: Sidebar Navigation
**What**: Replace tab bar with left sidebar (section 5.1)
**Where**: Root component layout
**Why**: Scales to more views, creates the command-center feel
**Acceptance**: All existing views accessible from sidebar. Collapse/expand works. Active state shows gold indicator.

### Step 4: Dashboard View
**What**: Build the Home/Dashboard view (section 5.2)
**Where**: New view component, set as default on app load
**Why**: Executive landing surface is the #1 missing feature
**Acceptance**: Shows decisions needing attention, tasks due this week, priority health, weekly briefing section.

### Step 5: Cross-Entity Linking
**What**: Implement the linking system (section 6.1)
**Where**: Data layer + UI components in each view
**Why**: Connections between entities are what make BC an intelligence platform
**Acceptance**: Can link tasks to decisions, decisions to priorities. Links show in both entities. Clicking navigates.

### Step 6: Decision Lifecycle
**What**: Implement status pipeline and transition triggers (section 6.3)
**Where**: Decisions view
**Why**: Decisions need structure beyond "created" and "done"
**Acceptance**: Visual status bar renders. Each transition triggers correct AI action. Status history preserved.

### Step 7: Enhanced Tasks View
**What**: Add subtasks, source references, grouped view, overdue highlighting (section 5.4)
**Where**: Tasks view
**Why**: Tasks are the execution layer; they need more structure
**Acceptance**: Subtasks create/complete. Source decision chip shows. Group-by toggle works. Overdue items highlighted.

### Step 8: Strategic Themes (Priorities Redesign)
**What**: Redesign priorities into richer theme cards with health scoring (section 5.5)
**Where**: Priorities view
**Why**: Current priorities view is the weakest tab
**Acceptance**: Rich cards with health bars. "Assess Health" triggers AI scoring. Linked items expand inline.

### Step 9: Command Palette
**What**: Implement Cmd+K universal search and action launcher (section 5.6)
**Where**: Global overlay component
**Why**: Power user feature that dramatically improves navigation
**Acceptance**: Opens on Cmd+K. Searches across all entities. Action shortcuts work. Escape dismisses.

### Step 10: Per-Entity AI Memory
**What**: Each entity maintains AI conversation history (section 6.3)
**Where**: AI engine + AI panel components
**Why**: Stateless AI interactions severely limit follow-up quality
**Acceptance**: Second AI question on same entity references previous context. History stored in `bc2-{type}:{id}:ai-history`.

### Step 11: Decision Templates
**What**: Pre-built decision frameworks (section 6.5)
**Where**: New Decision creation flow
**Why**: Reduces friction for common decision types
**Acceptance**: Template selector appears on new decision. Fields pre-populate. AI system prompt includes template context.

### Step 12: Weekly Digest
**What**: AI-generated weekly briefing (section 6.4)
**Where**: Dashboard view
**Why**: The "Chief of Staff" feature made real
**Acceptance**: Generates narrative summary from past 7 days of activity. Cached per week. Displays on dashboard.

### Step 13: Export/Import & Settings
**What**: Data export/import, settings view (sections 5.7, 6.6)
**Where**: Settings view
**Why**: Data portability and configuration management
**Acceptance**: Export produces valid JSON. Import restores all data. Settings persist across sessions.

### Step 14: Empty States & Polish
**What**: Empty states for all views, animation polish, edge case handling (section 5.8)
**Where**: Every view
**Why**: First impressions and error resilience
**Acceptance**: Every view looks good with zero data. All transitions are smooth. No console errors.

---

## Appendix A: Key Decisions & Rationale

| Decision | Choice | Why |
|----------|--------|-----|
| Inline styles over CSS/Tailwind | Inline | Artifact environment doesn't support CSS files. Tailwind reserved for Vercel migration. |
| DM Mono + DM Sans | Dual font | Mono preserves brand identity; Sans improves content readability. |
| No external UI libraries | Vanilla React | Reduces bundle size, avoids version conflicts in artifact environment. |
| KV storage with relational-like patterns | Hybrid | Pragmatic middle ground — real DB comes with Vercel migration. |
| Background AI with badge notification | UX pattern | Users shouldn't wait for AI; non-blocking ops are critical for productivity feel. |
| Sidebar over top tabs | Layout pattern | Scales to unlimited views, standard in productivity tools, frees horizontal space. |
| Single-file architecture for now | Simplicity | Artifact environment requires it. Clean section headers simulate file structure. |

## Appendix B: AI Model Usage Guide

| Use Case | Model | Reason |
|----------|-------|--------|
| Inline AI panels (sync) | Sonnet | Speed matters for interactive responses |
| Background analysis | Sonnet | Good enough for most analysis; cost-efficient |
| Deep decision analysis | Opus | Use when decision context is complex and stakes are high |
| Weekly briefing | Sonnet | Summarization doesn't need Opus-level reasoning |
| Health scoring | Sonnet | Pattern matching across linked entities |

To switch models, update the `model` parameter in `callAI()`. The model name is: `claude-sonnet-4-20250514` for Sonnet.

## Appendix C: Phase 2 Renewal Data (Reference Only)

Phase 2 adds renewal intelligence to Base Command. This will be implemented AFTER the Vercel migration, as it requires server-side data ingestion and confidential data handling under the enterprise API license.

**New entities**: `account`, `contract`, `renewal_event`, `health_score_history`

**New views**: Renewal Dashboard (portfolio heatmap), Account Detail (health timeline), Risk Report

**New AI actions**: `score_account_risk`, `generate_renewal_playbook`, `forecast_churn`, `analyze_portfolio`

**Data sources**: Quickbase API (primary), Salesforce (secondary), CSV upload (fallback)

This section will be expanded into a full specification document when Phase 2 begins.

---

*End of instructions. This document should be the first thing read before any work on the Base Command codebase.*
