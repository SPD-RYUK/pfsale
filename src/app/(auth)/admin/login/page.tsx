"use client";
// Admin login — email + password (OTP/MFA temporarily disabled).
//
// MFA (TOTP) infrastructure remains in lib/auth.ts and the schema (mfaSecret,
// mfaEnabled) so it can be re-enabled by setting mfaEnabled=true on the admin
// and re-adding the OTP field here. For now, login is email + password only
// to reduce friction during development.
import * as React from "react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_EMAIL } from "@/lib/auth";

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = React.useState(ADMIN_EMAIL);
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Redirect if already authenticated (hard nav so SessionProvider is fresh).
  React.useEffect(() => {
    if (status === "authenticated" && session?.user) {
      window.location.href = "/admin";
    }
  }, [status, session]);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        // otp omitted — MFA disabled. The authorize function skips the TOTP
        // check when the admin's mfaEnabled is false.
        redirect: false,
      });
      if (!result || result.error) {
        toast.error("Invalid credentials. Please try again.");
        return;
      }
      toast.success("Signed in — loading admin panel…");
      // HARD navigation: signIn({redirect:false}) does NOT update the
      // SessionProvider's cached session state, so a soft client-side
      // navigation to /admin would see the stale "unauthenticated" status and
      // bounce back to /admin/login. A hard navigation forces SessionProvider
      // to freshly fetch /api/auth/session, which sees the just-set cookie.
      window.location.href = "/admin";
    } catch (e) {
      console.error("login error:", e);
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Sparkles className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Patent<span className="text-primary">Sale</span> Admin
            </h1>
            <p className="text-sm text-muted-foreground">
              Authorized personnel only.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LockKeyhole className="size-4 text-muted-foreground" />
              Sign in
            </CardTitle>
            <CardDescription>
              Enter your admin email and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Admin email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@patentforsale.in"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full gap-2">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
