"use client";
// ReportRequestsTable — admin report-request list with search, status filter,
// pagination, row actions (advance status, view, hard-delete PII).
//
// Statuses: new | contacted | report_sent | converted | archived
//   - new:          freshly submitted, not yet engaged.
//   - contacted:    admin has reached out to the requester.
//   - report_sent:  the full readiness report has been delivered.
//   - converted:    the requester has engaged commercially (NDA / license / sale).
//   - archived:     closed without conversion.
//
// Hard-delete (DPDPA erasure): removes only the ReportRequest record. The patent
// listing the request references is preserved (the cascade runs the other way).
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Trash2,
  Mail,
  Phone,
  Eye,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Send,
  FileCheck2,
  Archive,
  Building2,
  ArrowRightCircle,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatRelative, formatDate, truncate } from "@/lib/format";

interface ReportPatent {
  id: string;
  title: string;
  patentNumber: string;
  jurisdiction: string;
  published: boolean;
}

interface ReportRequest {
  id: string;
  patentId: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  role: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  patent: ReportPatent | null;
}

interface ReportRequestsResponse {
  items: ReportRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_TONE: Record<string, string> = {
  new: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  contacted: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  report_sent: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  converted: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  archived: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
};

const STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "report_sent", label: "Report sent" },
  { value: "converted", label: "Converted" },
  { value: "archived", label: "Archived" },
];

export function ReportRequestsTable() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<ReportRequestsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [deleteTarget, setDeleteTarget] = React.useState<ReportRequest | null>(null);
  const [viewTarget, setViewTarget] = React.useState<ReportRequest | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);

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
  }, [status]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (searchRef.current) params.set("q", searchRef.current);
    if (status && status !== "all") params.set("status", status);
    params.set("page", String(page));
    fetch(`/api/admin/report-requests?${params.toString()}`)
      .then((r) => r.json())
      .then((d: ReportRequestsResponse) => {
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
  }, [page, status, refreshKey]);

  async function updateStatus(req: ReportRequest, newStatus: string) {
    setActingId(req.id);
    try {
      const res = await fetch(`/api/admin/report-requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`Marked as ${newStatus.replace("_", " ")}`);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Failed to update report request");
    } finally {
      setActingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/report-requests/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Report request hard-deleted (DPDPA erasure)");
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Failed to delete report request");
    } finally {
      setDeleting(false);
    }
  }

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search name, email, phone, company, patent…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
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
              <TableHead>Requester</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Patent</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">
                  No report requests found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    {r.company || r.role ? (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="size-3" />
                        {[r.company, r.role].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <Mail className="size-3" /> {r.email}
                      </a>
                      {r.phone ? (
                        <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <Phone className="size-3" /> {r.phone}
                        </a>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.patent ? (
                      <Link
                        href={`/admin/patents/${r.patent.id}`}
                        className="text-xs text-primary hover:underline max-w-[200px] block truncate"
                        title={r.patent.title}
                      >
                        {r.patent.title}
                        <span className="text-muted-foreground"> · {r.patent.patentNumber}</span>
                      </Link>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {r.message ? truncate(r.message, 120) : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_TONE[r.status] || ""}>
                      {r.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{formatRelative(r.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actingId === r.id}>
                          {actingId === r.id ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewTarget(r)}>
                          <Eye className="size-4" /> View details
                        </DropdownMenuItem>
                        {r.patent ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/patents/${r.patent.id}`}>
                              <ArrowRightCircle className="size-4" /> View patent
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateStatus(r, "contacted")}>
                          <CheckCircle2 className="size-4" /> Mark contacted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(r, "report_sent")}>
                          <Send className="size-4" /> Mark report sent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(r, "converted")}>
                          <FileCheck2 className="size-4" /> Mark converted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(r, "archived")}>
                          <Archive className="size-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(r)}
                        >
                          <Trash2 className="size-4" /> Hard-delete (PII)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hard-delete this report request?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{deleteTarget?.name}</strong>&apos;s report
              request (name, email, phone, company, message) from the database — a DPDPA erasure.
              The patent listing the request referenced is preserved. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
              Hard-delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report request details</DialogTitle>
            <DialogDescription>Submitted {viewTarget ? formatRelative(viewTarget.createdAt) : ""}</DialogDescription>
          </DialogHeader>
          {viewTarget ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div className="font-medium">{viewTarget.name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge variant="outline" className={STATUS_TONE[viewTarget.status] || ""}>
                    {viewTarget.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <a href={`mailto:${viewTarget.email}`} className="text-primary hover:underline">{viewTarget.email}</a>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  {viewTarget.phone ? (
                    <a href={`tel:${viewTarget.phone}`} className="text-primary hover:underline">{viewTarget.phone}</a>
                  ) : "—"}
                </div>
                {viewTarget.company ? (
                  <div>
                    <div className="text-xs text-muted-foreground">Company</div>
                    <div>{viewTarget.company}</div>
                  </div>
                ) : null}
                {viewTarget.role ? (
                  <div>
                    <div className="text-xs text-muted-foreground">Role</div>
                    <div>{viewTarget.role}</div>
                  </div>
                ) : null}
                {viewTarget.patent ? (
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">Patent</div>
                    <Link href={`/admin/patents/${viewTarget.patent.id}`} className="text-primary hover:underline text-xs">
                      {viewTarget.patent.title} — {viewTarget.patent.patentNumber} ({viewTarget.patent.jurisdiction})
                    </Link>
                  </div>
                ) : null}
              </div>
              {viewTarget.message ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Message</div>
                  <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap text-sm">
                    {viewTarget.message}
                  </div>
                </div>
              ) : null}
              {viewTarget.notes ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Admin notes</div>
                  <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap text-xs">
                    {viewTarget.notes}
                  </div>
                </div>
              ) : null}
              <div className="text-xs text-muted-foreground">
                Created: {formatDate(viewTarget.createdAt)}
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
