import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses, courseEnrollments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { KAIA_MEMBERS } from "@/lib/constants/members";
import Link from "next/link";
import { enrollInCourse } from "@/lib/actions/courses";
import { isLevelUnlockedForUser } from "@/lib/actions/levels";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Courses - Campus" };

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "#10b981",     // green
  INTERMEDIATE: "#f59e0b", // yellow
  ADVANCED: "#ef4444",     // red
};

export default async function CoursesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admissions");
  }

  const allCourses = await db.query.courses.findMany({
    where: eq(courses.isActive, true),
  });

  const enrollments = await db.query.courseEnrollments.findMany({
    where: eq(courseEnrollments.userId, session.user.id),
  });

  const coursesWithUnlockStatus = await Promise.all(
    allCourses.map(async (course) => {
      const levelUnlock = await isLevelUnlockedForUser(session.user.id, course.minLevel, course.memberId);
      return {
        ...course,
        levelUnlock,
      };
    })
  );

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 6 }}>
          📚 Campus Lecture Hall
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Enroll in courses taught by your favorite KAIA professors, finish all modules, and pass the quizzes to earn points and unique badges!
        </p>
      </div>

      {coursesWithUnlockStatus.length === 0 ? (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 64,
            textAlign: "center",
            color: "#64748b",
          }}
        >
          No courses are open for registration at the moment. Please check back later! ✨
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 24 }}>
          {coursesWithUnlockStatus.map((course) => {
            const professor = KAIA_MEMBERS.find((m) => m.id === course.memberId);
            const enrollment = enrollments.find((e) => e.courseId === course.id);
            const diffColor = DIFFICULTY_COLORS[course.difficulty] || "#8B5CF6";
            
            const isCompleted = enrollment?.status === "COMPLETED";
            const isInProgress = enrollment?.status === "IN_PROGRESS";

            const levelUnlock = course.levelUnlock;
            const isLocked = !levelUnlock.unlocked;

            return (
              <div
                key={course.id}
                style={{
                  background: isLocked ? "rgba(255, 255, 255, 0.01)" : "rgba(255, 255, 255, 0.03)",
                  border: isLocked
                    ? "1px solid rgba(255, 255, 255, 0.03)"
                    : isCompleted 
                    ? "1px solid rgba(16, 185, 129, 0.25)" 
                    : isInProgress 
                    ? "1px solid rgba(139, 92, 246, 0.25)" 
                    : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: 18,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                  opacity: isLocked ? 0.6 : 1,
                }}
              >
                {/* Visual completion accent */}
                {isCompleted && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      background: "rgba(16, 185, 129, 0.1)",
                      color: "#10b981",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "4px 12px",
                      borderBottomLeftRadius: 12,
                      letterSpacing: "0.05em",
                    }}
                  >
                    COMPLETED
                  </div>
                )}

                {/* Locked badge */}
                {isLocked && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "4px 12px",
                      borderBottomLeftRadius: 12,
                      letterSpacing: "0.05em",
                    }}
                  >
                    🔒 LOCKED
                  </div>
                )}

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 36, filter: isLocked ? "grayscale(80%)" : "none" }}>{course.coverEmoji || "📚"}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: isLocked ? "#475569" : diffColor,
                        border: isLocked ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${diffColor}40`,
                        background: isLocked ? "transparent" : `${diffColor}10`,
                        padding: "3px 8px",
                        borderRadius: 6,
                        letterSpacing: "0.03em",
                      }}
                    >
                      Lvl {course.minLevel} · {course.difficulty}
                    </span>
                  </div>

                  <h3 style={{ color: isLocked ? "#475569" : "white", fontSize: 17, fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>
                    {course.title}
                  </h3>

                  <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
                    {course.description.length > 120 
                      ? `${course.description.slice(0, 120)}...` 
                      : course.description
                    }
                  </p>

                  {isLocked && levelUnlock.reason && (
                    <p style={{ color: "#ef4444", fontSize: 11, fontWeight: 600, background: "rgba(239, 68, 68, 0.05)", padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>
                      ⚠️ {levelUnlock.reason}
                    </p>
                  )}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: professor ? `${professor.color}20` : "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                      }}
                    >
                      {professor?.emoji || "👩‍🏫"}
                    </span>
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
                      Prof. {professor?.name || "KAIA"}
                    </span>
                    <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>
                      ⏱️ {course.estimatedMinutes} mins
                    </span>
                  </div>

                  {isLocked ? (
                    <button
                      disabled
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#475569",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                        cursor: "not-allowed",
                      }}
                    >
                      Locked (Complete Level {course.minLevel - 1})
                    </button>
                  ) : enrollment ? (
                    <Link
                      href={`/campus/courses/${course.slug}`}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "center",
                        padding: "10px 14px",
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 13,
                        textDecoration: "none",
                        color: isCompleted ? "#10b981" : "white",
                        background: isCompleted ? "rgba(16, 185, 129, 0.12)" : "linear-gradient(135deg, #8b5cf6, #ec4899)",
                        border: isCompleted ? "1px solid rgba(16, 185, 129, 0.2)" : "none",
                      }}
                    >
                      {isCompleted ? "Review Lectures" : "Resume Learning"}
                    </Link>
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
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: 13,
                          color: "white",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          cursor: "pointer",
                          transition: "background 0.2s ease",
                        }}
                      >
                        Enroll (+{course.pointsReward} pts)
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
  );
}
