"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { hashPassword } from "@/lib/auth-crypto";

export type SignUpResult = 
  | { success: true }
  | { success: false; error: string };

export async function signUp(formData: FormData): Promise<SignUpResult> {
  const name = (formData.get("name") as string)?.trim();
  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!name || !username || !email || !password) {
    return { success: false, error: "All fields are required." };
  }

  if (username.includes("@")) {
    return { success: false, error: "Username cannot contain '@' symbol." };
  }

  // Check if username or email already exists
  const existingUser = await db.query.users.findFirst({
    where: or(eq(users.username, username), eq(users.email, email)),
  });

  if (existingUser) {
    if (existingUser.username === username) {
      return { success: false, error: "Username is already taken." };
    }
    return { success: false, error: "Email is already registered." };
  }

  const usernameLower = username.toLowerCase();
  const reservedRole: Record<string, "ZAIA" | "PROFESSOR" | "ADMIN"> = {
    admin: "ADMIN",
    professor: "PROFESSOR",
  };
  const role = reservedRole[usernameLower] ?? "ZAIA";

  const passwordHash = hashPassword(password);
  const id = crypto.randomUUID();

  try {
    await db.insert(users).values({
      id,
      name,
      username,
      email,
      passwordHash,
      role,
    });
    return { success: true };
  } catch (err: any) {
    console.error("Signup failed:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
