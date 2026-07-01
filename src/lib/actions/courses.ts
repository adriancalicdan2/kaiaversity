"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseEnrollments, courseModuleProgress, userCourseBadges, courses, courseQuizzes, courseQuizQuestions, courseQuizAnswers, courseBadges, quizAttempts } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { addPoints } from "./points";
import { revalidatePath } from "next/cache";
import { getProfMemberId } from "@/lib/constants/profMap";

export async function enrollInCourse(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const existing = await db.query.courseEnrollments.findFirst({
    where: and(
      eq(courseEnrollments.userId, userId),
      eq(courseEnrollments.courseId, courseId)
    ),
  });

  if (existing) {
    return { success: true, alreadyEnrolled: true };
  }

  await db.insert(courseEnrollments).values({
    userId,
    courseId,
    status: "IN_PROGRESS",
    enrolledAt: new Date(),
  });

  revalidatePath(`/campus/courses`);
  return { success: true, alreadyEnrolled: false };
}

export async function completeModuleProgress(moduleId: string, courseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const existing = await db.query.courseModuleProgress.findFirst({
    where: and(
      eq(courseModuleProgress.userId, userId),
      eq(courseModuleProgress.moduleId, moduleId)
    ),
  });

  if (!existing) {
    await db.insert(courseModuleProgress).values({
      userId,
      moduleId,
      completed: true,
      completedAt: new Date(),
    });
  }

  revalidatePath(`/campus/courses/${courseId}`);
  return { success: true };
}

export async function submitQuizAnswers(
  courseId: string,
  userAnswers: { questionId: string; selectedAnswerId: string }[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  // Enforce role separation: Only students can take quizzes. Professors can only take OTHER professors' quizzes (not their own).
  if (session.user.role === "PROFESSOR") {
    const memberId = getProfMemberId(session.user.email);

    // Fetch the course to check the instructor
    const courseObj = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (courseObj && courseObj.memberId === memberId) {
      throw new Error("You cannot take the quiz for your own course.");
    }
  } else if (session.user.role === "ADMIN") {
    // Admin is allowed to try/test any quiz
  } else if (session.user.role !== "ZAIA") {
    throw new Error("Only students and professors from other courses can take quizzes.");
  }

  // Enforce daily attempt limits for student accounts (ZAIA)
  if (session.user.role === "ZAIA") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayAttempts = await db.query.quizAttempts.findMany({
      where: and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.courseId, courseId),
        gte(quizAttempts.createdAt, startOfToday)
      ),
    });

    if (todayAttempts.length >= 2) {
      throw new Error("You have reached the maximum of 2 quiz attempts for today. Please try again tomorrow!");
    }
  }

  // 1. Fetch course & quiz details
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });
  if (!course) throw new Error("Course not found");

  const quiz = await db.query.courseQuizzes.findFirst({
    where: eq(courseQuizzes.courseId, courseId),
  });
  if (!quiz) throw new Error("Quiz not found for this course");

  // 2. Fetch all questions and answers for this quiz
  const questions = await db.query.courseQuizQuestions.findMany({
    where: eq(courseQuizQuestions.quizId, quiz.id),
  });

  const questionIds = questions.map((q) => q.id);
  
  // Get all answers for these questions
  const allAnswers = await db.query.courseQuizAnswers.findMany({
    where: (qa, { inArray }) => inArray(qa.questionId, questionIds),
  });

  // Calculate score
  let correctCount = 0;
  const totalQuestions = questions.length;

  for (const q of questions) {
    const userAnswer = userAnswers.find((ua) => ua.questionId === q.id);
    if (userAnswer) {
      const dbAnswer = allAnswers.find(
        (ans) => ans.id === userAnswer.selectedAnswerId && ans.questionId === q.id
      );
      if (dbAnswer?.isCorrect) {
        correctCount++;
      }
    }
  }

  const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const passed = scorePercentage >= (quiz.passingScore ?? 70);

  // 3. Record quiz attempt in history
  await db.insert(quizAttempts).values({
    userId,
    courseId,
    score: scorePercentage,
    passed,
    createdAt: new Date(),
  });

  // 3. Update Enrollment
  const existingEnrollment = await db.query.courseEnrollments.findFirst({
    where: and(
      eq(courseEnrollments.userId, userId),
      eq(courseEnrollments.courseId, courseId)
    ),
  });

  if (existingEnrollment) {
    await db
      .update(courseEnrollments)
      .set({
        status: passed ? "COMPLETED" : "IN_PROGRESS",
        quizScore: scorePercentage,
        quizPassed: passed,
        completedAt: passed ? new Date() : undefined,
      })
      .where(eq(courseEnrollments.id, existingEnrollment.id));
  } else {
    await db.insert(courseEnrollments).values({
      userId,
      courseId,
      status: passed ? "COMPLETED" : "IN_PROGRESS",
      quizScore: scorePercentage,
      quizPassed: passed,
      completedAt: passed ? new Date() : undefined,
      enrolledAt: new Date(),
    });
  }

  let badgeAwarded = null;

  if (passed && session.user.role === "ZAIA") {
    // 4. Award points if they haven't completed it before
    const alreadyCompletedBefore = existingEnrollment?.status === "COMPLETED";
    if (!alreadyCompletedBefore && course.pointsReward) {
      await addPoints(course.pointsReward, `Passed Course: ${course.title}`, courseId);
    }

    // 5. Award badge
    const badge = await db.query.courseBadges.findFirst({
      where: eq(courseBadges.courseId, courseId),
    });

    if (badge) {
      const existingBadge = await db.query.userCourseBadges.findFirst({
        where: and(
          eq(userCourseBadges.userId, userId),
          eq(userCourseBadges.badgeId, badge.id)
        ),
      });

      if (!existingBadge) {
        await db.insert(userCourseBadges).values({
          userId,
          badgeId: badge.id,
          earnedAt: new Date(),
        });
        badgeAwarded = badge;
      }
    }
  }

  revalidatePath(`/campus/courses`);
  revalidatePath(`/campus/courses/${course.slug}`);
  revalidatePath(`/dashboard`);

  return {
    passed,
    score: scorePercentage,
    correctCount,
    totalQuestions,
    badgeAwarded,
  };
}
