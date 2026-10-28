"use client";
// Auth route group layout — wraps login in a SessionProvider so the login page
// can use useSession() to redirect-if-already-authenticated. This group is
// SEPARATE from the protected (admin) group, so the server-side session check
// in (admin)/admin/layout.tsx does NOT apply here.
import { SessionProvider } from "next-auth/react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
