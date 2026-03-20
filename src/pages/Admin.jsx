import { useState, useEffect, useCallback } from "react";
import { Shield, Users, Zap, Clock, AlertTriangle, Search, ChevronDown, Check, Database } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { PageLayout } from "../components/layout/PageLayout";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import { loadStressTest } from "../lib/stressTestData";

const TIER_COLORS = {
  pro: { bg: C.goldMuted, color: C.gold, label: "Pro" },
  pro_trial: { bg: `${C.aiBlue}14`, color: C.aiBlue, label: "Trial" },
  free: { bg: `${C.textTertiary}14`, color: C.textTertiary, label: "Free" },
  team: { bg: `${C.purple}14`, color: C.purple, label: "Team" },
};

const ROLE_COLORS = {
  admin: { bg: `${C.red}14`, color: C.red, label: "Admin" },
  user: { bg: `${C.textTertiary}14`, color: C.textTertiary, label: "User" },
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Admin() {
  const { isMobile } = useMediaQuery();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  }, []);

  async function loadUsers() {
    const token = await getToken();
    if (!token) { setError("Not authenticated"); setLoading(false); return; }
    try {
      const res = await fetch("/api/admin?action=users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleUpdate(userId, updates) {
    setSaving(true);
    const token = await getToken();
    try {
      const res = await fetch("/api/admin?action=update-sub", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, ...updates }),
      });
      if (!res.ok) throw new Error("Update failed");
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  const filtered = users.filter(u =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    pro: users.filter(u => u.tier === "pro").length,
    trial: users.filter(u => u.tier === "pro_trial").length,
    free: users.filter(u => u.tier === "free").length,
  };

  if (loading) {
    return (
      <PageLayout maxWidth={1100}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, padding: 40, textAlign: "center" }}>
          Loading admin dashboard...
        </div>
      </PageLayout>
    );
  }

  if (error && users.length === 0) {
    return (
      <PageLayout maxWidth={1100}>
        <div style={{ padding: 40, textAlign: "center" }}>
          <Shield size={32} style={{ color: C.red, marginBottom: 12 }} />
          <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>
            Access Denied
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary }}>
            {error}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth={1100}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isMobile ? 16 : 24 }}>
        <Shield size={22} style={{ color: C.gold }} />
        <div style={{ fontFamily: FONT_SANS, fontSize: fs(26, 20, isMobile), fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em" }}>
          Admin
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: C.textPrimary },
          { label: "Pro", value: stats.pro, icon: Zap, color: C.gold },
          { label: "Trial", value: stats.trial, icon: Clock, color: C.aiBlue },
          { label: "Free", value: stats.free, icon: AlertTriangle, color: C.textTertiary },
        ].map(s => (
          <div key={s.label} style={{
            padding: "16px 18px", borderRadius: 10,
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <s.icon size={14} style={{ color: s.color }} />
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {s.label}
              </span>
            </div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 24, fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Admin Tools */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 20, padding: "14px 18px",
        background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10,
      }}>
        <button onClick={async () => {
          if (!confirm("Load 20 stress test accounts with context data?")) return;
          const count = await loadStressTest();
          alert(`Loaded ${count} accounts. Reload the page.`);
        }} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.borderDefault}`,
          background: "transparent", color: C.textSecondary,
          fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, cursor: "pointer",
        }}>
          <Database size={14} /> Load Stress Test (20 accounts)
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textTertiary }} />
        <input
          type="text"
          placeholder="Search users by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px 10px 34px", borderRadius: 8,
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 13,
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Users table */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12,
        overflow: "hidden",
      }}>
        {/* Header row */}
        {!isMobile && (
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 100px",
            padding: "10px 16px", borderBottom: `1px solid ${C.borderDefault}`,
            background: "rgba(0,0,0,0.02)",
          }}>
            {["Email", "Tier", "Status", "Role", "AI Calls", "Actions"].map(h => (
              <div key={h} style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                {h}
              </div>
            ))}
          </div>
        )}

        {/* User rows */}
        {filtered.map(user => {
          const tierInfo = TIER_COLORS[user.tier] || TIER_COLORS.free;
          const roleInfo = ROLE_COLORS[user.role] || ROLE_COLORS.user;
          const isEditing = editingUser === user.id;

          return (
            <div key={user.id}>
              <div style={{
                display: isMobile ? "flex" : "grid",
                flexDirection: isMobile ? "column" : undefined,
                gridTemplateColumns: isMobile ? undefined : "2fr 1fr 1fr 1fr 1fr 100px",
                padding: isMobile ? "14px 16px" : "12px 16px",
                borderBottom: `1px solid ${C.borderDefault}`,
                gap: isMobile ? 8 : 0,
                alignItems: isMobile ? undefined : "center",
              }}>
                {/* Email + dates */}
                <div>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: C.textPrimary }}>
                    {user.email}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginTop: 2 }}>
                    Joined {formatDate(user.createdAt)}
                    {user.lastSignIn && <> · Last seen {formatDate(user.lastSignIn)}</>}
                  </div>
                </div>

                {isMobile && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge bg={tierInfo.bg} color={tierInfo.color}>{tierInfo.label}</Badge>
                    <Badge bg={`${C.textTertiary}14`} color={C.textTertiary}>{user.status}</Badge>
                    <Badge bg={roleInfo.bg} color={roleInfo.color}>{roleInfo.label}</Badge>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{user.aiCalls} calls</span>
                  </div>
                )}

                {!isMobile && <>
                  <div><Badge bg={tierInfo.bg} color={tierInfo.color}>{tierInfo.label}</Badge>
                    {user.trialDaysLeft > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.aiBlue, marginLeft: 6 }}>{user.trialDaysLeft}d left</span>}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textSecondary }}>{user.status}</div>
                  <div><Badge bg={roleInfo.bg} color={roleInfo.color}>{roleInfo.label}</Badge></div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textSecondary }}>{user.aiCalls}</div>
                </>}

                {/* Actions */}
                <div>
                  <button
                    onClick={() => setEditingUser(isEditing ? null : user.id)}
                    style={{
                      padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                      background: "transparent", border: `1px solid ${C.borderDefault}`,
                      color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 11,
                      transition: "all 0.15s",
                    }}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>
              </div>

              {/* Edit panel */}
              {isEditing && (
                <div style={{
                  padding: "16px 20px", background: "rgba(0,0,0,0.02)",
                  borderBottom: `1px solid ${C.borderDefault}`,
                  display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end",
                }}>
                  <EditField label="Tier" value={user.tier} options={["free", "pro_trial", "pro", "team"]}
                    onChange={val => handleUpdate(user.id, { tier: val })} saving={saving} />
                  <EditField label="Status" value={user.status} options={["trialing", "active", "canceled", "past_due", "expired"]}
                    onChange={val => handleUpdate(user.id, { status: val })} saving={saving} />
                  <EditField label="Role" value={user.role} options={["user", "admin"]}
                    onChange={val => handleUpdate(user.id, { role: val })} saving={saving} />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary }}>
            {search ? "No users match your search" : "No users found"}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Badge({ bg, color, children }) {
  return (
    <span style={{
      fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
      padding: "2px 8px", borderRadius: 4,
      background: bg, color, textTransform: "uppercase",
      letterSpacing: "0.04em",
    }}>
      {children}
    </span>
  );
}

function EditField({ label, value, options, onChange, saving }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => opt !== value && onChange(opt)}
            disabled={saving}
            style={{
              padding: "4px 10px", borderRadius: 5, cursor: saving ? "wait" : "pointer",
              background: opt === value ? C.gold : "transparent",
              border: `1px solid ${opt === value ? C.gold : C.borderDefault}`,
              color: opt === value ? C.bgPrimary : C.textTertiary,
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: opt === value ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
