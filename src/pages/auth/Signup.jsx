import { useState } from "react";
import { Link } from "react-router-dom";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useAuthStore } from "../../store/authStore";

export default function Signup() {
  const { signUp } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.bgPrimary, fontFamily: FONT_SANS, padding: 24,
      }}>
        <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 20px",
            background: C.greenMuted, border: `1px solid ${C.green}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, color: C.green,
          }}>&#10003;</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, marginBottom: 12, letterSpacing: "-0.03em" }}>
            Check your email
          </div>
          <div style={{ fontSize: 14, color: C.textTertiary, fontFamily: FONT_BODY, lineHeight: 1.7, marginBottom: 28 }}>
            We sent a confirmation link to <strong style={{ color: C.textSecondary }}>{email}</strong>. Click it to activate your account.
          </div>
          <Link to="/login" style={{
            display: "inline-block", padding: "10px 24px", borderRadius: 8,
            background: "transparent", border: `1px solid ${C.borderDefault}`,
            color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500,
            textDecoration: "none", transition: "all 0.15s",
          }}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
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
            Create your account
          </div>
          <div style={{ fontSize: 14, color: C.textTertiary, marginTop: 6, fontFamily: FONT_BODY }}>
            Start making better decisions
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 6 }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
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
              placeholder="At least 6 characters"
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: C.textTertiary, fontFamily: FONT_BODY }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: C.gold, textDecoration: "none", fontWeight: 500 }}>
            Sign in
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
