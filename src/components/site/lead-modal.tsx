"use client";
// The "Request Now" modal wrapper. Triggered from the navbar and CTAs across
// the site. Also fires the `request_now_opened` analytics event when opened.
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LeadForm } from "@/components/site/lead-form";

const LeadModalContext = React.createContext<{ open: () => void }>({ open: () => {} });

export function useLeadModal() {
  return React.useContext(LeadModalContext);
}

export function LeadModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  const openModal = React.useCallback(() => {
    setOpen(true);
    // fire-and-forget analytics — never block UX
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "request_now_opened" }),
    }).catch(() => {});
  }, []);

  return (
    <LeadModalContext.Provider value={{ open: openModal }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>List your patent on PatentSale</DialogTitle>
            <DialogDescription>
              Share a few details and our team will reach out to help you publish a storefront listing. Minimum info — no payment needed now.
            </DialogDescription>
          </DialogHeader>
          <LeadForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </LeadModalContext.Provider>
  );
}
