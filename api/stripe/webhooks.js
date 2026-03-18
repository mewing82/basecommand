/**
 * Stripe webhook handler — processes subscription lifecycle events.
 *
 * POST /api/stripe/webhooks
 * No auth header — uses Stripe webhook signature verification.
 *
 * Events handled:
 * - checkout.session.completed — activate subscription
 * - customer.subscription.updated — sync status changes
 * - customer.subscription.deleted — mark canceled
 * - invoice.payment_failed — flag past_due
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Vercel needs raw body for signature verification
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return res.status(500).json({ error: "Stripe not configured" });
  }

  const stripe = new Stripe(stripeKey);
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: "Database not configured" });
  }

  // ─── Read raw body for signature verification ────────────────────────────
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      req.headers["stripe-signature"],
      webhookSecret
    );
  } catch (err) {
    console.error("[stripe] Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  // ─── Handle events ──────────────────────────────────────────────────────
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
        if (!userId) break;

        await syncSubscription(supabase, userId, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            tier: "free",
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (sub) {
          await supabase
            .from("subscriptions")
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

// ─── Sync subscription state from Stripe to Supabase ───────────────────────

async function syncSubscription(supabase, userId, subscription) {
  const isAnnual = subscription.items?.data?.[0]?.price?.recurring?.interval === "year";
  const status = subscription.status === "active" || subscription.status === "trialing"
    ? "active" : subscription.status;

  await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status,
      tier: "pro",
      billing_cycle: isAnnual ? "annual" : "monthly",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
