import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal, MotionContainer, MotionItem } from "@/components/site/motion";
import { InfoCta } from "@/components/site/info/info-cta";
import { COMPANY } from "@/lib/consent";
import { HelpCircle, Store, ShoppingBag, ShieldCheck, Mail } from "lucide-react";

type QA = { q: string; a: string };

const SELLER_QA: QA[] = [
  {
    q: "How is a patent listed on PatentSale?",
    a: "Today, listing is fully assisted. You click Request Now and submit a short request (name, email, phone, patent number). Our team follows up by phone and email, prepares the full bibliographic record with AI-generated summaries, assigns a Commercial Readiness Score, and publishes it to the marketplace. A self-serve flow is on the roadmap.",
  },
  {
    q: "What does it cost to list?",
    a: "The assisted flow has no upfront payment to start. Pricing details are shared when our sales team follows up — there's no surprise charge at the Request Now step. You can decide whether to proceed before anything is published.",
  },
  {
    q: "Can I list a pending patent application, or only granted patents?",
    a: "The marketplace focuses on granted patents — that's what buyers are looking for, and it's what carries a meaningful Commercial Readiness Score. If you have a pending application you'd like to discuss, reach out via the Contact page and our team will advise.",
  },
  {
    q: "What jurisdictions are supported?",
    a: "Our data model supports multiple jurisdictions, and we're DPDPA-first for Indian patent holders. The marketplace is open to granted patents from any jurisdiction we can verify the public record for. If you're unsure whether your jurisdiction is supported, mention it in the Request Now form and we'll confirm.",
  },
];

const BUYER_QA: QA[] = [
  {
    q: "How do buyers express interest in a patent?",
    a: "Open any listing and use the 'Express interest' form. You provide your name, email, phone, and a short note on what you're looking for. Our team facilitates the introduction between you and the seller — you stay in control of next steps from there.",
  },
  {
    q: "What does the Commercial Readiness Score mean?",
    a: "It's a 0–100 signal of a patent's commercial viability, intended to help a buyer decide quickly whether to look deeper. It appears as a radial gauge on each listing card and on the detail page, color-coded by band. Higher generally means more commercially promising — but it's a starting signal, not a substitute for due diligence.",
  },
  {
    q: "Is the score algorithmic?",
    a: "Not yet. In this phase, the score is assigned by the PatentSale team based on the structured record — and the gauge is labeled 'Assigned by PatentSale team' so it's never mistaken for an automated output it isn't. An automated formula is on the roadmap as part of the self-serve flow.",
  },
  {
    q: "What information does each listing include?",
    a: "Each listing carries the full bibliographic record — title, abstract, claims, inventors, assignee, grant date, jurisdiction, field of use, legal status, and citations — plus AI-generated plain-English summaries of the abstract, claims, and field of use, interactive charts, and the readiness gauge.",
  },
];

const GENERAL_QA: QA[] = [
  {
    q: "What is PatentSale?",
    a: "PatentSale is a marketplace for unused granted patents. We turn static database records into structured, evaluable listings — each with a commercial readiness score, AI summaries, and a direct way for buyers to express interest. The goal is simple: every granted patent should have a path to commercialization.",
  },
  {
    q: "Who is PatentSale for?",
    a: "Two audiences. Sellers: IP owners with granted patents that are sitting unused and could be licensed or sold. Buyers: companies, founders, IP professionals, and investors looking for granted IP with commercial potential. Both sides get a structured, evaluable marketplace instead of a raw database.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. We're DPDPA-compliant: we collect only what we need, snapshot the exact consent language at submission, and name a real Grievance Officer for data access, correction, erasure, or complaints. You can withdraw consent at any time. See our Privacy Policy for the full details.",
  },
  {
    q: "How can I get in touch outside the Request Now flow?",
    a: `Use the Contact page for general inquiries — sales, partnerships, press, or anything that doesn't fit the listing flow. The sales inbox is ${COMPANY.salesEmail}. For data-related requests under the DPDPA, contact the Grievance Officer listed on the Contact page and in the Privacy Policy.`,
  },
];

const SECTIONS = [
  { id: "sellers", icon: Store, title: "For sellers", items: SELLER_QA },
  { id: "buyers", icon: ShoppingBag, title: "For buyers", items: BUYER_QA },
  { id: "general", icon: HelpCircle, title: "General", items: GENERAL_QA },
];

export default function FaqPage() {
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
                <HelpCircle className="h-3 w-3 text-primary" /> FAQ
              </Badge>
            </MotionItem>
            <MotionItem>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Frequently asked questions
              </h1>
            </MotionItem>
            <MotionItem>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
                Everything you might want to know about listing, browsing, scoring, and how we
                handle your data. Can't find what you're looking for?{" "}
                <Link href="/contact" className="font-medium text-primary hover:underline">
                  Contact us
                </Link>
                .
              </p>
            </MotionItem>
          </MotionContainer>
        </div>
      </section>

      {/* FAQ SECTIONS */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <MotionContainer className="space-y-12" stagger={0.08}>
            {SECTIONS.map((section) => (
              <MotionItem key={section.id}>
                <div id={section.id} className="scroll-mt-24">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <section.icon className="h-4 w-4" />
                    </span>
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                      {section.title}
                    </h2>
                  </div>
                  <Card className="border-border/60">
                    <CardContent className="p-2 sm:p-4">
                      <Accordion type="single" collapsible className="w-full">
                        {section.items.map((item, i) => (
                          <AccordionItem
                            key={item.q}
                            value={`${section.id}-${i}`}
                            className="px-2 sm:px-3"
                          >
                            <AccordionTrigger className="text-left text-sm font-medium sm:text-base">
                              {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                              {item.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
              </MotionItem>
            ))}
          </MotionContainer>
        </div>
      </section>

      {/* STILL HAVE QUESTIONS */}
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Reveal>
            <Card className="border-border/60 bg-background">
              <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      Still have questions?
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Our team is happy to help — general inquiries, listing questions, or data
                      requests.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
                    <ShieldCheck className="h-3.5 w-3.5" /> DPDPA-compliant
                  </span>
                  <Link
                    href="/contact"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Mail className="h-4 w-4" /> Contact us
                  </Link>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <InfoCta />
    </>
  );
}
