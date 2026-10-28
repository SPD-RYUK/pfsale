"use client";
// PatentCard — the listing card shown in the marketplace grid.
// Premium, mobile-first. Hover lift + border emphasis. AI summary snippet
// with a Sparkles label. Compact readiness score indicator (mini gauge).
// Stage badge near the top row (uses stageBadgeClass / stageLabel from @/lib/stages).
// Optional `featured` prop adds a subtle blue ring + a top-right Featured star.
import Link from "next/link";
import { Sparkles, MessageSquare, Scale, CalendarClock, Layers, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "@/components/site/score-gauge";
import { formatDate, truncate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { stageLabel, stageBadgeClass } from "@/lib/stages";

export interface PatentCardItem {
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
  _count?: { inquiries: number };
}

function legalStatusVariant(status: string | null) {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "granted") return "default" as const;
  if (s === "pending") return "secondary" as const;
  return "outline" as const;
}

export function PatentCard({ patent, featured = false }: { patent: PatentCardItem; featured?: boolean }) {
  const summary = patent.summaryAbstract || patent.abstract || "";
  const hasAI = Boolean(patent.summaryAbstract);
  const inquiries = patent._count?.inquiries ?? 0;
  const isFeatured = featured || patent.featured === true;
  const showStageBadge = Boolean(patent.stage);

  return (
    <Link href={`/patents/${patent.id}`} className="group block h-full focus-visible:outline-none">
      <Card
        className={cn(
          "group/card relative h-full gap-0 overflow-hidden border p-5 py-5",
          isFeatured
            ? "border-primary/40 ring-1 ring-primary/30 shadow-md shadow-primary/5"
            : "border-border/60",
          "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
          "group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2"
        )}
      >
        {/* subtle top accent */}
        <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-primary to-chart-2 transition-transform duration-500 group-hover/card:scale-x-100" />

        {/* Featured star (top-right) */}
        {isFeatured ? (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
            <Star className="h-3 w-3" />
            Featured
          </span>
        ) : null}

        {/* Top row: jurisdiction + stage + field + inquiries.
            When featured, the top-right Featured badge replaces the inquiries count. */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {patent.jurisdiction}
            </Badge>
            {showStageBadge ? (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  stageBadgeClass(patent.stage)
                )}
              >
                {stageLabel(patent.stage)}
              </Badge>
            ) : null}
            {patent.fieldOfUse ? (
              <span className="truncate text-[11px] text-muted-foreground">{patent.fieldOfUse}</span>
            ) : null}
          </div>
          {inquiries > 0 && !isFeatured ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {inquiries} {inquiries === 1 ? "inquiry" : "inquiries"}
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug transition-colors group-hover/card:text-primary">
          {patent.title}
        </h3>

        {/* AI summary snippets — abstract (primary), plus compact claims + field lines */}
        <div className="mt-2.5 flex-1 space-y-1.5">
          {summary ? (
            <div>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {hasAI ? truncate(summary, 220) : truncate(summary, 180)}
              </p>
              {hasAI ? (
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-primary/80">
                  <Sparkles className="h-3 w-3" />
                  AI summary
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground/70">No summary available.</p>
          )}

          {/* Compact per-section AI summaries (claims + field) */}
          {patent.summaryClaims ? (
            <p className="line-clamp-1 text-xs text-muted-foreground/85">
              <span className="font-medium text-muted-foreground">Claims:</span>{" "}
              {truncate(patent.summaryClaims, 110)}
            </p>
          ) : null}
          {patent.summaryField ? (
            <p className="line-clamp-1 text-xs text-muted-foreground/85">
              <span className="font-medium text-muted-foreground">Field:</span>{" "}
              {truncate(patent.summaryField, 110)}
            </p>
          ) : null}
        </div>

        {/* Compact metrics row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
          {patent.legalStatus ? (
            <span className="inline-flex items-center gap-1">
              <Scale className="h-3 w-3" />
              <Badge variant={legalStatusVariant(patent.legalStatus)} className="px-1.5 py-0 text-[10px] capitalize">
                {patent.legalStatus}
              </Badge>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            Granted {formatDate(patent.grantDate)}
          </span>
        </div>

        {/* Bottom row: score */}
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Readiness</p>
            <p className="text-[11px] text-muted-foreground">
              {patent.assignee ? (
                <span className="line-clamp-1 max-w-[12rem]">{patent.assignee}</span>
              ) : (
                <span className="italic">Unrated</span>
              )}
            </p>
          </div>
          <ScoreGauge score={patent.readinessScore} size={64} showAssignedBy={false} label="" />
        </div>
      </Card>
    </Link>
  );
}

export function PatentCardSkeleton() {
  return (
    <Card className="h-full gap-0 border-border/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-5 w-12 animate-pulse rounded-full bg-accent" />
        <div className="h-3 w-20 animate-pulse rounded bg-accent" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-accent" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-accent" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-accent/70" />
        <div className="h-3 w-full animate-pulse rounded bg-accent/70" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-accent/70" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="h-4 w-16 animate-pulse rounded bg-accent/60" />
        <div className="h-4 w-24 animate-pulse rounded bg-accent/60" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="space-y-1.5">
          <div className="h-3 w-12 animate-pulse rounded bg-accent" />
          <div className="h-3 w-20 animate-pulse rounded bg-accent/60" />
        </div>
        <div className="h-16 w-16 animate-pulse rounded-full bg-accent" />
      </div>
    </Card>
  );
}
