// PatentSale — input validation helpers for public POST endpoints.
//
// These helpers enforce conservative length limits so an abusive client can't
// write oversized strings into the DB or trigger pathological search behaviour.
// Prisma already parameterizes queries, so SQL injection is handled — the
// remaining concern is denial-of-service via huge payloads + log injection
// via control characters in user-supplied strings.
//
// All `clean*` helpers:
//  - Coerce the value to a trimmed string (or `null` if empty/invalid).
//  - Strip ASCII control characters except \t \n \r (prevents log injection).
//  - Enforce a max length, truncating if exceeded (fail safe, never throw).
//  - Are pure & side-effect-free.

const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Strip control characters (except tab/newline) and trim. */
export function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL_CHARS_RE, "").trim();
}

/**
 * Sanitize + cap length. Returns `null` if the result is empty so callers can
 * pass it straight to an optional Prisma field.
 */
export function cleanOptional(value: unknown, maxLen: number): string | null {
  const s = sanitizeString(value).slice(0, maxLen);
  return s.length ? s : null;
}

/**
 * Sanitize + cap length + require non-empty. Returns `null` if empty so the
 * caller can run a single `if (!field)` check.
 */
export function cleanRequired(value: unknown, maxLen: number): string | null {
  const s = sanitizeString(value).slice(0, maxLen);
  return s.length ? s : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254; // RFC 5321

/** Validate an email address. Returns lowercased email or null. */
export function cleanEmail(value: unknown): string | null {
  const s = sanitizeString(value).toLowerCase().slice(0, EMAIL_MAX);
  return EMAIL_RE.test(s) ? s : null;
}

const PHONE_MAX = 32; // E.164 + formatting + headroom; any longer is abuse.

/** Sanitize a phone number. Returns null if empty after sanitization. */
export function cleanPhone(value: unknown): string | null {
  const s = sanitizeString(value).slice(0, PHONE_MAX);
  return s.length ? s : null;
}

// Project-wide field length caps (Prisma String is unbounded on SQLite; these
// guard the public write paths). Kept generous to not reject legitimate use.
export const LIMITS = {
  NAME: 120,
  PHONE: PHONE_MAX,
  EMAIL: EMAIL_MAX,
  PATENT_NUMBER: 64,
  SUBJECT: 200,
  MESSAGE: 5000,
  BUDGET_RANGE: 64,
  INTENDED_USE: 500,
  CONSENT_TEXT: 4000,
  URL: 2048,
} as const;

/** RFC-ish email check reused by routes that already had inline regex. */
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

/**
 * Reject bodies larger than `maxBytes` by reading the Content-Length header.
 * Returns true if the body should be rejected. Use at the top of a handler:
 *
 *   if (shouldRejectBodySize(req, 10_000)) return NextResponse.json(...);
 *
 * Note: Content-Length is set by the client and can be spoofed, but Prisma +
 * the length caps in this module cap the actual stored size regardless.
 */
export function shouldRejectBodySize(req: Request, maxBytes: number): boolean {
  const len = req.headers.get("content-length");
  if (len === null) return false; // unknown — let downstream length caps handle it
  const n = Number(len);
  return Number.isFinite(n) && n > maxBytes;
}
