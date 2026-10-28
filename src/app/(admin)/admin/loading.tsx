// Admin loading skeleton — shown while the admin page's data fetches resolve
// (DB queries, analytics aggregation, etc.). The admin layout
// (server-side getServerSession + AdminShell) must finish rendering before
// this loading UI shows, so in many cases the sidebar IS visible by the
// time this loads. This file deliberately renders NO chrome itself (no
// sidebar, no top bar) to avoid duplicating AdminShell — if the layout is
// still resolving (first hard navigation to /admin), we just show a clean
// centered spinner; if the layout is already on the page, this content sits
// inside AdminShell's content area.
//
// A spinner (not a skeleton) is intentional here: the admin surface doesn't
// know which sub-page is loading (dashboard, leads, patents, lead-gen, etc.),
// each of which has a wildly different layout. A spinner sidesteps the
// "guess what shape the page will be" problem.
import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background px-4 py-16">
      {/* Subtle deep-blue radial accent — premium, not "broken". */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        {/* Inline spinner — Tailwind `animate-spin`, no extra JS. */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Loading admin…</p>
          <p className="text-xs text-muted-foreground">
            Preparing your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
