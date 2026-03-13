# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Base Command is an executive productivity app — a React SPA with serverless API functions deployed on Vercel. It provides AI-powered decision support with email connector integration (Gmail, Outlook) for extracting actionable items from inboxes.

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
- **Routing:** BrowserRouter with four top-level routes: Decisions (`/`), Tasks, Priorities, Renewals
- **Styling:** CSS with custom properties, dark theme default (`#0a0f1e` background), fonts: DM Sans + DM Mono
- **Placeholder directories:** `src/components/`, `src/pages/`, `src/store/`, `src/lib/` exist but are empty — build features here

### Backend (Vercel Serverless Functions)
- **`api/ai.js`** — Main AI proxy. Routes to Anthropic or OpenAI based on `provider` field. Normalizes all responses to Anthropic message format. Resolves API keys from Vercel KV first, falls back to env vars.
- **`api/claude.js`** — Simple Anthropic-only proxy (legacy/direct endpoint).
- **`api/ai-keys.js`** — CRUD for user API keys stored in Vercel KV. Keys are validated on submission and never returned to the client after storage.
- **`api/connectors/`** — Gmail and Outlook OAuth2 flows (auth, callback, disconnect, status) plus `scan.js` which fetches emails and extracts actionable items via Claude.
- **`scripts/dev-api.js`** — Standalone Node HTTP server (port 3001) that mocks the serverless functions for local dev. Reads `.env.local` manually. Connector and key-management endpoints return stubs.

### Key Patterns
- All AI responses are normalized to Anthropic's `{ content: [{ text }], stop_reason, model, usage }` shape, even for OpenAI calls
- Vercel KV is used for persistent storage (OAuth tokens, API keys) with a `bc2-` key prefix convention
- Email scanning deduplicates via hash of `id:subject:sender`; newsletters are filtered by `List-Unsubscribe` header

## Environment

Copy `.env.example` to `.env.local`. Required for local AI calls: `ANTHROPIC_API_KEY`. Optional: `OPENAI_API_KEY`. Vercel KV and OAuth credentials are only needed for connector features (use `vercel dev` for those).

## ESLint

Uses flat config (`eslint.config.js`). Notable rule: `no-unused-vars` ignores variables starting with uppercase or underscore (`varsIgnorePattern: '^[A-Z_]'`).
