import { create } from "zustand";
import { supabase } from "../lib/supabase";

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

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
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ session, user });
      if (user) {
        get().fetchProfile(user.id);
      } else {
        set({ profile: null });
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
    set({ user: null, session: null, profile: null });
  },
}));
