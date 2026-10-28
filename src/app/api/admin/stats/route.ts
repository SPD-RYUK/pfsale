// GET /api/admin/stats — dashboard summary counts.
//   { newLeads, publishedPatents, totalPatents, newInquiries, visits7d }
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/app/api/admin/_session";

export async function GET() {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [newLeads, publishedPatents, totalPatents, newInquiries, visits7d] =
      await Promise.all([
        db.lead.count({ where: { status: "new" } }),
        db.patent.count({ where: { published: true } }),
        db.patent.count(),
        db.buyerInquiry.count({ where: { status: "new" } }),
        db.analyticsEvent.count({
          where: { eventType: "page_view", createdAt: { gte: since7d } },
        }),
      ]);

    return NextResponse.json({
      newLeads,
      publishedPatents,
      totalPatents,
      newInquiries,
      visits7d,
    });
  } catch (e) {
    console.error("GET /api/admin/stats error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
