/**
 * Shared auth helpers for API endpoints.
 * Extracts user identity and org membership from Supabase JWT.
 */
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Resolve authenticated user from JWT.
 * @returns {{ userId: string }} or null
 */
export async function resolveUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { userId: user.id };
  } catch {
    return null;
  }
}

/**
 * Resolve authenticated user + their org membership.
 * Reads X-Org-Id header; falls back to user's first org (Phase 1 default).
 * @returns {{ userId: string, orgId: string, role: string }} or null
 */
export async function resolveOrgMember(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const requestedOrgId = req.headers["x-org-id"];

    if (requestedOrgId) {
      // Verify user is a member of the requested org
      const { data: member } = await supabase
        .from("org_members")
        .select("org_id, role")
        .eq("user_id", user.id)
        .eq("org_id", requestedOrgId)
        .single();
      if (!member) return null;
      return { userId: user.id, orgId: member.org_id, role: member.role };
    }

    // Fallback: user's first org (Phase 1 — single org per user)
    const { data: member } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1)
      .single();

    if (!member) return { userId: user.id, orgId: null, role: null };
    return { userId: user.id, orgId: member.org_id, role: member.role };
  } catch {
    return null;
  }
}
