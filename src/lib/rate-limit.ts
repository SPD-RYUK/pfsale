// PatentSale — simple in-memory rate limiter.
//
// Sufficient for the expected traffic scale (Phase A marketplace, single
// Node.js process). For multi-instance prod, swap this for a Redis-backed
// limiter — the function signature is the only public contract.
//
// Design:
//  - Buckets are keyed by `identifier` (the CALLER passes anonymizeIp(ip) so
//    we never store a raw IP — DPDPA data minimization).
//  - Each bucket holds an array of request timestamps within the window.
//  - On every call we drop timestamps older than `windowMs`, then check the
//    remaining count against `limit`.
//  - A periodic sweeper (every 5 minutes) clears empty buckets so the Map
//    can't grow unbounded under sustained traffic from many distinct IPs.
//
// Returns:
//  - { success: true,  remaining, resetAt } — request allowed
//  - { success: false, remaining, resetAt } — request denied (429)
//
// The caller is responsible for setting the HTTP 429 + Retry-After header.

import { anonymizeIp } from "@/lib/analytics";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, number[]>();

const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastSweepAt = 0;

/**
 * Rate-limit by identifier. Returns whether the request is allowed plus
 * metadata for HTTP response headers (Retry-After).
 *
 * @param identifier  Stable per-caller key (e.g. anonymized IP, or anon-IP + route).
 * @param limit       Max requests allowed in the window.
 * @param windowMs    Window length in milliseconds.
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Lazy sweep — cheap enough to inline on every Nth request without a timer.
  if (now - lastSweepAt > SWEEP_INTERVAL_MS) {
    lastSweepAt = now;
    for (const [key, timestamps] of buckets) {
      const fresh = timestamps.filter((t) => t > now - windowMs);
      if (fresh.length === 0) {
        buckets.delete(key);
      } else {
        buckets.set(key, fresh);
      }
    }
  }

  const cutoff = now - windowMs;
  const raw = buckets.get(identifier);
  const recent = raw ? raw.filter((t) => t > cutoff) : [];

  if (recent.length >= limit) {
    // Oldest surviving timestamp + window = when the bucket will drain enough
    // to allow one more request. That's the earliest the client should retry.
    const oldest = recent[0];
    const resetAt = oldest + windowMs;
    buckets.set(identifier, recent);
    return { success: false, remaining: 0, resetAt };
  }

  recent.push(now);
  buckets.set(identifier, recent);
  const resetAt = recent[0] + windowMs;
  return {
    success: true,
    remaining: Math.max(0, limit - recent.length),
    resetAt,
  };
}

/**
 * Convenience helper: read the client IP from the standard proxy headers,
 * anonymize it (DPDPA: never store a raw IP, even in memory), and return
 * a stable identifier suitable for `rateLimit(identifier, ...)`.
 *
 * Falls back to "anon" if no IP can be derived (e.g. local dev) so the
 * limiter still works — although in that case all anonymous traffic shares
 * one bucket, which is fine for dev.
 */
export function rateLimitIdentifierFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const raw = (fwd && fwd.split(",")[0]) || req.headers.get("x-real-ip") || "anon";
  // Re-use the project's anonymizer so we never store a raw IP.
  const id = anonymizeIp(raw);
  return id || "anon";
}

/**
 * Build a Next.js Response for a 429 with the project's standard body +
 * a Retry-After header (seconds).
 */
export function tooManyRequestsResponse(resetAt: number): Response {
  const retryAfterSec = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}
