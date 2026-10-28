// GET /api/admin/report-requests — list report requests with search + status filter.
// POST /api/admin/report-requests — create a report request manually (admin
// entry path for off-channel requests received by phone/email). The public
// report-request submission route (Phase B) is separate.
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/app/api/admin/_session";

const STATUSES = ["new", "contacted", "report_sent", "converted", "archived"];

export async function GET(req: NextRequest) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const status = url.searchParams.get("status")?.trim() || "";
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "25")));

    const where: Prisma.ReportRequestWhereInput = {};
    if (status && status !== "all" && STATUSES.includes(status)) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { company: { contains: q } },
        { role: { contains: q } },
        { message: { contains: q } },
        { patent: { title: { contains: q } } },
        { patent: { patentNumber: { contains: q } } },
      ];
    }

    const [items, total] = await Promise.all([
      db.reportRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          patent: {
            select: { id: true, title: true, patentNumber: true, jurisdiction: true, published: true },
          },
        },
      }),
      db.reportRequest.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    console.error("GET /api/admin/report-requests error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const patentId = String(body.patentId || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();

    if (!patentId || !name || !email) {
      return NextResponse.json(
        { error: "patentId, name, and email are required" },
        { status: 422 },
      );
    }

    const patent = await db.patent.findUnique({ where: { id: patentId } });
    if (!patent) return NextResponse.json({ error: "Patent not found" }, { status: 404 });

    const created = await db.reportRequest.create({
      data: {
        patentId,
        name,
        email,
        phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null,
        company: typeof body.company === "string" && body.company.trim() ? body.company.trim() : null,
        role: typeof body.role === "string" && body.role.trim() ? body.role.trim() : null,
        message: typeof body.message === "string" && body.message.trim() ? body.message.trim() : null,
        consent: Boolean(body.consent),
        ageConfirmed: Boolean(body.ageConfirmed),
        consentTextSnapshot:
          typeof body.consentTextSnapshot === "string" && body.consentTextSnapshot
            ? body.consentTextSnapshot
            : "Admin-entered request — consent captured offline.",
        status: STATUSES.includes(body.status) ? body.status : "new",
        notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
        ipAddress: null,
      },
      include: {
        patent: { select: { id: true, title: true, patentNumber: true, jurisdiction: true } },
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/report-requests error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
