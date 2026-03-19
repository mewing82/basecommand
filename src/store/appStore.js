import { create } from "zustand";

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

  // Loading state
  loading: true,
  setLoading: (val) => set({ loading: val }),
}));
