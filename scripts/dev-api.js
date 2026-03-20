/**
 * Local development API server.
 * Runs on port 3001 and proxies requests to Anthropic Claude.
 * Vite forwards /api/* here during `npm run dev`.
 *
 * Reads ANTHROPIC_API_KEY from .env.local — never exposed to the browser.
 */
import { createServer } from "http";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (lightweight, no extra deps beyond dotenv)
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env.local");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local not found — env vars may be set by the shell
  }
}

loadEnv();

const PORT = 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.warn("\n[API] No ANTHROPIC_API_KEY found — Anthropic AI calls will return a placeholder.");
  console.warn("[API] Add your key to .env.local when ready.\n");
}
if (!OPENAI_KEY) {
  console.warn("[API] No OPENAI_API_KEY found — OpenAI calls will not work in dev.\n");
}

const server = createServer(async (req, res) => {
  // CORS for Vite dev server
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Connector status endpoints — return "not connected" for local dev
  if (req.url.includes("/api/connectors/") && req.url.includes("action=status")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ connected: false, reason: "local_dev" }));
    return;
  }

  // Connector endpoints (auth, callback, disconnect, scan) — not available in local dev
  if (req.url.startsWith("/api/connectors/")) {
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Connectors require deployment to Vercel. Use `vercel dev` for full connector testing." }));
    return;
  }

  // Stripe endpoints — not available in local dev
  if (req.url.startsWith("/api/stripe")) {
    if (req.url.includes("action=status")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ tier: "pro_trial", status: "trialing", trialDaysLeft: 14, note: "Local dev — simulated trial" }));
      return;
    }
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Stripe requires deployment to Vercel. Use `vercel dev` for full billing testing." }));
    return;
  }

  // Admin API — not available in local dev
  if (req.url.startsWith("/api/admin")) {
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Admin requires deployment to Vercel." }));
    return;
  }

  // Integration keys — return empty list for local dev (keys live in KV)
  if (req.url.startsWith("/api/integration-keys")) {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ keys: [], note: "Integration keys require Vercel KV. Use `vercel dev` for full testing." }));
      return;
    }
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Integration key management requires deployment to Vercel." }));
    return;
  }

  // External import — not available in local dev (requires KV + Supabase service role)
  if (req.url.startsWith("/api/import/external")) {
    if (req.method === "GET" && req.url.includes("action=portfolio")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ count: 0, totalArr: 0, byRisk: {}, nextRenewals: [], note: "Local dev stub" }));
      return;
    }
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "External import requires deployment to Vercel. Use `vercel dev` for full testing." }));
    return;
  }

  // Executions — stub for local dev
  if (req.url.startsWith("/api/executions")) {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ executions: [], pagination: { limit: 50, offset: 0, count: 0, hasMore: false }, note: "Local dev stub" }));
      return;
    }
    if (req.method === "POST") {
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, executionId: "exec-dev-stub", note: "Local dev stub" }));
      return;
    }
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  // AI key management — return empty list for local dev (keys live in KV)
  if (req.url.startsWith("/api/ai-keys")) {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ keys: [], note: "Key management requires Vercel KV. Use env vars for local dev." }));
      return;
    }
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Key management requires deployment to Vercel." }));
    return;
  }

  // Accept both /api/ai and /api/claude
  if (req.method !== "POST" || (!req.url.startsWith("/api/claude") && !req.url.startsWith("/api/ai"))) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  // Read request body
  let rawBody = "";
  for await (const chunk of req) rawBody += chunk;

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Invalid JSON" }));
    return;
  }

  if (!body?.messages) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Missing messages" }));
    return;
  }

  const provider = body.provider || "anthropic";
  const model = body.model || "claude-sonnet-4-20250514";
  const maxTokens = body.max_tokens || 4000;

  // ─── Anthropic ─────────────────────────────────────────────────────────
  if (provider === "anthropic") {
    if (!API_KEY) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        content: [{ text: "[ No ANTHROPIC_API_KEY configured. Add it to .env.local and restart the server. ]" }],
      }));
      return;
    }

    try {
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          ...(body.system ? { system: body.system } : {}),
          messages: body.messages,
        }),
      });

      const data = await upstream.json();
      res.writeHead(upstream.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error("[API] Anthropic error:", err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return;
  }

  // ─── OpenAI ────────────────────────────────────────────────────────────
  if (provider === "openai") {
    if (!OPENAI_KEY) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No OPENAI_API_KEY configured. Add it to .env.local." }));
      return;
    }

    const openaiMessages = [];
    if (body.system) openaiMessages.push({ role: "system", content: body.system });
    for (const msg of body.messages) openaiMessages.push({ role: msg.role, content: msg.content });

    try {
      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({ model, max_tokens: maxTokens, messages: openaiMessages }),
      });

      const data = await upstream.json();
      if (!upstream.ok) {
        res.writeHead(upstream.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: data.error?.message || "OpenAI API error" }));
        return;
      }

      // Normalize to Anthropic response shape
      const choice = data.choices?.[0];
      const normalized = {
        content: [{ text: choice?.message?.content || "" }],
        stop_reason: choice?.finish_reason === "stop" ? "end_turn" : choice?.finish_reason === "length" ? "max_tokens" : "end_turn",
        model: data.model,
        usage: { input_tokens: data.usage?.prompt_tokens || 0, output_tokens: data.usage?.completion_tokens || 0 },
      };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(normalized));
    } catch (err) {
      console.error("[API] OpenAI error:", err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return;
  }

  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: `Unknown provider: ${provider}` }));
});

server.listen(PORT, () => {
  console.log(`[API] Dev proxy running on http://localhost:${PORT}`);
  console.log(`[API] Anthropic key: ${API_KEY ? "sk-ant-..." + API_KEY.slice(-6) : "NOT SET"}`);
  console.log(`[API] OpenAI key: ${OPENAI_KEY ? "sk-..." + OPENAI_KEY.slice(-4) : "NOT SET"}`);
});
