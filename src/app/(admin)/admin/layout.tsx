// Admin layout — SERVER COMPONENT. This is the bulletproof auth gate.
//
// Every request to /admin/* (except /admin/login, which lives in the (auth)
// route group and bypasses this layout entirely) must pass a server-side
// getServerSession check. If unauthenticated → redirect to /admin/login.
// This replaces the unreliable middleware/proxy + withAuth approach and
// eliminates ALL client-side session race conditions: the server redirects
// before any HTML is rendered, so an unauthenticated user never sees the shell.
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import type { Session } from "next-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }
  return <AdminShell session={session as Session}>{children}</AdminShell>;
}
