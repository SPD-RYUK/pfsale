// PatentSale — shared formatting helpers.
import type { Patent } from "@prisma/client";

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelative(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(date);
}

export function parseInventors(p: Patent): string[] {
  if (!p.inventors) return [];
  try {
    const v = JSON.parse(p.inventors);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return p.inventors.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
  }
}

export function truncate(s: string | null | undefined, n = 160): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

export function scoreColor(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

export function scoreLabel(score: number | null | undefined): string {
  if (score == null) return "Unrated";
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  return "Early";
}
