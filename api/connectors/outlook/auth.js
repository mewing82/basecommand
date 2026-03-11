/**
 * Outlook OAuth2 — Step 1: Redirect user to Microsoft consent screen.
 * GET /api/connectors/outlook/auth?userId=<uuid>
 */
export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId parameter" });
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "MICROSOFT_CLIENT_ID not configured" });
  }

  const appUrl = process.env.APP_URL || "https://basecommand.ai";
  const redirectUri = `${appUrl}/api/connectors/outlook/callback`;

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
