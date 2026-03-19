/**
 * Admin API — manage users and subscriptions.
 * All actions require role='admin' in subscriptions table.
 *
 * GET  /api/admin?action=users         — List all users with subscription info
 * POST /api/admin?action=update-sub    — Update a user's subscription/role
 */
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const action = req.query.action;

  // Authenticate and verify admin
  const admin = await resolveAdmin(req);
  if (!admin) return res.status(403).json({ error: "Admin access required" });

  if (action === "users" && req.method === "GET") return handleListUsers(req, res);
  if (action === "update-sub" && req.method === "POST") return handleUpdateSub(req, res);

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

// ─── List all users with subscription data ───────────────────────────────────

async function handleListUsers(req, res) {
  const supabase = getSupabaseAdmin();

  // Get all users from auth
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) return res.status(500).json({ error: usersError.message });

  // Get all subscriptions
  const { data: subs } = await supabase.from("subscriptions").select("*");
  const subsByUser = {};
  for (const sub of (subs || [])) {
    subsByUser[sub.user_id] = sub;
  }

  // Get AI usage for current period
  const period = getPeriod();
  const { data: usageData } = await supabase
    .from("ai_usage")
    .select("user_id, call_count, input_tokens, output_tokens")
    .eq("period", period);
  const usageByUser = {};
  for (const u of (usageData || [])) {
    usageByUser[u.user_id] = u;
  }

  const result = users.map(user => {
    const sub = subsByUser[user.id] || {};
    const usage = usageByUser[user.id] || {};
    const now = new Date();
    const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
    const trialDaysLeft = sub.status === "trialing" && trialEnd && trialEnd > now
      ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
      tier: sub.tier || "free",
      status: sub.status || "none",
      role: sub.role || "user",
      trialEnd: sub.trial_end,
      trialDaysLeft,
      billingCycle: sub.billing_cycle,
      stripeCustomerId: sub.stripe_customer_id,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      aiCalls: usage.call_count || 0,
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
    };
  });

  return res.status(200).json({ users: result });
}

// ─── Update a user's subscription ────────────────────────────────────────────

async function handleUpdateSub(req, res) {
  const { userId, tier, status, role, trialEnd } = req.body || {};
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const supabase = getSupabaseAdmin();
  const updates = { updated_at: new Date().toISOString() };

  if (tier) updates.tier = tier;
  if (status) updates.status = status;
  if (role) updates.role = role;
  if (trialEnd !== undefined) updates.trial_end = trialEnd;

  const { error } = await supabase
    .from("subscriptions")
    .update(updates)
    .eq("user_id", userId);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ updated: true });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function resolveAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    // Check subscriptions.role (legacy) or org_members role = 'owner' for admin org
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (sub?.role === "admin") return user.id;

    return null;
  } catch { return null; }
}
