#!/bin/bash

# TRADEAI Backend Integration Testing Script
# Tests all API endpoints and authentication flow
# Version: 1.0

set -e

# Configuration
API_URL="${API_URL:-https://tradeai.gonxt.tech/api}"
TEST_EMAIL="${TEST_EMAIL:-test@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-Test123!@#}"
OUTPUT_FILE="${OUTPUT_FILE:-integration-test-results.json}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Global variables
ACCESS_TOKEN=""
REFRESH_TOKEN=""
TEST_RESULTS=()
PASSED=0
FAILED=0

# Helper functions
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
    TEST_RESULTS+=("PASS: $1")
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
    TEST_RESULTS+=("FAIL: $1")
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Test functions
test_api_health() {
    log_test "Testing API health endpoint..."
    
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/health" --max-time 10)
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        log_pass "API health check (HTTP $status)"
        log_info "Response: $body"
        return 0
    else
        log_fail "API health check (HTTP $status)"
        return 1
    fi
}

test_login() {
    log_test "Testing login endpoint..."
    
    local response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        --max-time 10)
    
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        # Extract tokens using grep/sed (portable)
        ACCESS_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        REFRESH_TOKEN=$(echo "$body" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
        
        if [ -n "$ACCESS_TOKEN" ]; then
            log_pass "Login successful (HTTP $status)"
            log_info "Access token received: ${ACCESS_TOKEN:0:20}..."
            return 0
        else
            log_fail "Login returned 200 but no access token"
            return 1
        fi
    else
        log_fail "Login failed (HTTP $status)"
        log_info "Response: $body"
        return 1
    fi
}

test_invalid_login() {
    log_test "Testing invalid login..."
    
    local response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"invalid@example.com","password":"wrongpassword"}' \
        --max-time 10)
    
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "401" ] || [ "$status" = "400" ]; then
        log_pass "Invalid login rejected correctly (HTTP $status)"
        return 0
    else
        log_fail "Invalid login not rejected properly (HTTP $status)"
        return 1
    fi
}

test_get_current_user() {
    log_test "Testing get current user..."
    
    if [ -z "$ACCESS_TOKEN" ]; then
        log_fail "No access token available"
        return 1
    fi
    
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/auth/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        --max-time 10)
    
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        log_pass "Get current user (HTTP $status)"
        log_info "User data: $body"
        return 0
    else
        log_fail "Get current user failed (HTTP $status)"
        return 1
    fi
}

test_protected_route_without_token() {
    log_test "Testing protected route without token..."
    
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/customers" --max-time 10)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "401" ]; then
        log_pass "Protected route blocked without token (HTTP $status)"
        return 0
    else
        log_fail "Protected route accessible without token (HTTP $status)"
        return 1
    fi
}

test_protected_route_with_token() {
    log_test "Testing protected route with token..."
    
    if [ -z "$ACCESS_TOKEN" ]; then
        log_fail "No access token available"
        return 1
    fi
    
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/customers" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        --max-time 10)
    
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        log_pass "Protected route accessible with token (HTTP $status)"
        return 0
    else
        log_fail "Protected route failed with token (HTTP $status)"
        log_info "Response: $body"
        return 1
    fi
}

test_token_refresh() {
    log_test "Testing token refresh..."
    
    if [ -z "$REFRESH_TOKEN" ]; then
        log_fail "No refresh token available"
        return 1
    fi
    
    local response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/refresh" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $REFRESH_TOKEN" \
        --max-time 10)
    
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        local new_token=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        
        if [ -n "$new_token" ]; then
            log_pass "Token refresh successful (HTTP $status)"
            log_info "New token: ${new_token:0:20}..."
            ACCESS_TOKEN="$new_token"
            return 0
        else
            log_fail "Token refresh returned 200 but no new token"
            return 1
        fi
    else
        log_fail "Token refresh failed (HTTP $status)"
        return 1
    fi
}

test_customers_api() {
    log_test "Testing customers API endpoints..."
    
    if [ -z "$ACCESS_TOKEN" ]; then
        log_fail "No access token available"
        return 1
    fi
    
    # GET customers
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/customers" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        --max-time 10)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        log_pass "GET /customers (HTTP $status)"
    else
        log_fail "GET /customers (HTTP $status)"
        return 1
    fi
    
    return 0
}

test_products_api() {
    log_test "Testing products API endpoints..."
    
    if [ -z "$ACCESS_TOKEN" ]; then
        log_fail "No access token available"
        return 1
    fi
    
    # GET products
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/products" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        --max-time 10)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        log_pass "GET /products (HTTP $status)"
    else
        log_fail "GET /products (HTTP $status)"
        return 1
    fi
    
    return 0
}

test_budgets_api() {
    log_test "Testing budgets API endpoints..."
    
    if [ -z "$ACCESS_TOKEN" ]; then
        log_fail "No access token available"
        return 1
    fi
    
    # GET budgets
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/budgets" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        --max-time 10)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ]; then
        log_pass "GET /budgets (HTTP $status)"
    else
        log_fail "GET /budgets (HTTP $status)"
        return 1
    fi
    
    return 0
}

test_cors_headers() {
    log_test "Testing CORS headers..."
    
    local response=$(curl -s -I -X OPTIONS "$API_URL/auth/login" \
        -H "Origin: https://your-domain.com" \
        -H "Access-Control-Request-Method: POST" \
        --max-time 10)
    
    if echo "$response" | grep -qi "Access-Control-Allow-Origin"; then
        log_pass "CORS headers present"
        return 0
    else
        log_fail "CORS headers missing"
        return 1
    fi
}

test_logout() {
    log_test "Testing logout endpoint..."
    
    if [ -z "$ACCESS_TOKEN" ]; then
        log_fail "No access token available"
        return 1
    fi
    
    local response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/logout" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        --max-time 10)
    
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ] || [ "$status" = "204" ]; then
        log_pass "Logout successful (HTTP $status)"
        return 0
    else
        log_fail "Logout failed (HTTP $status)"
        return 1
    fi
}

# Generate report
generate_report() {
    echo ""
    echo "=========================================="
    echo "  Integration Test Report                 "
    echo "=========================================="
    echo ""
    echo "API URL: $API_URL"
    echo "Date: $(date)"
    echo ""
    echo "Results:"
    echo "  Passed: $PASSED"
    echo "  Failed: $FAILED"
    echo "  Total:  $((PASSED + FAILED))"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo "Status: 🟢 ALL TESTS PASSED"
    else
        echo "Status: 🔴 SOME TESTS FAILED"
    fi
    
    echo "=========================================="
    echo ""
    echo "Detailed Results:"
    for result in "${TEST_RESULTS[@]}"; do
        echo "  $result"
    done
    echo ""
    
    # Save to file
    cat > "$OUTPUT_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "api_url": "$API_URL",
  "passed": $PASSED,
  "failed": $FAILED,
  "total": $((PASSED + FAILED)),
  "success": $([ $FAILED -eq 0 ] && echo "true" || echo "false"),
  "results": [
$(printf '    "%s"' "${TEST_RESULTS[0]}")
$(printf ',\n    "%s"' "${TEST_RESULTS[@]:1}")
  ]
}
EOF
    
    log_info "Report saved to: $OUTPUT_FILE"
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "  TRADEAI Backend Integration Tests       "
    echo "=========================================="
    echo ""
    log_info "Testing API: $API_URL"
    log_info "Test user: $TEST_EMAIL"
    echo ""
    
    # Run tests in order
    test_api_health
    echo ""
    
    test_invalid_login
    echo ""
    
    test_login
    echo ""
    
    test_get_current_user
    echo ""
    
    test_protected_route_without_token
    echo ""
    
    test_protected_route_with_token
    echo ""
    
    test_token_refresh
    echo ""
    
    test_customers_api
    echo ""
    
    test_products_api
    echo ""
    
    test_budgets_api
    echo ""
    
    test_cors_headers
    echo ""
    
    test_logout
    echo ""
    
    # Generate report
    generate_report
    
    # Exit with failure if any tests failed
    if [ $FAILED -gt 0 ]; then
        exit 1
    fi
    
    exit 0
}

# Run main
main "$@"
