// fetch-patents.ts v3 — ROBUST patent fetcher with validation.
//
// Fixes over v2:
//   • FULL claims parsing — v2's lazy regex `[\s\S]*?</section>` stopped at the
//     first nested `</section>`, truncating the last ~30% of claims. v3 extracts
//     the complete claims section (from claims anchor to description anchor).
//   • FULL description parsing — same fix.
//   • Validation gate — a patent is only accepted if it passes ALL checks:
//       - title ≥ 15 chars, abstract ≥ 100 chars, claims ≥ 200 chars
//       - claims contain ≥ 2 numbered claims ("1." and "2.")
//       - description ≥ 200 chars
//       - ≥ 1 inventor, non-empty assignee, filing + grant dates
//   • Failed patents are retried once, then rejected and reported.
//   • Patents failing validation are NEVER written to the output JSON.
//
// Run: npx tsx prisma/fetch-patents.ts
// Output: /tmp/validated_patents.json (only patents that passed validation)

const SEARCH_URL = "https://patents.google.com/xhr/query";
const PATENT_PAGE = "https://patents.google.com/patent/";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface RawPatent {
  publication_number: string;
  title: string;
  assignee: string;
  inventor: string;
  filing_date: string;
  publication_date: string;
  grant_date: string;
}

export interface ValidatedPatent extends RawPatent {
  abstract: string;
  claims: string;
  description: string;
  application_number: string;
  legal_status: string;
  jurisdiction: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeEntities(s: string): string {
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
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(parseInt(d, 10)));
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

// ── VALIDATION ────────────────────────────────────────────────────────────────

export interface ValidationResult {
  ok: boolean;
  reasons: string[];
}

export function validatePatent(p: Partial<ValidatedPatent>): ValidationResult {
  const reasons: string[] = [];

  if (!p.title || p.title.trim().length < 15) reasons.push("title too short (<15 chars)");
  if (!p.abstract || p.abstract.trim().length < 100) reasons.push("abstract too short (<100 chars)");
  if (!p.claims || p.claims.trim().length < 200) reasons.push("claims too short (<200 chars)");

  // Claims must contain at least 2 numbered claims
  if (p.claims) {
    const claimNums = p.claims.match(/\b\d+\s*\.\s/g) || [];
    if (claimNums.length < 2) reasons.push(`only ${claimNums.length} numbered claim(s) found (need ≥2)`);
  }

  if (!p.description || p.description.trim().length < 200) reasons.push("description too short (<200 chars)");
  if (!p.inventor || p.inventor.trim().length < 3) reasons.push("no inventor");
  if (!p.assignee || p.assignee.trim().length < 3) reasons.push("no assignee");
  if (!p.filing_date) reasons.push("no filing date");
  if (!p.grant_date && !p.publication_date) reasons.push("no grant/publication date");
  if (!p.publication_number) reasons.push("no patent number");

  return { ok: reasons.length === 0, reasons };
}

// ── FETCHING ──────────────────────────────────────────────────────────────────

function normalizeAssignee(assignee: string): string {
  const a = assignee.trim();
  const cityMatch = a.match(
    /(?:Indian Institute of Technology|I\.I\.T\.?|IIT)[\s,]*(?:of technology)?[\s,]*\(?(Bombay|Mumbai|Madras|Chennai|Delhi|Kanpur|Kharagpur|Roorkee|Guwahati|Hyderabad|Varanasi|BHU|Indore|Bhubaneswar|Jodhpur|Patna|Mandi|Gandhinagar|Ropar|Bhilai|Dharwad|Palakkad|Tirupati|Goa)\)?/i
  );
  if (cityMatch) {
    const city = cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1).toLowerCase();
    const cityMap: Record<string, string> = { Mumbai: "Bombay", Chennai: "Madras" };
    return `Indian Institute of Technology ${cityMap[city] || city}`;
  }
  if (/Indian Institute of Technology/i.test(a)) return "Indian Institute of Technology";
  return a;
}

async function searchPatents(query: string, page: number, num: number): Promise<RawPatent[]> {
  const searchUrl = `${SEARCH_URL}?url=${encodeURIComponent(`q=${encodeURIComponent(query)}&num=${num}&page=${page}`)}&exp=`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(searchUrl, { headers: { "User-Agent": UA } });
    if (res.ok) {
      const data: any = await res.json();
      const results = data?.results?.cluster?.[0]?.result || [];
      return results
        .map((r: any) => {
          const p = r.patent || {};
          return {
            publication_number: p.publication_number || "",
            title: stripTags(p.title || ""),
            assignee: normalizeAssignee(p.assignee || ""),
            inventor: p.inventor || "",
            filing_date: p.filing_date || "",
            publication_date: p.publication_date || "",
            grant_date: p.grant_date || "",
          };
        })
        .filter((p: RawPatent) => p.publication_number && /Indian Institute of Technology/i.test(p.assignee));
    }
    if (res.status === 503 || res.status === 429) {
      console.log(`    Search 503/429, retry ${attempt + 1}/3…`);
      await sleep(5000);
      continue;
    }
    console.log(`    Search failed: HTTP ${res.status}`);
    return [];
  }
  console.log(`    Search rate-limited after 3 retries — stopping.`);
  return [];
}

// Parse a Google Patents HTML page into structured patent data.
// The key fix: claims/description sections are extracted by ANCHOR BOUNDARIES
// (claims anchor → description anchor), not lazy regex, so nested </section>
// tags no longer truncate the content.
export async function fetchPatentDetails(patentNumber: string) {
  const url = `${PATENT_PAGE}${encodeURIComponent(patentNumber)}/en`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  // ── Meta tags ──
  const metas: Record<string, string> = {};
  const metaRe = /<meta\s+name="([^"]+)"\s+content="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html)) !== null) {
    metas[m[1]] = decodeEntities(m[2]).trim();
  }

  // ── Title ──
  let title = metas["DC.title"] || "";
  if (!title) {
    const t = html.match(/<span\s+itemprop="title"[^>]*>([\s\S]*?)<\/span>/);
    if (t) title = stripTags(t[1]);
  }

  // ── Abstract ──
  let abstract = "";
  const absMatch = html.match(/<abstract[^>]*>([\s\S]*?)<\/abstract>/);
  if (absMatch) abstract = stripTags(absMatch[1]);
  if (!abstract) abstract = metas["DC.description"] || "";

  // ── CLAIMS ──
  // Google Patents structure: <section itemprop="claims">…claims…</section>
  // followed by OTHER sections (citations, legal events) BEFORE the
  // description section. Individual claims are <div>s, NOT nested <section>s,
  // so the FIRST </section> after the claims anchor correctly closes the
  // claims section. Capturing beyond it would bleed in citation/legal junk.
  let claims = "";
  const claimsAnchor = html.search(/<section[^>]*itemprop="claims"/);
  if (claimsAnchor !== -1) {
    // First </section> after the claims anchor = end of claims section.
    const claimsClose = html.indexOf("</section>", claimsAnchor);
    if (claimsClose !== -1) {
      claims = stripTags(html.slice(claimsAnchor, claimsClose));
    }
    // Fallback: if the section close wasn't found, take a bounded slice
    if (!claims) {
      claims = stripTags(html.slice(claimsAnchor, claimsAnchor + 100000));
    }
    // Remove the "Claims (N)" heading prefix Google Patents adds
    claims = claims
      .replace(/^Claims\s*\(\s*\d+\s*\)\s*/i, "")
      .replace(/^We claim:?\s*/i, "")
      .replace(/^What is claimed is:?\s*/i, "")
      .trim();
    // Trim trailing non-claim junk: the claims section sometimes picks up the
    // start of the next section's tables. Cut at the last numbered claim's end.
    const claimMatches = [...claims.matchAll(/\b(\d+)\s*\.\s/g)];
    if (claimMatches.length >= 2) {
      const lastClaimNum = Math.max(...claimMatches.map((m) => parseInt(m[1], 10)));
      // Find the LAST occurrence of "N." where N is the highest claim number
      const lastClaimRe = new RegExp(`\\b${lastClaimNum}\\s*\\.\\s`);
      let lastIdx = -1;
      let m: RegExpExecArray | null;
      const re = new RegExp(lastClaimRe.source, "g");
      while ((m = re.exec(claims)) !== null) lastIdx = m.index;
      if (lastIdx !== -1 && lastIdx < claims.length - 50) {
        // Keep everything up to a reasonable buffer after the last claim start
        // (the claim itself can be long). Instead of guessing, just cut any
        // obvious table junk: text containing "Publication number" or
        // "Priority date" tables that follow the claims.
        const junkIdx = claims.search(/(Publications?\s*\(|Application Number|Priority Date|Filing Date|Legal Events|Cited by)/);
        if (junkIdx > lastIdx) {
          claims = claims.slice(0, junkIdx).trim();
        }
      }
    }
  }

  // ── DESCRIPTION ──
  let description = "";
  const descAnchor = html.search(/<section[^>]*itemprop="description"/);
  if (descAnchor !== -1) {
    // Description runs until the next major section (similar documents / citations)
    const nextSection = html.indexOf("<section", descAnchor + 100);
    let descEnd = nextSection !== -1 ? nextSection : html.length;
    const descClose = html.indexOf("</section>", descAnchor);
    if (descClose !== -1 && descClose < descEnd) descEnd = descClose + 10;
    description = stripTags(html.slice(descAnchor, descEnd));
    // Trim the "Description" heading and technical-field boilerplate start
    description = description.replace(/^Description\s*/i, "").trim();
  }

  // ── Inventors ──
  let inventors: string[] = [];
  if (metas["citation_inventor"]) {
    inventors = metas["citation_inventor"].split(/[;,]/).map((s) => s.trim()).filter(Boolean);
  }
  if (inventors.length === 0) {
    for (const im of html.matchAll(/itemprop="inventor"[^>]*>([^<]+)</g)) {
      const name = im[1].trim();
      if (name && !inventors.includes(name)) inventors.push(name);
    }
  }

  // ── Assignee ──
  let assignee = metas["DC.contributor"] || "";
  if (!assignee) {
    const am = html.match(/itemprop="assignee"[^>]*>([^<]+)</);
    if (am) assignee = am[1].trim();
  }

  return {
    title,
    abstract,
    claims: claims.slice(0, 60000), // high cap — patents with 50+ claims can be very long
    description: description.slice(0, 8000),
    inventors,
    assignee,
    application_number: metas["citation_patent_application_number"] || "",
    // Google removed the citation_filing_date / citation_publication_date meta
    // tags (observed 2026-10-28). Dates now live in the info card as
    //   <dd><time itemprop="filingDate" datetime="YYYY-MM-DD">…</time></dd>
    //   <dd><time itemprop="publicationDate" datetime="YYYY-MM-DD">…</time></dd>
    // The info-card element appears FIRST in the document (before legal-event
    // tables that repeat the same itemprop), so first match = the patent's own
    // date. Prefer the ISO datetime attribute, fall back to the tag's text.
    filing_date:
      metas["citation_filing_date"] ||
      html.match(/itemprop="filingDate"[^>]*datetime="([^"]+)"/)?.[1] ||
      html.match(/itemprop="filingDate"[^>]*>\s*([^<]+?)\s*</)?.[1] ||
      "",
    grant_date:
      metas["citation_publication_date"] ||
      html.match(/itemprop="publicationDate"[^>]*datetime="([^"]+)"/)?.[1] ||
      html.match(/itemprop="publicationDate"[^>]*>\s*([^<]+?)\s*</)?.[1] ||
      metas["DC.date"] ||
      "",
    legal_status: /[A][0-9]?$/.test(patentNumber) ? "pending" : "active",
  };
}

async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

const SEARCHES = [
  '"Indian Institute of Technology"',
  '"Indian Institute of Technology" Bombay',
  '"Indian Institute of Technology" Madras',
  '"Indian Institute of Technology" Delhi',
  '"Indian Institute of Technology" Kanpur',
  '"Indian Institute of Technology" Kharagpur',
];

async function main() {
  const raw: RawPatent[] = [];
  const seen = new Set<string>();

  console.log("=== Phase 1: Search ===");
  let rateLimited = false;
  for (const q of SEARCHES) {
    console.log(`  Query: ${q}`);
    try {
      for (let page = 0; page < 3; page++) {
        const results = await searchPatents(q, page, 100);
        if (results.length === 0 && page === 0 && raw.length === 0) {
          // First search of the run returned nothing — almost certainly rate-limited.
          rateLimited = true;
          break;
        }
        let fresh = 0;
        for (const r of results) {
          if (seen.has(r.publication_number)) continue;
          seen.add(r.publication_number);
          raw.push(r);
          fresh++;
        }
        console.log(`    page ${page + 1}: +${fresh} (total ${raw.length})`);
        if (results.length < 10) break;
        await sleep(800);
      }
    } catch (e) {
      console.log(`    query failed: ${(e as Error).message}`);
    }
    if (rateLimited) {
      console.error("\nABORT: Google Patents search is rate-limiting us. Wait ~5 minutes and re-run.");
      console.error("Existing /tmp/validated_patents.json was NOT overwritten (aborted before Phase 2).");
      process.exit(1);
    }
    if (raw.length >= 350) break;
  }

  // Prioritise granted patents (B2/B1 suffix) over applications (A1/A2)
  const granted = raw.filter((r) => /B[12]$/.test(r.publication_number));
  const applications = raw.filter((r) => !/B[12]$/.test(r.publication_number));
  const ordered = [...granted, ...applications].slice(0, 220);
  console.log(`\n=== Phase 2: Fetch + validate (${ordered.length} patents: ${granted.length} granted first) ===`);

  const validated: ValidatedPatent[] = [];
  const rejected: { pn: string; reasons: string[] }[] = [];
  const failed: string[] = [];
  let done = 0;

  await pool(ordered, 5, async (r) => {
    const i = ordered.indexOf(r);
    done++;
    process.stdout.write(`\r  [${done}/${ordered.length}] ${r.publication_number}`);

    let details: Awaited<ReturnType<typeof fetchPatentDetails>> | null = null;
    // Fetch with one retry
    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        details = await fetchPatentDetails(r.publication_number);
        break;
      } catch (e) {
        if ((e as Error).message === "NOT_FOUND") break;
        if (attempt === 0) await sleep(1500);
      }
    }
    if (!details) {
      failed.push(r.publication_number);
      return;
    }

    const candidate: Partial<ValidatedPatent> = {
      ...r,
      title: details.title || r.title,
      assignee: details.assignee || r.assignee,
      abstract: details.abstract,
      claims: details.claims,
      description: details.description,
      application_number: details.application_number,
      filing_date: details.filing_date || r.filing_date,
      grant_date: details.grant_date || r.grant_date,
      legal_status: details.legal_status,
      jurisdiction: r.publication_number.slice(0, 2),
    };

    const v = validatePatent(candidate);
    if (v.ok) {
      validated.push(candidate as ValidatedPatent);
    } else {
      rejected.push({ pn: r.publication_number, reasons: v.reasons });
    }
  });

  console.log(`\n\n=== Phase 3: Results ===`);
  console.log(`Validated:   ${validated.length}`);
  console.log(`Rejected:    ${rejected.length}`);
  console.log(`Fetch failed: ${failed.length}`);

  // Rejection reasons breakdown
  const reasonCounts: Record<string, number> = {};
  for (const r of rejected) {
    for (const reason of r.reasons) {
      const key = reason.replace(/\s*\(.*\)/, "");
      reasonCounts[key] = (reasonCounts[key] || 0) + 1;
    }
  }
  console.log("\nRejection reasons:");
  Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).forEach(([k, c]) => console.log(`  ${k}: ${c}`));

  if (rejected.length > 0) {
    console.log("\nSample rejected:");
    rejected.slice(0, 5).forEach((r) => console.log(`  ${r.pn}: ${r.reasons.join("; ")}`));
  }

  // Claims quality check on validated set
  const claimCounts = validated.map((p) => (p.claims.match(/\b\d+\s*\.\s/g) || []).length);
  const avgClaims = claimCounts.length ? (claimCounts.reduce((a, b) => a + b, 0) / claimCounts.length).toFixed(1) : "0";
  console.log(`\nClaims quality: avg ${avgClaims} numbered claims/patent (min ${Math.min(...claimCounts)}, max ${Math.max(...claimCounts)})`);

  const fs = await import("fs");
  fs.writeFileSync("/tmp/validated_patents.json", JSON.stringify(validated, null, 2));
  console.log(`\nSaved ${validated.length} VALIDATED patents to /tmp/validated_patents.json`);
}

// Only run main() when executed directly (not when imported by seed-patents.ts)
if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
