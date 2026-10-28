// PatentSale — HTML entity decoder utility.
// Used by the fetch/seed scripts to decode entities from Google Patents HTML
// (&hellip; → …, &#34; → ", etc.) so the DB stores clean text, not encoded
// entities that would render as literal strings in React.
//
// Also safe to call at render time as a fallback if any encoded entities
// slip through.

export function decodeHtmlEntities(s: string | null | undefined): string | null {
  if (!s) return s ?? null;
  return s
    .replace(/&hellip;/g, "\u2026")
    .replace(/&ldquo;/g, "\u201c")
    .replace(/&rdquo;/g, "\u201d")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&#34;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&copy;/g, "\u00a9")
    .replace(/&reg;/g, "\u00ae")
    .replace(/&trade;/g, "\u2122")
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => String.fromCharCode(parseInt(h, 16)));
}
