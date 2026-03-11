/**
 * Disconnect Gmail — revoke token and remove from KV.
 * POST /api/connectors/gmail/disconnect  body: { userId }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: "KV not configured" });
  }

  try {
    // Retrieve token to revoke it
    const data = await kvGet(kvUrl, kvToken, `bc2-oauth:gmail:${userId}`);
    if (data?.access_token) {
      // Best-effort revoke with Google
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${data.access_token}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch {
        // Non-fatal — token may already be expired
      }
    }

    // Delete from KV
    await kvDel(kvUrl, kvToken, `bc2-oauth:gmail:${userId}`);

    return res.status(200).json({ disconnected: true });
  } catch (err) {
    console.error("Gmail disconnect error:", err);
    return res.status(500).json({ error: "Failed to disconnect" });
  }
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
