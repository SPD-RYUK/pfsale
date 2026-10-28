// Admin inquiries page.
//
// InquiriesTable (16KB) is loaded via the LazyInquiriesTable client wrapper
// (next/dynamic, ssr:false) so the admin shell can paint first.
import { LazyInquiriesTable } from "@/components/admin/lazy-inquiries-table";

export default function AdminInquiriesPage() {
  return <LazyInquiriesTable />;
}
