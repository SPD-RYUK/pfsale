// Admin: report-requests management page. Server shell with the client
// ReportRequestsTable (lazy-loaded so the admin shell paints first).
//
// Report requests are the "Get Full Commercial Readiness Report" lead-gen
// CTA on patent detail pages — a buyer-side lead distinct from the seller
// "Request Now" lead and the buyer "Express Interest" inquiry.
import { LazyReportRequestsTable } from "@/components/admin/lazy-report-requests-table";

export default function AdminReportRequestsPage() {
  return <LazyReportRequestsTable />;
}
