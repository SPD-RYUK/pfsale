"use client";
// AnalyticsDashboard — visits over time (LineChart), top 5 most-viewed listings,
// and dual conversion funnels (visits → listing_views → request_now_opened →
// lead_submitted, and visits → listing_views → express_interest_opened →
// buyer_inquiry_submitted). Uses the emerald/teal chart palette.
import * as React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface VisitsPoint { date: string; count: number; }
interface TopListing { patentId: string; title: string; views: number; }
interface Funnel {
  visits: number;
  listingViews: number;
  requestNowOpened: number;
  leadSubmitted: number;
  expressInterestOpened: number;
  buyerInquirySubmitted: number;
}
interface AnalyticsPayload {
  days: number;
  visitsOverTime: VisitsPoint[];
  topListings: TopListing[];
  funnel: Funnel;
}

const RANGES = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

const PALETTE = [
  "#10b981", // emerald-500
  "#14b8a6", // teal-500
  "#0ea5e9", // sky-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
];

function formatDay(d: string): string {
  const date = new Date(d + "T00:00:00Z");
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">{value.toLocaleString()} <span className="text-muted-foreground">({pct}%)</span></span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [days, setDays] = React.useState(30);
  const [data, setData] = React.useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d: AnalyticsPayload) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [days]);

  const chartData = (data?.visitsOverTime || []).map((p) => ({ ...p, label: formatDay(p.date) }));
  const topListings = data?.topListings || [];
  const funnel = data?.funnel || { visits: 0, listingViews: 0, requestNowOpened: 0, leadSubmitted: 0, expressInterestOpened: 0, buyerInquirySubmitted: 0 };
  const maxFunnel = Math.max(funnel.visits, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.value}
            variant={days === r.value ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visits over time</CardTitle>
          <CardDescription>page_view events, last {days} days</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No visit data yet.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    interval={days > 30 ? Math.floor(chartData.length / 8) : 0}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={PALETTE[0]}
                    strokeWidth={2}
                    dot={false}
                    name="Visits"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top listings</CardTitle>
            <CardDescription>Most-viewed patents in the window</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : topListings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No listing views recorded yet.</p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topListings}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
                    <YAxis
                      type="category"
                      dataKey="title"
                      tick={{ fontSize: 11 }}
                      width={140}
                      className="text-muted-foreground"
                      tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 22) + "…" : v}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                      {topListings.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {topListings.length > 0 ? (
              <ul className="mt-4 space-y-1">
                {topListings.map((l, i) => (
                  <li key={l.patentId} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                      <Link href={`/admin/patents/${l.patentId}`} className="text-foreground hover:underline truncate">{l.title}</Link>
                    </span>
                    <Badge variant="outline" className="tabular-nums">{l.views} views</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion funnels</CardTitle>
            <CardDescription>Visits → listing views → action → submission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Seller funnel
                  </p>
                  <FunnelBar label="Visits (page_view)" value={funnel.visits} max={maxFunnel} color={PALETTE[0]} />
                  <FunnelBar label="Listing views" value={funnel.listingViews} max={maxFunnel} color={PALETTE[1]} />
                  <FunnelBar label="Request Now opened" value={funnel.requestNowOpened} max={maxFunnel} color={PALETTE[2]} />
                  <FunnelBar label="Lead submitted" value={funnel.leadSubmitted} max={maxFunnel} color={PALETTE[3]} />
                </div>
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Buyer funnel
                  </p>
                  <FunnelBar label="Visits (page_view)" value={funnel.visits} max={maxFunnel} color={PALETTE[0]} />
                  <FunnelBar label="Listing views" value={funnel.listingViews} max={maxFunnel} color={PALETTE[1]} />
                  <FunnelBar label="Express Interest opened" value={funnel.expressInterestOpened} max={maxFunnel} color={PALETTE[2]} />
                  <FunnelBar label="Buyer inquiry submitted" value={funnel.buyerInquirySubmitted} max={maxFunnel} color={PALETTE[4]} />
                </div>
                <div className="pt-2 border-t grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Visit → lead</div>
                    <div className="font-semibold tabular-nums">
                      {funnel.visits > 0 ? ((funnel.leadSubmitted / funnel.visits) * 100).toFixed(2) : "0.00"}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Visit → inquiry</div>
                    <div className="font-semibold tabular-nums">
                      {funnel.visits > 0 ? ((funnel.buyerInquirySubmitted / funnel.visits) * 100).toFixed(2) : "0.00"}%
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
