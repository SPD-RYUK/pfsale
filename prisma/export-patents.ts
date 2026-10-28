// export-patents.ts — exports ALL patents from the live database to the
// bundled dataset file (prisma/data/patents.json) in fetch-patents.ts's
// ValidatedPatent format. Run this after a successful fetch+seed to refresh
// the bundled dataset so fresh clones can seed offline.
//
// Run: npx tsx prisma/export-patents.ts

import { db } from "../src/lib/db";
import * as fs from "fs";
import * as path from "path";

function isoDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function parseInventors(s: string | null | undefined): string {
  if (!s) return "";
  try {
    const arr = JSON.parse(s);
    if (Array.isArray(arr)) return arr.join(", ");
    return String(arr);
  } catch {
    return s;
  }
}

async function main() {
  const patents = await db.patent.findMany({
    orderBy: [{ jurisdiction: "asc" }, { patentNumber: "asc" }],
  });

  const out = patents.map((p) => ({
    publication_number: p.patentNumber,
    title: p.title ?? "",
    assignee: p.assignee ?? "",
    inventor: parseInventors(p.inventors),
    filing_date: isoDate(p.filingDate),
    publication_date: isoDate(p.publishedAt) || isoDate(p.grantDate),
    grant_date: isoDate(p.grantDate),
    abstract: p.abstract ?? "",
    claims: p.claims ?? "",
    description: p.description ?? "",
    application_number: p.applicationNumber ?? "",
    legal_status: p.legalStatus ?? "active",
    jurisdiction: p.jurisdiction,
  }));

  const dir = path.join(__dirname, "data");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "patents.json");
  fs.writeFileSync(file, JSON.stringify(out, null, 2));

  const claimCounts = out.map((p) => (p.claims.match(/\b\d+\s*\.\s/g) || []).length);
  const avg = claimCounts.length ? (claimCounts.reduce((a, b) => a + b, 0) / claimCounts.length).toFixed(1) : "0";
  console.log(`Exported ${out.length} patents → ${file}`);
  console.log(`Avg claims/patent: ${avg} | total size: ${(fs.statSync(file).size / 1024 / 1024).toFixed(2)} MB`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
