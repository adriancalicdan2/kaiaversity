"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KAIA_MEMBERS } from "@/lib/constants/members";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/dashboard",               icon: "🏠", label: "Dashboard" },
  { href: "/professors",              icon: "👩‍🏫", label: "Professors" },
  { href: "/campus/courses",          icon: "📚", label: "Courses" },
  { href: "/campus/leaderboard",      icon: "🏅", label: "Leaderboard" },
  { href: "/campus/achievements",     icon: "🏆", label: "Achievements" },
  { href: "/campus/events",           icon: "📅", label: "Events" },
  { href: "/community",               icon: "💬", label: "Community" },
  { href: "/profile",                 icon: "👤", label: "My Profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "rgba(255,255,255,0.025)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" style={{ textDecoration: "none", marginBottom: 28, display: "block", paddingLeft: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🎓</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: "0.06em",
              background: "linear-gradient(135deg, #FF6B9D, #8B5CF6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            KAIAVERSITY
          </span>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#334155", marginBottom: 6, paddingLeft: 6 }}>
          CAMPUS
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? "white" : "#64748b",
                background: active ? "rgba(139,92,246,0.18)" : "transparent",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Professors quick-links */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#334155", margin: "20px 0 6px", paddingLeft: 6 }}>
          PROFESSORS
        </p>
        {KAIA_MEMBERS.map((m) => {
          const active = pathname === `/professors/${m.slug}`;
          return (
            <Link
              key={m.slug}
              href={`/professors/${m.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 13,
                color: active ? m.color : "#4b5563",
                background: active ? `${m.color}15` : "transparent",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 14 }}>{m.emoji}</span>
              {m.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom sign-out */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, marginTop: 12 }}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "9px 12px",
            borderRadius: 10,
            fontSize: 13,
            color: "#475569",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.06)",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.2s",
          }}
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
