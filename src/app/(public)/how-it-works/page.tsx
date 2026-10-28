import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal, MotionContainer, MotionItem } from "@/components/site/motion";
import { ScoreGauge } from "@/components/site/score-gauge";
import { InfoCta } from "@/components/site/info/info-cta";
import {
  Compass,
  Phone,
  FileText,
  Gauge,
  Store,
  Eye,
  Handshake,
  Rocket,
  Search,
  Sparkles,
  BarChart3,
  Send,
  CheckCircle2,
  Clock,
} from "lucide-react";

const ASSISTED_STEPS = [
  {
    icon: Send,
    title: "Submit a short request",
    body: "Click Request Now anywhere on the site and share your name, email, phone, and patent number. No payment, no document uploads, no commitment.",
  },
  {
    icon: Phone,
    title: "Our team follows up",
    body: "A PatentSale team member reaches out by phone and email within business hours to understand your patent, your goals, and what you'd like to list.",
  },
  {
    icon: FileText,
    title: "We help prepare the listing",
    body: "We assemble the full bibliographic record — title, abstract, claims, inventors, assignee, grant date, citations — and generate plain-English AI summaries buyers can actually read.",
  },
  {
    icon: Gauge,
    title: "We assign a readiness score",
    body: "Our team assigns a Commercial Readiness Score (0–100) reflecting commercial viability, based on the structured record. It's shown as a radial gauge on the listing.",
  },
  {
    icon: Store,
    title: "We publish to the marketplace",
    body: "The listing goes live with filters, facets, and search — discoverable by field of use, jurisdiction, legal status, and score band.",
  },
  {
    icon: Handshake,
    title: "Buyers browse and express interest",
    body: "When a buyer is interested, they submit a short inquiry. We facilitate the introduction between you and the buyer — you stay in control of next steps.",
  },
];

const SELF_SERVE_STEPS = [
  "Seller enters the patent number and a few details.",
  "We fetch and enrich the record automatically — bibliographic data, claims, citations.",
  "AI generates plain-English summaries for abstract, claims, and field of use.",
  "Seller reviews, picks a plan, and pays.",
  "Listing goes live on the marketplace. No sales call required.",
];

const BUYER_STEPS = [
  {
    icon: Search,
    title: "Browse with filters",
    body: "Search the marketplace by keyword, and filter by field of use, jurisdiction, legal status, and readiness score band.",
  },
  {
    icon: Sparkles,
    title: "Read AI summaries",
    body: "Each listing carries AI-generated plain-English summaries of the abstract, claims, and field of use — so you can gauge interest at a glance.",
  },
  {
    icon: BarChart3,
    title: "View detail with interactive charts",
    body: "Open a listing to see the full structured record with interactive charts — citations, timeline, score breakdown — and the readiness gauge front and center.",
  },
  {
    icon: Send,
    title: "Express interest via a short form",
    body: "Submit a quick inquiry with your details and what you're looking for. Our team facilitates the introduction to the seller.",
  },
];

export default function HowItWorksPage() {
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
                <Compass className="h-3 w-3 text-primary" /> How it works
              </Badge>
            </MotionItem>
            <MotionItem>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                How PatentSale works
              </h1>
            </MotionItem>
            <MotionItem>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
                Two paths, one marketplace. Today, sellers get a fully assisted listing handled by
                our team. A self-serve flow is on the roadmap. Either way, buyers get a structured,
                evaluable catalog.
              </p>
            </MotionItem>
          </MotionContainer>
        </div>
      </section>

      {/* TWO PATHS OVERVIEW */}
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <MotionContainer className="grid gap-6 md:grid-cols-2" stagger={0.12}>
            <MotionItem>
              <Card className="h-full border-border/60">
                <CardContent className="flex h-full flex-col p-6">
                  <Badge variant="secondary" className="w-fit gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> Available now
                  </Badge>
                  <h3 className="mt-3 text-xl font-semibold">Assisted listing</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">
                    You submit a short request, our team does the heavy lifting — preparing the full
                    bibliographic record, summaries, and score — and publishes it to the
                    marketplace. Best for sellers who want a hands-off, high-quality listing.
                  </p>
                  <Button asChild variant="ghost" className="mt-4 w-fit gap-1.5 px-0 hover:bg-transparent">
                    <Link href="#assisted">
                      See the assisted flow <Compass className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </MotionItem>
            <MotionItem>
              <Card className="h-full border-dashed border-border/60">
                <CardContent className="flex h-full flex-col p-6">
                  <Badge variant="outline" className="w-fit gap-1.5">
                    <Clock className="h-3 w-3" /> Coming soon
                  </Badge>
                  <h3 className="mt-3 text-xl font-semibold">Self-serve flow</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">
                    A guided path where sellers enter patent details, we fetch and enrich the record
                    automatically, and the listing goes live after payment — no sales call required.
                    On the roadmap.
                  </p>
                  <Button asChild variant="ghost" className="mt-4 w-fit gap-1.5 px-0 hover:bg-transparent">
                    <Link href="#self-serve">
                      What's coming <Rocket className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </MotionItem>
          </MotionContainer>
        </div>
      </section>

      {/* ASSISTED TIMELINE */}
      <section id="assisted" className="scroll-mt-24 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">
              Assisted listing · Available now
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From request to published listing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Six steps. You start with a one-minute request — we handle the rest.
            </p>
          </Reveal>

          <div className="relative mx-auto mt-14 max-w-3xl">
            {/* vertical line */}
            <div
              aria-hidden
              className="absolute left-[27px] top-2 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-primary/40 via-border to-transparent sm:left-[35px]"
            />
            <MotionContainer className="space-y-8" stagger={0.1}>
              {ASSISTED_STEPS.map((step, i) => (
                <MotionItem key={step.title} y={20}>
                  <div className="flex gap-4 sm:gap-6">
                    <div className="relative z-10 flex shrink-0 flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-sm">
                        <step.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                          Step {i + 1}
                        </span>
                      </div>
                      <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
                    </div>
                  </div>
                </MotionItem>
              ))}
            </MotionContainer>
          </div>
        </div>
      </section>

      {/* SELF-SERVE ROADMAP */}
      <section id="self-serve" className="scroll-mt-24 border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <Badge variant="outline" className="mb-4 gap-1.5">
                <Clock className="h-3 w-3" /> Roadmap · Coming soon
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                The self-serve flow we're building
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                The assisted flow is how we guarantee quality today. The self-serve flow is how we
                scale — sellers will be able to list a patent end-to-end without picking up the
                phone.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Phase B brings automatic record enrichment (fetching bibliographic data, claims, and
                citations from public sources). Prompt 2 adds payment-gated publishing. The
                Commercial Readiness Score moves from manual to an automated formula over the same
                horizon.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <Card className="border-dashed border-border/60">
                <CardContent className="p-6 sm:p-8">
                  <ol className="space-y-4">
                    {SELF_SERVE_STEPS.map((step, i) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-sm text-foreground/90">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* READINESS SCORE */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <Badge variant="outline" className="mb-4">
                The Commercial Readiness Score
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                One number that signals commercial viability
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                The Commercial Readiness Score is a 0–100 signal that helps a buyer gauge whether a
                patent is worth a deeper look — fast. It appears as a radial gauge on every listing,
                on listing cards, and on the detail page.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                In this phase, the score is <strong>assigned by the PatentSale team</strong> based
                on the structured record — field of use, legal status, citations, grant recency, and
                more. We're transparent about that: the gauge is labeled "Assigned by PatentSale
                team" so it's never mistaken for an automated output it isn't. An{" "}
                <strong>automated formula</strong> is coming as part of the self-serve roadmap.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
                  <ScoreGauge score={78} size={140} />
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-medium text-foreground">
                      Example: a high-readiness listing
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The gauge animates from 0 to the assigned score on view, color-coded by band
                      (amber for mid, emerald for high). Below it: the label and "Assigned by
                      PatentSale team".
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* BUYER EXPERIENCE */}
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">
              For buyers
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              A structured catalog, not a database dump
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse, evaluate, and express interest — in minutes, not weeks.
            </p>
          </Reveal>

          <MotionContainer className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
            {BUYER_STEPS.map((step) => (
              <MotionItem key={step.title}>
                <Card className="h-full border-border/60 transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                  </CardContent>
                </Card>
              </MotionItem>
            ))}
          </MotionContainer>

          <Reveal className="mt-10 text-center">
            <Button asChild size="lg" className="gap-1.5">
              <Link href="/patents">
                <Eye className="h-4 w-4" /> Browse the marketplace
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <InfoCta
        title="Ready to list your patent?"
        description="Submit a request in under a minute. Our team follows up to help you publish a storefront listing on the marketplace. No payment required to start."
      />
    </>
  );
}
