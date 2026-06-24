import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses, courseModules } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import Link from "next/link";
import { completeModuleProgress } from "@/lib/actions/courses";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
  });
  return { title: course ? `${course.title} - Module ${id}` : `Module ${id}` };
}

export default async function ModulePage({ params }: PageProps) {
  const { slug, id } = await params;
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

  const moduleOrder = parseInt(id, 10);
  if (isNaN(moduleOrder)) {
    redirect(`/campus/courses/${slug}`);
  }

  // 2. Fetch all modules in this course to get ordering
  const modules = await db.query.courseModules.findMany({
    where: eq(courseModules.courseId, course.id),
    orderBy: [asc(courseModules.order)],
  });

  const currentModule = modules.find((m) => m.order === moduleOrder);
  if (!currentModule) {
    redirect(`/campus/courses/${slug}`);
  }

  const nextModule = modules.find((m) => m.order === moduleOrder + 1);
  const prevModule = modules.find((m) => m.order === moduleOrder - 1);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 750, margin: "0 auto" }}>
      {/* Syllabus Link */}
      <Link
        href={`/campus/courses/${slug}`}
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
        ← Back to Course Syllabus
      </Link>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: 20,
          padding: "36px 40px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.1em" }}>
            MODULE {currentModule.order} OF {modules.length}
          </span>
          {currentModule.pointsReward && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 8px", borderRadius: 4 }}>
              +{currentModule.pointsReward} Points
            </span>
          )}
        </div>

        <h1 style={{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
          {currentModule.title}
        </h1>

        {/* Module Content Area */}
        <div
          style={{
            color: "#e2e8f0",
            fontSize: 15,
            lineHeight: 1.8,
            marginBottom: 40,
            whiteSpace: "pre-line",
          }}
        >
          {currentModule.content}
        </div>

        {/* Navigation / Completion Form */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {prevModule ? (
            <Link
              href={`/campus/courses/${slug}/modules/${prevModule.order}`}
              style={{
                color: "#94a3b8",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                padding: "10px 18px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              Previous
            </Link>
          ) : (
            <div />
          )}

          <form
            action={async () => {
              "use server";
              await completeModuleProgress(currentModule.id, course.id);
              if (nextModule) {
                redirect(`/campus/courses/${slug}/modules/${nextModule.order}`);
              } else {
                redirect(`/campus/courses/${slug}`);
              }
            }}
          >
            <button
              type="submit"
              style={{
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                padding: "10px 20px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {nextModule ? "Mark Complete & Next →" : "Finish Reading ✓"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
