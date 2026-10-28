// POST /api/contact — generic Contact Us form (separate from lead capture).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendContactAcknowledgment, sendSalesNotification } from "@/lib/email";
import { logEvent, anonymizeIp } from "@/lib/analytics";
import {
  rateLimit,
  rateLimitIdentifierFromRequest,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";
import {
  cleanEmail,
  cleanOptional,
  cleanRequired,
  shouldRejectBodySize,
  LIMITS,
} from "@/lib/validation";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 10_000;

export async function POST(req: NextRequest) {
  if (shouldRejectBodySize(req, MAX_BODY_BYTES)) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  const identifier = `contact:${rateLimitIdentifierFromRequest(req)}`;
  const rl = rateLimit(identifier, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.success) return tooManyRequestsResponse(rl.resetAt);

  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const name = cleanRequired(body.name, LIMITS.NAME);
    const email = cleanEmail(body.email);
    const subject = cleanOptional(body.subject, LIMITS.SUBJECT);
    const message = cleanRequired(body.message, LIMITS.MESSAGE);

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 422 });
    }

    // DPDPA: consent + age declaration required (not implied by submission).
    const consent = Boolean(body.consent);
    const ageConfirmed = Boolean(body.ageConfirmed);
    if (!consent || !ageConfirmed) {
      return NextResponse.json({ error: "Consent and age confirmation are required" }, { status: 422 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || undefined;

    await db.contactMessage.create({
      data: { name, email, subject, message, ipAddress: anonymizeIp(ip) },
    });

    void sendContactAcknowledgment({ name, email, subject: subject || undefined });
    void sendSalesNotification({ name, email, phone: "(contact form)", source: "contact", message });
    void logEvent({
      eventType: "contact_submitted",
      ipAddress: ip,
      metadata: { hasSubject: !!subject },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/contact error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
