import { store } from "./storage";
import { AI_PROVIDERS } from "./tokens";
import { BC_SYSTEM_PROMPT } from "./prompts";
import { safeParse } from "./utils";
import { supabase } from "./supabase";
import { useAuthStore } from "../store/authStore";

// ─── AI Config Helpers ───────────────────────────────────────────────────────
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

// ─── Core AI Call ────────────────────────────────────────────────────────────
// Routes through /api/ai proxy. Uses BaseCommand's server-side API key by default.
// If user has BYOK configured, sends their keyId for KV lookup.
export async function callAI(messages, systemOverride, maxTokens, configOverride) {
  const config = configOverride || getActiveAIConfig();
  const provider = config?.provider || "anthropic";
  const system = systemOverride || BC_SYSTEM_PROMPT;
  const max_tokens = maxTokens || 4000;

  // Determine model based on user tier (BYOK users can pick their own)
  const byokKey = resolveAPIKey(config);
  const model = byokKey
    ? (config?.model || "claude-sonnet-4-20250514")
    : (config?.model || "claude-sonnet-4-20250514"); // TODO: Opus for Pro tier

  // Build request body
  const body = {
    provider,
    model,
    max_tokens,
    system,
    messages,
  };

  // If user has BYOK key, include it for server-side lookup
  if (byokKey) {
    body.byokKey = byokKey;
  }

  // Include auth token and org context
  const headers = { "Content-Type": "application/json" };
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  }
  const activeOrgId = useAuthStore.getState().activeOrgId;
  if (activeOrgId) {
    headers["X-Org-Id"] = activeOrgId;
  }

  const res = await fetch("/api/ai", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("You've used all your free AI calls this month. Upgrade to Pro for unlimited AI.");
    }
    throw new Error(data.error || `AI error (${res.status})`);
  }

  const text = data.content?.map(b => b.text || "").join("") || "";
  const result = new String(text);
  result.stop_reason = data.stop_reason;
  result.usage = data.usage;
  return result;
}

// ─── Entity-scoped AI with History ───────────────────────────────────────────
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

// ─── Predefined AI Actions ───────────────────────────────────────────────────
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
