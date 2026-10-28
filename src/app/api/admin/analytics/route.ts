// GET /api/admin/analytics — aggregates for the analytics dashboard.
//   visitsOverTime: [{ date, count }] for last N days
//   topListings: [{ patentId, title, views }] — top 5 most-viewed
//   funnel: { visits, listingViews, requestNowOpened, leadSubmitted, expressInterestOpened, buyerInquirySubmitted }
// Query: ?days=7|30|90 (default 30)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/app/api/admin/_session";

export async function GET(req: NextRequest) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const url = new URL(req.url);
    const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") || "30")));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 1. Visits over time — group page_view events by day.
    const visitsRaw = await db.analyticsEvent.findMany({
      where: { eventType: "page_view", createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const byDay = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, 0);
    }
    for (const v of visitsRaw) {
      const key = v.createdAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }
    const visitsOverTime = Array.from(byDay.entries()).map(([date, count]) => ({ date, count }));

    // 2. Top listings — most-viewed patents in the window.
    const listingViews = await db.analyticsEvent.findMany({
      where: { eventType: "listing_view", createdAt: { gte: since } },
      select: { patentId: true },
    });
    const viewCounts = new Map<string, number>();
    for (const ev of listingViews) {
      if (!ev.patentId) continue;
      viewCounts.set(ev.patentId, (viewCounts.get(ev.patentId) || 0) + 1);
    }
    const topIds = Array.from(viewCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topPatents = topIds.length
      ? await db.patent.findMany({
          where: { id: { in: topIds.map((t) => t[0]) } },
          select: { id: true, title: true },
        })
      : [];
    const topListings = topIds.map(([patentId, views]) => {
      const p = topPatents.find((tp) => tp.id === patentId);
      return { patentId, title: p?.title || "Untitled", views };
    });

    // 3. Funnel counts over the window.
    const [
      visits,
      listingViewsCount,
      requestNowOpened,
      leadSubmitted,
      expressInterestOpened,
      buyerInquirySubmitted,
    ] = await Promise.all([
      db.analyticsEvent.count({ where: { eventType: "page_view", createdAt: { gte: since } } }),
      db.analyticsEvent.count({ where: { eventType: "listing_view", createdAt: { gte: since } } }),
      db.analyticsEvent.count({ where: { eventType: "request_now_opened", createdAt: { gte: since } } }),
      db.analyticsEvent.count({ where: { eventType: "lead_submitted", createdAt: { gte: since } } }),
      db.analyticsEvent.count({ where: { eventType: "express_interest_opened", createdAt: { gte: since } } }),
      db.analyticsEvent.count({ where: { eventType: "buyer_inquiry_submitted", createdAt: { gte: since } } }),
    ]);

    return NextResponse.json({
      days,
      visitsOverTime,
      topListings,
      funnel: {
        visits,
        listingViews: listingViewsCount,
        requestNowOpened,
        leadSubmitted,
        expressInterestOpened,
        buyerInquirySubmitted,
      },
    });
  } catch (e) {
    console.error("GET /api/admin/analytics error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
