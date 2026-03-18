/**
 * External import API — accepts structured account data from agent.ai workflow agents
 * and other integrations. Creates accounts in the user's BaseCommand portfolio.
 *
 * POST /api/import/external
 * Headers: Authorization: Bearer bc_live_xxx
 * Body: { accounts: [{ name, arr?, renewalDate?, riskLevel?, contacts?, notes? }] }
 *
 * Auth: BaseCommand integration API key (generated in Settings > Integrations).
 * The key is hashed and looked up in Vercel KV to resolve the user.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const MAX_ACCOUNTS_PER_REQUEST = 50;

export default async function handler(req, res) {
  // CORS — allow agent.ai and other origins
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!kvUrl || !kvToken || !supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Server configuration incomplete" });
  }

  // ─── Authenticate via integration API key ────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer bc_live_")) {
    return res.status(401).json({ error: "Missing or invalid API key. Use: Authorization: Bearer bc_live_xxx" });
  }

  const rawKey = authHeader.slice(7);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const lookup = await kvGet(kvUrl, kvToken, `bc2-intkey-lookup:${keyHash}`);
  if (!lookup?.userId) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Verify the key still exists (not revoked)
  const keyMeta = await kvGet(kvUrl, kvToken, `bc2-intkey:${lookup.userId}:${lookup.keyId}`);
  if (!keyMeta) {
    return res.status(401).json({ error: "API key has been revoked" });
  }

  const userId = lookup.userId;

  // ─── Parse and validate request body ─────────────────────────────────────
  const { accounts } = req.body || {};

  if (!Array.isArray(accounts) || accounts.length === 0) {
    return res.status(400).json({ error: "Request body must include a non-empty 'accounts' array" });
  }

  if (accounts.length > MAX_ACCOUNTS_PER_REQUEST) {
    return res.status(400).json({ error: `Maximum ${MAX_ACCOUNTS_PER_REQUEST} accounts per request` });
  }

  // Validate each account has at least a name
  const invalid = accounts.filter((a, i) => !a?.name?.trim());
  if (invalid.length > 0) {
    return res.status(400).json({ error: "Every account must have a 'name' field" });
  }

  // ─── Create Supabase client ──────────────────────────────────────────────
  const supabase = createClient(supabaseUrl, serviceKey);

  // ─── Fetch existing accounts for dedup ───────────────────────────────────
  const { data: existing } = await supabase
    .from("renewal_accounts")
    .select("id, name")
    .eq("user_id", userId);

  const existingNames = new Set((existing || []).map(a => a.name.toLowerCase().trim()));

  // ─── Process accounts ────────────────────────────────────────────────────
  const created = [];
  const skipped = [];
  const now = new Date().toISOString();

  for (const acct of accounts) {
    const name = acct.name.trim();

    // Skip duplicates (case-insensitive exact match)
    if (existingNames.has(name.toLowerCase())) {
      skipped.push({ name, reason: "duplicate" });
      continue;
    }

    const id = `acct-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const row = {
      id,
      user_id: userId,
      name,
      arr: parseFloat(acct.arr) || 0,
      renewal_date: acct.renewalDate || null,
      risk_level: acct.riskLevel || "medium",
      contacts: Array.isArray(acct.contacts) ? acct.contacts : [],
      summary: acct.notes || acct.summary || "",
      tags: Array.isArray(acct.tags) ? acct.tags : ["agent.ai-import"],
      last_activity: now,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase.from("renewal_accounts").insert(row);

    if (error) {
      skipped.push({ name, reason: error.message });
    } else {
      created.push({ id, name });
      existingNames.add(name.toLowerCase()); // prevent intra-batch dupes

      // Add context item for provenance tracking
      await supabase.from("context_items").insert({
        id: `ctx-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: userId,
        account_id: id,
        type: "text",
        label: "Import: agent.ai",
        source: "agent.ai",
        content: JSON.stringify(acct),
        metadata: { source: "agent.ai-workflow", importedAt: now },
        uploaded_at: now,
      });
    }
  }

  return res.status(200).json({
    success: true,
    created: created.length,
    skipped: skipped.length,
    accounts: created,
    skippedDetails: skipped.length > 0 ? skipped : undefined,
  });
}

// ─── KV helper ──────────────────────────────────────────────────────────────
async function kvGet(kvUrl, kvToken, key) {
  const r = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${kvToken}` },
  });
  if (!r.ok) return null;
  const json = await r.json();
  return json.result ? (typeof json.result === "string" ? JSON.parse(json.result) : json.result) : null;
}
