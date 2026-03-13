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
export const renewalStore = {
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
};
