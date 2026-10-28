// POST /api/admin/patents/[id]/publish — toggle the published flag.
// Body: { published: boolean }. Sets publishedAt when publishing for the first time.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/app/api/admin/_session";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const published = Boolean(body.published);

    const existing = await db.patent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.patent.update({
      where: { id },
      data: {
        published,
        publishedAt: published && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("POST /api/admin/patents/[id]/publish error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
