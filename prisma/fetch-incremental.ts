// fetch-incremental.ts — batched, resumable patent fetcher.
//
// Unlike fetch-patents.ts / fetch-by-numbers.ts (which write the result file
// only once at the very end and lose everything on a mid-run block), this
// fetcher:
//   • Loads any already-validated patents from /tmp/validated_patents.json and
//     SKIPS them (resume from where the last run left off).
//   • Fetches the remaining numbers in small batches (BATCH at a time) with a
//     sleep between batches — gentle enough to stay under Google's burst
//     detection (single requests pass; bursts of ~200 get soft-blocked with
//     200-status shells that parse to nothing).
//   • PERSISTS the cumulative validated set to disk after EVERY batch, so a
//     crash / block / timeout never loses already-fetched patents.
//   • Honors a time budget (TIME_BUDGET_MS, default ~3.7 min) so it fits inside
//     a cron turn and stops cleanly, picking up next run.
//   • Adaptive block detection: bails after 3 consecutive EMPTY batches (no
//     new patents) without touching the existing dataset (non-regressive), but
//     keeps going as long as ANY batch makes progress — so intermittent
//     unblock windows are exploited rather than missed by a one-shot probe.
//
// Safe to run repeatedly. Output: /tmp/validated_patents.json (same format as
// fetch-patents.ts, consumed by seed-patents.ts).
//
// Run:  bun prisma/fetch-incremental.ts
//   or:  TIME_BUDGET_MS=480000 BATCH_SIZE=3 bun prisma/fetch-incremental.ts

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

const OUT = "/tmp/validated_patents.json";
const BATCH = Number(process.env.BATCH_SIZE || 3);
const BATCH_SLEEP_MS = Number(process.env.BATCH_SLEEP_MS || 3000);
const RETRY_SLEEP_MS = 2000;
const TIME_BUDGET_MS = Number(process.env.TIME_BUDGET_MS || 220000);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// bounded concurrency pool
async function pool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
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

function loadExisting(): ValidatedPatent[] {
  try {
    const d = JSON.parse(fs.readFileSync(OUT, "utf8"));
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

function persist(v: ValidatedPatent[]) {
  fs.writeFileSync(OUT, JSON.stringify(v, null, 2));
}

async function main() {
  const start = Date.now();
  const existing = loadExisting();
  const done = new Set(existing.map((p) => p.publication_number));
  const todo = NUMBERS.filter((n) => !done.has(n));

  console.log(`=== Incremental patent fetch (gentle mode) ===`);
  console.log(`Already validated: ${existing.length} / ${NUMBERS.length}`);
  console.log(`Remaining to fetch: ${todo.length}`);
  console.log(`Batch=${BATCH}  batchSleep=${BATCH_SLEEP_MS}ms  budget=${TIME_BUDGET_MS}ms`);

  if (todo.length === 0) {
    console.log("Nothing to do — full dataset already present. DATASET COMPLETE.");
    return;
  }

  const validated: ValidatedPatent[] = [...existing];
  let added = 0;
  let failedThisRun = 0;
  let batchesDone = 0;
  let consecutiveEmpty = 0;
  const BLOCKED_THRESHOLD = 4; // 4 consecutive empty batches → assume re-blocked

  for (let i = 0; i < todo.length; i += BATCH) {
    if (Date.now() - start > TIME_BUDGET_MS) {
      console.log(`Time budget reached after ${batchesDone} batches. Stopping cleanly — progress saved.`);
      break;
    }
    const batch = todo.slice(i, i + BATCH);
    const before = validated.length;
    await pool(batch, BATCH, async (pn) => {
      let details: Awaited<ReturnType<typeof fetchPatentDetails>> | null = null;
      for (let attempt = 0; attempt < 2 && !details; attempt++) {
        try {
          details = await fetchPatentDetails(pn);
        } catch {
          if (attempt === 0) await sleep(RETRY_SLEEP_MS);
        }
      }
      if (!details) {
        failedThisRun++;
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
    });
    persist(validated); // durable after every batch
    batchesDone++;
    const batchAdded = validated.length - before;
    added += batchAdded;
    if (batchAdded > 0) {
      consecutiveEmpty = 0;
      process.stdout.write(
        `  batch ${batchesDone}: +${batchAdded} | cumulative ${validated.length}/${NUMBERS.length}\n`
      );
    } else {
      consecutiveEmpty++;
      process.stdout.write(
        `  batch ${batchesDone}: +0 (empty ${consecutiveEmpty}/${BLOCKED_THRESHOLD}) | cumulative ${validated.length}/${NUMBERS.length}\n`
      );
      if (consecutiveEmpty >= BLOCKED_THRESHOLD && batchesDone >= BLOCKED_THRESHOLD) {
        console.log(`BLOCKED — ${BLOCKED_THRESHOLD} consecutive empty batches. Existing dataset untouched; will retry next run.`);
        break;
      }
    }
    if (i + BATCH < todo.length) await sleep(BATCH_SLEEP_MS);
  }

  persist(validated);

  console.log(`\n=== Incremental run complete ===`);
  console.log(`Added this run:    ${added}`);
  console.log(`Failed this run:   ${failedThisRun} (will retry next run)`);
  console.log(`Cumulative total:  ${validated.length} / ${NUMBERS.length}`);
  console.log(`Saved to ${OUT}`);
  const remaining = NUMBERS.length - validated.length;
  if (remaining > 0) {
    if (added > 0) {
      const est = Math.ceil(remaining / Math.max(added, 1));
      console.log(`~${remaining} remaining → ~${est} more run(s) at this rate.`);
    } else {
      console.log(`~${remaining} remaining — Google appears blocked; will retry next run.`);
    }
  } else {
    console.log("DATASET COMPLETE — ready for seed + push.");
  }
}

main().catch((e) => {
  console.error("fetch-incremental error:", e);
  process.exit(1);
});
