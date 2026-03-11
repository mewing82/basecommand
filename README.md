# Base Command
**Executive Decision Intelligence Platform**

---

## Quick Start

### 1. Install Node.js
Go to https://nodejs.org and download the LTS version (v20+). Verify:
```bash
node --version   # should print v20.x.x
npm --version
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Add your API key
Go to **Settings > AI Configuration** and add your Anthropic or OpenAI API key. Keys are stored locally in your browser — never sent to any server.

---

## Architecture

- **Frontend**: React 18 single-page app (Vite)
- **Data storage**: Browser localStorage with `bc2-` namespaced keys
- **AI calls**: Direct browser-to-API (Anthropic / OpenAI) — no proxy server
- **Fonts**: Space Grotesk (headings) + Inter (body) + JetBrains Mono (code/data)
- **Icons**: Lucide React (tree-shaken SVG)

### Local-First Design
All user data (decisions, tasks, priorities, meetings, projects, documents) stays in your browser's localStorage. AI API calls go directly from your browser to the AI provider — no intermediary servers. Your API keys are stored locally and never transmitted to third parties.

### File Structure
```
BaseCommand/
  src/
    App.jsx          # Full application (single-file architecture)
    main.jsx         # React entry point
  api/               # Vercel serverless functions (inactive in local-first mode)
  scripts/
    dev-api.js       # Local dev API proxy (legacy)
  .env.example       # Environment variable template
  index.html         # HTML shell with font imports
  package.json
  vite.config.js
  vercel.json        # Security headers for production
```

### Core Entities
- **Decisions** — track decisions through a lifecycle (draft → analyzing → decided → implementing → closed)
- **Tasks** — actionable items with priority, status, subtasks, and AI guidance
- **Priorities** — ranked strategic priorities with health scoring
- **Projects** — organize tasks, decisions, and documents with AI-generated plans
- **Meetings** — log meetings and auto-extract tasks/decisions
- **Library** — upload and study documents with AI-powered guides

---

## Deployment (Optional)

The app can be deployed to Vercel as a static site:
1. Push to a private GitHub repo
2. Connect to Vercel (Framework: Vite, Root: `.`)
3. Add custom domain in Vercel settings

Note: Email connectors (Gmail/Outlook) require server-side OAuth and are not available in local-first mode.

---

## Security
- `.env.local` is gitignored — secrets are never committed
- All AI calls go directly from browser to API provider
- API keys stored in browser localStorage only
- No user data is stored on any server
