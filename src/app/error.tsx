"use client";
// Root error boundary — catches errors from ANY route in the app (it's the
// topmost error.tsx, sitting right under the root layout). Renders inside the
// root layout (which keeps <html>, <body>, ThemeProvider, Toaster intact), so
// we don't need to re-emit <html>/<body> here.
//
// Per Next.js convention this MUST be a client component: error boundaries use
// React's error-recovery flow which requires the client runtime to mount the
// reset UI and re-run the errored segment on `reset()`.
//
// Premium dark-blue look: gradient backdrop + bordered primary/30 card + lucide
// iconography. Includes a "Try again" button (calls `reset()` to re-attempt
// the failed render) + a link back home. The error message is only surfaced
// in dev (production builds would leak internals otherwise).
import * as React from "react";
import Link from "next/link";
import { Home, RefreshCw, TriangleAlert, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log on the client so the support team has a paper trail even without
  // Sentry configured. Server-side logging is handled by Next.js itself.
  React.useEffect(() => {
    console.error("[PatentSale] Root error boundary caught:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background px-4 py-16">
      {/* Decorative deep-blue radial accent — premium, not broken */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative w-full max-w-lg">
        <Card className="overflow-hidden border-primary/30 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <TriangleAlert className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Something went wrong
            </CardTitle>
            <CardDescription className="text-sm">
              An unexpected error occurred while loading this page. Please try
              again — if the problem persists, our team is on it.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error digest + message — surfaced in dev so the engineer can
                see the failure without flipping to the terminal. Hidden in
                production to avoid leaking internals. */}
            {isDev && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left">
                <p className="font-mono text-xs leading-relaxed text-destructive">
                  {error?.message || "Unknown error"}
                </p>
                {error?.digest ? (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    digest: {error.digest}
                  </p>
                ) : null}
                {error?.stack ? (
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-muted-foreground">
                    {error.stack}
                  </pre>
                ) : null}
              </div>
            )}

            {/* Primary action: re-run the failed segment. */}
            <Button
              onClick={() => reset()}
              size="lg"
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>

            {/* Secondary actions — quick exit. */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Back to home
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="gap-2">
                <Link href="/contact">
                  <LifeBuoy className="h-4 w-4" />
                  Contact support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
