// PATCH /api/admin/report-requests/[id] — update status / notes.
//   Body: { status?: "new"|"contacted"|"report_sent"|"converted"|"archived", notes?: string|null }
// DELETE /api/admin/report-requests/[id] — HARD-DELETE PII (DPDPA erasure).
//   Deleting a report request never deletes its patent (cascade runs the other
//   way in the schema: deleting a patent deletes its report requests).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/app/api/admin/_session";

const STATUSES = ["new", "contacted", "report_sent", "converted", "archived"];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (typeof body.status === "string" && STATUSES.includes(body.status)) {
      data.status = body.status;
    }
    if (typeof body.notes === "string") data.notes = body.notes.trim() || null;

    const updated = await db.reportRequest.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/admin/report-requests/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    // ReportRequest.patent has onDelete: Cascade — but cascade runs the other
    // way (deleting a patent deletes its report requests). So deleting a single
    // report request never touches the patent. Safe.
    await db.reportRequest.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/report-requests/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
