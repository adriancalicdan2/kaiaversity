"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, comments, postLikes, users } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { addCappedPoints } from "./points";
import { DAILY_CAPS } from "@/lib/constants/levels";
import { getProfMemberId } from "@/lib/constants/profMap";
import { revalidatePath } from "next/cache";

/** Like a post — prevents double likes */
export async function likePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const existing = await db.query.postLikes.findFirst({
    where: and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)),
  });

  if (existing) {
    // Unlike
    await db.delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    await db.update(posts)
      .set({ likes: sql`${posts.likes} - 1` })
      .where(eq(posts.id, postId));
    revalidatePath("/dashboard");
    return { liked: false };
  }

  // Like
  await db.insert(postLikes).values({ postId, userId });
  await db.update(posts)
    .set({ likes: sql`${posts.likes} + 1` })
    .where(eq(posts.id, postId));
  await addCappedPoints(2, "Liked a post", DAILY_CAPS.LIKES, postId);

  revalidatePath("/dashboard");
  return { liked: true };
}

/** Add a comment to a post */
export async function addComment(postId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!content.trim()) throw new Error("Comment cannot be empty");

  const comment = await db.insert(comments).values({
    postId,
    userId: session.user.id,
    content: content.trim(),
  }).returning();

  await addCappedPoints(5, "Wrote a comment", DAILY_CAPS.COMMENTS, postId);
  revalidatePath(`/dashboard`);
  return comment[0];
}

/** Fetch all comments for a post with author names */
export async function getPostComments(postId: string) {
  const rows = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      likes: comments.likes,
      userId: comments.userId,
      userName: users.name,
      userRole: users.role,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));

  return rows;
}

/** Increment post view count */
export async function recordPostView(postId: string) {
  await db.update(posts)
    .set({ views: sql`${posts.views} + 1` })
    .where(eq(posts.id, postId));
}

/** Create a post (PROFESSOR / ADMIN only) */
export async function createPost(data: {
  title: string;
  content: string;
  type: "LECTURE" | "ANNOUNCEMENT" | "DIARY" | "ASSIGNMENT";
  memberId?: string;
  images?: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!["PROFESSOR", "ADMIN"].includes(session.user.role)) {
    throw new Error("Forbidden");
  }

  let finalMemberId = data.memberId;

  if (session.user.role === "PROFESSOR") {
    const mapped = getProfMemberId(session.user.email);
    if (mapped) {
      finalMemberId = mapped;
    }
  }

  const post = await db.insert(posts).values({
    ...data,
    memberId: finalMemberId,
    authorId: session.user.id,
    images: data.images ? JSON.stringify(data.images) : null,
    published: true,
    excerpt: data.content.slice(0, 160),
  }).returning();

  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  return post[0];
}
