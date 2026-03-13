import { create } from "zustand";
import { store, getWorkspaces, getActiveWorkspaceId, createWorkspace, renameWorkspace as renameWs, deleteWorkspace as deleteWs, saveWorkspaces } from "../lib/storage";

const WS_DEFAULT_ID = "ws_default";

export const useAppStore = create((set, get) => ({
  // Sidebar
  sidebarCollapsed: localStorage.getItem("bc2-ui:sidebar-collapsed") === "true",
  setSidebarCollapsed: (val) => {
    localStorage.setItem("bc2-ui:sidebar-collapsed", String(val));
    set({ sidebarCollapsed: val });
  },
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    localStorage.setItem("bc2-ui:sidebar-collapsed", String(next));
    set({ sidebarCollapsed: next });
  },

  // Command Palette
  showCommandPalette: false,
  setShowCommandPalette: (val) => set({ showCommandPalette: val }),

  // Workspaces
  workspaces: getWorkspaces(),
  activeWsId: getActiveWorkspaceId(),

  switchWorkspace: (wsId) => {
    store.setWorkspace(wsId);
    set({ activeWsId: wsId });
  },

  createWorkspace: (name) => {
    const ws = createWorkspace(name);
    set({ workspaces: getWorkspaces() });
    return ws;
  },

  renameWorkspace: (wsId, newName) => {
    renameWs(wsId, newName);
    set({ workspaces: getWorkspaces() });
  },

  deleteWorkspace: (wsId) => {
    deleteWs(wsId);
    set({ workspaces: getWorkspaces(), activeWsId: getActiveWorkspaceId() });
  },

  // Loading state
  loading: true,
  setLoading: (val) => set({ loading: val }),
}));
