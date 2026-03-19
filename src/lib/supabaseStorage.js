/**
 * Supabase-backed storage adapter for renewal data.
 * Same method signatures as renewalStore in storage.js.
 * Falls back to localStorage if Supabase is not available or user is not authenticated.
 *
 * All data queries are scoped to the active org (org_id).
 * user_id is retained as created_by provenance on writes.
 */
import { supabase } from "./supabase";
import { useAuthStore } from "../store/authStore";

// ─── Helper: get current user ID ────────────────────────────────────────────
async function getUserId() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

// ─── Helper: get active org ID from authStore ───────────────────────────────
function getOrgId() {
  return useAuthStore.getState().activeOrgId || null;
}

// ─── Accounts ────────────────────────────────────────────────────────────────
export async function getAccounts() {
  const userId = await getUserId();
  if (!userId) return [];
  const orgId = getOrgId();
  const query = supabase
    .from("renewal_accounts")
    .select("*")
    .order("created_at", { ascending: false });
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) { console.error("[db] getAccounts:", error.message); return []; }
  return data.map(dbToAccount);
}

export async function getAccount(id) {
  const userId = await getUserId();
  if (!userId) return null;
  const orgId = getOrgId();
  const query = supabase
    .from("renewal_accounts")
    .select("*")
    .eq("id", id);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { data, error } = await query.single();
  if (error) return null;
  return dbToAccount(data);
}

export async function saveAccount(account) {
  const userId = await getUserId();
  if (!userId) return account;
  const row = accountToDb(account, userId);
  const { error } = await supabase
    .from("renewal_accounts")
    .upsert(row, { onConflict: "id" });
  if (error) console.error("[db] saveAccount:", error.message);
  return account;
}

export async function saveAccounts(accounts) {
  const userId = await getUserId();
  if (!userId) return;
  const rows = accounts.map(a => accountToDb(a, userId));
  const { error } = await supabase
    .from("renewal_accounts")
    .upsert(rows, { onConflict: "id" });
  if (error) console.error("[db] saveAccounts:", error.message);
}

export async function deleteAccount(id) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  const query = supabase
    .from("renewal_accounts")
    .delete()
    .eq("id", id);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { error } = await query;
  if (error) console.error("[db] deleteAccount:", error.message);
}

// ─── Context Items ───────────────────────────────────────────────────────────
export async function getContext(accountId) {
  const userId = await getUserId();
  if (!userId) return [];
  const orgId = getOrgId();
  const query = supabase
    .from("context_items")
    .select("*")
    .eq("account_id", accountId)
    .order("uploaded_at", { ascending: true });
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) { console.error("[db] getContext:", error.message); return []; }
  return data.map(dbToContextItem);
}

export async function saveContext(accountId, items) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  // Delete existing, then insert new
  const delQuery = supabase.from("context_items").delete().eq("account_id", accountId);
  if (orgId) delQuery.eq("org_id", orgId);
  else delQuery.eq("user_id", userId);
  await delQuery;
  if (items.length > 0) {
    const rows = items.map(i => contextItemToDb(i, accountId, userId));
    const { error } = await supabase.from("context_items").insert(rows);
    if (error) console.error("[db] saveContext:", error.message);
  }
}

export async function addContextItem(accountId, item) {
  const userId = await getUserId();
  if (!userId) return item;
  const row = contextItemToDb(item, accountId, userId);
  const { error } = await supabase.from("context_items").insert(row);
  if (error) console.error("[db] addContextItem:", error.message);
  return item;
}

export async function deleteContextItem(accountId, itemId) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  const query = supabase.from("context_items").delete().eq("id", itemId);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  await query;
}

// ─── Threads ─────────────────────────────────────────────────────────────────
export async function getThreads(accountId) {
  const userId = await getUserId();
  if (!userId) return [];
  const orgId = getOrgId();
  const query = supabase
    .from("conversation_threads")
    .select("*")
    .eq("account_id", accountId)
    .order("last_message_at", { ascending: false });
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) { console.error("[db] getThreads:", error.message); return []; }
  return data.map(dbToThread);
}

export async function saveThreads(accountId, threads) {
  const userId = await getUserId();
  if (!userId) return;
  const rows = threads.map(t => threadToDb(t, accountId, userId));
  const { error } = await supabase
    .from("conversation_threads")
    .upsert(rows, { onConflict: "id" });
  if (error) console.error("[db] saveThreads:", error.message);
}

export async function addThread(accountId, thread) {
  const userId = await getUserId();
  if (!userId) return thread;
  const row = threadToDb(thread, accountId, userId);
  const { error } = await supabase.from("conversation_threads").insert(row);
  if (error) console.error("[db] addThread:", error.message);
  return thread;
}

export async function deleteThread(accountId, threadId) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  const query = supabase.from("conversation_threads").delete().eq("id", threadId);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  await query;
}

// ─── Messages ────────────────────────────────────────────────────────────────
export async function getMessages(threadId) {
  const userId = await getUserId();
  if (!userId) return [];
  const orgId = getOrgId();
  const query = supabase
    .from("conversation_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(50);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) { console.error("[db] getMessages:", error.message); return []; }
  return data.map(dbToMessage);
}

export async function saveMessages(threadId, messages) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  const delQuery = supabase.from("conversation_messages").delete().eq("thread_id", threadId);
  if (orgId) delQuery.eq("org_id", orgId);
  else delQuery.eq("user_id", userId);
  await delQuery;
  if (messages.length > 0) {
    const rows = messages.map(m => messageToDb(m, threadId, userId));
    const { error } = await supabase.from("conversation_messages").insert(rows);
    if (error) console.error("[db] saveMessages:", error.message);
  }
}

export async function addMessage(threadId, message) {
  const userId = await getUserId();
  if (!userId) return message;
  const row = messageToDb(message, threadId, userId);
  const { error } = await supabase.from("conversation_messages").insert(row);
  if (error) console.error("[db] addMessage:", error.message);
  return message;
}

// ─── Task Items ──────────────────────────────────────────────────────────────
export async function getTaskItems() {
  const userId = await getUserId();
  if (!userId) return [];
  const orgId = getOrgId();
  const query = supabase
    .from("task_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) { console.error("[db] getTaskItems:", error.message); return []; }
  return data.map(dbToTask);
}

export async function saveTaskItems(tasks) {
  const userId = await getUserId();
  if (!userId) return;
  const rows = tasks.map(t => taskToDb(t, userId));
  const { error } = await supabase
    .from("task_items")
    .upsert(rows, { onConflict: "id" });
  if (error) console.error("[db] saveTaskItems:", error.message);
}

export async function saveTaskItem(task) {
  const userId = await getUserId();
  if (!userId) return task;
  const row = taskToDb(task, userId);
  const { error } = await supabase
    .from("task_items")
    .upsert(row, { onConflict: "id" });
  if (error) console.error("[db] saveTaskItem:", error.message);
  return task;
}

export async function updateTaskItem(id, updates) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.aiOutput !== undefined) dbUpdates.ai_output = updates.aiOutput;
  if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
  if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.accountId !== undefined) dbUpdates.account_id = updates.accountId;
  if (updates.accountName !== undefined) dbUpdates.account_name = updates.accountName;
  dbUpdates.updated_at = new Date().toISOString();
  const query = supabase.from("task_items").update(dbUpdates).eq("id", id);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  await query;
}

export async function deleteTaskItem(id) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  const query = supabase.from("task_items").delete().eq("id", id);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  await query;
}

// ─── Autopilot Actions ───────────────────────────────────────────────────────
export async function getAutopilotActions() {
  const userId = await getUserId();
  if (!userId) return [];
  const orgId = getOrgId();
  const query = supabase
    .from("autopilot_actions")
    .select("*")
    .order("created_at", { ascending: false });
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) { console.error("[db] getAutopilotActions:", error.message); return []; }
  return data.map(dbToAutopilotAction);
}

export async function saveAutopilotActions(actions) {
  const userId = await getUserId();
  if (!userId) return;
  const rows = actions.map(a => autopilotActionToDb(a, userId));
  const { error } = await supabase
    .from("autopilot_actions")
    .upsert(rows, { onConflict: "id" });
  if (error) console.error("[db] saveAutopilotActions:", error.message);
}

export async function addAutopilotAction(action) {
  const userId = await getUserId();
  if (!userId) return action;
  const row = autopilotActionToDb(action, userId);
  const { error } = await supabase.from("autopilot_actions").insert(row);
  if (error) console.error("[db] addAutopilotAction:", error.message);
  return action;
}

export async function updateAutopilotAction(id, updates) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  const dbUpdates = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  dbUpdates.updated_at = new Date().toISOString();
  const query = supabase.from("autopilot_actions").update(dbUpdates).eq("id", id);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  await query;
}

// ─── KB Documents ────────────────────────────────────────────────────────────
export async function getKBDocs() {
  const userId = await getUserId();
  if (!userId) return [];
  const orgId = getOrgId();
  const query = supabase
    .from("kb_documents")
    .select("id, name, created_at, updated_at");
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) { console.error("[db] getKBDocs:", error.message); return []; }
  return data.map(d => ({ id: d.id, name: d.name, createdAt: d.created_at, updatedAt: d.updated_at }));
}

export async function getKBContent(docId) {
  const userId = await getUserId();
  if (!userId) return "";
  const orgId = getOrgId();
  const query = supabase
    .from("kb_documents")
    .select("content")
    .eq("id", docId);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { data } = await query.single();
  return data?.content || "";
}

export async function saveKBDoc(doc, content) {
  const userId = await getUserId();
  if (!userId) return doc;
  const orgId = getOrgId();
  const row = {
    id: doc.id,
    user_id: userId,
    org_id: orgId,
    name: doc.name,
    content: content !== undefined ? content : undefined,
    updated_at: new Date().toISOString(),
  };
  if (!content && content !== "") delete row.content;
  await supabase.from("kb_documents").upsert(row, { onConflict: "id" });
  return doc;
}

export async function deleteKBDoc(docId) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  const query = supabase.from("kb_documents").delete().eq("id", docId);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  await query;
}

// ─── Analysis Cache (expansion, leadership, forecast) ────────────────────────
export async function getAnalysisCache(type) {
  const userId = await getUserId();
  if (!userId) return null;
  const orgId = getOrgId();
  const query = supabase
    .from("analysis_cache")
    .select("data, generated_at")
    .eq("type", type);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { data } = await query.single();
  if (!data) return null;
  return { ...data.data, _generatedAt: new Date(data.generated_at).getTime() };
}

export async function saveAnalysisCache(type, cacheData) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  await supabase.from("analysis_cache").upsert({
    user_id: userId,
    org_id: orgId,
    type,
    data: cacheData,
    generated_at: new Date().toISOString(),
  }, { onConflict: orgId ? "org_id,type" : "user_id,type" });
}

// ─── Settings (stays user-scoped) ───────────────────────────────────────────
export async function getSettings() {
  const userId = await getUserId();
  if (!userId) return {};
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (!data) return {};
  return { persona: data.persona, ...data.settings };
}

export async function saveSettings(settings) {
  const userId = await getUserId();
  if (!userId) return;
  const { persona, ...rest } = settings;
  await supabase.from("user_settings").upsert({
    user_id: userId,
    persona: persona || null,
    settings: rest,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

// ─── Metrics ─────────────────────────────────────────────────────────────────
export async function getMetrics() {
  const userId = await getUserId();
  if (!userId) return null;
  const orgId = getOrgId();
  const query = supabase
    .from("renewal_metrics")
    .select("metrics");
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  const { data } = await query.single();
  return data?.metrics || null;
}

export async function saveMetrics(metrics) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  await supabase.from("renewal_metrics").upsert({
    user_id: userId,
    org_id: orgId,
    metrics,
    updated_at: new Date().toISOString(),
  }, { onConflict: orgId ? "org_id" : "user_id" });
}

// ─── AI Usage (stays user-scoped, read-only from client) ────────────────────
export async function getAIUsage() {
  const userId = await getUserId();
  if (!userId) return { callCount: 0, limit: 50 };
  const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const { data } = await supabase
    .from("ai_usage")
    .select("call_count, input_tokens, output_tokens")
    .eq("user_id", userId)
    .eq("period", period)
    .single();
  return {
    callCount: data?.call_count || 0,
    inputTokens: data?.input_tokens || 0,
    outputTokens: data?.output_tokens || 0,
    limit: 50,
  };
}

// ─── Agent Executions (audit trail) ──────────────────────────────────────────
export async function getExecutions(filters = {}) {
  const userId = await getUserId();
  if (!userId) return [];
  const orgId = getOrgId();
  let query = supabase
    .from("agent_executions")
    .select("*")
    .order("created_at", { ascending: false });
  if (orgId) query = query.eq("org_id", orgId);
  else query = query.eq("user_id", userId);
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.agentId) query = query.eq("agent_id", filters.agentId);
  if (filters.accountId) query = query.eq("account_id", filters.accountId);
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);
  const { data, error } = await query;
  if (error) { console.error("[db] getExecutions:", error.message); return []; }
  return data.map(dbToExecution);
}

export async function createExecution(execution) {
  const userId = await getUserId();
  if (!userId) return execution;
  const row = executionToDb(execution, userId);
  const { error } = await supabase.from("agent_executions").insert(row);
  if (error) console.error("[db] createExecution:", error.message);
  return execution;
}

export async function updateExecution(id, updates) {
  const userId = await getUserId();
  if (!userId) return;
  const orgId = getOrgId();
  const dbUpdates = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.outputSummary !== undefined) dbUpdates.output_summary = updates.outputSummary;
  if (updates.executedAt !== undefined) dbUpdates.executed_at = updates.executedAt;
  if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage;
  if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;
  const query = supabase.from("agent_executions").update(dbUpdates).eq("id", id);
  if (orgId) query.eq("org_id", orgId);
  else query.eq("user_id", userId);
  await query;
}

// ─── Autonomy Settings (stored in organizations.settings.autonomy) ──────────
export async function getAutonomySettings() {
  const orgId = getOrgId();
  if (!orgId) return getDefaultAutonomySettings();
  const { data } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();
  return data?.settings?.autonomy || getDefaultAutonomySettings();
}

export async function saveAutonomySettings(autonomy) {
  const orgId = getOrgId();
  if (!orgId) return;
  // Read current settings, merge autonomy in
  const { data } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();
  const currentSettings = data?.settings || {};
  await supabase
    .from("organizations")
    .update({ settings: { ...currentSettings, autonomy }, updated_at: new Date().toISOString() })
    .eq("id", orgId);
}

function getDefaultAutonomySettings() {
  return { email_draft: "draft", risk_assessment: "draft", next_action: "draft", auto_approve_critical: false };
}

// ─── Org Settings (company profile lives here now) ──────────────────────────
export async function getOrgSettings() {
  const orgId = getOrgId();
  if (!orgId) return {};
  const { data } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();
  return data?.settings || {};
}

export async function saveOrgSettings(settings) {
  const orgId = getOrgId();
  if (!orgId) return;
  await supabase
    .from("organizations")
    .update({ settings, updated_at: new Date().toISOString() })
    .eq("id", orgId);
}

// ─── Data Transformers (DB ↔ App) ────────────────────────────────────────────

function dbToAccount(row) {
  return {
    id: row.id,
    name: row.name,
    arr: parseFloat(row.arr) || 0,
    renewalDate: row.renewal_date,
    riskLevel: row.risk_level || "medium",
    contacts: row.contacts || [],
    summary: row.summary || "",
    tags: row.tags || [],
    lastActivity: row.last_activity,
    createdAt: row.created_at,
  };
}

function accountToDb(account, userId) {
  const orgId = getOrgId();
  return {
    id: account.id,
    user_id: userId,
    org_id: orgId,
    name: account.name,
    arr: account.arr || 0,
    renewal_date: account.renewalDate || null,
    risk_level: account.riskLevel || "medium",
    contacts: account.contacts || [],
    summary: account.summary || "",
    tags: account.tags || [],
    last_activity: account.lastActivity || null,
    created_at: account.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function dbToContextItem(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    type: row.type,
    label: row.label,
    source: row.source,
    content: row.content,
    metadata: row.metadata || {},
    uploadedAt: row.uploaded_at,
  };
}

function contextItemToDb(item, accountId, userId) {
  const orgId = getOrgId();
  return {
    id: item.id,
    user_id: userId,
    org_id: orgId,
    account_id: accountId,
    type: item.type || "text",
    label: item.label,
    source: item.source || "manual",
    content: item.content,
    metadata: item.metadata || {},
    uploaded_at: item.uploadedAt || new Date().toISOString(),
  };
}

function dbToThread(row) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    lastMessageAt: row.last_message_at,
  };
}

function threadToDb(thread, accountId, userId) {
  const orgId = getOrgId();
  return {
    id: thread.id,
    user_id: userId,
    org_id: orgId,
    account_id: accountId,
    title: thread.title || "New Thread",
    created_at: thread.createdAt || new Date().toISOString(),
    last_message_at: thread.lastMessageAt || new Date().toISOString(),
  };
}

function dbToMessage(row) {
  return {
    role: row.role,
    content: row.content,
    timestamp: row.created_at,
    isError: row.is_error,
  };
}

function messageToDb(msg, threadId, userId) {
  const orgId = getOrgId();
  return {
    user_id: userId,
    org_id: orgId,
    thread_id: threadId,
    role: msg.role,
    content: msg.content,
    is_error: msg.isError || false,
    created_at: msg.timestamp || new Date().toISOString(),
  };
}

function dbToTask(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    accountId: row.account_id,
    accountName: row.account_name,
    status: row.status,
    dueDate: row.due_date,
    recurrence: row.recurrence,
    priority: row.priority,
    aiOutput: row.ai_output,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function taskToDb(task, userId) {
  const orgId = getOrgId();
  return {
    id: task.id,
    user_id: userId,
    org_id: orgId,
    title: task.title,
    type: task.type || "account",
    account_id: task.accountId || null,
    account_name: task.accountName || null,
    status: task.status || "pending",
    due_date: task.dueDate || null,
    recurrence: task.recurrence || "none",
    priority: task.priority || "medium",
    ai_output: task.aiOutput || null,
    created_at: task.createdAt || new Date().toISOString(),
    completed_at: task.completedAt || null,
    updated_at: new Date().toISOString(),
  };
}

function dbToAutopilotAction(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    accountName: row.account_name,
    type: row.type,
    title: row.title,
    description: row.description,
    draft: row.draft,
    urgency: row.urgency,
    reasoning: row.reasoning,
    status: row.status,
    createdAt: row.created_at,
  };
}

function autopilotActionToDb(action, userId) {
  const orgId = getOrgId();
  return {
    id: action.id,
    user_id: userId,
    org_id: orgId,
    account_id: action.accountId || null,
    account_name: action.accountName,
    type: action.type,
    title: action.title,
    description: action.description || "",
    draft: action.draft || "",
    urgency: action.urgency || "medium",
    reasoning: action.reasoning || "",
    status: action.status || "pending",
    created_at: action.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function dbToExecution(row) {
  return {
    id: row.id,
    agentId: row.agent_id,
    actionType: row.action_type,
    actionId: row.action_id,
    accountId: row.account_id,
    accountName: row.account_name,
    inputSummary: row.input_summary,
    outputSummary: row.output_summary,
    status: row.status,
    executedAt: row.executed_at,
    errorMessage: row.error_message,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

function executionToDb(execution, userId) {
  const orgId = getOrgId();
  return {
    id: execution.id,
    user_id: userId,
    org_id: orgId,
    agent_id: execution.agentId || "autopilot",
    action_type: execution.actionType || "next_action",
    action_id: execution.actionId || null,
    account_id: execution.accountId || null,
    account_name: execution.accountName || null,
    input_summary: execution.inputSummary || "",
    output_summary: execution.outputSummary || "",
    status: execution.status || "generated",
    executed_at: execution.executedAt || null,
    error_message: execution.errorMessage || null,
    metadata: execution.metadata || {},
    created_at: execution.createdAt || new Date().toISOString(),
  };
}
