// GET /api/patents — public marketplace list with search + filters.
// Supports: q (text), fieldOfUse, jurisdiction, legalStatus, scoreMin/scoreMax,
// filing/grant date range, sort, pagination. Returns ONLY published listings.
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const fieldOfUse = url.searchParams.getAll("fieldOfUse").filter(Boolean);
  const jurisdiction = url.searchParams.getAll("jurisdiction").filter(Boolean);
  const legalStatus = url.searchParams.getAll("legalStatus").filter(Boolean);
  const stages = url.searchParams.getAll("stage").filter(Boolean);
  const featured = url.searchParams.get("featured");
  const scoreMin = url.searchParams.get("scoreMin");
  const scoreMax = url.searchParams.get("scoreMax");
  const filingFrom = url.searchParams.get("filingFrom");
  const filingTo = url.searchParams.get("filingTo");
  const grantFrom = url.searchParams.get("grantFrom");
  const grantTo = url.searchParams.get("grantTo");
  const sort = url.searchParams.get("sort") || "recent";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(48, Math.max(1, Number(url.searchParams.get("pageSize") || "12")));

  const where: Prisma.PatentWhereInput = {
    // CRITICAL: only published listings are exposed on the public marketplace.
    // Draft / unpublished / soft-deleted records must NEVER leak through this
    // route. The explicit `published: true` is the primary guard; the `select`
    // clause below is a secondary guard that excludes admin-only fields.
    published: true,
  };

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { abstract: { contains: q } },
      { patentNumber: { contains: q } },
      { summaryAbstract: { contains: q } },
      { summaryClaims: { contains: q } },
      { summaryField: { contains: q } },
      { assignee: { contains: q } },
      { fieldOfUse: { contains: q } },
    ];
  }
  if (fieldOfUse.length) where.fieldOfUse = { in: fieldOfUse };
  if (jurisdiction.length) where.jurisdiction = { in: jurisdiction };
  if (legalStatus.length) where.legalStatus = { in: legalStatus };
  if (stages.length) where.stage = { in: stages };
  if (featured === "true") where.featured = true;

  if (scoreMin || scoreMax) {
    where.readinessScore = {
      ...(scoreMin ? { gte: Number(scoreMin) } : {}),
      ...(scoreMax ? { lte: Number(scoreMax) } : {}),
    };
  }

  const filingRange: Prisma.DateTimeFilter = {};
  if (filingFrom) filingRange.gte = new Date(filingFrom);
  if (filingTo) filingRange.lte = new Date(filingTo);
  if (Object.keys(filingRange).length) where.filingDate = filingRange;

  const grantRange: Prisma.DateTimeFilter = {};
  if (grantFrom) grantRange.gte = new Date(grantFrom);
  if (grantTo) grantRange.lte = new Date(grantTo);
  if (Object.keys(grantRange).length) where.grantDate = grantRange;

  const orderBy: Prisma.PatentOrderByWithRelationInput =
    sort === "score" ? { readinessScore: "desc" } :
    sort === "filing" ? { filingDate: "desc" } :
    sort === "grant" ? { grantDate: "desc" } :
    { publishedAt: "desc" };

  const [items, total] = await Promise.all([
    db.patent.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      // PUBLIC FIELDS ONLY. Do NOT add `claims`, `description`, `scoreNotes`,
      // `recordLocked`, `dataSource`, `leadId`, `lead`, `applicationNumber`,
      // or any readiness-score input fields here without a security review —
      // they are admin-only and must not be exposed on the marketplace API.
      select: {
        id: true,
        patentNumber: true,
        jurisdiction: true,
        title: true,
        abstract: true,
        fieldOfUse: true,
        assignee: true,
        filingDate: true,
        grantDate: true,
        legalStatus: true,
        readinessScore: true,
        scoreSource: true,
        stage: true,
        featured: true,
        summaryAbstract: true,
        summaryClaims: true,
        summaryField: true,
        patentFamilySize: true,
        publishedAt: true,
        _count: { select: { inquiries: true } },
      },
    }),
    db.patent.count({ where }),
  ]);

  // Facets for filter UI
  const [fields, jurisdictions, statuses, stageFacets] = await Promise.all([
    db.patent.findMany({
      where: { published: true, fieldOfUse: { not: null } },
      distinct: ["fieldOfUse"],
      select: { fieldOfUse: true },
    }),
    db.patent.findMany({
      where: { published: true },
      distinct: ["jurisdiction"],
      select: { jurisdiction: true },
    }),
    db.patent.findMany({
      where: { published: true, legalStatus: { not: null } },
      distinct: ["legalStatus"],
      select: { legalStatus: true },
    }),
    db.patent.findMany({
      where: { published: true, stage: { not: null } },
      distinct: ["stage"],
      select: { stage: true },
    }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    facets: {
      fieldOfUse: fields.map((f) => f.fieldOfUse).filter(Boolean) as string[],
      jurisdiction: jurisdictions.map((j) => j.jurisdiction),
      legalStatus: statuses.map((s) => s.legalStatus).filter(Boolean) as string[],
      stage: stageFacets.map((s) => s.stage).filter(Boolean) as string[],
    },
  });
}
