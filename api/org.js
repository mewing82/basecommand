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
  if (req.method === "POST" && action === "accept-invites") return handleAcceptInvites(req, res, member);

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
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists in Supabase Auth
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existingUser = users.find(u => u.email?.toLowerCase() === normalizedEmail);

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

    // Add existing user to org directly
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

  // User doesn't exist — create a pending invite record.
  // They'll be added to the org when they sign up and accept.

  // Check for existing pending invite
  const { data: existingInvite } = await supabase
    .from("org_invites")
    .select("id")
    .eq("org_id", member.orgId)
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .single();

  if (existingInvite) {
    return res.status(409).json({ error: "An invite is already pending for this email" });
  }

  // Generate a unique invite token
  const token = crypto.randomUUID();

  const { error: inviteError } = await supabase
    .from("org_invites")
    .insert({
      org_id: member.orgId,
      email: normalizedEmail,
      role: inviteRole,
      invited_by: member.userId,
      token,
      status: "pending",
    });

  if (inviteError) return res.status(500).json({ error: inviteError.message });

  return res.status(200).json({
    invited: true,
    status: "pending",
    message: `Invite created for ${normalizedEmail}. They'll be added when they sign up.`,
  });
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

async function handleAcceptInvites(req, res, member) {
  // Called after signup/login to auto-accept any pending invites for this user's email.
  // Any authenticated user can accept their own invites.
  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  // Get user's email
  const { data: { user } } = await supabase.auth.admin.getUserById(member.userId);
  if (!user?.email) return res.status(400).json({ error: "Could not resolve user email" });

  const { data: pendingInvites } = await supabase
    .from("org_invites")
    .select("id, org_id, role")
    .eq("email", user.email.toLowerCase())
    .eq("status", "pending");

  if (!pendingInvites || pendingInvites.length === 0) {
    return res.status(200).json({ accepted: 0 });
  }

  let accepted = 0;
  for (const invite of pendingInvites) {
    // Check if already a member (avoid duplicates)
    const { data: existing } = await supabase
      .from("org_members")
      .select("id")
      .eq("org_id", invite.org_id)
      .eq("user_id", member.userId)
      .single();

    if (!existing) {
      const { error } = await supabase
        .from("org_members")
        .insert({
          org_id: invite.org_id,
          user_id: member.userId,
          role: invite.role,
          joined_at: new Date().toISOString(),
        });
      if (!error) accepted++;
    }

    // Mark invite as accepted regardless
    await supabase
      .from("org_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);
  }

  return res.status(200).json({ accepted });
}
