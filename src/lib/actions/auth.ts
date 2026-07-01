"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

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

  // 1. Check if username or email already exists in local database
  const existingUser = await db.query.users.findFirst({
    where: or(eq(users.username, username), eq(users.email, email)),
  });

  if (existingUser) {
    if (existingUser.username === username) {
      return { success: false, error: "Username is already taken." };
    }
    return { success: false, error: "Email is already registered." };
  }

  // Determine role
  const usernameLower = username.toLowerCase();
  const reservedRole: Record<string, "ZAIA" | "PROFESSOR" | "ADMIN"> = {
    admin: "ADMIN",
    professor: "PROFESSOR",
  };
  const role = reservedRole[usernameLower] ?? "ZAIA";

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Authentication configuration is incomplete. Missing API Key." };
  }

  // 2. Register account in Firebase Auth via REST API
  try {
    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
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
      return { success: false, error: message || "Failed to create authentication credentials." };
    }

    const firebaseData = await firebaseRes.json();
    const firebaseUid = firebaseData.localId; // Use this as primary key

    // 3. Insert user record into local database
    await db.insert(users).values({
      id: firebaseUid,
      name,
      username,
      email,
      role,
      passwordHash: null, // Password managed by Firebase Auth
    });

    return { success: true };
  } catch (err: any) {
    console.error("Signup failed:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
