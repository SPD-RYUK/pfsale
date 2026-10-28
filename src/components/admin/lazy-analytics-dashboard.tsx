"use client";
// LazyAnalyticsDashboard — defers compilation of the analytics dashboard,
// which pulls in recharts (~400KB ungzipped). On first navigation to
// /admin/analytics the spinner shows while the chunk (dashboard + recharts)
// compiles; subsequent visits reuse the cached chunk. The splitChunks config
// in next.config.ts also peels recharts into its own stable chunk that is
// shared with the marketplace detail-charts bundle.
import * as React from "react";
import dynamic from "next/dynamic";
import { LazyLoadingFallback } from "@/components/admin/lazy-loading-fallback";

const AnalyticsDashboard = dynamic(
  () =>
    import("@/components/admin/analytics-dashboard").then(
      (m) => m.AnalyticsDashboard,
    ),
  {
    ssr: false,
    loading: () => <LazyLoadingFallback label="Loading analytics…" height={520} />,
  },
);

export function LazyAnalyticsDashboard() {
  return <AnalyticsDashboard />;
}

export default LazyAnalyticsDashboard;
