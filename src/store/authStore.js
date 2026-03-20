import { create } from "zustand";
import { supabase } from "../lib/supabase";

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  // Org context
  activeOrgId: localStorage.getItem("bc2-active-org-id") || null,
  userOrgs: [],

  fetchProfile: async (userId) => {
    if (!supabase || !userId) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error && data) {
      set({ profile: data });
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!supabase || !user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    set({ profile: data });
    return data;
  },

  acceptPendingInvites: async () => {
    if (!supabase) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) return;
      await fetch("/api/org?action=accept-invites", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
    } catch { /* skip — invites are best-effort */ }
  },

  fetchOrgs: async (userId) => {
    if (!supabase || !userId) return;

    // Auto-accept any pending invites before loading orgs
    await get().acceptPendingInvites();

    const { data, error } = await supabase
      .from("org_members")
      .select("org_id, role, organizations(id, name, slug)")
      .eq("user_id", userId);
    if (error || !data) return;

    const orgs = data.map(m => ({
      id: m.org_id,
      name: m.organizations?.name || "Organization",
      slug: m.organizations?.slug,
      role: m.role,
    }));
    set({ userOrgs: orgs });

    // Set active org if not set or invalid
    const { activeOrgId } = get();
    if (!activeOrgId || !orgs.find(o => o.id === activeOrgId)) {
      if (orgs.length > 0) {
        localStorage.setItem("bc2-active-org-id", orgs[0].id);
        set({ activeOrgId: orgs[0].id });
      }
    }
  },

  setActiveOrg: (orgId) => {
    localStorage.setItem("bc2-active-org-id", orgId);
    set({ activeOrgId: orgId });
  },

  initialize: async () => {
    if (!supabase) {
      set({ loading: false });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    set({ session, user, loading: false });

    if (user) {
      get().fetchProfile(user.id);
      get().fetchOrgs(user.id);
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ session, user });
      if (user) {
        get().fetchProfile(user.id);
        get().fetchOrgs(user.id);
      } else {
        set({ profile: null, userOrgs: [], activeOrgId: null });
        localStorage.removeItem("bc2-active-org-id");
      }
    });
  },

  signUp: async (email, password, name) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email, password) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signInWithGoogle: async (plan, redirectPath) => {
    if (!supabase) throw new Error("Supabase not configured");
    // Store plan for post-auth checkout redirect
    if (plan) localStorage.setItem("bc-signup-plan", plan);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectPath || "/app"}`,
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, session: null, profile: null, userOrgs: [], activeOrgId: null });
    localStorage.removeItem("bc2-active-org-id");
  },
}));
