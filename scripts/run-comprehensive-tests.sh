#!/bin/bash

set -e

echo "========================================="
echo "Running Comprehensive Test Suite"
echo "========================================="

export BASE_URL="${BASE_URL:-https://tradeai.gonxt.tech}"
export TENANT_ID="${TENANT_ID:-DIST-TEST}"
export RUN_ID="test-$(date +%s)"

echo "Environment:"
echo "  BASE_URL: $BASE_URL"
echo "  TENANT_ID: $TENANT_ID"
echo "  RUN_ID: $RUN_ID"
echo ""

run_suite() {
  local suite_name=$1
  local test_pattern=$2
  
  echo "========================================="
  echo "Running: $suite_name"
  echo "========================================="
  
  npx playwright test "$test_pattern" \
    --reporter=html,line \
    --workers=2 \
    || echo "⚠️  Some tests in $suite_name failed"
  
  echo ""
}

run_suite "Role-Based Tests" "tests/roles/*.spec.js"

run_suite "Workflow Tests" "tests/workflows/*.spec.js"

run_suite "AI/ML Tests" "tests/ai/*.spec.js"

run_suite "UI Smoke Tests" "tests/ui/smoke/*.spec.js"

run_suite "UI Critical Path Tests" "tests/ui/critical-path/*.spec.js"

echo "========================================="
echo "Test Suite Complete"
echo "========================================="
echo ""
echo "View HTML report:"
echo "  npx playwright show-report"
echo ""
echo "Test results saved to: test-results/"
echo "HTML report saved to: playwright-report/"
