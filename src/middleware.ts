// PatentSale middleware — protects /admin routes with NextAuth session.
// The admin panel is the only write path to the marketplace, so it must never
// be reachable by unauthenticated users. Public routes are unaffected.
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    pages: { signIn: "/admin/login" },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Protect everything under /admin EXCEPT the login page itself.
  matcher: ["/admin/((?!login).*)"],
};
