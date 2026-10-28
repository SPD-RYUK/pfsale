"use client";
// PatentForm — the centerpiece of the admin panel. Create + edit a full patent
// record (identity, bibliographic, AI summaries, readiness score, publishing,
// record lock). All readiness-score input parameters are OPTIONAL — the admin
// is never blocked from saving or publishing because of a missing field.
//
// Save flows:
//   - New record: POST /api/admin/patents. On 409 (UNIQUE conflict) show a
//     friendly "This patent is already listed in this jurisdiction" message.
//     On success, redirect to /admin/patents/[id].
//   - Existing record: PATCH /api/admin/patents/[id]. On 409 same friendly error.
//   - "Save & Publish": same calls with published=true.
//   - "Generate with AI": POST /api/admin/patents/[id]/ai-summary (only when
//     editing an existing record — disabled for brand-new records).
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Save,
  Send,
  Sparkles,
  Loader2,
  ExternalLink,
  Lock,
  LockOpen,
  Info,
  Star,
  Search,
} from "lucide-react";
import type { Patent } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { scoreColor, scoreLabel } from "@/lib/format";
import { STAGES, stageBadgeClass, stageLabel, type PatentStage } from "@/lib/stages";

const JURISDICTIONS = ["US", "EP", "IN", "WO", "JP", "KR", "CN", "DE", "GB", "FR", "CA", "AU", "Other"];
const LEGAL_STATUSES = [
  { value: "granted", label: "Granted" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "lapsed", label: "Lapsed" },
];
const FIELD_SUGGESTIONS = [
  "Telecommunications",
  "Biotech / Pharmaceuticals",
  "Software / AI",
  "Semiconductors",
  "Automotive",
  "Energy",
  "Medical Devices",
  "Consumer Electronics",
  "Finance / Fintech",
  "Aerospace",
  "Materials",
  "Agriculture",
];
const CLAIM_BREADTH = [
  { value: "narrow", label: "Narrow" },
  { value: "medium", label: "Medium" },
  { value: "broad", label: "Broad" },
];
const MARKET_SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "very-large", label: "Very large" },
];
const LITIGATION = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function inventorsToString(p: Patent | null): string {
  if (!p?.inventors) return "";
  try {
    const v = JSON.parse(p.inventors);
    return Array.isArray(v) ? v.join(", ") : p.inventors;
  } catch {
    return p.inventors;
  }
}

export interface PatentFormProps {
  patent: Patent | null;
  leadId?: string | null;
}

export function PatentForm({ patent, leadId }: PatentFormProps) {
  const router = useRouter();
  const isEdit = !!patent;

  const [form, setForm] = React.useState({
    patentNumber: patent?.patentNumber || "",
    jurisdiction: patent?.jurisdiction || "US",
    applicationNumber: patent?.applicationNumber || "",
    title: patent?.title || "",
    abstract: patent?.abstract || "",
    claims: patent?.claims || "",
    description: patent?.description || "",
    fieldOfUse: patent?.fieldOfUse || "",
    inventors: inventorsToString(patent),
    assignee: patent?.assignee || "",
    filingDate: toDateInput(patent?.filingDate),
    grantDate: toDateInput(patent?.grantDate),
    legalStatus: patent?.legalStatus || "",
    patentFamilySize: patent?.patentFamilySize?.toString() || "",
    summaryAbstract: patent?.summaryAbstract || "",
    summaryClaims: patent?.summaryClaims || "",
    summaryField: patent?.summaryField || "",
    readinessScore: patent?.readinessScore?.toString() || "",
    scoreNotes: patent?.scoreNotes || "",
    claimBreadth: patent?.claimBreadth || "",
    remainingLifeYears: patent?.remainingLifeYears?.toString() || "",
    forwardCitations: patent?.forwardCitations?.toString() || "",
    marketSizeProxy: patent?.marketSizeProxy || "",
    litigationHistory: patent?.litigationHistory || "",
    published: patent?.published ?? false,
    recordLocked: patent?.recordLocked ?? false,
    stage: (patent?.stage as PatentStage | null | undefined) || "",
    featured: patent?.featured ?? false,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState<null | "draft" | "publish">(null);
  const [generating, setGenerating] = React.useState(false);
  const [conflictMsg, setConflictMsg] = React.useState<string | null>(null);
  const [autoPopulateNo, setAutoPopulateNo] = React.useState("");
  const [autoLoading, setAutoLoading] = React.useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
    setConflictMsg(null);
  }

  async function autoPopulate() {
    const pn = autoPopulateNo.trim().toUpperCase();
    if (!pn) {
      toast.error("Enter a patent number first");
      return;
    }
    setAutoLoading(true);
    try {
      const res = await fetch("/api/admin/patents/autopopulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patentNumber: pn }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to fetch patent data");
        return;
      }
      // Fill the form with fetched data
      setForm((f) => ({
        ...f,
        patentNumber: data.patentNumber || pn,
        jurisdiction: data.jurisdiction || f.jurisdiction,
        applicationNumber: data.applicationNumber || "",
        title: data.title || "",
        abstract: data.abstract || "",
        claims: data.claims || "",
        description: data.description || "",
        inventors: Array.isArray(data.inventors) ? data.inventors.join(", ") : "",
        assignee: data.assignee || "",
        filingDate: data.filingDate ? data.filingDate.slice(0, 10) : "",
        grantDate: data.grantDate ? data.grantDate.slice(0, 10) : "",
        legalStatus: data.legalStatus || "",
      }));
      setAutoPopulateNo("");
      toast.success(`Auto-populated from Google Patents: ${data.title?.slice(0, 40) || pn}`);
    } catch (e) {
      toast.error("Failed to fetch — check the patent number and try again");
    } finally {
      setAutoLoading(false);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.patentNumber.trim()) e.patentNumber = "Patent number is required";
    if (!form.jurisdiction.trim()) e.jurisdiction = "Jurisdiction is required";
    if (!form.title.trim()) e.title = "Title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildPayload(published: boolean) {
    return {
      patentNumber: form.patentNumber.trim(),
      jurisdiction: form.jurisdiction.trim(),
      applicationNumber: form.applicationNumber.trim() || null,
      title: form.title.trim(),
      abstract: form.abstract.trim() || null,
      claims: form.claims.trim() || null,
      description: form.description.trim() || null,
      fieldOfUse: form.fieldOfUse.trim() || null,
      inventors: form.inventors
        ? form.inventors.split(/[;,]/).map((s) => s.trim()).filter(Boolean)
        : null,
      assignee: form.assignee.trim() || null,
      filingDate: form.filingDate || null,
      grantDate: form.grantDate || null,
      legalStatus: form.legalStatus || null,
      patentFamilySize: form.patentFamilySize ? Number(form.patentFamilySize) : null,
      summaryAbstract: form.summaryAbstract.trim() || null,
      summaryClaims: form.summaryClaims.trim() || null,
      summaryField: form.summaryField.trim() || null,
      readinessScore: form.readinessScore ? Number(form.readinessScore) : null,
      scoreNotes: form.scoreNotes.trim() || null,
      claimBreadth: form.claimBreadth || null,
      remainingLifeYears: form.remainingLifeYears ? Number(form.remainingLifeYears) : null,
      forwardCitations: form.forwardCitations ? Number(form.forwardCitations) : null,
      marketSizeProxy: form.marketSizeProxy || null,
      litigationHistory: form.litigationHistory || null,
      recordLocked: form.recordLocked,
      published,
      stage: form.stage || null,
      featured: form.featured,
      leadId: leadId && !isEdit ? leadId : undefined,
    };
  }

  async function handleSubmit(publish: boolean) {
    if (!validate()) {
      toast.error("Please fill in the required fields");
      return;
    }
    setSaving(publish ? "publish" : "draft");
    setConflictMsg(null);
    try {
      const payload = buildPayload(publish);
      const url = isEdit ? `/api/admin/patents/${patent!.id}` : "/api/admin/patents";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setConflictMsg(data.error || "This patent is already listed in this jurisdiction.");
        toast.error("This patent is already listed in this jurisdiction.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      const saved = await res.json();
      toast.success(publish ? "Saved and published" : "Saved");
      if (!isEdit) {
        router.push(`/admin/patents/${saved.id}`);
        router.refresh();
      } else {
        // Update local form state from the saved record.
        setForm((f) => ({
          ...f,
          published: saved.published ?? f.published,
          recordLocked: saved.recordLocked ?? f.recordLocked,
          stage: (saved.stage as PatentStage | null) ?? f.stage,
          featured: saved.featured ?? f.featured,
        }));
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  async function togglePublish(next: boolean) {
    if (!isEdit) {
      set("published", next);
      return;
    }
    try {
      const res = await fetch(`/api/admin/patents/${patent!.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      set("published", next);
      toast.success(next ? "Published to marketplace" : "Unpublished (draft)");
    } catch (e) {
      toast.error("Failed to toggle publish");
    }
  }

  async function generateAi() {
    if (!isEdit) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/patents/${patent!.id}/ai-summary`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "AI generation failed");
      }
      const out = await res.json();
      setForm((f) => ({
        ...f,
        summaryAbstract: out.summaryAbstract || f.summaryAbstract,
        summaryClaims: out.summaryClaims || f.summaryClaims,
        summaryField: out.summaryField || f.summaryField,
      }));
      toast.success("AI summaries generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const scoreNum = form.readinessScore ? Number(form.readinessScore) : null;
  const scoreColorClass = scoreColor(scoreNum);

  return (
    <div className="space-y-6">
      {/* Top actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/patents">← Back to patents</Link>
        </Button>
        {isEdit && form.published ? (
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/patents/${patent!.id}`} target="_blank">
              <ExternalLink className="size-3.5" /> View public page
            </Link>
          </Button>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={saving !== null}
            className="gap-1.5"
          >
            {saving === "draft" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={saving !== null}
            className="gap-1.5"
          >
            {saving === "publish" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Save &amp; Publish
          </Button>
        </div>
      </div>

      {conflictMsg ? (
        <div className="rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700/40 p-3 text-sm text-amber-800 dark:text-amber-200">
          {conflictMsg}{" "}
          <span className="text-xs">
            (A patent with the same number + jurisdiction already exists.)
          </span>
        </div>
      ) : null}

      {/* Auto-populate from Google Patents */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="size-4 text-primary" />
            Auto-populate from patent number
          </CardTitle>
          <CardDescription>
            Enter any patent number (e.g. US10022792B2, IN201621019586A, WO2020065659A1) — fetches full bibliographic data from Google Patents (free, no key). Fills title, abstract, claims, description, inventors, assignee, dates, and application number automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={autoPopulateNo}
              onChange={(e) => setAutoPopulateNo(e.target.value)}
              placeholder="e.g. US10022792B2"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); autoPopulate(); } }}
              className="flex-1"
            />
            <Button
              onClick={autoPopulate}
              disabled={autoLoading}
              className="gap-1.5"
            >
              {autoLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {autoLoading ? "Fetching…" : "Fetch & auto-fill"}
            </Button>
          </div>
          {autoLoading ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Fetching from patents.google.com… (takes 2–5 seconds)
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Identity</CardTitle>
              <CardDescription>Required: patent number, jurisdiction, and title.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="patentNumber">Patent number *</Label>
                <Input
                  id="patentNumber"
                  value={form.patentNumber}
                  onChange={(e) => set("patentNumber", e.target.value)}
                  placeholder="e.g. US11234567B2"
                />
                {errors.patentNumber ? <p className="text-xs text-destructive">{errors.patentNumber}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                <Select value={form.jurisdiction} onValueChange={(v) => set("jurisdiction", v)}>
                  <SelectTrigger id="jurisdiction" className="w-full">
                    <SelectValue placeholder="Select jurisdiction" />
                  </SelectTrigger>
                  <SelectContent>
                    {JURISDICTIONS.map((j) => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jurisdiction ? <p className="text-xs text-destructive">{errors.jurisdiction}</p> : null}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Concise descriptive title"
                />
                {errors.title ? <p className="text-xs text-destructive">{errors.title}</p> : null}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="applicationNumber">Application number</Label>
                <Input
                  id="applicationNumber"
                  value={form.applicationNumber}
                  onChange={(e) => set("applicationNumber", e.target.value)}
                  placeholder="e.g. 17/123,456 (optional)"
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Bibliographic */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Bibliographic record</CardTitle>
              <CardDescription>All fields optional but recommended for buyer evaluation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="abstract">Abstract</Label>
                <Textarea
                  id="abstract"
                  value={form.abstract}
                  onChange={(e) => set("abstract", e.target.value)}
                  placeholder="Paste the patent abstract"
                  className="min-h-24"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="claims">Claims</Label>
                <Textarea
                  id="claims"
                  value={form.claims}
                  onChange={(e) => set("claims", e.target.value)}
                  placeholder="Paste the claims text"
                  className="min-h-32 font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Optional detailed description"
                  className="min-h-32 text-xs"
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fieldOfUse">Field of use</Label>
                  <Input
                    id="fieldOfUse"
                    value={form.fieldOfUse}
                    onChange={(e) => set("fieldOfUse", e.target.value)}
                    placeholder="e.g. Telecommunications"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {FIELD_SUGGESTIONS.slice(0, 6).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set("fieldOfUse", s)}
                        className="rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inventors">Inventors (comma-separated)</Label>
                  <Input
                    id="inventors"
                    value={form.inventors}
                    onChange={(e) => set("inventors", e.target.value)}
                    placeholder="Jane Doe, John Smith"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="assignee">Assignee / owner</Label>
                  <Input
                    id="assignee"
                    value={form.assignee}
                    onChange={(e) => set("assignee", e.target.value)}
                    placeholder="Current legal owner"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="legalStatus">Legal status</Label>
                  <Select value={form.legalStatus} onValueChange={(v) => set("legalStatus", v)}>
                    <SelectTrigger id="legalStatus" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGAL_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filingDate">Filing date</Label>
                  <Input
                    id="filingDate"
                    type="date"
                    value={form.filingDate}
                    onChange={(e) => set("filingDate", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="grantDate">Grant date</Label>
                  <Input
                    id="grantDate"
                    type="date"
                    value={form.grantDate}
                    onChange={(e) => set("grantDate", e.target.value)}
                  />
                </div>
                {/* Family size disabled for now — keeping field in schema for future use */}
              </div>
            </CardContent>
          </Card>

          {/* 3. AI summaries */}
          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">3. AI section summaries</CardTitle>
                <CardDescription>
                  Plain-English summaries shown on the marketplace card. Editable; click
                  &quot;Generate with AI&quot; to draft from the record above.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={generateAi}
                disabled={!isEdit || generating}
                title={isEdit ? "Generate summaries via AI" : "Save the record first to enable AI generation"}
              >
                {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                Generate with AI
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEdit ? (
                <p className="text-xs text-muted-foreground rounded-md border bg-muted/30 p-3">
                  Save the record first; then return here to trigger AI summary generation.
                </p>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="summaryAbstract">Abstract summary</Label>
                <Textarea
                  id="summaryAbstract"
                  value={form.summaryAbstract}
                  onChange={(e) => set("summaryAbstract", e.target.value)}
                  placeholder="1-2 sentences in plain English on what the patent does"
                  className="min-h-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="summaryClaims">Claims summary</Label>
                <Textarea
                  id="summaryClaims"
                  value={form.summaryClaims}
                  onChange={(e) => set("summaryClaims", e.target.value)}
                  placeholder="The essential protected idea / commercial moat"
                  className="min-h-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="summaryField">Field summary</Label>
                <Textarea
                  id="summaryField"
                  value={form.summaryField}
                  onChange={(e) => set("summaryField", e.target.value)}
                  placeholder="Industries / applications where this could be deployed"
                  className="min-h-20"
                />
              </div>
              {patent?.summaryGeneratedAt ? (
                <p className="text-xs text-muted-foreground">
                  Last AI generation: {new Date(patent.summaryGeneratedAt).toLocaleString()}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Right column: readiness + publishing */}
        <div className="space-y-6">
          {/* 4. Readiness score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">4. Commercial readiness score</CardTitle>
              <CardDescription>
                All parameters below are OPTIONAL. The admin is never blocked from saving
                or publishing because of a missing field.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="readinessScore">Readiness score (0–100)</Label>
                  <span className={`text-sm font-semibold tabular-nums ${scoreColorClass}`}>
                    {scoreNum != null ? `${scoreNum} · ${scoreLabel(scoreNum)}` : "Unrated"}
                  </span>
                </div>
                <Input
                  id="readinessScore"
                  type="number"
                  min="0"
                  max="100"
                  value={form.readinessScore}
                  onChange={(e) => set("readinessScore", e.target.value)}
                  placeholder="e.g. 72"
                />
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={scoreNum != null ? [scoreNum] : [0]}
                  onValueChange={(v) => set("readinessScore", String(v[0] ?? 0))}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="size-3" /> Source:{" "}
                  <Badge variant="outline" className="text-[10px] py-0">manual</Badge>
                  (Phase A — formula deferred to Phase B)
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Optional input parameters
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="claimBreadth" className="text-xs">Claim breadth</Label>
                  <Select value={form.claimBreadth} onValueChange={(v) => set("claimBreadth", v)}>
                    <SelectTrigger id="claimBreadth" className="w-full h-8">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLAIM_BREADTH.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="remainingLifeYears" className="text-xs">Remaining life (years)</Label>
                  <Input
                    id="remainingLifeYears"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.remainingLifeYears}
                    onChange={(e) => set("remainingLifeYears", e.target.value)}
                    placeholder="e.g. 12.5"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="forwardCitations" className="text-xs">Forward citations</Label>
                  <Input
                    id="forwardCitations"
                    type="number"
                    min="0"
                    value={form.forwardCitations}
                    onChange={(e) => set("forwardCitations", e.target.value)}
                    placeholder="e.g. 24"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="marketSizeProxy" className="text-xs">Market size proxy</Label>
                  <Select value={form.marketSizeProxy} onValueChange={(v) => set("marketSizeProxy", v)}>
                    <SelectTrigger id="marketSizeProxy" className="w-full h-8">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKET_SIZES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="litigationHistory" className="text-xs">Litigation history</Label>
                  <Select value={form.litigationHistory} onValueChange={(v) => set("litigationHistory", v)}>
                    <SelectTrigger id="litigationHistory" className="w-full h-8">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      {LITIGATION.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="scoreNotes">Score notes (internal)</Label>
                <Textarea
                  id="scoreNotes"
                  value={form.scoreNotes}
                  onChange={(e) => set("scoreNotes", e.target.value)}
                  placeholder="Rationale for the assigned score"
                  className="min-h-20 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* 5. Publishing & integrity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">5. Publishing &amp; integrity</CardTitle>
              <CardDescription>Control visibility, commercialization stage, and Phase B coexistence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="stage">Commercialization stage</Label>
                <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
                  <SelectTrigger id="stage" className="w-full">
                    <SelectValue placeholder="Not set" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {form.stage ? (
                    <>
                      <Badge variant="outline" className={`mr-1.5 ${stageBadgeClass(form.stage)}`}>
                        {stageLabel(form.stage)}
                      </Badge>
                      {STAGES.find((s) => s.value === form.stage)?.description}
                    </>
                  ) : (
                    "Where the patent sits in the commercialization journey."
                  )}
                </p>
              </div>

              <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    Featured listing
                    {form.featured ? (
                      <Star className="size-3.5 fill-amber-400 text-amber-500" />
                    ) : (
                      <Star className="size-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Curated by admin. Featured listings appear in the home &quot;Featured&quot; section.
                  </p>
                </div>
                <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
              </div>

              <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    Published
                    {form.published ? (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300">Live</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Toggle to make this listing visible on the public marketplace.
                  </p>
                </div>
                <Switch checked={form.published} onCheckedChange={togglePublish} />
              </div>

              <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    Record locked
                    {form.recordLocked ? (
                      <Lock className="size-3.5 text-amber-600" />
                    ) : (
                      <LockOpen className="size-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Prevents Phase B automated fetches from overwriting this record.
                    Admin edits are always allowed.
                  </p>
                </div>
                <Switch checked={form.recordLocked} onCheckedChange={(v) => set("recordLocked", v)} />
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data source</span>
                  <Badge variant="outline" className="font-mono">
                    {isEdit ? (patent!.dataSource || "admin-manual") : "admin-manual"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-muted-foreground">Score source</span>
                  <Badge variant="outline" className="font-mono">
                    {isEdit ? (patent!.scoreSource || "manual") : "manual"}
                  </Badge>
                </div>
                {isEdit && patent!.leadId ? (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-muted-foreground">Originating lead</span>
                    <Link
                      href="/admin/leads"
                      className="text-primary hover:underline font-mono text-[10px]"
                    >
                      {patent!.leadId.slice(0, 8)}…
                    </Link>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
