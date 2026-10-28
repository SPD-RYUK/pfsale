"use client";
// LazyDataRequestsManager — defers compilation of the 23KB DPDPA data
// requests manager on /admin/data-requests.
import * as React from "react";
import dynamic from "next/dynamic";
import { LazyLoadingFallback } from "@/components/admin/lazy-loading-fallback";

const DataRequestsManager = dynamic(
  () =>
    import("@/components/admin/data-requests-manager").then(
      (m) => m.DataRequestsManager,
    ),
  {
    ssr: false,
    loading: () => <LazyLoadingFallback label="Loading data requests…" height={480} />,
  },
);

export function LazyDataRequestsManager() {
  return <DataRequestsManager />;
}

export default LazyDataRequestsManager;
