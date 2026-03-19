/**
 * Organization API — manage org info and settings.
 *
 * GET  /api/org           — Get org details + members
 * POST /api/org?action=update — Update org name/settings
 */
import { resolveOrgMember, getSupabaseAdmin } from "./lib/auth.js";

export default async function handler(req, res) {
  const member = await resolveOrgMember(req);
  if (!member || !member.orgId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const action = req.query.action;

  if (req.method === "GET") return handleInfo(req, res, member);
  if (req.method === "POST" && action === "update") return handleUpdate(req, res, member);

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

async function handleInfo(req, res, member) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", member.orgId)
    .single();

  if (!org) return res.status(404).json({ error: "Organization not found" });

  const { data: members } = await supabase
    .from("org_members")
    .select("id, user_id, role, joined_at")
    .eq("org_id", member.orgId);

  // Fetch user emails for members
  const memberList = [];
  for (const m of (members || [])) {
    const { data: { user } } = await supabase.auth.admin.getUserById(m.user_id);
    memberList.push({
      id: m.id,
      userId: m.user_id,
      email: user?.email,
      name: user?.user_metadata?.name || user?.user_metadata?.full_name,
      role: m.role,
      joinedAt: m.joined_at,
    });
  }

  return res.status(200).json({
    id: org.id,
    name: org.name,
    slug: org.slug,
    settings: org.settings,
    createdAt: org.created_at,
    members: memberList,
    currentUserRole: member.role,
  });
}

async function handleUpdate(req, res, member) {
  // Only owner/admin can update org
  if (member.role !== "owner" && member.role !== "admin") {
    return res.status(403).json({ error: "Only owners and admins can update the organization" });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const { name, settings } = req.body || {};
  const updates = { updated_at: new Date().toISOString() };

  if (name !== undefined) updates.name = name;
  if (settings !== undefined) updates.settings = settings;

  const { error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", member.orgId);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ updated: true });
}
