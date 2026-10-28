// POST /api/leads — Phase A lead capture. Persists a Lead record, sends
// acknowledgment + sales-notification emails, and logs an analytics event.
// No payment, no automated patent fetching — sales team follows up manually.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLeadAcknowledgment, sendSalesNotification } from "@/lib/email";
import { logEvent, anonymizeIp } from "@/lib/analytics";
import { LEAD_CONSENT_TEXT } from "@/lib/consent";
import {
  rateLimit,
  rateLimitIdentifierFromRequest,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";
import {
  cleanEmail,
  cleanOptional,
  cleanPhone,
  cleanRequired,
  sanitizeString,
  shouldRejectBodySize,
  LIMITS,
} from "@/lib/validation";

// 5 lead submissions per minute per anonymized IP. Generous enough for a
// human correcting a typo, tight enough to stop drive-by spam.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 10_000;

export async function POST(req: NextRequest) {
  // 1. Body-size guard — reject oversized payloads before parsing.
  if (shouldRejectBodySize(req, MAX_BODY_BYTES)) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  // 2. Rate limit (per anonymized IP — DPDPA: never store raw IP, even in memory).
  const identifier = `leads:${rateLimitIdentifierFromRequest(req)}`;
  const rl = rateLimit(identifier, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.success) return tooManyRequestsResponse(rl.resetAt);

  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const name = cleanRequired(body.name, LIMITS.NAME);
    const email = cleanEmail(body.email);
    const phone = cleanPhone(body.phone);
    const patentNumber = cleanOptional(body.patentNumber, LIMITS.PATENT_NUMBER);
    const consent = Boolean(body.consent);
    const ageConfirmed = Boolean(body.ageConfirmed);

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 422 });
    }
    if (!consent || !ageConfirmed) {
      return NextResponse.json({ error: "Consent and age confirmation are required" }, { status: 422 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || undefined;
    const sourceUrl = cleanOptional(req.headers.get("referer"), LIMITS.URL);

    const lead = await db.lead.create({
      data: {
        name,
        email,
        phone,
        patentNumber,
        consent: true,
        ageConfirmed: true,
        consentTextSnapshot: cleanOptional(body.consentText, LIMITS.CONSENT_TEXT) || LEAD_CONSENT_TEXT,
        sourceUrl,
        ipAddress: anonymizeIp(ip),
        status: "new",
      },
    });

    // Fire-and-forget: emails + analytics. Never block the response.
    void sendLeadAcknowledgment({ name, email, patentNumber: patentNumber || undefined });
    void sendSalesNotification({
      name,
      email,
      phone,
      patentNumber: patentNumber || undefined,
      source: "lead",
    });
    void logEvent({
      eventType: "lead_submitted",
      sessionId: typeof body.sessionId === "string" ? sanitizeString(body.sessionId).slice(0, 64) || undefined : undefined,
      path: sourceUrl || undefined,
      ipAddress: ip,
      metadata: { leadId: lead.id, hasPatentNumber: !!patentNumber },
    });

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (e) {
    console.error("POST /api/leads error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
