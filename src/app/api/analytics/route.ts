// POST /api/analytics — fire-and-forget event logging. Non-blocking: returns
// 204 immediately. DPDPA-aligned: anonymous session id, truncated IP, no PII.
import { NextRequest, NextResponse } from "next/server";
import { logEvent, anonymizeIp, type AnalyticsEventType } from "@/lib/analytics";
import {
  rateLimit,
  rateLimitIdentifierFromRequest,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";
import { sanitizeString, shouldRejectBodySize } from "@/lib/validation";

// Allowlist of accepted event types. Anything else is silently dropped
// (returns 204) — this prevents log injection / arbitrary-string writes.
const ALLOWED: AnalyticsEventType[] = [
  "page_view",
  "listing_view",
  "request_now_opened",
  "lead_submitted",
  "express_interest_opened",
  "buyer_inquiry_submitted",
  "contact_submitted",
];

// Higher than form endpoints — fires on every page view + tab focus.
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 4_000; // analytics payloads are tiny

export async function POST(req: NextRequest) {
  // 413 on oversized payloads before parsing — analytics bodies are small.
  if (shouldRejectBodySize(req, MAX_BODY_BYTES)) {
    return new NextResponse(null, { status: 413 });
  }

  const identifier = `analytics:${rateLimitIdentifierFromRequest(req)}`;
  const rl = rateLimit(identifier, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.success) return tooManyRequestsResponse(rl.resetAt);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.eventType !== "string") {
      return new NextResponse(null, { status: 204 });
    }
    const eventType = body.eventType as AnalyticsEventType;
    if (!ALLOWED.includes(eventType)) {
      return new NextResponse(null, { status: 204 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || undefined;

    // Sanitize all free-form string fields so a malicious client can't push
    // control characters into the analytics rows (log injection).
    const path = typeof body.path === "string" ? sanitizeString(body.path).slice(0, 2048) || null : null;
    const referrer = typeof body.referrer === "string" ? sanitizeString(body.referrer).slice(0, 2048) || null : null;
    const sessionId = typeof body.sessionId === "string" ? sanitizeString(body.sessionId).slice(0, 64) || null : null;
    const patentId = typeof body.patentId === "string" ? sanitizeString(body.patentId).slice(0, 64) || null : null;
    const userAgent = sanitizeString(req.headers.get("user-agent")).slice(0, 512) || null;

    // Only accept a plain object as metadata — reject arrays / primitives so
    // JSON.stringify on the storage side is well-defined and typed.
    const rawMeta = body.metadata;
    const metadata =
      rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta)
        ? (rawMeta as Record<string, unknown>)
        : undefined;

    void logEvent({
      eventType,
      sessionId: sessionId || undefined,
      path: path || undefined,
      referrer: referrer || undefined,
      patentId: patentId || undefined,
      ipAddress: ip,
      userAgent: userAgent || undefined,
      metadata,
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
