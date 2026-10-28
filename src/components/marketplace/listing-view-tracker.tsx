"use client";
// ListingViewTracker — tiny client component that fires a `listing_view`
// analytics event on mount. Mounted from the patent detail server component
// (server components can't call useEffect). Fire-and-forget.
import { useEffect } from "react";
import { trackEvent } from "@/components/analytics/analytics-tracker";

export function ListingViewTracker({ patentId }: { patentId: string }) {
  useEffect(() => {
    trackEvent("listing_view", { patentId });
  }, [patentId]);
  return null;
}
