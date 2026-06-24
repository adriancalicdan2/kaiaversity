import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { getLevelFromPoints } from "@/lib/constants/levels";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { LevelIcon } from "@/components/shared/LevelIcon";

export const metadata: Metadata = { title: "Leaderboard - Campus" };

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admissions");
  }

  // Fetch all users sorted by points
  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.points)],
    limit: 50, // Top 50 ZAIAs
  });

  const top3 = allUsers.slice(0, 3);
  const rest = allUsers.slice(3);

  const podiumColors = ["#ffd700", "#c0c0c0", "#cd7f32"]; // Gold, Silver, Bronze
  const podiumLabels = ["1st", "2nd", "3rd"];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "white", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Trophy size={32} style={{ color: "#ffd700" }} />
          <span>ZAIA Honor Roll</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Celebrate the top achieving scholars of KAIAVERSITY. Complete courses and daily quests to rank up!
        </p>
      </div>

      {/* Podium for Top 3 */}
      {top3.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 20,
            marginBottom: 48,
            flexWrap: "wrap",
            padding: "0 10px",
          }}
        >
          {/* 2nd Place (left) */}
          {top3[1] && renderPodiumCard(top3[1], 1, podiumColors[1], podiumLabels[1], 160)}
          
          {/* 1st Place (center) */}
          {top3[0] && renderPodiumCard(top3[0], 0, podiumColors[0], podiumLabels[0], 190)}

          {/* 3rd Place (right) */}
          {top3[2] && renderPodiumCard(top3[2], 2, podiumColors[2], podiumLabels[2], 140)}
        </div>
      )}

      {/* Rankings List */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "grid",
            gridTemplateColumns: "60px 1fr 100px 120px",
            color: "#64748b",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          <span>RANK</span>
          <span>STUDENT</span>
          <span style={{ textAlign: "center" }}>LEVEL</span>
          <span style={{ textAlign: "right" }}>POINTS</span>
        </div>

        {rest.length === 0 && top3.length <= 3 && allUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            No students found on the leaderboard yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {allUsers.map((user, idx) => {
              const lvlDetails = getLevelFromPoints(user.points ?? 0);
              const isCurrentUser = user.id === session.user.id;

              return (
                <div
                  key={user.id}
                  style={{
                    padding: "16px 24px",
                    borderBottom: idx === allUsers.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.04)",
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 100px 120px",
                    alignItems: "center",
                    background: isCurrentUser ? "rgba(139, 92, 246, 0.06)" : "transparent",
                  }}
                >
                  <span style={{ fontWeight: 800, color: idx < 3 ? podiumColors[idx] : "#475569", fontSize: 14 }}>
                    #{idx + 1}
                  </span>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        overflow: "hidden",
                      }}
                    >
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.image} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <LevelIcon badge={lvlDetails.badge} size={14} style={{ color: lvlDetails.color }} />
                      )}
                    </div>
                    <div>
                      <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
                        {user.name} {isCurrentUser && <span style={{ fontSize: 10, color: "#8b5cf6", background: "rgba(139,92,246,0.15)", padding: "1px 6px", borderRadius: 4, marginLeft: 4 }}>YOU</span>}
                      </span>
                      <span style={{ color: "#64748b", fontSize: 11, display: "block" }}>
                        {lvlDetails.title}
                      </span>
                    </div>
                  </div>

                  <span style={{ textAlign: "center", color: lvlDetails.color, fontWeight: 800, fontSize: 14 }}>
                    {lvlDetails.level}
                  </span>

                  <span style={{ textAlign: "right", color: "white", fontWeight: 700, fontSize: 14 }}>
                    {(user.points ?? 0).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function renderPodiumCard(
  user: any,
  index: number,
  badgeColor: string,
  label: string,
  height: number
) {
  const lvlDetails = getLevelFromPoints(user.points ?? 0);
  return (
    <div
      style={{
        width: 170,
        background: "rgba(255, 255, 255, 0.02)",
        border: `2px solid ${badgeColor}30`,
        borderRadius: 20,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: height,
        textAlign: "center",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -12,
          background: badgeColor,
          color: index === 0 ? "black" : "white",
          fontSize: 10,
          fontWeight: 900,
          padding: "2px 8px",
          borderRadius: 99,
          boxShadow: `0 0 10px ${badgeColor}50`,
        }}
      >
        {label}
      </div>

      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          border: `2px solid ${badgeColor}`,
          background: "rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <LevelIcon badge={lvlDetails.badge} size={24} style={{ color: badgeColor }} />
        )}
      </div>

      <div>
        <h4 style={{ color: "white", fontWeight: 800, fontSize: 13, margin: "0 0 4px 0", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.name}
        </h4>
        <span style={{ color: badgeColor, fontWeight: 700, fontSize: 11, display: "block" }}>
          Lvl {lvlDetails.level}
        </span>
        <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, display: "block", marginTop: 4 }}>
          {user.points.toLocaleString()} pts
        </span>
      </div>
    </div>
  );
}
