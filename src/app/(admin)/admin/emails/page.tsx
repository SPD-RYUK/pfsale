"use client";
// Admin emails page — EmailLog viewer. Table with search + filters; click a row
// to view the full body in a dialog. Gives the team visibility into all outbound
// email (especially in dev where every email is logged, not sent).
import * as React from "react";
import { RefreshCw, Mail, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatRelative, formatDate } from "@/lib/format";

interface EmailRow {
  id: string;
  to: string;
  subject: string;
  body: string;
  template: string | null;
  status: string;
  error: string | null;
  createdAt: string;
}

interface EmailsResponse {
  items: EmailRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_TONE: Record<string, string> = {
  sent: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  logged_dev: "border-amber-500/30 text-amber-700 dark:text-amber-300",
  failed: "border-rose-500/30 text-rose-700 dark:text-rose-300",
};

const TEMPLATES = [
  { value: "all", label: "All templates" },
  { value: "lead_ack", label: "lead_ack" },
  { value: "sales_notification", label: "sales_notification" },
  { value: "buyer_ack", label: "buyer_ack" },
  { value: "contact_ack", label: "contact_ack" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "sent", label: "Sent" },
  { value: "logged_dev", label: "Logged (dev)" },
  { value: "failed", label: "Failed" },
];

export default function AdminEmailsPage() {
  const [q, setQ] = React.useState("");
  const [template, setTemplate] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<EmailsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [viewTarget, setViewTarget] = React.useState<EmailRow | null>(null);

  const searchRef = React.useRef(q);
  React.useEffect(() => {
    searchRef.current = q;
    const t = setTimeout(() => {
      setPage(1);
      setRefreshKey((k) => k + 1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  React.useEffect(() => {
    setPage(1);
    setRefreshKey((k) => k + 1);
  }, [template, status]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (searchRef.current) params.set("q", searchRef.current);
    if (template && template !== "all") params.set("template", template);
    if (status && status !== "all") params.set("status", status);
    params.set("page", String(page));
    fetch(`/api/admin/emails?${params.toString()}`)
      .then((r) => r.json())
      .then((d: EmailsResponse) => {
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
  }, [page, template, status, refreshKey]);

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs flex-1">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search to, subject, body…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={template} onValueChange={setTemplate}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="sm:ml-auto gap-1.5"
        >
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>To</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full max-w-[140px]" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                  No emails logged.
                </TableCell>
              </TableRow>
            ) : (
              items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{e.to}</TableCell>
                  <TableCell className="font-medium max-w-[320px] truncate" title={e.subject}>{e.subject}</TableCell>
                  <TableCell>
                    {e.template ? (
                      <Badge variant="outline" className="font-mono text-[10px]">{e.template}</Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_TONE[e.status] || ""}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{formatRelative(e.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewTarget(e)}>
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem className="text-sm text-muted-foreground px-3">
              Page {page} of {totalPages}
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{viewTarget?.subject}</DialogTitle>
            <DialogDescription>
              To: <span className="font-mono">{viewTarget?.to}</span> · {viewTarget ? formatDate(viewTarget.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          {viewTarget ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {viewTarget.template ? (
                  <Badge variant="outline" className="font-mono">{viewTarget.template}</Badge>
                ) : null}
                <Badge variant="outline" className={STATUS_TONE[viewTarget.status] || ""}>{viewTarget.status}</Badge>
                {viewTarget.error ? (
                  <span className="text-destructive">Error: {viewTarget.error}</span>
                ) : null}
              </div>
              <div className="rounded-md border bg-muted/30 p-4 max-h-[400px] overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono break-words">{viewTarget.body}</pre>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
