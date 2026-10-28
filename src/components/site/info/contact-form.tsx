"use client";
// PatentSale — Contact Us form. Separate from the lead capture flow (which is
// for patent submissions). Posts to /api/contact, which persists a
// ContactMessage, sends an acknowledgment + sales notification, and logs
// analytics. Uses shadcn toast for feedback and resets on success.
//
// DPDPA: uses the shared ConsentNotice component (explicit checkbox + age
// declaration) — not implied consent.
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConsentNotice, type ConsentState } from "@/components/site/consent-notice";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

const CONTACT_CONSENT_TEXT = `I consent to PatentSale collecting my name, email, and message for the purpose of responding to my inquiry. I have read and agree to the Privacy Policy. I understand I may withdraw consent or request access, correction, or erasure of my data at any time via the Grievance Officer listed in the Privacy Policy.`;

const AGE_TEXT = `I confirm I am 18 years of age or older.`;

type FieldErrors = {
  name?: string;
  email?: string;
  message?: string;
  consent?: string;
};

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ContactForm() {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [consent, setConsent] = React.useState<ConsentState>({ consent: false, ageConfirmed: false });
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!email.trim()) next.email = "Please enter your email.";
    else if (!validateEmail(email.trim())) next.email = "Please enter a valid email address.";
    if (!message.trim()) next.message = "Please enter a message.";
    if (!consent.ageConfirmed) next.consent = "Please confirm you are 18 or older";
    if (!consent.consent) next.consent = next.consent || "Please provide consent to continue";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || undefined,
          message: message.trim(),
          consent: consent.consent,
          ageConfirmed: consent.ageConfirmed,
          consentText: CONTACT_CONSENT_TEXT,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Request failed");
      }
      toast({
        title: "Message sent",
        description: "Thanks for reaching out — we'll get back to you shortly.",
      });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setConsent({ consent: false, ageConfirmed: false });
      setErrors({});
      setSubmitted(true);
    } catch {
      toast({
        title: "Something went wrong",
        description: "We couldn't send your message. Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="contact-name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contact-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          placeholder="Your full name"
          aria-invalid={!!errors.name}
        />
        {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
        />
        {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject">Subject (optional)</Label>
        <Input
          id="contact-subject"
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={submitting}
          placeholder="What's this about?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">
          Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
          rows={6}
          placeholder="Tell us how we can help."
          aria-invalid={!!errors.message}
        />
        {errors.message ? <p className="text-xs text-destructive">{errors.message}</p> : null}
      </div>

      <ConsentNotice
        consentText={CONTACT_CONSENT_TEXT}
        ageText={AGE_TEXT}
        value={consent}
        onChange={setConsent}
        idPrefix="contact"
        error={errors.consent}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" disabled={submitting} className="gap-1.5">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send message
            </>
          )}
        </Button>
        {submitted ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" /> Message received
          </span>
        ) : null}
      </div>
    </form>
  );
}
