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
  courseModules,
} from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth-crypto";

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

export async function createUserManually(
  name: string,
  username: string,
  email: string,
  role: "ZAIA" | "PROFESSOR" | "ADMIN",
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const cleanName = name.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanUsername || !cleanEmail || !cleanPassword) {
      return { success: false, error: "All fields are required." };
    }

    if (cleanUsername.includes("@")) {
      return { success: false, error: "Username cannot contain '@' symbol." };
    }

    // Check for existing username or email in SQLite
    const existing = await db.query.users.findFirst({
      where: or(eq(users.email, cleanEmail), eq(users.username, cleanUsername)),
    });

    if (existing) {
      if (existing.username === cleanUsername) {
        return { success: false, error: "Username is already taken." };
      }
      return { success: false, error: "Email is already registered." };
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Authentication configuration is incomplete. Missing API Key." };
    }

    // 1. Register account in Firebase Auth immediately via REST API
    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          returnSecureToken: true,
        }),
      }
    );

    if (!firebaseRes.ok) {
      const errData = await firebaseRes.json();
      const message = errData.error?.message;
      if (message === "EMAIL_EXISTS") {
        return { success: false, error: "Email is already registered in Firebase." };
      } else if (message === "WEAK_PASSWORD : Password should be at least 6 characters") {
        return { success: false, error: "Password must be at least 6 characters long." };
      }
      return { success: false, error: message || "Failed to register credentials in Firebase Auth." };
    }

    const firebaseData = await firebaseRes.json();
    const firebaseUid = firebaseData.localId; // Firebase UID

    // 2. Insert user record into local SQLite database mapping the UID
    await db.insert(users).values({
      id: firebaseUid,
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      role,
      passwordHash: null, // Password managed in Firebase Auth
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Failed to create user manually:", err);
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function addCourseModule(
  courseId: string,
  title: string,
  content: string,
  pointsReward: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminOrProfessor();

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      return { success: false, error: "Title and content are required." };
    }

    // Get current maximum order for modules in this course to append sequential ordering
    const existingModules = await db.query.courseModules.findMany({
      where: eq(courseModules.courseId, courseId),
    });
    const nextOrder = existingModules.reduce((max, m) => Math.max(max, m.order), 0) + 1;

    await db.insert(courseModules).values({
      courseId,
      title: cleanTitle,
      content: cleanContent,
      pointsReward,
      order: nextOrder,
    });

    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath(`/campus/courses`);
    const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    if (course) {
      revalidatePath(`/campus/courses/${course.slug}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to add course module:", err);
    return { success: false, error: err.message || "Failed to add course module." };
  }
}
