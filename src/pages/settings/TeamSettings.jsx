import { useState, useEffect, useCallback } from "react";
import { Users, Crown, Shield, User, Mail, Copy, Check, Loader } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { Btn } from "../../components/ui/index";

const cardStyle = { padding: "18px 20px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, marginBottom: 12 };
const ROLE_META = {
  owner: { label: "Owner", color: C.amber, icon: Crown },
  admin: { label: "Admin", color: C.gold, icon: Shield },
  member: { label: "Member", color: C.textSecondary, icon: User },
};

export default function TeamSettings() {
  const { isMobile } = useMediaQuery();
  const { user, activeOrgId } = useAuthStore();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch("/api/org", {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Org-Id": activeOrgId || "",
          },
        });
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setOrg({ id: data.id, name: data.name, slug: data.slug, createdAt: data.createdAt });
        setMembers(data.members || []);
        setCurrentRole(data.currentUserRole);
      } catch {
        // API not available in local dev
      }
      setLoading(false);
    })();
  }, [activeOrgId, getToken]);

  const isAdmin = currentRole === "owner" || currentRole === "admin";

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteResult(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/org?action=invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Org-Id": activeOrgId || "",
        },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteResult({ ok: true, msg: `Invite sent to ${inviteEmail}` });
        setInviteEmail("");
        // Refresh member list
        const refreshRes = await fetch("/api/org", {
          headers: { Authorization: `Bearer ${token}`, "X-Org-Id": activeOrgId || "" },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setMembers(refreshData.members || []);
        }
      } else {
        setInviteResult({ ok: false, msg: data.error || "Failed to invite" });
      }
    } catch (e) {
      setInviteResult({ ok: false, msg: e.message });
    }
    setInviting(false);
  }

  async function handleRoleChange(memberId, newRole) {
    const token = await getToken();
    try {
      const res = await fetch("/api/org?action=update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Org-Id": activeOrgId || "",
        },
        body: JSON.stringify({ memberId, role: newRole }),
      });
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      }
    } catch { /* skip */ }
  }

  async function handleRemove(memberId) {
    if (!confirm("Remove this team member? They will lose access to this organization.")) return;
    const token = await getToken();
    try {
      const res = await fetch("/api/org?action=remove-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Org-Id": activeOrgId || "",
        },
        body: JSON.stringify({ memberId }),
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
      }
    } catch { /* skip */ }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 24, color: C.textTertiary, fontFamily: FONT_BODY, fontSize: 13 }}>
        <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading team...
      </div>
    );
  }

  const inviteLink = org?.slug ? `${window.location.origin}/signup?org=${org.slug}` : null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>Team Management</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>
          Manage who has access to {org?.name || "your organization"}
        </div>
      </div>

      {/* Organization Info */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Users size={16} style={{ color: C.gold }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Organization</span>
        </div>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 8 : 24 }}>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginBottom: 2 }}>Name</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{org?.name || "—"}</div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginBottom: 2 }}>Members</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{members.length}</div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textTertiary, marginBottom: 2 }}>Your Role</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: ROLE_META[currentRole]?.color || C.textPrimary }}>
              {ROLE_META[currentRole]?.label || currentRole || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Users size={16} style={{ color: C.aiBlue }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Members</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>{members.length} total</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {members.map(m => {
            const role = ROLE_META[m.role] || ROLE_META.member;
            const RoleIcon = role.icon;
            const isCurrentUser = m.userId === user?.id;
            const joinDate = m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
            return (
              <div key={m.id} style={{
                display: "flex", flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center", gap: isMobile ? 6 : 12,
                padding: isMobile ? "10px 12px" : "10px 14px",
                background: isCurrentUser ? "rgba(255,255,255,0.03)" : "transparent",
                borderRadius: 8, border: `1px solid ${isCurrentUser ? C.borderSubtle : C.borderDefault}`,
              }}>
                {/* Avatar + name + email */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: C.goldMuted, border: `1px solid ${C.gold}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 600, color: C.gold, fontFamily: FONT_SANS,
                  }}>
                    {(m.name || m.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
                        {m.name || m.email?.split("@")[0] || "Unknown"}
                      </span>
                      {isCurrentUser && (
                        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.gold, background: C.goldMuted, padding: "1px 5px", borderRadius: 3 }}>YOU</span>
                      )}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.email}
                    </div>
                  </div>
                </div>

                {/* Role + joined + actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {joinDate && (
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>
                      Joined {joinDate}
                    </span>
                  )}

                  {isAdmin && !isCurrentUser && m.role !== "owner" ? (
                    <select
                      value={m.role}
                      onChange={e => handleRoleChange(m.id, e.target.value)}
                      style={{
                        background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 6,
                        padding: "3px 8px", color: role.color, fontFamily: FONT_MONO, fontSize: 10,
                        fontWeight: 600, cursor: "pointer", outline: "none",
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
                      padding: "3px 8px", borderRadius: 5,
                      color: role.color, background: `${role.color}14`, border: `1px solid ${role.color}20`,
                    }}>
                      <RoleIcon size={10} /> {role.label}
                    </span>
                  )}

                  {isAdmin && !isCurrentUser && m.role !== "owner" && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: C.textTertiary, padding: 4, display: "flex", alignItems: "center",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = C.red}
                      onMouseLeave={e => e.currentTarget.style.color = C.textTertiary}
                      title="Remove member"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, textAlign: "center", padding: 16 }}>
              No team members found. Invite your first teammate below.
            </div>
          )}
        </div>
      </div>

      {/* Invite Section */}
      {isAdmin && (
        <div style={{ ...cardStyle, border: `1px solid ${C.gold}25` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Mail size={16} style={{ color: C.gold }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Invite Team Member</span>
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 12, lineHeight: 1.5 }}>
            Send an invite to add someone to your organization. They'll get access to the shared renewal portfolio and agent outputs.
          </div>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleInvite(); }}
              placeholder="teammate@company.com"
              style={{
                flex: 1, background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 8,
                padding: "9px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13,
                outline: "none", boxSizing: "border-box",
              }}
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              style={{
                background: C.bgAI, border: `1px solid ${C.borderDefault}`, borderRadius: 8,
                padding: "9px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13,
                cursor: "pointer", outline: "none",
              }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <Btn variant="primary" disabled={!inviteEmail.trim() || inviting} onClick={handleInvite}>
              {inviting ? <><Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> Sending...</> : <><Mail size={12} /> Send Invite</>}
            </Btn>
          </div>
          {inviteResult && (
            <div style={{
              fontFamily: FONT_SANS, fontSize: 12, marginTop: 8, padding: "6px 10px", borderRadius: 6,
              color: inviteResult.ok ? C.green : C.red,
              background: inviteResult.ok ? C.greenMuted : C.redMuted,
            }}>
              {inviteResult.msg}
            </div>
          )}
        </div>
      )}

      {/* Invite Link */}
      {inviteLink && isAdmin && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Copy size={14} style={{ color: C.textTertiary }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Invite Link</span>
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginBottom: 8 }}>
            Share this link with teammates to let them sign up directly into your organization.
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{
              flex: 1, padding: "8px 12px", background: C.bgAI, borderRadius: 8,
              border: `1px solid ${C.borderDefault}`, fontFamily: FONT_MONO, fontSize: 12,
              color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {inviteLink}
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                background: copied ? C.greenMuted : C.bgAI,
                border: `1px solid ${copied ? C.green + "40" : C.borderDefault}`,
                color: copied ? C.green : C.textSecondary,
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
                transition: "all 0.15s",
              }}
            >
              {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>
        </div>
      )}

      {/* Non-admin notice */}
      {!isAdmin && (
        <div style={{
          padding: "14px 16px", background: C.bgCard, borderRadius: 10,
          border: `1px solid ${C.borderDefault}`, fontFamily: FONT_BODY,
          fontSize: 13, color: C.textTertiary, lineHeight: 1.6,
        }}>
          Only organization owners and admins can invite members or change roles. Contact your admin if you need to make changes.
        </div>
      )}
    </div>
  );
}
