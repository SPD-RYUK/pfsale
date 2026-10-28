"use client";
// DetailCharts — interactive Recharts visualizations for the patent detail
// page's "Visuals" tab. Dashboard of stat cards + (1) a readiness radial vs 100,
// (2) a forward-citations vs field-average bar chart, (3) a remaining-life %
// radial. All animate in, tooltips, emerald/teal palette via CSS vars.
import * as React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
  CartesianGrid, LabelList,
  PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, Link2, Hourglass, Scale, Target, FileText, Layers, PieChart as PieIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface DetailPatent {
  id: string;
  title: string;
  fieldOfUse: string | null;
  readinessScore: number | null;
  scoreSource: string;
  claimBreadth: string | null;
  remainingLifeYears: number | null;
  forwardCitations: number | null;
  marketSizeProxy: string | null;
  litigationHistory: string | null;
  patentFamilySize: number | null;
  legalStatus: string | null;
  filingDate: Date | string | null;
  grantDate: Date | string | null;
}

// Palette — emerald/teal, NO indigo/blue. Read from CSS vars so dark mode adapts.
const COLORS = {
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",
  primary: "var(--primary)",
  muted: "var(--muted-foreground)",
  border: "var(--border)",
};

// Nominal field averages (illustrative reference points — not real benchmarks).
const FIELD_AVG_CITATIONS = 18;
const FIELD_AVG_FAMILY = 3;
const PATENT_TERM_YEARS = 20;

function StatCard({
  icon: Icon, label, value, hint, accent = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: "primary" | "chart2" | "chart3" | "chart4";
}) {
  const accentClass = {
    primary: "bg-primary/10 text-primary",
    chart2: "bg-chart-2/10 text-chart-2",
    chart3: "bg-chart-3/10 text-chart-3",
    chart4: "bg-chart-4/10 text-chart-4",
  }[accent];
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", accentClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-semibold leading-tight">{value}</p>
          {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-md">
      {label ? <p className="mb-1 font-medium">{label}</p> : null}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function DetailCharts({
  patent,
  fieldDistribution = [],
}: {
  patent: DetailPatent;
  fieldDistribution?: { field: string; count: number }[];
}) {
  const score = patent.readinessScore ?? 0;
  const hasScore = patent.readinessScore != null;

  const citationsData = [
    { name: "This patent", value: patent.forwardCitations ?? 0, fill: COLORS.chart1 },
    { name: "Field avg.", value: FIELD_AVG_CITATIONS, fill: COLORS.chart3 },
  ];
  const familyData = [
    { name: "This patent", value: patent.patentFamilySize ?? 0, fill: COLORS.chart2 },
    { name: "Field avg.", value: FIELD_AVG_FAMILY, fill: COLORS.chart3 },
  ];

  const remainingYears = patent.remainingLifeYears ?? 0;
  const remainingPct = Math.max(0, Math.min(100, (remainingYears / PATENT_TERM_YEARS) * 100));
  const remainingData = [{ name: "life", value: Math.round(remainingPct), fill: COLORS.chart2 }];

  const scoreData = [{ name: "score", value: score, fill: hasScore ? COLORS.primary : COLORS.muted }];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Readiness"
          value={hasScore ? `${score}/100` : "Unrated"}
          hint={`Source: ${patent.scoreSource || "—"}`}
          accent="primary"
        />
        <StatCard
          icon={Link2}
          label="Forward citations"
          value={patent.forwardCitations ?? "—"}
          hint={`Field avg. ${FIELD_AVG_CITATIONS}`}
          accent="chart2"
        />
        <StatCard
          icon={Hourglass}
          label="Remaining life"
          value={patent.remainingLifeYears != null ? `${patent.remainingLifeYears.toFixed(1)} yrs` : "—"}
          hint={`of ${PATENT_TERM_YEARS}-yr term`}
          accent="chart4"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Readiness radial vs 100 */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Commercial readiness
            </CardTitle>
            <CardDescription>
              Out of 100, as assigned by the PatentSale team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={scoreData}
                  startAngle={90}
                  endAngle={90 - 360 * (hasScore ? 1 : 0)}
                  cy="55%"
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background={{ fill: "var(--muted)" }}
                    dataKey="value"
                    cornerRadius={12}
                    isAnimationActive
                    animationDuration={1100}
                    animationEasing="ease-out"
                  />
                  <LabelList
                    position="center"
                    fill="var(--foreground)"
                    formatter={() => (
                      <tspan>
                        <tspan x="50%" y="50%" textAnchor="middle" className="fill-foreground" style={{ fontSize: "2rem", fontWeight: 700 }}>
                          {hasScore ? score : "—"}
                        </tspan>
                        <tspan x="50%" y="65%" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "0.7rem" }}>
                          / 100
                        </tspan>
                      </tspan>
                    )}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Remaining life radial */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Hourglass className="h-4 w-4 text-chart-2" />
              Remaining patent life
            </CardTitle>
            <CardDescription>
              Percentage of the standard {PATENT_TERM_YEARS}-year term remaining.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={remainingData}
                  startAngle={90}
                  endAngle={-270}
                  cy="55%"
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background={{ fill: "var(--muted)" }}
                    dataKey="value"
                    cornerRadius={12}
                    isAnimationActive
                    animationDuration={1100}
                    animationEasing="ease-out"
                  />
                  <LabelList
                    position="center"
                    formatter={() => (
                      <tspan>
                        <tspan x="50%" y="50%" textAnchor="middle" className="fill-foreground" style={{ fontSize: "2rem", fontWeight: 700 }}>
                          {Math.round(remainingPct)}%
                        </tspan>
                        <tspan x="50%" y="65%" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "0.7rem" }}>
                          {remainingYears.toFixed(1)} of {PATENT_TERM_YEARS} yrs
                        </tspan>
                      </tspan>
                    )}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Forward citations comparison */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4 text-chart-2" />
              Forward citations vs. field average
            </CardTitle>
            <CardDescription>
              Higher citations signal broader influence on subsequent art.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={citationsData} layout="vertical" margin={{ left: 0, right: 24, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} stroke={COLORS.border} strokeDasharray="3 3" opacity={0.5} />
                  <XAxis type="number" stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke={COLORS.muted} fontSize={12} tickLine={false} axisLine={false} width={84} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                  <Bar dataKey="value" name="Citations" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={900}>
                    <LabelList dataKey="value" position="right" className="fill-foreground" style={{ fontSize: 12, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Field-of-use category chart — this patent's field in marketplace context */}
      {fieldDistribution.length > 0 ? (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieIcon className="h-4 w-4 text-chart-5" />
              Field-of-use distribution
            </CardTitle>
            <CardDescription>
              How this patent's field (&ldquo;{patent.fieldOfUse || "Uncategorized"}&rdquo;) compares to the rest of the marketplace by listing count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid items-center gap-6 lg:grid-cols-2">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fieldDistribution.map((f) => ({
                        name: f.field,
                        value: f.count,
                        isThis: f.field === patent.fieldOfUse,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={2}
                      isAnimationActive
                      animationDuration={900}
                    >
                      {fieldDistribution.map((f, idx) => (
                        <Cell
                          key={idx}
                          fill={f.field === patent.fieldOfUse ? COLORS.primary : `var(--chart-${(idx % 4) + 1})`}
                          fillOpacity={f.field === patent.fieldOfUse ? 1 : 0.45}
                          stroke={f.field === patent.fieldOfUse ? "var(--foreground)" : "transparent"}
                          strokeWidth={f.field === patent.fieldOfUse ? 2 : 0}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1.5">
                {fieldDistribution.slice(0, 7).map((f) => {
                  const isThis = f.field === patent.fieldOfUse;
                  const totalListings = fieldDistribution.reduce((s, x) => s + x.count, 0);
                  const pct = totalListings > 0 ? Math.round((f.count / totalListings) * 100) : 0;
                  return (
                    <li
                      key={f.field}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm",
                        isThis && "bg-primary/10 ring-1 ring-primary/30"
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: isThis ? COLORS.primary : "var(--muted-foreground)" }}
                        />
                        <span className={cn("truncate", isThis ? "font-semibold text-foreground" : "text-muted-foreground")}>
                          {f.field}
                          {isThis ? <span className="ml-1.5 text-[10px] font-medium text-primary">this patent</span> : null}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                        {f.count} ({pct}%)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Readiness inputs reference table */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-primary" />
            Readiness inputs (reference data)
          </CardTitle>
          <CardDescription>
            The qualitative inputs our team referenced when assigning the readiness score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <InputChip icon={Target} label="Claim breadth" value={patent.claimBreadth} />
            <InputChip icon={Hourglass} label="Remaining life" value={patent.remainingLifeYears != null ? `${patent.remainingLifeYears.toFixed(1)} yrs` : null} />
            <InputChip icon={Link2} label="Forward citations" value={patent.forwardCitations != null ? String(patent.forwardCitations) : null} />
            <InputChip icon={TrendingUp} label="Market size" value={patent.marketSizeProxy} />
            <InputChip icon={FileText} label="Litigation" value={patent.litigationHistory} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InputChip({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1">
        {value ? (
          <Badge variant="secondary" className="capitalize">{value}</Badge>
        ) : (
          <span className="text-xs italic text-muted-foreground/70">Not specified</span>
        )}
      </div>
    </div>
  );
}
