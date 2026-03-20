import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { migrateLocalToSupabase } from "../../lib/storage";
import { C, FONT_SANS } from "../../lib/tokens";

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
        <div style={{ animation: "aiPulse 2s ease-in-out infinite" }}>
          <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
            <path d="M8 8L22 22L8 36" stroke={C.gold} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 8L34 22L20 36" stroke={C.goldHover} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="34" cy="22" r="3.5" fill={C.aiBlue}/>
          </svg>
        </div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textTertiary, fontWeight: 500 }}>
          Loading BaseCommand...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
