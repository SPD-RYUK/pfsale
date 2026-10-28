"use client";
// PatentInquiriesPanel — shows the buyer-inquiry count + recent inquiries for a
// given patent on the admin edit page, so the sales team can see which patents
// are generating buyer interest without leaving the listing editor.
import * as React from "react";
import { MessageSquare, Mail, Phone, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative, truncate } from "@/lib/format";

export interface InquiryRow {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  message: string | null;
  budgetRange: string | null;
  intendedUse: string | null;
  status: string;
  createdAt: string;
}

const STATUS_TONE: Record<string, string> = {
  new: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  contacted: "border-sky-500/30 text-sky-700 dark:text-sky-300",
  closed: "border-zinc-500/30 text-zinc-700 dark:text-zinc-300",
};

export function PatentInquiriesPanel({
  patentId,
  total,
  inquiries,
}: {
  patentId: string;
  total: number;
  inquiries: InquiryRow[];
}) {
  if (total === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          No buyer inquiries for this listing yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            Buyer inquiries
          </CardTitle>
          <CardDescription>
            {total} {total === 1 ? "buyer has expressed interest" : "buyers have expressed interest"} in this listing
          </CardDescription>
        </div>
        <Badge variant="secondary" className="text-sm font-semibold">{total}</Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="max-h-80 divide-y overflow-y-auto">
          {inquiries.map((i) => (
            <li key={i.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{i.buyerName}</span>
                    <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_TONE[i.status] || ""}`}>
                      {i.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {i.buyerEmail}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {i.buyerPhone}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatRelative(i.createdAt)}
                    </span>
                  </div>
                  {i.message ? (
                    <p className="text-xs text-muted-foreground/90 line-clamp-2">{truncate(i.message, 180)}</p>
                  ) : null}
                  {i.budgetRange || i.intendedUse ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {i.budgetRange ? (
                        <Badge variant="secondary" className="text-[10px]">Budget: {i.budgetRange}</Badge>
                      ) : null}
                      {i.intendedUse ? (
                        <Badge variant="secondary" className="text-[10px]">Use: {truncate(i.intendedUse, 40)}</Badge>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
