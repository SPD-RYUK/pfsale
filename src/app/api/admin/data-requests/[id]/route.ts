// PATCH /api/admin/data-requests/[id] — update status / assign / notes.
// DELETE /api/admin/data-requests/[id] — remove a request record (admin only).
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
    if (typeof body.status === "string" && ["open", "in_progress", "resolved", "rejected"].includes(body.status)) {
      data.status = body.status;
      if (body.status === "resolved") data.resolvedAt = new Date();
    }
    if (typeof body.assignedToId === "string") {
      data.assignedToId = body.assignedToId || null;
    }
    if (typeof body.resolutionNotes === "string") {
      data.resolutionNotes = body.resolutionNotes || null;
    }
    if (typeof body.description === "string") data.description = body.description || null;
    if (typeof body.principalEmail === "string") data.principalEmail = body.principalEmail || null;
    if (typeof body.principalName === "string") data.principalName = body.principalName || null;
    if (typeof body.principalPhone === "string") data.principalPhone = body.principalPhone || null;

    const updated = await db.dataRequest.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/admin/data-requests/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    await db.dataRequest.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/data-requests/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
