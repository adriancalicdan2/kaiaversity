import type { Metadata } from "next";
import Link from "next/link";
import { KAIA_MEMBERS } from "@/lib/constants/members";
import AuthForm from "@/components/auth/AuthForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admissions — Join KAIAVERSITY",
  description:
    "Sign in or Sign up with Email and Password to enroll in KAIAVERSITY and start your ZAIA journey.",
};

export default function AdmissionsPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0A0A0F", position: "relative", overflow: "hidden" }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
          opacity: 0.15,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, #FF6B9D 0%, transparent 70%)",
          opacity: 0.12,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
            <img
              src="/kaiaversity.png"
              alt="KAIAVERSITY Logo"
              style={{ height: 72, width: "auto", objectFit: "contain" }}
            />
          </Link>
          <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 12 }}>
            Enroll and start your ZAIA journey
          </p>
        </div>

        {/* Card */}
        <Suspense fallback={
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "32px 28px",
            height: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b"
          }}>
            Loading Admissions Office...
          </div>
        }>
          <AuthForm />
        </Suspense>

        {/* Members strip */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
          {KAIA_MEMBERS.map((m) => (
            <div
              key={m.slug}
              title={m.name}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: `${m.color}20`,
                border: `1px solid ${m.color}50`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {m.emoji}
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", marginTop: 16, color: "#334155", fontSize: 12 }}>
          <Link href="/" style={{ color: "#8B5CF6", textDecoration: "none" }}>
            ← Back to Home
          </Link>
        </p>
      </div>
    </main>
  );
}
