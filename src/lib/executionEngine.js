/**
 * Execution Engine — Core logic for supervised autopilot.
 * Executes approved actions, logs to agent_executions, checks autonomy settings.
 */
import { renewalStore } from "./storage";

// ─── Execute an approved action ─────────────────────────────────────────────
export async function executeAction(action) {
  const now = new Date().toISOString();
  let taskCreated = null;

  try {
    // 1. Create a task from the action
    taskCreated = createTaskFromAction(action);
    await renewalStore.saveTaskItem(taskCreated);

    // 2. Update the autopilot action status
    await renewalStore.updateAutopilotAction(action.id, {
      status: "approved",
      executed_at: now,
      execution_result: { taskId: taskCreated.id },
    });

    // 3. Log execution
    const execution = {
      id: `exec-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agentId: action.agentId || "autopilot",
      actionType: action.type || "next_action",
      actionId: action.id,
      accountId: action.accountId || null,
      accountName: action.accountName || null,
      inputSummary: action.title || "",
      outputSummary: `Task created: ${taskCreated.title}`,
      status: "executed",
      executedAt: now,
      metadata: { taskId: taskCreated.id, urgency: action.urgency },
      createdAt: now,
    };
    await renewalStore.createExecution(execution);

    return { success: true, taskId: taskCreated.id, execution };
  } catch (err) {
    // Log failed execution
    const failedExecution = {
      id: `exec-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agentId: action.agentId || "autopilot",
      actionType: action.type || "next_action",
      actionId: action.id,
      accountId: action.accountId || null,
      accountName: action.accountName || null,
      inputSummary: action.title || "",
      outputSummary: "",
      status: "failed",
      errorMessage: err.message,
      metadata: {},
      createdAt: now,
    };
    try { await renewalStore.createExecution(failedExecution); } catch { /* best effort */ }
    return { success: false, error: err.message };
  }
}

// ─── Dismiss an action with audit trail ─────────────────────────────────────
export async function dismissAction(action) {
  const now = new Date().toISOString();
  await renewalStore.updateAutopilotAction(action.id, { status: "dismissed" });

  const execution = {
    id: `exec-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    agentId: action.agentId || "autopilot",
    actionType: action.type || "next_action",
    actionId: action.id,
    accountId: action.accountId || null,
    accountName: action.accountName || null,
    inputSummary: action.title || "",
    outputSummary: "Action dismissed by user",
    status: "dismissed",
    metadata: { urgency: action.urgency },
    createdAt: now,
  };
  try { await renewalStore.createExecution(execution); } catch { /* best effort */ }
  return execution;
}

// ─── Check if an action should auto-execute based on autonomy settings ──────
export function shouldAutoExecute(action, autonomySettings) {
  if (!autonomySettings) return false;
  const actionType = action.type || "next_action";
  const level = autonomySettings[actionType];

  if (level === "execute") return true;
  if (autonomySettings.auto_approve_critical && action.urgency === "critical") return true;
  return false;
}

// ─── Build a task from an autopilot action ──────────────────────────────────
export function createTaskFromAction(action) {
  return {
    id: `task-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: action.title,
    type: "account",
    accountId: action.accountId || null,
    accountName: action.accountName || null,
    status: "pending",
    dueDate: null,
    recurrence: "none",
    priority: action.urgency === "critical" ? "high" : action.urgency || "medium",
    aiOutput: action.draft || action.description || null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}
