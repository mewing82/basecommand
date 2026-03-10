# Base Command
**Executive Decision Intelligence Platform**

---

## Quick Start (Local)

### 1. Install Node.js
Go to https://nodejs.org and download the LTS version (v20+). Install it, then verify:
```bash
node --version   # should print v20.x.x
npm --version
```

### 2. Install dependencies
```bash
cd /Users/mewing/BaseCommand
npm install
```

### 3. Add your API key
```bash
cp .env.example .env.local
```
Open `.env.local` and replace `sk-ant-your-key-here` with your actual key from https://console.anthropic.com.

### 4. Run
```bash
npm run dev
```
This starts two things at once:
- **API server** on `http://localhost:3001` — holds your API key, never exposed to the browser
- **Vite frontend** on `http://localhost:5173` — open this in your browser

Your API key is loaded from `.env.local` by the server. The browser never sees it.

---

## Deploying to basecommand.ai (Cloud)

### 1. Push to a private GitHub repo
```bash
git init
git add -A
git commit -m "Initial build"
# Create private repo on github.com, then:
git remote add origin git@github.com:YOUR_USERNAME/basecommand.git
git push -u origin main
```

### 2. Deploy to Vercel
```bash
npm install -g vercel
vercel
```
- Framework: Vite
- Root directory: `.`

### 3. Add your API key to Vercel
In the Vercel dashboard: **Settings → Environment Variables**
- Key: `ANTHROPIC_API_KEY`
- Value: `sk-ant-...`
- Scope: Production + Preview

### 4. Redeploy
```bash
vercel --prod
```

### 5. Connect basecommand.ai
In Vercel: **Settings → Domains → Add `basecommand.ai`**
Follow the DNS instructions for Namecheap.

---

## Security Notes
- `.env.local` is gitignored — your API key will never be committed
- All AI calls are proxied through the server — the browser never touches the Anthropic API
- The `api/claude.js` file is the same code used locally and on Vercel — zero changes needed to deploy

---

## Project Structure
```
BaseCommand/
  src/
    App.jsx          # Full application (migrated from Claude artifact)
    main.jsx         # React entry point
  api/
    claude.js        # Vercel serverless function — API proxy (production)
  scripts/
    dev-api.js       # Local dev API server (development)
  .env.example       # Copy to .env.local and add your key
  .env.local         # Your actual key — gitignored, never committed
  .gitignore
  index.html
  package.json
  vite.config.js
  vercel.json        # Security headers for production
```
