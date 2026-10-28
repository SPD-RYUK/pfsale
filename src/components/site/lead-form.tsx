"use client";
// Lead capture form — the Phase A "Request Now" flow. Minimum friction:
// Name, Email, Phone, Patent Number. DPDPA itemized consent + age declaration
// required before submit (NOT implied by clicking Request Now).
//
// On submit: persists a Lead record, logs an analytics event, and the server
// sends acknowledgment + sales-notification emails. No payment, no auto-fetch.
import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { ConsentNotice, type ConsentState } from "@/components/site/consent-notice";
import { LEAD_CONSENT_TEXT, AGE_DECLARATION_TEXT } from "@/lib/consent";

export function LeadForm({ onSuccess, compact }: { onSuccess?: () => void; compact?: boolean }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    patentNumber: "",
  });
  const [consent, setConsent] = React.useState<ConsentState>({ consent: false, ageConfirmed: false });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function update(field: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!consent.ageConfirmed) e.consent = "Please confirm you are 18 or older";
    if (!consent.consent) e.consent = e.consent || "Please provide consent to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          consent: consent.consent,
          ageConfirmed: consent.ageConfirmed,
          consentText: LEAD_CONSENT_TEXT,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }
      toast({
        title: "Request received",
        description: "Our team will reach out shortly. A confirmation email is on its way.",
      });
      setForm({ name: "", email: "", phone: "", patentNumber: "" });
      setConsent({ consent: false, ageConfirmed: false });
      onSuccess?.();
    } catch (err) {
      toast({
        title: "Could not submit",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lead-name">Full name</Label>
          <Input id="lead-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" />
          {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-email">Email</Label>
          <Input id="lead-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
          {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-phone">Phone number</Label>
          <Input id="lead-phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 ..." />
          {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-patent">Patent number (optional)</Label>
          <Input id="lead-patent" value={form.patentNumber} onChange={(e) => update("patentNumber", e.target.value)} placeholder="e.g. US11234567B2" />
        </div>
      </div>

      <ConsentNotice
        consentText={LEAD_CONSENT_TEXT}
        ageText={AGE_DECLARATION_TEXT}
        value={consent}
        onChange={setConsent}
        error={errors.consent}
      />

      <Button type="submit" disabled={submitting} className="w-full gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {submitting ? "Submitting…" : "Submit request"}
      </Button>
      {compact ? null : (
        <p className="text-center text-xs text-muted-foreground">
          No payment required. Our sales team follows up manually by phone or email.
        </p>
      )}
    </form>
  );
}
