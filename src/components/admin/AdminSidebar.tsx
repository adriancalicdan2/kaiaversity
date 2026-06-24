"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_SECTIONS = [
  {
    group: "Overview",
    items: [
      { href: "/admin/dashboard", icon: "📊", label: "Dashboard" },
    ],
  },
  {
    group: "Manage",
    items: [
      { href: "/admin/users",        icon: "👥", label: "Users" },
      { href: "/admin/content",      icon: "✍️",  label: "Content" },
      { href: "/admin/submissions",  icon: "📋", label: "Submissions" },
    ],
  },
  {
    group: "Campus",
    items: [
      { href: "/admin/courses",      icon: "🎓", label: "Courses" },
      { href: "/admin/quests",       icon: "🎯", label: "Quests" },
      { href: "/admin/achievements", icon: "🏅", label: "Achievements" },
    ],
  },
  {
    group: "Events",
    items: [
      { href: "/admin/events", icon: "🏆", label: "Events" },
    ],
  },
];

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "#f59e0b",
  PROFESSOR: "#8b5cf6",
  ZAIA: "#10b981",
};

interface Props {
  userName: string;
  userRole: string;
  userPoints: number;
}

export function AdminSidebar({ userName, userRole, userPoints }: Props) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0d0d1a 0%, #0a0a14 100%)",
        borderRight: "1px solid rgba(245,158,11,0.12)",
        display: "flex",
        flexDirection: "column",
        padding: "0 0 20px 0",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(245,158,11,0.1)",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ⚙️
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "white", lineHeight: 1.2 }}>
              {userName}
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: ROLE_COLOR[userRole] ?? "#f59e0b",
                background: `${ROLE_COLOR[userRole] ?? "#f59e0b"}18`,
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {userRole}
            </span>
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#475569",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            padding: "6px 10px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Control Center</span>
          <span style={{ color: "#f59e0b" }}>{userPoints.toLocaleString()} pts</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0 10px" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.group} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.12em",
                color: "#334155",
                padding: "4px 8px",
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              {section.group}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    borderRadius: 10,
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#fff" : "#64748b",
                    background: isActive
                      ? "linear-gradient(90deg, rgba(245,158,11,0.15), rgba(245,158,11,0.06))"
                      : "transparent",
                    borderLeft: isActive ? "2px solid #f59e0b" : "2px solid transparent",
                    transition: "all 0.15s",
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 10px 0",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 12,
            color: "#475569",
            transition: "color 0.15s",
          }}
        >
          👁 View as Student
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admissions" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 8,
            background: "none",
            border: "none",
            fontSize: 12,
            color: "#475569",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
