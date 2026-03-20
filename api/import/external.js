/**
 * External import API — accepts structured account data from agent.ai workflow agents
 * and other integrations. Creates/updates accounts in the user's BaseCommand portfolio.
 *
 * POST   /api/import/external              — Create accounts
 * PATCH  /api/import/external              — Update existing account(s)
 * GET    /api/import/external?action=context&accountId=xxx — Account context
 * GET    /api/import/external?action=portfolio              — Portfolio summary
 *
 * Auth: BaseCommand integration API key (Bearer bc_live_xxx)
 */
import { getSupabaseAdmin, resolveIntegrationKey } from "../lib/auth.js";

const MAX_ACCOUNTS_PER_REQUEST = 50;

export default async function handler(req, res) {
  // CORS — allow agent.ai and other origins
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // ─── Authenticate via integration API key ────────────────────────────────
  const identity = await resolveIntegrationKey(req);
  if (!identity) {
    return res.status(401).json({ error: "Missing or invalid API key. Use: Authorization: Bearer bc_live_xxx" });
  }

  const { userId, orgId } = identity;
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: "Database not configured" });
  }

  // ─── Route by method ───────────────────────────────────────────────────
  if (req.method === "GET") return handleGet(req, res, supabase, userId, orgId);
  if (req.method === "POST") return handlePost(req, res, supabase, userId, orgId);
  if (req.method === "PATCH") return handlePatch(req, res, supabase, userId, orgId);

  return res.status(405).json({ error: "Method not allowed" });
}

// ─── GET: context or portfolio ─────────────────────────────────────────────
async function handleGet(req, res, supabase, userId, orgId) {
  const action = req.query?.action;

  if (action === "context") {
    const accountId = req.query?.accountId;
    if (!accountId) {
      return res.status(400).json({ error: "accountId query parameter required" });
    }

    // Fetch account
    let q = supabase.from("renewal_accounts").select("*").eq("id", accountId);
    if (orgId) q = q.eq("org_id", orgId);
    else q = q.eq("user_id", userId);
    const { data: account, error: accErr } = await q.single();
    if (accErr || !account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Fetch context items
    const { data: contextItems } = await supabase
      .from("context_items")
      .select("*")
      .eq("account_id", accountId)
      .order("uploaded_at", { ascending: false })
      .limit(20);

    // Fetch recent tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(10);

    return res.status(200).json({
      account,
      contextItems: contextItems || [],
      tasks: tasks || [],
    });
  }

  if (action === "portfolio") {
    let q = supabase.from("renewal_accounts").select("id, name, arr, renewal_date, risk_level, tags, last_activity");
    if (orgId) q = q.eq("org_id", orgId);
    else q = q.eq("user_id", userId);
    const { data: accounts, error } = await q.order("renewal_date", { ascending: true });
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const all = accounts || [];
    const totalArr = all.reduce((sum, a) => sum + (a.arr || 0), 0);
    const byRisk = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const a of all) byRisk[a.risk_level || "medium"]++;

    const now = new Date();
    const next5 = all
      .filter(a => a.renewal_date && new Date(a.renewal_date) > now)
      .slice(0, 5)
      .map(a => ({ id: a.id, name: a.name, arr: a.arr, renewalDate: a.renewal_date, riskLevel: a.risk_level }));

    return res.status(200).json({
      count: all.length,
      totalArr,
      byRisk,
      nextRenewals: next5,
    });
  }

  return res.status(400).json({ error: "Invalid action. Use ?action=context&accountId=xxx or ?action=portfolio" });
}

// ─── POST: create accounts ────────────────────────────────────────────────
async function handlePost(req, res, supabase, userId, orgId) {
  const { accounts } = req.body || {};

  if (!Array.isArray(accounts) || accounts.length === 0) {
    return res.status(400).json({ error: "Request body must include a non-empty 'accounts' array" });
  }

  if (accounts.length > MAX_ACCOUNTS_PER_REQUEST) {
    return res.status(400).json({ error: `Maximum ${MAX_ACCOUNTS_PER_REQUEST} accounts per request` });
  }

  const invalid = accounts.filter((a) => !a?.name?.trim());
  if (invalid.length > 0) {
    return res.status(400).json({ error: "Every account must have a 'name' field" });
  }

  // Fetch existing accounts for dedup
  let existQ = supabase.from("renewal_accounts").select("id, name");
  if (orgId) existQ = existQ.eq("org_id", orgId);
  else existQ = existQ.eq("user_id", userId);
  const { data: existing } = await existQ;

  const existingNames = new Set((existing || []).map(a => a.name.toLowerCase().trim()));

  const created = [];
  const skipped = [];
  const now = new Date().toISOString();

  for (const acct of accounts) {
    const name = acct.name.trim();

    if (existingNames.has(name.toLowerCase())) {
      skipped.push({ name, reason: "duplicate" });
      continue;
    }

    const id = `acct-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const row = {
      id,
      user_id: userId,
      org_id: orgId || null,
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
      existingNames.add(name.toLowerCase());

      await supabase.from("context_items").insert({
        id: `ctx-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: userId,
        org_id: orgId || null,
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

// ─── PATCH: update existing account(s) ─────────────────────────────────────
async function handlePatch(req, res, supabase, userId, orgId) {
  const { accountId, updates } = req.body || {};

  if (!accountId || !updates || typeof updates !== "object") {
    return res.status(400).json({ error: "Request body must include 'accountId' and 'updates' object" });
  }

  // Verify account belongs to user/org
  let q = supabase.from("renewal_accounts").select("id").eq("id", accountId);
  if (orgId) q = q.eq("org_id", orgId);
  else q = q.eq("user_id", userId);
  const { data: account } = await q.single();
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  // Whitelist of updatable fields
  const allowed = ["arr", "renewal_date", "risk_level", "contacts", "summary", "tags", "notes"];
  const patch = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      // Map camelCase to snake_case
      const dbKey = key === "renewalDate" ? "renewal_date" : key === "riskLevel" ? "risk_level" : key;
      patch[dbKey] = updates[key];
    }
  }
  // Also accept camelCase versions
  if (updates.renewalDate !== undefined) patch.renewal_date = updates.renewalDate;
  if (updates.riskLevel !== undefined) patch.risk_level = updates.riskLevel;

  const { error } = await supabase.from("renewal_accounts").update(patch).eq("id", accountId);
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, accountId });
}
