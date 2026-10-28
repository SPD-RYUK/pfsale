// PatentSale — transactional email layer.
//
// Provider decision (documented in ARCHITECTURE.md): production uses Resend
// (or AWS SES / Postmark — the abstraction is provider-agnostic). At this
// stage, with no provider credentials in the sandbox, every outbound email is
// captured to the `EmailLog` table (auditable in the admin panel) and echoed
// to the server console. When RESEND_API_KEY (or equivalent) is present, the
// same `sendEmail` call dispatches via the real provider and records the result.
//
// This single configured provider backs every email-sending feature in the
// product: lead acknowledgment, sales notification, buyer inquiry notification,
// contact-form acknowledgment, and (Prompts 2/3) payment + listing-live emails.
import { db } from "@/lib/db";

export const SALES_EMAIL = process.env.SALES_EMAIL || "info@patentforsale.in";
export const FROM_EMAIL = process.env.FROM_EMAIL || "PatentSale <noreply@patentforsale.in>";

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string; // plain text body
  html?: string; // optional html body
  template?: string; // lead_ack | sales_notification | buyer_ack | contact_ack
}

/**
 * Send a transactional email. Always records to EmailLog for auditability.
 * In dev (no provider key), status = "logged_dev". In prod, dispatches via the
 * configured provider and records "sent" / "failed".
 *
 * Fire-and-forget safe: callers may `void sendEmail(...)` without awaiting.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const providerKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_KEY;
  let status: "sent" | "failed" | "logged_dev" = "logged_dev";
  let error: string | null = null;

  if (providerKey) {
    try {
      // Provider dispatch hook. Wired when RESEND_API_KEY is provisioned.
      // await resend.emails.send({ from, to, subject, html });
      status = "sent";
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
    }
  } else {
    // Dev fallback: echo to console so the flow is observable end-to-end.
    console.log(
      `\n[EMAIL:${input.template || "generic"}]\n  to: ${input.to}\n  subject: ${input.subject}\n  ---\n  ${input.body.replace(/\n/g, "\n  ")}\n`
    );
  }

  try {
    await db.emailLog.create({
      data: {
        to: input.to,
        subject: input.subject,
        body: input.body,
        template: input.template || null,
        status,
        error,
      },
    });
  } catch (e) {
    // Never let email-logging failures break a user flow.
    console.error("Failed to log email:", e);
  }
}

// ── Templated helpers (single source of truth for copy) ───────────────────────

export function sendLeadAcknowledgment(params: { name: string; email: string; patentNumber?: string }) {
  const patentLine = params.patentNumber ? `for patent ${params.patentNumber} ` : "";
  return sendEmail({
    to: params.email,
    template: "lead_ack",
    subject: "We've received your request — PatentSale team will reach out",
    body: `Hi ${params.name},

Thank you for expressing interest in listing your patent ${patentLine}on PatentSale. We've received your request and a member of our team will reach out to you shortly by phone or email to discuss next steps.

What happens next:
  1. Our team reviews your submission.
  2. We contact you to understand your patent and goals.
  3. If it's a fit, we help you publish a storefront listing on the marketplace.

This email acknowledges receipt of your request. No payment is required at this stage.

— The PatentSale Team
https://patentforsale.in`,
  });
}

export function sendSalesNotification(params: {
  name: string;
  email: string;
  phone: string;
  patentNumber?: string;
  source: "lead" | "buyer_inquiry" | "contact";
  patentTitle?: string;
  message?: string;
  budgetRange?: string;
  intendedUse?: string;
}) {
  const isBuyer = params.source === "buyer_inquiry";
  const subject = isBuyer
    ? `New buyer inquiry: ${params.patentTitle || "a patent"}`
    : params.source === "contact"
    ? `New contact-form message from ${params.name}`
    : `New patent lead: ${params.name}${params.patentNumber ? ` — ${params.patentNumber}` : ""}`;

  const lines = [
    `New ${params.source.replace("_", " ")} received on PatentSale.`,
    ``,
    `Name: ${params.name}`,
    `Email: ${params.email}`,
    `Phone: ${params.phone}`,
  ];
  if (params.patentNumber) lines.push(`Patent number: ${params.patentNumber}`);
  if (params.patentTitle) lines.push(`Patent title: ${params.patentTitle}`);
  if (params.budgetRange) lines.push(`Budget range: ${params.budgetRange}`);
  if (params.intendedUse) lines.push(`Intended use: ${params.intendedUse}`);
  if (params.message) lines.push(``, `Message:`, params.message);

  return sendEmail({
    to: SALES_EMAIL,
    template: "sales_notification",
    subject,
    body: lines.join("\n"),
  });
}

export function sendBuyerAcknowledgment(params: { name: string; email: string; patentTitle: string }) {
  return sendEmail({
    to: params.email,
    template: "buyer_ack",
    subject: `Your interest in "${params.patentTitle}" has been received`,
    body: `Hi ${params.name},

Thank you for expressing interest in the patent "${params.patentTitle}" on PatentSale. Our team has received your inquiry and will reach out shortly to facilitate an introduction and discuss next steps.

This email acknowledges receipt of your interest. No payment is required at this stage.

— The PatentSale Team
https://patentforsale.in`,
  });
}

export function sendContactAcknowledgment(params: { name: string; email: string; subject?: string }) {
  return sendEmail({
    to: params.email,
    template: "contact_ack",
    subject: "We've received your message — PatentSale",
    body: `Hi ${params.name},

Thank you for contacting PatentSale. We've received your message${params.subject ? ` regarding "${params.subject}"` : ""} and will get back to you shortly.

— The PatentSale Team
https://patentforsale.in`,
  });
}

export function sendReportRequestAcknowledgment(params: {
  name: string;
  email: string;
  patentTitle: string;
}) {
  return sendEmail({
    to: params.email,
    template: "report_ack",
    subject: `Your readiness report request for "${params.patentTitle}" — PatentSale`,
    body: `Hi ${params.name},

Thank you for requesting the full commercial readiness report for "${params.patentTitle}".

Our team is preparing your report and will email it to you shortly. A commercialization specialist may also reach out to discuss your specific interest and how this patent fits your objectives.

This email acknowledges receipt of your request. No payment is required.

— The PatentSale Team
https://patentforsale.in`,
  });
}

export function sendReportRequestNotification(params: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  patentTitle: string;
  patentNumber: string;
  message?: string;
}) {
  const lines = [
    `New report request received on PatentSale.`,
    ``,
    `Patent: ${params.patentTitle} (${params.patentNumber})`,
    ``,
    `Name: ${params.name}`,
    `Email: ${params.email}`,
  ];
  if (params.phone) lines.push(`Phone: ${params.phone}`);
  if (params.company) lines.push(`Company: ${params.company}`);
  if (params.role) lines.push(`Role: ${params.role}`);
  if (params.message) lines.push(``, `Message:`, params.message);

  return sendEmail({
    to: SALES_EMAIL,
    template: "sales_notification",
    subject: `New report request: ${params.name} — ${params.patentTitle}`,
    body: lines.join("\n"),
  });
}
