"use client";
// Client-side analytics tracker. Logs page_view on every route change for
// public pages, plus supports explicit event logging. Fire-and-forget so it
// never slows page render. Anonymous session id lives in a cookie (no PII).
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_COOKIE = "ps_sid";

function getOrCreateSessionId(): string {
  if (typeof document === "undefined") return "anon";
  const match = document.cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (match && match[1]) return match[1];
  const id = "sid-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `${SESSION_COOKIE}=${id}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  return id;
}

function track(eventType: string, extra?: Record<string, unknown>) {
  try {
    const body = {
      eventType,
      sessionId: getOrCreateSessionId(),
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      ...extra,
    };
    // beacon-style: sendBeacon if available, else fetch with keepalive
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
    } else {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // analytics must never break UX
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    // Only track public routes — admin routes are excluded server-side too.
    if (pathname?.startsWith("/admin")) return;
    if (pathname?.startsWith("/api")) return;
    track("page_view");
    // Successful page mount → clear the ChunkLoadError reload-throttle timestamp
    // so a FUTURE chunk error in this same tab gets a fresh reload window.
    // (Mirrors the sessionStorage key used in src/app/(public)/error.tsx.)
    try {
      sessionStorage.removeItem("ps_chunk_reload_ts");
    } catch {
      // private mode / disabled storage — ignore
    }
  }, [pathname]);
  return null;
}

/** Imperative event logger for non-page-view interactions. */
export function trackEvent(eventType: string, extra?: Record<string, unknown>) {
  track(eventType, extra);
}
