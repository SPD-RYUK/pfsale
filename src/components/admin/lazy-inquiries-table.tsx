"use client";
// LazyInquiriesTable — defers compilation of the 16KB inquiries table on
// /admin/inquiries so the admin shell can paint first.
import * as React from "react";
import dynamic from "next/dynamic";
import { LazyLoadingFallback } from "@/components/admin/lazy-loading-fallback";

const InquiriesTable = dynamic(
  () => import("@/components/admin/inquiries-table").then((m) => m.InquiriesTable),
  {
    ssr: false,
    loading: () => <LazyLoadingFallback label="Loading inquiries…" height={480} />,
  },
);

export function LazyInquiriesTable() {
  return <InquiriesTable />;
}

export default LazyInquiriesTable;
