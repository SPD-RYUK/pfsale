#!/usr/bin/env bash
# PatentSale keep-alive cron job — runs every 18 minutes (1080 seconds).
#
# Purpose:
#   1. Pings the dev server on port 3000 to keep it warm. This also keeps
#      Neon's serverless Postgres warm in production (Neon's free tier scales
#      compute to zero after ~5 min of inactivity → ~500ms–few-sec cold start).
#   2. If the dev server has died (OOM-kill, sandbox reaper, crash), restarts it
#      automatically so the Preview Panel always has a live server.
#
# This script replaces a traditional crontab entry (the sandbox has no cron
# daemon / crontab binary). It is launched detached via `setsid nohup` so it
# survives session teardown. Schedule: every 18 minutes = 1080 seconds.
#
# To start:   setsid nohup bash scripts/keepalive.sh </dev/null >keepalive-daemon.log 2>&1 &
# To stop:    pkill -f scripts/keepalive.sh
# To inspect: tail -f keepalive.log

set -u
PROJECT_DIR="/home/z/my-project"
cd "$PROJECT_DIR" || exit 1

PORT=3000
HEALTH_URL="http://127.0.0.1:${PORT}/"
INTERVAL_SECONDS=1080   # 18 minutes
LOG="$PROJECT_DIR/keepalive.log"

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S %Z') | $*" >> "$LOG"
}

# Ensure the log doesn't grow unbounded — keep last 500 lines.
trim_log() {
  if [ -f "$LOG" ] && [ "$(wc -l < "$LOG" 2>/dev/null || echo 0)" -gt 500 ]; then
    tail -n 200 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
  fi
}

start_dev_server() {
  log "dev server DOWN — restarting…"
  pkill -9 -f "next dev" 2>/dev/null || true
  pkill -9 -f "bun run dev" 2>/dev/null || true
  sleep 1
  # Double-fork via setsid so the process is reparented to init (PID 1) and
  # survives the sandbox's session teardown / process reaper.
  ( setsid bash -c 'cd /home/z/my-project && bun run dev' </dev/null >dev.log 2>&1 & )
  # Wait up to 45s for it to come up
  for i in $(seq 1 45); do
    if curl -s -m 2 -o /dev/null "$HEALTH_URL" 2>/dev/null; then
      log "dev server restarted and responding (after ${i}s)"
      return 0
    fi
    sleep 1
  done
  log "ERROR: dev server did not come up within 40s"
  return 1
}

ping_server() {
  local code
  code=$(curl -s -m 8 -o /dev/null -w '%{http_code}' "$HEALTH_URL" 2>/dev/null)
  # curl prints "000" when it cannot connect; non-zero exit also means failure.
  if [ -z "$code" ] || [ "$code" = "000" ]; then
    return 1
  fi
  log "ping OK (HTTP $code)"
  return 0
}

log "=== keep-alive daemon started (interval=${INTERVAL_SECONDS}s / 18min) ==="

while true; do
  trim_log
  if ! ping_server; then
    start_dev_server
  fi
  sleep "$INTERVAL_SECONDS"
done
