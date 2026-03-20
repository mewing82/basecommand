/**
 * Agent execution log endpoint.
 *
 * GET  /api/executions — Paginated, filterable execution log (JWT auth)
 * POST /api/executions — Log an execution from external agent (dual auth: JWT or integration key)
 *
 * Query params (GET): status, agent_id, account_id, limit, offset
 */
import { resolveOrgMember, resolveIntegrationKey, getSupabaseAdmin } from "./lib/auth.js";

export default async function handler(req, res) {
  // CORS for external callers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Org-Id");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") return handleGet(req, res);
  if (req.method === "POST") return handlePost(req, res);

  return res.status(405).json({ error: "Method not allowed" });
}

// ─── GET: list executions (JWT auth) ──────────────────────────────────────
async function handleGet(req, res) {
  const member = await resolveOrgMember(req);
  if (!member) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: "Database not configured" });
  }

  try {
    const { status, agent_id, account_id, limit: rawLimit, offset: rawOffset } = req.query;
    const limit = Math.min(parseInt(rawLimit) || 50, 100);
    const offset = parseInt(rawOffset) || 0;

    let query = supabase
      .from("agent_executions")
      .select("*")
      .order("created_at", { ascending: false });

    if (member.orgId) {
      query = query.eq("org_id", member.orgId);
    } else {
      query = query.eq("user_id", member.userId);
    }

    if (status && status !== "all") query = query.eq("status", status);
    if (agent_id) query = query.eq("agent_id", agent_id);
    if (account_id) query = query.eq("account_id", account_id);

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      executions: data,
      pagination: { limit, offset, count: data.length, hasMore: data.length === limit },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ─── POST: log execution (dual auth — JWT or integration key) ─────────────
async function handlePost(req, res) {
  // Try integration key first, then JWT
  let userId, orgId;
  const intKey = await resolveIntegrationKey(req);
  if (intKey) {
    userId = intKey.userId;
    orgId = intKey.orgId;
  } else {
    const member = await resolveOrgMember(req);
    if (!member) {
      return res.status(401).json({ error: "Unauthorized. Provide JWT or integration key." });
    }
    userId = member.userId;
    orgId = member.orgId;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: "Database not configured" });
  }

  const { agentId, actionType, accountId, inputSummary, outputSummary, status, metadata } = req.body || {};

  if (!agentId || !actionType) {
    return res.status(400).json({ error: "agentId and actionType are required" });
  }

  const now = new Date().toISOString();
  const id = `exec-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const row = {
    id,
    user_id: userId,
    org_id: orgId || null,
    agent_id: agentId,
    action_type: actionType,
    account_id: accountId || null,
    input_summary: inputSummary || null,
    output_summary: outputSummary || null,
    status: status || "completed",
    metadata: metadata || {},
    created_at: now,
  };

  const { error } = await supabase.from("agent_executions").insert(row);
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ success: true, executionId: id });
}
