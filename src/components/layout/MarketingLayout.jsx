import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { C, FONT_SANS, FONT_MONO } from "../../lib/tokens";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";

export default function MarketingLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hoveredLink, setHoveredLink] = useState(null);

  const isAuthenticated = supabase && user;

  return (
    <div style={{ minHeight: "100vh", background: C.bgPrimary, fontFamily: FONT_SANS }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 40px", maxWidth: 1200, margin: "0 auto",
        borderBottom: `1px solid ${C.borderDefault}`,
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: C.bgPrimary, fontFamily: FONT_MONO,
          }}>B</div>
          <span style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.03em" }}>
            Base Command
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            to="/pricing"
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: hoveredLink === "pricing" ? C.textPrimary : C.textSecondary,
              textDecoration: "none", transition: "color 0.15s",
            }}
            onMouseEnter={() => setHoveredLink("pricing")}
            onMouseLeave={() => setHoveredLink(null)}
          >
            Pricing
          </Link>

          {isAuthenticated ? (
            <button
              onClick={() => navigate("/app")}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: C.gold, color: C.bgPrimary,
                fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              Go to App
            </button>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                  color: hoveredLink === "login" ? C.textPrimary : C.textSecondary,
                  textDecoration: "none", transition: "color 0.15s",
                }}
                onMouseEnter={() => setHoveredLink("login")}
                onMouseLeave={() => setHoveredLink(null)}
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                style={{
                  padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                  background: C.gold, color: C.bgPrimary, textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Page content */}
      <Outlet />

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${C.borderDefault}`,
        padding: "32px 40px", maxWidth: 1200, margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 13, color: C.textTertiary }}>
          Base Command &copy; {new Date().getFullYear()}
        </span>
        <div style={{ display: "flex", gap: 24 }}>
          <Link to="/pricing" style={{ fontSize: 13, color: C.textTertiary, textDecoration: "none" }}>Pricing</Link>
          <Link to="/login" style={{ fontSize: 13, color: C.textTertiary, textDecoration: "none" }}>Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
