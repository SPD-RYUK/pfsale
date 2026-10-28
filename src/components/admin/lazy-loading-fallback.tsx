"use client";
// LazyLoadingFallback — minimal spinner/skeleton used as the `loading` slot of
// `next/dynamic` imports for the heavy admin client components. Keeping this
// tiny (no lucide / radix / chart deps) ensures the fallback itself compiles
// instantly so the user sees immediate feedback while the real chunk compiles
// on first navigation.
import * as React from "react";

export function LazyLoadingFallback({
  label = "Loading…",
  height = 320,
}: {
  label?: string;
  height?: number;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 p-8 text-sm text-muted-foreground"
      style={{ minHeight: height }}
    >
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}

export default LazyLoadingFallback;
