import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal, MotionContainer, MotionItem } from "@/components/site/motion";
import { InfoCta } from "@/components/site/info/info-cta";
import {
  Sparkles,
  Eye,
  ShieldCheck,
  Wrench,
  Globe,
  ArrowRight,
  Compass,
  Target,
} from "lucide-react";

const VALUES = [
  {
    icon: Eye,
    title: "Buyer-evaluable, not just listed",
    body: "A listing nobody can evaluate is no better than a row in a government database. Every PatentSale listing carries structured data, plain-English summaries, and a commercial readiness score so a buyer can decide quickly.",
  },
  {
    icon: ShieldCheck,
    title: "Consent-first data handling (DPDPA)",
    body: "We collect only what we need, snapshot the exact consent language at the moment of submission, and name a real Grievance Officer. Data rights aren't a footnote — they're wired into the product.",
  },
  {
    icon: Wrench,
    title: "Manual care now, automation later",
    body: "We're honest about where we are. Today our team prepares each listing by hand — full bibliographic record, score, summaries. Self-serve automation is on the roadmap, but quality comes first.",
  },
  {
    icon: Globe,
    title: "Built for India, open to the world",
    body: "Designed DPDPA-first for Indian patent holders and buyers, with a data model that already supports multiple jurisdictions. The marketplace is open to granted patents wherever they're registered.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-32 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <MotionContainer className="mx-auto max-w-3xl text-center">
            <MotionItem>
              <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full px-3 py-1 text-xs">
                <Compass className="h-3 w-3 text-primary" /> About PatentSale
              </Badge>
            </MotionItem>
            <MotionItem>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Why PatentSale exists
              </h1>
            </MotionItem>
            <MotionItem>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
                A granted patent is a hard-won asset — and then, almost always, it sits. PatentSale
                exists to give every granted patent a real path from database record to commercial
                outcome.
              </p>
            </MotionItem>
          </MotionContainer>
        </div>
      </section>

      {/* MISSION */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <Badge variant="outline" className="mb-4">
                Our mission
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Patents are granted — and then go undiscovered
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Government patent databases are built for examiners, not buyers. A granted patent
                lands on a long, unranked, hard-to-search list, framed in legal language, with no
                storefront, no commercial framing, and no clear path from "I found this" to "I want
                to license it."
              </p>
              <p className="mt-4 text-lg text-muted-foreground">
                PatentSale fixes discoverability with a real marketplace for intellectual property.
                We turn static records into structured, evaluable listings — each with a commercial
                readiness score, AI-generated summaries, and a direct way for buyers to express
                interest.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <Card className="h-full border-border/60 bg-muted/30">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-primary">
                    <Target className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-wide">
                      The shift
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    From a database record…
                  </p>
                  <p className="mt-1 text-base font-medium text-foreground/80">
                    Indexed, technically public, seen by almost no one who could act on it.
                  </p>
                  <div className="my-5 flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 rotate-90 text-primary sm:rotate-0" />
                  </div>
                  <p className="text-sm text-muted-foreground">…to a marketplace listing</p>
                  <p className="mt-1 text-base font-medium text-foreground">
                    Discoverable, evaluable, with a commercial readiness score and a path to
                    express interest.
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* VISION */}
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Reveal className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4">
              Our vision
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Every granted patent has a path to commercialization
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We're building a future where a granted patent is not the end of a process but the
              beginning of one — where every IP owner has a credible storefront, every buyer has a
              structured catalog to browse, and the gap between "this exists" and "this could be
              mine" is measured in days, not years.
            </p>
          </Reveal>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">
              What we hold to
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Principles, not just features</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Four commitments that shape every product decision — from how we list a patent to how
              we handle your data.
            </p>
          </Reveal>

          <MotionContainer className="mt-14 grid gap-6 sm:grid-cols-2" stagger={0.1}>
            {VALUES.map((value) => (
              <MotionItem key={value.title}>
                <Card className="h-full border-border/60 transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <value.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{value.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{value.body}</p>
                  </CardContent>
                </Card>
              </MotionItem>
            ))}
          </MotionContainer>
        </div>
      </section>

      {/* QUICK LINKS */}
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Explore the marketplace</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse currently listed patents, or see exactly how the flow works.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline" className="gap-1.5">
                <Link href="/how-it-works">
                  How it works <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="gap-1.5">
                <Link href="/patents">
                  <Sparkles className="h-4 w-4" /> Browse patents
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <InfoCta />
    </>
  );
}
