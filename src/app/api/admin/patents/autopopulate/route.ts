// POST /api/admin/patents/autopopulate — fetches full patent details from
// Google Patents (free, no API key) by patent number. The admin enters just a
// patent number (e.g. "US10022792B2" or "IN201621019586A") and this endpoint
// fetches + parses the Google Patents HTML page, returning structured data that
// auto-fills the patent form.
//
// This is the same Google Patents pipeline used by prisma/fetch-iit-patents.ts
// but exposed as an admin API for on-demand use.
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/admin/_session";

const PATENT_PAGE = "https://patents.google.com/patent/";
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function POST(req: NextRequest) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json().catch(() => null);
    if (!body?.patentNumber) {
      return NextResponse.json({ error: "patentNumber is required" }, { status: 422 });
    }

    const patentNumber = String(body.patentNumber).trim().toUpperCase();
    if (!/^[A-Z]{2}[0-9A-Z]+/.test(patentNumber)) {
      return NextResponse.json(
        { error: "Invalid patent number format. Expected e.g. US10022792B2 or IN201621019586A" },
        { status: 422 }
      );
    }

    // Fetch the Google Patents HTML page
    const url = `${PATENT_PAGE}${encodeURIComponent(patentNumber)}/en`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });

    if (res.status === 404) {
      return NextResponse.json(
        { error: `Patent ${patentNumber} not found on Google Patents` },
        { status: 404 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: `Google Patents returned ${res.status}. Try again in a moment.` },
        { status: 502 }
      );
    }

    const html = await res.text();

    // Parse meta tags
    const metas: Record<string, string> = {};
    const metaRe = /<meta\s+name="([^"]+)"\s+content="([^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = metaRe.exec(html)) !== null) {
      metas[m[1]] = m[2].trim();
    }

    // Extract title (prefer DC.title, fall back to <h2 id="title">)
    let title = metas["DC.title"] || "";
    if (!title) {
      const titleMatch = html.match(/<span\s+itemprop="title"[^>]*>([\s\S]*?)<\/span>/);
      if (titleMatch) title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
    }

    // Extract abstract
    let abstract = "";
    const absMatch = html.match(/<abstract[^>]*>([\s\S]*?)<\/abstract>/);
    if (absMatch) {
      abstract = absMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    if (!abstract) {
      abstract = (metas["DC.description"] || "").replace(/&hellip;/g, "…").trim();
    }

    // Extract claims (first 4000 chars)
    let claims = "";
    const claimsMatch =
      html.match(/<section[^>]*itemprop="claims"[^>]*>([\s\S]*?)<\/section>/) ||
      html.match(/<section[^>]*claims[^>]*>([\s\S]*?)<\/section>/);
    if (claimsMatch) {
      claims = claimsMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }

    // Extract description (first 3000 chars)
    let description = "";
    const descMatch =
      html.match(/<section[^>]*itemprop="description"[^>]*>([\s\S]*?)<\/section>/) ||
      html.match(/<section[^>]*description[^>]*>([\s\S]*?)<\/section>/);
    if (descMatch) {
      description = descMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
    }

    // Extract inventors from meta or HTML
    let inventors: string[] = [];
    if (metas["citation_inventor"]) {
      inventors = metas["citation_inventor"].split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    }
    // Fall back to parsing <dd> elements with itemprop="inventor"
    if (inventors.length === 0) {
      const invMatches = html.matchAll(/itemprop="inventor"[^>]*>([^<]+)</g);
      for (const im of invMatches) {
        const name = im[1].trim();
        if (name && !inventors.includes(name)) inventors.push(name);
      }
    }

    // Extract assignee
    let assignee = metas["DC.contributor"] || "";
    if (!assignee) {
      const assigneeMatch = html.match(/itemprop="assignee"[^>]*>([^<]+)</);
      if (assigneeMatch) assignee = assigneeMatch[1].trim();
    }

    // Extract dates
    const filingDate = metas["citation_filing_date"] || "";
    const grantDate = metas["citation_publication_date"] || metas["DC.date"] || "";
    const applicationNumber = metas["citation_patent_application_number"] || "";

    // Determine jurisdiction + legal status
    const jurisdiction = patentNumber.substring(0, 2);
    const isApplication = /[A][0-9]?$/.test(patentNumber);
    const legalStatus = isApplication ? "pending" : "active";

    // Check if we got any meaningful data
    if (!title && !abstract) {
      return NextResponse.json(
        { error: `Could not extract data for ${patentNumber}. Google Patents may not have full text for this patent (common for Indian patents).` },
        { status: 422 }
      );
    }

    return NextResponse.json({
      patentNumber,
      jurisdiction,
      title: title.slice(0, 500),
      abstract: abstract.slice(0, 2000),
      claims: claims.slice(0, 5000),
      description: description.slice(0, 3000),
      inventors,
      assignee,
      applicationNumber,
      filingDate,
      grantDate,
      legalStatus,
    });
  } catch (e) {
    console.error("POST /api/admin/patents/autopopulate error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
