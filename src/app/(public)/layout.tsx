// Public site shell: sticky navbar + sticky-to-bottom footer + lead modal.
// `min-h-screen flex flex-col` on the wrapper with `mt-auto` footer guarantees
// the footer sticks to the viewport bottom on short pages and is pushed down
// naturally on long pages (no overlap, no floating gap).
//
// LeadModalProvider + AnalyticsTracker live HERE (not in the root layout) so
// the admin panel doesn't load framer-motion + the lead form + dialog
// primitives it never uses — keeps the admin bundle lean for Railway.
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { LeadModalProvider } from "@/components/site/lead-modal";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LeadModalProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <AnalyticsTracker />
    </LeadModalProvider>
  );
}
