/**
 * Generalized AI proxy — routes to Anthropic or OpenAI based on provider.
 * Looks up API keys from Vercel KV; falls back to env vars when no keyId provided.
 * Normalizes all responses to Anthropic message format for client consistency.
 *
 * POST /api/ai
 * Body: { userId?, keyId?, provider?, model?, max_tokens?, system?, messages }
 */
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

  // Resolve API key
  let apiKey = null;

  if (body.keyId && body.userId) {
    // Look up from KV
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    if (kvUrl && kvToken) {
      const keyData = await kvGet(kvUrl, kvToken, `bc2-aikey:${body.userId}:${body.keyId}`);
      if (keyData?.apiKey) {
        apiKey = keyData.apiKey;
      }
    }
  }

  // Fallback to env vars
  if (!apiKey) {
    if (provider === "anthropic") {
      apiKey = process.env.ANTHROPIC_API_KEY;
    } else if (provider === "openai") {
      apiKey = process.env.OPENAI_API_KEY;
    }
  }

  if (!apiKey) {
    return res.status(500).json({ error: `No API key available for ${provider}. Add one in Settings.` });
  }

  try {
    if (provider === "anthropic") {
      return await handleAnthropic(res, apiKey, model, maxTokens, system, messages);
    } else if (provider === "openai") {
      return await handleOpenAI(res, apiKey, model, maxTokens, system, messages);
    } else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }
  } catch (err) {
    console.error(`AI proxy error (${provider}):`, err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ─── Anthropic handler ───────────────────────────────────────────────────────
async function handleAnthropic(res, apiKey, model, maxTokens, system, messages) {
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
    return res.status(response.status).json({ error: data.error?.message || "Anthropic API error" });
  }
  return res.status(200).json(data);
}

// ─── OpenAI handler ──────────────────────────────────────────────────────────
async function handleOpenAI(res, apiKey, model, maxTokens, system, messages) {
  // Translate messages: prepend system message in OpenAI format
  const openaiMessages = [];
  if (system) {
    openaiMessages.push({ role: "system", content: system });
  }
  for (const msg of messages) {
    openaiMessages.push({ role: msg.role, content: msg.content });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: openaiMessages,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return res.status(response.status).json({
      error: data.error?.message || "OpenAI API error",
    });
  }

  // Normalize to Anthropic response shape
  const choice = data.choices?.[0];
  const normalized = {
    content: [{ text: choice?.message?.content || "" }],
    stop_reason: choice?.finish_reason === "stop" ? "end_turn"
      : choice?.finish_reason === "length" ? "max_tokens"
      : choice?.finish_reason || "end_turn",
    model: data.model,
    usage: {
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
    },
  };

  return res.status(200).json(normalized);
}

// ─── KV helper ───────────────────────────────────────────────────────────────
async function kvGet(kvUrl, kvToken, key) {
  const r = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${kvToken}` },
  });
  if (!r.ok) return null;
  const json = await r.json();
  return json.result ? (typeof json.result === "string" ? JSON.parse(json.result) : json.result) : null;
}
