// Lead Gen overview — the central CRM hub for ALL lead types: seller leads,
// buyer inquiries, and report requests. SERVER COMPONENT: fetches counts +
// recent activity directly from the DB (no client-side API fetch on first paint).
//
// Layout:
//   1. Four KPI stat cards: New leads / Open inquiries / Pending report
//      requests / Conversion rate.
//   2. A 3-column recent-activity grid (latest of each lead type) with status
//      badges, relative timestamps, and "View all" links to the sub-pages.
//   3. A funnel visualization: total leads → contacted → converted with
//      conversion % and stage-drop-off.
//
// Sub-pages (kept as-is, linked from here):
//   - /admin/leads          (seller leads table — LeadsTable)
//   - /admin/inquiries      (buyer inquiries table — InquiriesTable)
//   - /admin/lead-gen/report-requests  (report requests table — new)
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Megaphone, FileBarChart, Mail, Users } from "lucide-react";
import { formatRelative } from "@/lib/format";

const STATUS_TONE: Record<string, string> = {
  new: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  contacted: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  converted: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  closed: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
  archived: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
  report_sent: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
};

// Funnel bar — pure CSS, no chart lib dependency (keeps the lead-gen page light).
function FunnelBar({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {count} <span className="text-muted-foreground/70">· {pct}%</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tone} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{children}</p>;
}

export default async function LeadGenPage() {
  // ─── KPI + funnel counts ────────────────────────────────────────────────────
  // Lead statuses: new | contacted | converted | archived
  // BuyerInquiry statuses: new | contacted | closed
  // ReportRequest statuses: new | contacted | report_sent | converted | archived
  const [
    leadCounts,
    inquiryCounts,
    reportCounts,
    recentLeads,
    recentInquiries,
    recentReports,
  ] = await Promise.all([
    db.lead.groupBy({ by: ["status"], _count: true }),
    db.buyerInquiry.groupBy({ by: ["status"], _count: true }),
    db.reportRequest.groupBy({ by: ["status"], _count: true }),
    db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.buyerInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { patent: { select: { id: true, title: true, patentNumber: true } } },
    }),
    db.reportRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { patent: { select: { id: true, title: true, patentNumber: true } } },
    }),
  ]);

  const countOf = (rows: { status: string; _count: number }[], status: string) =>
    rows.find((r) => r.status === status)?._count ?? 0;

  // ─── Funnel: total leads → contacted → converted ───────────────────────────
  // For the funnel we treat the three lead channels together. "Contacted" and
  // "converted" mean any lead/inquiry/report in those statuses.
  const totalLeads =
    leadCounts.reduce((s, r) => s + r._count, 0) +
    inquiryCounts.reduce((s, r) => s + r._count, 0) +
    reportCounts.reduce((s, r) => s + r._count, 0);

  const contactedLeads =
    countOf(leadCounts, "contacted") +
    countOf(leadCounts, "converted") +
    countOf(inquiryCounts, "contacted") +
    countOf(reportCounts, "contacted") +
    countOf(reportCounts, "report_sent") +
    countOf(reportCounts, "converted");

  const convertedLeads =
    countOf(leadCounts, "converted") +
    countOf(reportCounts, "converted");

  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // New leads (across all three channels) — drives the headline KPI.
  const newLeadsTotal =
    countOf(leadCounts, "new") +
    countOf(inquiryCounts, "new") +
    countOf(reportCounts, "new");

  // Open inquiries = "new" + "contacted" buyer inquiries (still in motion).
  const openInquiries = countOf(inquiryCounts, "new") + countOf(inquiryCounts, "contacted");

  // Pending report requests = not yet archived/closed/converted.
  const pendingReports =
    countOf(reportCounts, "new") +
    countOf(reportCounts, "contacted") +
    countOf(reportCounts, "report_sent");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Megaphone className="size-5 text-primary" /> Lead Gen
          </h2>
          <p className="text-sm text-muted-foreground">
            Unified view of seller leads, buyer inquiries, and report requests.
          </p>
        </div>
        <div className="sm:ml-auto flex flex-wrap gap-2">
          <Link
            href="/admin/lead-gen/report-requests"
            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <FileBarChart className="size-3.5" /> Manage report requests
          </Link>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <Users className="size-3.5" /> Seller leads
          </Link>
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <Mail className="size-3.5" /> Buyer inquiries
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New leads"
          value={newLeadsTotal}
          hint="across all channels"
          iconName="users"
          accent="emerald"
        />
        <StatCard
          label="Open inquiries"
          value={openInquiries}
          hint="new + contacted"
          iconName="message"
          accent="amber"
        />
        <StatCard
          label="Pending reports"
          value={pendingReports}
          hint="awaiting delivery"
          iconName="file"
          accent="teal"
        />
        <StatCard
          label="Conversion rate"
          value={`${conversionRate}%`}
          hint={`${convertedLeads} / ${totalLeads} converted`}
          iconName="trending"
          accent="sky"
        />
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead funnel</CardTitle>
          <CardDescription>
            Pipeline drop-off across all three channels. Bars are proportional to the total lead count.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FunnelBar
            label="Total leads captured"
            count={totalLeads}
            total={totalLeads}
            tone="bg-emerald-500/70"
          />
          <FunnelBar
            label="Contacted / engaged"
            count={contactedLeads}
            total={totalLeads}
            tone="bg-sky-500/70"
          />
          <FunnelBar
            label="Converted"
            count={convertedLeads}
            total={totalLeads}
            tone="bg-violet-500/70"
          />
          {totalLeads === 0 ? (
            <EmptyHint>No leads yet — once seller leads, inquiries, or report requests come in, this funnel fills.</EmptyHint>
          ) : null}
        </CardContent>
      </Card>

      {/* Recent activity — 3 columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Seller leads */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Seller leads</CardTitle>
              <CardDescription>Recent seller interest submissions</CardDescription>
            </div>
            <Link
              href="/admin/leads"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {recentLeads.length === 0 ? (
              <EmptyHint>No seller leads yet.</EmptyHint>
            ) : (
              <ul className="divide-y">
                {recentLeads.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{l.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {l.email}{l.patentNumber ? ` · ${l.patentNumber}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={STATUS_TONE[l.status] || ""}>{l.status}</Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">{formatRelative(l.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Buyer inquiries */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Buyer inquiries</CardTitle>
              <CardDescription>Recent &quot;Express interest&quot; submissions</CardDescription>
            </div>
            <Link
              href="/admin/inquiries"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {recentInquiries.length === 0 ? (
              <EmptyHint>No buyer inquiries yet.</EmptyHint>
            ) : (
              <ul className="divide-y">
                {recentInquiries.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{i.buyerName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {i.patent?.title || "Unknown patent"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={STATUS_TONE[i.status] || ""}>{i.status}</Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">{formatRelative(i.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Report requests */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Report requests</CardTitle>
              <CardDescription>Full-report CTA submissions</CardDescription>
            </div>
            <Link
              href="/admin/lead-gen/report-requests"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {recentReports.length === 0 ? (
              <EmptyHint>No report requests yet.</EmptyHint>
            ) : (
              <ul className="divide-y">
                {recentReports.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.patent?.title || "Unknown patent"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={STATUS_TONE[r.status] || ""}>{r.status}</Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">{formatRelative(r.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
