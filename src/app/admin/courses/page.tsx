import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses, courseEnrollments, courseModules, members } from "@/lib/db/schema";
import { desc, count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { toggleCourseActive } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Course Management — Admin" };

const DIFF_COLORS: Record<string, { bg: string; text: string }> = {
  BEGINNER:     { bg: "rgba(16,185,129,0.12)",  text: "#10b981" },
  INTERMEDIATE: { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b" },
  ADVANCED:     { bg: "rgba(239,68,68,0.12)",   text: "#ef4444" },
};

export default async function AdminCoursesPage() {
  const session = await auth();
  if (!session?.user || !["PROFESSOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const allCourses = await db.query.courses.findMany({
    orderBy: [desc(courses.order)],
  });

  // Fetch members separately
  const memberIds = [...new Set(allCourses.map((c) => c.memberId).filter(Boolean))] as string[];
  const membersArr = memberIds.length > 0
    ? await db.query.members.findMany({ where: (m, { inArray }) => inArray(m.id, memberIds) })
    : [];
  const memberMap = Object.fromEntries(membersArr.map((m) => [m.id, m]));

  // Enrollment counts per course
  const enrollmentCounts = await db
    .select({ courseId: courseEnrollments.courseId, count: count() })
    .from(courseEnrollments)
    .groupBy(courseEnrollments.courseId);
  const enrollMap = Object.fromEntries(enrollmentCounts.map((e) => [e.courseId, e.count]));

  // Module counts per course
  const moduleCounts = await db
    .select({ courseId: courseModules.courseId, count: count() })
    .from(courseModules)
    .groupBy(courseModules.courseId);
  const moduleMap = Object.fromEntries(moduleCounts.map((m) => [m.courseId, m.count]));

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4 }}>
          🎓 Course Management
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          {allCourses.length} courses · Toggle active status or view course detail
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {allCourses.map((course) => {
          const diffStyle = DIFF_COLORS[course.difficulty] ?? DIFF_COLORS.BEGINNER;
          const enrollCount = enrollMap[course.id] ?? 0;
          const moduleCount = moduleMap[course.id] ?? 0;
          const member = course.memberId ? memberMap[course.memberId] : null;

          return (
            <div
              key={course.id}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${course.isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}`,
                borderRadius: 14, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 16,
                opacity: course.isActive ? 1 : 0.55,
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "rgba(139,92,246,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>
                {course.coverEmoji ?? "📚"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, color: "white", fontSize: 14 }}>{course.title}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: diffStyle.bg, color: diffStyle.text, letterSpacing: "0.05em" }}>
                    {course.difficulty}
                  </span>
                  {!course.isActive && (
                    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: "rgba(100,116,139,0.15)", color: "#64748b", letterSpacing: "0.05em" }}>
                      INACTIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {member?.stageName ?? "No instructor"} ·{" "}
                  {moduleCount} module{moduleCount !== 1 ? "s" : ""} ·{" "}
                  {enrollCount} enrolled ·{" "}
                  {course.pointsReward} pts reward ·{" "}
                  Min Lvl {course.minLevel}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Link
                  href={`/admin/courses/${course.id}`}
                  style={{
                    fontSize: 12, fontWeight: 700, color: "#8b5cf6",
                    background: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    padding: "6px 14px", borderRadius: 8, textDecoration: "none",
                  }}
                >
                  View
                </Link>
                <form action={async () => { "use server"; await toggleCourseActive(course.id, course.isActive ?? true); }}>
                  <button type="submit" style={{
                    fontSize: 12, fontWeight: 700,
                    color: course.isActive ? "#ef4444" : "#10b981",
                    background: course.isActive ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                    border: `1px solid ${course.isActive ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                    padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                  }}>
                    {course.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {allCourses.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
          No courses yet.
        </div>
      )}
    </div>
  );
}
