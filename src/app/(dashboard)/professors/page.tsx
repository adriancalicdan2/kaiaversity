import { KAIA_MEMBERS } from "@/lib/constants/members";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Professors" };

export default function ProfessorsPage() {
  return (
    <div style={{ padding: "28px 32px", maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 6 }}>
        👩‍🏫 Your Professors
      </h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>
        5 talented members, each with their own personality and content to share.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {KAIA_MEMBERS.map((member) => (
          <Link
            key={member.slug}
            href={`/professors/${member.slug}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${member.color}25`,
                borderRadius: 20,
                padding: "28px 24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Color accent top bar */}
              <div
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${member.color}, transparent)`,
                  borderRadius: "20px 20px 0 0",
                }}
              />

              {/* Avatar / emoji */}
              <div
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: `${member.color}15`,
                  border: `2px solid ${member.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, marginBottom: 16,
                }}
              >
                {member.emoji}
              </div>

              {/* Name + positions */}
              <h2 style={{ color: member.color, fontWeight: 800, fontSize: 20, marginBottom: 4 }}>
                {member.name}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {member.position.map((pos) => (
                  <span
                    key={pos}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 8px",
                      borderRadius: 99, background: `${member.color}15`,
                      color: member.color, border: `1px solid ${member.color}30`,
                    }}
                  >
                    {pos}
                  </span>
                ))}
              </div>

              {/* Motto */}
              <p
                style={{
                  fontSize: 13, fontStyle: "italic", color: "#64748b",
                  marginBottom: 14, lineHeight: 1.5,
                }}
              >
                &ldquo;{member.motto}&rdquo;
              </p>

              {/* Stats row */}
              <div
                style={{
                  display: "flex", gap: 16, fontSize: 12, color: "#475569",
                  borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12,
                }}
              >
                <span>🎂 {member.birthday.split(",")[0]}</span>
                <span>📍 {member.hometown.split(",")[0]}</span>
                {member.mbti && <span>🧠 {member.mbti}</span>}
              </div>

              <div
                style={{
                  marginTop: 14, fontSize: 13, fontWeight: 600, color: member.color,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                View Profile →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
