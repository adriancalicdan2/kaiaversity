import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, postLikes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { KAIA_MEMBERS } from "@/lib/constants/members";
import { DAILY_QUESTS } from "@/lib/constants/quests";
import { formatTimeAgo } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import StudentID from "@/components/dashboard/StudentID";
import DailyQuests from "@/components/campus/DailyQuests";
import { checkAndSyncDailyQuests } from "@/lib/actions/quests";
import PostCard from "@/components/community/PostCard";

export const metadata: Metadata = { title: "Dashboard" };

const POST_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  LECTURE:      { bg: "rgba(6,182,212,0.15)",  color: "#06b6d4", label: "Lecture" },
  DIARY:        { bg: "rgba(236,72,153,0.15)", color: "#ec4899", label: "Diary" },
  ANNOUNCEMENT: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Announcement" },
  ASSIGNMENT:   { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Assignment" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Fetch recent posts, liked posts, and sync daily quests in parallel
  const [recentPosts, likedPosts, todayQuestStatus] = await Promise.all([
    db.query.posts.findMany({
      where: eq(posts.published, true),
      orderBy: [desc(posts.createdAt)],
      limit: 10,
    }),
    db.query.postLikes.findMany({
      where: eq(postLikes.userId, session.user.id),
    }),
    checkAndSyncDailyQuests(),
  ]);
 
  const likedPostIds = new Set(likedPosts.map((l) => l.postId));
  const completedQuestIds = todayQuestStatus
    .filter((q) => q.completed)
    .map((q) => q.questId);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* ── Header ──────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "white", marginBottom: 4 }}>
          Welcome back, {session.user.name?.split(" ")[0] ?? "ZAIA"}! 👋
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          {new Date().toLocaleDateString("en-PH", {
            timeZone: "Asia/Manila",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        {/* ── Left column ─────────────────────────────── */}
        <div>
          <StudentID
            user={{
              name: session.user.name ?? null,
              email: session.user.email ?? null,
              image: session.user.image ?? null,
              points: session.user.points ?? 0,
              role: session.user.role ?? null,
            }}
          />

          {/* Activity Feed */}
          <div>
            <h2 style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
              📰 Latest Posts
            </h2>
            {recentPosts.length === 0 ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16, padding: "48px 24px", textAlign: "center", color: "#475569",
                }}
              >
                No posts yet. Check back soon! ✨
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recentPosts.map((post) => {
                  const member = KAIA_MEMBERS.find((m) => m.id === post.memberId);
                  return (
                    <PostCard
                      key={post.id}
                      post={post}
                      member={member ? {
                        id: member.id,
                        name: member.name,
                        emoji: member.emoji ?? null,
                        color: member.color ?? null,
                      } : undefined}
                      initialLiked={likedPostIds.has(post.id)}
                      currentUserId={session.user.id}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Daily Quests */}
          <DailyQuests
            quests={DAILY_QUESTS}
            initialCompletedQuestIds={completedQuestIds}
          />

          {/* Professors quick nav */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "20px",
            }}
          >
            <h3 style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
              👩‍🏫 Your Professors
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {KAIA_MEMBERS.map((m) => (
                <Link
                  key={m.slug}
                  href={`/professors/${m.slug}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 10px", borderRadius: 10, textDecoration: "none",
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${m.color}20`,
                    transition: "all 0.2s",
                  }}
                >
                  <span
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: `${m.color}20`, border: `1px solid ${m.color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0,
                    }}
                  >
                    {m.emoji}
                  </span>
                  <div>
                    <p style={{ color: m.color, fontWeight: 700, fontSize: 13 }}>{m.name}</p>
                    <p style={{ color: "#475569", fontSize: 11 }}>{m.position.slice(0, 2).join(" · ")}</p>
                  </div>
                  <span style={{ marginLeft: "auto", color: "#334155", fontSize: 16 }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
