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

if (!API_KEY) {
  console.warn("\n[API] No ANTHROPIC_API_KEY found — AI calls will return a placeholder.");
  console.warn("[API] Add your key to .env.local when ready.\n");
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

  if (req.method !== "POST" || !req.url.startsWith("/api/claude")) {
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

  if (!API_KEY) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      content: [{ text: "[ No API key configured. Add ANTHROPIC_API_KEY to .env.local and restart the server. ]" }],
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
        model: body.model || "claude-sonnet-4-20250514",
        max_tokens: body.max_tokens || 4000,
        ...(body.system ? { system: body.system } : {}),
        messages: body.messages,
      }),
    });

    const data = await upstream.json();
    res.writeHead(upstream.status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error("[API] Upstream error:", err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

server.listen(PORT, () => {
  console.log(`[API] Dev proxy running on http://localhost:${PORT}`);
  console.log(`[API] API key loaded: sk-ant-...${API_KEY.slice(-6)}`);
});
