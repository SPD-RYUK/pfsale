// Patent detail loading skeleton — shown by Next.js's streaming renderer
// while the patent detail server page is fetching the patent record + the
// field-of-use distribution for the charts. Mirrors the real page layout
// (breadcrumb + back button + header (full width) + right rail score card
// + readiness inputs card + main column tabs/summary cards/CTAs) so there's
// no layout shift when the real content swaps in.
//
// Per the design direction: skeletons, not spinners. All animation is pure
// CSS (`animate-pulse` via the Skeleton component) — no JS shipped.
import { Skeleton } from "@/components/ui/skeleton";

export default function PatentDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-24 lg:px-8 lg:pb-10">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>

      {/* Back to marketplace skeleton */}
      <Skeleton className="mb-4 h-8 w-44 rounded-md" />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
        {/* Header — full width on desktop, first on mobile */}
        <div className="lg:col-span-2">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>

          {/* Title */}
          <Skeleton className="mt-3 h-9 w-3/4" />
          <Skeleton className="mt-2 h-9 w-1/2" />

          {/* Assignee */}
          <Skeleton className="mt-2 h-4 w-64" />

          {/* Quick actions row */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-3 w-72" />
          </div>

          {/* Bibliographic strip */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Right rail — score + readiness inputs (desktop only) */}
        <aside className="hidden lg:col-start-2 lg:row-start-2 lg:block">
          {/* Score card */}
          <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-1 h-3 w-56" />
            <div className="mt-5 flex flex-col items-center">
              <Skeleton className="h-36 w-36 rounded-full" />
              <div className="mt-4 w-full space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>

          {/* Readiness inputs card */}
          <div className="mt-4 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-1 h-3 w-40" />
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </aside>

        {/* Main column — tabs + summary cards + CTAs */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          {/* Tabs list */}
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-md" />
            ))}
          </div>

          {/* Summary cards */}
          <div className="mt-6 space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>

          {/* CTA cards */}
          <div className="mt-12 space-y-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
