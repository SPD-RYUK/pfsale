"use client";
// NextAuth SessionProvider wrapper (client). Required by `useSession` in the
// admin shell. Scoped to the admin route group so the public site doesn't load it.
import { SessionProvider } from "next-auth/react";
import * as React from "react";

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
