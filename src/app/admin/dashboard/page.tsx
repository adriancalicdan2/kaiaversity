import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  posts,
  users,
  comments,
  courses,
  courseEnrollments,
  courseSubmissions,
  events,
  pointTransactions,
} from "@/lib/db/schema";
import { count, desc, sum, eq, and, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfMemberId } from "@/lib/constants/profMap";
import { 
  Settings, Users, PenTool, MessageSquare, GraduationCap, 
  ClipboardList, Trophy, Coins, Zap, UserPlus, Star, ChevronRight,
  Target
} from "lucide-react";

export const metadata: Metadata = { title: "Control Center — KAIAVERSITY" };

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || !["PROFESSOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const isProfessor = session.user.role === "PROFESSOR";
  const memberId = getProfMemberId(session.user.email);

  // Fetch professor's course IDs if they are a professor
  let targetCourseIds: string[] = [];
  if (isProfessor && memberId) {
    const profCourses = await db.query.courses.findMany({
      where: eq(courses.memberId, memberId),
    });
    targetCourseIds = profCourses.map((c) => c.id);
  }

  // Fetch stats, total points, recent users, and pending submissions in parallel
  const [
    [postCountResult],
    [userCountResult],
    [commentCountResult],
    [enrollCountResult],
    [submissionCountResult],
    [eventCountResult],
    [pointsResult],
    recentUsers,
    pendingSubmissions
  ] = await Promise.all([
    // Post count
    db.select({ count: count() })
      .from(posts)
      .where(isProfessor && memberId ? eq(posts.memberId, memberId) : undefined),
    
    // Total users
    db.select({ count: count() }).from(users),

    // Comments count (comments on professor's posts if professor)
    isProfessor && memberId
      ? db.select({ count: count() })
          .from(comments)
          .innerJoin(posts, eq(comments.postId, posts.id))
          .where(eq(posts.memberId, memberId))
      : db.select({ count: count() }).from(comments),

    // Course Enrollments count
    isProfessor
      ? targetCourseIds.length > 0
        ? db.select({ count: count() }).from(courseEnrollments).where(inArray(courseEnrollments.courseId, targetCourseIds))
        : [{ count: 0 }]
      : db.select({ count: count() }).from(courseEnrollments),

    // Submissions pending count
    isProfessor
      ? targetCourseIds.length > 0
        ? db.select({ count: count() }).from(courseSubmissions).where(and(eq(courseSubmissions.status, "PENDING"), inArray(courseSubmissions.courseId, targetCourseIds)))
        : [{ count: 0 }]
      : db.select({ count: count() }).from(courseSubmissions).where(eq(courseSubmissions.status, "PENDING")),

    // Active Events count
    db.select({ count: count() }).from(events),

    // Total points (for professor, sum of points awarded by completing their courses)
    isProfessor
      ? targetCourseIds.length > 0
        ? db.select({ total: sum(pointTransactions.amount) })
            .from(pointTransactions)
            .innerJoin(courseEnrollments, eq(pointTransactions.userId, courseEnrollments.userId))
            .where(and(eq(courseEnrollments.status, "COMPLETED"), inArray(courseEnrollments.courseId, targetCourseIds)))
        : [{ total: 0 }]
      : db.select({ total: sum(pointTransactions.amount) }).from(pointTransactions),

    // Recent joined users
    db.query.users.findMany({
      orderBy: [desc(users.joinedAt)],
      limit: 6,
    }),

    // Pending submissions list
    isProfessor
      ? targetCourseIds.length > 0
        ? db.query.courseSubmissions.findMany({
            where: and(eq(courseSubmissions.status, "PENDING"), inArray(courseSubmissions.courseId, targetCourseIds)),
            orderBy: [desc(courseSubmissions.submittedAt)],
            limit: 5,
          })
        : []
      : db.query.courseSubmissions.findMany({
          where: eq(courseSubmissions.status, "PENDING"),
          orderBy: [desc(courseSubmissions.submittedAt)],
          limit: 5,
        }),
  ]);
 
  const totalPoints = Number(pointsResult?.total ?? 0);

  const stats = [
    ...(isProfessor ? [] : [{ label: "Enrolled ZAIAs",   value: userCountResult?.count ?? 0,        icon: Users, color: "#8B5CF6", href: "/admin/users" }]),
    { label: "Total Posts",       value: postCountResult?.count ?? 0,        icon: PenTool,  color: "#06b6d4", href: "/admin/content" },
    { label: "Comments Received", value: commentCountResult?.count ?? 0,     icon: MessageSquare, color: "#ec4899", href: "/admin/content" },
    { label: "Enrollments",       value: enrollCountResult?.count ?? 0,      icon: GraduationCap, color: "#10b981", href: "/admin/courses" },
    { label: "Pending Reviews",   value: submissionCountResult?.count ?? 0,  icon: ClipboardList, color: "#f59e0b", href: "/admin/submissions" },
    ...(isProfessor ? [] : [{ label: "Active Events",     value: eventCountResult?.count ?? 0,       icon: Trophy, color: "#f43f5e", href: "/admin/events" }]),
  ];

  const quickActions = [
    ...(isProfessor ? [] : [{ href: "/admin/users",       icon: Users, label: "Manage Users",       color: "#8B5CF6" }]),
    { href: "/admin/content",     icon: PenTool,  label: "Manage Content",     color: "#06b6d4" },
    { href: "/admin/submissions", icon: ClipboardList, label: "Review Submissions",  color: "#f59e0b" },
    { href: "/admin/courses",     icon: GraduationCap, label: "Manage Courses",      color: "#10b981" },
    ...(isProfessor ? [] : [
      { href: "/admin/events",      icon: Trophy, label: "Manage Events",       color: "#f43f5e" },
      { href: "/admin/quests",      icon: Target, label: "Manage Quests",       color: "#ec4899" }
    ]),
  ];

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
          <Settings size={28} style={{ color: "#8B5CF6" }} />
          <span>{isProfessor ? "Professor Portal" : "Control Center"}</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Welcome back, <span style={{ color: "#f59e0b" }}>{session.user.name}</span>.
          Here&apos;s what&apos;s happening with your assigned courses.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 36,
        }}
      >
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${s.color}10, ${s.color}05)`,
                border: `1px solid ${s.color}25`,
                borderRadius: 16,
                padding: "20px 22px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "transform 0.2s, border-color 0.2s",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: `${s.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <s.icon size={22} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  {s.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Points Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 16,
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 36,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{isProfessor ? "XP Awarded by Your Courses" : "Total Points Awarded"}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#f59e0b" }}>
            {totalPoints.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 600 }}>PTS</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyItems: "center" }}>
          <Coins size={40} style={{ color: "#f59e0b" }} />
        </div>
      </div>

      {/* Two columns: Quick Actions + Recent Users */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={18} style={{ color: "#ec4899" }} />
            <span>Quick Actions</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  textDecoration: "none",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  transition: "background 0.15s",
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${a.color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <a.icon size={16} style={{ color: a.color }} />
                </span>
                {a.label}
                <ChevronRight size={16} style={{ marginLeft: "auto", color: "#334155" }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recently Joined / Students list */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <UserPlus size={18} style={{ color: "#10b981" }} />
            <span>Recently Joined ZAIAs</span>
          </h2>
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {recentUsers.map((u, i) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 16px",
                  borderBottom: i < recentUsers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: u.role === "ADMIN" ? "rgba(245,158,11,0.2)" : u.role === "PROFESSOR" ? "rgba(139,92,246,0.2)" : "rgba(16,185,129,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {(() => {
                    if (u.role === "ADMIN") return <Settings size={16} style={{ color: "#f59e0b" }} />;
                    if (u.role === "PROFESSOR") return <GraduationCap size={16} style={{ color: "#8b5cf6" }} />;
                    return <Star size={16} style={{ color: "#10b981" }} />;
                  })()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.name ?? u.username ?? "Unknown"}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569" }}>
                    {u.role} · {u.points} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Submissions Alert */}
      {pendingSubmissions.length > 0 && (
        <div
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 14,
            padding: "16px 20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}>
              <ClipboardList size={16} />
              <span>{pendingSubmissions.length} Submission{pendingSubmissions.length > 1 ? "s" : ""} Awaiting Review</span>
            </h3>
            <Link
              href="/admin/submissions"
              style={{ fontSize: 12, color: "#f59e0b", textDecoration: "none", fontWeight: 700 }}
            >
              Review All →
            </Link>
          </div>
          {pendingSubmissions.map((sub) => (
            <div
              key={sub.id}
              style={{
                fontSize: 12,
                color: "#94a3b8",
                padding: "4px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              Submission for course · {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "Unknown date"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
