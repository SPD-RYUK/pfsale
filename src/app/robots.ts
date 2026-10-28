// robots.ts — emitted at /robots.txt by Next.js's Metadata Files convention.
// Tells crawlers: index everything public, stay out of the admin panel and
// the JSON API (admin routes are auth-gated server-side already, but excluding
// them here keeps them out of search indexes and avoids wasting crawl budget
// on auth redirects). Points crawlers at the sitemap so they discover every
// published patent listing.
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://patentforsale.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // All respectable crawlers (Googlebot, Bingbot, DuckDuckBot, etc.)
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
