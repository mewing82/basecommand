/**
 * Gmail OAuth2 — Step 1: Redirect user to Google consent screen.
 * GET /api/connectors/gmail/auth?userId=<uuid>
 */
export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId parameter" });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "GOOGLE_CLIENT_ID not configured" });
  }

  const appUrl = process.env.APP_URL || "https://basecommand.ai";
  const redirectUri = `${appUrl}/api/connectors/gmail/callback`;

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
