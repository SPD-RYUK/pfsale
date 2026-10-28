"use client";
// LazyReportRequestsTable — defers compilation of the report-requests table
// on /admin/lead-gen/report-requests so the admin shell can paint first.
import * as React from "react";
import dynamic from "next/dynamic";
import { LazyLoadingFallback } from "@/components/admin/lazy-loading-fallback";

const ReportRequestsTable = dynamic(
  () => import("@/components/admin/report-requests-table").then((m) => m.ReportRequestsTable),
  {
    ssr: false,
    loading: () => <LazyLoadingFallback label="Loading report requests…" height={480} />,
  },
);

export function LazyReportRequestsTable() {
  return <ReportRequestsTable />;
}

export default LazyReportRequestsTable;
