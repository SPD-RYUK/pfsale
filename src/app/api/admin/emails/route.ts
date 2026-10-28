// GET /api/admin/emails — email log viewer.
// Paginated list of EmailLog with optional template/status filters.
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
    const template = url.searchParams.get("template")?.trim() || "";
    const status = url.searchParams.get("status")?.trim() || "";
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "25")));

    const where: Prisma.EmailLogWhereInput = {};
    if (template && template !== "all") where.template = template;
    if (status && status !== "all") where.status = status;
    if (q) {
      where.OR = [
        { to: { contains: q } },
        { subject: { contains: q } },
        { body: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      db.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.emailLog.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    console.error("GET /api/admin/emails error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
