// Marketplace list page — server component. Reads searchParams (async, Next 15+),
// fetches the first page of published patents directly from the DB (for SEO /
// first-render), computes facets, and hydrates <MarketplaceExplorer> with the
// initial data. Subsequent filter changes are fetched client-side via /api/patents.
import { Suspense } from "react";
import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { Sparkles, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/site/motion";
import {
  MarketplaceExplorer,
  type MarketplaceFilters,
  type Facets,
} from "@/components/marketplace/marketplace-explorer";
import type { PatentCardItem } from "@/components/marketplace/patent-card";

export const metadata: Metadata = {
  title: "Patent marketplace — PatentSale",
  description:
    "Browse granted patents available for licensing or acquisition. Filter by field of use, jurisdiction, readiness score, and grant date. AI summaries on every listing.",
  alternates: { canonical: "/patents" },
  openGraph: {
    title: "Patent marketplace — PatentSale",
    description:
      "Browse granted patents available for licensing or acquisition. AI summaries, readiness scores, and a direct path to express interest.",
    url: "/patents",
  },
};

const PAGE_SIZE = 12;

function parseFilters(sp: URLSearchParams): MarketplaceFilters {
  return {
    q: sp.get("q")?.trim() || "",
    fieldOfUse: sp.getAll("fieldOfUse").filter(Boolean),
    jurisdiction: sp.getAll("jurisdiction").filter(Boolean),
    legalStatus: sp.getAll("legalStatus").filter(Boolean),
    stage: sp.getAll("stage").filter(Boolean),
    scoreMin: sp.get("scoreMin") ? Number(sp.get("scoreMin")) : 0,
    scoreMax: sp.get("scoreMax") ? Number(sp.get("scoreMax")) : 100,
    filingFrom: sp.get("filingFrom") || "",
    filingTo: sp.get("filingTo") || "",
    grantFrom: sp.get("grantFrom") || "",
    grantTo: sp.get("grantTo") || "",
    sort: (sp.get("sort") as MarketplaceFilters["sort"]) || "recent",
    page: sp.get("page") ? Math.max(1, Number(sp.get("page"))) : 1,
    pageSize: PAGE_SIZE,
  };
}

function buildWhere(f: MarketplaceFilters): Prisma.PatentWhereInput {
  const where: Prisma.PatentWhereInput = { published: true };
  if (f.q) {
    where.OR = [
      { title: { contains: f.q } },
      { abstract: { contains: f.q } },
      { patentNumber: { contains: f.q } },
      { summaryAbstract: { contains: f.q } },
      { summaryClaims: { contains: f.q } },
      { summaryField: { contains: f.q } },
      { assignee: { contains: f.q } },
      { fieldOfUse: { contains: f.q } },
    ];
  }
  if (f.fieldOfUse.length) where.fieldOfUse = { in: f.fieldOfUse };
  if (f.jurisdiction.length) where.jurisdiction = { in: f.jurisdiction };
  if (f.legalStatus.length) where.legalStatus = { in: f.legalStatus };
  if (f.stage.length) where.stage = { in: f.stage };
  if (f.scoreMin > 0 || f.scoreMax < 100) {
    where.readinessScore = {
      ...(f.scoreMin > 0 ? { gte: f.scoreMin } : {}),
      ...(f.scoreMax < 100 ? { lte: f.scoreMax } : {}),
    };
  }
  const grantRange: Prisma.DateTimeFilter = {};
  if (f.grantFrom) grantRange.gte = new Date(f.grantFrom);
  if (f.grantTo) grantRange.lte = new Date(f.grantTo);
  if (Object.keys(grantRange).length) where.grantDate = grantRange;
  const filingRange: Prisma.DateTimeFilter = {};
  if (f.filingFrom) filingRange.gte = new Date(f.filingFrom);
  if (f.filingTo) filingRange.lte = new Date(f.filingTo);
  if (Object.keys(filingRange).length) where.filingDate = filingRange;
  return where;
}

function buildOrderBy(sort: MarketplaceFilters["sort"]): Prisma.PatentOrderByWithRelationInput {
  switch (sort) {
    case "score":
      return { readinessScore: "desc" };
    case "filing":
      return { filingDate: "desc" };
    case "grant":
      return { grantDate: "desc" };
    default:
      return { publishedAt: "desc" };
  }
}

export default async function PatentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const spRaw = await searchParams;
  // Flatten to URLSearchParams for easy repeatable-param handling.
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(spRaw)) {
    if (Array.isArray(v)) v.forEach((x) => x && sp.append(k, x));
    else if (v) sp.set(k, v);
  }
  const filters = parseFilters(sp);
  const where = buildWhere(filters);
  const orderBy = buildOrderBy(filters.sort);
  const page = filters.page;
  const pageSize = filters.pageSize;

  const [items, total, fields, jurisdictions, statuses, stageFacets] = await Promise.all([
    db.patent.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
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

  const facets: Facets = {
    fieldOfUse: fields.map((f) => f.fieldOfUse).filter(Boolean) as string[],
    jurisdiction: jurisdictions.map((j) => j.jurisdiction),
    legalStatus: statuses.map((s) => s.legalStatus).filter(Boolean) as string[],
    stage: stageFacets.map((s) => s.stage).filter(Boolean) as string[],
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Dates must be serialized for client components — convert to ISO strings.
  const serializableItems: PatentCardItem[] = items.map((p) => ({
    ...p,
    filingDate: p.filingDate ? p.filingDate.toISOString() : null,
    grantDate: p.grantDate ? p.grantDate.toISOString() : null,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Page header */}
      <Reveal className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5 rounded-full px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3 text-primary" />
              Public marketplace
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Patent marketplace</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Browse granted patents available for licensing or acquisition. Filter by field, jurisdiction,
              and readiness score — every listing carries an AI summary and a direct path to express interest.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-4 py-2.5 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{total}</span>{" "}
              {total === 1 ? "patent" : "patents"} listed
            </span>
          </div>
        </div>
      </Reveal>

      {/* Suspense boundary required because <MarketplaceExplorer> uses
          useSearchParams() — without it Next.js deopts the page to CSR. */}
      <Suspense
        fallback={
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <MarketplaceExplorer
          initialItems={serializableItems}
          initialTotal={total}
          facets={facets}
          initialFilters={filters}
          initialPage={page}
          initialTotalPages={totalPages}
        />
      </Suspense>
    </div>
  );
}
