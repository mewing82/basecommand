import { safeParse } from "./utils";

// ─── Workspace Management ────────────────────────────────────────────────────
const GLOBAL_KEYS = ["bc2-workspaces", "bc2-active-workspace", "bc2-user-id", "bc2-meta:schema-version"];
const WS_DEFAULT_ID = "ws_default";

export function getWorkspaces() {
  const raw = localStorage.getItem("bc2-workspaces");
  return raw ? JSON.parse(raw) : [];
}

export function saveWorkspaces(list) {
  localStorage.setItem("bc2-workspaces", JSON.stringify(list));
}

export function getActiveWorkspaceId() {
  return localStorage.getItem("bc2-active-workspace") || WS_DEFAULT_ID;
}

export function createWorkspace(name, icon) {
  const ws = {
    id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    icon: icon || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const list = getWorkspaces();
  list.push(ws);
  saveWorkspaces(list);
  return ws;
}

export function renameWorkspace(wsId, newName) {
  const list = getWorkspaces();
  const ws = list.find(w => w.id === wsId);
  if (ws) { ws.name = newName.trim(); ws.updatedAt = new Date().toISOString(); }
  saveWorkspaces(list);
}

export function deleteWorkspace(wsId) {
  if (wsId === WS_DEFAULT_ID) return;
  const prefix = `bc2-${wsId}-`;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) keys.push(key);
  }
  keys.forEach(k => localStorage.removeItem(k));
  const list = getWorkspaces().filter(w => w.id !== wsId);
  saveWorkspaces(list);
  if (getActiveWorkspaceId() === wsId) {
    localStorage.setItem("bc2-active-workspace", WS_DEFAULT_ID);
  }
}

// ─── Core Data Store ─────────────────────────────────────────────────────────
export const store = {
  _ws: getActiveWorkspaceId(),
  setWorkspace(wsId) { this._ws = wsId; localStorage.setItem("bc2-active-workspace", wsId); },
  _key(entityType, id) { return `bc2-${this._ws}-${entityType}:${id}`; },
  _indexKey(entityType) { return `bc2-${this._ws}-${entityType}:index`; },
  _aiKey(entityType, entityId) { return `bc2-${this._ws}-${entityType}:${entityId}:ai-history`; },
  _linksKey(sourceType, sourceId) { return `bc2-${this._ws}-links:${sourceType}:${sourceId}`; },

  async get(entityType, id) {
    const raw = localStorage.getItem(this._key(entityType, id));
    return safeParse(raw, null);
  },

  async save(entityType, entity) {
    const key = this._key(entityType, entity.id);
    entity.updatedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(entity));
    const idxKey = this._indexKey(entityType);
    const raw = localStorage.getItem(idxKey);
    const ids = safeParse(raw, []);
    if (!ids.includes(entity.id)) {
      ids.push(entity.id);
      localStorage.setItem(idxKey, JSON.stringify(ids));
    }
    return entity;
  },

  async delete(entityType, id) {
    localStorage.removeItem(this._key(entityType, id));
    const idxKey = this._indexKey(entityType);
    const raw = localStorage.getItem(idxKey);
    if (raw) {
      const ids = safeParse(raw, []).filter(i => i !== id);
      localStorage.setItem(idxKey, JSON.stringify(ids));
    }
  },

  async list(entityType) {
    const idxKey = this._indexKey(entityType);
    const raw = localStorage.getItem(idxKey);
    if (!raw) return [];
    const ids = safeParse(raw, []);
    const results = [];
    for (const id of ids) {
      const entity = await this.get(entityType, id);
      if (entity) results.push(entity);
    }
    return results;
  },

  async link(sourceType, sourceId, targetType, targetId) {
    const fwdKey = this._linksKey(sourceType, sourceId);
    const fwdRaw = localStorage.getItem(fwdKey);
    const fwd = safeParse(fwdRaw, []);
    const ref = { type: targetType, id: targetId };
    if (!fwd.some(r => r.type === targetType && r.id === targetId)) {
      fwd.push(ref);
      localStorage.setItem(fwdKey, JSON.stringify(fwd));
    }
    const revKey = this._linksKey(targetType, targetId);
    const revRaw = localStorage.getItem(revKey);
    const rev = safeParse(revRaw, []);
    const revRef = { type: sourceType, id: sourceId };
    if (!rev.some(r => r.type === sourceType && r.id === sourceId)) {
      rev.push(revRef);
      localStorage.setItem(revKey, JSON.stringify(rev));
    }
  },

  async getLinks(sourceType, sourceId) {
    const key = this._linksKey(sourceType, sourceId);
    const raw = localStorage.getItem(key);
    return safeParse(raw, []);
  },

  async getAIHistory(entityType, entityId) {
    const key = this._aiKey(entityType, entityId);
    const raw = localStorage.getItem(key);
    return safeParse(raw, []);
  },

  async appendAIHistory(entityType, entityId, interaction) {
    const key = this._aiKey(entityType, entityId);
    const raw = localStorage.getItem(key);
    const history = safeParse(raw, []);
    history.push(interaction);
    const trimmed = history.slice(-50);
    localStorage.setItem(key, JSON.stringify(trimmed));
  },

  async checkAndMigrate() {
    const versionKey = "bc2-meta:schema-version";
    const current = localStorage.getItem(versionKey);

    if (!localStorage.getItem("bc2-workspaces")) {
      const entityTypes = ["decision", "task", "priority", "meeting", "ingest", "document", "project", "links", "digest", "connector", "copilot"];
      const keysToMigrate = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("bc2-")) continue;
        if (GLOBAL_KEYS.includes(key)) continue;
        if (key.startsWith("bc2-ui:")) continue;
        if (key.match(/^bc2-ws_/)) continue;
        const afterPrefix = key.slice(4);
        if (entityTypes.some(t => afterPrefix.startsWith(t + ":") || afterPrefix.startsWith(t + "-"))) {
          keysToMigrate.push(key);
        }
      }
      const copilotKey = "bc-copilot-dashboard";
      if (localStorage.getItem(copilotKey)) {
        const val = localStorage.getItem(copilotKey);
        localStorage.setItem(`bc2-${WS_DEFAULT_ID}-copilot-dashboard`, val);
        localStorage.removeItem(copilotKey);
      }
      for (const key of keysToMigrate) {
        const val = localStorage.getItem(key);
        const newKey = key.replace(/^bc2-/, `bc2-${WS_DEFAULT_ID}-`);
        localStorage.setItem(newKey, val);
        localStorage.removeItem(key);
      }
      const defaultWs = { id: WS_DEFAULT_ID, name: "Default", icon: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      saveWorkspaces([defaultWs]);
      localStorage.setItem("bc2-active-workspace", WS_DEFAULT_ID);
      this._ws = WS_DEFAULT_ID;
    }

    if (current !== "3.0") {
      localStorage.setItem(versionKey, "3.0");
    }
  },

  exportAll() {
    const prefix = `bc2-${this._ws}-`;
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  },

  importAll(data) {
    for (const [key, val] of Object.entries(data)) {
      if (key.startsWith("bc2-")) {
        localStorage.setItem(key, val);
      }
    }
  },

  clearAll() {
    const prefix = `bc2-${this._ws}-`;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
  },
};

// ─── Renewals Data Layer ─────────────────────────────────────────────────────
// localStorage-based implementation (used as fallback when Supabase is unavailable)
export const _localRenewalStore = {
  _key(suffix) { return `bc2-${store._ws}-renewals-${suffix}`; },

  // Accounts
  getAccounts() { return safeParse(localStorage.getItem(this._key("accounts")), []); },
  saveAccounts(accounts) { localStorage.setItem(this._key("accounts"), JSON.stringify(accounts)); },
  getAccount(id) { return this.getAccounts().find(a => a.id === id) || null; },
  saveAccount(account) {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) accounts[idx] = account;
    else accounts.push(account);
    this.saveAccounts(accounts);
    return account;
  },
  deleteAccount(id) {
    this.saveAccounts(this.getAccounts().filter(a => a.id !== id));
    const threads = this.getThreads(id);
    threads.forEach(t => localStorage.removeItem(this._key(`thread-${t.id}`)));
    localStorage.removeItem(this._key(`threads-${id}`));
    localStorage.removeItem(this._key(`context-${id}`));
  },

  // Context items (per account)
  getContext(accountId) { return safeParse(localStorage.getItem(this._key(`context-${accountId}`)), []); },
  saveContext(accountId, items) { localStorage.setItem(this._key(`context-${accountId}`), JSON.stringify(items)); },
  addContextItem(accountId, item) {
    const items = this.getContext(accountId);
    items.push(item);
    this.saveContext(accountId, items);
    return item;
  },
  deleteContextItem(accountId, itemId) {
    this.saveContext(accountId, this.getContext(accountId).filter(i => i.id !== itemId));
  },

  // Threads (per account)
  getThreads(accountId) { return safeParse(localStorage.getItem(this._key(`threads-${accountId}`)), []); },
  saveThreads(accountId, threads) { localStorage.setItem(this._key(`threads-${accountId}`), JSON.stringify(threads)); },
  addThread(accountId, thread) {
    const threads = this.getThreads(accountId);
    threads.push(thread);
    this.saveThreads(accountId, threads);
    return thread;
  },
  deleteThread(accountId, threadId) {
    this.saveThreads(accountId, this.getThreads(accountId).filter(t => t.id !== threadId));
    localStorage.removeItem(this._key(`thread-${threadId}`));
  },

  // Messages (per thread)
  getMessages(threadId) { return safeParse(localStorage.getItem(this._key(`thread-${threadId}`)), []); },
  saveMessages(threadId, messages) { localStorage.setItem(this._key(`thread-${threadId}`), JSON.stringify(messages)); },
  addMessage(threadId, message) {
    const messages = this.getMessages(threadId);
    messages.push(message);
    this.saveMessages(threadId, messages);
    return message;
  },

  // KB Documents
  getKBDocs() { return safeParse(localStorage.getItem(this._key("kb-docs")), []); },
  saveKBDocs(docs) { localStorage.setItem(this._key("kb-docs"), JSON.stringify(docs)); },
  getKBContent(docId) { return localStorage.getItem(this._key(`kb-content-${docId}`)) || ""; },
  saveKBDoc(doc, content) {
    const docs = this.getKBDocs();
    const idx = docs.findIndex(d => d.id === doc.id);
    if (idx >= 0) docs[idx] = doc;
    else docs.push(doc);
    this.saveKBDocs(docs);
    if (content !== undefined) localStorage.setItem(this._key(`kb-content-${doc.id}`), content);
    return doc;
  },
  deleteKBDoc(docId) {
    this.saveKBDocs(this.getKBDocs().filter(d => d.id !== docId));
    localStorage.removeItem(this._key(`kb-content-${docId}`));
  },

  // Metrics
  getMetrics() { return safeParse(localStorage.getItem(this._key("metrics")), null); },
  saveMetrics(metrics) { localStorage.setItem(this._key("metrics"), JSON.stringify(metrics)); },

  // Settings
  getSettings() { return safeParse(localStorage.getItem(this._key("settings")), {}); },
  saveSettings(settings) { localStorage.setItem(this._key("settings"), JSON.stringify(settings)); },

  // Autopilot Actions
  getAutopilotActions() { return safeParse(localStorage.getItem(this._key("autopilot-actions")), []); },
  saveAutopilotActions(actions) { localStorage.setItem(this._key("autopilot-actions"), JSON.stringify(actions)); },
  addAutopilotAction(action) {
    const actions = this.getAutopilotActions();
    actions.push(action);
    this.saveAutopilotActions(actions);
    return action;
  },
  updateAutopilotAction(id, updates) {
    const actions = this.getAutopilotActions();
    const idx = actions.findIndex(a => a.id === id);
    if (idx >= 0) { actions[idx] = { ...actions[idx], ...updates }; this.saveAutopilotActions(actions); }
  },

  // Agent Executions (localStorage fallback)
  getExecutions(filters = {}) {
    const all = safeParse(localStorage.getItem(this._key("executions")), []);
    let filtered = all;
    if (filters.status && filters.status !== "all") filtered = filtered.filter(e => e.status === filters.status);
    if (filters.agentId) filtered = filtered.filter(e => e.agentId === filters.agentId);
    if (filters.accountId) filtered = filtered.filter(e => e.accountId === filters.accountId);
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    return filtered.slice(offset, offset + limit);
  },
  createExecution(execution) {
    const all = safeParse(localStorage.getItem(this._key("executions")), []);
    all.push(execution);
    localStorage.setItem(this._key("executions"), JSON.stringify(all));
    return execution;
  },
  updateExecution(id, updates) {
    const all = safeParse(localStorage.getItem(this._key("executions")), []);
    const idx = all.findIndex(e => e.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...updates }; localStorage.setItem(this._key("executions"), JSON.stringify(all)); }
  },

  // Autonomy Settings (localStorage fallback)
  getAutonomySettings() {
    return safeParse(localStorage.getItem(this._key("autonomy-settings")), { email_draft: "draft", risk_assessment: "draft", next_action: "draft", auto_approve_critical: false });
  },
  saveAutonomySettings(settings) {
    localStorage.setItem(this._key("autonomy-settings"), JSON.stringify(settings));
  },

  // Expansion Cache
  getExpansionCache() { return safeParse(localStorage.getItem(this._key("expansion-cache")), null); },
  saveExpansionCache(data) { localStorage.setItem(this._key("expansion-cache"), JSON.stringify(data)); },

  // Leadership Cache
  getLeadershipCache() { return safeParse(localStorage.getItem(this._key("leadership-cache")), null); },
  saveLeadershipCache(data) { localStorage.setItem(this._key("leadership-cache"), JSON.stringify(data)); },

  // Renewal Tasks (account actions + portfolio operations)
  getTaskItems() { return safeParse(localStorage.getItem(this._key("task-items")), []); },
  saveTaskItems(tasks) { localStorage.setItem(this._key("task-items"), JSON.stringify(tasks)); },
  saveTaskItem(task) {
    const tasks = this.getTaskItems();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) tasks[idx] = task;
    else tasks.push(task);
    this.saveTaskItems(tasks);
    return task;
  },
  updateTaskItem(id, updates) {
    const tasks = this.getTaskItems();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx >= 0) { tasks[idx] = { ...tasks[idx], ...updates }; this.saveTaskItems(tasks); }
  },
  deleteTaskItem(id) {
    this.saveTaskItems(this.getTaskItems().filter(t => t.id !== id));
  },
};

// ─── Smart Renewal Store (Supabase with localStorage fallback) ───────────────
// Wraps each method: tries Supabase first, falls back to localStorage if
// Supabase is unavailable or user is not authenticated.
import { supabase } from "./supabase";
import * as db from "./supabaseStorage";

async function isSupabaseReady() {
  if (!supabase) return false;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user?.id;
  } catch { return false; }
}

// ─── One-time localStorage → Supabase migration ─────────────────────────────
// Runs once per user. Pushes any existing localStorage data up to Supabase.
const MIGRATION_KEY = "bc2-supabase-migrated";

export async function migrateLocalToSupabase() {
  if (localStorage.getItem(MIGRATION_KEY)) return; // already migrated
  if (!(await isSupabaseReady())) return;

  try {
    // Migrate accounts
    const accounts = _localRenewalStore.getAccounts();
    if (accounts.length > 0) {
      // Check if Supabase already has data (don't overwrite)
      const existing = await db.getAccounts();
      if (existing.length === 0) {
        for (const a of accounts) {
          try { await db.saveAccount(a); } catch (e) { console.warn("[migrate] account:", e.message); }
        }
        // Migrate context for each account
        for (const a of accounts) {
          const ctx = _localRenewalStore.getContext(a.id);
          if (ctx.length > 0) {
            for (const item of ctx) {
              try { await db.addContextItem(a.id, item); } catch (e) { console.warn("[migrate] context:", e.message); }
            }
          }
          // Migrate threads
          const threads = _localRenewalStore.getThreads(a.id);
          for (const t of threads) {
            try { await db.addThread(a.id, t); } catch (e) { console.warn("[migrate] thread:", e.message); }
            const msgs = _localRenewalStore.getMessages(t.id);
            for (const m of msgs) {
              try { await db.addMessage(t.id, m); } catch (e) { console.warn("[migrate] message:", e.message); }
            }
          }
        }
        console.log(`[migrate] Migrated ${accounts.length} accounts to Supabase`);
      }
    }

    // Migrate tasks
    const tasks = _localRenewalStore.getTaskItems();
    if (tasks.length > 0) {
      const existingTasks = await db.getTaskItems();
      if (existingTasks.length === 0) {
        for (const t of tasks) {
          try { await db.saveTaskItem(t); } catch (e) { console.warn("[migrate] task:", e.message); }
        }
      }
    }

    // Migrate settings
    const settings = _localRenewalStore.getSettings();
    if (settings && Object.keys(settings).length > 0) {
      try { await db.saveSettings(settings); } catch (e) { console.warn("[migrate] settings:", e.message); }
    }

    // Migrate KB docs
    const kbDocs = _localRenewalStore.getKBDocs();
    if (kbDocs.length > 0) {
      const existingDocs = await db.getKBDocs();
      if (existingDocs.length === 0) {
        for (const doc of kbDocs) {
          const content = _localRenewalStore.getKBContent(doc.id);
          try { await db.saveKBDoc(doc, content); } catch (e) { console.warn("[migrate] kb:", e.message); }
        }
      }
    }

    // Migrate autopilot actions
    const actions = _localRenewalStore.getAutopilotActions();
    if (actions.length > 0) {
      const existingActions = await db.getAutopilotActions();
      if (existingActions.length === 0) {
        try { await db.saveAutopilotActions(actions); } catch (e) { console.warn("[migrate] autopilot:", e.message); }
      }
    }

    localStorage.setItem(MIGRATION_KEY, new Date().toISOString());
    console.log("[migrate] localStorage → Supabase migration complete");
  } catch (e) {
    console.error("[migrate] Migration failed:", e.message);
  }
}

function makeAsyncMethod(dbFn, localFn) {
  return async function (...args) {
    if (await isSupabaseReady()) {
      try { return await dbFn(...args); }
      catch (e) { console.warn("[renewalStore] Supabase error, falling back to localStorage:", e.message); }
    }
    return localFn(...args);
  };
}

export const renewalStore = {
  _key(suffix) { return _localRenewalStore._key(suffix); },

  // Accounts
  getAccounts: makeAsyncMethod(db.getAccounts, () => _localRenewalStore.getAccounts()),
  getAccount: makeAsyncMethod(db.getAccount, (id) => _localRenewalStore.getAccount(id)),
  saveAccount: makeAsyncMethod(db.saveAccount, (a) => _localRenewalStore.saveAccount(a)),
  saveAccounts: makeAsyncMethod(db.saveAccounts, (a) => _localRenewalStore.saveAccounts(a)),
  deleteAccount: makeAsyncMethod(db.deleteAccount, (id) => _localRenewalStore.deleteAccount(id)),

  // Context
  getContext: makeAsyncMethod(db.getContext, (aid) => _localRenewalStore.getContext(aid)),
  saveContext: makeAsyncMethod(db.saveContext, (aid, items) => _localRenewalStore.saveContext(aid, items)),
  addContextItem: makeAsyncMethod(db.addContextItem, (aid, item) => _localRenewalStore.addContextItem(aid, item)),
  deleteContextItem: makeAsyncMethod(db.deleteContextItem, (aid, iid) => _localRenewalStore.deleteContextItem(aid, iid)),

  // Threads
  getThreads: makeAsyncMethod(db.getThreads, (aid) => _localRenewalStore.getThreads(aid)),
  saveThreads: makeAsyncMethod(db.saveThreads, (aid, t) => _localRenewalStore.saveThreads(aid, t)),
  addThread: makeAsyncMethod(db.addThread, (aid, t) => _localRenewalStore.addThread(aid, t)),
  deleteThread: makeAsyncMethod(db.deleteThread, (aid, tid) => _localRenewalStore.deleteThread(aid, tid)),

  // Messages
  getMessages: makeAsyncMethod(db.getMessages, (tid) => _localRenewalStore.getMessages(tid)),
  saveMessages: makeAsyncMethod(db.saveMessages, (tid, m) => _localRenewalStore.saveMessages(tid, m)),
  addMessage: makeAsyncMethod(db.addMessage, (tid, m) => _localRenewalStore.addMessage(tid, m)),

  // KB Docs
  getKBDocs: makeAsyncMethod(db.getKBDocs, () => _localRenewalStore.getKBDocs()),
  getKBContent: makeAsyncMethod(db.getKBContent, (id) => _localRenewalStore.getKBContent(id)),
  saveKBDoc: makeAsyncMethod(db.saveKBDoc, (doc, c) => _localRenewalStore.saveKBDoc(doc, c)),
  deleteKBDoc: makeAsyncMethod(db.deleteKBDoc, (id) => _localRenewalStore.deleteKBDoc(id)),

  // Metrics
  getMetrics: makeAsyncMethod(db.getMetrics, () => _localRenewalStore.getMetrics()),
  saveMetrics: makeAsyncMethod(db.saveMetrics, (m) => _localRenewalStore.saveMetrics(m)),

  // Settings
  getSettings: makeAsyncMethod(db.getSettings, () => _localRenewalStore.getSettings()),
  saveSettings: makeAsyncMethod(db.saveSettings, (s) => _localRenewalStore.saveSettings(s)),

  // Autopilot Actions
  getAutopilotActions: makeAsyncMethod(db.getAutopilotActions, () => _localRenewalStore.getAutopilotActions()),
  saveAutopilotActions: makeAsyncMethod(db.saveAutopilotActions, (a) => _localRenewalStore.saveAutopilotActions(a)),
  addAutopilotAction: makeAsyncMethod(db.addAutopilotAction, (a) => _localRenewalStore.addAutopilotAction(a)),
  updateAutopilotAction: makeAsyncMethod(db.updateAutopilotAction, (id, u) => _localRenewalStore.updateAutopilotAction(id, u)),

  // Expansion Cache
  getExpansionCache: makeAsyncMethod(() => db.getAnalysisCache("expansion"), () => _localRenewalStore.getExpansionCache()),
  saveExpansionCache: makeAsyncMethod((d) => db.saveAnalysisCache("expansion", d), (d) => _localRenewalStore.saveExpansionCache(d)),

  // Leadership Cache
  getLeadershipCache: makeAsyncMethod(() => db.getAnalysisCache("leadership"), () => _localRenewalStore.getLeadershipCache()),
  saveLeadershipCache: makeAsyncMethod((d) => db.saveAnalysisCache("leadership", d), (d) => _localRenewalStore.saveLeadershipCache(d)),

  // Agent Executions
  getExecutions: makeAsyncMethod(db.getExecutions, (f) => _localRenewalStore.getExecutions(f)),
  createExecution: makeAsyncMethod(db.createExecution, (e) => _localRenewalStore.createExecution(e)),
  updateExecution: makeAsyncMethod(db.updateExecution, (id, u) => _localRenewalStore.updateExecution(id, u)),

  // Autonomy Settings
  getAutonomySettings: makeAsyncMethod(db.getAutonomySettings, () => _localRenewalStore.getAutonomySettings()),
  saveAutonomySettings: makeAsyncMethod(db.saveAutonomySettings, (s) => _localRenewalStore.saveAutonomySettings(s)),

  // Task Items
  getTaskItems: makeAsyncMethod(db.getTaskItems, () => _localRenewalStore.getTaskItems()),
  saveTaskItems: makeAsyncMethod(db.saveTaskItems, (t) => _localRenewalStore.saveTaskItems(t)),
  saveTaskItem: makeAsyncMethod(db.saveTaskItem, (t) => _localRenewalStore.saveTaskItem(t)),
  updateTaskItem: makeAsyncMethod(db.updateTaskItem, (id, u) => _localRenewalStore.updateTaskItem(id, u)),
  deleteTaskItem: makeAsyncMethod(db.deleteTaskItem, (id) => _localRenewalStore.deleteTaskItem(id)),
};
