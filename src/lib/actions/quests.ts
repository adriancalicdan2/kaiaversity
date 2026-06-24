"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userQuests, quests, courseModuleProgress, postLikes, comments } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { addPoints } from "./points";
import { getTodayKey } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/** Complete a quest for today — idempotent */
export async function completeQuest(questId: string, pointsOverride?: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  const dateKey = getTodayKey();

  // Check if already completed today
  const existing = await db.query.userQuests.findFirst({
    where: and(
      eq(userQuests.userId, userId),
      eq(userQuests.questId, questId),
      eq(userQuests.dateKey, dateKey)
    ),
  });

  if (existing?.completed) {
    return { alreadyCompleted: true };
  }

  // Get quest to find point value
  const quest = await db.query.quests.findFirst({
    where: eq(quests.id, questId),
  });

  const points = pointsOverride ?? quest?.points ?? 10;

  // Record completion
  if (existing) {
    await db
      .update(userQuests)
      .set({ completed: true, completedAt: new Date() })
      .where(eq(userQuests.id, existing.id));
  } else {
    await db.insert(userQuests).values({
      userId,
      questId,
      completed: true,
      completedAt: new Date(),
      dateKey,
    });
  }

  // Award points
  const result = await addPoints(points, `Quest completed`, questId);
  try {
    revalidatePath("/dashboard");
  } catch (err) {
    // Ignore error if called during render
  }
  return { alreadyCompleted: false, points, ...result };
}

/** Get today's quest completions for the current user */
export async function getTodayQuestStatus() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const dateKey = getTodayKey();
  return db.query.userQuests.findMany({
    where: and(
      eq(userQuests.userId, session.user.id),
      eq(userQuests.dateKey, dateKey)
    ),
  });
}

/** Sync/validate daily quests with real database achievements for today */
export async function checkAndSyncDailyQuests() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const todayKey = getTodayKey();

  // Parse start and end of today in PH timezone (UTC+8)
  const startOfToday = new Date(`${todayKey}T00:00:00+08:00`);
  const endOfToday = new Date(`${todayKey}T23:59:59+08:00`);

  // 1. Auto-complete login quest (user is active because they are loading the page)
  try {
    await completeQuest("quest-daily-login");
  } catch (e) {
    console.error("Login quest error:", e);
  }

  // 2. Query completed modules today
  let modulesCount = 0;
  try {
    const completedModules = await db.query.courseModuleProgress.findMany({
      where: and(
        eq(courseModuleProgress.userId, userId),
        eq(courseModuleProgress.completed, true),
        gte(courseModuleProgress.completedAt, startOfToday),
        lte(courseModuleProgress.completedAt, endOfToday)
      ),
    });
    modulesCount = completedModules.length;
  } catch (e) {
    console.error("Fetch completed modules error:", e);
  }

  // 3. Query likes today
  let likesCount = 0;
  try {
    const likes = await db.query.postLikes.findMany({
      where: and(
        eq(postLikes.userId, userId),
        gte(postLikes.createdAt, startOfToday),
        lte(postLikes.createdAt, endOfToday)
      ),
    });
    likesCount = likes.length;
  } catch (e) {
    console.error("Fetch likes error:", e);
  }

  // 4. Query comments today
  let commentsCount = 0;
  try {
    const userComments = await db.query.comments.findMany({
      where: and(
        eq(comments.userId, userId),
        gte(comments.createdAt, startOfToday),
        lte(comments.createdAt, endOfToday)
      ),
    });
    commentsCount = userComments.length;
  } catch (e) {
    console.error("Fetch comments error:", e);
  }

  // 5. Check and complete each quest type based on real function rules
  if (modulesCount >= 1) {
    try {
      await completeQuest("quest-read-lecture");
      await completeQuest("quest-professor-spotlight");
    } catch (e) {}
  }

  if (likesCount >= 1 && commentsCount >= 1 && (likesCount + commentsCount) >= 3) {
    try {
      await completeQuest("quest-show-love");
    } catch (e) {}
  }

  if (likesCount >= 5) {
    try {
      await completeQuest("quest-fan-art");
    } catch (e) {}
  }

  if (commentsCount >= 3) {
    try {
      await completeQuest("quest-community-helper");
    } catch (e) {}
  }

  // Return all user quest completions for today
  return db.query.userQuests.findMany({
    where: and(
      eq(userQuests.userId, userId),
      eq(userQuests.dateKey, todayKey)
    ),
  });
}
