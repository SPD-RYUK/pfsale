// POST /api/report-requests — "Get Full Commercial Readiness Report" lead-gen CTA.
// A visitor requests the full report for a patent; we capture contact details +
// patentId, persist a ReportRequest, notify sales, and send the visitor an ack.
// Same DPDPA consent pattern as lead capture + buyer inquiry (reused component).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendReportRequestAcknowledgment, sendReportRequestNotification } from "@/lib/email";
import { logEvent, anonymizeIp } from "@/lib/analytics";
import { REPORT_CONSENT_TEXT } from "@/lib/consent";
import { rateLimit, tooManyRequestsResponse, rateLimitIdentifierFromRequest } from "@/lib/rate-limit";
import { cleanRequired, cleanOptional, cleanEmail, sanitizeString } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const identifier = rateLimitIdentifierFromRequest(req);
  const rl = rateLimit("report-requests:" + identifier, 5, 60_000);
  if (!rl.success) return tooManyRequestsResponse(rl.resetAt);

  try {
    // Reject oversized bodies early.
    if (shouldRejectBodySize(req, 10_000)) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const patentId = cleanRequired(body.patentId, 100);
    const name = cleanRequired(body.name, 120);
    const email = cleanEmail(body.email);
    const phone = body.phone ? cleanOptional(body.phone, 32) : null;
    const company = body.company ? cleanOptional(body.company, 120) : null;
    const role = body.role ? cleanOptional(body.role, 80) : null;
    const message = body.message ? cleanOptional(body.message, 5000) : null;
    const consent = Boolean(body.consent);
    const ageConfirmed = Boolean(body.ageConfirmed);

    if (!patentId || !name || !email) {
      return NextResponse.json({ error: "Patent, name, and email are required" }, { status: 422 });
    }
    if (!consent || !ageConfirmed) {
      return NextResponse.json({ error: "Consent and age confirmation are required" }, { status: 422 });
    }

    const patent = await db.patent.findUnique({
      where: { id: patentId },
      select: { id: true, title: true, patentNumber: true, published: true },
    });
    if (!patent || !patent.published) {
      return NextResponse.json({ error: "Patent not found" }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || undefined;

    const report = await db.reportRequest.create({
      data: {
        patentId,
        name,
        email,
        phone,
        company,
        role,
        message,
        consent: true,
        ageConfirmed: true,
        consentTextSnapshot: typeof body.consentText === "string" ? sanitizeString(body.consentText).slice(0, 2000) : REPORT_CONSENT_TEXT,
        ipAddress: anonymizeIp(ip),
        status: "new",
      },
    });

    // Fire-and-forget: emails + analytics.
    void sendReportRequestAcknowledgment({ name, email, patentTitle: patent.title });
    void sendReportRequestNotification({
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      role: role || undefined,
      patentTitle: patent.title,
      patentNumber: patent.patentNumber,
      message: message || undefined,
    });
    void logEvent({
      eventType: "buyer_inquiry_submitted",
      sessionId: body.sessionId,
      patentId,
      ipAddress: ip,
      metadata: { reportRequestId: report.id, kind: "report_request" },
    });

    return NextResponse.json({ ok: true, id: report.id });
  } catch (e) {
    console.error("POST /api/report-requests error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function shouldRejectBodySize(req: NextRequest, maxBytes: number): boolean {
  const len = req.headers.get("content-length");
  if (!len) return false;
  return Number(len) > maxBytes;
}
