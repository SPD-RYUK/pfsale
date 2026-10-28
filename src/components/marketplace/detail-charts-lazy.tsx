"use client";
// Lazy wrapper around DetailCharts.
//
// WHY THIS EXISTS:
// The patent detail page is a Server Component. Server Components cannot use
// `next/dynamic` with `ssr: false`. But we DO want `ssr: false` for the chart
// bundle, because Recharts + d3 is a ~400KB dependency tree that, if pulled
// into the route's module graph, makes the first dev-compile of /patents/[id]
// take ~4.7s (vs ~300ms without it).
//
// So: the server page imports THIS thin client wrapper. The wrapper's only job
// is to call `dynamic(...)` with `ssr: false`, which makes Recharts load as a
// separate browser-only chunk that hydrates after the page HTML is delivered.
// The page renders instantly; charts pop in when the user opens the Visuals tab
// (or shortly after hydration).
import dynamic from "next/dynamic";

const DetailCharts = dynamic(
  () => import("@/components/marketplace/detail-charts").then((m) => m.DetailCharts),
  {
    loading: () => (
      <div
        className="h-64 animate-pulse rounded-lg bg-muted/40"
        aria-label="Loading charts"
      />
    ),
    ssr: false,
  },
);

export default DetailCharts;
