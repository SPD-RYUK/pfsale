"use client";
// Client CTA buttons for the home page. The primary action opens the lead
// capture modal via the shared useLeadModal hook.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import { useLeadModal } from "@/components/site/lead-modal";

export function HomeCtaButtons({ dark }: { dark?: boolean }) {
  const { open } = useLeadModal();
  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Button size="lg" onClick={open} variant={dark ? "secondary" : "default"} className="gap-1.5">
        Request Now <ArrowRight className="h-4 w-4" />
      </Button>
      <Button asChild size="lg" variant={dark ? "outline" : "outline"} className={dark ? "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" : ""}>
        <Link href="/patents">
          <Search className="mr-1.5 h-4 w-4" /> Browse marketplace
        </Link>
      </Button>
    </div>
  );
}
