#!/bin/bash

# Comprehensive UAT Test Suite for TRADEAI
# This script performs detailed user acceptance testing on the entire system

set +e  # Continue on errors

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Issues array
declare -a ISSUES
declare -a CRITICAL_ISSUES
declare -a WARNINGS_LIST

# Base URLs
BACKEND_URL="http://localhost:5002"
FRONTEND_URL="http://localhost:3000"

# Helper functions
pass_test() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED_TESTS++))
  ((TOTAL_TESTS++))
}

fail_test() {
  echo -e "${RED}✗${NC} $1"
  ISSUES+=("$1")
  ((FAILED_TESTS++))
  ((TOTAL_TESTS++))
}

critical_fail() {
  echo -e "${RED}✗ CRITICAL:${NC} $1"
  CRITICAL_ISSUES+=("$1")
  ISSUES+=("$1")
  ((FAILED_TESTS++))
  ((TOTAL_TESTS++))
}

warn_test() {
  echo -e "${YELLOW}⚠${NC} $1"
  WARNINGS_LIST+=("$1")
  ((WARNINGS++))
}

section_header() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} $1"
  echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
  echo ""
}

# Main test execution
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  TRADEAI - COMPREHENSIVE USER ACCEPTANCE TESTING      ║"
echo "║  Critical & Detailed System Validation               ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# ==================== SECTION 1: SERVER HEALTH ====================
section_header "1. SERVER HEALTH & CONNECTIVITY"

# Test backend health
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
  pass_test "Backend server is running"
else
  critical_fail "Backend server is NOT running or not accessible"
fi

# Test frontend health
if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
  pass_test "Frontend server is running"
else
  critical_fail "Frontend server is NOT running or not accessible"
fi

# Test database connectivity
db_response=$(curl -s "$BACKEND_URL/api/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123","tenantId":"mondelez"}')
if echo "$db_response" | grep -q '"success":true'; then
  pass_test "Database connectivity working"
else
  critical_fail "Database connectivity FAILED"
fi

# ==================== SECTION 2: AUTHENTICATION ====================
section_header "2. AUTHENTICATION - COMPREHENSIVE TESTING"

# Test 2.1: Login with username
echo "Test 2.1: Login with username"
login_response=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","tenantId":"mondelez"}')

if echo "$login_response" | grep -q '"success":true'; then
  TOKEN=$(echo "$login_response" | jq -r '.token')
  USER_ID=$(echo "$login_response" | jq -r '.user.id')
  pass_test "Login with username successful"
else
  critical_fail "Login with username FAILED"
  echo "$login_response"
fi

# Test 2.2: Login with email
echo ""
echo "Test 2.2: Login with email"
email_login=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tradeai.com","password":"admin123","tenantId":"mondelez"}')

if echo "$email_login" | grep -q '"success":true'; then
  pass_test "Login with email successful"
else
  fail_test "Login with email FAILED"
fi

# Test 2.3: Invalid credentials
echo ""
echo "Test 2.3: Invalid credentials handling"
invalid_login=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword","tenantId":"mondelez"}')

if echo "$invalid_login" | grep -q '"success":false'; then
  pass_test "Invalid credentials properly rejected"
else
  fail_test "Invalid credentials NOT properly rejected"
fi

# Test 2.4: Missing required fields
echo ""
echo "Test 2.4: Missing required fields validation"
missing_fields=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin"}')

if echo "$missing_fields" | grep -q '"success":false'; then
  pass_test "Missing fields validation working"
else
  fail_test "Missing fields validation NOT working"
fi

# Test 2.5: SQL Injection attempt
echo ""
echo "Test 2.5: SQL Injection protection"
sql_injection=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR 1=1--","password":"anything","tenantId":"mondelez"}')

if echo "$sql_injection" | grep -q '"success":false'; then
  pass_test "SQL injection attempt blocked"
else
  critical_fail "SQL injection attempt NOT blocked - SECURITY ISSUE"
fi

# Test 2.6: Token validation
echo ""
echo "Test 2.6: Token validation"
if [ -n "$TOKEN" ]; then
  token_test=$(curl -s -X GET "$BACKEND_URL/api/users" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$token_test" | grep -q '"success":true'; then
    pass_test "Token validation working"
  else
    fail_test "Token validation FAILED"
  fi
else
  fail_test "No token available for testing"
fi

# Test 2.7: Invalid token
echo ""
echo "Test 2.7: Invalid token rejection"
invalid_token=$(curl -s -X GET "$BACKEND_URL/api/users" \
  -H "Authorization: Bearer invalid_token_12345")

if echo "$invalid_token" | grep -q '"success":false'; then
  pass_test "Invalid token properly rejected"
else
  fail_test "Invalid token NOT properly rejected"
fi

# Test 2.8: Missing token
echo ""
echo "Test 2.8: Missing token handling"
no_token=$(curl -s -X GET "$BACKEND_URL/api/users")

if echo "$no_token" | grep -q '"success":false'; then
  pass_test "Missing token properly handled"
else
  fail_test "Missing token NOT properly handled"
fi

# ==================== SECTION 3: USER MANAGEMENT ====================
section_header "3. USER MANAGEMENT - COMPREHENSIVE TESTING"

# Test 3.1: Get all users
echo "Test 3.1: Get all users (admin only)"
users_response=$(curl -s -X GET "$BACKEND_URL/api/users" \
  -H "Authorization: Bearer $TOKEN")

if echo "$users_response" | grep -q '"success":true'; then
  user_count=$(echo "$users_response" | jq -r '.count // .data | length')
  pass_test "Get all users successful (Count: $user_count)"
else
  fail_test "Get all users FAILED"
  echo "$users_response"
fi

# Test 3.2: Get current user profile
echo ""
echo "Test 3.2: Get current user profile"
profile_response=$(curl -s -X GET "$BACKEND_URL/api/users/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$profile_response" | grep -q '"success":true'; then
  pass_test "Get profile successful"
else
  fail_test "Get profile FAILED"
  echo "$profile_response"
fi

# Test 3.3: Update profile
echo ""
echo "Test 3.3: Update user profile"
update_response=$(curl -s -X PUT "$BACKEND_URL/api/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Updated","phone":"+1234567890"}')

if echo "$update_response" | grep -q '"success":true'; then
  pass_test "Update profile successful"
else
  warn_test "Update profile may not be implemented"
fi

# ==================== SECTION 4: BUDGET MANAGEMENT ====================
section_header "4. BUDGET MANAGEMENT - COMPREHENSIVE TESTING"

# Test 4.1: Get budgets
echo "Test 4.1: Get all budgets"
budgets_response=$(curl -s -X GET "$BACKEND_URL/api/budgets" \
  -H "Authorization: Bearer $TOKEN")

if echo "$budgets_response" | grep -q '"success":true'; then
  budget_count=$(echo "$budgets_response" | jq -r '.data | length')
  pass_test "Get budgets successful (Count: $budget_count)"
else
  fail_test "Get budgets FAILED"
fi

# ==================== SECTION 5: PROMOTIONS ====================
section_header "5. PROMOTIONS - COMPREHENSIVE TESTING"

# Test 5.1: Get promotions
echo "Test 5.1: Get all promotions"
promotions_response=$(curl -s -X GET "$BACKEND_URL/api/promotions" \
  -H "Authorization: Bearer $TOKEN")

if echo "$promotions_response" | grep -q '"success":true'; then
  promo_count=$(echo "$promotions_response" | jq -r '.data | length')
  pass_test "Get promotions successful (Count: $promo_count)"
else
  fail_test "Get promotions FAILED"
fi

# ==================== SECTION 6: CUSTOMERS ====================
section_header "6. CUSTOMER MANAGEMENT"

# Test 6.1: Get customers
echo "Test 6.1: Get all customers"
customers_response=$(curl -s -X GET "$BACKEND_URL/api/customers" \
  -H "Authorization: Bearer $TOKEN")

if echo "$customers_response" | grep -q '"success":true'; then
  customer_count=$(echo "$customers_response" | jq -r '.data | length')
  pass_test "Get customers successful (Count: $customer_count)"
else
  fail_test "Get customers FAILED"
fi

# ==================== SECTION 7: ANALYTICS ====================
section_header "7. ANALYTICS & REPORTING"

# Test 7.1: Get analytics
echo "Test 7.1: Get analytics data"
analytics_response=$(curl -s -X GET "$BACKEND_URL/api/analytics" \
  -H "Authorization: Bearer $TOKEN")

if echo "$analytics_response" | grep -q '"success":true\|data'; then
  pass_test "Get analytics successful"
else
  warn_test "Analytics endpoint may need data"
fi

# ==================== SECTION 8: SECURITY TESTING ====================
section_header "8. SECURITY TESTING"

# Test 8.1: Password in response
echo "Test 8.1: Password field protection"
if echo "$users_response" | grep -q '"password"'; then
  critical_fail "Password field exposed in API response - CRITICAL SECURITY ISSUE"
else
  pass_test "Password field properly hidden"
fi

# Test 8.2: CORS headers
echo ""
echo "Test 8.2: CORS configuration"
cors_test=$(curl -s -I -X OPTIONS "$BACKEND_URL/api/users" \
  -H "Origin: http://localhost:3000")

if echo "$cors_test" | grep -q "Access-Control-Allow-Origin"; then
  pass_test "CORS headers present"
else
  warn_test "CORS configuration may need review"
fi

# ==================== SECTION 9: PERFORMANCE TESTING ====================
section_header "9. PERFORMANCE TESTING"

# Test 9.1: Response time test
echo "Test 9.1: API response time"
start_time=$(date +%s%3N)
curl -s -X GET "$BACKEND_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
end_time=$(date +%s%3N)
response_time=$((end_time - start_time))

if [ $response_time -lt 1000 ]; then
  pass_test "Response time: ${response_time}ms (Excellent)"
elif [ $response_time -lt 3000 ]; then
  pass_test "Response time: ${response_time}ms (Good)"
else
  warn_test "Response time: ${response_time}ms (May need optimization)"
fi

# ==================== SECTION 10: ERROR HANDLING ====================
section_header "10. ERROR HANDLING"

# Test 10.1: 404 handling
echo "Test 10.1: 404 error handling"
notfound=$(curl -s "$BACKEND_URL/api/nonexistent")

if echo "$notfound" | grep -q '404\|not found'; then
  pass_test "404 errors properly handled"
else
  warn_test "404 error handling may need improvement"
fi

# ==================== SECTION 11: FRONTEND TESTING ====================
section_header "11. FRONTEND TESTING"

# Test 11.1: Frontend loads
echo "Test 11.1: Frontend page loads"
frontend_response=$(curl -s "$FRONTEND_URL")

if echo "$frontend_response" | grep -q '<div\|html\|react'; then
  pass_test "Frontend page loads"
else
  fail_test "Frontend page does NOT load properly"
fi

# ==================== SUMMARY ====================
section_header "TEST SUMMARY"

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                    TEST RESULTS                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Total Tests Run:     $TOTAL_TESTS"
echo -e "${GREEN}Passed:              $PASSED_TESTS${NC}"
echo -e "${RED}Failed:              $FAILED_TESTS${NC}"
echo -e "${YELLOW}Warnings:            $WARNINGS${NC}"
echo ""

# Display critical issues
if [ ${#CRITICAL_ISSUES[@]} -gt 0 ]; then
  echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║              CRITICAL ISSUES FOUND                    ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
  echo ""
  for issue in "${CRITICAL_ISSUES[@]}"; do
    echo -e "${RED}  ✗ $issue${NC}"
  done
  echo ""
fi

# Display failed tests
if [ ${#ISSUES[@]} -gt 0 ]; then
  echo "╔═══════════════════════════════════════════════════════╗"
  echo "║                  ISSUES FOUND                         ║"
  echo "╚═══════════════════════════════════════════════════════╝"
  echo ""
  for issue in "${ISSUES[@]}"; do
    echo "  - $issue"
  done
  echo ""
fi

# Display warnings
if [ ${#WARNINGS_LIST[@]} -gt 0 ]; then
  echo "╔═══════════════════════════════════════════════════════╗"
  echo "║                    WARNINGS                           ║"
  echo "╚═══════════════════════════════════════════════════════╝"
  echo ""
  for warning in "${WARNINGS_LIST[@]}"; do
    echo "  ⚠ $warning"
  done
  echo ""
fi

# Final status
echo ""
pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "Pass Rate: $pass_rate%"
echo ""

if [ $FAILED_TESTS -eq 0 ] && [ ${#CRITICAL_ISSUES[@]} -eq 0 ]; then
  echo "╔═══════════════════════════════════════════════════════╗"
  echo "║   ✓ ALL CRITICAL TESTS PASSED - SYSTEM FUNCTIONAL    ║"
  echo "╚═══════════════════════════════════════════════════════╝"
  exit 0
else
  echo "╔═══════════════════════════════════════════════════════╗"
  echo "║   ✗ TESTS FAILED - ISSUES NEED TO BE ADDRESSED       ║"
  echo "╚═══════════════════════════════════════════════════════╝"
  exit 1
fi
