import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseSubmissions, courses, users, quizAttempts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { reviewSubmission } from "@/lib/actions/admin";
import { ClipboardCheck, Hourglass, Check, X, CheckSquare, Inbox, BookOpen } from "lucide-react";
import { getProfMemberId } from "@/lib/constants/profMap";

export const metadata: Metadata = { title: "Submissions & Quiz Attempts — Admin" };

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:  { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b" },
  APPROVED: { bg: "rgba(16,185,129,0.12)",  text: "#10b981" },
  REJECTED: { bg: "rgba(239,68,68,0.12)",   text: "#ef4444" },
};

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const session = await auth();
  if (!session?.user || !["PROFESSOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const isProfessor = session.user.role === "PROFESSOR";
  const memberId = getProfMemberId(session.user.email);

  // Resolve professor's own course IDs for filtering
  let profCourseIds: string[] | null = null;
  if (isProfessor && memberId) {
    const profCourses = await db.query.courses.findMany({
      where: eq(courses.memberId, memberId),
    });
    profCourseIds = profCourses.map((c) => c.id);
  }

  // 1. Fetch data depending on active tab
  const isQuizzes = tab === "quizzes";

  // Fetch Project Submissions (filtered for professors)
  let allSubmissions = await db.query.courseSubmissions.findMany({
    orderBy: [desc(courseSubmissions.submittedAt)],
  });
  if (profCourseIds) {
    allSubmissions = allSubmissions.filter((s) => profCourseIds!.includes(s.courseId));
  }

  const projectUserIds = [...new Set(allSubmissions.map((s) => s.userId))];
  const projectCourseIds = [...new Set(allSubmissions.map((s) => s.courseId))];

  const [projectUsers, projectCourses] = await Promise.all([
    projectUserIds.length > 0
      ? db.query.users.findMany({ where: (u, { inArray }) => inArray(u.id, projectUserIds) })
      : [],
    projectCourseIds.length > 0
      ? db.query.courses.findMany({ where: (c, { inArray }) => inArray(c.id, projectCourseIds) })
      : [],
  ]);

  const userMap = Object.fromEntries(projectUsers.map((u) => [u.id, u]));
  const courseMap = Object.fromEntries(projectCourses.map((c) => [c.id, c]));

  const pending = allSubmissions.filter((s) => s.status === "PENDING");
  const reviewed = allSubmissions.filter((s) => s.status !== "PENDING");

  // Fetch Quiz Attempts (filtered for professors)
  let allAttempts = await db.query.quizAttempts.findMany({
    orderBy: [desc(quizAttempts.createdAt)],
  });
  if (profCourseIds) {
    allAttempts = allAttempts.filter((a) => profCourseIds!.includes(a.courseId));
  }

  const attemptUserIds = [...new Set(allAttempts.map((a) => a.userId))];
  const attemptCourseIds = [...new Set(allAttempts.map((a) => a.courseId))];

  const [attemptUsers, attemptCourses] = await Promise.all([
    attemptUserIds.length > 0
      ? db.query.users.findMany({ where: (u, { inArray }) => inArray(u.id, attemptUserIds) })
      : [],
    attemptCourseIds.length > 0
      ? db.query.courses.findMany({ where: (c, { inArray }) => inArray(c.id, attemptCourseIds) })
      : [],
  ]);

  const attemptUserMap = Object.fromEntries(attemptUsers.map((u) => [u.id, u]));
  const attemptCourseMap = Object.fromEntries(attemptCourses.map((c) => [c.id, c]));

  // Calculate try sequence order for attempts
  const attemptsWithCounts = allAttempts.map((att) => {
    // Count how many attempts this specific user has made for this specific course UP TO or TOTAL
    const totalTries = allAttempts.filter(
      (a) => a.userId === att.userId && a.courseId === att.courseId
    ).length;
    return {
      ...att,
      totalTries,
    };
  });

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardCheck size={26} style={{ color: "#8b5cf6" }} />
          <span>Submissions & Quiz Attempts</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          Monitor student quiz scores, try limits, and evaluate final project submissions.
        </p>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: "flex", gap: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 10, marginBottom: 28 }}>
        <Link
          href="/admin/submissions"
          style={{
            fontSize: 14,
            fontWeight: 750,
            textDecoration: "none",
            color: !isQuizzes ? "#a78bfa" : "#64748b",
            borderBottom: !isQuizzes ? "2px solid #8b5cf6" : "2px solid transparent",
            paddingBottom: 10,
            transition: "all 0.2s",
          }}
        >
          Project Submissions ({pending.length} pending)
        </Link>
        <Link
          href="/admin/submissions?tab=quizzes"
          style={{
            fontSize: 14,
            fontWeight: 750,
            textDecoration: "none",
            color: isQuizzes ? "#a78bfa" : "#64748b",
            borderBottom: isQuizzes ? "2px solid #8b5cf6" : "2px solid transparent",
            paddingBottom: 10,
            transition: "all 0.2s",
          }}
        >
          Quiz Attempts Audit ({allAttempts.length})
        </Link>
      </div>

      {/* Tab Contents: Project Submissions */}
      {!isQuizzes && (
        <>
          {pending.length > 0 && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Hourglass size={14} />
                <span>PENDING REVIEW</span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
                {pending.map((sub) => {
                  const subUser = userMap[sub.userId];
                  const subCourse = courseMap[sub.courseId];
                  return (
                    <div
                      key={sub.id}
                      style={{
                        background: "rgba(245,158,11,0.04)",
                        border: "1px solid rgba(245,158,11,0.15)",
                        borderRadius: 14, padding: 20,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 800, color: "white", fontSize: 15 }}>
                            {subCourse?.title ?? "Unknown Course"}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            by <span style={{ color: "#94a3b8" }}>{subUser?.name ?? "Unknown"}</span>
                            {" · "}{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 6,
                          background: STATUS_COLORS.PENDING.bg, color: STATUS_COLORS.PENDING.text,
                          letterSpacing: "0.06em",
                        }}>
                          PENDING
                        </span>
                      </div>

                      <div style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 10, padding: "12px 14px",
                        fontSize: 13, color: "#94a3b8", marginBottom: 14,
                        maxHeight: 120, overflowY: "auto", lineHeight: 1.6,
                      }}>
                        {sub.content}
                      </div>

                      <div style={{ display: "flex", gap: 10 }}>
                        <form action={async () => { "use server"; await reviewSubmission(sub.id, "APPROVED", "Great work! Submission approved."); }}>
                          <button type="submit" style={{
                            padding: "9px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13,
                            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)",
                            color: "#10b981", cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 6
                          }}>
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                        </form>
                        <form action={async () => { "use server"; await reviewSubmission(sub.id, "REJECTED", "Submission needs revision."); }}>
                          <button type="submit" style={{
                            padding: "9px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13,
                            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                            color: "#ef4444", cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 6
                          }}>
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {reviewed.length > 0 && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "#64748b", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckSquare size={14} />
                <span>REVIEWED</span>
              </h2>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, overflow: "hidden",
              }}>
                {reviewed.map((sub, i) => {
                  const s = STATUS_COLORS[sub.status] ?? STATUS_COLORS.PENDING;
                  const subUser = userMap[sub.userId];
                  const subCourse = courseMap[sub.courseId];
                  return (
                    <div
                      key={sub.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "13px 18px",
                        borderBottom: i < reviewed.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "white", fontSize: 13 }}>
                          {subCourse?.title ?? "Unknown Course"}
                        </div>
                        <div style={{ fontSize: 11, color: "#475569" }}>
                          {subUser?.name ?? "Unknown"} · {sub.reviewNote}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 6,
                        background: s.bg, color: s.text, letterSpacing: "0.06em", flexShrink: 0,
                      }}>
                        {sub.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {allSubmissions.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, color: "#475569" }}>
              <Inbox size={48} style={{ color: "#334155", marginBottom: 12 }} />
              <div>No submissions yet</div>
            </div>
          )}
        </>
      )}

      {/* Tab Contents: Quiz Attempts */}
      {isQuizzes && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {attemptsWithCounts.map((att) => {
            const attUser = attemptUserMap[att.userId];
            const attCourse = attemptCourseMap[att.courseId];
            return (
              <div
                key={att.id}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 14,
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: "white", fontSize: 14 }}>
                    {attCourse?.title ?? "Unknown Course"}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    Attempt by <span style={{ color: "#94a3b8" }}>{attUser?.name ?? "Unknown"}</span>
                    {" · "}{attUser?.email ?? "—"}
                    {" · "}{att.createdAt ? new Date(att.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 9px",
                    borderRadius: 6,
                    background: att.passed ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                    color: att.passed ? "#10b981" : "#ef4444",
                    letterSpacing: "0.06em",
                  }}>
                    {att.passed ? "PASSED" : "FAILED"} ({att.score}%)
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#a78bfa",
                    background: "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    padding: "4px 8px",
                    borderRadius: 6,
                  }}>
                    Tries: {att.totalTries}
                  </div>
                </div>
              </div>
            );
          })}

          {allAttempts.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, color: "#475569" }}>
              <BookOpen size={48} style={{ color: "#334155", marginBottom: 12 }} />
              <div>No quiz attempts logged yet</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
