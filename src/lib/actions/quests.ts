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

  // Fetch all user completions for today first (saves separate queries later)
  const completions = await db.query.userQuests.findMany({
    where: and(
      eq(userQuests.userId, userId),
      eq(userQuests.dateKey, todayKey)
    ),
  });

  const completedQuestIds = new Set(
    completions.filter((q) => q.completed).map((q) => q.questId)
  );

  // 1. Auto-complete login quest if not already done
  if (!completedQuestIds.has("quest-daily-login")) {
    try {
      await completeQuest("quest-daily-login");
      completedQuestIds.add("quest-daily-login");
    } catch (e) {
      console.error("Login quest error:", e);
    }
  }

  // 2. Query completed modules, likes, and comments today in parallel
  let modulesCount = 0;
  let likesCount = 0;
  let commentsCount = 0;
  try {
    const [completedModules, likes, userComments] = await Promise.all([
      db.query.courseModuleProgress.findMany({
        where: and(
          eq(courseModuleProgress.userId, userId),
          eq(courseModuleProgress.completed, true),
          gte(courseModuleProgress.completedAt, startOfToday),
          lte(courseModuleProgress.completedAt, endOfToday)
        ),
      }),
      db.query.postLikes.findMany({
        where: and(
          eq(postLikes.userId, userId),
          gte(postLikes.createdAt, startOfToday),
          lte(postLikes.createdAt, endOfToday)
        ),
      }),
      db.query.comments.findMany({
        where: and(
          eq(comments.userId, userId),
          gte(comments.createdAt, startOfToday),
          lte(comments.createdAt, endOfToday)
        ),
      }),
    ]);
    modulesCount = completedModules.length;
    likesCount = likes.length;
    commentsCount = userComments.length;
  } catch (e) {
    console.error("Fetch daily stats error:", e);
  }

  // 3. Complete other quests based on activity, only if not already completed
  if (modulesCount >= 1) {
    if (!completedQuestIds.has("quest-read-lecture")) {
      try { await completeQuest("quest-read-lecture"); } catch (e) {}
    }
    if (!completedQuestIds.has("quest-professor-spotlight")) {
      try { await completeQuest("quest-professor-spotlight"); } catch (e) {}
    }
  }

  if (likesCount >= 1 && commentsCount >= 1 && (likesCount + commentsCount) >= 3) {
    if (!completedQuestIds.has("quest-show-love")) {
      try { await completeQuest("quest-show-love"); } catch (e) {}
    }
  }

  if (likesCount >= 5) {
    if (!completedQuestIds.has("quest-fan-art")) {
      try { await completeQuest("quest-fan-art"); } catch (e) {}
    }
  }

  if (commentsCount >= 3) {
    if (!completedQuestIds.has("quest-community-helper")) {
      try { await completeQuest("quest-community-helper"); } catch (e) {}
    }
  }

  // Final fetch of the day's quest completions (only if some quests were newly completed)
  const newlyCompleted = completedQuestIds.size > completions.filter((q) => q.completed).length;
  if (newlyCompleted) {
    return db.query.userQuests.findMany({
      where: and(
        eq(userQuests.userId, userId),
        eq(userQuests.dateKey, todayKey)
      ),
    });
  }

  return completions;
}
