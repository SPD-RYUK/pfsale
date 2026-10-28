// Admin dashboard — summary stats + recent activity.
// Server component. Fetches counts directly from the DB (the middleware has
// already verified the session by the time this renders).
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { formatRelative, scoreLabel } from "@/lib/format";

const STATUS_TONE: Record<string, string> = {
  new: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  contacted: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  converted: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  archived: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
  closed: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
};

export default async function AdminDashboardPage() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    newLeads,
    publishedPatents,
    totalPatents,
    newInquiries,
    visits7d,
    recentLeads,
    recentInquiries,
    recentPatents,
  ] = await Promise.all([
    db.lead.count({ where: { status: "new" } }),
    db.patent.count({ where: { published: true } }),
    db.patent.count(),
    db.buyerInquiry.count({ where: { status: "new" } }),
    db.analyticsEvent.count({ where: { eventType: "page_view", createdAt: { gte: since7d } } }),
    db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.buyerInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { patent: { select: { title: true, patentNumber: true } } },
    }),
    db.patent.findMany({ orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, patentNumber: true, jurisdiction: true, published: true, readinessScore: true, updatedAt: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New leads"
          value={newLeads}
          hint="Status: new"
          iconName="users"
          accent="emerald"
        />
        <StatCard
          label="Patents published"
          value={`${publishedPatents} / ${totalPatents}`}
          hint={`${totalPatents - publishedPatents} draft`}
          iconName="file"
          accent="teal"
        />
        <StatCard
          label="New inquiries"
          value={newInquiries}
          hint="Status: new"
          iconName="message"
          accent="amber"
        />
        <StatCard
          label="Visits (7d)"
          value={visits7d}
          hint="page_view events"
          iconName="activity"
          accent="sky"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent leads</CardTitle>
              <CardDescription>Latest seller interest submissions</CardDescription>
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
              <p className="text-sm text-muted-foreground py-6 text-center">No leads yet.</p>
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
                      <Badge variant="outline" className={STATUS_TONE[l.status] || ""}>
                        {l.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatRelative(l.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent inquiries</CardTitle>
              <CardDescription>Latest buyer "Express Interest" submissions</CardDescription>
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
              <p className="text-sm text-muted-foreground py-6 text-center">No inquiries yet.</p>
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
                      <Badge variant="outline" className={STATUS_TONE[i.status] || ""}>
                        {i.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatRelative(i.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recently updated patents</CardTitle>
            <CardDescription>Drafts and published listings</CardDescription>
          </div>
          <Link
            href="/admin/patents"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            View all <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {recentPatents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No patents yet.</p>
          ) : (
            <ul className="divide-y">
              {recentPatents.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/patents/${p.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 hover:bg-accent/40 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.patentNumber} · {p.jurisdiction}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={p.published ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : ""}>
                        {p.published ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {p.readinessScore != null ? `${p.readinessScore} · ${scoreLabel(p.readinessScore)}` : "Unrated"}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatRelative(p.updatedAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
