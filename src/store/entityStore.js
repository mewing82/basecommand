import { create } from "zustand";
import { store } from "../lib/storage";

export const useEntityStore = create((set, get) => ({
  decisions: [],
  tasks: [],
  priorities: [],
  meetings: [],
  projects: [],
  documents: [],
  ingestSessions: [],

  // Load all entity data from localStorage
  loadAll: async () => {
    await store.checkAndMigrate();
    const [decisions, tasks, priorities, meetings, projects, documents, ingestSessions] = await Promise.all([
      store.list("decision"),
      store.list("task"),
      store.list("priority"),
      store.list("meeting"),
      store.list("project"),
      store.list("document"),
      store.list("ingest"),
    ]);
    set({ decisions, tasks, priorities, meetings, projects, documents, ingestSessions });
  },

  // ─── Decisions ───────────────────────────────────────────────────────────
  setDecisions: (decisions) => set({ decisions }),
  addDecision: async (decision) => {
    await store.save("decision", decision);
    set({ decisions: [...get().decisions, decision] });
  },
  updateDecision: async (id, updates) => {
    const existing = get().decisions.find(d => d.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await store.save("decision", updated);
    set({ decisions: get().decisions.map(d => d.id === id ? updated : d) });
  },
  deleteDecision: async (id) => {
    await store.delete("decision", id);
    set({ decisions: get().decisions.filter(d => d.id !== id) });
  },

  // ─── Tasks ───────────────────────────────────────────────────────────────
  setTasks: (tasks) => set({ tasks }),
  addTask: async (task) => {
    await store.save("task", task);
    set({ tasks: [...get().tasks, task] });
  },
  updateTask: async (id, updates) => {
    const existing = get().tasks.find(t => t.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await store.save("task", updated);
    set({ tasks: get().tasks.map(t => t.id === id ? updated : t) });
  },
  deleteTask: async (id) => {
    await store.delete("task", id);
    set({ tasks: get().tasks.filter(t => t.id !== id) });
  },

  // ─── Priorities ──────────────────────────────────────────────────────────
  setPriorities: (priorities) => set({ priorities }),
  addPriority: async (priority) => {
    await store.save("priority", priority);
    set({ priorities: [...get().priorities, priority] });
  },
  updatePriority: async (id, updates) => {
    const existing = get().priorities.find(p => p.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await store.save("priority", updated);
    set({ priorities: get().priorities.map(p => p.id === id ? updated : p) });
  },
  deletePriority: async (id) => {
    await store.delete("priority", id);
    set({ priorities: get().priorities.filter(p => p.id !== id) });
  },

  // ─── Meetings ────────────────────────────────────────────────────────────
  setMeetings: (meetings) => set({ meetings }),
  addMeeting: async (meeting) => {
    await store.save("meeting", meeting);
    set({ meetings: [...get().meetings, meeting] });
  },

  // ─── Projects ────────────────────────────────────────────────────────────
  setProjects: (projects) => set({ projects }),
  addProject: async (project) => {
    await store.save("project", project);
    set({ projects: [...get().projects, project] });
  },
  updateProject: async (id, updates) => {
    const existing = get().projects.find(p => p.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await store.save("project", updated);
    set({ projects: get().projects.map(p => p.id === id ? updated : p) });
  },
  deleteProject: async (id) => {
    await store.delete("project", id);
    set({ projects: get().projects.filter(p => p.id !== id) });
  },

  // ─── Documents ───────────────────────────────────────────────────────────
  setDocuments: (documents) => set({ documents }),
  addDocument: async (doc) => {
    await store.save("document", doc);
    set({ documents: [...get().documents, doc] });
  },

  // ─── Ingest Sessions ────────────────────────────────────────────────────
  setIngestSessions: (ingestSessions) => set({ ingestSessions }),
  addIngestSession: async (session) => {
    await store.save("ingest", session);
    set({ ingestSessions: [...get().ingestSessions, session] });
  },
}));
