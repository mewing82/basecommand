import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { C, FONT_SANS, FONT_MONO } from "../../lib/tokens";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { useMediaQuery } from "../../lib/useMediaQuery";

export default function MarketingLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { isMobile } = useMediaQuery();
  const [hoveredLink, setHoveredLink] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);

  const isAuthenticated = supabase && user;
  const isSignupPage = location.pathname === "/signup" || location.pathname === "/login";

  // Sticky CTA: show after scrolling past hero (~400px)
  useEffect(() => {
    if (!isMobile || isAuthenticated || isSignupPage) return;
    const onScroll = () => setShowStickyCta(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile, isAuthenticated, isSignupPage]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div style={{ minHeight: "100vh", background: C.bgPrimary, fontFamily: FONT_SANS, overflowX: "hidden" }}>
      {/* Nav */}
      <nav className="bc-marketing-nav" style={{
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

        {/* Desktop nav links */}
        <div className="bc-marketing-nav-links" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            to="/pricing"
            className="bc-nav-hide-mobile"
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
          <Link
            to="/agents"
            className="bc-nav-hide-mobile"
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: hoveredLink === "agents" ? C.textPrimary : C.textSecondary,
              textDecoration: "none", transition: "color 0.15s",
            }}
            onMouseEnter={() => setHoveredLink("agents")}
            onMouseLeave={() => setHoveredLink(null)}
          >
            Agents
          </Link>
          <Link
            to="/why"
            className="bc-nav-hide-mobile"
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: hoveredLink === "why" ? C.textPrimary : C.textSecondary,
              textDecoration: "none", transition: "color 0.15s",
            }}
            onMouseEnter={() => setHoveredLink("why")}
            onMouseLeave={() => setHoveredLink(null)}
          >
            The Problem
          </Link>
          <Link
            to="/how-it-works"
            className="bc-nav-hide-mobile"
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: hoveredLink === "how" ? C.textPrimary : C.textSecondary,
              textDecoration: "none", transition: "color 0.15s",
            }}
            onMouseEnter={() => setHoveredLink("how")}
            onMouseLeave={() => setHoveredLink(null)}
          >
            How It Works
          </Link>

          {isAuthenticated ? (
            <button
              onClick={() => navigate("/app")}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: C.gold, color: C.bgPrimary,
                fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
                minHeight: 44,
              }}
            >
              Go to App
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="bc-nav-hide-mobile"
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
                className="bc-nav-hide-mobile"
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

          {/* Mobile hamburger */}
          <button
            className="bc-mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "none", border: "none", color: C.textSecondary,
              cursor: "pointer", padding: 8, display: "flex", alignItems: "center",
              minWidth: 44, minHeight: 44, justifyContent: "center",
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div style={{
          background: C.bgCard, borderBottom: `1px solid ${C.borderDefault}`,
          padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4,
        }}>
          {[
            { to: "/pricing", label: "Pricing" },
            { to: "/agents", label: "Agents" },
            { to: "/why", label: "The Problem" },
            { to: "/how-it-works", label: "How It Works" },
            { to: "/get-started", label: "Get Started" },
          ].map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)} style={{
              padding: "12px 12px", borderRadius: 8, fontSize: 16, fontWeight: 500,
              color: C.textSecondary, textDecoration: "none", minHeight: 44,
              display: "flex", alignItems: "center",
            }}>{link.label}</Link>
          ))}
          {!isAuthenticated && (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{
                padding: "12px 12px", borderRadius: 8, fontSize: 16, fontWeight: 500,
                color: C.textSecondary, textDecoration: "none", minHeight: 44,
                display: "flex", alignItems: "center",
              }}>Sign in</Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)} style={{
                padding: "12px 12px", borderRadius: 8, fontSize: 16, fontWeight: 600,
                color: C.gold, textDecoration: "none", minHeight: 44,
                display: "flex", alignItems: "center",
              }}>Get Started</Link>
            </>
          )}
        </div>
      )}

      {/* Page content — add bottom padding on mobile for sticky CTA */}
      <div style={{ paddingBottom: isMobile && showStickyCta ? 72 : 0 }}>
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="bc-footer" style={{
        borderTop: `1px solid ${C.borderDefault}`,
        padding: "32px 40px", maxWidth: 1200, margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 13, color: C.textTertiary }}>
          Base Command &copy; {new Date().getFullYear()}
        </span>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link to="/pricing" style={{ fontSize: 13, color: C.textTertiary, textDecoration: "none" }}>Pricing</Link>
          <Link to="/agents" style={{ fontSize: 13, color: C.textTertiary, textDecoration: "none" }}>Agents</Link>
          <Link to="/why" style={{ fontSize: 13, color: C.textTertiary, textDecoration: "none" }}>The Problem</Link>
          <Link to="/how-it-works" style={{ fontSize: 13, color: C.textTertiary, textDecoration: "none" }}>How It Works</Link>
          <Link to="/login" style={{ fontSize: 13, color: C.textTertiary, textDecoration: "none" }}>Sign in</Link>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      {isMobile && showStickyCta && !isAuthenticated && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: C.bgCard, borderTop: `1px solid ${C.borderDefault}`,
          padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12,
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
              Start your 14-day Pro trial
            </div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textTertiary }}>
              Free — no credit card
            </div>
          </div>
          <Link to="/signup" style={{
            padding: "10px 20px", borderRadius: 10,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
            textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
            minHeight: 44, whiteSpace: "nowrap",
          }}>
            Start Free <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
