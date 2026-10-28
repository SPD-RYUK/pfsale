import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Reveal, MotionContainer, MotionItem } from "@/components/site/motion";
import { ContactForm } from "@/components/site/info/contact-form";
import { InfoCta } from "@/components/site/info/info-cta";
import { COMPANY, GRIEVANCE_OFFICER } from "@/lib/consent";
import { Mail, ShieldCheck, FileText, MessageSquare, LifeBuoy, MapPin } from "lucide-react";

const QUICK_REASONS = [
  {
    icon: MessageSquare,
    title: "General questions",
    body: "Anything about how the marketplace works, listing a patent, or browsing as a buyer.",
  },
  {
    icon: LifeBuoy,
    title: "Account & support",
    body: "Trouble with a form, a listing, or an inquiry you've already submitted? Reach out here.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy & data",
    body: "Data access, correction, or erasure requests go to the Grievance Officer (see sidebar).",
  },
];

export default function ContactPage() {
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
                <Mail className="h-3 w-3 text-primary" /> Contact us
              </Badge>
            </MotionItem>
            <MotionItem>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Contact us
              </h1>
            </MotionItem>
            <MotionItem>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
                This is for general inquiries. If you want to list a patent, use the{" "}
                <span className="font-medium text-foreground">Request Now</span> button in the
                navbar or at the bottom of this page — it's faster and routes you to the right team.
              </p>
            </MotionItem>
          </MotionContainer>
        </div>
      </section>

      {/* REASONS STRIP */}
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <MotionContainer className="grid gap-6 md:grid-cols-3" stagger={0.1}>
            {QUICK_REASONS.map((reason) => (
              <MotionItem key={reason.title}>
                <Card className="h-full border-border/60">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <reason.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">{reason.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{reason.body}</p>
                  </CardContent>
                </Card>
              </MotionItem>
            ))}
          </MotionContainer>
        </div>
      </section>

      {/* FORM + SIDEBAR */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
            {/* FORM */}
            <Reveal>
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Send us a message</h2>
                <p className="mt-2 text-muted-foreground">
                  Fill in the form and we'll get back to you by email, usually within one business
                  day.
                </p>
                <Card className="mt-6 border-border/60">
                  <CardContent className="p-6 sm:p-8">
                    <ContactForm />
                  </CardContent>
                </Card>
              </div>
            </Reveal>

            {/* SIDEBAR */}
            <Reveal delay={0.1}>
              <aside className="space-y-6">
                <Card className="border-border/60">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-primary">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm font-semibold uppercase tracking-wide">
                        Sales & general
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      For listing questions, partnerships, press, and anything that doesn't fit the
                      Request Now flow.
                    </p>
                    <a
                      href={`mailto:${COMPANY.salesEmail}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
                    >
                      <Mail className="h-4 w-4" /> {COMPANY.salesEmail}
                    </a>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-sm font-semibold uppercase tracking-wide">
                        Grievance Officer
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Data-related requests — access, correction, erasure, or complaints under the
                      DPDPA — go to our Grievance Officer, not the general inbox.
                    </p>
                    <p className="mt-3 text-sm font-medium text-foreground">
                      {GRIEVANCE_OFFICER.name}
                    </p>
                    <a
                      href={`mailto:${COMPANY.grievanceEmail}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
                    >
                      <Mail className="h-4 w-4" /> {COMPANY.grievanceEmail}
                    </a>
                    <Separator className="my-4" />
                    <p className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {GRIEVANCE_OFFICER.address}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-muted/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-primary">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-semibold uppercase tracking-wide">
                        Privacy & policy
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      How we collect, use, and protect your data, including your rights under the
                      DPDPA.
                    </p>
                    <Link
                      href="/privacy"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
                    >
                      <FileText className="h-4 w-4" /> Read the Privacy Policy
                    </Link>
                  </CardContent>
                </Card>
              </aside>
            </Reveal>
          </div>
        </div>
      </section>

      {/* REQUEST NOW CALLOUT */}
      <InfoCta
        title="Looking to list a patent?"
        description="The Request Now flow is the fastest way to reach our listings team. One minute, no payment — our team follows up by phone and email."
        primaryLabel="Request Now"
        secondaryLabel="Browse marketplace"
      />
    </>
  );
}
