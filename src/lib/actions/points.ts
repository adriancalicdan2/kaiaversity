"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, pointTransactions, userAchievements, achievements } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getLevelFromPoints } from "@/lib/constants/levels";
import { revalidatePath } from "next/cache";

/** Core function: add points to the authenticated user */
export async function addPoints(amount: number, reason: string, referenceId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // 1. Get current points
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error("User not found");

  const oldPoints = user.points ?? 0;
  const newPoints = oldPoints + amount;
  const oldLevel = getLevelFromPoints(oldPoints).level;
  const newLevel = getLevelFromPoints(newPoints).level;

  // 2. Update points + level
  await db.update(users)
    .set({
      points: newPoints,
      level: newLevel,
      lastActive: new Date(),
    })
    .where(eq(users.id, userId));

  // 3. Log transaction
  await db.insert(pointTransactions).values({
    userId,
    amount,
    reason,
    referenceId,
  });

  // 4. Check for level-up achievements
  if (newLevel > oldLevel) {
    await checkLevelAchievements(userId, newLevel);
  }

  try {
    revalidatePath("/dashboard");
  } catch (err) {
    // Ignore error if called during render
  }
  return { newPoints, newLevel, leveledUp: newLevel > oldLevel };
}

function getTodayRangeInManila(): { start: Date; end: Date } {
  const now = new Date();
  const phDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const yyyy = phDate.getFullYear();
  const mm = String(phDate.getMonth() + 1).padStart(2, "0");
  const dd = String(phDate.getDate()).padStart(2, "0");
  const start = new Date(`${yyyy}-${mm}-${dd}T00:00:00+08:00`);
  const end = new Date(`${yyyy}-${mm}-${dd}T23:59:59.999+08:00`);
  return { start, end };
}

export async function addCappedPoints(
  amount: number,
  reason: string,
  dailyCap: number,
  referenceId?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const { start, end } = getTodayRangeInManila();
  const todayTotalRows = await db
    .select({
      total: sql<number>`coalesce(sum(${pointTransactions.amount}), 0)`,
    })
    .from(pointTransactions)
    .where(
      sql`${pointTransactions.userId} = ${userId}
      and ${pointTransactions.reason} = ${reason}
      and ${pointTransactions.createdAt} >= ${start}
      and ${pointTransactions.createdAt} <= ${end}`
    );

  const earnedToday = Number(todayTotalRows[0]?.total ?? 0);
  const remaining = Math.max(0, dailyCap - earnedToday);

  if (remaining <= 0) {
    return { capped: true, awarded: 0 };
  }

  const awarded = Math.min(amount, remaining);
  const result = await addPoints(awarded, reason, referenceId);
  return { capped: awarded < amount, awarded, ...result };
}

/** Grant a specific achievement to a user if not already earned */
export async function grantAchievement(userId: string, achievementId: string) {
  // Check if already earned
  const existing = await db.query.userAchievements.findFirst({
    where: (ua, { and }) =>
      and(eq(ua.userId, userId), eq(ua.achievementId, achievementId)),
  });
  if (existing) return null;

  const achievement = await db.query.achievements.findFirst({
    where: eq(achievements.id, achievementId),
  });
  if (!achievement) return null;

  await db.insert(userAchievements).values({ userId, achievementId });

  // Award bonus points if achievement has points
  if (achievement.points && achievement.points > 0) {
    await addPoints(achievement.points, `Achievement: ${achievement.name}`, achievementId);
  }

  return achievement;
}

export async function syncLevelAchievements(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return;

  const currentLevel = user.level ?? 1;
  const levelAchievementMap: Record<number, string> = {
    1: "ach-freshman",
    2: "ach-sophomore",
    3: "ach-junior",
    4: "ach-senior",
    5: "ach-graduate",
  };

  for (let lvl = 1; lvl <= currentLevel; lvl++) {
    const achId = levelAchievementMap[lvl];
    if (achId) {
      await grantAchievement(userId, achId);
    }
  }
}

async function checkLevelAchievements(userId: string, newLevel: number) {
  await syncLevelAchievements(userId);
}

/** Award daily login points (once per day) */
export async function claimDailyLogin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const today = new Date().toLocaleDateString("en-PH", { timeZone: "Asia/Manila" });
  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  if (!user) throw new Error("User not found");

  const lastActive = user.lastActive;
  const lastDay = lastActive
    ? new Date(lastActive).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })
    : null;

  if (lastDay === today) {
    return { alreadyClaimed: true };
  }

  const result = await addPoints(10, "Daily login", undefined);
  return { alreadyClaimed: false, ...result };
}
