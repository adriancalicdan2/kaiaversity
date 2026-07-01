"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KAIA_MEMBERS } from "@/lib/constants/members";
import { signOut } from "next-auth/react";
import {
  Home,
  Users2,
  BookOpen,
  Trophy,
  Award,
  Calendar,
  MessageSquare,
  User,
  LogOut,
  Sparkles,
  Zap,
  Flame,
  Music,
  Star,
  Shield
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getProfMemberId } from "@/lib/constants/profMap";

const NAV_ITEMS = [
  { href: "/dashboard",               icon: Home, label: "Dashboard" },
  { href: "/professors",              icon: Users2, label: "Professors" },
  { href: "/campus/courses",          icon: BookOpen, label: "Courses" },
  { href: "/campus/leaderboard",      icon: Trophy, label: "Leaderboard" },
  { href: "/campus/achievements",     icon: Award, label: "Achievements" },
  { href: "/campus/events",           icon: Calendar, label: "Events" },
  { href: "/community",               icon: MessageSquare, label: "Community" },
  { href: "/profile",                 icon: User, label: "My Profile" },
];

function getMemberIcon(slug: string) {
  switch (slug) {
    case "angela": return Sparkles;
    case "charice": return Zap;
    case "alexa": return Flame;
    case "sophia": return Music;
    case "charlotte": return Star;
    default: return Star;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isManagement = session?.user && ["ADMIN", "PROFESSOR"].includes(session.user.role);
  const userMemberId = getProfMemberId(session?.user?.email);

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
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/kaiaversity.png"
            alt="KAIAVERSITY Logo"
            style={{ height: 28, width: "auto", objectFit: "contain" }}
          />
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {isManagement && (
          <Link
            href="/admin/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
              color: "#f59e0b",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              marginBottom: 14,
              transition: "all 0.2s",
            }}
          >
            <Shield size={16} style={{ color: "#f59e0b" }} />
            Control Center
          </Link>
        )}

        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#334155", marginBottom: 6, paddingLeft: 6 }}>
          CAMPUS
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
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
              <Icon size={16} style={{ opacity: active ? 1 : 0.7 }} />
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
          const MemberIcon = getMemberIcon(m.slug);
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
              <MemberIcon size={14} style={{ color: active ? m.color : "#4b5563" }} />
              {m.name}{userMemberId === m.id ? " (You)" : ""}
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
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
