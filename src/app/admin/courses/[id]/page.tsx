import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses, courseModules } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { EmojiIcon } from "@/components/shared/EmojiIcon";
import CreateModuleModal from "@/components/admin/CreateModuleModal";
import { getProfMemberId } from "@/lib/constants/profMap";

export const metadata: Metadata = { title: "Course Detail — Admin" };

export default async function AdminCourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user || !["PROFESSOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Fetch course details and modules list in parallel
  const [course, modules] = await Promise.all([
    db.query.courses.findFirst({
      where: eq(courses.id, params.id),
    }),
    db.query.courseModules.findMany({
      where: eq(courseModules.courseId, params.id),
      orderBy: [asc(courseModules.order)],
    }),
  ]);
 
  if (!course) notFound();

  const memberId = getProfMemberId(session.user.email);

  // Verify course ownership if the user is a professor
  if (session.user.role === "PROFESSOR" && course.memberId !== memberId) {
    redirect("/admin/courses");
  }
 
  // Fetch member separately
  const member = course.memberId
    ? await db.query.members.findFirst({ where: (m, { eq }) => eq(m.id, course.memberId!) })
    : null;

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      <Link
        href="/admin/courses"
        style={{ fontSize: 13, color: "#64748b", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20 }}
      >
        <ArrowLeft size={14} />
        <span>Back to Courses</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "rgba(139,92,246,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
        }}>
          <EmojiIcon emoji={course.coverEmoji ?? "📚"} size={26} style={{ color: "#a78bfa" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "white", marginBottom: 4 }}>{course.title}</h1>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            {member?.stageName ? (member.id === memberId ? `${member.stageName} (You)` : member.stageName) : "No instructor"} · {course.difficulty} · Min Level {course.minLevel} · {course.pointsReward} pts
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{
            fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 8,
            background: course.isActive ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)",
            color: course.isActive ? "#10b981" : "#64748b",
          }}>
            {course.isActive ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14, padding: 20, marginBottom: 28,
        color: "#94a3b8", fontSize: 14, lineHeight: 1.7,
      }}>
        {course.description}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          <BookOpen size={16} style={{ color: "#a78bfa" }} />
          <span>Modules ({modules.length})</span>
        </h2>
        <CreateModuleModal courseId={course.id} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {modules.map((mod, i) => (
          <div
            key={mod.id}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "14px 18px",
              display: "flex", alignItems: "flex-start", gap: 14,
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(139,92,246,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "#a78bfa", flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: "white", fontSize: 14, marginBottom: 4 }}>{mod.title}</div>
              <div style={{ fontSize: 11, color: "#475569" }}>
                {mod.pointsReward ?? 0} pts reward
              </div>
              <div style={{
                fontSize: 12, color: "#64748b", marginTop: 8,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              } as React.CSSProperties}>
                {mod.content.slice(0, 200)}…
              </div>
            </div>
          </div>
        ))}
      </div>

      {modules.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
          No modules for this course yet.
        </div>
      )}
    </div>
  );
}
