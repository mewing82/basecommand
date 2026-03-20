/**
 * Shared auth helpers for API endpoints.
 * Extracts user identity and org membership from Supabase JWT or integration API key.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

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

/**
 * Resolve identity from an integration API key (Bearer bc_live_xxx).
 * Looks up the key hash in Vercel KV, resolves user + org.
 * @returns {{ userId: string, orgId: string|null, keyId: string }} or null
 */
export async function resolveIntegrationKey(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer bc_live_")) return null;

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return null;

  const rawKey = authHeader.slice(7);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const lookup = await kvGet(kvUrl, kvToken, `bc2-intkey-lookup:${keyHash}`);
  if (!lookup?.userId) return null;

  // Verify the key still exists (not revoked)
  const keyMeta = await kvGet(kvUrl, kvToken, `bc2-intkey:${lookup.userId}:${lookup.keyId}`);
  if (!keyMeta) return null;

  // Resolve org_id: check if stored on the key, otherwise look up user's first org
  let orgId = lookup.orgId || keyMeta.orgId || null;
  if (!orgId) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: member } = await supabase
        .from("org_members")
        .select("org_id")
        .eq("user_id", lookup.userId)
        .order("joined_at", { ascending: true })
        .limit(1)
        .single();
      orgId = member?.org_id || null;
    }
  }

  return { userId: lookup.userId, orgId, keyId: lookup.keyId };
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
