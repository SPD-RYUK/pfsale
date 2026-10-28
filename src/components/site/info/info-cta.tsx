"use client";
// PatentSale — shared closing CTA used across the informational pages
// (About, How It Works, FAQ). Primary action opens the lead capture modal
// via the shared useLeadModal hook; secondary action links to the marketplace.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import { useLeadModal } from "@/components/site/lead-modal";

export function InfoCta({
  title = "Have a granted patent gathering dust?",
  description = "Submit a request in under a minute. Our team follows up to help you publish a storefront listing on the marketplace. No payment required to start.",
  primaryLabel = "Request Now",
  secondaryLabel = "Browse marketplace",
  dark = true,
}: {
  title?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  dark?: boolean;
}) {
  const { open } = useLeadModal();
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-primary px-6 py-14 text-center sm:px-12">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">{description}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={open}
                variant={dark ? "secondary" : "default"}
                className="gap-1.5"
              >
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className={
                  dark
                    ? "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    : ""
                }
              >
                <Link href="/patents">
                  <Search className="mr-1.5 h-4 w-4" /> {secondaryLabel}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
