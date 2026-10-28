"use client";
// DataRequestsManager — DPDPA data principal request queue.
//
// Manual workflow (DPDPA requires fulfillability, not automation). Admins can:
//   - Create a new request manually (received by email/phone).
//   - Update status (open → in_progress → resolved/rejected).
//   - Assign to an admin, add resolution notes.
//   - Delete a request record (admin only).
import * as React from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Loader2,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { formatDate, formatRelative } from "@/lib/format";

interface DataRequestRow {
  id: string;
  requestType: string;
  principalName: string | null;
  principalEmail: string | null;
  principalPhone: string | null;
  source: string;
  description: string | null;
  status: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  assignedTo: { id: string; email: string; name: string } | null;
}

interface DataRequestsResponse {
  items: DataRequestRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const TYPE_LABEL: Record<string, string> = {
  access: "Access",
  correction: "Correction",
  erasure: "Erasure",
  consent_withdrawal: "Consent withdrawal",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  in_progress: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  resolved: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
  rejected: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const TYPE_OPTIONS = [
  { value: "access", label: "Access" },
  { value: "correction", label: "Correction" },
  { value: "erasure", label: "Erasure" },
  { value: "consent_withdrawal", label: "Consent withdrawal" },
];

const SOURCE_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "form", label: "Form" },
];

export function DataRequestsManager() {
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<DataRequestsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<DataRequestRow | null>(null);
  const [viewTarget, setViewTarget] = React.useState<DataRequestRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DataRequestRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPage(1);
    setRefreshKey((k) => k + 1);
  }, [status]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    params.set("page", String(page));
    fetch(`/api/admin/data-requests?${params.toString()}`)
      .then((r) => r.json())
      .then((d: DataRequestsResponse) => {
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

  async function quickStatus(row: DataRequestRow, newStatus: string) {
    setActingId(row.id);
    try {
      const res = await fetch(`/api/admin/data-requests/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`Marked as ${newStatus.replace("_", " ")}`);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Failed to update request");
    } finally {
      setActingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/data-requests/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Request deleted");
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Failed to delete request");
    } finally {
      setDeleting(false);
    }
  }

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-[180px]">
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
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New request
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Resolved</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-12">
                  No data requests in the queue.
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {TYPE_LABEL[r.requestType] || r.requestType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{r.principalName || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.principalEmail || r.principalPhone || "—"}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">{r.source}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_TONE[r.status] || ""}>
                      {r.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.assignedTo ? r.assignedTo.email : "Unassigned"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{formatRelative(r.createdAt)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {r.resolvedAt ? formatDate(r.resolvedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actingId === r.id}>
                          {actingId === r.id ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewTarget(r)}>
                          <Eye className="size-4" /> View / edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => quickStatus(r, "in_progress")}>
                          <Clock className="size-4" /> Mark in progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => quickStatus(r, "resolved")}>
                          <CheckCircle2 className="size-4" /> Mark resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => quickStatus(r, "rejected")}>
                          <XCircle className="size-4" /> Mark rejected
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(r)}>
                          <Trash2 className="size-4" /> Delete
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

      <CreateDataRequestDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />

      <EditDataRequestDialog
        target={editTarget || viewTarget}
        open={!!editTarget || !!viewTarget}
        onOpenChange={(o) => {
          if (!o) {
            setEditTarget(null);
            setViewTarget(null);
          }
        }}
        onSaved={() => {
          setEditTarget(null);
          setViewTarget(null);
          setRefreshKey((k) => k + 1);
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this data request?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the request record from the queue. Use only for duplicates or
              test entries; real requests should be marked resolved/rejected for audit.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateDataRequestDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [requestType, setRequestType] = React.useState("access");
  const [principalName, setPrincipalName] = React.useState("");
  const [principalEmail, setPrincipalEmail] = React.useState("");
  const [principalPhone, setPrincipalPhone] = React.useState("");
  const [source, setSource] = React.useState("email");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function submit() {
    if (!principalEmail.trim() && !principalPhone.trim()) {
      toast.error("At least one principal contact (email or phone) is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/data-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          principalName: principalName.trim() || null,
          principalEmail: principalEmail.trim() || null,
          principalPhone: principalPhone.trim() || null,
          source,
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Create failed");
      }
      toast.success("Request created");
      setPrincipalName("");
      setPrincipalEmail("");
      setPrincipalPhone("");
      setDescription("");
      setRequestType("access");
      setSource("email");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New DPDPA data principal request</DialogTitle>
          <DialogDescription>
            Use this when a request arrives by email or phone. The request is added to the queue for manual fulfillment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dr-type">Request type</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger id="dr-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dr-source">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="dr-source" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dr-name">Principal name</Label>
            <Input id="dr-name" value={principalName} onChange={(e) => setPrincipalName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dr-email">Principal email</Label>
              <Input id="dr-email" type="email" value={principalEmail} onChange={(e) => setPrincipalEmail(e.target.value)} placeholder="principal@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dr-phone">Principal phone</Label>
              <Input id="dr-phone" value={principalPhone} onChange={(e) => setPrincipalPhone(e.target.value)} placeholder="+91 ..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dr-desc">Description / details</Label>
            <Textarea id="dr-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What the principal is asking for" className="min-h-20" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Create request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDataRequestDialog({
  target,
  open,
  onOpenChange,
  onSaved,
}: {
  target: DataRequestRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = React.useState("open");
  const [resolutionNotes, setResolutionNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (target) {
      setStatus(target.status);
      setResolutionNotes(target.resolutionNotes || "");
    }
  }, [target]);

  async function save() {
    if (!target) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/data-requests/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolutionNotes }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Request updated");
      onSaved();
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Data request — {target ? TYPE_LABEL[target.requestType] : ""}</DialogTitle>
          <DialogDescription>
            Submitted {target ? formatRelative(target.createdAt) : ""} via {target?.source}
          </DialogDescription>
        </DialogHeader>
        {target ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Principal</div>
                <div className="font-medium">{target.principalName || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div>{target.principalEmail || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Phone</div>
                <div>{target.principalPhone || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Assigned to</div>
                <div>{target.assignedTo?.email || "Unassigned"}</div>
              </div>
            </div>
            {target.description ? (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Description</div>
                <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap text-sm">{target.description}</div>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dr-status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="dr-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dr-notes">Resolution notes</Label>
              <Textarea
                id="dr-notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="What was done, who handled it, what was communicated"
                className="min-h-24"
              />
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Close</Button>
          <Button onClick={save} disabled={saving || !target} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
