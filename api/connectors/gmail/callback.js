/**
 * Gmail OAuth2 — Step 2: Exchange authorization code for tokens.
 * GET /api/connectors/gmail/callback?code=...&state=...
 *
 * Stores tokens in Vercel KV, then redirects back to the app.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    return redirectToApp(res, `error=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !state) {
    return res.status(400).json({ error: "Missing code or state" });
  }

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

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Google OAuth credentials not configured" });
  }

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: "Vercel KV not configured" });
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/connectors/gmail/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Token exchange failed:", tokens);
      return redirectToApp(res, "error=token_exchange_failed");
    }

    // Fetch user email for display
    let email = "";
    try {
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileRes.json();
      email = profile.email || "";
    } catch {
      // Non-fatal — we just won't show the email in the UI
    }

    // Store in Vercel KV
    const kvPayload = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
      email,
      connected_at: new Date().toISOString(),
    };

    await kvSet(kvUrl, kvToken, `bc2-oauth:gmail:${userId}`, kvPayload);

    return redirectToApp(res, "gmail=connected");
  } catch (err) {
    console.error("Gmail callback error:", err);
    return redirectToApp(res, "error=callback_failed");
  }
}

function redirectToApp(res, query) {
  const appUrl = process.env.APP_URL || "https://basecommand.ai";
  res.redirect(302, `${appUrl}/#settings?${query}`);
}

async function kvSet(kvUrl, kvToken, key, value) {
  const res = await fetch(`${kvUrl}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kvToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`KV SET failed: ${err}`);
  }
}
