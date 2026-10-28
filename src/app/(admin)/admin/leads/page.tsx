// Admin leads page — server shell with the client LeadsTable.
//
// LeadsTable (16KB) is loaded via the LazyLeadsTable client wrapper
// (next/dynamic, ssr:false) so the admin shell can paint first.
import { LazyLeadsTable } from "@/components/admin/lazy-leads-table";

export default function AdminLeadsPage() {
  return <LazyLeadsTable />;
}
