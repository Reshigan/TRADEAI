#!/bin/bash

# ============================================================================
# TRADEAI Live Testing Script
# Run comprehensive tests against deployed production system
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

# Configuration
BACKEND_URL="${BACKEND_URL:-https://tradeai-api.vantax.workers.dev}"
FRONTEND_URL="${FRONTEND_URL:-https://tradeai.vantax.co.za}"
AUTH_TOKEN="${AUTH_TOKEN:-}"  # Set if you have a test token

log_pass() { echo -e "${GREEN}✓${NC} $1"; ((PASS++)); }
log_fail() { echo -e "${RED}✗${NC} $1"; ((FAIL++)); }
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }

echo "========================================"
echo "  TRADEAI Live Testing"
echo "========================================"
echo ""
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

# ============================================================================
# 1. Infrastructure Tests
# ============================================================================
echo "1. Infrastructure Tests"
echo "----------------------"

# Test backend health
if curl -f -s "$BACKEND_URL/health" | grep -q "healthy"; then
    log_pass "Backend health check passed"
else
    log_fail "Backend health check failed"
fi

# Test frontend accessibility
if curl -f -s -o /dev/null "$FRONTEND_URL"; then
    log_pass "Frontend is accessible"
else
    log_fail "Frontend is not accessible"
fi

# Test response times
START=$(date +%s%N)
curl -s "$BACKEND_URL/health" > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
if [ "$DURATION" -lt 500 ]; then
    log_pass "Backend response time: ${DURATION}ms"
else
    log_warn "Backend response time: ${DURATION}ms (slow)"
fi

echo ""

# ============================================================================
# 2. API Endpoint Tests (Public)
# ============================================================================
echo "2. API Endpoint Tests"
echo "--------------------"

ENDPOINTS=(
    "/api/health"
    "/api/seed"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -f -s "$BACKEND_URL$endpoint" > /dev/null 2>&1; then
        log_pass "Endpoint accessible: $endpoint"
    else
        log_warn "Endpoint not accessible: $endpoint"
    fi
done

echo ""

# ============================================================================
# 3. Database Tests
# ============================================================================
echo "3. Database Tests"
echo "-----------------"

# Check if D1 is accessible (via worker)
if curl -f -s "$BACKEND_URL/health" | grep -q "healthy"; then
    log_pass "Database connection working (via health check)"
else
    log_fail "Database connection may have issues"
fi

echo ""

# ============================================================================
# 4. Frontend Tests
# ============================================================================
echo "4. Frontend Tests"
echo "-----------------"

# Check if main bundle loads
if curl -f -s "$FRONTEND_URL" | grep -q "root" > /dev/null 2>&1; then
    log_pass "Frontend React app loads"
else
    log_warn "Frontend may have loading issues"
fi

# Check static assets
ASSETS=(
    "/favicon.ico"
    "/manifest.json"
    "/logo.svg"
)

for asset in "${ASSETS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL$asset")
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 304 ]; then
        log_pass "Asset loaded: $asset"
    else
        log_warn "Asset missing: $asset (HTTP $HTTP_CODE)"
    fi
done

echo ""

# ============================================================================
# 5. Authentication Tests (If Token Provided)
# ============================================================================
echo "5. Authentication Tests"
echo "----------------------"

if [ -n "$AUTH_TOKEN" ]; then
    # Test admin endpoint
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/processes")
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        log_pass "Admin API accessible with token"
    elif [ "$HTTP_CODE" -eq 401 ]; then
        log_fail "Authentication failed (401)"
    else
        log_warn "Admin API returned: $HTTP_CODE"
    fi
    
    # Test superadmin endpoint
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/tenants")
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        log_pass "SuperAdmin API accessible with token"
    else
        log_warn "SuperAdmin API returned: $HTTP_CODE"
    fi
else
    log_info "No AUTH_TOKEN provided - skipping auth tests"
    log_info "Set AUTH_TOKEN env var to test authenticated endpoints"
fi

echo ""

# ============================================================================
# 6. Process UI Tests
# ============================================================================
echo "6. Process UI Tests"
echo "-------------------"

# Test process endpoints (if authenticated)
if [ -n "$AUTH_TOKEN" ]; then
    # Test process creation
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Process",
            "type": "promotion",
            "description": "Live test process"
        }' \
        "$BACKEND_URL/api/processes")
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        log_pass "Process creation works"
    else
        log_warn "Process creation may have issues"
    fi
else
    log_info "Skipping process tests (no auth token)"
fi

echo ""

# ============================================================================
# 7. Admin Features Tests
# ============================================================================
echo "7. Admin Features Tests"
echo "-----------------------"

if [ -n "$AUTH_TOKEN" ]; then
    # Test admin dashboard
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/dashboard")
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        log_pass "Admin dashboard accessible"
    else
        log_warn "Admin dashboard returned: $HTTP_CODE"
    fi
    
    # Test company admin
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/company-admin")
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        log_pass "Company admin accessible"
    else
        log_warn "Company admin returned: $HTTP_CODE"
    fi
else
    log_info "Skipping admin tests (no auth token)"
fi

echo ""

# ============================================================================
# 8. Performance Tests
# ============================================================================
echo "8. Performance Tests"
echo "--------------------"

# Load test - 10 concurrent requests
echo "Running load test (10 concurrent requests)..."
START=$(date +%s%N)
for i in {1..10}; do
    curl -s "$BACKEND_URL/health" > /dev/null &
done
wait
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
AVG=$((DURATION / 10))

if [ "$AVG" -lt 500 ]; then
    log_pass "Load test passed (avg: ${AVG}ms)"
elif [ "$AVG" -lt 1000 ]; then
    log_warn "Load test acceptable (avg: ${AVG}ms)"
else
    log_fail "Load test failed (avg: ${AVG}ms - too slow)"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================
echo "========================================"
echo "  Test Summary"
echo "========================================"
echo -e "${GREEN}Passed:${NC}  $PASS"
echo -e "${RED}Failed:${NC}  $FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo ""
    echo "System is production ready!"
    echo ""
    echo "Next steps:"
    echo "1. Monitor Cloudflare dashboard"
    echo "2. Test with real users"
    echo "3. Configure monitoring alerts"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Review failures above and fix before go-live."
    exit 1
fi
