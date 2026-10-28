// POST /api/admin/patents/[id]/ai-summary — generate AI section summaries on demand.
// Calls lib/ai (z-ai-web-dev-sdk backend) and persists summaryAbstract/Claims/Field.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatePatentSummary } from "@/lib/ai";
import { requireSession } from "@/app/api/admin/_session";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const patent = await db.patent.findUnique({ where: { id } });
    if (!patent) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const out = await generatePatentSummary({
      title: patent.title,
      abstract: patent.abstract,
      claims: patent.claims,
      fieldOfUse: patent.fieldOfUse,
    });

    const updated = await db.patent.update({
      where: { id },
      data: {
        summaryAbstract: out.summaryAbstract,
        summaryClaims: out.summaryClaims,
        summaryField: out.summaryField,
        summaryGeneratedAt: new Date(),
      },
    });

    return NextResponse.json({
      summaryAbstract: updated.summaryAbstract,
      summaryClaims: updated.summaryClaims,
      summaryField: updated.summaryField,
      summaryGeneratedAt: updated.summaryGeneratedAt,
    });
  } catch (e) {
    console.error("AI summary error:", e);
    const msg = e instanceof Error ? e.message : "AI generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
