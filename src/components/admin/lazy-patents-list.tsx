"use client";
// LazyPatentsList — defers compilation of the patents list client component on
// /admin/patents so the admin shell can paint first.
import * as React from "react";
import dynamic from "next/dynamic";
import { LazyLoadingFallback } from "@/components/admin/lazy-loading-fallback";
import type { PatentsListClientProps, PatentRow } from "@/components/admin/patents-list-client";
// NOTE: PatentsListClientProps + PatentRow are TS types — this import is erased
// at compile time and does NOT create a runtime dependency on the
// patents-list module. The runtime import is the dynamic() call below.

const PatentsListClient = dynamic(
  () => import("@/components/admin/patents-list-client").then((m) => m.PatentsListClient),
  {
    ssr: false,
    loading: () => <LazyLoadingFallback label="Loading patents…" height={520} />,
  },
);

export function LazyPatentsList(props: PatentsListClientProps) {
  return <PatentsListClient {...props} />;
}

// Re-export PatentRow so the server page can name the type without a direct
// (runtime) import of the heavy client component.
export type { PatentRow };

export default LazyPatentsList;
