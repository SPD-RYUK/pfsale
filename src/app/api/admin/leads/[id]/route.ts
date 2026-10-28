// PATCH /api/admin/leads/[id] — update status/notes; optionally link a converted patent.
// DELETE /api/admin/leads/[id] — HARD-DELETE PII (DPDPA erasure).
//
// Hard-delete safety: the Patent.leadId relation is optional + the schema does not
// declare onDelete for the relation (defaults to SetNull in SQLite). To be safe
// across any future provider, we first null out any linked Patent's leadId and
// Lead.convertedListingId, then delete the lead. The published patent listing is
// preserved — DPDPA erasure of a seller's lead never removes a listing they may
// have already consented to publish (that would violate a different DPDPA right).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/app/api/admin/_session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (typeof body.status === "string" && ["new", "contacted", "converted", "archived"].includes(body.status)) {
      data.status = body.status;
    }
    if (typeof body.notes === "string") data.notes = body.notes || null;

    // Link a converted patent listing. The Patent.leadId is @unique so we set both
    // sides of the relation atomically.
    if (typeof body.convertedListingId === "string") {
      const listingId = body.convertedListingId.trim();
      if (listingId) {
        const patent = await db.patent.findUnique({ where: { id: listingId } });
        if (!patent) return NextResponse.json({ error: "Patent not found" }, { status: 404 });
        // Clear any prior Lead pointer on that patent, then point it to this lead.
        await db.patent.update({ where: { id: listingId }, data: { leadId: id } });
        data.convertedListingId = listingId;
        data.status = data.status || "converted";
      } else {
        data.convertedListingId = null;
      }
    }

    const updated = await db.lead.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/admin/leads/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // DPDPA erasure: null out the optional Patent.leadId pointer first so the
    // listing (if any) is preserved but detached from this person's record.
    await db.patent.updateMany({
      where: { leadId: id },
      data: { leadId: null },
    });
    await db.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/leads/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
