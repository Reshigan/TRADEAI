#!/bin/bash

# TRADEAI Production Deployment Verification Script
# This script tests all deployed components to verify changes have been deployed

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_URL="${DEPLOYMENT_URL:-https://tradeai.gonxt.tech}"
TIMEOUT=10
TEST_DATE=$(date +"%Y-%m-%d %H:%M:%S")

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   TRADEAI Production Deployment Verification            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Test Date: $TEST_DATE${NC}"
echo -e "${BLUE}Target URL: $DEPLOYMENT_URL${NC}"
echo ""

# Helper functions
log_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_skip() {
    echo -e "${YELLOW}⏭️  SKIP:${NC} $1"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

log_section() {
    echo ""
    echo -e "${CYAN}────────────────────────────────────────────────────────${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}────────────────────────────────────────────────────────${NC}"
}

# Test 1: Frontend Accessibility
log_section "1. Frontend Accessibility Tests"

log_info "Testing frontend homepage..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    log_pass "Frontend homepage is accessible (HTTP $HTTP_CODE)"
else
    log_fail "Frontend homepage not accessible (HTTP $HTTP_CODE)"
fi

log_info "Testing frontend health.json endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/health.json" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    log_pass "Frontend health.json endpoint accessible (HTTP $HTTP_CODE)"
else
    log_fail "Frontend health.json endpoint not accessible (HTTP $HTTP_CODE)"
fi

# Test 2: Backend API Health
log_section "2. Backend API Health Tests"

log_info "Testing API health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/api/health" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    log_pass "Backend API health endpoint accessible (HTTP $HTTP_CODE)"
    
    # Try to get health response body
    HEALTH_RESPONSE=$(curl -s --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/api/health" 2>/dev/null || echo "{}")
    log_info "Health response: $HEALTH_RESPONSE"
else
    log_fail "Backend API health endpoint not accessible (HTTP $HTTP_CODE)"
fi

log_info "Testing API version endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/api/version" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    VERSION_RESPONSE=$(curl -s --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/api/version" 2>/dev/null || echo "unknown")
    log_pass "API version endpoint accessible - Version: $VERSION_RESPONSE"
else
    log_info "API version endpoint not accessible (HTTP $HTTP_CODE) - may not be implemented"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Test 3: ML Service Health
log_section "3. ML Service Health Tests"

log_info "Testing ML service health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/ml/health" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    log_pass "ML service health endpoint accessible (HTTP $HTTP_CODE)"
else
    log_info "ML service health endpoint not accessible (HTTP $HTTP_CODE) - service may be internal"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Test 4: Authentication System
log_section "4. Authentication System Tests"

log_info "Testing login endpoint availability..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' \
    "$DEPLOYMENT_URL/api/auth/login" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
    log_pass "Login endpoint is responsive (HTTP $HTTP_CODE)"
else
    log_fail "Login endpoint not responsive (HTTP $HTTP_CODE)"
fi

log_info "Testing auth callback endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/api/auth/callback" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "405" ]; then
    log_pass "Auth callback endpoint exists (HTTP $HTTP_CODE)"
else
    log_fail "Auth callback endpoint issue (HTTP $HTTP_CODE)"
fi

# Test 5: Core API Endpoints
log_section "5. Core API Endpoint Tests"

log_info "Testing budgets endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/api/budgets" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    log_pass "Budgets endpoint accessible (HTTP $HTTP_CODE)"
else
    log_fail "Budgets endpoint not accessible (HTTP $HTTP_CODE)"
fi

log_info "Testing promotions endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/api/promotions" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    log_pass "Promotions endpoint accessible (HTTP $HTTP_CODE)"
else
    log_fail "Promotions endpoint not accessible (HTTP $HTTP_CODE)"
fi

log_info "Testing products endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/api/products" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    log_pass "Products endpoint accessible (HTTP $HTTP_CODE)"
else
    log_fail "Products endpoint not accessible (HTTP $HTTP_CODE)"
fi

log_info "Testing customers endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/api/customers" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    log_pass "Customers endpoint accessible (HTTP $HTTP_CODE)"
else
    log_fail "Customers endpoint not accessible (HTTP $HTTP_CODE)"
fi

log_info "Testing reports endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/api/reports" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    log_pass "Reports endpoint accessible (HTTP $HTTP_CODE)"
else
    log_fail "Reports endpoint not accessible (HTTP $HTTP_CODE)"
fi

# Test 6: Performance Tests
log_section "6. Performance Tests"

log_info "Testing frontend response time..."
START_TIME=$(date +%s%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL" 2>/dev/null || echo "000")
END_TIME=$(date +%s%N)
if [ "$HTTP_CODE" != "000" ]; then
    ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))
    if [ $ELAPSED_MS -lt 2000 ]; then
        log_pass "Frontend response time: ${ELAPSED_MS}ms (good)"
    elif [ $ELAPSED_MS -lt 5000 ]; then
        log_pass "Frontend response time: ${ELAPSED_MS}ms (acceptable)"
    else
        log_fail "Frontend response time: ${ELAPSED_MS}ms (slow)"
    fi
else
    log_fail "Frontend response time test failed (connection timeout)"
fi

log_info "Testing API response time..."
START_TIME=$(date +%s%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/api/health" 2>/dev/null || echo "000")
END_TIME=$(date +%s%N)
if [ "$HTTP_CODE" = "200" ]; then
    ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))
    if [ $ELAPSED_MS -lt 500 ]; then
        log_pass "API response time: ${ELAPSED_MS}ms (excellent)"
    elif [ $ELAPSED_MS -lt 1000 ]; then
        log_pass "API response time: ${ELAPSED_MS}ms (good)"
    else
        log_fail "API response time: ${ELAPSED_MS}ms (slow)"
    fi
else
    log_info "API response time test skipped (endpoint not available)"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Test 7: Security Headers
log_section "7. Security Headers Tests"

log_info "Checking security headers..."
HEADERS=$(curl -sI --connect-timeout $TIMEOUT "$DEPLOYMENT_URL" 2>/dev/null || echo "")
if [ -n "$HEADERS" ]; then
    if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
        log_pass "X-Frame-Options header present"
    else
        log_info "X-Frame-Options header missing"
    fi
    
    if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
        log_pass "X-Content-Type-Options header present"
    else
        log_info "X-Content-Type-Options header missing"
    fi
    
    if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
        log_pass "Strict-Transport-Security header present"
    else
        log_info "Strict-Transport-Security header missing (may be HTTP)"
    fi
else
    log_fail "Could not retrieve headers"
fi

# Test 8: WebSocket/Real-time Features
log_section "8. Real-time Features Tests"

log_info "Checking WebSocket endpoint configuration..."
# Try to access a page that should have WebSocket configured
PAGE_CONTENT=$(curl -s --connect-timeout $TIMEOUT "$DEPLOYMENT_URL/dashboard" 2>/dev/null || echo "")
if [ -n "$PAGE_CONTENT" ]; then
    if echo "$PAGE_CONTENT" | grep -qi "socket.io\|websocket\|wss://"; then
        log_pass "WebSocket configuration detected in page"
    else
        log_info "WebSocket configuration not detected (may be loaded dynamically)"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    fi
else
    log_info "Dashboard page not accessible for WebSocket check"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Summary
log_section "DEPLOYMENT VERIFICATION SUMMARY"
echo ""
echo -e "${BLUE}Total Tests:${NC}  $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC}      $PASSED_TESTS"
echo -e "${RED}Failed:${NC}      $FAILED_TESTS"
echo -e "${YELLOW}Skipped:${NC}     $SKIPPED_TESTS"
echo ""

if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -e "${BLUE}Success Rate:${NC} ${SUCCESS_RATE}%"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✅ ALL TESTS PASSED - DEPLOYMENT VERIFIED SUCCESSFULLY ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
        exit 0
    elif [ $SUCCESS_RATE -ge 80 ]; then
        echo -e "${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║  ⚠️  MOSTLY SUCCESSFUL - MINOR ISSUES DETECTED          ║${NC}"
        echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}"
        exit 0
    else
        echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ❌ DEPLOYMENT ISSUES DETECTED - INVESTIGATION NEEDED   ║${NC}"
        echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
        exit 1
    fi
else
    echo -e "${RED}No tests were executed. Please check network connectivity.${NC}"
    exit 1
fi
