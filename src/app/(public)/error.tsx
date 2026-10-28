"use client";
// Public-route error boundary — catches errors from any page under the
// (public) route group (home, about, marketplace, patent detail, faq,
// legal pages, contact). The (public) layout (Navbar + Footer) is preserved,
// so this card renders inside the chrome the user is already familiar with —
// the page just swaps content for the recovery UI.
//
// Must be a client component (Next.js error boundaries require it). Same
// premium dark-blue language as the root error.tsx but the secondary CTA
// sends the user back to the marketplace (the highest-value surface for a
// logged-out visitor), with home as the tertiary option.
import * as React from "react";
import Link from "next/link";
import { Store, RefreshCw, TriangleAlert, Home, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[PatentSale] Public error boundary caught:", error);

    // Auto-recover from ChunkLoadError. This fires when the browser is holding
    // a stale build manifest (e.g. dev server was restarted, a new deploy
    // shipped, or HMR swapped a chunk hash) and tries to fetch a chunk that
    // no longer exists. Calling `reset()` won't help — the chunk URL is
    // baked into the loaded HTML — so the only real fix is a hard reload to
    // pull a fresh manifest. Guard against an infinite reload loop using a
    // sessionStorage counter (cleared on tab close, so the next visit starts
    // fresh).
    const isChunkLoadError =
      error?.name === "ChunkLoadError" ||
      /Failed to load chunk|Loading chunk|Loading CSS chunk/i.test(
        error?.message || "",
      );
    if (isChunkLoadError) {
      try {
        // Timestamp-based throttle instead of a counter: allows a reload for
        // EACH genuine ChunkLoadError, but prevents an infinite loop if the
        // reloaded page ALSO throws (e.g. dev server is fully down). 10s
        // window is enough for a fresh manifest to be served after a restart.
        const key = "ps_chunk_reload_ts";
        const last = Number(sessionStorage.getItem(key) || "0");
        const now = Date.now();
        if (now - last > 10_000) {
          sessionStorage.setItem(key, String(now));
          window.location.reload();
        }
      } catch {
        // sessionStorage may be unavailable (private mode) — swallow.
      }
    }
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-16">
      <Card className="w-full overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-xl shadow-primary/5">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <TriangleAlert className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            We hit a snag
          </CardTitle>
          <CardDescription className="text-sm">
            Something went wrong on this page. Please try again, or head back to
            the marketplace to keep exploring.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
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
          <Button onClick={() => reset()} size="lg" className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>

          {/* Secondary actions — quick exit to the surfaces a visitor
              would most want from the public site. */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button asChild variant="outline" size="default" className="gap-2">
              <Link href="/patents">
                <Store className="h-4 w-4" />
                Marketplace
              </Link>
            </Button>
            <Button asChild variant="ghost" size="default" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button asChild variant="ghost" size="default" className="gap-2">
              <Link href="/contact">
                <LifeBuoy className="h-4 w-4" />
                Support
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
