import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses, courseEnrollments, courseModules, courseModuleProgress, courseQuizzes } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { KAIA_MEMBERS } from "@/lib/constants/members";
import Link from "next/link";
import { enrollInCourse } from "@/lib/actions/courses";
import { isLevelUnlockedForUser } from "@/lib/actions/levels";
import { redirect } from "next/navigation";
import { getProfMemberId } from "@/lib/constants/profMap";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
  });
  return { title: course ? `${course.title} - Kaiaversity` : "Course Details" };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admissions");
  }

  // 1. Fetch Course details
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
  });
  if (!course) {
    redirect("/campus/courses");
  }

  const isManagement = session.user && ["ADMIN", "PROFESSOR"].includes(session.user.role);
  const memberId = getProfMemberId(session.user.email);

  const levelUnlock = isManagement
    ? { unlocked: true, reason: undefined }
    : await isLevelUnlockedForUser(session.user.id, course.minLevel, course.memberId);
  if (!levelUnlock.unlocked) {
    redirect("/campus/courses");
  }

  const professor = KAIA_MEMBERS.find((m) => m.id === course.memberId);

  // 2. Fetch Modules
  const modules = await db.query.courseModules.findMany({
    where: eq(courseModules.courseId, course.id),
    orderBy: [asc(courseModules.order)],
  });

  // 3. Fetch Enrollment status
  const enrollment = await db.query.courseEnrollments.findFirst({
    where: and(
      eq(courseEnrollments.userId, session.user.id),
      eq(courseEnrollments.courseId, course.id)
    ),
  });

  // 4. Fetch module progress
  const completedProgress = enrollment 
    ? await db.query.courseModuleProgress.findMany({
        where: eq(courseModuleProgress.userId, session.user.id),
      })
    : [];

  const completedModuleIds = new Set(
    completedProgress.filter((p) => p.completed).map((p) => p.moduleId)
  );

  const totalModules = modules.length;
  const readModules = modules.filter((m) => completedModuleIds.has(m.id)).length;
  const allModulesRead = totalModules > 0 && readModules === totalModules;
  const progressPercent = totalModules > 0 ? Math.round((readModules / totalModules) * 100) : 0;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 850, margin: "0 auto" }}>
      {/* Back Button */}
      <Link
        href="/campus/courses"
        style={{
          color: "#64748b",
          fontSize: 13,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 24,
        }}
      >
        ← Back to Campus Courses
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 32, alignItems: "start" }}>
        {/* Left Column: Details */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 48 }}>{course.coverEmoji}</span>
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#a78bfa",
                  background: "rgba(139, 92, 246, 0.1)",
                  padding: "3px 8px",
                  borderRadius: 6,
                }}
              >
                {course.difficulty}
              </span>
              <h1 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: "4px 0 0 0" }}>
                {course.title}
              </h1>
            </div>
          </div>

          <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            {course.description}
          </p>

          <h3 style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            📖 Course Syllabus ({totalModules} Lectures)
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            {modules.map((mod) => {
              const isRead = completedModuleIds.has(mod.id);
              return (
                <div
                  key={mod.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: 12,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: isRead ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                        border: isRead ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: isRead ? "#10b981" : "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      {isRead ? "✓" : mod.order}
                    </span>
                    <div>
                      <h4 style={{ color: isRead ? "#94a3b8" : "white", fontSize: 14, fontWeight: 600, margin: 0 }}>
                        {mod.title}
                      </h4>
                    </div>
                  </div>

                  {enrollment || isManagement ? (
                    <Link
                      href={`/campus/courses/${course.slug}/modules/${mod.order}`}
                      style={{
                        color: "#a78bfa",
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      {isManagement ? "Preview →" : isRead ? "Re-read" : "Study →"}
                    </Link>
                  ) : (
                    <span style={{ color: "#475569", fontSize: 12 }}>Locked</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Instructor Profile & Enrollment Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Enrollment Panel */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <h3 style={{ color: "white", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              Course Status
            </h3>

            {isManagement ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14, display: "block", marginBottom: 4 }}>
                  Professor Access
                </span>
                <span style={{ color: "#64748b", fontSize: 12, display: "block", lineHeight: 1.4 }}>
                  Lectures and quiz syllabus are unlocked for review.
                </span>
                <Link
                  href={`/campus/courses/${course.slug}/quiz`}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "center",
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "none",
                    color: "white",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    marginTop: 14,
                    transition: "background 0.2s ease",
                  }}
                >
                  Preview Quiz
                </Link>
              </div>
            ) : enrollment ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                  <span>Modules Completed</span>
                  <span>{readModules}/{totalModules}</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 20 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
                      borderRadius: 99,
                    }}
                  />
                </div>

                {enrollment.status === "COMPLETED" ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>🏆</div>
                    <span style={{ color: "#10b981", fontWeight: 700, fontSize: 14, display: "block", marginBottom: 4 }}>
                      Course Certified!
                    </span>
                    <span style={{ color: "#64748b", fontSize: 12, display: "block" }}>
                      Score: {enrollment.quizScore}%
                    </span>
                  </div>
                ) : (
                  <Link
                    href={`/campus/courses/${course.slug}/quiz`}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "center",
                      padding: "10px 14px",
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      color: "white",
                      background: allModulesRead
                        ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                        : "rgba(255,255,255,0.05)",
                      border: allModulesRead ? "none" : "1px solid rgba(255,255,255,0.1)",
                      textDecoration: "none",
                      pointerEvents: "auto",
                    }}
                  >
                    📝 Take Course Quiz
                  </Link>
                )}
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
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 13,
                    color: "white",
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Enroll Now
                </button>
              </form>
            )}
          </div>

          {/* Professor Profile Card */}
          {professor && (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: `1px solid ${professor.color}25`,
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: `${professor.color}20`,
                    border: `1px solid ${professor.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  {professor.emoji}
                </span>
                <div>
                  <h4 style={{ color: professor.color, fontWeight: 700, fontSize: 14, margin: 0 }}>
                    Prof. {professor.id === memberId ? `${professor.name} (You)` : professor.name}
                  </h4>
                  <span style={{ color: "#64748b", fontSize: 11 }}>Instructor</span>
                </div>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5, fontStyle: "italic", margin: 0 }}>
                "{professor.motto}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
