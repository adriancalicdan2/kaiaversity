"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  posts,
  courses,
  courseEnrollments,
  courseSubmissions,
  events,
  quests,
  achievements,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Guard helpers ───────────────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized. Admin role required.");
  }
  return session;
}

async function requireAdminOrProfessor() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "PROFESSOR"].includes(session.user.role)) {
    throw new Error("Unauthorized.");
  }
  return session;
}

// ─── USER MANAGEMENT ────────────────────────────────────────────

export async function updateUserRole(
  userId: string,
  newRole: "ZAIA" | "PROFESSOR" | "ADMIN"
): Promise<void> {
  await requireAdmin();
  await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
}

export async function adjustUserPoints(userId: string, delta: number): Promise<void> {
  await requireAdmin();
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return;
  const newPoints = Math.max(0, (user.points ?? 0) + delta);
  await db.update(users).set({ points: newPoints }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string): Promise<void> {
  await requireAdmin();
  // Null out references to prevent foreign key constraint violations in SQLite
  await db.update(posts).set({ authorId: null }).where(eq(posts.authorId, userId));
  await db
    .update(courseSubmissions)
    .set({ reviewerId: null })
    .where(eq(courseSubmissions.reviewerId, userId));

  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
}

// ─── CONTENT / POSTS ────────────────────────────────────────────

export async function togglePostPublished(postId: string, current: boolean): Promise<void> {
  await requireAdminOrProfessor();
  await db.update(posts).set({ published: !current }).where(eq(posts.id, postId));
  revalidatePath("/admin/content");
  revalidatePath("/community");
}

export async function togglePostPinned(postId: string, current: boolean): Promise<void> {
  await requireAdminOrProfessor();
  await db.update(posts).set({ pinned: !current }).where(eq(posts.id, postId));
  revalidatePath("/admin/content");
  revalidatePath("/community");
}

export async function deletePost(postId: string): Promise<void> {
  await requireAdminOrProfessor();
  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath("/admin/content");
  revalidatePath("/community");
}

// ─── COURSES ────────────────────────────────────────────────────

export async function toggleCourseActive(courseId: string, current: boolean): Promise<void> {
  await requireAdminOrProfessor();
  await db.update(courses).set({ isActive: !current }).where(eq(courses.id, courseId));
  revalidatePath("/admin/courses");
  revalidatePath("/campus");
}

// ─── SUBMISSIONS ─────────────────────────────────────────────────

export async function reviewSubmission(
  submissionId: string,
  status: "APPROVED" | "REJECTED",
  reviewNote: string
): Promise<void> {
  const session = await requireAdminOrProfessor();
  await db
    .update(courseSubmissions)
    .set({
      status,
      reviewNote,
      reviewerId: session.user.id,
      reviewedAt: new Date(),
    })
    .where(eq(courseSubmissions.id, submissionId));

  // If approved, mark enrollment as completed
  if (status === "APPROVED") {
    const submission = await db.query.courseSubmissions.findFirst({
      where: eq(courseSubmissions.id, submissionId),
    });
    if (submission) {
      await db
        .update(courseEnrollments)
        .set({ status: "COMPLETED", completedAt: new Date() })
        .where(
          and(
            eq(courseEnrollments.userId, submission.userId),
            eq(courseEnrollments.courseId, submission.courseId)
          )
        );
    }
  }

  revalidatePath("/admin/submissions");
}

// ─── EVENTS ──────────────────────────────────────────────────────

export async function createEvent(formData: FormData): Promise<void> {
  await requireAdminOrProfessor();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as "LIVE" | "CHALLENGE" | "FANMEET" | "BIRTHDAY";
  const points = parseInt(formData.get("points") as string) || 50;
  const startDateStr = formData.get("startDate") as string;

  if (!title || !type) return;

  await db.insert(events).values({
    title,
    description: description || undefined,
    type,
    points,
    startDate: startDateStr ? new Date(startDateStr) : undefined,
    isActive: true,
  });

  revalidatePath("/admin/events");
}

export async function toggleEvent(eventId: string, current: boolean): Promise<void> {
  await requireAdminOrProfessor();
  await db.update(events).set({ isActive: !current }).where(eq(events.id, eventId));
  revalidatePath("/admin/events");
}

export async function deleteEvent(eventId: string): Promise<void> {
  await requireAdminOrProfessor();
  await db.delete(events).where(eq(events.id, eventId));
  revalidatePath("/admin/events");
}

// ─── QUESTS ──────────────────────────────────────────────────────

export async function createQuest(formData: FormData): Promise<void> {
  await requireAdminOrProfessor();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const points = parseInt(formData.get("points") as string) || 10;
  const resetDaily = formData.get("resetDaily") === "true";

  if (!title || !description) return;

  await db.insert(quests).values({ title, description, points, resetDaily, active: true });
  revalidatePath("/admin/quests");
}

export async function toggleQuest(questId: string, current: boolean): Promise<void> {
  await requireAdminOrProfessor();
  await db.update(quests).set({ active: !current }).where(eq(quests.id, questId));
  revalidatePath("/admin/quests");
}

export async function deleteQuest(questId: string): Promise<void> {
  await requireAdmin();
  await db.delete(quests).where(eq(quests.id, questId));
  revalidatePath("/admin/quests");
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────

export async function createAchievement(formData: FormData): Promise<void> {
  await requireAdminOrProfessor();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon = formData.get("icon") as string;
  const points = parseInt(formData.get("points") as string) || 0;
  const rarity = formData.get("rarity") as "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

  if (!name || !description || !icon || !rarity) return;

  await db.insert(achievements).values({
    name,
    description,
    icon,
    points,
    rarity,
    isActive: true,
  });
  revalidatePath("/admin/achievements");
}

export async function toggleAchievement(achievementId: string, current: boolean): Promise<void> {
  await requireAdminOrProfessor();
  await db
    .update(achievements)
    .set({ isActive: !current })
    .where(eq(achievements.id, achievementId));
  revalidatePath("/admin/achievements");
}

export async function deleteAchievement(achievementId: string): Promise<void> {
  await requireAdmin();
  await db.delete(achievements).where(eq(achievements.id, achievementId));
  revalidatePath("/admin/achievements");
}
