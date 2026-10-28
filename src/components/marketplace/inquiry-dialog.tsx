"use client";
// InquiryDialog — wrapper around <BuyerInquiryForm> that opens from a patent
// detail page's "Express Interest" CTA. Fires `express_interest_opened`
// analytics on open.
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/components/analytics/analytics-tracker";
import { BuyerInquiryForm } from "./buyer-inquiry-form";
import { Handshake } from "lucide-react";

export function InquiryDialog({
  patentId,
  patentTitle,
  triggerLabel = "Express interest",
  triggerVariant = "default",
  triggerSize = "lg",
  triggerClassName,
}: {
  patentId: string;
  patentTitle: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary";
  triggerSize?: "default" | "lg";
  triggerClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const onOpenChange = (next: boolean) => {
    if (next) {
      trackEvent("express_interest_opened", { patentId });
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button
        onClick={() => onOpenChange(true)}
        variant={triggerVariant}
        size={triggerSize}
        className={triggerClassName}
      >
        <Handshake className="h-4 w-4" />
        {triggerLabel}
      </Button>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Express interest in this patent</DialogTitle>
          <DialogDescription className="line-clamp-2">
            &ldquo;{patentTitle}&rdquo; — share a few details and our team will facilitate an introduction.
          </DialogDescription>
        </DialogHeader>
        <BuyerInquiryForm
          patentId={patentId}
          patentTitle={patentTitle}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
