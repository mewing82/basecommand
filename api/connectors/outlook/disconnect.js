/**
 * Disconnect Outlook — remove tokens from KV.
 * POST /api/connectors/outlook/disconnect  body: { userId }
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
    await kvDel(kvUrl, kvToken, `bc2-oauth:outlook:${userId}`);
    return res.status(200).json({ disconnected: true });
  } catch (err) {
    console.error("Outlook disconnect error:", err);
    return res.status(500).json({ error: "Failed to disconnect" });
  }
}

async function kvDel(kvUrl, kvToken, key) {
  await fetch(`${kvUrl}/del/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${kvToken}` },
  });
}
