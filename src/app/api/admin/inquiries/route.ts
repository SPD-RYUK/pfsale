// GET /api/admin/inquiries — list buyer inquiries with search + filters.
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/app/api/admin/_session";

export async function GET(req: NextRequest) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const status = url.searchParams.get("status")?.trim() || "";
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "25")));

    const where: Prisma.BuyerInquiryWhereInput = {};
    if (status && status !== "all") where.status = status;
    if (q) {
      where.OR = [
        { buyerName: { contains: q } },
        { buyerEmail: { contains: q } },
        { buyerPhone: { contains: q } },
        { message: { contains: q } },
        { patent: { title: { contains: q } } },
      ];
    }

    const [items, total] = await Promise.all([
      db.buyerInquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { patent: { select: { id: true, title: true, patentNumber: true, jurisdiction: true, published: true } } },
      }),
      db.buyerInquiry.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    console.error("GET /api/admin/inquiries error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
