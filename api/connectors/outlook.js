/**
 * Consolidated Outlook connector — routes by ?action= parameter.
 *
 * GET  /api/connectors/outlook?action=auth&userId=...      — Start OAuth flow
 * GET  /api/connectors/outlook?action=callback&code=...    — OAuth callback
 * POST /api/connectors/outlook?action=disconnect           — Disconnect
 * GET  /api/connectors/outlook?action=status&userId=...    — Connection status
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

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: "MICROSOFT_CLIENT_ID not configured" });

  const appUrl = process.env.APP_URL || "https://basecommand.ai";
  const redirectUri = `${appUrl}/api/connectors/outlook?action=callback`;
  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email Mail.Read offline_access",
    response_mode: "query",
    state,
  });

  res.redirect(302, `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`);
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

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  const appUrl = process.env.APP_URL || "https://basecommand.ai";

  if (!clientId || !clientSecret) return res.status(500).json({ error: "Microsoft OAuth credentials not configured" });
  if (!kvUrl || !kvToken) return res.status(500).json({ error: "Vercel KV not configured" });

  try {
    const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/connectors/outlook?action=callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Microsoft token exchange failed:", tokens);
      return redirectToApp(res, "error=token_exchange_failed");
    }

    let email = "";
    try {
      const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileRes.json();
      email = profile.mail || profile.userPrincipalName || "";
    } catch { /* Non-fatal */ }

    await kvSet(kvUrl, kvToken, `bc2-oauth:outlook:${userId}`, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
      email,
      connected_at: new Date().toISOString(),
    });

    return redirectToApp(res, "outlook=connected");
  } catch (err) {
    console.error("Outlook callback error:", err);
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
    await kvDel(kvUrl, kvToken, `bc2-oauth:outlook:${userId}`);
    return res.status(200).json({ disconnected: true });
  } catch (err) {
    console.error("Outlook disconnect error:", err);
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
    const data = await kvGet(kvUrl, kvToken, `bc2-oauth:outlook:${userId}`);
    if (!data || !data.access_token) return res.status(200).json({ connected: false });
    return res.status(200).json({ connected: true, email: data.email || "", connectedAt: data.connected_at || "" });
  } catch (err) {
    console.error("Outlook status error:", err);
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
