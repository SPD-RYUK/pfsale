"use client";
// LeadsTable — admin leads list with search, status filter, pagination,
// row actions (mark contacted/converted, view, hard-delete PII).
//
// Hard-delete (DPDPA erasure): removes the Lead record entirely. Any linked
// Patent.leadId is nulled first by the API; the published listing stays.
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRightCircle,
  Archive,
  Eye,
  RefreshCw,
  Loader2,
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
import { formatRelative } from "@/lib/format";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  patentNumber: string | null;
  status: string;
  sourceUrl: string | null;
  notes: string | null;
  convertedListingId: string | null;
  createdAt: string;
}

interface LeadsResponse {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_TONE: Record<string, string> = {
  new: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  contacted: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  converted: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  archived: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
};

const STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "archived", label: "Archived" },
];

export function LeadsTable() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<LeadsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [deleteTarget, setDeleteTarget] = React.useState<Lead | null>(null);
  const [viewTarget, setViewTarget] = React.useState<Lead | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);

  // Debounced search.
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
    fetch(`/api/admin/leads?${params.toString()}`)
      .then((r) => r.json())
      .then((d: LeadsResponse) => {
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

  async function updateStatus(lead: Lead, newStatus: string) {
    setActingId(lead.id);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`Marked as ${newStatus}`);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Failed to update lead");
    } finally {
      setActingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/leads/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Lead hard-deleted (DPDPA erasure)");
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Failed to delete lead");
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
          placeholder="Search name, email, phone, patent number…"
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
        <div className="sm:ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Patent #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
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
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <Mail className="size-3" /> {l.email}
                      </a>
                      <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <Phone className="size-3" /> {l.phone}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{l.patentNumber || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_TONE[l.status] || ""}>{l.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                    {l.sourceUrl ? new URL(l.sourceUrl).pathname : "direct"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {formatRelative(l.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actingId === l.id}>
                          {actingId === l.id ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewTarget(l)}>
                          <Eye className="size-4" /> View details
                        </DropdownMenuItem>
                        {l.convertedListingId ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/patents/${l.convertedListingId}`}>
                              <ExternalLink className="size-4" /> View listing
                            </Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/patents/new?leadId=${l.id}`}>
                              <ArrowRightCircle className="size-4" /> Create listing from lead
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateStatus(l, "contacted")}>
                          <CheckCircle2 className="size-4" /> Mark contacted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(l, "converted")}>
                          <ArrowRightCircle className="size-4" /> Mark converted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(l, "archived")}>
                          <Archive className="size-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(l)}
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

      {/* Hard-delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hard-delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{deleteTarget?.name}</strong>&apos;s lead record
              (name, email, phone, notes) from the database — a DPDPA erasure. Any published
              patent listing created from this lead is preserved but detached. This cannot be undone.
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

      {/* View details */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead details</DialogTitle>
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
                  <Badge variant="outline" className={STATUS_TONE[viewTarget.status] || ""}>{viewTarget.status}</Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <a href={`mailto:${viewTarget.email}`} className="text-primary hover:underline">{viewTarget.email}</a>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <a href={`tel:${viewTarget.phone}`} className="text-primary hover:underline">{viewTarget.phone}</a>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Patent #</div>
                  <div>{viewTarget.patentNumber || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Source URL</div>
                  <div className="truncate text-xs">{viewTarget.sourceUrl || "direct"}</div>
                </div>
              </div>
              {viewTarget.notes ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Notes</div>
                  <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap text-sm">
                    {viewTarget.notes}
                  </div>
                </div>
              ) : null}
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
