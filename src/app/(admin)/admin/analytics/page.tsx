// Admin analytics page.
//
// AnalyticsDashboard is loaded via the LazyAnalyticsDashboard client wrapper
// (next/dynamic, ssr:false). This defers compilation of the dashboard + the
// recharts (~400KB) chunk until first navigation to /admin/analytics, and
// lets the admin shell paint immediately with a spinner.
import { LazyAnalyticsDashboard } from "@/components/admin/lazy-analytics-dashboard";

export default function AdminAnalyticsPage() {
  return <LazyAnalyticsDashboard />;
}
