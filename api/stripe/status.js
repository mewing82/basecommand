/**
 * Get current subscription status for authenticated user.
 *
 * GET /api/stripe/status
 * Headers: Authorization: Bearer <supabase-jwt>
 * Returns: { tier, status, trialEnd, billingCycle, cancelAtPeriodEnd, currentPeriodEnd }
 */
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = await resolveUser(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(200).json({ tier: "free", status: "none" });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!sub) {
    return res.status(200).json({ tier: "free", status: "none" });
  }

  // Check if trial has expired
  const now = new Date();
  const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
  const isTrialing = sub.status === "trialing" && trialEnd && trialEnd > now;
  const trialExpired = sub.status === "trialing" && trialEnd && trialEnd <= now;

  // Determine effective tier
  let effectiveTier = sub.tier;
  let effectiveStatus = sub.status;

  if (trialExpired && sub.tier === "pro_trial") {
    effectiveTier = "free";
    effectiveStatus = "expired";

    // Auto-downgrade in DB
    await supabase
      .from("subscriptions")
      .update({ tier: "free", status: "expired", updated_at: now.toISOString() })
      .eq("user_id", userId);
  }

  // Calculate trial days remaining
  const trialDaysLeft = isTrialing && trialEnd
    ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))
    : 0;

  return res.status(200).json({
    tier: effectiveTier,
    status: effectiveStatus,
    trialEnd: sub.trial_end,
    trialDaysLeft,
    billingCycle: sub.billing_cycle,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    currentPeriodEnd: sub.current_period_end,
    hasStripeSubscription: !!sub.stripe_subscription_id,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function resolveUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return error ? null : user?.id;
  } catch { return null; }
}
