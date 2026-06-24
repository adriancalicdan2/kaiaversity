import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userAchievements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ACHIEVEMENTS, RARITY_COLORS } from "@/lib/constants/achievements";
import { syncLevelAchievements } from "@/lib/actions/points";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Sync and award any missing level achievements
  await syncLevelAchievements(session.user.id);

  const earned = await db.query.userAchievements.findMany({
    where: eq(userAchievements.userId, session.user.id),
  });
  const earnedIds = new Set(earned.map((e) => e.achievementId));

  const byCategory = {
    level:  ACHIEVEMENTS.filter((a) => a.category === "level"),
    member: ACHIEVEMENTS.filter((a) => a.category === "member"),
    social: ACHIEVEMENTS.filter((a) => a.category === "social"),
    event:  ACHIEVEMENTS.filter((a) => a.category === "event"),
  };

  const completedCount = ACHIEVEMENTS.filter((a) => earnedIds.has(a.id)).length;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 4 }}>
        🏆 Achievements
      </h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>
        Earn badges by engaging with KAIA&apos;s content.
      </p>

      {/* Progress summary */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(255,107,157,0.1))",
          border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: 14, padding: "16px 20px", marginBottom: 32,
          display: "flex", alignItems: "center", gap: 20,
        }}
      >
        <div style={{ fontSize: 36 }}>🎖️</div>
        <div>
          <p style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
            {completedCount} / {ACHIEVEMENTS.length} Unlocked
          </p>
          <div style={{ width: 200, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99, marginTop: 6 }}>
            <div
              style={{
                height: "100%",
                width: `${(completedCount / ACHIEVEMENTS.length) * 100}%`,
                background: "linear-gradient(90deg, #FF6B9D, #8B5CF6)",
                borderRadius: 99,
              }}
            />
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <p style={{ color: "#8B5CF6", fontWeight: 800, fontSize: 24 }}>
            {Math.round((completedCount / ACHIEVEMENTS.length) * 100)}%
          </p>
          <p style={{ color: "#475569", fontSize: 12 }}>Complete</p>
        </div>
      </div>

      {/* Categories */}
      {(Object.entries(byCategory) as [string, typeof ACHIEVEMENTS][]).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 32 }}>
          <h2
            style={{
              color: "white", fontWeight: 700, fontSize: 16,
              marginBottom: 14, textTransform: "capitalize",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {cat === "level" ? "🎓" : cat === "member" ? "⭐" : cat === "social" ? "💬" : "🎪"}
            {cat.charAt(0).toUpperCase() + cat.slice(1)} Badges
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {items.map((ach) => {
              const unlocked = earnedIds.has(ach.id);
              const rarityColor = RARITY_COLORS[ach.rarity];
              return (
                <div
                  key={ach.id}
                  style={{
                    background: unlocked ? `${rarityColor}10` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${unlocked ? rarityColor + "40" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 14, padding: "16px",
                    opacity: unlocked ? 1 : 0.5,
                    filter: unlocked ? "none" : "grayscale(0.6)",
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                >
                  {unlocked && (
                    <div
                      style={{
                        position: "absolute", top: 8, right: 8, fontSize: 14,
                        background: `${rarityColor}20`, borderRadius: "50%",
                        width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      ✓
                    </div>
                  )}
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{ach.icon}</div>
                  <h3 style={{ color: unlocked ? "white" : "#475569", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {ach.name}
                  </h3>
                  <p style={{ color: "#475569", fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                    {ach.description}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                        color: rarityColor, textTransform: "uppercase",
                      }}
                    >
                      {ach.rarity}
                    </span>
                    {ach.points > 0 && (
                      <span style={{ fontSize: 11, color: "#8B5CF6", fontWeight: 700 }}>
                        +{ach.points} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
