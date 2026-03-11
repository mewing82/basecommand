/**
 * Outlook connector status check.
 * GET /api/connectors/outlook/status?userId=<uuid>
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(200).json({ connected: false, reason: "kv_not_configured" });
  }

  try {
    const data = await kvGet(kvUrl, kvToken, `bc2-oauth:outlook:${userId}`);
    if (!data || !data.access_token) {
      return res.status(200).json({ connected: false });
    }

    return res.status(200).json({
      connected: true,
      email: data.email || "",
      connectedAt: data.connected_at || "",
    });
  } catch (err) {
    console.error("Outlook status error:", err);
    return res.status(200).json({ connected: false, reason: "error" });
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
