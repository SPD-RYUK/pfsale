// Admin DPDPA data requests page.
//
// DataRequestsManager (23KB) is loaded via the LazyDataRequestsManager client
// wrapper (next/dynamic, ssr:false) so the admin shell can paint first and
// the heavy manager chunk only compiles on first navigation to this page.
import { LazyDataRequestsManager } from "@/components/admin/lazy-data-requests-manager";

export default function AdminDataRequestsPage() {
  return <LazyDataRequestsManager />;
}
