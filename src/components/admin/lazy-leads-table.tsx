"use client";
// LazyLeadsTable — defers compilation of the 16KB leads table on
// /admin/leads so the admin shell can paint first.
import * as React from "react";
import dynamic from "next/dynamic";
import { LazyLoadingFallback } from "@/components/admin/lazy-loading-fallback";

const LeadsTable = dynamic(
  () => import("@/components/admin/leads-table").then((m) => m.LeadsTable),
  {
    ssr: false,
    loading: () => <LazyLoadingFallback label="Loading leads…" height={480} />,
  },
);

export function LazyLeadsTable() {
  return <LeadsTable />;
}

export default LazyLeadsTable;
