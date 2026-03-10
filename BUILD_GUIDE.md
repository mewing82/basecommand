# Base Command — Production Build Guide
**From Claude Artifact to basecommand.ai**
*Prepared March 2026 · Version 1.0*

---

## What You Have Right Now

A single-file React 18 component (`BaseCommand.jsx`, ~1,800 lines) running inside Claude's artifact environment. It is fully functional and architecturally sound. The core app logic, AI persona, and all tab modules are complete.

**The two problems that block production deployment:**

1. **The Anthropic API key is injected by Claude's artifact environment.** In any other context, the `callClaude()` function calls `api.anthropic.com` directly from the browser — meaning your API key would be visible to anyone who opens DevTools. This is the single most critical security issue.

2. **Storage uses `window.storage`**, a Claude-only API. Nothing else implements it. This must be swapped to `localStorage` (Phase 1) or a database (Phase 2).

Everything else is a migration, not a rewrite.

---

## Recommended Architecture

### Phase 1 — Personal Production (Single User)

```
Browser (React + Vite)
        |
        | HTTPS only
        v
Vercel Edge/Serverless Function   <-- API key lives here, never in browser
        |
        | Server-to-server
        v
Anthropic Claude API
```

**Storage:** `localStorage` in the browser (zero infrastructure, instant migration)
**Auth:** Vercel Password Protection (one toggle, no code required)
**Hosting:** Vercel → `basecommand.ai`
**Build time:** One afternoon

### Phase 2 — Multi-User Platform

```
Browser (Next.js App Router)
        |
        v
Next.js API Routes (Vercel)
    |           |
    v           v
Supabase     Anthropic API
(Postgres +  (proxied through
 Auth +       server only)
 RLS)
```

**Auth:** Supabase Auth (email magic link or Google OAuth)
**Storage:** Supabase Postgres with Row-Level Security
**Build time:** 1–2 focused weekends

---

## Phase 1 — Step-by-Step Build Instructions

### Step 1: Prerequisites

Install the following if not already present:

```bash
# Node.js (v20 or later)
# Check: node --version

# Install via https://nodejs.org or use nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 20
nvm use 20

# Verify
node --version   # should print v20.x.x
npm --version

# Vercel CLI
npm install -g vercel
```

You also need:
- A GitHub account (free)
- A Vercel account at vercel.com (free tier is sufficient for Phase 1)
- Your Anthropic API key (from console.anthropic.com)

---

### Step 2: Create the Project

```bash
# Create a new Vite + React project
npm create vite@latest basecommand -- --template react
cd basecommand
npm install
```

Your folder structure will be:
```
basecommand/
  src/
    App.jsx        <-- your main component goes here
    main.jsx       <-- entry point (leave as-is)
  api/             <-- create this folder (Vercel serverless functions)
  public/
  index.html
  vite.config.js
  package.json
```

---

### Step 3: Migrate the Component

1. Copy the entire contents of `BaseCommand.jsx` into `src/App.jsx`.
2. Remove the import line at the top (Vite handles React differently):
   - Keep: `import { useState, useEffect, useRef } from "react";`
   - Make sure `App.jsx` ends with `export default App;` (or whatever the root component is named)

3. Update `src/main.jsx` to match:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

4. Update `index.html` to load the DM Mono font (currently loaded via Google Fonts in the artifact — move it to the HTML head):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

### Step 4: Fix Storage — Replace `window.storage` with `localStorage`

This is a two-line change in `BaseCommand.jsx`. Find the storage helper functions and replace them:

**Before (Claude artifact):**
```js
const load = async (key) => {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : []; } catch { return []; }
};
const save = async (key, val) => {
  try { await window.storage.set(key, JSON.stringify(val)); } catch (e) {}
};
```

**After (localStorage):**
```js
const load = async (key) => {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : []; } catch { return []; }
};
const save = async (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
};
```

The `async/await` wrappers are preserved intentionally — all the call sites use `.then()` or `await`, so no other code changes are needed. `localStorage` is synchronous but wrapping it in a resolved promise is harmless and keeps every call site identical.

---

### Step 5: Create the API Proxy — THE CRITICAL SECURITY STEP

**Never call the Anthropic API from browser JavaScript in production.** Your API key would be visible in the network tab to any user who opens DevTools.

Create the file `api/claude.js` in your project root:

```js
// api/claude.js
// Vercel Serverless Function — runs on the server, never in the browser

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic request size guard (prevent abuse)
  const body = req.body;
  if (!body || !body.messages) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,   // from Vercel env vars
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-20250514',
        max_tokens: body.max_tokens || 4000,
        system: body.system,
        messages: body.messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

Then update `callClaude()` in `App.jsx` to call your proxy instead of Anthropic directly:

**Before:**
```js
async function callClaude(messages, systemOverride) {
  const body = { model: "claude-sonnet-4-20250514", max_tokens: 4000, messages };
  if (systemOverride) body.system = systemOverride;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ...
}
```

**After:**
```js
async function callClaude(messages, systemOverride) {
  const body = { model: "claude-sonnet-4-20250514", max_tokens: 4000, messages };
  if (systemOverride) body.system = systemOverride;
  const res = await fetch("/api/claude", {         // <-- your proxy, not Anthropic directly
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  return data.content?.map(b => b.text || "").join("") || "Error reaching API.";
}
```

The API key **never touches the browser**. It lives in Vercel's encrypted environment variable store and is only used server-side.

---

### Step 6: Configure Vercel

Create `vercel.json` in the project root:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

These headers harden the app against clickjacking and content-type sniffing attacks at no cost.

---

### Step 7: Initialize Git and Push to GitHub

```bash
# From your project root
git init
git add .
git commit -m "Initial production build"

# Create a new private repo on github.com, then:
git remote add origin git@github.com:YOUR_USERNAME/basecommand.git
git branch -M main
git push -u origin main
```

**Make the GitHub repo private.** Your source code contains your system prompt and app logic — keep it private.

---

### Step 8: Deploy to Vercel

```bash
vercel
```

Follow the prompts:
- Link to your GitHub repo
- Project name: `basecommand`
- Framework: `Vite`
- Root directory: `.`
- Build command: `npm run build` (default)
- Output directory: `dist` (default)

After the first deploy, go to the Vercel dashboard:

1. **Settings → Environment Variables**
   - Add: `ANTHROPIC_API_KEY` = your key
   - Set scope to: Production + Preview
   - Click Save

2. **Redeploy** to pick up the environment variable:
   ```bash
   vercel --prod
   ```

---

### Step 9: Add Password Protection (Personal Use Security)

Since this is for personal use only, Vercel's built-in password protection is the simplest and most effective option — no code required.

In the Vercel dashboard:
1. Go to your project → **Settings → Deployment Protection**
2. Enable **Password Protection**
3. Set a strong password (use a password manager)

This wraps the entire app in a Vercel-managed authentication wall before anyone reaches your React code. It is enforced at the edge, not in JavaScript — it cannot be bypassed client-side.

**Important:** This feature requires Vercel Pro ($20/month). If you want to stay on the free tier, see the "Alternative: Simple Token Auth" section below.

---

### Step 10: Connect Your Domain

In Vercel dashboard:
1. **Settings → Domains**
2. Add `basecommand.ai`
3. Vercel will give you DNS records

In Namecheap (where your domain is registered):
1. Go to Domain → Advanced DNS
2. Add the A record and CNAME record Vercel specifies
3. DNS propagation takes up to 24 hours (usually under an hour)

Vercel automatically provisions and renews a TLS certificate (HTTPS) for free via Let's Encrypt. Your app will be served only over HTTPS.

---

### Alternative: Simple Token Auth (Free Tier)

If you don't want Vercel Pro, add a simple token check to the API proxy and a PIN screen to the frontend.

In `api/claude.js`, add at the top of the handler:

```js
const clientToken = req.headers['x-app-token'];
if (clientToken !== process.env.APP_SECRET_TOKEN) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

Add `APP_SECRET_TOKEN` to your Vercel environment variables (a long random string — use `openssl rand -hex 32` to generate one).

In `App.jsx`, add a simple lock screen that stores the token in `localStorage` on first entry. All `callClaude()` calls pass the token as a header. No token = no API access.

This isn't enterprise auth, but for personal use on your own domain it is sufficient. The API key is still protected server-side — the worst case is someone brute-forces the PIN and gets access to your Base Command instance.

---

## Phase 2 — Multi-User Platform

When you are ready to open this to other Quickbase leaders, the architecture needs to change. The core shift: **data must be per-user, isolated, and server-side.**

### Recommended Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Replaces Vite; built-in API routes, SSR, better for auth flows |
| Auth | Supabase Auth | Free tier, magic link + OAuth, integrates natively with the DB |
| Database | Supabase Postgres | Row-Level Security enforces per-user data isolation at the DB layer |
| AI Proxy | Next.js API Route | Same pattern as the Vercel function, just Next.js syntax |
| Hosting | Vercel | Unchanged |
| Domain | basecommand.ai | Unchanged |

### Why Supabase over alternatives

- **Clerk** is excellent for auth but adds a second vendor. Supabase gives you auth + database in one, with deep integration between them.
- **Firebase** has no row-level security equivalent that is as clean.
- **PlanetScale / Neon** are great databases but require a separate auth layer.
- **Supabase free tier** handles hundreds of users comfortably for an internal tool.

---

### Phase 2 Migration Steps (High Level)

**Step 1: Create the Next.js app**
```bash
npx create-next-app@latest basecommand --typescript --app --tailwind
```

Note: Consider migrating the inline styles to Tailwind at this point. It is not required, but Tailwind will be significantly easier to maintain across multiple components as the codebase grows.

**Step 2: Set up Supabase**
1. Create a project at supabase.com
2. Create tables matching current storage keys:

```sql
-- Core tables (one per storage key, all with user_id foreign key)
create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  data jsonb not null,
  created_at timestamptz default now()
);

-- Repeat pattern for: decisions, priorities, meetings,
-- meeting_tasks, upcoming, ledger, agendas, chat_history

-- Row Level Security: users can only see their own data
alter table entries enable row level security;
create policy "Users see own entries" on entries
  for all using (auth.uid() = user_id);
```

**Step 3: Replace localStorage with Supabase client**

The same `load()` / `save()` abstraction pattern applies — just swap the implementation:

```js
// lib/storage.js
import { supabase } from './supabase'

export const load = async (table) => {
  const { data } = await supabase.from(table).select('data').order('created_at')
  return data?.map(r => r.data) ?? []
}

export const save = async (table, rows) => {
  const user_id = (await supabase.auth.getUser()).data.user.id
  // upsert logic here
}
```

**Step 4: Add Auth UI**

Supabase provides a drop-in `Auth` component. Wrap your app in a session check:

```jsx
// app/layout.jsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'

export default async function Layout({ children }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  return <>{children}</>
}
```

**Step 5: Add user management**

Simple admin table in Supabase to allowlist users:
```sql
create table allowed_users (
  email text primary key,
  role text default 'member',  -- 'admin' | 'member'
  added_at timestamptz default now()
);
```

On signup, check if the email is in `allowed_users`. If not, reject. This gives you controlled access during the internal rollout.

---

## Security Checklist

### Phase 1 (Must Have Before Going Live)

- [ ] **API key is in Vercel environment variables only** — never in source code, never in the browser
- [ ] **All Claude calls go through `/api/claude`** — zero direct browser-to-Anthropic calls
- [ ] **GitHub repo is private** — system prompt and app logic are not public
- [ ] **Password protection is enabled** — Vercel Password Protection or token-based lock screen
- [ ] **HTTPS is enforced** — Vercel handles this automatically via Let's Encrypt
- [ ] **Security headers are set** — `vercel.json` headers block clickjacking and sniffing
- [ ] **`.env.local` is in `.gitignore`** — never commit secrets

### Phase 2 (Add When Going Multi-User)

- [ ] **Row-Level Security is enabled on all Supabase tables** — verify with `explain` queries
- [ ] **User allowlist gates signup** — no open registration
- [ ] **API rate limiting on the Claude proxy** — prevent one user from burning your API budget
- [ ] **Supabase service role key is server-only** — the anon key is fine in the browser; service role is not
- [ ] **Audit log of AI calls** — Base Command already has the Activity Ledger; persist it to Supabase
- [ ] **Content Security Policy header** — add `Content-Security-Policy` to `vercel.json` headers
- [ ] **Dependency audit** — run `npm audit` before launch; address any high/critical findings

### What You Do NOT Need to Worry About (Yet)

- SOC 2 / compliance certifications — that is an enterprise conversation, not a personal tool problem
- SAML / SSO — Supabase supports it, but magic link is fine for an internal team
- Data encryption at rest — Supabase and Vercel both handle this by default

---

## Environment Variables Reference

```bash
# .env.local (development — never commit this file)
ANTHROPIC_API_KEY=sk-ant-...
APP_SECRET_TOKEN=<random 32-char hex string>    # Phase 1 token auth only
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co   # Phase 2
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...               # Phase 2 — safe to be public
SUPABASE_SERVICE_ROLE_KEY=eyJ...                   # Phase 2 — SERVER ONLY, never NEXT_PUBLIC_
```

In Vercel, set these under **Settings → Environment Variables**. Never put a secret in a variable prefixed with `NEXT_PUBLIC_` — those are bundled into the client JavaScript.

---

## File Structure — Phase 1 (Vite)

```
basecommand/
  api/
    claude.js              # Serverless function — API proxy
  public/
    favicon.ico
  src/
    App.jsx                # Your BaseCommand.jsx (migrated)
    main.jsx               # Vite entry point
  .env.local               # Local secrets (gitignored)
  .gitignore
  index.html
  package.json
  vercel.json              # Security headers + rewrites
  vite.config.js
```

## File Structure — Phase 2 (Next.js)

```
basecommand/
  app/
    (auth)/
      login/page.jsx       # Auth UI
    (app)/
      layout.jsx           # Session guard
      page.jsx             # Home tab
    api/
      claude/route.js      # API proxy (App Router syntax)
  components/
    tabs/                  # One file per tab (split from monolith)
      InboxTab.jsx
      MeetingsTab.jsx
      TasksTab.jsx
      DecisionsTab.jsx
      PrioritiesTab.jsx
      DailyLogTab.jsx
      UpcomingTab.jsx
      LedgerTab.jsx
      AgendaTab.jsx
  lib/
    supabase.js            # Supabase client
    storage.js             # load/save abstraction
    claude.js              # callClaude() helper
    prompts.js             # SYSTEM_PROMPT, MEETING_INGEST_PROMPT
  .env.local
  .gitignore
  next.config.js
  vercel.json
  package.json
```

---

## Recommended Sequence

### This Week — Phase 1 Personal Deploy
1. Install Node, create Vite project
2. Copy `BaseCommand.jsx` → `src/App.jsx`
3. Swap `window.storage` → `localStorage` (2 lines)
4. Create `api/claude.js` proxy
5. Update `callClaude()` to call `/api/claude`
6. Push to private GitHub repo
7. Deploy to Vercel, add API key to env vars
8. Enable password protection or add token lock screen
9. Connect `basecommand.ai` domain

### Next Month — Phase 1 Polish
- Fix any UI issues that appeared outside the Claude artifact renderer
- Test all AI flows end-to-end on the production domain
- Add the font loading to `index.html`
- Smoke-test localStorage persistence across browser sessions

### When Ready to Share — Phase 2 Multi-User
- Scaffold Next.js app
- Set up Supabase project, create tables, enable RLS
- Migrate storage from localStorage to Supabase
- Add Supabase Auth with allowlist
- Split the monolith `App.jsx` into per-tab components
- Deploy, add users one at a time

---

## Known Gotchas

**`window.storage` calls will fail silently.** The current `save()` function has an empty `catch` block — so if you forget to swap the storage helpers, data will appear to save but nothing will persist. Test with a hard browser refresh immediately after the migration.

**The Claude artifact renderer is lenient with JSX.** Vite's bundler is strict. If the build fails, common causes are:
- Missing closing tags
- Inline event handlers using reserved words
- Implicit returns from arrow functions with object literals (wrap in parens: `() => ({ key: val })`)

Run `npm run build` locally before deploying to catch these.

**`localStorage` has a 5MB limit.** For personal use this is fine — the Activity Ledger is the only thing that grows unbounded. Consider adding a "trim ledger" function that keeps only the last 90 days if storage warnings appear.

**Vercel free tier has a 10-second timeout on serverless functions.** Claude API calls are typically 2–8 seconds for normal requests. Long meeting ingests (large transcripts) may approach the limit. If you hit timeouts, increase max response tokens only when needed, or upgrade to Vercel Pro (60-second timeout).

---

## Cost Estimate

### Phase 1 (Personal)
| Item | Cost |
|---|---|
| Vercel free tier | $0/month |
| Vercel Pro (if using password protection) | $20/month |
| Anthropic API — personal use | ~$5–15/month depending on usage |
| Domain (already acquired) | $0 additional |
| **Total** | **$5–35/month** |

### Phase 2 (5–20 users)
| Item | Cost |
|---|---|
| Vercel Pro | $20/month |
| Supabase free tier | $0/month (up to 500MB, 50K MAU) |
| Anthropic API — team use | ~$20–80/month |
| **Total** | **$40–100/month** |

If the CAB proposal for an enterprise Anthropic license is approved, the API cost disappears from this line item entirely.

---

*Base Command Build Guide v1.0 · March 2026*
*Prepared with AI assistance (Anthropic Claude). All technical recommendations reviewed by the author.*
