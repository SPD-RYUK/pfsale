// Marketplace loading skeleton — shown by Next.js's streaming renderer while
// the marketplace server page (DB query for the first page of patents + facet
// computation) is in flight. Mirrors the real page's layout (page header +
// 3-column card grid) so the layout doesn't shift when the real cards swap in.
//
// Per the design direction: skeletons, not spinners. All animation is pure CSS
// (Tailwind's `animate-pulse`), so no JS is shipped for this fallback.
import { Skeleton } from "@/components/ui/skeleton";

// One skeleton card — mirrors the visual shape of <PatentCard /> from
// src/components/marketplace/patent-card.tsx (jurisdiction/stage badges row,
// title, summary snippet, claims + field lines, metrics row, score block).
function SkeletonCard() {
  return (
    <div className="flex h-full flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      {/* Top row: jurisdiction + stage + field */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Summary snippet + AI summary label */}
      <div className="mt-2.5 flex-1 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="mt-2 h-2.5 w-20" />
      </div>

      {/* Compact claims + field lines */}
      <div className="space-y-1.5">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-full" />
      </div>

      {/* Metrics row */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Score block */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
    </div>
  );
}

export default function PatentsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Page header skeleton */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-6 w-44 rounded-full" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-3/4 max-w-2xl" />
        </div>
        <Skeleton className="h-11 w-44 rounded-lg" />
      </div>

      {/* Filter bar skeleton (mirrors the explorer's filter row) */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="ml-auto h-9 w-32 rounded-lg" />
      </div>

      {/* Card grid — 6 cards (one full marketplace page) */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="mt-8 flex items-center justify-center gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-16 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  );
}
