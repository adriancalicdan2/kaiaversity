import { getMemberBySlug, KAIA_MEMBERS } from "@/lib/constants/members";
import { createElement } from "react";
import { db } from "@/lib/db";
import { posts, courses, courseEnrollments, postLikes } from "@/lib/db/schema";
import { eq, desc, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isLevelUnlockedForUser } from "@/lib/actions/levels";
import { enrollInCourse } from "@/lib/actions/courses";
import { notFound, redirect } from "next/navigation";
import { getProfMemberId } from "@/lib/constants/profMap";
import { formatTimeAgo } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import PostCard from "@/components/community/PostCard";
import { 
  BookOpen, 
  FileText, 
  Lock, 
  Award, 
  Sparkles, 
  Zap, 
  Flame, 
  Music, 
  Star 
} from "lucide-react";
import { EmojiIcon } from "@/components/shared/EmojiIcon";

function getMemberIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("angela")) return Sparkles;
  if (n.includes("charice")) return Zap;
  if (n.includes("alexa")) return Flame;
  if (n.includes("sophia")) return Music;
  if (n.includes("charlotte")) return Star;
  return Star;
}

function MemberIcon({ name, size, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return createElement(getMemberIcon(name), { size, style });
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = getMemberBySlug(slug);
  if (!member) return { title: "Not Found" };
  return {
    title: `Prof. ${member.name}`,
    description: member.motto,
  };
}

export function generateStaticParams() {
  return KAIA_MEMBERS.map((m) => ({ slug: m.slug }));
}

const POST_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  LECTURE:      { bg: "rgba(6,182,212,0.15)",  color: "#06b6d4", label: "Lecture" },
  DIARY:        { bg: "rgba(236,72,153,0.15)", color: "#ec4899", label: "Diary" },
  ANNOUNCEMENT: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Announcement" },
  ASSIGNMENT:   { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Assignment" },
};

export default async function MemberProfilePage({ params }: Props) {
  const { slug } = await params;
  const member = getMemberBySlug(slug);
  if (!member) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admissions");
  }

  const isManagement = session.user && ["ADMIN", "PROFESSOR"].includes(session.user.role);
  const memberId = getProfMemberId(session.user.email);
  const isOwnProfile = memberId === member.id;

  // Fetch member posts, liked posts, courses, and course enrollments in parallel
  const [memberPosts, likedPosts, memberCourses, enrollments] = await Promise.all([
    db.query.posts.findMany({
      where: and(eq(posts.memberId, member.id), eq(posts.published, true)),
      orderBy: [desc(posts.createdAt)],
      limit: 20,
    }),
    db.query.postLikes.findMany({
      where: eq(postLikes.userId, session.user.id),
    }),
    db.query.courses.findMany({
      where: and(
        eq(courses.memberId, member.id),
        eq(courses.isActive, true)
      ),
      orderBy: [asc(courses.minLevel)],
    }),
    db.query.courseEnrollments.findMany({
      where: eq(courseEnrollments.userId, session.user.id),
    }),
  ]);
 
  const likedPostIds = new Set(likedPosts.map((l) => l.postId));
 
  const uniqueLevels = Array.from(new Set(memberCourses.map((c) => c.minLevel)));
  const levelUnlockStatuses: Record<number, { unlocked: boolean; reason?: string }> = {};
 
  // Check level unlock status — bypass for management viewing their own courses
  await Promise.all(
    uniqueLevels.map(async (lvl) => {
      if (isManagement && isOwnProfile) {
        levelUnlockStatuses[lvl] = { unlocked: true };
      } else {
        levelUnlockStatuses[lvl] = await isLevelUnlockedForUser(session.user.id, lvl, member.id);
      }
    })
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* ── Header banner ──────────────────────────── */}
      <div
        style={{
          position: "relative", overflow: "hidden",
          background: `linear-gradient(135deg, ${member.color}25, ${member.color}08)`,
          borderBottom: `1px solid ${member.color}30`,
          padding: "40px 40px 36px",
        }}
      >
        {/* BG pattern */}
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.05,
            backgroundImage: `linear-gradient(${member.color} 1px, transparent 1px), linear-gradient(90deg, ${member.color} 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 28, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div
            style={{
              width: 96, height: 96, borderRadius: "50%", flexShrink: 0,
              background: `${member.color}20`,
              border: `3px solid ${member.color}60`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <MemberIcon name={member.name} size={48} style={{ color: member.color }} />
        </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "inline-block", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.12em", color: member.color,
                background: `${member.color}15`, border: `1px solid ${member.color}30`,
                padding: "4px 10px", borderRadius: 99, marginBottom: 8,
              }}
            >
              PROFESSOR
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 900, color: "white", marginBottom: 6 }}>
              {isOwnProfile ? `${member.name} (You)` : member.name}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {member.position.map((pos) => (
                <span
                  key={pos}
                  style={{
                    fontSize: 12, fontWeight: 600, padding: "4px 10px",
                    borderRadius: 99, background: `${member.color}15`,
                    color: member.color, border: `1px solid ${member.color}30`,
                  }}
                >
                  {pos}
                </span>
              ))}
            </div>
            <p
              style={{
                fontSize: 14, fontStyle: "italic",
                color: "#94a3b8", lineHeight: 1.6,
                maxWidth: 480,
              }}
            >
              &ldquo;{member.motto}&rdquo;
            </p>
          </div>

          {/* Stats column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
            {[
              { label: "Birthday", value: member.birthday },
              { label: "Zodiac",   value: member.zodiac },
              { label: "Height",   value: member.height },
              { label: "Weight",   value: member.weight },
              ...(member.mbti ? [{ label: "MBTI", value: member.mbti }] : []),
              { label: "Hometown", value: member.hometown.split(",")[0] },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>{stat.label}</span>
                <span style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700 }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content area ───────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, padding: "28px 32px" }}>
        {/* Left column: Courses & Posts */}
        <div>
          {/* Courses Section */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, color: "white", fontWeight: 800, fontSize: 18, marginBottom: 16 }}>
              <BookOpen size={20} style={{ color: member.color || "#8B5CF6" }} />
              <span>Courses taught by Prof. {member.name}</span>
            </h2>
            {memberCourses.length === 0 ? (
              <div style={{ color: "#64748b", fontSize: 13, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", padding: 24, borderRadius: 12, textAlign: "center" }}>
                No courses currently taught by this professor.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {memberCourses.map((course) => {
                  const enrollment = enrollments.find((e) => e.courseId === course.id);
                  const isCompleted = enrollment?.status === "COMPLETED";
                  const unlockStatus = levelUnlockStatuses[course.minLevel] || { unlocked: true };
                  const isLocked = !unlockStatus.unlocked;

                  return (
                    <div
                      key={course.id}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: isLocked 
                          ? "1px solid rgba(255,255,255,0.04)" 
                          : isCompleted 
                          ? "1px solid rgba(16, 185, 129, 0.2)" 
                          : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14,
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        opacity: isLocked ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ display: "inline-flex", width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" }}>
                          <EmojiIcon emoji={course.coverEmoji || "📚"} size={22} style={{ color: member.color || "#8B5CF6" }} />
                        </span>
                        <div>
                          <h4 style={{ color: "white", fontSize: 14, fontWeight: 700, margin: 0 }}>
                            {course.title}
                          </h4>
                          <span style={{ color: "#64748b", fontSize: 11 }}>
                            Level {course.minLevel} · {course.difficulty} · {course.estimatedMinutes} mins
                          </span>
                        </div>
                      </div>

                      <div>
                        {isLocked ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#ef4444", fontSize: 12, fontWeight: 600 }}>
                            <Lock size={12} /> Locked Lvl {course.minLevel}
                          </span>
                        ) : isCompleted ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#10b981", fontSize: 12, fontWeight: 700 }}>
                            <Award size={12} /> Completed ({enrollment.quizScore}%)
                          </span>
                        ) : enrollment ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <Link
                              href={`/campus/courses/${course.slug}`}
                              style={{
                                color: "white",
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: "none",
                                padding: "6px 12px",
                                borderRadius: 6,
                                background: "rgba(255,255,255,0.06)",
                              }}
                            >
                              Study
                            </Link>
                            <Link
                              href={`/campus/courses/${course.slug}/quiz`}
                              style={{
                                color: "white",
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: "none",
                                padding: "6px 12px",
                                borderRadius: 6,
                                background: `linear-gradient(135deg, ${member.color}, #ec4899)`,
                              }}
                            >
                              Take Quiz
                            </Link>
                          </div>
                        ) : (
                          <form
                            action={async () => {
                              "use server";
                              await enrollInCourse(course.id);
                              redirect(`/campus/courses/${course.slug}`);
                            }}
                          >
                            <button
                              type="submit"
                              style={{
                                color: "white",
                                fontSize: 12,
                                fontWeight: 700,
                                border: "none",
                                cursor: "pointer",
                                padding: "6px 12px",
                                borderRadius: 6,
                                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                              }}
                            >
                              Enroll
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <h2 style={{ display: "flex", alignItems: "center", gap: 8, color: "white", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
            <FileText size={20} style={{ color: member.color || "#8B5CF6" }} />
            <span>Posts ({memberPosts.length})</span>
          </h2>
          {memberPosts.length === 0 ? (
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: "48px", textAlign: "center", color: "#475569",
              }}
            >
               {member.name} hasn&apos;t posted yet. Check back soon!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {memberPosts.map((post) => {
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    member={{
                      id: member.id,
                      name: member.name,
                      emoji: member.emoji ?? null,
                      color: member.color ?? null,
                    }}
                    initialLiked={likedPostIds.has(post.id)}
                    currentUserId={session.user.id}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Fun Facts sidebar */}
        <div>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${member.color}25`,
              borderRadius: 16, padding: "20px", position: "sticky", top: 20,
            }}
          >
            <h3 style={{ display: "flex", alignItems: "center", gap: 6, color: member.color, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
              <MemberIcon name={member.name} size={16} />
              <span>Fun Facts</span>
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {member.funFacts.map((fact, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", gap: 10, alignItems: "flex-start",
                    fontSize: 13, color: "#94a3b8", lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: member.color, marginTop: 1, flexShrink: 0 }}>✦</span>
                  {fact}
                </div>
              ))}
            </div>

            {member.roleModels && (
              <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8, letterSpacing: "0.08em" }}>
                  ROLE MODELS
                </p>
                {member.roleModels.map((r) => (
                  <span
                    key={r}
                    style={{
                      display: "inline-block", fontSize: 12, padding: "4px 10px",
                      background: `${member.color}15`, color: member.color,
                      border: `1px solid ${member.color}30`, borderRadius: 99,
                      marginRight: 6, marginBottom: 6,
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
