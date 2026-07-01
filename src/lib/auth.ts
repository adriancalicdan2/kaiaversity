import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth-crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Firebase Auth",
      credentials: {
        username: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
        idToken: { label: "Firebase ID Token", type: "text" },
      },
      async authorize(credentials) {
        console.log("[NextAuth] authorize callback triggered with credentials:", {
          hasUsername: !!credentials?.username,
          hasPassword: !!credentials?.password,
          hasIdToken: !!credentials?.idToken,
        });

        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!apiKey) {
          console.error("[NextAuth] ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is missing in environment!");
          return null;
        }

        // Case 1: Client authenticated via Firebase (e.g. Google OAuth) and sent idToken
        if (credentials?.idToken) {
          const idToken = credentials.idToken as string;
          console.log("[NextAuth] Processing Firebase ID Token authentication...");
          try {
            const response = await fetch(
              `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
              }
            );

            if (!response.ok) {
              const errData = await response.json();
              console.error("[NextAuth] Firebase ID Token lookup failed:", errData);
              return null;
            }

            const data = await response.json();
            const firebaseUser = data.users?.[0];
            if (!firebaseUser) {
              console.error("[NextAuth] Firebase lookup returned no user details");
              return null;
            }

            const firebaseUid = firebaseUser.localId;
            const email = firebaseUser.email;
            const name = firebaseUser.displayName || email.split("@")[0];
            const image = firebaseUser.photoUrl || null;
            console.log("[NextAuth] Firebase token lookup success for:", email, "UID:", firebaseUid);

            // Find or create user in local SQLite database
            let user = await db.query.users.findFirst({
              where: eq(users.email, email),
            });

            if (!user) {
              console.log("[NextAuth] User does not exist locally. Creating DB profile for UID:", firebaseUid);
              // Create user record using Firebase Uid
              await db.insert(users).values({
                id: firebaseUid,
                email,
                name,
                image,
                role: "ZAIA",
              });
              user = await db.query.users.findFirst({
                where: eq(users.id, firebaseUid),
              });
            } else if (!user.image && image) {
              console.log("[NextAuth] Updating user profile image with Google photoUrl:", image);
              await db.update(users)
                .set({ image })
                .where(eq(users.id, user.id));
              user.image = image;
            }

            if (!user) {
              console.error("[NextAuth] Failed to retrieve or create user in local database");
              return null;
            }

            console.log("[NextAuth] Auth resolution success for student:", user.name, "Role:", user.role);

            // Update lastActive
            await db.update(users)
              .set({ lastActive: new Date() })
              .where(eq(users.id, user.id));

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              points: user.points,
              level: user.level,
              username: user.username ?? undefined,
              favoriteMember: user.favoriteMember ?? undefined,
              image: user.image ?? undefined,
            };
          } catch (err) {
            console.error("[NextAuth] Firebase ID Token verification error:", err);
            return null;
          }
        }

        // Case 2: Credentials Login (Email/Username + Password)
        if (!credentials?.username || !credentials?.password) {
          console.warn("[NextAuth] Credentials sign-in missing username or password");
          return null;
        }

        const inputUsername = (credentials.username as string).trim();
        const inputPassword = credentials.password as string;
        const isEmailInput = inputUsername.includes("@");

        let email = "";
        let localUser = null;

        if (isEmailInput) {
          email = inputUsername;
          localUser = await db.query.users.findFirst({
            where: eq(users.email, email),
          });
        } else {
          localUser = await db.query.users.findFirst({
            where: eq(users.username, inputUsername),
          });
          if (localUser) {
            email = localUser.email;
          } else {
            console.warn("[NextAuth] Local username not found in database:", inputUsername);
            return null;
          }
        }

        console.log("[NextAuth] Processing credentials sign-in for email:", email);

        try {
          const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                password: inputPassword,
                returnSecureToken: true,
              }),
            }
          );

          if (!response.ok) {
            const errData = await response.json();
            const errorCode = errData.error?.message;
            console.warn("[NextAuth] Firebase signInWithPassword failed. Error Code:", errorCode);

            // Self-healing migration for seeded/existing local users not yet registered in Firebase
            if (errorCode === "EMAIL_NOT_FOUND" && localUser && localUser.passwordHash) {
              console.log("[NextAuth] User exists locally with password hash. Migrating...");
              const isValidLocal = verifyPassword(inputPassword, localUser.passwordHash);
              if (isValidLocal) {
                console.log(`[NextAuth] Migrating seeded user ${email} to Firebase Auth...`);
                const registerRes = await fetch(
                  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email,
                      password: inputPassword,
                      returnSecureToken: true,
                    }),
                  }
                );

                if (registerRes.ok) {
                  console.log("[NextAuth] Seeded user successfully created in Firebase Auth. Removing local password hash.");
                  await db.update(users)
                    .set({ passwordHash: null, lastActive: new Date() })
                    .where(eq(users.id, localUser.id));
                  
                  localUser = { ...localUser, passwordHash: null };

                  return {
                    id: localUser.id,
                    name: localUser.name,
                    email: localUser.email,
                    role: localUser.role,
                    points: localUser.points,
                    level: localUser.level,
                    username: localUser.username ?? undefined,
                    favoriteMember: localUser.favoriteMember ?? undefined,
                  };
                } else {
                  console.error("[NextAuth] Failed to migrate user to Firebase Auth:", await registerRes.json());
                }
              }
            }

            console.error("[NextAuth] Firebase Sign-In failed response:", errData);
            return null;
          }

          const data = await response.json();
          const firebaseUid = data.localId;
          console.log("[NextAuth] Credentials verification success. Firebase UID:", firebaseUid);

          // Resolve local user profile by email or Uid
          let user = await db.query.users.findFirst({
            where: or(eq(users.email, email), eq(users.id, firebaseUid)),
          });

          if (!user) {
            console.log("[NextAuth] User successfully verified but missing local profile. Creating local record...");
            await db.insert(users).values({
              id: firebaseUid,
              email,
              name: email.split("@")[0],
              role: "ZAIA",
            });
            user = await db.query.users.findFirst({
              where: eq(users.id, firebaseUid),
            });
          }

          if (!user) {
            console.error("[NextAuth] Failed to resolve local user profile");
            return null;
          }

          // Role self-healing check
          const usernameLower = user.username?.toLowerCase() || "";
          const reservedRole: Record<string, "ZAIA" | "PROFESSOR" | "ADMIN"> = {
            admin: "ADMIN",
            professor: "PROFESSOR",
          };
          const correctRole = reservedRole[usernameLower] ?? "ZAIA";

          if (reservedRole[usernameLower] && user.role !== correctRole) {
            console.log("[NextAuth] Correcting reserved username role to:", correctRole);
            await db
              .update(users)
              .set({ role: correctRole })
              .where(eq(users.id, user.id));
            user = { ...user, role: correctRole };
          }

          // Update lastActive
          await db.update(users)
            .set({ lastActive: new Date() })
            .where(eq(users.id, user.id));

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            points: user.points,
            level: user.level,
            username: user.username ?? undefined,
            favoriteMember: user.favoriteMember ?? undefined,
            image: user.image ?? undefined,
          };
        } catch (err) {
          console.error("[NextAuth] Firebase Credentials authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
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
          token.picture = dbUser.image;
        } else {
          token.id = user.id;
          token.role = user.role;
          token.points = user.points;
          token.level = user.level;
          token.username = user.username;
          token.favoriteMember = user.favoriteMember;
          token.picture = user.image;
        }
      }

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
          token.picture = dbUser.image;
          token.name = dbUser.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id!;
        session.user.role = token.role ?? "ZAIA";
        session.user.points = token.points ?? 0;
        session.user.level = token.level ?? 1;
        session.user.username = token.username;
        session.user.favoriteMember = token.favoriteMember;
        session.user.image = token.picture as string || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admissions",
    error: "/admissions",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
});
