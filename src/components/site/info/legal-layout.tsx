import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Info, ShieldAlert } from "lucide-react";
import { Reveal } from "@/components/site/motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// PatentSale — shared legal-page layout.
//
// Used by Terms of Service, Privacy Policy, and Refund / Cancellation Policy.
// Provides a centered max-w-3xl reading column, a title block, a "last updated
// + not a substitute for legal review" callout, an optional table of contents,
// and hand-styled prose typography (no @tailwindcss/typography dependency).
//
// Pages pass `<LegalSection>` blocks as children. Callouts via `<LegalCallout>`,
// in-page navigation via `<LegalToc>`.

export function LegalLayout({
  title,
  badge,
  lastUpdated,
  intro,
  toc,
  children,
}: {
  title: string;
  badge: string;
  lastUpdated: string;
  intro?: ReactNode;
  toc?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <Reveal>
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
          {badge}
        </Badge>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {intro ? (
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            {intro}
          </p>
        ) : null}
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="mt-8 border-border/60 bg-muted/30 shadow-none">
          <CardContent className="flex items-start gap-2.5 p-4 text-xs leading-relaxed text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p>
              <span className="font-semibold text-foreground">
                Last updated: {lastUpdated}.
              </span>{" "}
              This document is operational guidance, not a substitute for legal
              review by qualified counsel.
            </p>
          </CardContent>
        </Card>
      </Reveal>

      {toc ? <div className="mt-10">{toc}</div> : null}

      <Separator className="my-10" />

      {/* Hand-styled prose — no @tailwindcss/typography plugin dependency. */}
      <div
        className={cn(
          "space-y-12 text-sm leading-relaxed text-muted-foreground",
          "[&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:scroll-mt-24",
          "[&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:scroll-mt-24",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5",
          "[&_li]:leading-relaxed [&_li::marker]:text-muted-foreground/60",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80",
          "[&_strong]:text-foreground [&_strong]:font-semibold",
          "[&_p]:leading-relaxed"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function LegalToc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <Card className="border-border/60 bg-muted/20 shadow-none">
      <CardContent className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
          On this page
        </p>
        <ol className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-baseline gap-2">
              <span className="tabular-nums text-xs text-muted-foreground/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Link
                href={`#${item.id}`}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <section id={id} className="space-y-4">
        <h2>{title}</h2>
        {children}
      </section>
    </Reveal>
  );
}

export function LegalCallout({
  variant = "info",
  title,
  children,
}: {
  variant?: "info" | "warning";
  title?: string;
  children: ReactNode;
}) {
  const Icon = variant === "warning" ? ShieldAlert : Info;
  return (
    <Card className="border-border/60 bg-muted/30 shadow-none">
      <CardContent className="flex items-start gap-2.5 p-4 text-xs leading-relaxed">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            variant === "warning"
              ? "text-amber-600 dark:text-amber-500"
              : "text-primary"
          )}
        />
        <div className="space-y-1">
          {title ? <p className="font-semibold text-foreground">{title}</p> : null}
          <div className="text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-foreground [&_strong]:font-semibold">
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
