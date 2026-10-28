// fetch-by-numbers.ts — recovery utility: refetch the known 220-patent dataset
// by explicit patent number. Bypasses the search endpoint entirely (useful when
// patents.google.com/xhr/query is rate-limited but patent pages still respond).
// Produces the same /tmp/validated_patents.json format as fetch-patents.ts,
// which seed-patents.ts then consumes.
//
// Run: npx tsx prisma/fetch-by-numbers.ts

import { fetchPatentDetails, validatePatent, type ValidatedPatent } from "./fetch-patents";
import * as fs from "fs";

const NUMBERS = [
  "US10022792B2","US11911770B2","US10553712B2","US9375388B2","US10217217B2",
  "US9947118B2","US12307277B2","US10973408B2","US11721329B2","US11049011B2",
  "US9197789B2","US11113337B2","US10833767B2","US11553546B2","US9806633B2",
  "US8660825B2","US12331114B2","US8294306B2","US8191126B2","US8335348B2",
  "AU2012251424B2","US8650693B2","US8040790B2","US9934554B2","US9403995B2",
  "US8411564B2","US12034530B2","US8713655B2","US9960878B2","US12388680B2",
  "US12231278B2","US10191943B2","US10728139B2","US8692902B2","US10337414B2",
  "US9077869B2","US9311323B2","US11012263B2","EP3615705B1","US12224499B2",
  "AU2012241522B2","US11310119B2","US11114899B2","US8515258B2","US8278939B2",
  "US9967028B2","US9778202B2","US9202141B2","US9149833B2","US11650552B2",
  "US9135682B2","US8828193B2","US9170203B2","US11128383B2","US11242468B2",
  "US11239878B2","US8520778B2","US11985017B2","US9034978B2","US8883503B2",
  "US11378488B2","US10365263B1","US12188406B2","US10891559B2","US10895382B2",
  "US9305204B2","US10041925B2","US8187976B2","US10361567B2","US12549961B2",
  "US10035131B2","US8343471B2","US8652373B2","US11432744B2","US12107959B2",
  "US9908170B2","US8588204B2","US11351508B2","US12007361B2","US9926202B2",
  "US8524178B2","EP3700489B1","US11859816B2","US11774496B2","US9847534B2",
  "US12522799B2","US9944774B2","US9576767B2","US11162193B2","US9731957B2",
  "US8457258B2","US8956517B2","US8781160B2","US11185256B2","US10003084B2",
  "US8884989B2","US12463700B2","US9327054B2","US8089314B2","US12138676B2",
  "US12289609B2","US11938186B2","US8792506B2","US8575465B2","US8703505B2",
  "US10187928B2","US9018892B2","US9672834B2","US8441645B2","US10367589B2",
  "US10442117B2","US10032462B2","US9424309B2","US11443761B2","US10176824B2",
  "US9979318B2","US9522378B2","US10949523B2","US10224716B2","US8673503B2",
  "US9475707B2","US8916136B2","US9184986B2","US12700893B2","US8610616B2",
  "US8034621B2","EP2558585B1","US10044345B2","US8536885B2","US11431367B2",
  "US8034622B2","US10433234B2","US12318503B2","US11031158B2","US8410177B2",
  "US9938153B2","US8715558B2","US8805111B2","US8992883B2","US11210486B2",
  "US11532996B2","US12632222B2","US8198794B2","US9786855B2","US10182354B2",
  "US10506508B2","US10071403B2","US9936402B2","US6890438B2","US12013115B2",
  "US10828017B2","US8640428B2","US8148158B1","US11368818B2","US12652223B2",
  "US20240430893A1","US20220407231A1","DE102010037736B4","US20140251396A1",
  "US20110229580A1","EP3897425A1","WO2021019567A1","US20180221850A1",
  "US20130049673A1","US20220403167A1","US20120067196A1","US20190139667A1",
  "US20090091065A1","US20120130663A1","US20200331778A1","US20120291553A1",
  "US20240242131A1","US20100133264A1","US20250071758A1","US20170238362A1",
  "US20100292063A1","US20160008528A1","EP3980389A1","US20140363160A1",
  "WO2015008299A2","WO2020065659A1","US20140355639A1","US20110249568A1",
  "US20230292254A1","SG11201909818SA","US20240223600A1","US20230082940A1",
  "WO2012101656A2","WO2022018743A1","WO2011151725A2","WO2018051370A1",
  "WO2021171302A1","WO2020095101A1","WO2018122871A1","US20210297301A1",
  "WO2014192012A1","WO2016162880A1","US20120016217A1","WO2025115027A1",
  "WO2021111461A1","WO2016116947A1","WO2020115758A1","US20210060560A1",
  "US20240119199A1","WO2015068176A2","US20240293279A1","WO2020044377A1",
  "US20170233597A1","WO2022190059A1","WO2013132513A1","WO2017158622A2",
  "WO2019073489A1","WO2022003727A1","WO2021070204A1","EP3387429A1",
  "WO2019069322A1","WO2020053879A1","WO2023042222A1","WO2017090056A1",
  "CA3066988A1",
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log(`=== Fetching ${NUMBERS.length} patents by number (search endpoint bypassed) ===`);
  const validated: ValidatedPatent[] = [];
  const rejected: { pn: string; reasons: string[] }[] = [];
  const failed: string[] = [];

  await pool(NUMBERS, 4, async (pn, i) => {
    process.stdout.write(`[${i + 1}/${NUMBERS.length}] ${pn}`);
    let details: Awaited<ReturnType<typeof fetchPatentDetails>> | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        details = await fetchPatentDetails(pn);
        break;
      } catch {
        if (attempt === 0) await sleep(2000);
      }
    }
    if (!details) {
      failed.push(pn);
      return;
    }
    const candidate = {
      publication_number: pn,
      title: details.title,
      assignee: details.assignee,
      inventor: details.inventors.join(", "),
      filing_date: details.filing_date,
      publication_date: details.grant_date,
      grant_date: details.grant_date,
      abstract: details.abstract,
      claims: details.claims,
      description: details.description,
      application_number: details.application_number,
      legal_status: details.legal_status,
      jurisdiction: pn.slice(0, 2),
    } as ValidatedPatent;
    const v = validatePatent(candidate);
    if (v.ok) validated.push(candidate);
    else rejected.push({ pn, reasons: v.reasons });
  });

  console.log(`\n\n=== Results ===`);
  console.log(`Validated: ${validated.length} / ${NUMBERS.length}`);
  console.log(`Rejected:  ${rejected.length}`);
  console.log(`Failed:    ${failed.length}${failed.length ? " → " + failed.join(", ") : ""}`);
  if (rejected.length) {
    console.log("Rejection reasons:");
    rejected.slice(0, 8).forEach((r) => console.log(`  ${r.pn}: ${r.reasons.join("; ")}`));
  }
  const claimCounts = validated.map((p) => (p.claims.match(/\b\d+\s*\.\s/g) || []).length);
  const avg = claimCounts.length ? (claimCounts.reduce((a, b) => a + b, 0) / claimCounts.length).toFixed(1) : "0";
  console.log(`Claims quality: avg ${avg} numbered claims/patent`);

  fs.writeFileSync("/tmp/validated_patents.json", JSON.stringify(validated, null, 2));
  console.log(`\nSaved ${validated.length} VALIDATED patents to /tmp/validated_patents.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
