"use client";
// ReportRequestDialog — "Get Full Commercial Readiness Report" lead-gen CTA.
// A visitor requests the full report for a patent; we capture their contact
// details (name/email required, phone/company/role/message optional), reuse
// the shared DPDPA <ConsentNotice>, and POST to /api/report-requests. Sales
// team follows up. Follows the same pattern as <InquiryDialog>.
//
// Fires `express_interest_opened` analytics with kind:"report" on open, and
// `report_request_submitted` on success.
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConsentNotice, type ConsentState } from "@/components/site/consent-notice";
import { REPORT_CONSENT_TEXT, AGE_DECLARATION_TEXT } from "@/lib/consent";
import { trackEvent } from "@/components/analytics/analytics-tracker";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Send, CheckCircle2, BarChart3, Layers, TrendingUp } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose phone validator: digits, +, spaces, dashes, parens, 7-20 chars. Phone is optional — only validate when provided.
const PHONE_RE = /^[+()\-\s\d]{7,20}$/;

const ROLE_OPTIONS = ["IP Manager", "R&D Lead", "Investor", "Business Development", "Other"] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  consent?: string;
}

const REPORT_INCLUDES = [
  { icon: BarChart3, label: "Detailed score breakdown", hint: "Claims, life, citations, market size, family, litigation" },
  { icon: Layers, label: "Full independent claim analysis", hint: "Scope, dependencies, freedom-to-operate notes" },
  { icon: TrendingUp, label: "Market sizing & comparable transactions", hint: "Sector benchmarks and recent deal ranges" },
  { icon: FileText, label: "Commercialization pathways", hint: "Licensing, assignment, and joint-development routes" },
];

export function ReportRequestDialog({
  patentId,
  patentTitle,
  triggerLabel = "Get full report",
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
      trackEvent("express_interest_opened", { patentId, kind: "report" });
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
        <FileText className="h-4 w-4" />
        {triggerLabel}
      </Button>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Get the full commercial readiness report
          </DialogTitle>
          <DialogDescription>
            Free, no obligation. Includes: detailed score breakdown, claim analysis, market sizing,
            comparable transactions, and commercialization pathways.
          </DialogDescription>
        </DialogHeader>

        {/* What's in the report — premium, trustworthy */}
        <ul className="mb-2 space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
          {REPORT_INCLUDES.map(({ icon: Icon, label, hint }) => (
            <li key={label} className="flex items-start gap-2.5 text-sm">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="font-medium text-foreground">{label}</span>
                <span className="text-muted-foreground"> — {hint}</span>
              </span>
            </li>
          ))}
        </ul>

        <ReportRequestForm
          patentId={patentId}
          patentTitle={patentTitle}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ReportRequestForm({
  patentId,
  patentTitle,
  onSuccess,
}: {
  patentId: string;
  patentTitle: string;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [role, setRole] = React.useState<RoleOption | "">("");
  const [message, setMessage] = React.useState("");
  const [consent, setConsent] = React.useState<ConsentState>({ consent: false, ageConfirmed: false });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!email.trim()) next.email = "Please enter your email.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Please enter a valid email address.";
    // Phone is optional — only validate when provided.
    if (phone.trim() && !PHONE_RE.test(phone.trim())) {
      next.phone = "Please enter a valid phone number (or leave blank).";
    }
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
      const res = await fetch("/api/report-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patentId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          company: company.trim() || undefined,
          role: role || undefined,
          message: message.trim() || undefined,
          consent: consent.consent,
          ageConfirmed: consent.ageConfirmed,
          consentText: REPORT_CONSENT_TEXT,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Server error");
      }
      trackEvent("report_request_submitted", { patentId });
      toast({
        title: "Report request received",
        description: "Check your email — our team will follow up with the full readiness report shortly.",
      });
      // Reset + close.
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setRole("");
      setMessage("");
      setConsent({ consent: false, ageConfirmed: false });
      setErrors({});
      onSuccess?.();
    } catch (err) {
      console.error("ReportRequestForm submit error:", err);
      toast({
        title: "Could not submit your request",
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
        <Label htmlFor="rr-name">Full name <span className="text-destructive">*</span></Label>
        <Input
          id="rr-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Priya Patel"
          aria-invalid={!!errors.name}
        />
        {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rr-email">Work email <span className="text-destructive">*</span></Label>
          <Input
            id="rr-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="priya@company.com"
            aria-invalid={!!errors.email}
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rr-phone" className="flex items-center justify-between">
            Phone <span className="text-[10px] font-normal text-muted-foreground">optional</span>
          </Label>
          <Input
            id="rr-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+91 98765 43210"
            aria-invalid={!!errors.phone}
          />
          {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rr-company" className="flex items-center justify-between">
            Company <span className="text-[10px] font-normal text-muted-foreground">optional</span>
          </Label>
          <Input
            id="rr-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoComplete="organization"
            placeholder="Acme IP Holdings"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rr-role" className="flex items-center justify-between">
            Role <span className="text-[10px] font-normal text-muted-foreground">optional</span>
          </Label>
          <Select value={role} onValueChange={(v) => setRole(v as RoleOption | "")}>
            <SelectTrigger id="rr-role" className="w-full">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rr-message" className="flex items-center justify-between">
          Message <span className="text-[10px] font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          id="rr-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder={`Tell us about your interest in "${patentTitle}". What would you like to do with it?`}
        />
      </div>

      <ConsentNotice
        consentText={REPORT_CONSENT_TEXT}
        ageText={AGE_DECLARATION_TEXT}
        value={consent}
        onChange={setConsent}
        idPrefix="rr"
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
            Request the full report
          </>
        )}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-primary" />
        Free. Our team responds within two business days.
      </p>
    </form>
  );
}
