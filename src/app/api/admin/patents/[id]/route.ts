// GET /api/admin/patents/[id] — full patent record for the edit form.
// PATCH /api/admin/patents/[id] — update any field (admin-manual edits).
//   Note: `recordLocked` is persisted as a flag here; the lock primarily protects
//   against Phase B (self-serve-automated) overwrites, not admin manual edits.
// DELETE /api/admin/patents/[id] — remove a listing entirely (admin only).
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/app/api/admin/_session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const patent = await db.patent.findUnique({ where: { id }, include: { lead: true } });
    if (!patent) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(patent);
  } catch (e) {
    console.error("GET /api/admin/patents/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const existing = await db.patent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Prisma.PatentUpdateInput = {};
    if (typeof body.patentNumber === "string") data.patentNumber = body.patentNumber.trim();
    if (typeof body.jurisdiction === "string") data.jurisdiction = body.jurisdiction.trim();
    if (typeof body.title === "string") data.title = body.title.trim();
    if (body.abstract !== undefined) data.abstract = body.abstract ? String(body.abstract) : null;
    if (body.claims !== undefined) data.claims = body.claims ? String(body.claims) : null;
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.fieldOfUse !== undefined) data.fieldOfUse = body.fieldOfUse ? String(body.fieldOfUse) : null;
    if (body.inventors !== undefined) {
      data.inventors = Array.isArray(body.inventors)
        ? JSON.stringify(body.inventors.filter((v: unknown) => typeof v === "string" && v.trim()))
        : typeof body.inventors === "string" && body.inventors.trim()
          ? body.inventors
          : null;
    }
    if (body.assignee !== undefined) data.assignee = body.assignee ? String(body.assignee) : null;
    if (body.applicationNumber !== undefined) data.applicationNumber = body.applicationNumber ? String(body.applicationNumber) : null;
    if (body.filingDate !== undefined) data.filingDate = body.filingDate ? new Date(body.filingDate) : null;
    if (body.grantDate !== undefined) data.grantDate = body.grantDate ? new Date(body.grantDate) : null;
    if (body.legalStatus !== undefined) data.legalStatus = body.legalStatus || null;
    if (body.patentFamilySize !== undefined) data.patentFamilySize = typeof body.patentFamilySize === "number" ? body.patentFamilySize : null;
    if (body.summaryAbstract !== undefined) data.summaryAbstract = body.summaryAbstract ? String(body.summaryAbstract) : null;
    if (body.summaryClaims !== undefined) data.summaryClaims = body.summaryClaims ? String(body.summaryClaims) : null;
    if (body.summaryField !== undefined) data.summaryField = body.summaryField ? String(body.summaryField) : null;
    if (body.readinessScore !== undefined) data.readinessScore = typeof body.readinessScore === "number" ? body.readinessScore : null;
    if (body.scoreNotes !== undefined) data.scoreNotes = body.scoreNotes ? String(body.scoreNotes) : null;
    if (body.claimBreadth !== undefined) data.claimBreadth = body.claimBreadth || null;
    if (body.remainingLifeYears !== undefined) data.remainingLifeYears = typeof body.remainingLifeYears === "number" ? body.remainingLifeYears : null;
    if (body.forwardCitations !== undefined) data.forwardCitations = typeof body.forwardCitations === "number" ? body.forwardCitations : null;
    if (body.marketSizeProxy !== undefined) data.marketSizeProxy = body.marketSizeProxy || null;
    if (body.litigationHistory !== undefined) data.litigationHistory = body.litigationHistory || null;
    if (typeof body.recordLocked === "boolean") data.recordLocked = body.recordLocked;
    if (typeof body.published === "boolean") {
      data.published = body.published;
      if (body.published && !existing.publishedAt) data.publishedAt = new Date();
    }
    // Stage + featured (admin-curated commercialization metadata).
    if (typeof body.stage === "string") data.stage = body.stage.trim() || null;
    if (typeof body.featured === "boolean") {
      data.featured = body.featured;
      // Set featuredAt when toggled on; clear when toggled off.
      if (body.featured && !existing.featuredAt) data.featuredAt = new Date();
      if (!body.featured) data.featuredAt = null;
    }
    // dataSource stays admin-manual for admin edits; scoreSource stays manual in Phase A.

    try {
      const updated = await db.patent.update({ where: { id }, data });
      return NextResponse.json(updated);
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
    console.error("PATCH /api/admin/patents/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    // Detach any lead that pointed here so its unique convertedListingId clears cleanly.
    await db.lead.updateMany({ where: { convertedListingId: id }, data: { convertedListingId: null } });
    await db.patent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/patents/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
