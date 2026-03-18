/**
 * Create a Stripe Checkout session for Pro upgrade.
 *
 * POST /api/stripe/create-checkout
 * Body: { plan: "monthly" | "annual" }
 * Headers: Authorization: Bearer <supabase-jwt>
 * Returns: { url } — redirect user to this URL
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

  // ─── Authenticate user ───────────────────────────────────────────────────
  const userId = await resolveUser(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { plan } = req.body || {};
  const priceId = plan === "annual"
    ? process.env.STRIPE_PRICE_ANNUAL
    : process.env.STRIPE_PRICE_MONTHLY;

  if (!priceId) {
    return res.status(500).json({ error: "Stripe price not configured" });
  }

  const stripe = new Stripe(stripeKey);
  const supabase = getSupabaseAdmin();

  // ─── Get or create Stripe customer ───────────────────────────────────────
  let customerId = null;

  if (supabase) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    customerId = sub?.stripe_customer_id;
  }

  if (!customerId) {
    // Get user email from Supabase auth
    const { data: { user } } = await getSupabaseAdmin().auth.admin.getUserById(userId);
    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { userId },
    });
    customerId = customer.id;

    // Store customer ID
    if (supabase) {
      await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
    }
  }

  // ─── Create Checkout Session ─────────────────────────────────────────────
  const appUrl = process.env.APP_URL || "https://basecommand.ai";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/app/settings?billing=success`,
    cancel_url: `${appUrl}/app/settings?billing=cancel`,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
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
