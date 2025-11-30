#!/bin/bash


set -e

# Configuration
COMPANY_TYPE=${1:-"distributor"}
RUN_ID=${2:-"run-$(date +%s)"}
SEED=${3:-$(date +%s)}
BASE_URL=${BASE_URL:-"https://tradeai.gonxt.tech/api"}

echo "=========================================="
echo "Comprehensive Regression Test Suite"
echo "=========================================="
echo "Company Type: $COMPANY_TYPE"
echo "Run ID: $RUN_ID"
echo "Seed: $SEED"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

echo "📊 Step 1: Running month-long simulation..."
node scripts/simulate/simulator/monthOrchestrator.js "$COMPANY_TYPE" "$RUN_ID" "$SEED"

if [ $? -ne 0 ]; then
  echo "❌ Simulation failed"
  exit 1
fi

echo "✅ Simulation complete"
echo ""

echo "🔍 Step 2: Running API validation tests..."
export RUN_ID="$RUN_ID"
export BASE_URL="$BASE_URL"

npx playwright test tests/regression/api/$COMPANY_TYPE/ --reporter=list

if [ $? -ne 0 ]; then
  echo "❌ API validation tests failed"
  exit 1
fi

echo "✅ API validation tests passed"
echo ""

echo "🖥️  Step 3: Running UI regression tests..."
npx playwright test tests/regression/ui/$COMPANY_TYPE/ --reporter=list --project=chromium

if [ $? -ne 0 ]; then
  echo "❌ UI regression tests failed"
  exit 1
fi

echo "✅ UI regression tests passed"
echo ""

echo "📋 Step 4: Generating summary report..."
cat > "artifacts/ledger/$RUN_ID/summary.txt" << EOF
Regression Test Summary
=======================
Company Type: $COMPANY_TYPE
Run ID: $RUN_ID
Seed: $SEED
Date: $(date)

Results:
✅ Simulation: PASSED
✅ API Validation: PASSED
✅ UI Regression: PASSED

Status: ALL TESTS PASSED
EOF

echo "✅ Summary report generated"
echo ""

echo "=========================================="
echo "✅ All regression tests passed!"
echo "=========================================="
echo ""
echo "Artifacts saved to: artifacts/ledger/$RUN_ID/"
echo ""

exit 0
