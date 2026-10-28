// Patent detail page — server component. Fetches the patent by id (must be
// published). Renders breadcrumb, header, right rail with ScoreGauge + readiness
// inputs, tabbed content (Overview / Claims / Description / Visuals), and the
// Express Interest CTA. Fires `listing_view` analytics via a tiny client
// component on mount. generateMetadata pulls the patent title for SEO.
import type React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Sparkles, Scale, Calendar, CalendarClock, Users, Building2,
  FileText, ClipboardList, BarChart3, ArrowLeft, Layers, Star, TrendingUp,
  ScrollText,
} from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Reveal } from "@/components/site/motion";
import { ScoreGauge } from "@/components/site/score-gauge";
import { formatDate, parseInventors, scoreColor, scoreLabel, truncate } from "@/lib/format";
import { stageBadgeClass, stageLabel } from "@/lib/stages";
import { ClaimStructure } from "@/components/marketplace/claim-structure";
// Lazy-load DetailCharts via a thin client wrapper so the heavy recharts/d3
// dependency tree is NOT pulled into the route's initial module graph.
// Without this, the first visit to any /patents/[id] page pays a ~4.7s
// dev-compile cost (recharts source). With this, the page HTML renders in
// ~300ms and the chart bundle hydrates async only when the user opens the
// Visuals tab. Type-only import is erased at compile time.
import DetailChartsLazy from "@/components/marketplace/detail-charts-lazy";
import type { DetailPatent } from "@/components/marketplace/detail-charts";
import { InquiryDialog } from "@/components/marketplace/inquiry-dialog";
import { ReportRequestDialog } from "@/components/marketplace/report-request-dialog";
import { ListingViewTracker } from "@/components/marketplace/listing-view-tracker";

// Canonical production URL — used to build absolute JSON-LD + OpenGraph URLs.
// Matches the host used in lib/email.ts + lib/consent.ts + sitemap.ts so the
// structured data and the rest of the SEO surface agree.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://patentforsale.in";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const patent = await db.patent.findUnique({
    where: { id },
    select: { title: true, patentNumber: true, jurisdiction: true, summaryAbstract: true, published: true },
  });
  if (!patent || !patent.published) {
    return { title: "Patent not found — PatentSale" };
  }
  const description = truncate(patent.summaryAbstract || patent.title, 160);
  return {
    title: `${patent.title} — ${patent.patentNumber} | PatentSale`,
    description,
    alternates: { canonical: `/patents/${id}` },
    openGraph: {
      title: `${patent.title} — ${patent.patentNumber}`,
      description,
      url: `/patents/${id}`,
      type: "article",
    },
  };
}

export default async function PatentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patent = await db.patent.findUnique({ where: { id } });

  if (!patent || !patent.published) {
    notFound();
  }

  const inventors = parseInventors(patent);

  // Fetch the marketplace field-of-use distribution so the detail visuals can
  // show this patent's field in market context (a "field-of-use category chart"
  // as required by the spec). Only published listings count.
  const fieldGroups = await db.patent.groupBy({
    by: ["fieldOfUse"],
    where: { published: true, fieldOfUse: { not: null } },
    _count: { _all: true },
  });
  const fieldDistribution = fieldGroups
    .map((g) => ({ field: g.fieldOfUse as string, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  // Build a serializable view for the client DetailCharts component.
  const detailPatent: DetailPatent = {
    id: patent.id,
    title: patent.title,
    fieldOfUse: patent.fieldOfUse,
    readinessScore: patent.readinessScore,
    scoreSource: patent.scoreSource,
    claimBreadth: patent.claimBreadth,
    remainingLifeYears: patent.remainingLifeYears,
    forwardCitations: patent.forwardCitations,
    marketSizeProxy: patent.marketSizeProxy,
    litigationHistory: patent.litigationHistory,
    patentFamilySize: patent.patentFamilySize,
    legalStatus: patent.legalStatus,
    filingDate: patent.filingDate ? patent.filingDate.toISOString() : null,
    grantDate: patent.grantDate ? patent.grantDate.toISOString() : null,
  };

  // JSON-LD Product schema — lets search engines (Google rich results,
  // Bing, etc.) understand this is a listable IP asset with an offer.
  // Optional fields are only included when we actually have data, so we
  // never emit `"category": undefined` / `"brand": undefined` keys (the
  // JSON-LD validator warns on those).
  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: patent.title,
    description: (patent.summaryAbstract?.trim() || patent.abstract?.trim() || patent.title) as string,
    url: `${SITE_URL}/patents/${patent.id}`,
    offers: {
      "@type": "Offer",
      priceSpecification: {
        "@type": "PriceSpecification",
        price: "Contact for licensing",
      },
      // Listings are live and available — InStock is the closest schema.org
      // value for "actively listed, accepting inquiries".
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/patents/${patent.id}`,
      seller: {
        "@type": "Organization",
        name: "PatentSale",
        url: SITE_URL,
      },
    },
  };
  if (patent.fieldOfUse) productJsonLd.category = patent.fieldOfUse;
  if (patent.assignee) {
    productJsonLd.brand = { "@type": "Brand", name: patent.assignee };
  }
  if (patent.patentNumber) {
    productJsonLd.sku = patent.patentNumber;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-24 lg:px-8 lg:pb-10">
      {/* JSON-LD structured data — Product schema. Injected with
          dangerouslySetInnerHTML because Next.js doesn't ship a built-in
          JSON-LD component; the schema string is fully controlled by us
          (no user input) so this is safe. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <ListingViewTracker patentId={patent.id} />

      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-3.5 w-3.5" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/patents">Marketplace</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-3.5 w-3.5" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-mono text-xs">{patent.patentNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back to marketplace (mobile-friendly) */}
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1 text-muted-foreground">
        <Link href="/patents">
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
        {/* Header — full width on desktop, first on mobile */}
        <div className="lg:col-span-2">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
                {patent.jurisdiction}
              </Badge>
              {patent.stage ? (
                <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${stageBadgeClass(patent.stage)}`}>
                  {stageLabel(patent.stage)}
                </Badge>
              ) : null}
              {patent.featured ? (
                <Badge variant="default" className="gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  <Star className="h-3 w-3 fill-current" />
                  Featured
                </Badge>
              ) : null}
              <span className="font-mono text-sm text-muted-foreground">{patent.patentNumber}</span>
              {patent.legalStatus ? (
                <Badge variant="outline" className="capitalize">{patent.legalStatus}</Badge>
              ) : null}
              {patent.fieldOfUse ? (
                <Badge variant="outline">{patent.fieldOfUse}</Badge>
              ) : null}
            </div>
            <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
              {patent.title}
            </h1>
            {patent.assignee ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                Assigned to <span className="font-medium text-foreground">{patent.assignee}</span>
              </p>
            ) : null}

            {/* Quick action — request the full report (always visible near the top) */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ReportRequestDialog
                patentId={patent.id}
                patentTitle={patent.title}
                triggerLabel="Get full report"
                triggerVariant="outline"
                triggerSize="default"
              />
              <span className="text-xs text-muted-foreground">
                Free — full score breakdown, claim analysis & market sizing sent to your inbox.
              </span>
            </div>

            {/* Bibliographic strip */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <BibItem icon={CalendarClock} label="Filed" value={formatDate(patent.filingDate)} />
              <BibItem icon={Calendar} label="Granted" value={formatDate(patent.grantDate)} />
              <BibItem
                icon={Users}
                label="Inventors"
                value={inventors.length > 0 ? inventors.join(", ") : "—"}
              />
            </div>
          </Reveal>
        </div>

        {/* Right rail — score + readiness inputs.
            On mobile: appears before the tabs (so the score is "top").
            On desktop: right column, sticky. */}
        <aside className="lg:col-start-2 lg:row-start-2 lg:sticky lg:top-24 lg:h-fit">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Commercial readiness</CardTitle>
              <CardDescription>
                Assigned by the PatentSale team based on the inputs below.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ScoreGauge score={patent.readinessScore} size={140} showAssignedBy />
              <div className="mt-4 w-full">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Score band</span>
                  <span className={`font-semibold ${scoreColor(patent.readinessScore)}`}>
                    {scoreLabel(patent.readinessScore)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-medium capitalize text-foreground">
                    {patent.scoreSource === "manual" ? "Manual" : patent.scoreSource}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Readiness inputs reference list */}
          <Card className="mt-4 border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Readiness inputs (reference data)
              </CardTitle>
              <CardDescription>Reference data for the assigned score.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2.5 text-sm">
                <DefRow label="Claim breadth" value={patent.claimBreadth} />
                <DefRow
                  label="Remaining life"
                  value={patent.remainingLifeYears != null ? `${patent.remainingLifeYears.toFixed(1)} yrs` : null}
                />
                <DefRow
                  label="Forward citations"
                  value={patent.forwardCitations != null ? String(patent.forwardCitations) : null}
                />
                <DefRow label="Market size" value={patent.marketSizeProxy} />
                <DefRow label="Litigation history" value={patent.litigationHistory} />
              </dl>
            </CardContent>
          </Card>
        </aside>

        {/* Main column — tabs + CTA. On desktop: left column, row 2. */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <Separator className="mb-8 lg:hidden" />

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 sm:w-auto">
              <TabsTrigger value="overview" className="gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="abstract" className="gap-1.5">
                <ScrollText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Abstract</span>
              </TabsTrigger>
              <TabsTrigger value="claims" className="gap-1.5">
                <Scale className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Claims</span>
              </TabsTrigger>
              <TabsTrigger value="description" className="gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Description</span>
              </TabsTrigger>
              <TabsTrigger value="visuals" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Visuals</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-6 space-y-5">
              <SummaryCard
                title="Abstract summary"
                summary={patent.summaryAbstract}
                fallback={patent.abstract}
                fallbackTitle="Abstract"
              />
              <SummaryCard
                title="Claims summary"
                summary={patent.summaryClaims}
                fallback={null}
                fallbackTitle="Claims"
              />
              <SummaryCard
                title="Field of use summary"
                summary={patent.summaryField}
                fallback={patent.fieldOfUse}
                fallbackTitle="Field of use"
              />
            </TabsContent>

            {/* Abstract — the verbatim abstract as filed with the patent
                office. Previously collapsed inside the Overview tab; promoted
                to its own top-level tab so buyers can read the full, uncut
                abstract without scrolling past AI-summary cards. */}
            <TabsContent value="abstract" className="mt-6">
              {patent.abstract ? (
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ScrollText className="h-4 w-4 text-muted-foreground" />
                      Full abstract
                    </CardTitle>
                    <CardDescription>
                      The original abstract as filed with the patent office —
                      verbatim and uncut.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[32rem]">
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                        {patent.abstract}
                      </p>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                  <ScrollText className="mx-auto mb-2 h-6 w-6 opacity-50" />
                  No abstract available for this listing.
                </div>
              )}
            </TabsContent>

            {/* Claims */}
            <TabsContent value="claims" className="mt-6 space-y-6">
              <div>
                <h2 className="mb-3 text-lg font-semibold">Interactive claim structure</h2>
                <ClaimStructure claims={patent.claims} />
              </div>
              <Separator />
              <div>
                <h2 className="mb-3 text-lg font-semibold">Full claims text</h2>
                {patent.claims ? (
                  <ScrollArea className="h-96 rounded-lg border border-border/60 bg-muted/30">
                    <pre className="whitespace-pre-wrap p-4 text-xs leading-relaxed text-foreground/80">
                      {patent.claims}
                    </pre>
                  </ScrollArea>
                ) : (
                  <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    No claims text available for this listing.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Description */}
            <TabsContent value="description" className="mt-6">
              {patent.description ? (
                <>
                  <h2 className="mb-3 text-lg font-semibold">Detailed description</h2>
                  <ScrollArea className="h-[32rem] rounded-lg border border-border/60 bg-muted/30">
                    <pre className="whitespace-pre-wrap p-5 text-sm leading-relaxed text-foreground/85">
                      {patent.description}
                    </pre>
                  </ScrollArea>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                  <ClipboardList className="mx-auto mb-2 h-6 w-6 opacity-50" />
                  No detailed description available for this listing.
                </div>
              )}
            </TabsContent>

            {/* Visuals */}
            <TabsContent value="visuals" className="mt-6">
              <DetailChartsLazy patent={detailPatent} fieldDistribution={fieldDistribution} />
            </TabsContent>
          </Tabs>

          {/* Next steps — Express interest + Get full report (lead-gen conversion) */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next steps</span>
              <Separator className="flex-1" />
            </div>

            {/* Prominent report CTA — lead-gen conversion point */}
            <Card className="overflow-hidden border-primary/40 bg-gradient-to-br from-primary/5 via-background to-background">
              <CardContent className="p-6 sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-xl">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      <Sparkles className="h-3 w-3" />
                      Free report
                    </div>
                    <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                      Get the full commercial readiness report
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      The on-page score is a summary. The full report breaks it down — detailed score
                      breakdown, claim analysis, market sizing with comparable transactions, and
                      commercialization pathways. We capture your details and our sales team follows
                      up with the complete PDF.
                    </p>
                    <ul className="mt-4 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                      <li className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Score breakdown & claim analysis</li>
                      <li className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-primary" /> Market sizing & comparables</li>
                      <li className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-primary" /> Family & litigation review</li>
                      <li className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Commercialization pathways</li>
                    </ul>
                  </div>
                  <div className="shrink-0 lg:w-auto">
                    <ReportRequestDialog
                      patentId={patent.id}
                      patentTitle={patent.title}
                      triggerLabel="Get full report"
                      triggerVariant="default"
                      triggerSize="lg"
                      triggerClassName="w-full lg:w-auto"
                    />
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">
                      No payment required. Response within 2 business days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Express interest CTA */}
            <Card className="overflow-hidden border-border/60">
              <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold">Interested in this patent?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Express interest and our team will facilitate an introduction — no payment required to start.
                  </p>
                </div>
                <InquiryDialog
                  patentId={patent.id}
                  patentTitle={patent.title}
                  triggerLabel="Express interest"
                  triggerSize="lg"
                  triggerClassName="w-full sm:w-auto"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA bar — always visible on small screens */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <div className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Full readiness report</p>
            <p className="truncate text-[11px] text-muted-foreground">Free. Sent to your inbox.</p>
          </div>
          <ReportRequestDialog
            patentId={patent.id}
            patentTitle={patent.title}
            triggerLabel="Get report"
            triggerVariant="default"
            triggerSize="default"
            triggerClassName="shrink-0"
          />
        </div>
      </div>
    </div>
  );
}

function BibItem({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function DefRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize text-foreground">
        {value ? value : <span className="italic text-muted-foreground/70">Not specified</span>}
      </dd>
    </div>
  );
}

function SummaryCard({
  title, summary, fallback, fallbackTitle,
}: {
  title: string;
  summary: string | null | undefined;
  fallback: string | null | undefined;
  fallbackTitle: string;
}) {
  const hasAI = Boolean(summary && summary.trim());
  const body = hasAI ? summary! : fallback;
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          {hasAI ? (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Sparkles className="h-2.5 w-2.5 text-primary" />
              AI summary
            </Badge>
          ) : (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{fallbackTitle}</span>
          )}
        </div>
        {body ? (
          <p className="text-sm leading-relaxed text-foreground/85">{body}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground/70">No data available for this section.</p>
        )}
      </CardContent>
    </Card>
  );
}
