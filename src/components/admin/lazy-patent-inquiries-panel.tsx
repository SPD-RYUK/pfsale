"use client";
// LazyPatentInquiriesPanel — defers compilation of the inquiries panel shown
// on the patent edit page. Lightweight on its own, but bundling it lazily
// keeps the /admin/patents/[id] first paint cheaper (it renders alongside
// the heavy PatentForm).
import * as React from "react";
import dynamic from "next/dynamic";
import { LazyLoadingFallback } from "@/components/admin/lazy-loading-fallback";
import type { InquiryRow } from "@/components/admin/patent-inquiries-panel";

const PatentInquiriesPanel = dynamic(
  () =>
    import("@/components/admin/patent-inquiries-panel").then(
      (m) => m.PatentInquiriesPanel,
    ),
  {
    ssr: false,
    loading: () => <LazyLoadingFallback label="Loading inquiries…" height={160} />,
  },
);

interface Props {
  patentId: string;
  total: number;
  inquiries: InquiryRow[];
}

export function LazyPatentInquiriesPanel(props: Props) {
  return <PatentInquiriesPanel {...props} />;
}

export default LazyPatentInquiriesPanel;
