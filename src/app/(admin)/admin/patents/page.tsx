// Admin patents list — SERVER COMPONENT.
//
// Reads searchParams (q, published, jurisdiction, stage, page) and fetches
// the FIRST page of patents directly from the DB (no client-side API round
// trip on first paint). The result is passed to <LazyPatentsList> as initial
// data + initial filters. Subsequent filter/search/page changes are handled
// client-side by the PatentsListClient component, which refetches from
// /api/admin/patents.
//
// This is the "backend-ified" pattern: server-side first-paint fetch for SEO
// + speed, client-side interactivity for filters/pagination. Same pattern as
// /admin/patents/[id] (server fetch → LazyPatentForm client).
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { LazyPatentsList, type PatentRow } from "@/components/admin/lazy-patents-list";

const PAGE_SIZE = 25;

export default async function AdminPatentsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const publishedRaw = typeof sp.published === "string" ? sp.published : "all";
  const jurisdiction = typeof sp.jurisdiction === "string" ? sp.jurisdiction : "all";
  const stageRaw = typeof sp.stage === "string" ? sp.stage : "all";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "1") || 1);

  const where: Prisma.PatentWhereInput = {};
  if (publishedRaw === "true") where.published = true;
  if (publishedRaw === "false") where.published = false;
  if (jurisdiction && jurisdiction !== "all") where.jurisdiction = jurisdiction;
  if (stageRaw && stageRaw !== "all") where.stage = stageRaw;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { patentNumber: { contains: q } },
      { abstract: { contains: q } },
      { assignee: { contains: q } },
      { fieldOfUse: { contains: q } },
    ];
  }

  const [rows, total] = await Promise.all([
    db.patent.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { inquiries: true } } },
    }),
    db.patent.count({ where }),
  ]);

  // Serialize Date fields + project to the PatentRow shape the client expects.
  const items: PatentRow[] = rows.map((r) => ({
    id: r.id,
    patentNumber: r.patentNumber,
    jurisdiction: r.jurisdiction,
    title: r.title,
    fieldOfUse: r.fieldOfUse,
    readinessScore: r.readinessScore,
    dataSource: r.dataSource,
    published: r.published,
    stage: r.stage,
    featured: r.featured,
    updatedAt: r.updatedAt.toISOString(),
    _count: { inquiries: r._count.inquiries },
  }));

  return (
    <LazyPatentsList
      initialItems={items}
      initialTotal={total}
      initialPage={page}
      initialPageSize={PAGE_SIZE}
      initialFilters={{ q, published: publishedRaw, jurisdiction, stage: stageRaw }}
    />
  );
}
