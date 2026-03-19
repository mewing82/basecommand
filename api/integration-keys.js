/**
 * Integration API Key management — generate, list, revoke keys for external API access.
 * Used by agent.ai workflow agents and other integrations to authenticate with BaseCommand.
 *
 * POST   /api/integration-keys          — Generate a new key (returns full key ONCE)
 * GET    /api/integration-keys?userId=   — List keys (metadata only)
 * DELETE /api/integration-keys?userId=&keyId= — Revoke a key
 *
 * Auth: Supabase JWT in Authorization header (user must be authenticated).
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

export default async function handler(req, res) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: "Vercel KV not configured" });
  }

  // ─── Authenticate user via Supabase JWT ──────────────────────────────────
  const userId = await resolveUser(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized — valid session required" });
  }

  // Resolve org for org-scoped KV keys
  const orgId = await resolveOrgId(req, userId);
  const scopeKey = orgId || userId; // org-scoped if available, else user-scoped

  // ─── POST: Generate a new integration key ────────────────────────────────
  if (req.method === "POST") {
    const { label } = req.body || {};
    const keyId = `intkey_${Date.now()}_${randomBytes(4).toString("hex")}`;
    const rawKey = `bc_live_${randomBytes(24).toString("hex")}`;
    const keyHash = hashKey(rawKey);

    const metadata = {
      keyId,
      userId,
      orgId: orgId || null,
      label: label || "Integration Key",
      lastFour: rawKey.slice(-4),
      createdAt: new Date().toISOString(),
    };

    // Store key metadata (indexed by org or user)
    await kvSet(kvUrl, kvToken, `bc2-intkey:${scopeKey}:${keyId}`, metadata);

    // Store reverse lookup (hashed key → userId + keyId + orgId) for auth
    await kvSet(kvUrl, kvToken, `bc2-intkey-lookup:${keyHash}`, { userId, keyId, orgId: orgId || null });

    // Update key index
    const indexKey = `bc2-intkey-index:${scopeKey}`;
    const existing = (await kvGet(kvUrl, kvToken, indexKey)) || [];
    existing.push({ keyId, label: metadata.label, lastFour: metadata.lastFour, createdAt: metadata.createdAt });
    await kvSet(kvUrl, kvToken, indexKey, existing);

    // Return full key — this is the ONLY time it's shown
    return res.status(200).json({ keyId, key: rawKey, label: metadata.label, lastFour: metadata.lastFour });
  }

  // ─── GET: List keys (metadata only) ──────────────────────────────────────
  if (req.method === "GET") {
    const indexKey = `bc2-intkey-index:${scopeKey}`;
    const keys = (await kvGet(kvUrl, kvToken, indexKey)) || [];
    return res.status(200).json({ keys });
  }

  // ─── DELETE: Revoke a key ────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const { keyId } = req.query;
    if (!keyId) return res.status(400).json({ error: "Missing keyId" });

    // Remove key metadata
    await kvDel(kvUrl, kvToken, `bc2-intkey:${scopeKey}:${keyId}`);

    // Update index
    const indexKey = `bc2-intkey-index:${scopeKey}`;
    const existing = (await kvGet(kvUrl, kvToken, indexKey)) || [];
    const updated = existing.filter(k => k.keyId !== keyId);
    await kvSet(kvUrl, kvToken, indexKey, updated);

    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashKey(rawKey) {
  return createHash("sha256").update(rawKey).digest("hex");
}

async function resolveUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

async function resolveOrgId(req, userId) {
  const orgIdHeader = req.headers["x-org-id"];
  if (orgIdHeader) return orgIdHeader;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: mem } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .single();
    return mem?.org_id || null;
  } catch { return null; }
}

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
