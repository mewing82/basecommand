/**
 * Consolidated Stripe API — routes by ?action= parameter.
 *
 * POST /api/stripe?action=checkout   — Create checkout session
 * POST /api/stripe?action=portal     — Create billing portal session
 * POST /api/stripe?action=webhooks   — Stripe webhook handler
 * GET  /api/stripe?action=status     — Get subscription status
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const action = req.query.action || req.url.split("action=")[1]?.split("&")[0];

  if (action === "webhooks" && req.method === "POST") return handleWebhooks(req, res);
  if (action === "status" && req.method === "GET") return handleStatus(req, res);
  if (action === "checkout" && req.method === "POST") return handleCheckout(req, res);
  if (action === "portal" && req.method === "POST") return handlePortal(req, res);

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

// ─── Checkout ────────────────────────────────────────────────────────────────

async function handleCheckout(req, res) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: "Stripe not configured" });

  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const body = await readJsonBody(req);
  const { plan } = body || {};
  const priceId = plan === "annual"
    ? process.env.STRIPE_PRICE_ANNUAL
    : process.env.STRIPE_PRICE_MONTHLY;

  if (!priceId) return res.status(500).json({ error: "Stripe price not configured" });

  const stripe = new Stripe(stripeKey);
  const supabase = getSupabaseAdmin();

  // Get or create Stripe customer
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
    const { data: { user } } = await getSupabaseAdmin().auth.admin.getUserById(userId);
    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { userId },
    });
    customerId = customer.id;

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

  const appUrl = process.env.APP_URL || "https://basecommand.ai";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/app/settings?billing=success`,
    cancel_url: `${appUrl}/app/settings?billing=cancel`,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });

  return res.status(200).json({ url: session.url });
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

async function handleWebhooks(req, res) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) return res.status(500).json({ error: "Stripe not configured" });

  const stripe = new Stripe(stripeKey);
  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, req.headers["stripe-signature"], webhookSecret);
  } catch (err) {
    console.error("[stripe] Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (!userId || !session.subscription) break;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscription(supabase, userId, subscription);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) await syncSubscription(supabase, userId, subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) {
          await supabase.from("subscriptions").update({
            status: "canceled", tier: "free",
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", invoice.customer)
          .single();
        if (sub) {
          await supabase.from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("user_id", sub.user_id);
        }
        break;
      }
    }
  } catch (err) {
    console.error(`[stripe] Error handling ${event.type}:`, err.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }

  return res.status(200).json({ received: true });
}

// ─── Portal ──────────────────────────────────────────────────────────────────

async function handlePortal(req, res) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: "Stripe not configured" });

  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

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

// ─── Status ──────────────────────────────────────────────────────────────────

async function handleStatus(req, res) {
  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(200).json({ tier: "free", status: "none" });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!sub) return res.status(200).json({ tier: "free", status: "none" });

  const now = new Date();
  const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
  const isTrialing = sub.status === "trialing" && trialEnd && trialEnd > now;
  const trialExpired = sub.status === "trialing" && trialEnd && trialEnd <= now;

  let effectiveTier = sub.tier;
  let effectiveStatus = sub.status;

  if (trialExpired && sub.tier === "pro_trial") {
    effectiveTier = "free";
    effectiveStatus = "expired";
    await supabase.from("subscriptions")
      .update({ tier: "free", status: "expired", updated_at: now.toISOString() })
      .eq("user_id", userId);
  }

  const trialDaysLeft = isTrialing && trialEnd
    ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))
    : 0;

  return res.status(200).json({
    tier: effectiveTier, status: effectiveStatus,
    trialEnd: sub.trial_end, trialDaysLeft,
    billingCycle: sub.billing_cycle,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    currentPeriodEnd: sub.current_period_end,
    hasStripeSubscription: !!sub.stripe_subscription_id,
  });
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

async function syncSubscription(supabase, userId, subscription) {
  const isAnnual = subscription.items?.data?.[0]?.price?.recurring?.interval === "year";
  const status = subscription.status === "active" || subscription.status === "trialing"
    ? "active" : subscription.status;

  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    status, tier: "pro",
    billing_cycle: isAnnual ? "annual" : "monthly",
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

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

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try { return JSON.parse(Buffer.concat(chunks).toString()); }
  catch { return null; }
}
