/**
 * AI proxy — routes to Anthropic or OpenAI.
 * Default: uses BaseCommand's server-side API key (zero friction for users).
 * BYOK: if byokKey is provided, uses the user's own key instead.
 * Metering: tracks usage per user per month in Supabase.
 *
 * POST /api/ai
 * Body: { provider?, model?, max_tokens?, system?, messages, byokKey? }
 * Headers: Authorization: Bearer <supabase-jwt> (optional, enables metering)
 */
import { createClient } from "@supabase/supabase-js";

const FREE_MONTHLY_LIMIT = 50;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;
  if (!body || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const provider = body.provider || "anthropic";
  const model = body.model || "claude-sonnet-4-20250514";
  const maxTokens = body.max_tokens || 4000;
  const system = body.system || "";
  const messages = body.messages;

  // ─── Resolve user identity from Supabase JWT ────────────────────────────
  let userId = null;
  let userTier = "free"; // default tier
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
          // TODO: Look up tier from Stripe subscription when billing is live
          // For now, all authenticated users are "free" tier
        }
      } catch (e) {
        console.error("[ai] Auth error:", e.message);
      }
    }
  }

  // ─── Usage metering (free tier only, skip for BYOK) ─────────────────────
  if (userId && !body.byokKey) {
    const usage = await getUsage(userId);
    if (usage !== null && userTier === "free" && usage >= FREE_MONTHLY_LIMIT) {
      return res.status(429).json({
        error: "Free tier limit reached. Upgrade to Pro for unlimited AI.",
        usage,
        limit: FREE_MONTHLY_LIMIT,
      });
    }
  }

  // ─── Resolve API key ────────────────────────────────────────────────────
  let apiKey = null;

  // BYOK: user provided their own key
  if (body.byokKey) {
    apiKey = body.byokKey;
  }

  // Default: use BaseCommand's server-side key
  if (!apiKey) {
    if (provider === "anthropic") {
      apiKey = process.env.ANTHROPIC_API_KEY;
    } else if (provider === "openai") {
      apiKey = process.env.OPENAI_API_KEY;
    }
  }

  if (!apiKey) {
    return res.status(500).json({ error: `No API key available for ${provider}.` });
  }

  // ─── Make the AI call ───────────────────────────────────────────────────
  try {
    let result;
    if (provider === "anthropic") {
      result = await handleAnthropic(apiKey, model, maxTokens, system, messages);
    } else if (provider === "openai") {
      result = await handleOpenAI(apiKey, model, maxTokens, system, messages);
    } else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // ─── Track usage (after successful call, skip for BYOK) ─────────────
    if (userId && !body.byokKey) {
      await trackUsage(userId, model, result.data.usage);
    }

    return res.status(200).json(result.data);
  } catch (err) {
    console.error(`[ai] proxy error (${provider}):`, err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ─── Anthropic handler ───────────────────────────────────────────────────────
async function handleAnthropic(apiKey, model, maxTokens, system, messages) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { error: data.error?.message || "Anthropic API error", status: response.status };
  }
  return { data };
}

// ─── OpenAI handler ──────────────────────────────────────────────────────────
async function handleOpenAI(apiKey, model, maxTokens, system, messages) {
  const openaiMessages = [];
  if (system) openaiMessages.push({ role: "system", content: system });
  for (const msg of messages) openaiMessages.push({ role: msg.role, content: msg.content });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: openaiMessages }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { error: data.error?.message || "OpenAI API error", status: response.status };
  }

  const choice = data.choices?.[0];
  return {
    data: {
      content: [{ text: choice?.message?.content || "" }],
      stop_reason: choice?.finish_reason === "stop" ? "end_turn"
        : choice?.finish_reason === "length" ? "max_tokens"
        : choice?.finish_reason || "end_turn",
      model: data.model,
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
      },
    },
  };
}

// ─── Usage tracking via Supabase ─────────────────────────────────────────────
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

async function getUsage(userId) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data } = await supabase
    .from("ai_usage")
    .select("call_count")
    .eq("user_id", userId)
    .eq("period", getPeriod())
    .single();

  return data?.call_count || 0;
}

async function trackUsage(userId, model, usage) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const period = getPeriod();
  const inputTokens = usage?.input_tokens || 0;
  const outputTokens = usage?.output_tokens || 0;

  // Upsert: increment call_count and token totals
  const { data: existing } = await supabase
    .from("ai_usage")
    .select("id, call_count, input_tokens, output_tokens")
    .eq("user_id", userId)
    .eq("period", period)
    .single();

  if (existing) {
    await supabase
      .from("ai_usage")
      .update({
        call_count: existing.call_count + 1,
        input_tokens: existing.input_tokens + inputTokens,
        output_tokens: existing.output_tokens + outputTokens,
        model,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("ai_usage")
      .insert({
        user_id: userId,
        period,
        call_count: 1,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        model,
      });
  }
}
