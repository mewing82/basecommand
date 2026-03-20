/**
 * Organization API — manage org info and settings.
 *
 * GET  /api/org                      — Get org details + members
 * POST /api/org?action=update        — Update org name/settings
 * POST /api/org?action=invite        — Invite a user by email
 * POST /api/org?action=update-role   — Change a member's role
 * POST /api/org?action=remove-member — Remove a member from the org
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
  if (req.method === "POST" && action === "invite") return handleInvite(req, res, member);
  if (req.method === "POST" && action === "update-role") return handleUpdateRole(req, res, member);
  if (req.method === "POST" && action === "remove-member") return handleRemoveMember(req, res, member);

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

async function handleInvite(req, res, member) {
  if (member.role !== "owner" && member.role !== "admin") {
    return res.status(403).json({ error: "Only owners and admins can invite members" });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const { email, role } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email is required" });

  const inviteRole = role === "admin" ? "admin" : "member";

  // Check if user already exists in Supabase Auth
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    // Check if already a member of this org
    const { data: existing } = await supabase
      .from("org_members")
      .select("id")
      .eq("org_id", member.orgId)
      .eq("user_id", existingUser.id)
      .single();

    if (existing) {
      return res.status(409).json({ error: "User is already a member of this organization" });
    }

    // Add existing user to org
    const { error } = await supabase
      .from("org_members")
      .insert({
        org_id: member.orgId,
        user_id: existingUser.id,
        role: inviteRole,
        joined_at: new Date().toISOString(),
      });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ invited: true, status: "added" });
  }

  // User doesn't exist — send a Supabase invite email
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", member.orgId)
    .single();

  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { invited_org_id: member.orgId, invited_role: inviteRole },
  });

  if (inviteError) return res.status(500).json({ error: inviteError.message });

  // Pre-create org_members row so they're added on first login
  if (invited?.user?.id) {
    await supabase
      .from("org_members")
      .insert({
        org_id: member.orgId,
        user_id: invited.user.id,
        role: inviteRole,
        joined_at: new Date().toISOString(),
      });
  }

  return res.status(200).json({ invited: true, status: "email_sent" });
}

async function handleUpdateRole(req, res, member) {
  if (member.role !== "owner" && member.role !== "admin") {
    return res.status(403).json({ error: "Only owners and admins can change roles" });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const { memberId, role } = req.body || {};
  if (!memberId || !role) return res.status(400).json({ error: "memberId and role are required" });
  if (!["admin", "member"].includes(role)) return res.status(400).json({ error: "Role must be admin or member" });

  // Fetch the target member to prevent owner demotion
  const { data: target } = await supabase
    .from("org_members")
    .select("id, role, user_id")
    .eq("id", memberId)
    .eq("org_id", member.orgId)
    .single();

  if (!target) return res.status(404).json({ error: "Member not found" });
  if (target.role === "owner") return res.status(403).json({ error: "Cannot change the owner's role" });

  // Admins can't promote to admin (only owners can)
  if (role === "admin" && member.role !== "owner") {
    return res.status(403).json({ error: "Only owners can promote members to admin" });
  }

  const { error } = await supabase
    .from("org_members")
    .update({ role })
    .eq("id", memberId)
    .eq("org_id", member.orgId);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ updated: true });
}

async function handleRemoveMember(req, res, member) {
  if (member.role !== "owner" && member.role !== "admin") {
    return res.status(403).json({ error: "Only owners and admins can remove members" });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const { memberId } = req.body || {};
  if (!memberId) return res.status(400).json({ error: "memberId is required" });

  // Fetch the target member
  const { data: target } = await supabase
    .from("org_members")
    .select("id, role, user_id")
    .eq("id", memberId)
    .eq("org_id", member.orgId)
    .single();

  if (!target) return res.status(404).json({ error: "Member not found" });
  if (target.role === "owner") return res.status(403).json({ error: "Cannot remove the organization owner" });
  if (target.user_id === member.userId) return res.status(403).json({ error: "Cannot remove yourself" });

  const { error } = await supabase
    .from("org_members")
    .delete()
    .eq("id", memberId)
    .eq("org_id", member.orgId);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ removed: true });
}
