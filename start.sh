#!/usr/bin/env bash
# start.sh — run the KALA portfolio dev server
set -e

cd "$(dirname "$0")"

# install deps on first run (or after they change)
if [ ! -d node_modules ]; then
  echo "→ Installing dependencies…"
  npm install
fi

# kill any stale dev server still holding port 3000 (serves old code otherwise)
STALE=$(lsof -ti:3000 2>/dev/null || true)
if [ -n "$STALE" ]; then
  echo "→ Stopping stale server on port 3000 (pid $STALE)…"
  kill -9 $STALE 2>/dev/null || true
fi

echo "→ Starting dev server at http://localhost:3000"
npm run dev
