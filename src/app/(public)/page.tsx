import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowRight, ShieldCheck, Search, Gauge, Sparkles, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal, MotionContainer, MotionItem } from "@/components/site/motion";
import { AnimatedCounter } from "@/components/site/animated-counter";
import { ScoreGauge } from "@/components/site/score-gauge";
import { HomeCtaButtons } from "@/components/site/home-cta";
import { PatentCard, type PatentCardItem } from "@/components/marketplace/patent-card";
import { formatDate, truncate } from "@/lib/format";

// Fields selected for the home-page Featured section. Mirrors the public PatentCardItem
// shape so we can hydrate <PatentCard featured> directly. Dates are ISO-serialized
// before being handed to the client component.
const HOME_PATENT_SELECT = {
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
} as const;

async function getHomeData() {
  const [publishedCount, fieldsCount, jurisdictionsCount, featuredRaw] = await Promise.all([
    db.patent.count({ where: { published: true } }),
    db.patent.findMany({ where: { published: true, fieldOfUse: { not: null } }, distinct: ["fieldOfUse"], select: { fieldOfUse: true } }),
    db.patent.findMany({ where: { published: true }, distinct: ["jurisdiction"], select: { jurisdiction: true } }),
    db.patent.findMany({
      where: { published: true, featured: true },
      orderBy: { readinessScore: "desc" },
      take: 3,
      select: HOME_PATENT_SELECT,
    }),
  ]);

  // Fallback: if fewer than 3 featured listings exist, top up with the
  // highest-readiness published patents (excluding the featured ones already
  // pulled, so we don't duplicate). Keeps the Featured section looking full.
  let featured: typeof featuredRaw = featuredRaw;
  if (featuredRaw.length < 3) {
    const excludeIds = featuredRaw.map((p) => p.id);
    const fallback = await db.patent.findMany({
      where: {
        published: true,
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      },
      orderBy: { readinessScore: "desc" },
      take: 3 - featuredRaw.length,
      select: HOME_PATENT_SELECT,
    });
    featured = [...featuredRaw, ...fallback];
  }

  return {
    publishedCount,
    fieldsCount: fieldsCount.length,
    jurisdictionsCount: jurisdictionsCount.length,
    featured,
  };
}

// Server→client serialization: Prisma returns Date objects; client components
// expect ISO strings (or null). Mirrors the pattern in /patents.
function serializePatent(p: {
  id: string;
  patentNumber: string;
  jurisdiction: string;
  title: string;
  abstract: string | null;
  fieldOfUse: string | null;
  assignee: string | null;
  filingDate: Date | string | null;
  grantDate: Date | string | null;
  legalStatus: string | null;
  readinessScore: number | null;
  scoreSource: string;
  stage: string | null;
  featured: boolean | null;
  summaryAbstract: string | null;
  summaryClaims: string | null;
  summaryField: string | null;
  patentFamilySize: number | null;
  publishedAt: Date | string | null;
}): PatentCardItem {
  return {
    ...p,
    filingDate: p.filingDate instanceof Date ? p.filingDate.toISOString() : p.filingDate,
    grantDate: p.grantDate instanceof Date ? p.grantDate.toISOString() : p.grantDate,
    publishedAt: p.publishedAt instanceof Date ? p.publishedAt.toISOString() : p.publishedAt,
  };
}

export default async function Home() {
  const data = await getHomeData();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-32 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <MotionContainer className="mx-auto max-w-3xl text-center">
            <MotionItem>
              <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full px-3 py-1 text-xs">
                <Sparkles className="h-3 w-3 text-primary" />
                A marketplace for unused granted patents
              </Badge>
            </MotionItem>
            <MotionItem>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Your patent earned its grant.
                <br />
                <span className="text-gradient">Now give it a market.</span>
              </h1>
            </MotionItem>
            <MotionItem>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
                Most granted patents sit on a long list on Google Patents, rarely seen by anyone with
                the means or motivation to license, buy, or build around them. PatentSale turns sitting
                ducks into discoverable, evaluable commercial opportunities.
              </p>
            </MotionItem>
            <MotionItem>
              <HomeCtaButtons />
            </MotionItem>
          </MotionContainer>

          {/* Stats */}
          <MotionContainer className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4" stagger={0.1}>
            {[
              { label: "Patents listed", value: data.publishedCount },
              { label: "Fields of use", value: data.fieldsCount },
              { label: "Jurisdictions", value: data.jurisdictionsCount },
              { label: "Buyer inquiries facilitated", value: 128, suffix: "+" },
            ].map((stat) => (
              <MotionItem key={stat.label}>
                <div className="rounded-xl border border-border/60 bg-card/60 p-4 text-center backdrop-blur">
                  <div className="text-3xl font-bold tabular-nums text-foreground">
                    <AnimatedCounter value={stat.value} />
                    {stat.suffix}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </MotionItem>
            ))}
          </MotionContainer>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">The problem</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Patents are sitting ducks</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Getting a patent granted is a milestone worth celebrating. But once the certificate is
              framed, the patent typically just sits on a government database — indexed, technically
              public, and seen by almost no one who could actually do something with it.
            </p>
          </Reveal>

          <MotionContainer className="mt-14 grid gap-6 md:grid-cols-3" stagger={0.12}>
            {[
              {
                icon: Search,
                title: "Undiscoverable",
                body: "Government patent databases are built for examiners, not buyers. There is no storefront, no commercial framing, no way to gauge interest at a glance.",
              },
              {
                icon: Gauge,
                title: "Unevaluable",
                body: "Even when a buyer finds a patent, the raw legal text gives them no signal of commercial viability. Claims, citations, market fit — all unstructured.",
              },
              {
                icon: Lock,
                title: "Unactionable",
                body: "There is no defined path from 'I found this patent' to 'I want to license it'. No inquiry flow, no handoff, no transaction. Just a dead end.",
              },
            ].map((item) => (
              <MotionItem key={item.title}>
                <Card className="h-full border-border/60">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
              </MotionItem>
            ))}
          </MotionContainer>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <Badge variant="outline" className="mb-4">The solution</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                A real storefront for intellectual property
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                PatentSale gives sellers a credible marketplace presence and buyers a structured,
                evaluable catalog instead of a static database. Every listing carries a commercial
                readiness score, AI-generated plain-English summaries, and a direct path to express
                interest.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: FileText, text: "Full bibliographic record with structured sections" },
                  { icon: Gauge, text: "Commercial readiness score, assigned by our team" },
                  { icon: Sparkles, text: "AI-generated summaries so buyers can gauge interest at a glance" },
                  { icon: ShieldCheck, text: "DPDPA-compliant consent and data handling throughout" },
                ].map((f) => (
                  <li key={f.text} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <f.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm text-foreground/90">{f.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild>
                  <Link href="/patents">
                    Browse the marketplace <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <Card className="overflow-hidden border-border/60 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="rounded-full">Featured listing</Badge>
                    {data.featured[0]?.readinessScore != null ? (
                      <span className="text-xs text-muted-foreground">Readiness {data.featured[0].readinessScore}/100</span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug">
                    {data.featured[0]?.title || "Sample patent listing"}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {truncate(data.featured[0]?.summaryAbstract, 180)}
                  </p>
                  <div className="mt-5 flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Commercial readiness</p>
                      <p className="text-xs font-medium text-foreground">Assigned by PatentSale team</p>
                    </div>
                    <ScoreGauge score={data.featured[0]?.readinessScore ?? null} size={84} showAssignedBy={false} />
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS preview */}
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">How it works</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Two paths, one marketplace</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Sellers can request a callback for an assisted listing today; a self-serve flow is on the
              roadmap. Either way, buyers get a structured, evaluable marketplace.
            </p>
          </Reveal>

          <MotionContainer className="mt-14 grid gap-6 md:grid-cols-2" stagger={0.12}>
            {[
              {
                tag: "Available now",
                title: "Assisted listing",
                body: "Submit a short request. Our sales team follows up by phone and email, helps you prepare the listing, and publishes it to the marketplace with a commercial readiness score.",
                cta: { href: "/how-it-works", label: "See the assisted flow" },
              },
              {
                tag: "Roadmap",
                title: "Self-serve flow",
                body: "A guided self-serve path where sellers enter patent details, we fetch and enrich the record automatically, and the listing goes live after payment — no sales call required.",
                cta: { href: "/how-it-works", label: "What's coming" },
              },
            ].map((item) => (
              <MotionItem key={item.title}>
                <Card className="h-full border-border/60">
                  <CardContent className="flex h-full flex-col p-6">
                    <Badge variant="outline" className="w-fit">{item.tag}</Badge>
                    <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{item.body}</p>
                    <Button asChild variant="ghost" className="mt-4 w-fit gap-1.5 px-0 hover:bg-transparent">
                      <Link href={item.cta.href}>
                        {item.cta.label} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </MotionItem>
            ))}
          </MotionContainer>
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      {data.featured.length > 0 ? (
        <section className="border-b border-border/60 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="outline" className="mb-4 gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Featured
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Featured patents</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Hand-picked granted patents — high commercial readiness, ready for licensing or acquisition.
                </p>
              </div>
              <Button asChild variant="ghost" className="hidden gap-1.5 sm:flex">
                <Link href="/patents">View all <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </Reveal>

            <MotionContainer className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
              {data.featured.map((p) => (
                <MotionItem key={p.id}>
                  <PatentCard patent={serializePatent(p)} featured />
                </MotionItem>
              ))}
            </MotionContainer>

            <div className="mt-8 text-center sm:hidden">
              <Button asChild variant="outline">
                <Link href="/patents">View all patents <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="relative overflow-hidden rounded-3xl border border-border/60 bg-primary px-6 py-14 text-center sm:px-12">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Have a granted patent gathering dust?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                Submit a request in under a minute. Our team follows up to help you publish a storefront
                listing on the marketplace. No payment required to start.
              </p>
              <div className="mt-8">
                <HomeCtaButtons dark />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
