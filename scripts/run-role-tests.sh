#!/bin/bash

set -e

ROLE="${1:-all}"

echo "========================================="
echo "Running Role Tests: $ROLE"
echo "========================================="

export BASE_URL="${BASE_URL:-https://tradeai.gonxt.tech}"
export TENANT_ID="${TENANT_ID:-DIST-TEST}"
export RUN_ID="role-$(date +%s)"

if [ "$ROLE" = "all" ]; then
  npx playwright test tests/roles/*.spec.js \
    --reporter=html,line \
    --workers=2
else
  npx playwright test "tests/roles/${ROLE}.spec.js" \
    --reporter=html,line \
    --workers=1
fi

echo "✅ Role tests complete"
