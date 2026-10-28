// GET /api/admin/patents — list ALL patents (published + draft) with search + filters.
// POST /api/admin/patents — create a patent (admin-manual data source). 409 on UNIQUE conflict.
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
    const published = url.searchParams.get("published"); // "true" | "false" | null
    const jurisdiction = url.searchParams.getAll("jurisdiction").filter(Boolean);
    const fieldOfUse = url.searchParams.get("fieldOfUse")?.trim() || "";
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "25")));

    const stage = url.searchParams.get("stage")?.trim() || ""; // research | prototype | pilot | commercial | market-ready | licensing

    const where: Prisma.PatentWhereInput = {};
    if (published === "true") where.published = true;
    if (published === "false") where.published = false;
    if (jurisdiction.length) where.jurisdiction = { in: jurisdiction };
    if (fieldOfUse) where.fieldOfUse = { contains: fieldOfUse };
    if (stage) where.stage = stage;
    // featured filter: "true" restricts to featured only; "false" to non-featured.
    const featured = url.searchParams.get("featured");
    if (featured === "true") where.featured = true;
    if (featured === "false") where.featured = false;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { patentNumber: { contains: q } },
        { abstract: { contains: q } },
        { assignee: { contains: q } },
        { fieldOfUse: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      db.patent.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { inquiries: true } } },
      }),
      db.patent.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    console.error("GET /api/admin/patents error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const patentNumber = String(body.patentNumber || "").trim();
    const jurisdiction = String(body.jurisdiction || "").trim();
    const title = String(body.title || "").trim();

    if (!patentNumber || !jurisdiction || !title) {
      return NextResponse.json(
        { error: "patentNumber, jurisdiction, and title are required" },
        { status: 422 }
      );
    }

    const inventors = Array.isArray(body.inventors)
      ? JSON.stringify(body.inventors.filter((v: unknown) => typeof v === "string" && v.trim()))
      : typeof body.inventors === "string" && body.inventors.trim()
        ? body.inventors
        : null;

    const published = Boolean(body.published);
    const data: Prisma.PatentCreateInput = {
      patentNumber,
      jurisdiction,
      title,
      abstract: body.abstract ? String(body.abstract) : null,
      claims: body.claims ? String(body.claims) : null,
      description: body.description ? String(body.description) : null,
      fieldOfUse: body.fieldOfUse ? String(body.fieldOfUse) : null,
      inventors,
      assignee: body.assignee ? String(body.assignee) : null,
      applicationNumber: body.applicationNumber ? String(body.applicationNumber) : null,
      filingDate: body.filingDate ? new Date(body.filingDate) : null,
      grantDate: body.grantDate ? new Date(body.grantDate) : null,
      legalStatus: body.legalStatus || null,
      patentFamilySize: typeof body.patentFamilySize === "number" ? body.patentFamilySize : null,
      summaryAbstract: body.summaryAbstract ? String(body.summaryAbstract) : null,
      summaryClaims: body.summaryClaims ? String(body.summaryClaims) : null,
      summaryField: body.summaryField ? String(body.summaryField) : null,
      readinessScore: typeof body.readinessScore === "number" ? body.readinessScore : null,
      scoreSource: "manual",
      scoreNotes: body.scoreNotes ? String(body.scoreNotes) : null,
      claimBreadth: body.claimBreadth || null,
      remainingLifeYears: typeof body.remainingLifeYears === "number" ? body.remainingLifeYears : null,
      forwardCitations: typeof body.forwardCitations === "number" ? body.forwardCitations : null,
      marketSizeProxy: body.marketSizeProxy || null,
      litigationHistory: body.litigationHistory || null,
      dataSource: "admin-manual",
      recordLocked: Boolean(body.recordLocked),
      published,
      publishedAt: published ? new Date() : null,
      stage: typeof body.stage === "string" && body.stage.trim() ? body.stage.trim() : null,
      featured: Boolean(body.featured),
      featuredAt: Boolean(body.featured) ? new Date() : null,
    };

    // Optional lead linkage on create (e.g. "create listing from this lead").
    if (typeof body.leadId === "string" && body.leadId.trim()) {
      const lead = await db.lead.findUnique({ where: { id: body.leadId.trim() } });
      if (lead) {
        data.lead = { connect: { id: lead.id } };
      }
    }

    try {
      const patent = await db.patent.create({ data });

      // If a lead was linked, mark it converted.
      if (typeof body.leadId === "string" && body.leadId.trim()) {
        await db.lead
          .update({
            where: { id: body.leadId.trim() },
            data: { status: "converted", convertedListingId: patent.id },
          })
          .catch(() => undefined);
      }

      return NextResponse.json(patent, { status: 201 });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json(
          { error: "This patent is already listed in this jurisdiction." },
          { status: 409 }
        );
      }
      throw e;
    }
  } catch (e) {
    console.error("POST /api/admin/patents error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
