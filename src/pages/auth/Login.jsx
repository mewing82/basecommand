import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/app");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.bgPrimary, fontFamily: FONT_SANS, padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, margin: "0 auto 16px",
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: C.bgPrimary, fontFamily: FONT_MONO,
          }}>B</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em" }}>
            Welcome back
          </div>
          <div style={{ fontSize: 14, color: C.textTertiary, marginTop: 6, fontFamily: FONT_BODY }}>
            Sign in to Base Command
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14, outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = C.borderSubtle}
              onBlur={e => e.target.style.borderColor = C.borderDefault}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 14, outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = C.borderSubtle}
              onBlur={e => e.target.style.borderColor = C.borderDefault}
            />
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 16,
              background: C.redMuted, color: C.red, fontSize: 13, fontFamily: FONT_BODY,
              border: `1px solid ${C.red}20`,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
            color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
            cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
            transition: "all 0.15s", boxShadow: `0 4px 16px ${C.goldGlow}`,
          }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: C.textTertiary, fontFamily: FONT_BODY }}>
          Don&apos;t have an account?{" "}
          <Link to="/signup" style={{ color: C.gold, textDecoration: "none", fontWeight: 500 }}>
            Sign up
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/" style={{ fontSize: 13, color: C.textTertiary, textDecoration: "none", fontFamily: FONT_BODY }}>
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
