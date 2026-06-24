import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseSubmissions, courses, users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { reviewSubmission } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Submission Review — Admin" };

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:  { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b" },
  APPROVED: { bg: "rgba(16,185,129,0.12)",  text: "#10b981" },
  REJECTED: { bg: "rgba(239,68,68,0.12)",   text: "#ef4444" },
};

export default async function AdminSubmissionsPage() {
  const session = await auth();
  if (!session?.user || !["PROFESSOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const allSubmissions = await db.query.courseSubmissions.findMany({
    orderBy: [desc(courseSubmissions.submittedAt)],
  });

  // Fetch related users and courses separately
  const userIds = [...new Set(allSubmissions.map((s) => s.userId))];
  const courseIds = [...new Set(allSubmissions.map((s) => s.courseId))];

  const [submissionUsers, submissionCourses] = await Promise.all([
    userIds.length > 0
      ? db.query.users.findMany({ where: (u, { inArray }) => inArray(u.id, userIds) })
      : [],
    courseIds.length > 0
      ? db.query.courses.findMany({ where: (c, { inArray }) => inArray(c.id, courseIds) })
      : [],
  ]);

  const userMap = Object.fromEntries(submissionUsers.map((u) => [u.id, u]));
  const courseMap = Object.fromEntries(submissionCourses.map((c) => [c.id, c]));

  const pending = allSubmissions.filter((s) => s.status === "PENDING");
  const reviewed = allSubmissions.filter((s) => s.status !== "PENDING");

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4 }}>
          📋 Submission Review
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          <span style={{ color: "#f59e0b" }}>{pending.length} pending</span> · {reviewed.length} reviewed
        </p>
      </div>

      {pending.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b", letterSpacing: "0.08em", marginBottom: 12 }}>
            ⏳ PENDING REVIEW
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
                      }}>
                        ✅ Approve
                      </button>
                    </form>
                    <form action={async () => { "use server"; await reviewSubmission(sub.id, "REJECTED", "Submission needs revision."); }}>
                      <button type="submit" style={{
                        padding: "9px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13,
                        background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                        color: "#ef4444", cursor: "pointer",
                      }}>
                        ❌ Reject
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
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#64748b", letterSpacing: "0.08em", marginBottom: 12 }}>
            ✅ REVIEWED
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
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
          No submissions yet 🎉
        </div>
      )}
    </div>
  );
}
