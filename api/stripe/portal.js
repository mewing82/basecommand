/**
 * Create a Stripe Customer Portal session for billing management.
 *
 * POST /api/stripe/portal
 * Headers: Authorization: Bearer <supabase-jwt>
 * Returns: { url } — redirect user to manage subscription
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: "Stripe not configured" });
  }

  const userId = await resolveUser(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: "Database not configured" });
  }

  // Look up Stripe customer ID
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (!sub?.stripe_customer_id) {
    return res.status(400).json({ error: "No billing account found. Upgrade to Pro first." });
  }

  const stripe = new Stripe(stripeKey);
  const appUrl = process.env.APP_URL || "https://basecommand.ai";

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl}/app/settings`,
  });

  return res.status(200).json({ url: session.url });
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
