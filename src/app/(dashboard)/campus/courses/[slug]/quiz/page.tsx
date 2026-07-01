import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses, courseQuizzes, courseQuizQuestions, courseQuizAnswers } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import CourseQuiz from "@/components/campus/CourseQuiz";
import { isLevelUnlockedForUser } from "@/lib/actions/levels";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
  });
  return { title: course ? `Quiz: ${course.title} - Kaiaversity` : "Course Quiz" };
}

export default async function QuizPage({ params }: PageProps) {
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

  const levelUnlock = isManagement
    ? { unlocked: true, reason: undefined }
    : await isLevelUnlockedForUser(session.user.id, course.minLevel, course.memberId);
  if (!levelUnlock.unlocked) {
    redirect(`/campus/courses/${slug}`);
  }

  // 2. Fetch Quiz associated with the course
  const quiz = await db.query.courseQuizzes.findFirst({
    where: eq(courseQuizzes.courseId, course.id),
  });
  if (!quiz) {
    redirect(`/campus/courses/${slug}`);
  }

  // 3. Fetch Quiz Questions
  const questions = await db.query.courseQuizQuestions.findMany({
    where: eq(courseQuizQuestions.quizId, quiz.id),
    orderBy: [asc(courseQuizQuestions.order)],
  });

  const questionIds = questions.map((q) => q.id);

  // 4. Fetch Quiz Answers (options)
  const answers = questionIds.length > 0 
    ? await db.query.courseQuizAnswers.findMany({
        where: (qa, { inArray }) => inArray(qa.questionId, questionIds),
        orderBy: [asc(courseQuizAnswers.order)],
      })
    : [];

  // Structure questions with their options
  const structuredQuestions = questions.map((q) => ({
    id: q.id,
    question: q.question,
    answers: answers
      .filter((a) => a.questionId === q.id)
      .map((a) => ({
        id: a.id,
        answer: a.answer,
      })),
  }));

  return (
    <div style={{ padding: "28px 32px", maxWidth: 850, margin: "0 auto" }}>
      {/* Back Button */}
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
        ← Back to Course Detail
      </Link>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "white", marginBottom: 6 }}>
          📝 {quiz.title}
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Course: {course.title}
        </p>
      </div>

      <CourseQuiz
        course={{
          id: course.id,
          slug: course.slug,
          title: course.title,
          pointsReward: course.pointsReward,
        }}
        quiz={{
          id: quiz.id,
          title: quiz.title,
          passingScore: quiz.passingScore,
        }}
        questions={structuredQuestions}
      />
    </div>
  );
}
