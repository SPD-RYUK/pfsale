// PATCH /api/admin/inquiries/[id] — update status (new | contacted | closed).
// DELETE /api/admin/inquiries/[id] — HARD-DELETE PII (DPDPA erasure). The patent
// listing the inquiry references is preserved (it has its own lifecycle).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/app/api/admin/_session";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (typeof body.status === "string" && ["new", "contacted", "closed"].includes(body.status)) {
      data.status = body.status;
    }

    const updated = await db.buyerInquiry.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/admin/inquiries/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    // BuyerInquiry.onDelete: Cascade is set on the patent relation — but deleting
    // an inquiry never deletes its patent (cascade runs the other way: deleting a
    // patent deletes its inquiries). So this is safe.
    await db.buyerInquiry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/inquiries/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
