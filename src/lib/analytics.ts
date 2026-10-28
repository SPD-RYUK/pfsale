// PatentSale — self-hosted analytics layer (DPDPA-aligned, $0 additional cost).
//
// Design notes:
//  - No third-party analytics service. Events live in the same Neon/Postgres DB.
//  - No raw PII: sessionId is an anonymous cookie id, never tied to email/phone
//    unless the visitor is already a known lead (it isn't, by design).
//  - IP addresses are truncated (last octet dropped for IPv4) before storage —
//    a full IP can itself constitute personal data under DPDPA.
//  - Writes are fire-and-forget from the client and never block page render.
//
// Distinct event_type values enable a real funnel view in the admin dashboard:
//   page_view → listing_view → request_now_opened → lead_submitted
//   listing_view → express_interest_opened → buyer_inquiry_submitted
import { db } from "@/lib/db";

export type AnalyticsEventType =
  | "page_view"
  | "listing_view"
  | "request_now_opened"
  | "lead_submitted"
  | "express_interest_opened"
  | "buyer_inquiry_submitted"
  | "contact_submitted";

export interface AnalyticsEventInput {
  eventType: AnalyticsEventType;
  path?: string;
  referrer?: string;
  sessionId?: string;
  patentId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/** Truncate an IPv4 address by dropping the last octet (DPDPA data minimization). */
export function anonymizeIp(ip?: string | null): string | null {
  if (!ip) return null;
  const trimmed = ip.trim();
  // IPv4: 1.2.3.4 -> 1.2.3.0
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(trimmed)) {
    return trimmed.replace(/\.\d{1,3}$/, ".0");
  }
  // IPv6 or anything else: keep only the network prefix (first 2 groups) + ::.
  if (trimmed.includes(":")) {
    const groups = trimmed.split(":");
    return groups.slice(0, 2).join(":") + "::";
  }
  return null;
}

/**
 * Log an analytics event. Never throws — analytics must not break user flows.
 * Callers should `void logEvent(...)` (fire-and-forget) for non-blocking writes.
 */
export async function logEvent(input: AnalyticsEventInput): Promise<void> {
  try {
    await db.analyticsEvent.create({
      data: {
        eventType: input.eventType,
        path: input.path ?? null,
        referrer: input.referrer ?? null,
        sessionId: input.sessionId ?? null,
        patentId: input.patentId ?? null,
        ipAddress: anonymizeIp(input.ipAddress),
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (e) {
    // Swallow — analytics failures must never surface to users.
    console.error("analytics logEvent failed:", e);
  }
}

/** Helper to read/seed an anonymous session id from a cookie value. */
export function getSessionId(cookieValue?: string): string {
  if (cookieValue && cookieValue.length >= 8) return cookieValue;
  // Caller should pass a real cookie value; this is a fallback only.
  return "anon-" + Math.random().toString(36).slice(2, 12);
}
