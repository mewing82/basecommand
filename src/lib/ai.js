// ─── AI Engine ───────────────────────────────────────────────────────────────
import { store } from "./store.js";
import { AI_PROVIDERS } from "../theme/constants.js";

export function getActiveAIConfig() {
  const configId = localStorage.getItem(`bc2-${store._ws}-ai-active-config`);
  if (!configId) return null;
  const raw = localStorage.getItem(store._key("ai-config", configId));
  return raw ? JSON.parse(raw) : null;
}

export function setActiveAIConfig(configId) {
  localStorage.setItem(`bc2-${store._ws}-ai-active-config`, configId);
}

export function resolveAPIKey(config) {
  if (!config?.keyId) return null;
  const raw = localStorage.getItem(store._key("ai-key", config.keyId));
  if (!raw) return null;
  return JSON.parse(raw).apiKey || null;
}

export function getModelLabel(provider, modelId) {
  const p = AI_PROVIDERS[provider];
  if (!p) return modelId;
  const m = p.models.find(m => m.id === modelId);
  return m ? m.label : modelId;
}

const BC_SYSTEM_PROMPT = `You are Base Command (BC), an executive decision intelligence system. You serve as a strategic advisor to leaders, helping them make better decisions, manage priorities, and track execution.

Core principles:
- Be direct. No filler, no preamble. Start with substance.
- Be specific. Reference concrete details. Vague advice is useless.
- Be honest. If risky, say so. If overdue, don't sugarcoat.
- Be actionable. End with something the leader can do next.
- Be concise. Respect the leader's time. Use short paragraphs. Bold key points.

When analyzing decisions: identify the core tension or trade-off, evaluate each option against stated criteria, flag risks and second-order effects, make a recommendation with clear reasoning.

When working with tasks: break complex tasks into specific actionable subtasks, identify dependencies and blockers, suggest delegation opportunities, flag misalignment with stated priorities.

When assessing priorities: evaluate progress based on linked decisions and task completion, identify gaps between stated priorities and actual activity, surface tensions between competing priorities.

Format using markdown. Use **bold** for key points. Use bullet lists sparingly. Keep under 500 words unless complexity demands more.`;

export async function callAI(messages, systemOverride, maxTokens, configOverride) {
  const config = configOverride || getActiveAIConfig();
  const provider = config?.provider || "anthropic";
  const model = config?.model || "claude-sonnet-4-20250514";
  const system = systemOverride || BC_SYSTEM_PROMPT;
  const max_tokens = maxTokens || 4000;

  const apiKey = resolveAPIKey(config);
  if (!apiKey) {
    throw new Error(`No ${provider === "openai" ? "OpenAI" : "Anthropic"} API key configured. Add one in Settings → AI Configuration.`);
  }

  let data;

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens,
        ...(system ? { system } : {}),
        messages,
      }),
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Anthropic API error (${res.status})`);
  } else if (provider === "openai") {
    const openaiMessages = [];
    if (system) openaiMessages.push({ role: "system", content: system });
    for (const msg of messages) openaiMessages.push({ role: msg.role, content: msg.content });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens, messages: openaiMessages }),
    });
    const raw = await res.json();
    if (!res.ok) throw new Error(raw.error?.message || `OpenAI API error (${res.status})`);

    const choice = raw.choices?.[0];
    data = {
      content: [{ text: choice?.message?.content || "" }],
      stop_reason: choice?.finish_reason === "stop" ? "end_turn"
        : choice?.finish_reason === "length" ? "max_tokens"
        : choice?.finish_reason || "end_turn",
      model: raw.model,
      usage: { input_tokens: raw.usage?.prompt_tokens || 0, output_tokens: raw.usage?.completion_tokens || 0 },
    };
  } else {
    throw new Error(`Unknown AI provider: ${provider}`);
  }

  const text = data.content?.map(b => b.text || "").join("") || "";
  const result = new String(text);
  result.stop_reason = data.stop_reason;
  return result;
}

export async function callAIForEntity(entityType, entityId, userPrompt, configOverride) {
  const history = await store.getAIHistory(entityType, entityId);
  const messages = [
    ...history.flatMap(h => [
      { role: "user", content: h.prompt },
      { role: "assistant", content: h.response },
    ]),
    { role: "user", content: userPrompt },
  ];
  const response = await callAI(messages, undefined, undefined, configOverride);
  await store.appendAIHistory(entityType, entityId, {
    prompt: userPrompt,
    response,
    createdAt: new Date().toISOString(),
  });
  return response;
}

export const AI_ACTIONS = {
  analyze_decision: {
    label: "Analyze Decision",
    prompt: (e) => `Analyze this decision. Identify the core tension or trade-off. Evaluate each option. Flag risks and second-order effects. Make a recommendation with clear reasoning.\n\nDecision: ${e.title}\nContext: ${e.context || "(none)"}\nOptions: ${JSON.stringify(e.options || [])}`,
    entity: "decision",
  },
  generate_tasks: {
    label: "Generate Tasks",
    prompt: (e) => `Generate 3-7 implementation tasks for this decision. Return ONLY a JSON array with no other text: [{"title":"...","description":"...","priority":"high","dueOffset":7}] where dueOffset is days from today, priority is one of critical/high/medium/low.\n\nDecision: ${e.title}\nOutcome: ${e.outcome || "(not yet set)"}`,
    entity: "decision",
  },
  evaluate_outcome: {
    label: "Evaluate Outcome",
    prompt: (e) => `Evaluate this decision's outcome versus the original analysis and options considered.\n\nDecision: ${e.title}\nOriginal context: ${e.context || "(none)"}\nOutcome: ${e.outcome || "(not yet set)"}`,
    entity: "decision",
  },
  break_down: {
    label: "Break Down Task",
    prompt: (e) => `Break this task into 3-7 specific, actionable subtasks. Return ONLY a JSON array with no other text: [{"title":"..."}]\n\nTask: ${e.title}\nDescription: ${e.description || "(none)"}`,
    entity: "task",
  },
  draft_update: {
    label: "Draft Status Update",
    prompt: (e) => `Draft a concise status update for stakeholders on this task. Professional tone, factual, action-oriented.\n\nTask: ${e.title}\nStatus: ${e.status}\nDescription: ${e.description || "(none)"}`,
    entity: "task",
  },
  identify_blockers: {
    label: "Identify Blockers",
    prompt: (e) => `Analyze this task for dependencies, gaps, friction points, and unblocking strategies.\n\nTask: ${e.title}\nStatus: ${e.status}\nDescription: ${e.description || "(none)"}`,
    entity: "task",
  },
  assess_health: {
    label: "Assess Health",
    prompt: (e) => `Assess the health of this strategic priority. Return ONLY valid JSON with no other text: {"score":75,"assessment":"..."} where score is 0-100.\n\nPriority: ${e.title}\nDescription: ${e.description || "(none)"}\nSuccess Metrics: ${JSON.stringify(e.successMetrics || [])}`,
    entity: "priority",
  },
};
