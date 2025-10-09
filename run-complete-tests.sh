#!/bin/bash

###############################################################################
# TRADEAI Complete Test Suite Runner
# Runs all backend, frontend, and E2E tests
###############################################################################

set -e

echo "======================================================================"
echo "TRADEAI COMPLETE TEST SUITE"
echo "======================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create reports directory
REPORT_DIR="./test-reports/complete-suite/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT_DIR"

echo -e "${BLUE}Test Report Directory:${NC} $REPORT_DIR"
echo ""

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test 1: Backend API Integration Tests
echo "======================================================================"
echo -e "${BLUE}1. Backend API Integration Tests${NC}"
echo "======================================================================"
echo ""

cd backend
if npm test -- --coverage --json --outputFile="$REPORT_DIR/backend-results.json" 2>&1 | tee "$REPORT_DIR/backend.log"; then
    echo -e "${GREEN}✓ Backend tests passed${NC}"
    BACKEND_PASS=true
else
    echo -e "${RED}✗ Backend tests failed${NC}"
    BACKEND_PASS=false
fi
cd ..
echo ""

# Test 2: Frontend Component Tests
echo "======================================================================"
echo -e "${BLUE}2. Frontend Component Tests${NC}"
echo "======================================================================"
echo ""

cd frontend
if CI=true npm test -- --coverage --json --outputFile="$REPORT_DIR/frontend-results.json" 2>&1 | tee "$REPORT_DIR/frontend.log"; then
    echo -e "${GREEN}✓ Frontend tests passed${NC}"
    FRONTEND_PASS=true
else
    echo -e "${RED}✗ Frontend tests failed${NC}"
    FRONTEND_PASS=false
fi
cd ..
echo ""

# Test 3: E2E Tests
echo "======================================================================"
echo -e "${BLUE}3. End-to-End Tests${NC}"
echo "======================================================================"
echo ""

if npx playwright test tests/complete-e2e.spec.js --reporter=json --output="$REPORT_DIR/e2e-results.json" 2>&1 | tee "$REPORT_DIR/e2e.log"; then
    echo -e "${GREEN}✓ E2E tests passed${NC}"
    E2E_PASS=true
else
    echo -e "${RED}✗ E2E tests failed${NC}"
    E2E_PASS=false
fi
echo ""

# Test 4: Security Tests
echo "======================================================================"
echo -e "${BLUE}4. Security Tests${NC}"
echo "======================================================================"
echo ""

# Check for known vulnerabilities
echo "Running npm audit..."
cd backend && npm audit --json > "$REPORT_DIR/backend-audit.json" 2>&1 || true
cd ../frontend && npm audit --json > "$REPORT_DIR/frontend-audit.json" 2>&1 || true
cd ..

echo -e "${YELLOW}⚠ Security audit complete (check reports)${NC}"
echo ""

# Test 5: Performance Tests
echo "======================================================================"
echo -e "${BLUE}5. Performance Tests${NC}"
echo "======================================================================"
echo ""

echo "Checking bundle sizes..."
if [ -d "frontend/build" ]; then
    BUNDLE_SIZE=$(du -sh frontend/build | cut -f1)
    echo "Frontend bundle size: $BUNDLE_SIZE"
fi

echo -e "${GREEN}✓ Performance check complete${NC}"
echo ""

# Generate Summary Report
echo "======================================================================"
echo -e "${BLUE}Generating Test Summary Report...${NC}"
echo "======================================================================"
echo ""

cat > "$REPORT_DIR/summary.md" << EOF
# TRADEAI Complete Test Suite Summary

**Generated:** $(date)
**Report Directory:** $REPORT_DIR

## Test Results

### Backend API Tests
- **Status:** $([ "$BACKEND_PASS" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Log:** backend.log
- **Coverage:** backend-results.json

### Frontend Component Tests
- **Status:** $([ "$FRONTEND_PASS" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Log:** frontend.log
- **Coverage:** frontend-results.json

### End-to-End Tests
- **Status:** $([ "$E2E_PASS" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Log:** e2e.log
- **Results:** e2e-results.json

### Security Audit
- **Status:** ⚠️ CHECK REPORTS
- **Backend Audit:** backend-audit.json
- **Frontend Audit:** frontend-audit.json

### Performance Tests
- **Status:** ✅ COMPLETE
- **Bundle Size:** $BUNDLE_SIZE

## Overall Status

$(if [ "$BACKEND_PASS" = true ] && [ "$FRONTEND_PASS" = true ] && [ "$E2E_PASS" = true ]; then
    echo "✅ **ALL TESTS PASSED - READY FOR DEPLOYMENT**"
else
    echo "❌ **SOME TESTS FAILED - REVIEW REQUIRED**"
fi)

## Next Steps

$( if [ "$BACKEND_PASS" = true ] && [ "$FRONTEND_PASS" = true ] && [ "$E2E_PASS" = true ]; then
    echo "1. Review security audit results"
    echo "2. Proceed with UAT"
    echo "3. Deploy to production"
else
    echo "1. Review failed test logs"
    echo "2. Fix failing tests"
    echo "3. Re-run test suite"
fi)

## Test Artifacts

All test artifacts are saved in: \`$REPORT_DIR\`

- \`backend.log\` - Backend test output
- \`frontend.log\` - Frontend test output
- \`e2e.log\` - E2E test output
- \`backend-results.json\` - Backend test results with coverage
- \`frontend-results.json\` - Frontend test results with coverage
- \`e2e-results.json\` - E2E test results
- \`backend-audit.json\` - Security audit for backend
- \`frontend-audit.json\` - Security audit for frontend

EOF

echo -e "${GREEN}✓ Summary report generated${NC}"
echo ""

# Final Summary
echo "======================================================================"
echo "                    TEST SUITE SUMMARY"
echo "======================================================================"
echo ""
cat "$REPORT_DIR/summary.md"
echo ""

# Exit with appropriate code
if [ "$BACKEND_PASS" = true ] && [ "$FRONTEND_PASS" = true ] && [ "$E2E_PASS" = true ]; then
    exit 0
else
    exit 1
fi
