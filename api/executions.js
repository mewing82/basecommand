/**
 * GET /api/executions — Paginated, filterable execution log endpoint.
 * Query params: status, agent_id, account_id, limit, offset
 */
import { resolveOrgMember, getSupabaseAdmin } from "./lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
