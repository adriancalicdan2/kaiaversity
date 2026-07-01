import { auth } from "@/lib/auth";
import { createElement } from "react";
import type { CSSProperties } from "react";
import { db } from "@/lib/db";
import { users, userAchievements, pointTransactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ACHIEVEMENTS, RARITY_COLORS } from "@/lib/constants/achievements";
import { getProgressToNextLevel } from "@/lib/constants/levels";
import { KAIA_MEMBERS } from "@/lib/constants/members";
import { formatTimeAgo } from "@/lib/utils";
import type { Metadata } from "next";
import { 
  User, 
  GraduationCap, 
  Award, 
  Zap,
  Sparkles,
  Flame,
  Music,
  Star
} from "lucide-react";
import { LevelIcon } from "@/components/shared/LevelIcon";
import { EmojiIcon } from "@/components/shared/EmojiIcon";
import EditProfileForm from "@/components/profile/EditProfileForm";

export const metadata: Metadata = { title: "My Profile" };

function getMemberIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("angela")) return Sparkles;
  if (n.includes("charice")) return Zap;
  if (n.includes("alexa")) return Flame;
  if (n.includes("sophia")) return Music;
  if (n.includes("charlotte")) return Star;
  return Star;
}

function MemberIcon({ name, size, style }: { name: string; size?: number; style?: CSSProperties }) {
  return createElement(getMemberIcon(name), { size, style });
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user, earnedAchievements, recentTransactions] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    }),
    db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, session.user.id),
    }),
    db.query.pointTransactions.findMany({
      where: eq(pointTransactions.userId, session.user.id),
      orderBy: [desc(pointTransactions.createdAt)],
      limit: 10,
    }),
  ]);

  const { current, next, progress, pointsNeeded } = getProgressToNextLevel(user?.points ?? 0);
  const favMember = KAIA_MEMBERS.find((m) => m.slug === user?.favoriteMember);
  const earnedIds = new Set(earnedAchievements.map((e) => e.achievementId));

  const isManagement = user?.role ? ["ADMIN", "PROFESSOR"].includes(user.role) : false;
  const isProf = user?.role === "PROFESSOR";
  const isAdmin = user?.role === "ADMIN";

  return (
    <div style={{ padding: "28px 32px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <User size={28} style={{ color: "#8B5CF6" }} />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", margin: 0 }}>
            My Profile
          </h1>
        </div>
        <EditProfileForm user={{
          id: user?.id || "",
          name: user?.name || null,
          email: user?.email || "",
          bio: user?.bio || null,
          image: user?.image || null,
          favoriteMember: user?.favoriteMember || null,
        }} />
      </div>

      {/* Profile card */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(255,107,157,0.1))",
          border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: 20, padding: "28px", marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div
            style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(139,92,246,0.2)",
              border: "3px solid rgba(139,92,246,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0,
            }}
          >
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : <GraduationCap size={40} style={{ color: "#a78bfa" }} />}
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 2 }}>
              {isProf ? "FACULTY MEMBER" : isAdmin ? "ADMINISTRATOR" : "ZAIA STUDENT"}
            </p>
            <h2 style={{ color: "white", fontWeight: 800, fontSize: 22 }}>{user?.name || session.user.name}</h2>
            <p style={{ color: "#64748b", fontSize: 13 }}>{session.user.email}</p>
            {user?.bio && (
              <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, fontStyle: "italic", maxWidth: 450, lineHeight: 1.5 }}>
                &ldquo;{user.bio}&rdquo;
              </p>
            )}
            {favMember && (
              <p style={{ display: "flex", alignItems: "center", gap: 6, color: favMember.color, fontSize: 13, marginTop: 4 }}>
                <MemberIcon name={favMember.name} size={14} />
                <span>Favorite Professor: {favMember.name}</span>
              </p>
            )}
          </div>

          {isManagement ? (
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <span style={{ display: "inline-flex", padding: "4px" }}>
                <GraduationCap size={44} style={{ color: "#a78bfa" }} />
              </span>
              <p style={{ color: "white", fontWeight: 700, fontSize: 13, marginTop: 4 }}>
                VERIFIED {user?.role}
              </p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
                  <LevelIcon badge={current.badge} size={36} style={{ color: current.color }} />
                </div>
                <p style={{ color: current.color, fontWeight: 700, fontSize: 14 }}>{current.title}</p>
                <p style={{ color: "#475569", fontSize: 12 }}>Level {current.level}</p>
              </div>

              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: 36, fontWeight: 900,
                    background: "linear-gradient(135deg, #FF6B9D, #8B5CF6)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}
                >
                  {(user?.points ?? 0).toLocaleString()}
                </p>
                <p style={{ color: "#475569", fontSize: 12 }}>Total Points</p>
                {next && <p style={{ color: "#334155", fontSize: 11 }}>{pointsNeeded} to next level</p>}
              </div>
            </>
          )}
        </div>

        {/* Progress bar */}
        {!isManagement && next && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginBottom: 6 }}>
              <span>{current.title}</span>
              <span>{progress}%  →  {next.title}</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99 }}>
              <div
                style={{
                  height: "100%", width: `${progress}%`, borderRadius: 99,
                  background: `linear-gradient(90deg, ${current.color}, ${next.color})`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Earned badges */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "20px",
          }}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: 6, color: "white", fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
            <Award size={18} style={{ color: "#f59e0b" }} /> Badges ({earnedAchievements.length})
          </h3>
          {earnedAchievements.length === 0 ? (
            <p style={{ color: "#475569", fontSize: 13 }}>No badges yet. Start engaging!</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ACHIEVEMENTS.filter((a) => earnedIds.has(a.id)).map((ach) => (
                <div
                  key={ach.id}
                  title={ach.name}
                  style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, cursor: "default",
                  }}
                >
                  <EmojiIcon emoji={ach.icon} size={22} style={{ color: RARITY_COLORS[ach.rarity] || "#8B5CF6" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Point history */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "20px",
          }}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: 6, color: "white", fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
            <Zap size={18} style={{ color: "#8B5CF6" }} /> Recent Points
          </h3>
          {recentTransactions.length === 0 ? (
            <p style={{ color: "#475569", fontSize: 13 }}>No activity yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <p style={{ color: "#cbd5e1", fontSize: 13 }}>{tx.reason}</p>
                    <p style={{ color: "#475569", fontSize: 11 }}>
                      {tx.createdAt ? formatTimeAgo(tx.createdAt) : ""}
                    </p>
                  </div>
                  <span
                    style={{
                      fontWeight: 700, fontSize: 14,
                      color: tx.amount > 0 ? "#34d399" : "#f87171",
                    }}
                  >
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
