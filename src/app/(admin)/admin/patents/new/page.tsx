// Admin: create new patent. Server component shell that hands off to the
// client PatentForm. Reads ?leadId=... so a lead can be converted into a listing.
//
// PatentForm is loaded via the LazyPatentForm client wrapper (next/dynamic,
// ssr:false) so the 32KB form chunk only compiles on first navigation to this
// page — keeping the rest of the admin shell cheap to compile on dev cold
// starts and incremental rebuilds.
import * as React from "react";
import { LazyPatentForm } from "@/components/admin/lazy-patent-form";

export default async function AdminPatentNewPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  const sp = await searchParams;
  const leadId = sp.leadId || null;
  return <LazyPatentForm patent={null} leadId={leadId} />;
}
