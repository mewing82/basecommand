/**
 * Consolidated Gmail connector — routes by ?action= parameter.
 *
 * GET  /api/connectors/gmail?action=auth&userId=...      — Start OAuth flow
 * GET  /api/connectors/gmail?action=callback&code=...    — OAuth callback
 * POST /api/connectors/gmail?action=disconnect           — Disconnect
 * GET  /api/connectors/gmail?action=status&userId=...    — Connection status
 */
export default async function handler(req, res) {
  const action = req.query.action;

  if (action === "auth" && req.method === "GET") return handleAuth(req, res);
  if (action === "callback" && req.method === "GET") return handleCallback(req, res);
  if (action === "disconnect" && req.method === "POST") return handleDisconnect(req, res);
  if (action === "status" && req.method === "GET") return handleStatus(req, res);

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

function handleAuth(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId parameter" });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: "GOOGLE_CLIENT_ID not configured" });

  const appUrl = process.env.APP_URL || "https://basecommand.ai";
  const redirectUri = `${appUrl}/api/connectors/gmail?action=callback`;
  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

// ─── Callback ────────────────────────────────────────────────────────────────

async function handleCallback(req, res) {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) return redirectToApp(res, `error=${encodeURIComponent(oauthError)}`);
  if (!code || !state) return res.status(400).json({ error: "Missing code or state" });

  let userId;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
    userId = parsed.userId;
  } catch {
    return res.status(400).json({ error: "Invalid state parameter" });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  const appUrl = process.env.APP_URL || "https://basecommand.ai";

  if (!clientId || !clientSecret) return res.status(500).json({ error: "Google OAuth credentials not configured" });
  if (!kvUrl || !kvToken) return res.status(500).json({ error: "Vercel KV not configured" });

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/connectors/gmail?action=callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Token exchange failed:", tokens);
      return redirectToApp(res, "error=token_exchange_failed");
    }

    let email = "";
    try {
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileRes.json();
      email = profile.email || "";
    } catch { /* Non-fatal */ }

    await kvSet(kvUrl, kvToken, `bc2-oauth:gmail:${userId}`, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
      email,
      connected_at: new Date().toISOString(),
    });

    return redirectToApp(res, "gmail=connected");
  } catch (err) {
    console.error("Gmail callback error:", err);
    return redirectToApp(res, "error=callback_failed");
  }
}

// ─── Disconnect ──────────────────────────────────────────────────────────────

async function handleDisconnect(req, res) {
  const body = await readJsonBody(req);
  const { userId } = body || {};
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return res.status(500).json({ error: "KV not configured" });

  try {
    const data = await kvGet(kvUrl, kvToken, `bc2-oauth:gmail:${userId}`);
    if (data?.access_token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${data.access_token}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch { /* Non-fatal */ }
    }
    await kvDel(kvUrl, kvToken, `bc2-oauth:gmail:${userId}`);
    return res.status(200).json({ disconnected: true });
  } catch (err) {
    console.error("Gmail disconnect error:", err);
    return res.status(500).json({ error: "Failed to disconnect" });
  }
}

// ─── Status ──────────────────────────────────────────────────────────────────

async function handleStatus(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return res.status(200).json({ connected: false, reason: "kv_not_configured" });

  try {
    const data = await kvGet(kvUrl, kvToken, `bc2-oauth:gmail:${userId}`);
    if (!data || !data.access_token) return res.status(200).json({ connected: false });
    return res.status(200).json({ connected: true, email: data.email || "", connectedAt: data.connected_at || "" });
  } catch (err) {
    console.error("Gmail status error:", err);
    return res.status(200).json({ connected: false, reason: "error" });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function redirectToApp(res, query) {
  const appUrl = process.env.APP_URL || "https://basecommand.ai";
  res.redirect(302, `${appUrl}/app/import?${query}`);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try { return JSON.parse(Buffer.concat(chunks).toString()); }
  catch { return null; }
}

async function kvSet(kvUrl, kvToken, key, value) {
  const r = await fetch(`${kvUrl}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${kvToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!r.ok) throw new Error(`KV SET failed: ${await r.text()}`);
}

async function kvGet(kvUrl, kvToken, key) {
  const r = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${kvToken}` },
  });
  if (!r.ok) return null;
  const json = await r.json();
  return json.result ? (typeof json.result === "string" ? JSON.parse(json.result) : json.result) : null;
}

async function kvDel(kvUrl, kvToken, key) {
  await fetch(`${kvUrl}/del/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${kvToken}` },
  });
}
