import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth-crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Password Login",
      credentials: {
        username: { label: "Username or Email", type: "text", placeholder: "username/email" },
        password: { label: "Password", type: "password", placeholder: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const inputUsername = (credentials.username as string).trim();
        const inputPassword = credentials.password as string;

        const isEmailInput = inputUsername.includes("@");

        let searchUsername = isEmailInput ? undefined : inputUsername;
        let searchEmail = isEmailInput ? inputUsername : undefined;

        // Find existing user by username or email
        let user;
        if (searchUsername) {
          user = await db.query.users.findFirst({
            where: eq(users.username, searchUsername),
          });
        } else if (searchEmail) {
          user = await db.query.users.findFirst({
            where: eq(users.email, searchEmail),
          });
        }

        if (!user) {
          return null; // Reject if user doesn't exist (sign up is handled separately)
        }

        // Determine correct role for reserved usernames
        const usernameLower = user.username?.toLowerCase() || "";
        const reservedRole: Record<string, "ZAIA" | "PROFESSOR" | "ADMIN"> = {
          admin: "ADMIN",
          professor: "PROFESSOR",
        };
        const correctRole = reservedRole[usernameLower] ?? "ZAIA";

        // Role self-healing check
        if (reservedRole[usernameLower] && user.role !== correctRole) {
          await db
            .update(users)
            .set({ role: correctRole })
            .where(eq(users.id, user.id));
          user = { ...user, role: correctRole };
        }

        // Password verification logic
        if (user.passwordHash) {
          const isValid = verifyPassword(inputPassword, user.passwordHash);
          if (!isValid) return null;
        } else {
          // Initialize password on first login for seeded users
          const hash = hashPassword(inputPassword);
          await db
            .update(users)
            .set({ passwordHash: hash })
            .where(eq(users.id, user.id));
          user = { ...user, passwordHash: hash };
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          points: user.points,
          level: user.level,
          username: user.username ?? undefined,
          favoriteMember: user.favoriteMember ?? undefined,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_ID || "mock",
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_SECRET || "mock",
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in, persist user data in the token
      if (user) {
        // Find the user in the database by email to get their persistent DB fields.
        // This is crucial for Google / OAuth sign-ins so the session has the correct DB id and points.
        const dbUser = user.email
          ? await db.query.users.findFirst({
              where: eq(users.email, user.email),
            })
          : null;

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.points = dbUser.points;
          token.level = dbUser.level;
          token.username = dbUser.username ?? undefined;
          token.favoriteMember = dbUser.favoriteMember ?? undefined;
        } else {
          token.id = user.id;
          token.role = user.role;
          token.points = user.points;
          token.level = user.level;
          token.username = user.username;
          token.favoriteMember = user.favoriteMember;
        }
      }

      // On update trigger, re-fetch from DB to get fresh data
      if (trigger === "update" && token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id),
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.points = dbUser.points;
          token.level = dbUser.level;
          token.username = dbUser.username ?? undefined;
          token.favoriteMember = dbUser.favoriteMember ?? undefined;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Map JWT token fields onto the session
      if (token && session.user) {
        session.user.id = token.id!;
        session.user.role = token.role ?? "ZAIA";
        session.user.points = token.points ?? 0;
        session.user.level = token.level ?? 1;
        session.user.username = token.username;
        session.user.favoriteMember = token.favoriteMember;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For Google sign-ins, ensure user exists in our DB
      if (account?.provider === "google" && user.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });
        if (!dbUser) {
          await db.insert(users).values({
            id: user.id ?? crypto.randomUUID(),
            name: user.name ?? user.email,
            email: user.email,
            image: user.image ?? null,
            role: "ZAIA",
          });
        }
        // Update lastActive
        await db
          .update(users)
          .set({ lastActive: new Date() })
          .where(eq(users.email, user.email));
      }
      return true;
    },
  },
  pages: {
    signIn: "/admissions",
    error: "/admissions",
  },
  session: {
    strategy: "jwt",
  },
  debug: true,
});
