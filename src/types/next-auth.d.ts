import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "ZAIA" | "PROFESSOR" | "ADMIN";
      points: number;
      level: number;
      username?: string;
      favoriteMember?: string;
    };
  }

  interface User {
    role?: "ZAIA" | "PROFESSOR" | "ADMIN";
    points?: number;
    level?: number;
    username?: string;
    favoriteMember?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ZAIA" | "PROFESSOR" | "ADMIN";
    points?: number;
    level?: number;
    username?: string;
    favoriteMember?: string;
  }
}
