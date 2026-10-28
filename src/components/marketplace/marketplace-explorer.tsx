"use client";
// MarketplaceExplorer — the interactive heart of the public marketplace.
// Mobile-first: filters collapse into a Sheet drawer on mobile, sticky sidebar on md+.
// State synced to the URL (router.push + useSearchParams) so filters are shareable.
// Skeleton loading states (NOT blank spinners), intentional empty state with a
// "Request a patent assessment" CTA that opens the lead modal, and a friendly
// error state with retry.
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, SlidersHorizontal, X, RotateCcw, ChevronLeft, ChevronRight,
  Inbox, AlertTriangle, MessageSquarePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLeadModal } from "@/components/site/lead-modal";
import { PatentCard, PatentCardSkeleton, type PatentCardItem } from "./patent-card";
import { cn } from "@/lib/utils";
import { STAGES, stageLabel } from "@/lib/stages";

export interface Facets {
  fieldOfUse: string[];
  jurisdiction: string[];
  legalStatus: string[];
  stage: string[];
}

export interface MarketplaceFilters {
  q: string;
  fieldOfUse: string[];
  jurisdiction: string[];
  legalStatus: string[];
  stage: string[];
  scoreMin: number;
  scoreMax: number;
  filingFrom: string;
  filingTo: string;
  grantFrom: string;
  grantTo: string;
  sort: "recent" | "score" | "filing" | "grant";
  page: number;
  pageSize: number;
}

export interface APIResponse {
  items: PatentCardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: Facets;
}

const DEFAULT_FILTERS: MarketplaceFilters = {
  q: "",
  fieldOfUse: [],
  jurisdiction: [],
  legalStatus: [],
  stage: [],
  scoreMin: 0,
  scoreMax: 100,
  filingFrom: "",
  filingTo: "",
  grantFrom: "",
  grantTo: "",
  sort: "recent",
  page: 1,
  pageSize: 12,
};

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "score", label: "Highest score" },
  { value: "filing", label: "Filing date" },
  { value: "grant", label: "Grant date" },
] as const;

function filtersToSearchParams(f: MarketplaceFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  f.fieldOfUse.forEach((v) => sp.append("fieldOfUse", v));
  f.jurisdiction.forEach((v) => sp.append("jurisdiction", v));
  f.legalStatus.forEach((v) => sp.append("legalStatus", v));
  f.stage.forEach((v) => sp.append("stage", v));
  if (f.scoreMin > 0) sp.set("scoreMin", String(f.scoreMin));
  if (f.scoreMax < 100) sp.set("scoreMax", String(f.scoreMax));
  if (f.filingFrom) sp.set("filingFrom", f.filingFrom);
  if (f.filingTo) sp.set("filingTo", f.filingTo);
  if (f.grantFrom) sp.set("grantFrom", f.grantFrom);
  if (f.grantTo) sp.set("grantTo", f.grantTo);
  if (f.sort !== "recent") sp.set("sort", f.sort);
  if (f.page > 1) sp.set("page", String(f.page));
  return sp;
}

function isDefault(f: MarketplaceFilters): boolean {
  return (
    !f.q &&
    f.fieldOfUse.length === 0 &&
    f.jurisdiction.length === 0 &&
    f.legalStatus.length === 0 &&
    f.stage.length === 0 &&
    f.scoreMin === 0 &&
    f.scoreMax === 100 &&
    !f.filingFrom && !f.filingTo && !f.grantFrom && !f.grantTo &&
    f.sort === "recent"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter panel — shared between desktop sidebar and mobile Sheet.
// ─────────────────────────────────────────────────────────────────────────────
function FilterPanel({
  filters, setFilters, facets,
}: {
  filters: MarketplaceFilters;
  setFilters: (updater: (prev: MarketplaceFilters) => MarketplaceFilters) => void;
  facets: Facets;
}) {
  const toggle = (key: "fieldOfUse" | "jurisdiction" | "legalStatus" | "stage", value: string) => {
    setFilters((prev) => {
      const arr = prev[key];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next, page: 1 };
    });
  };

  return (
    <div className="space-y-6">
      {/* Field of use */}
      <FilterSection title="Field of use">
        {facets.fieldOfUse.length === 0 ? (
          <p className="text-xs text-muted-foreground">No fields available.</p>
        ) : (
          <div className="space-y-2">
            {facets.fieldOfUse.map((f) => (
              <FilterCheckbox
                key={f}
                label={f}
                checked={filters.fieldOfUse.includes(f)}
                onChange={() => toggle("fieldOfUse", f)}
                id={`fou-${f}`}
              />
            ))}
          </div>
        )}
      </FilterSection>

      <Separator />

      {/* Jurisdiction */}
      <FilterSection title="Jurisdiction">
        {facets.jurisdiction.length === 0 ? (
          <p className="text-xs text-muted-foreground">No jurisdictions available.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {facets.jurisdiction.map((j) => (
              <FilterCheckbox
                key={j}
                label={j}
                checked={filters.jurisdiction.includes(j)}
                onChange={() => toggle("jurisdiction", j)}
                id={`jur-${j}`}
              />
            ))}
          </div>
        )}
      </FilterSection>

      <Separator />

      {/* Legal status */}
      <FilterSection title="Legal status">
        {facets.legalStatus.length === 0 ? (
          <p className="text-xs text-muted-foreground">No statuses available.</p>
        ) : (
          <div className="space-y-2">
            {facets.legalStatus.map((s) => (
              <FilterCheckbox
                key={s}
                label={s}
                checked={filters.legalStatus.includes(s)}
                onChange={() => toggle("legalStatus", s)}
                id={`ls-${s}`}
              />
            ))}
          </div>
        )}
      </FilterSection>

      <Separator />

      {/* Stage */}
      <FilterSection title="Stage">
        <div className="space-y-2">
          {STAGES.map((s) => (
            <FilterCheckbox
              key={s.value}
              label={s.label}
              checked={filters.stage.includes(s.value)}
              onChange={() => toggle("stage", s.value)}
              id={`stage-${s.value}`}
            />
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Score range */}
      <FilterSection title="Readiness score">
        <div className="px-1">
          <Slider
            min={0}
            max={100}
            step={5}
            value={[filters.scoreMin, filters.scoreMax]}
            onValueChange={(v) =>
              setFilters((prev) => ({ ...prev, scoreMin: v[0] ?? 0, scoreMax: v[1] ?? 100, page: 1 }))
            }
            className="mt-3"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Min <span className="font-semibold text-foreground">{filters.scoreMin}</span></span>
            <span>Max <span className="font-semibold text-foreground">{filters.scoreMax}</span></span>
          </div>
        </div>
      </FilterSection>

      <Separator />

      {/* Grant date range */}
      <FilterSection title="Grant date range">
        <div className="space-y-2">
          <div>
            <Label htmlFor="grantFrom" className="text-[11px] text-muted-foreground">From</Label>
            <Input
              id="grantFrom"
              type="date"
              value={filters.grantFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, grantFrom: e.target.value, page: 1 }))}
              className="mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="grantTo" className="text-[11px] text-muted-foreground">To</Label>
            <Input
              id="grantTo"
              type="date"
              value={filters.grantTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, grantTo: e.target.value, page: 1 }))}
              className="mt-1 h-8 text-xs"
            />
          </div>
        </div>
      </FilterSection>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">{title}</h3>
      {children}
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange, id }: { label: string; checked: boolean; onChange: () => void; id: string }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="cursor-pointer text-sm capitalize text-foreground/90">
        {label}
      </Label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty / Error / Loading states
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ onClear, onLead }: { onClear: () => void; onLead: () => void }) {
  return (
    <Card className="border-dashed border-border/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No patents found in this field yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        We couldn&apos;t match any listings to your filters — but new patents are listed every week.
        If you have a granted patent you&apos;d like to monetize, our team can help you publish a
        storefront listing.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Button onClick={onLead} className="gap-1.5">
          <MessageSquarePlus className="h-4 w-4" />
          Request a patent assessment
        </Button>
        <Button variant="outline" onClick={onClear} className="gap-1.5">
          <RotateCcw className="h-4 w-4" />
          Clear filters
        </Button>
      </div>
    </Card>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/30 border-dashed p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Something went wrong</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        We couldn&apos;t load the marketplace right now. Please check your connection and try again.
      </p>
      <div className="mt-6">
        <Button onClick={onRetry} className="gap-1.5">
          <RotateCcw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    </Card>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <PatentCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function MarketplaceExplorer({
  initialItems,
  initialTotal,
  facets,
  initialFilters,
  initialPage,
  initialTotalPages,
}: {
  initialItems: PatentCardItem[];
  initialTotal: number;
  facets: Facets;
  initialFilters: MarketplaceFilters;
  initialPage: number;
  initialTotalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadModal = useLeadModal();

  const [filters, setFiltersState] = React.useState<MarketplaceFilters>({
    ...initialFilters,
    page: initialPage,
  });
  const [items, setItems] = React.useState<PatentCardItem[]>(initialItems);
  const [total, setTotal] = React.useState<number>(initialTotal);
  const [totalPages, setTotalPages] = React.useState<number>(initialTotalPages);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<boolean>(false);
  const [sheetOpen, setSheetOpen] = React.useState<boolean>(false);
  // Track the last searchParams string so we know whether the URL was
  // changed externally (e.g. back/forward) and we need to resync state.
  const lastSpRef = React.useRef<string>(searchParams.toString());

  const setFilters = React.useCallback(
    (updater: (prev: MarketplaceFilters) => MarketplaceFilters) => {
      setFiltersState((prev) => updater(prev));
    },
    []
  );

  // Sync URL when filters change (shareable/bookmarkable).
  React.useEffect(() => {
    const sp = filtersToSearchParams(filters);
    const spStr = sp.toString();
    if (spStr === lastSpRef.current) return;
    lastSpRef.current = spStr;
    const qs = spStr ? `?${spStr}` : "";
    router.replace(`/patents${qs}`, { scroll: false });
  }, [filters, router]);

  // Resync state when URL changes externally (back/forward nav).
  React.useEffect(() => {
    const spStr = searchParams.toString();
    if (spStr === lastSpRef.current) return;
    lastSpRef.current = spStr;
    // Rebuild filters from URL.
    const sp = searchParams;
    const next: MarketplaceFilters = {
      ...DEFAULT_FILTERS,
      q: sp.get("q") || "",
      fieldOfUse: sp.getAll("fieldOfUse").filter(Boolean),
      jurisdiction: sp.getAll("jurisdiction").filter(Boolean),
      legalStatus: sp.getAll("legalStatus").filter(Boolean),
      stage: sp.getAll("stage").filter(Boolean),
      scoreMin: sp.get("scoreMin") ? Number(sp.get("scoreMin")) : 0,
      scoreMax: sp.get("scoreMax") ? Number(sp.get("scoreMax")) : 100,
      filingFrom: sp.get("filingFrom") || "",
      filingTo: sp.get("filingTo") || "",
      grantFrom: sp.get("grantFrom") || "",
      grantTo: sp.get("grantTo") || "",
      sort: (sp.get("sort") as MarketplaceFilters["sort"]) || "recent",
      page: sp.get("page") ? Number(sp.get("page")) : 1,
    };
    setFiltersState(next);
  }, [searchParams]);

  // Fetch on filter change. We debounce the query specifically.
  React.useEffect(() => {
    let cancelled = false;
    const sp = filtersToSearchParams(filters);
    setLoading(true);
    setError(false);

    const run = async () => {
      try {
        const res = await fetch(`/api/patents?${sp.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: APIResponse = await res.json();
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (e) {
        if (cancelled) return;
        console.error("MarketplaceExplorer fetch error:", e);
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Debounce 250ms to coalesce rapid filter changes (esp. typing + slider).
    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [filters]);

  const clearFilters = () => setFiltersState({ ...DEFAULT_FILTERS });

  const onPageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const activeFilterCount =
    filters.fieldOfUse.length +
    filters.jurisdiction.length +
    filters.legalStatus.length +
    filters.stage.length +
    (filters.scoreMin > 0 || filters.scoreMax < 100 ? 1 : 0) +
    (filters.grantFrom || filters.grantTo ? 1 : 0);

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr] lg:gap-8">
      {/* Desktop sticky sidebar */}
      <aside className="hidden md:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Filters</h2>
            {!isDefault(filters) ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> Clear
              </Button>
            ) : null}
          </div>
          <Card className="border-border/60 p-4">
            <FilterPanel filters={filters} setFilters={setFilters} facets={facets} />
          </Card>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0">
        {/* Search + sort row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patents, inventors, fields…"
              value={filters.q}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }));
              }}
              className="h-10 pl-9 pr-9"
              aria-label="Search patents"
            />
            {filters.q ? (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, q: "", page: 1 }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile filters trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-1.5 md:hidden" size="default">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 ? (
                    <Badge variant="default" className="ml-1 h-5 min-w-5 justify-center px-1.5 text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[85%] max-w-sm flex-col gap-0 p-0">
                <SheetHeader className="border-b">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Narrow the marketplace by field, jurisdiction, score, and date.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <FilterPanel filters={filters} setFilters={setFilters} facets={facets} />
                  </div>
                </ScrollArea>
                <div className="flex items-center justify-between gap-2 border-t p-4">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
                    <RotateCcw className="h-3 w-3" /> Clear all
                  </Button>
                  <SheetClose asChild>
                    <Button size="sm">Show {total} results</Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort dropdown */}
            <Select
              value={filters.sort}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, sort: v as MarketplaceFilters["sort"], page: 1 }))}
            >
              <SelectTrigger className="h-10 w-[160px] sm:w-[180px]" aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter chips + clear */}
        {activeFilterCount > 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Active:</span>
            {[
              ...filters.fieldOfUse.map((v) => ({ k: "fieldOfUse" as const, v })),
              ...filters.jurisdiction.map((v) => ({ k: "jurisdiction" as const, v })),
              ...filters.legalStatus.map((v) => ({ k: "legalStatus" as const, v })),
            ].map(({ k, v }) => (
              <Badge key={`${k}-${v}`} variant="secondary" className="gap-1 capitalize">
                {v}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, [k]: prev[k].filter((x) => x !== v), page: 1 }))
                  }
                  className="rounded-sm p-0.5 hover:bg-accent"
                  aria-label={`Remove ${v}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.stage.map((v) => (
              <Badge key={`stage-${v}`} variant="secondary" className="gap-1">
                {stageLabel(v)}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, stage: prev.stage.filter((x) => x !== v), page: 1 }))
                  }
                  className="rounded-sm p-0.5 hover:bg-accent"
                  aria-label={`Remove ${stageLabel(v)} stage`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {(filters.scoreMin > 0 || filters.scoreMax < 100) ? (
              <Badge variant="secondary" className="gap-1">
                Score {filters.scoreMin}–{filters.scoreMax}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, scoreMin: 0, scoreMax: 100, page: 1 }))}
                  className="rounded-sm p-0.5 hover:bg-accent"
                  aria-label="Clear score range"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null}
            {(filters.grantFrom || filters.grantTo) ? (
              <Badge variant="secondary" className="gap-1">
                Grant {filters.grantFrom || "…"} → {filters.grantTo || "…"}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, grantFrom: "", grantTo: "", page: 1 }))}
                  className="rounded-sm p-0.5 hover:bg-accent"
                  aria-label="Clear grant range"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Clear all
            </Button>
          </div>
        ) : null}

        {/* Result count */}
        <div className="mb-4 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
              </span>
            ) : (
              <>
                <span className="font-semibold text-foreground">{total}</span>
                {total === 1 ? " patent" : " patents"}
                {filters.q ? <> for &ldquo;{filters.q}&rdquo;</> : null}
              </>
            )}
          </p>
        </div>

        {/* Results / states */}
        {error ? (
          <ErrorState onRetry={() => setFilters((prev) => ({ ...prev }))} />
        ) : loading ? (
          <LoadingGrid />
        ) : items.length === 0 ? (
          <EmptyState onClear={clearFilters} onLead={() => leadModal.open()} />
        ) : (
          <>
            <div
              className={cn(
                "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
              )}
            >
              {items.map((p) => (
                <PatentCard key={p.id} patent={p} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 ? (
              <div className="mt-10 flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                  onClick={() => onPageChange(filters.page - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                {buildPageList(filters.page, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`e-${i}`} className="px-2 text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === filters.page ? "default" : "outline"}
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => onPageChange(p)}
                      aria-current={p === filters.page ? "page" : undefined}
                    >
                      {p}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= totalPages}
                  onClick={() => onPageChange(filters.page + 1)}
                  className="gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

// Build a compact page list with ellipses around the active page.
function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}
