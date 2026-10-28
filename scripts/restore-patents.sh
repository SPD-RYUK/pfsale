#!/usr/bin/env bash
# restore-patents.sh — self-healing patent dataset + repo state.
#
# State of play (2026-10-28): the full dataset is RESTORED (211 validated IIT
# patents via fetch-incremental + 12 showcase = 223 in DB and bundled). Local
# main = single fresh-history commit incl. db/custom.db. The ONLY pending step
# is the force-push to GitHub, which needs GITHUB_PAT in .env (the sandbox
# revert wiped the old PAT — waiting for the user to provide a new one).
#
# Per run (idempotent, non-regressive):
#   0. ensure dev server up
#   1. sync DB schema (sandbox wipes recreate db/custom.db without columns)
#   2. incremental batched fetch of any missing patents (gentle mode; persists
#      after every batch; bails after 4 consecutive empty batches if blocked)
#   3. seed DB from /tmp dataset (+ bundled fallback) + 12 showcase + admin
#   4. refresh bundled prisma/data/patents.json from DB; commit if improved
#   5. if bundled ≥ 210 AND GITHUB_PAT present AND remote incomplete →
#      force-push local main (the fresh single-commit history) to pfsale
set -uo pipefail

cd "$(dirname "$0")/.."
REPO_DIR="$(pwd)"
TMP_JSON="/tmp/validated_patents.json"
BUNDLED="prisma/data/patents.json"
REPO_OWNER="kaustubhadixit"
REPO_NAME="pfsale"
REMOTE="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
LOG_TAG="[restore-patents]"

log() { echo "$LOG_TAG $(date '+%H:%M:%S') $*"; }

db_count() {
  bun -e "import {db} from './src/lib/db'; console.log(await db.patent.count()); process.exit(0)" 2>/dev/null | tail -1
}

bundled_count() {
  [ -f "$BUNDLED" ] && bun -e "console.log(JSON.parse(require('fs').readFileSync('$BUNDLED','utf8')).length)" 2>/dev/null | tail -1 || echo 0
}

# Validated-dataset count (0 if missing/empty/unparseable).
valid_count() {
  if [ -f "$TMP_JSON" ]; then
    bun -e "try{const d=JSON.parse(require('fs').readFileSync('$TMP_JSON','utf8'));console.log(Array.isArray(d)?d.length:0)}catch{console.log(0)}" 2>/dev/null | tail -1
  else
    echo 0
  fi
}

remote_bundled_count() {
  curl -s --max-time 20 "https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${BUNDLED}" 2>/dev/null \
    | bun -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{console.log(JSON.parse(s).length)}catch{console.log(0)}})" 2>/dev/null | tail -1
}

# ── 0. Dev server health ─────────────────────────────────────────────────────
ensure_dev_server() {
  if curl -s -o /dev/null --max-time 8 http://localhost:3000/ ; then
    log "dev server: up"
    return 0
  fi
  log "dev server: down — restarting"
  pkill -9 -f "next-server" 2>/dev/null
  pkill -9 -f "next dev" 2>/dev/null
  pkill -9 -f "bun run dev" 2>/dev/null
  sleep 2
  ( setsid bash -c 'exec bun run dev' > "$REPO_DIR/dev.log" 2>&1 < /dev/null & disown )
  sleep 10
  if curl -s -o /dev/null --max-time 20 http://localhost:3000/ ; then
    log "dev server: restarted OK"
  else
    log "dev server: FAILED to restart"
  fi
}

ensure_dev_server

BEFORE=$(db_count)
log "DB patents before: $BEFORE (bundled: $(bundled_count), /tmp dataset: $(valid_count))"

# ── 1. Schema sync ───────────────────────────────────────────────────────────
# A sandbox wipe can recreate db/custom.db without the schema (missing columns
# → Prisma P2022 on seed). Always sync first — idempotent, ~20 ms.
bunx prisma db push --skip-generate > /tmp/db-push.log 2>&1 \
  && log "db push: schema in sync" \
  || log "db push FAILED — see /tmp/db-push.log"

# ── 2. Incremental batched fetch (only if BOTH DB and bundled incomplete) ────
# The bundled dataset (committed) is the source of truth. Hitting Google is
# only worth it when even the bundled copy is incomplete — otherwise a blocked
# partial fetch just risks poisoning the seed source below.
VC_BEFORE=$(valid_count)
BC_CHECK=$(bundled_count)
if [ "${VC_BEFORE:-0}" -lt 210 ] && [ "${BC_CHECK:-0}" -lt 210 ]; then
  log "incremental fetch: have $VC_BEFORE / 220, bundled only $BC_CHECK — probing + batching..."
  TIME_BUDGET_MS=${FETCH_BUDGET_MS:-210000} bun prisma/fetch-incremental.ts > /tmp/fetch-incremental.log 2>&1 || true
  VC_AFTER=$(valid_count)
  if [ "${VC_AFTER:-0}" -gt "${VC_BEFORE:-0}" ]; then
    log "incremental fetch: +$((VC_AFTER - VC_BEFORE)) → $VC_AFTER / 220"
  else
    log "incremental fetch: no new patents (blocked or stable-max). still $VC_AFTER / 220"
  fi
else
  VC_AFTER=$VC_BEFORE
  log "fetch skipped (bundled=$BC_CHECK, /tmp=$VC_AFTER — bundled is authoritative)"
fi

# ── 2b. Seed-source guard (anti-regression) ──────────────────────────────────
# seed-patents.ts prefers /tmp over bundled, and PRUNES anything missing from
# its source. A partial /tmp file (sandbox wiped the full one; re-fetch got
# blocked midway) would therefore SHRINK the DB. Never let that happen: if the
# /tmp dataset is weaker than bundled, remove it so the seed falls back to the
# complete bundled copy.
if [ "${VC_AFTER:-0}" -lt 210 ] && [ "$(bundled_count)" -ge 210 ] && [ -f "$TMP_JSON" ]; then
  log "seed-source guard: /tmp dataset ($VC_AFTER) weaker than bundled — removing /tmp copy"
  rm -f "$TMP_JSON"
fi

# ── 3. Seed ──────────────────────────────────────────────────────────────────
if bunx tsx prisma/seed-patents.ts > /tmp/seed-patents.log 2>&1; then
  log "seed-patents OK — $(grep -oE 'Total published: [0-9]+' /tmp/seed-patents.log | head -1)"
else
  log "seed-patents aborted/failed: $(grep -E 'ABORT|Error' /tmp/seed-patents.log | head -2)"
fi

bunx tsx prisma/seed.ts > /tmp/seed.log 2>&1 && log "seed.ts OK (curated 12 + admin)" || log "seed.ts FAILED"

AFTER=$(db_count)
log "DB patents after: $AFTER"

# ── 4. Refresh bundled dataset from DB; commit if improved ───────────────────
if [ "$AFTER" -ge 210 ] || [ "${VC_AFTER:-0}" -ge 210 ]; then
  OLD_BUNDLED=$(bundled_count)
  if bunx tsx prisma/export-patents.ts > /tmp/export.log 2>&1; then
    NEW_BUNDLED=$(bundled_count)
    if [ "$NEW_BUNDLED" -gt "$OLD_BUNDLED" ]; then
      log "bundled dataset improved: $OLD_BUNDLED → $NEW_BUNDLED — committing"
      git add "$BUNDLED" 2>/dev/null
      git commit -m "data: bundled dataset refreshed to $NEW_BUNDLED patents (auto: restore-patents.sh)" --no-verify -q 2>/dev/null || true
    else
      log "bundled dataset unchanged ($NEW_BUNDLED)"
    fi
  else
    log "export-patents FAILED — see /tmp/export.log"
  fi
fi

# ── 5. Push fresh history (needs GITHUB_PAT) ─────────────────────────────────
# Guarantee the pushed history is EXACTLY the single root commit: stray commits
# (e.g. external cron auto-commits of db/custom.db) get squashed into the root,
# and any uncommitted changes (db/custom.db after a reseed) are folded in too.
if [ "$(git rev-list --count HEAD 2>/dev/null)" -gt 1 ]; then
  log "history: squashing stray commits back into the single root commit"
  git add -A 2>/dev/null
  git reset --soft "$(git rev-list --max-parents=0 HEAD)" -q
  git commit --amend --no-edit --no-verify -q 2>/dev/null || true
  log "history: $(git rev-list --count HEAD) commit — $(git log --oneline -1 | head -c 60)"
fi

PAT=$(grep -E "^GITHUB_PAT=" .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '[:space:]')
if [ -z "$PAT" ]; then
  log "PUSH PENDING: no GITHUB_PAT in .env — waiting for user to provide a token (repo scope)"
elif [ "$(bundled_count)" -lt 210 ]; then
  log "PUSH SKIPPED: bundled dataset incomplete ($(bundled_count) < 210)"
else
  RC=$(remote_bundled_count)
  log "remote bundled count: ${RC:-0}"
  if [ "${RC:-0}" -ge 210 ]; then
    log "remote already has the full dataset — no push needed"
  else
    log "remote incomplete → force-pushing local main (fresh single-commit history, $(bundled_count) patents)"
    if git push --force "https://${PAT}@github.com/${REPO_OWNER}/${REPO_NAME}.git" main:main > /tmp/push.out 2>&1; then
      log "PUSHED fresh history to ${REPO_OWNER}/${REPO_NAME} main ✔"
    else
      log "push FAILED — $(tail -1 /tmp/push.out 2>/dev/null)"
    fi
  fi
fi

log "done. DB=$AFTER patents, bundled=$(bundled_count), /tmp=$(valid_count)"
