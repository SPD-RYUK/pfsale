// Sitemap — emitted at /sitemap.xml by Next.js's Metadata Files convention.
// Lists every public, crawlable URL on PatentSale: static info pages, the
// marketplace index, and one entry per published patent.
//
// Static pages use `changeFrequency: "weekly"` (legal/info copy barely changes).
// The marketplace index + patent details use `changeFrequency: "daily"` because
// listings are curated continuously (new patents published, scores updated,
// stage badges changed). Priority signals relative importance to crawlers:
//   1.0  → home
//   0.9  → marketplace index
//   0.8  → patent detail (the long-tail SEO surface)
//   0.5  → legal / info pages (terms, privacy, refund, faq, contact, about, how-it-works)
//
// Patent lastModified uses publishedAt (when the listing went live) falling
// back to updatedAt (any edit after publishing). Both are non-null on
// published patents because the schema defaults publishedAt via the publish
// API and updatedAt via @updatedAt — but we guard defensively.
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

// The canonical production URL. Prefer the explicit env var (set in
// production via Railway/host). Fall back to the deployed domain — matches
// the canonical host used in lib/email.ts + lib/consent.ts. In local dev
// the relative URLs Next.js emits via metadataBase would also work, but we
// send absolute URLs here so sitemap entries are unambiguous for any host.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://patentforsale.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static, always-present pages. The route group (public) is invisible in
  // the URL — these are all root-relative paths.
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/patents`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/faq`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/refund`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // Patent detail entries — one per published listing. We only fetch the
  // fields we need (id + the two timestamp candidates) so this stays cheap
  // even as the catalogue grows. Sorted by publishedAt desc so the freshest
  // listings appear first in the XML — friendlier for crawlers that read
  // top-down.
  const patents = await db.patent.findMany({
    where: { published: true },
    select: {
      id: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  const patentPages: MetadataRoute.Sitemap = patents.map((p) => ({
    url: `${SITE_URL}/patents/${p.id}`,
    lastModified: p.publishedAt ?? p.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticPages, ...patentPages];
}
