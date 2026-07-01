"use server";

import { db } from "@/lib/db";
import { courses, courseEnrollments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function isLevelUnlockedForUser(
  userId: string,
  level: number,
  memberId?: string | null
): Promise<{ unlocked: boolean; reason?: string }> {
  // Level 1 is always unlocked
  if (level <= 1) {
    return { unlocked: true };
  }

  if (memberId) {
    // Check previous level course for this specific member/professor
    const prevCourse = await db.query.courses.findFirst({
      where: and(
        eq(courses.minLevel, level - 1),
        eq(courses.memberId, memberId),
        eq(courses.isActive, true)
      ),
    });

    if (!prevCourse) {
      return { unlocked: true };
    }

    const enrollment = await db.query.courseEnrollments.findFirst({
      where: and(
        eq(courseEnrollments.userId, userId),
        eq(courseEnrollments.courseId, prevCourse.id)
      ),
    });

    const isCompleted = enrollment?.status === "COMPLETED";
    const quizScore = enrollment?.quizScore ?? 0;

    if (!isCompleted || quizScore < 90) {
      return {
        unlocked: false,
        reason: `Score 90%+ on Level ${level - 1} course taught by this professor. (Current: ${isCompleted ? `${quizScore}%` : "Incomplete"})`,
      };
    }

    return { unlocked: true };
  }

  // Fallback: If no memberId is passed, check if they have unlocked the level for at least one member
  return { unlocked: true };
}
