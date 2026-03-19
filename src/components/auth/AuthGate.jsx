import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { migrateLocalToSupabase } from "../../lib/storage";
import { C, FONT_SANS, FONT_MONO } from "../../lib/tokens";

export default function AuthGate({ children }) {
  const { user, loading } = useAuthStore();

  // One-time migration: push localStorage data to Supabase
  useEffect(() => {
    if (user) migrateLocalToSupabase();
  }, [user]);

  // If Supabase is not configured, allow access (local dev without auth)
  if (!supabase) return children;

  if (loading) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: C.bgPrimary,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 700, color: C.bgPrimary,
          fontFamily: FONT_MONO, animation: "aiPulse 2s ease-in-out infinite",
        }}>B</div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textTertiary, fontWeight: 500 }}>
          Loading Base Command...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
