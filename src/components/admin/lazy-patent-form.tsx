"use client";
// LazyPatentForm — client wrapper that defers compilation of the 32KB
// PatentForm component until the user actually navigates to
// /admin/patents/new or /admin/patents/[id]. On first hit the heavy chunk
// compiles in the background while the spinner renders; subsequent hits
// reuse the cached chunk. Server components can render this wrapper and
// pass props through normally — only the inner PatentForm is client-only.
import * as React from "react";
import dynamic from "next/dynamic";
import { LazyLoadingFallback } from "@/components/admin/lazy-loading-fallback";
import type { PatentFormProps } from "@/components/admin/patent-form";
// NOTE: PatentFormProps is a TS interface — this import is erased at compile
// time and does NOT create a runtime dependency on the heavy patent-form
// module. The runtime import is the dynamic() call below.

const PatentForm = dynamic(
  () => import("@/components/admin/patent-form").then((m) => m.PatentForm),
  {
    ssr: false,
    loading: () => <LazyLoadingFallback label="Loading patent form…" height={640} />,
  },
);

export function LazyPatentForm(props: PatentFormProps) {
  return <PatentForm {...props} />;
}

export default LazyPatentForm;
