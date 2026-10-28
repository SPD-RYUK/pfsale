// POST /api/inquiries — buyer "Express Interest" from patent detail page.
// Persists a BuyerInquiry linked to the patent + buyer, notifies sales, sends
// buyer acknowledgment. Same DPDPA consent pattern as the lead form.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendBuyerAcknowledgment, sendSalesNotification } from "@/lib/email";
import { logEvent, anonymizeIp } from "@/lib/analytics";
import { BUYER_CONSENT_TEXT } from "@/lib/consent";
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

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 10_000;

export async function POST(req: NextRequest) {
  if (shouldRejectBodySize(req, MAX_BODY_BYTES)) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  const identifier = `inquiries:${rateLimitIdentifierFromRequest(req)}`;
  const rl = rateLimit(identifier, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.success) return tooManyRequestsResponse(rl.resetAt);

  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const patentId = cleanRequired(body.patentId, 64);
    const buyerName = cleanRequired(body.buyerName, LIMITS.NAME);
    const buyerEmail = cleanEmail(body.buyerEmail);
    const buyerPhone = cleanPhone(body.buyerPhone);
    const message = cleanOptional(body.message, LIMITS.MESSAGE);
    const budgetRange = cleanOptional(body.budgetRange, LIMITS.BUDGET_RANGE);
    const intendedUse = cleanOptional(body.intendedUse, LIMITS.INTENDED_USE);
    const consent = Boolean(body.consent);
    const ageConfirmed = Boolean(body.ageConfirmed);

    if (!patentId || !buyerName || !buyerEmail || !buyerPhone) {
      return NextResponse.json({ error: "Patent, name, email, and phone are required" }, { status: 422 });
    }
    if (!consent || !ageConfirmed) {
      return NextResponse.json({ error: "Consent and age confirmation are required" }, { status: 422 });
    }

    // Only allow inquiries on PUBLISHED patents — a buyer cannot express
    // interest against a draft listing they shouldn't be able to see.
    const patent = await db.patent.findUnique({
      where: { id: patentId },
      select: { id: true, title: true, published: true },
    });
    if (!patent || !patent.published) {
      return NextResponse.json({ error: "Patent not found" }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || undefined;

    const inquiry = await db.buyerInquiry.create({
      data: {
        patentId,
        buyerName,
        buyerEmail,
        buyerPhone,
        message,
        budgetRange,
        intendedUse,
        consent: true,
        ageConfirmed: true,
        consentTextSnapshot: cleanOptional(body.consentText, LIMITS.CONSENT_TEXT) || BUYER_CONSENT_TEXT,
        ipAddress: anonymizeIp(ip),
        status: "new",
      },
    });

    void sendBuyerAcknowledgment({ name: buyerName, email: buyerEmail, patentTitle: patent.title });
    void sendSalesNotification({
      name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
      source: "buyer_inquiry",
      patentTitle: patent.title,
      message: message || undefined,
      budgetRange: budgetRange || undefined,
      intendedUse: intendedUse || undefined,
    });
    void logEvent({
      eventType: "buyer_inquiry_submitted",
      sessionId: typeof body.sessionId === "string" ? sanitizeString(body.sessionId).slice(0, 64) || undefined : undefined,
      patentId,
      ipAddress: ip,
      metadata: { inquiryId: inquiry.id },
    });

    return NextResponse.json({ ok: true, id: inquiry.id });
  } catch (e) {
    console.error("POST /api/inquiries error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
