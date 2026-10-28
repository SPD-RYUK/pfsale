"use client";
// StatCard — small KPI card for the dashboard.
// Accepts an iconName STRING (not a component) so it can be used from a Server
// Component (Lucide icon components are functions and cannot cross the
// server→client boundary).
import * as React from "react";
import { Users, FileText, MessageSquare, Activity, TrendingUp, ShieldCheck, Mail, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  iconName?: "users" | "file" | "message" | "activity" | "trending" | "shield" | "mail" | "alert";
  className?: string;
  accent?: "emerald" | "teal" | "amber" | "rose" | "sky";
}

const ICONS: Record<NonNullable<StatCardProps["iconName"]>, LucideIcon> = {
  users: Users,
  file: FileText,
  message: MessageSquare,
  activity: Activity,
  trending: TrendingUp,
  shield: ShieldCheck,
  mail: Mail,
  alert: AlertCircle,
};

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

export function StatCard({ label, value, hint, iconName, className, accent = "emerald" }: StatCardProps) {
  const Icon = iconName ? ICONS[iconName] : null;
  return (
    <Card className={cn("py-4", className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className={cn("flex size-9 items-center justify-center rounded-lg", accentClasses[accent])}>
            <Icon className="size-4" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
