#!/bin/bash

set -e

echo "========================================="
echo "Running Smoke Tests"
echo "========================================="

export BASE_URL="${BASE_URL:-https://tradeai.gonxt.tech}"
export TENANT_ID="${TENANT_ID:-DIST-TEST}"
export RUN_ID="smoke-$(date +%s)"

npx playwright test tests/ui/smoke/*.spec.js \
  --reporter=line \
  --workers=4 \
  --max-failures=5

echo "✅ Smoke tests complete"
