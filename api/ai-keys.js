/**
 * AI API Key management — CRUD for keys stored in Vercel KV.
 * Keys never return to the client after initial submission.
 *
 * POST   /api/ai-keys          — Add a new key (validates, stores, returns keyId + lastFour)
 * GET    /api/ai-keys?userId=   — List keys (metadata only, no secrets)
 * DELETE /api/ai-keys?userId=&keyId= — Remove a key
 */
export default async function handler(req, res) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: "Vercel KV not configured" });
  }

  // ─── POST: Add a new API key ───────────────────────────────────────────────
  if (req.method === "POST") {
    const { userId, provider, apiKey, label } = req.body || {};
    if (!userId || !provider || !apiKey) {
      return res.status(400).json({ error: "Missing userId, provider, or apiKey" });
    }
    if (!["anthropic", "openai"].includes(provider)) {
      return res.status(400).json({ error: "Provider must be 'anthropic' or 'openai'" });
    }

    // Validate the key with a lightweight API call
    try {
      const valid = await validateKey(provider, apiKey);
      if (!valid.ok) {
        return res.status(400).json({ error: `Invalid API key: ${valid.reason}` });
      }
    } catch (err) {
      return res.status(400).json({ error: `Key validation failed: ${err.message}` });
    }

    const keyId = `aikey_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const lastFour = apiKey.slice(-4);

    const kvPayload = {
      provider,
      apiKey,
      label: label || `${provider} key`,
      lastFour,
      createdAt: new Date().toISOString(),
    };

    await kvSet(kvUrl, kvToken, `bc2-aikey:${userId}:${keyId}`, kvPayload);

    // Also update the key index for this user
    const indexKey = `bc2-aikey-index:${userId}`;
    const existing = (await kvGet(kvUrl, kvToken, indexKey)) || [];
    existing.push({ keyId, provider, label: kvPayload.label, lastFour, createdAt: kvPayload.createdAt });
    await kvSet(kvUrl, kvToken, indexKey, existing);

    return res.status(200).json({ keyId, provider, label: kvPayload.label, lastFour });
  }

  // ─── GET: List keys (metadata only) ────────────────────────────────────────
  if (req.method === "GET") {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const indexKey = `bc2-aikey-index:${userId}`;
    const keys = (await kvGet(kvUrl, kvToken, indexKey)) || [];
    return res.status(200).json({ keys });
  }

  // ─── DELETE: Remove a key ──────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const { userId, keyId } = req.query;
    if (!userId || !keyId) return res.status(400).json({ error: "Missing userId or keyId" });

    // Remove from KV
    await kvDel(kvUrl, kvToken, `bc2-aikey:${userId}:${keyId}`);

    // Update index
    const indexKey = `bc2-aikey-index:${userId}`;
    const existing = (await kvGet(kvUrl, kvToken, indexKey)) || [];
    const updated = existing.filter(k => k.keyId !== keyId);
    await kvSet(kvUrl, kvToken, indexKey, updated);

    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ─── Key validation ──────────────────────────────────────────────────────────
async function validateKey(provider, apiKey) {
  try {
    if (provider === "anthropic") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      if (r.status === 401) return { ok: false, reason: "Invalid or expired key" };
      if (r.status === 403) return { ok: false, reason: "Key lacks required permissions" };
      return { ok: true };
    }

    if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (r.status === 401) return { ok: false, reason: "Invalid or expired key" };
      return { ok: true };
    }

    return { ok: false, reason: "Unknown provider" };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

// ─── KV helpers ──────────────────────────────────────────────────────────────
async function kvGet(kvUrl, kvToken, key) {
  const r = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${kvToken}` },
  });
  if (!r.ok) return null;
  const json = await r.json();
  return json.result ? (typeof json.result === "string" ? JSON.parse(json.result) : json.result) : null;
}

async function kvSet(kvUrl, kvToken, key, value) {
  await fetch(`${kvUrl}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${kvToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

async function kvDel(kvUrl, kvToken, key) {
  await fetch(`${kvUrl}/del/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${kvToken}` },
  });
}
