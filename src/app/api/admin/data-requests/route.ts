// GET /api/admin/data-requests — DPDPA data principal request queue.
// POST /api/admin/data-requests — create a manual request (received by email/phone).
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/app/api/admin/_session";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const status = url.searchParams.get("status")?.trim() || "";
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "25")));

    const where: Prisma.DataRequestWhereInput = {};
    if (status && status !== "all") where.status = status;
    if (q) {
      where.OR = [
        { principalEmail: { contains: q } },
        { principalName: { contains: q } },
        { principalPhone: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      db.dataRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { assignedTo: { select: { id: true, email: true, name: true } } },
      }),
      db.dataRequest.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    console.error("GET /api/admin/data-requests error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const session = await getServerSession(authOptions);
    const adminId = (session?.user as { id?: string })?.id;

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const requestType = String(body.requestType || "").trim();
    if (!["access", "correction", "erasure", "consent_withdrawal"].includes(requestType)) {
      return NextResponse.json({ error: "Invalid request type" }, { status: 422 });
    }

    const principalEmail = body.principalEmail ? String(body.principalEmail).trim() : null;
    const principalName = body.principalName ? String(body.principalName).trim() : null;
    const principalPhone = body.principalPhone ? String(body.principalPhone).trim() : null;
    const source = body.source ? String(body.source) : "email";
    const description = body.description ? String(body.description) : null;

    if (!principalEmail && !principalPhone) {
      return NextResponse.json(
        { error: "At least one principal contact (email or phone) is required" },
        { status: 422 }
      );
    }

    const created = await db.dataRequest.create({
      data: {
        requestType,
        principalEmail,
        principalName,
        principalPhone,
        source,
        description,
        status: "open",
        assignedToId: typeof body.assignedToId === "string" && body.assignedToId ? body.assignedToId : adminId || null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/data-requests error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
