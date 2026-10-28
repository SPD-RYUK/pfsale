"use client";
// BuyerInquiryForm — "Express Interest" form for a patent listing.
// Posts to /api/inquiries. Reuses the shared <ConsentNotice> for DPDPA consent
// (does NOT reimplement consent). Validates name/email/phone required + valid
// email + consent + age. Toasts on success/error. Fires buyer_inquiry_submitted
// analytics on success.
import * as React from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConsentNotice, type ConsentState } from "@/components/site/consent-notice";
import { BUYER_CONSENT_TEXT, AGE_DECLARATION_TEXT } from "@/lib/consent";
import { trackEvent } from "@/components/analytics/analytics-tracker";
import { useToast } from "@/hooks/use-toast";

interface FormErrors {
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  consent?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose but reasonable phone validator: digits, +, spaces, dashes, parens, 7-20 chars.
const PHONE_RE = /^[+()\-\s\d]{7,20}$/;

export function BuyerInquiryForm({
  patentId,
  patentTitle,
  onSuccess,
}: {
  patentId: string;
  patentTitle: string;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [buyerName, setBuyerName] = React.useState("");
  const [buyerEmail, setBuyerEmail] = React.useState("");
  const [buyerPhone, setBuyerPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [budgetRange, setBudgetRange] = React.useState("");
  const [intendedUse, setIntendedUse] = React.useState("");
  const [consent, setConsent] = React.useState<ConsentState>({ consent: false, ageConfirmed: false });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!buyerName.trim()) next.buyerName = "Please enter your name.";
    if (!buyerEmail.trim()) next.buyerEmail = "Please enter your email.";
    else if (!EMAIL_RE.test(buyerEmail.trim())) next.buyerEmail = "Please enter a valid email address.";
    if (!buyerPhone.trim()) next.buyerPhone = "Please enter your phone number.";
    else if (!PHONE_RE.test(buyerPhone.trim())) next.buyerPhone = "Please enter a valid phone number.";
    if (!consent.consent || !consent.ageConfirmed) {
      next.consent = "Please confirm you are 18+ and consent to data collection.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patentId,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim().toLowerCase(),
          buyerPhone: buyerPhone.trim(),
          message: message.trim() || undefined,
          budgetRange: budgetRange.trim() || undefined,
          intendedUse: intendedUse.trim() || undefined,
          consent: consent.consent,
          ageConfirmed: consent.ageConfirmed,
          consentText: BUYER_CONSENT_TEXT,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Server error");
      }
      trackEvent("buyer_inquiry_submitted", { patentId });
      toast({
        title: "Your interest has been received",
        description: "Check your email for confirmation. Our team will be in touch shortly.",
      });
      // Reset + close.
      setBuyerName("");
      setBuyerEmail("");
      setBuyerPhone("");
      setMessage("");
      setBudgetRange("");
      setIntendedUse("");
      setConsent({ consent: false, ageConfirmed: false });
      setErrors({});
      onSuccess?.();
    } catch (err) {
      console.error("BuyerInquiryForm submit error:", err);
      toast({
        title: "Could not submit your interest",
        description: "Please try again in a moment, or email us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="bi-name">Full name <span className="text-destructive">*</span></Label>
        <Input
          id="bi-name"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          autoComplete="name"
          placeholder="Priya Patel"
          aria-invalid={!!errors.buyerName}
        />
        {errors.buyerName ? <p className="text-xs text-destructive">{errors.buyerName}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bi-email">Email <span className="text-destructive">*</span></Label>
          <Input
            id="bi-email"
            type="email"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            autoComplete="email"
            placeholder="priya@company.com"
            aria-invalid={!!errors.buyerEmail}
          />
          {errors.buyerEmail ? <p className="text-xs text-destructive">{errors.buyerEmail}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bi-phone">Phone <span className="text-destructive">*</span></Label>
          <Input
            id="bi-phone"
            type="tel"
            value={buyerPhone}
            onChange={(e) => setBuyerPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+91 98765 43210"
            aria-invalid={!!errors.buyerPhone}
          />
          {errors.buyerPhone ? <p className="text-xs text-destructive">{errors.buyerPhone}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bi-budget" className="flex items-center justify-between">
            Budget range <span className="text-[10px] font-normal text-muted-foreground">optional</span>
          </Label>
          <Input
            id="bi-budget"
            value={budgetRange}
            onChange={(e) => setBudgetRange(e.target.value)}
            placeholder="e.g. $25k–$50k"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bi-use" className="flex items-center justify-between">
            Intended use <span className="text-[10px] font-normal text-muted-foreground">optional</span>
          </Label>
          <Input
            id="bi-use"
            value={intendedUse}
            onChange={(e) => setIntendedUse(e.target.value)}
            placeholder="e.g. license for product line"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bi-message" className="flex items-center justify-between">
          Message <span className="text-[10px] font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          id="bi-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder={`Tell us about your interest in "${patentTitle}". What would you like to do with it?`}
        />
      </div>

      <ConsentNotice
        consentText={BUYER_CONSENT_TEXT}
        ageText={AGE_DECLARATION_TEXT}
        value={consent}
        onChange={setConsent}
        idPrefix="bi"
        error={errors.consent}
      />

      <Button type="submit" disabled={submitting} className="w-full gap-1.5">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Express interest
          </>
        )}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        Our team reviews every inquiry and responds within two business days.
      </p>
    </form>
  );
}
