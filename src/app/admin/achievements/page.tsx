import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { achievements, userAchievements } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAchievement, toggleAchievement, deleteAchievement } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Achievements — Admin" };

const RARITY_COLORS: Record<string, { bg: string; text: string }> = {
  COMMON:    { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" },
  RARE:      { bg: "rgba(6,182,212,0.12)",   text: "#06b6d4" },
  EPIC:      { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa" },
  LEGENDARY: { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b" },
};

export default async function AdminAchievementsPage() {
  const session = await auth();
  if (!session?.user || !["PROFESSOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const allAchievements = await db.query.achievements.findMany();

  // Count how many users have each achievement
  const earnedCounts = await db
    .select({ achievementId: userAchievements.achievementId, count: count() })
    .from(userAchievements)
    .groupBy(userAchievements.achievementId);

  const earnedMap = Object.fromEntries(earnedCounts.map((e) => [e.achievementId, e.count]));

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4 }}>
          🏅 Achievements
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          {allAchievements.length} achievements · Motivate ZAIAs to earn badges
        </p>
      </div>

      {/* Create form */}
      <form
        action={createAchievement}
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: "white", marginBottom: 14 }}>
          ➕ Create Achievement
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr 3fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input name="icon" placeholder="Icon (emoji)" required style={inputStyle} />
          <input name="name" placeholder="Achievement name" required style={inputStyle} />
          <input name="description" placeholder="How to earn it" required style={inputStyle} />
          <input name="points" type="number" placeholder="Points" defaultValue={50} style={inputStyle} />
          <select name="rarity" required style={inputStyle}>
            <option value="COMMON">Common</option>
            <option value="RARE">Rare</option>
            <option value="EPIC">Epic</option>
            <option value="LEGENDARY">Legendary</option>
          </select>
        </div>
        <button
          type="submit"
          style={{
            padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13,
            background: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
            color: "white", border: "none", cursor: "pointer",
          }}
        >
          Create Achievement
        </button>
      </form>

      {/* Achievement list */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {allAchievements.map((ach) => {
          const rc = RARITY_COLORS[ach.rarity] ?? RARITY_COLORS.COMMON;
          return (
            <div
              key={ach.id}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${ach.isActive ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                gap: 12,
                opacity: ach.isActive ? 1 : 0.5,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: rc.bg, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 22, flexShrink: 0,
              }}>
                {ach.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontWeight: 800, color: "white", fontSize: 13 }}>{ach.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 5, background: rc.bg, color: rc.text, letterSpacing: "0.06em" }}>
                    {ach.rarity}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{ach.description}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>
                  <span style={{ color: "#a78bfa" }}>{ach.points} pts</span>
                  {" · "}{earnedMap[ach.id] ?? 0} ZAIAs earned
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <form action={async () => { "use server"; await toggleAchievement(ach.id, ach.isActive ?? true); }}>
                  <button type="submit" style={{ ...btn(ach.isActive ? "#64748b" : "#10b981"), width: "100%" }}>
                    {ach.isActive ? "Disable" : "Enable"}
                  </button>
                </form>
                <form action={async () => { "use server"; await deleteAchievement(ach.id); }}>
                  <button type="submit" style={{ ...btn("#ef4444"), width: "100%" }}>🗑 Delete</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {allAchievements.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
          No achievements yet. Create one above!
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
  fontSize: 13,
  outline: "none",
  width: "100%",
};

function btn(color: string): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 700, color: "white",
    background: `${color}18`, border: `1px solid ${color}50`,
    padding: "5px 12px", borderRadius: 7, cursor: "pointer",
  };
}
