"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/dashboard",           icon: "🏠", label: "Home" },
  { href: "/campus",              icon: "🏫", label: "Campus" },
  { href: "/professors",          icon: "👩‍🏫", label: "Profs" },
  { href: "/community",           icon: "💬", label: "Comm" },
  { href: "/profile",             icon: "👤", label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(10, 10, 15, 0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 8px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))", // for iOS
        zIndex: 50,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              color: active ? "white" : "#64748b",
              width: "20%",
            }}
          >
            <div
              style={{
                fontSize: 20,
                background: active ? "rgba(139,92,246,0.2)" : "transparent",
                padding: "6px 12px",
                borderRadius: 99,
                transition: "background 0.2s",
              }}
            >
              {item.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>
              {item.label}
            </span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          color: "#64748b",
          width: "20%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            fontSize: 20,
            padding: "6px 12px",
            borderRadius: 99,
          }}
        >
          🚪
        </div>
        <span style={{ fontSize: 10, fontWeight: 500 }}>Logout</span>
      </button>
    </div>
  );
}
