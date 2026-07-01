"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type UpdateProfileResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProfile(
  userId: string,
  data: {
    name: string;
    bio: string | null;
    favoriteMember: string | null;
    image: string | null;
  }
): Promise<UpdateProfileResult> {
  if (!userId) {
    return { success: false, error: "Unauthorized access." };
  }

  const name = data.name.trim();
  if (!name) {
    return { success: false, error: "Display name cannot be empty." };
  }

  if (name.length > 50) {
    return { success: false, error: "Display name cannot exceed 50 characters." };
  }

  const bio = data.bio?.trim() || null;
  if (bio && bio.length > 250) {
    return { success: false, error: "Bio cannot exceed 250 characters." };
  }

  const favoriteMember = data.favoriteMember || null;
  const validSlugs = ["angela", "charice", "alexa", "sophia", "charlotte", null];
  if (!validSlugs.includes(favoriteMember)) {
    return { success: false, error: "Invalid Favorite Professor selection." };
  }

  const image = data.image?.trim() || null;

  try {
    await db
      .update(users)
      .set({
        name,
        bio,
        favoriteMember,
        image,
        lastActive: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath("/profile");
    return { success: true };
  } catch (err) {
    console.error("Failed to update profile:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
