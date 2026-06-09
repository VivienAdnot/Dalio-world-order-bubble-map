#!/usr/bin/env bash
# Browser feedback-loop runner for the Dalio bubble gauge.
#
# Drives cmux's built-in browser panel against the running dev server, runs the
# assertions in scripts/browser-checks.js, and prints a pass/fail report.
# Exits non-zero if any check fails — so it doubles as a gate.
#
#   npm run dev            # in one pane (Vite, http://localhost:5173)
#   scripts/browser-check.sh                 # check the default URL
#   scripts/browser-check.sh http://localhost:5173/#profiles   # check a deep link
#
# The browser surface is opened once and cached in /tmp so repeated runs reuse
# the same panel instead of spawning a new split each time.
set -euo pipefail

URL="${1:-http://localhost:5173/}"
CMUX="${CMUX_BIN:-${CMUX_BUNDLED_CLI_PATH:-cmux}}"
DIR="$(cd "$(dirname "$0")" && pwd)"
STATE="/tmp/dalio-browser-check.surface"

# Reuse a cached browser surface if it still responds; otherwise open a split.
SURF=""
if [ -f "$STATE" ]; then
  SURF="$(cat "$STATE")"
  "$CMUX" browser --surface "$SURF" get url >/dev/null 2>&1 || SURF=""
fi
if [ -z "$SURF" ]; then
  SURF="$("$CMUX" browser open-split "$URL" \
    ${CMUX_WORKSPACE_ID:+--workspace "$CMUX_WORKSPACE_ID"} --focus false 2>&1 \
    | grep -o 'surface:[0-9]*' | head -1)"
  [ -z "$SURF" ] && { echo "✗ could not open a cmux browser surface"; exit 2; }
  echo "$SURF" >"$STATE"
fi

# Clean reload so view state never leaks between runs (it's a hash-routed SPA,
# and the surface is reused). goto then reload guarantees a fresh mount.
"$CMUX" browser --surface "$SURF" goto "$URL" >/dev/null 2>&1
"$CMUX" browser --surface "$SURF" reload >/dev/null 2>&1 || true
"$CMUX" browser --surface "$SURF" wait --load-state complete --timeout 20 >/dev/null 2>&1 || true
# Wait for the app to actually mount: ECharts only creates the <canvas> once
# main.ts has run and the first render fired. Asserting before this races.
"$CMUX" browser --surface "$SURF" wait --selector "#chart canvas" --timeout 15 >/dev/null 2>&1 || true

# A freshly opened/just-loaded webview can return an empty eval before the app
# module has mounted — retry until we get a JSON payload (or give up).
CHECKS="$(cat "$DIR/browser-checks.js")"
RESULT=""
for attempt in 1 2 3 4 5; do
  RESULT="$("$CMUX" browser --surface "$SURF" eval --script "$CHECKS" 2>&1)"
  case "$RESULT" in
    *'"results"'*) break ;;
    *) sleep 0.5 ;;
  esac
done

RESULT="$RESULT" URL="$URL" python3 <<'PY'
import os, sys, json
url = os.environ["URL"]
raw = os.environ["RESULT"]
try:
    d = json.loads(raw)
except Exception:
    print("✗ could not parse eval output:\n" + raw)
    sys.exit(2)
print(f"\nbrowser checks · {url}")
for r in d["results"]:
    mark = "✓" if r["ok"] else "✗"
    line = f"  {mark} {r['name']}"
    if not r["ok"] and r["detail"]:
        line += f"  →  {r['detail']}"
    print(line)
print(f"\n{d['passed']} passed, {d['failed']} failed")
sys.exit(0 if d["failed"] == 0 else 1)
PY
