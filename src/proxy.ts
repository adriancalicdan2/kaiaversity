import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight NextAuth instance for the Edge proxy.
// It ONLY reads the JWT token — NO database calls here.
const { auth } = NextAuth({
  providers: [Credentials({}), Google({})],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token }) { return token; },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as "ZAIA" | "PROFESSOR" | "ADMIN";
      }
      return session;
    },
  },
});

export const proxy = auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  // Redirect ADMIN away from the student dashboard to the admin panel
  if (role === "ADMIN" && pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // Protect /admin routes — only ADMIN and PROFESSOR
  if (pathname.startsWith("/admin")) {
    if (!req.auth || !["ADMIN", "PROFESSOR"].includes(role ?? "")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - api/auth (NextAuth internals)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, images, .png files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images|.*\\.png$).*)",
  ],
};
