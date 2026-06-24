import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users, Trash2 } from "lucide-react";
import {
  updateUserRole,
  adjustUserPoints,
  deleteUser,
} from "@/lib/actions/admin";

export const metadata: Metadata = { title: "User Management — Admin" };

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  ADMIN:     { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b" },
  PROFESSOR: { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa" },
  ZAIA:      { bg: "rgba(16,185,129,0.12)",  text: "#10b981" },
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || !["PROFESSOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.joinedAt)],
  });

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={26} style={{ color: "#8b5cf6" }} />
          <span>User Management</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          {allUsers.length} total users · Manage roles, points, and access
        </p>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)", color: "#475569" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>User</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Role</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Level / Points</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Joined</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => {
              const roleStyle = ROLE_COLORS[user.role] ?? ROLE_COLORS.ZAIA;
              const isSelf = user.id === session.user.id;
              return (
                <tr
                  key={user.id}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "#e2e8f0" }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, color: "white" }}>
                      {user.name ?? user.username ?? "—"}
                      {isSelf && (
                        <span style={{ fontSize: 10, color: "#475569", marginLeft: 6 }}>(you)</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{user.email}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "3px 9px",
                        borderRadius: 6,
                        background: roleStyle.bg,
                        color: roleStyle.text,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, color: "white" }}>Lvl {user.level ?? 1}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{(user.points ?? 0).toLocaleString()} pts</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 12 }}>
                    {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    {!isSelf && isAdmin ? (
                      <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {/* Role toggle */}
                        <form action={async () => { "use server"; await updateUserRole(user.id, user.role === "ZAIA" ? "PROFESSOR" : "ZAIA"); }}>
                          <button type="submit" style={btnStyle(user.role === "ZAIA" ? "#8b5cf6" : "#64748b")}>
                            {user.role === "ZAIA" ? "→ Prof" : "→ ZAIA"}
                          </button>
                        </form>
                        {user.role !== "ADMIN" && (
                          <form action={async () => { "use server"; await updateUserRole(user.id, "ADMIN"); }}>
                            <button type="submit" style={btnStyle("#f59e0b")}>→ Admin</button>
                          </form>
                        )}
                        {user.role === "ADMIN" && (
                          <form action={async () => { "use server"; await updateUserRole(user.id, "ZAIA"); }}>
                            <button type="submit" style={btnStyle("#ef4444")}>Revoke</button>
                          </form>
                        )}
                        {/* Points */}
                        <form action={async () => { "use server"; await adjustUserPoints(user.id, 50); }}>
                          <button type="submit" style={btnStyle("#10b981")}>+50 pts</button>
                        </form>
                        <form action={async () => { "use server"; await adjustUserPoints(user.id, -50); }}>
                          <button type="submit" style={btnStyle("#64748b")}>−50 pts</button>
                        </form>
                        {/* Delete */}
                        <form action={async () => { "use server"; await deleteUser(user.id); }}>
                          <button type="submit" style={{ ...btnStyle("#ef4444", true), display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px" }}>
                            <Trash2 size={13} />
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "#334155" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function btnStyle(color: string, danger = false) {
  return {
    fontSize: 11,
    fontWeight: 700,
    color: "white",
    background: danger ? `${color}20` : `${color}18`,
    border: `1px solid ${color}50`,
    padding: "4px 10px",
    borderRadius: 6,
    cursor: "pointer",
  } as React.CSSProperties;
}
