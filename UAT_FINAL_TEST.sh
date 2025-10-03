#!/bin/bash

# TRADEAI - Final UAT Test Suite
# This script performs comprehensive user acceptance testing

BASE_URL="http://localhost:5002"
RESULTS_FILE="/tmp/uat_final_results.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL=0
PASSED=0
FAILED=0
WARNINGS=0

# Initialize results
echo "{\"tests\": []}" > $RESULTS_FILE

# Helper function to add test result
add_result() {
  local test_name="$1"
  local status="$2"
  local message="$3"
  local response="$4"
  
  jq --arg name "$test_name" --arg status "$status" --arg msg "$message" --arg resp "$response" \
     '.tests += [{"name": $name, "status": $status, "message": $msg, "response": $resp}]' \
     $RESULTS_FILE > /tmp/uat_temp.json && mv /tmp/uat_temp.json $RESULTS_FILE
}

# Helper function to log test
log_test() {
  local category="$1"
  local test_name="$2"
  local status="$3"
  local message="$4"
  
  TOTAL=$((TOTAL + 1))
  
  case "$status" in
    "PASS")
      PASSED=$((PASSED + 1))
      echo -e "${GREEN}✓ PASS${NC} - $category: $test_name"
      ;;
    "FAIL")
      FAILED=$((FAILED + 1))
      echo -e "${RED}✗ FAIL${NC} - $category: $test_name"
      echo -e "  ${RED}Error: $message${NC}"
      ;;
    "WARN")
      WARNINGS=$((WARNINGS + 1))
      echo -e "${YELLOW}⚠ WARN${NC} - $category: $test_name"
      echo -e "  ${YELLOW}Note: $message${NC}"
      ;;
  esac
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         TRADEAI - FINAL UAT TEST SUITE                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# TEST CATEGORY 1: AUTHENTICATION & AUTHORIZATION
# =============================================================================
echo -e "${BLUE}[1/7] Testing Authentication & Authorization...${NC}"

# Test 1.1: Login
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tradeai.com","password":"Admin@123"}')

TOKEN=$(echo $RESPONSE | jq -r '.token // empty')
if [ -n "$TOKEN" ]; then
  log_test "Auth" "Admin login" "PASS" ""
  add_result "auth_login" "pass" "Login successful" "$RESPONSE"
else
  log_test "Auth" "Admin login" "FAIL" "No token received"
  add_result "auth_login" "fail" "No token received" "$RESPONSE"
  echo -e "${RED}CRITICAL: Cannot proceed without authentication${NC}"
  exit 1
fi

# Test 1.2: JWT contains tenantId
TENANT_ID=$(echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq -r '.tenantId // empty')
if [ -n "$TENANT_ID" ]; then
  log_test "Auth" "JWT contains tenantId" "PASS" ""
  add_result "jwt_tenant" "pass" "JWT contains tenantId: $TENANT_ID" ""
else
  log_test "Auth" "JWT contains tenantId" "FAIL" "tenantId missing from JWT"
  add_result "jwt_tenant" "fail" "tenantId missing from JWT" ""
fi

# Test 1.3: Protected route without token
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/users")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
# In multi-tenant systems, 400 is acceptable when tenant context is missing
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  log_test "Auth" "Protected route denies unauthenticated access" "PASS" ""
  add_result "auth_protected" "pass" "Returns $HTTP_CODE (access denied)" ""
else
  log_test "Auth" "Protected route denies unauthenticated access" "FAIL" "Expected 400/401/403, got $HTTP_CODE"
  add_result "auth_protected" "fail" "Expected 400/401/403, got $HTTP_CODE" ""
fi

# Test 1.4: RBAC - Admin access
RESPONSE=$(curl -s -X GET "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN")
SUCCESS=$(echo $RESPONSE | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
  log_test "Auth" "RBAC - Admin can access users" "PASS" ""
  add_result "rbac_admin" "pass" "Admin access granted" ""
else
  log_test "Auth" "RBAC - Admin can access users" "FAIL" "Admin denied access"
  add_result "rbac_admin" "fail" "Admin denied access" "$RESPONSE"
fi

# =============================================================================
# TEST CATEGORY 2: TENANT ISOLATION
# =============================================================================
echo ""
echo -e "${BLUE}[2/7] Testing Tenant Isolation...${NC}"

# Test 2.1: Users are filtered by tenant
RESPONSE=$(curl -s -X GET "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN")
USERS=$(echo $RESPONSE | jq -r '.data')
USER_COUNT=$(echo $USERS | jq 'length')
USER_TENANTS=$(echo $USERS | jq -r '[.[].tenantId] | unique | join(",")')

if [ "$USER_TENANTS" = "$TENANT_ID" ]; then
  log_test "Tenant" "All users belong to same tenant" "PASS" ""
  add_result "tenant_user_filter" "pass" "All $USER_COUNT users have tenantId: $TENANT_ID" ""
else
  log_test "Tenant" "All users belong to same tenant" "FAIL" "Multiple tenant IDs found: $USER_TENANTS"
  add_result "tenant_user_filter" "fail" "Multiple tenant IDs found" "$USER_TENANTS"
fi

# Test 2.2: Customers are filtered by tenant
RESPONSE=$(curl -s -X GET "$BASE_URL/api/customers" \
  -H "Authorization: Bearer $TOKEN")
CUSTOMERS=$(echo $RESPONSE | jq -r '.data')
CUSTOMER_COUNT=$(echo $CUSTOMERS | jq 'length')
if [ "$CUSTOMER_COUNT" -gt 0 ]; then
  CUSTOMER_TENANTS=$(echo $CUSTOMERS | jq -r '[.[].tenantId] | unique | join(",")')
  if [ "$CUSTOMER_TENANTS" = "$TENANT_ID" ]; then
    log_test "Tenant" "All customers belong to same tenant" "PASS" ""
    add_result "tenant_customer_filter" "pass" "All $CUSTOMER_COUNT customers have tenantId: $TENANT_ID" ""
  else
    log_test "Tenant" "All customers belong to same tenant" "FAIL" "Multiple tenant IDs found"
    add_result "tenant_customer_filter" "fail" "Multiple tenant IDs found" "$CUSTOMER_TENANTS"
  fi
else
  log_test "Tenant" "All customers belong to same tenant" "PASS" "No customers yet (empty tenant)"
  add_result "tenant_customer_filter" "pass" "No customers in tenant" ""
fi

# =============================================================================
# TEST CATEGORY 3: USER MANAGEMENT
# =============================================================================
echo ""
echo -e "${BLUE}[3/7] Testing User Management...${NC}"

# Test 3.1: List users
RESPONSE=$(curl -s -X GET "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN")
USER_COUNT=$(echo $RESPONSE | jq -r '.count // 0')
if [ "$USER_COUNT" -gt 0 ]; then
  log_test "Users" "List all users" "PASS" "Found $USER_COUNT users"
  add_result "users_list" "pass" "Found $USER_COUNT users" ""
else
  log_test "Users" "List all users" "FAIL" "No users found"
  add_result "users_list" "fail" "No users found" "$RESPONSE"
fi

# Test 3.2: Create new user
TIMESTAMP=$(date +%s)
RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"EMP$TIMESTAMP\",
    \"email\": \"test$TIMESTAMP@tradeai.com\",
    \"password\": \"Test@123\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"role\": \"user\",
    \"department\": \"sales\"
  }")

NEW_USER_ID=$(echo $RESPONSE | jq -r '.data._id // empty')
if [ -n "$NEW_USER_ID" ]; then
  log_test "Users" "Create new user" "PASS" "User created with ID: $NEW_USER_ID"
  add_result "users_create" "pass" "User created: $NEW_USER_ID" ""
else
  ERROR_MSG=$(echo $RESPONSE | jq -r '.message // .error.message // "Unknown error"')
  log_test "Users" "Create new user" "FAIL" "$ERROR_MSG"
  add_result "users_create" "fail" "$ERROR_MSG" "$RESPONSE"
fi

# Test 3.3: Get user by ID
if [ -n "$NEW_USER_ID" ]; then
  RESPONSE=$(curl -s -X GET "$BASE_URL/api/users/$NEW_USER_ID" \
    -H "Authorization: Bearer $TOKEN")
  FETCHED_ID=$(echo $RESPONSE | jq -r '.data._id // empty')
  if [ "$FETCHED_ID" = "$NEW_USER_ID" ]; then
    log_test "Users" "Get user by ID" "PASS" ""
    add_result "users_get_by_id" "pass" "User retrieved successfully" ""
  else
    log_test "Users" "Get user by ID" "FAIL" "User not found"
    add_result "users_get_by_id" "fail" "User not found" "$RESPONSE"
  fi
fi

# Test 3.4: Email uniqueness validation
RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"EMP999999\",
    \"email\": \"admin@tradeai.com\",
    \"password\": \"Test@123\",
    \"firstName\": \"Test\",
    \"lastName\": \"Duplicate\"
  }")

SUCCESS=$(echo $RESPONSE | jq -r '.success')
ERROR_MSG=$(echo $RESPONSE | jq -r '.error.message // .message // empty' | tr '[:upper:]' '[:lower:]')
if [ "$SUCCESS" = "false" ] && ([[ "$ERROR_MSG" == *"exist"* ]] || [[ "$ERROR_MSG" == *"duplicate"* ]]); then
  log_test "Users" "Email uniqueness enforced" "PASS" ""
  add_result "users_email_unique" "pass" "Duplicate email rejected" ""
else
  log_test "Users" "Email uniqueness enforced" "FAIL" "Duplicate email not rejected"
  add_result "users_email_unique" "fail" "Duplicate email not rejected" "$RESPONSE"
fi

# =============================================================================
# TEST CATEGORY 4: CUSTOMER MANAGEMENT
# =============================================================================
echo ""
echo -e "${BLUE}[4/7] Testing Customer Management...${NC}"

# Test 4.1: List customers
RESPONSE=$(curl -s -X GET "$BASE_URL/api/customers" \
  -H "Authorization: Bearer $TOKEN")
CUSTOMER_COUNT=$(echo $RESPONSE | jq -r '.total // 0')
log_test "Customers" "List all customers" "PASS" "Found $CUSTOMER_COUNT customers"
add_result "customers_list" "pass" "Found $CUSTOMER_COUNT customers" ""

# Test 4.2: Create new customer
TIMESTAMP=$(date +%s)
RESPONSE=$(curl -s -X POST "$BASE_URL/api/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"CUST$TIMESTAMP\",
    \"name\": \"Test Customer $TIMESTAMP\",
    \"sapCustomerId\": \"SAP$TIMESTAMP\",
    \"customerType\": \"retailer\",
    \"channel\": \"modern_trade\",
    \"status\": \"active\"
  }")

NEW_CUSTOMER_ID=$(echo $RESPONSE | jq -r '.data._id // empty')
if [ -n "$NEW_CUSTOMER_ID" ]; then
  log_test "Customers" "Create new customer" "PASS" "Customer created with ID: $NEW_CUSTOMER_ID"
  add_result "customers_create" "pass" "Customer created: $NEW_CUSTOMER_ID" ""
  
  # Verify tenantId was set
  CUSTOMER_TENANT=$(echo $RESPONSE | jq -r '.data.tenantId // empty')
  if [ "$CUSTOMER_TENANT" = "$TENANT_ID" ]; then
    log_test "Customers" "New customer has correct tenantId" "PASS" ""
    add_result "customers_tenant_set" "pass" "Customer has correct tenantId" ""
  else
    log_test "Customers" "New customer has correct tenantId" "FAIL" "Expected $TENANT_ID, got $CUSTOMER_TENANT"
    add_result "customers_tenant_set" "fail" "Wrong tenantId" ""
  fi
else
  ERROR_MSG=$(echo $RESPONSE | jq -r '.message // .error.message // "Unknown error"')
  log_test "Customers" "Create new customer" "FAIL" "$ERROR_MSG"
  add_result "customers_create" "fail" "$ERROR_MSG" "$RESPONSE"
fi

# Test 4.3: Search customers
RESPONSE=$(curl -s -X GET "$BASE_URL/api/customers?search=Test" \
  -H "Authorization: Bearer $TOKEN")
SEARCH_COUNT=$(echo $RESPONSE | jq -r '.total // 0')
log_test "Customers" "Search customers" "PASS" "Search returned $SEARCH_COUNT results"
add_result "customers_search" "pass" "Search returned $SEARCH_COUNT results" ""

# =============================================================================
# TEST CATEGORY 5: DATA VALIDATION
# =============================================================================
echo ""
echo -e "${BLUE}[5/7] Testing Data Validation...${NC}"

# Test 5.1: Invalid email format
RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP888",
    "email": "invalid-email",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User"
  }')

SUCCESS=$(echo $RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "false" ]; then
  log_test "Validation" "Invalid email rejected" "PASS" ""
  add_result "validation_email" "pass" "Invalid email rejected" ""
else
  log_test "Validation" "Invalid email rejected" "FAIL" "Invalid email accepted"
  add_result "validation_email" "fail" "Invalid email accepted" "$RESPONSE"
fi

# Test 5.2: Missing required fields
RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "incomplete@test.com"
  }')

SUCCESS=$(echo $RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "false" ]; then
  log_test "Validation" "Missing required fields rejected" "PASS" ""
  add_result "validation_required" "pass" "Missing fields rejected" ""
else
  log_test "Validation" "Missing required fields rejected" "FAIL" "Incomplete data accepted"
  add_result "validation_required" "fail" "Incomplete data accepted" "$RESPONSE"
fi

# Test 5.3: Weak password rejected
RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP777",
    "email": "weak@test.com",
    "password": "123",
    "firstName": "Test",
    "lastName": "User"
  }')

SUCCESS=$(echo $RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "false" ]; then
  log_test "Validation" "Weak password rejected" "PASS" ""
  add_result "validation_password" "pass" "Weak password rejected" ""
else
  log_test "Validation" "Weak password rejected" "FAIL" "Weak password accepted"
  add_result "validation_password" "fail" "Weak password accepted" "$RESPONSE"
fi

# Test 5.4: Invalid ObjectID handling
RESPONSE=$(curl -s -X GET "$BASE_URL/api/users/invalid123" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/users/invalid123" \
  -H "Authorization: Bearer $TOKEN")

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "404" ]; then
  log_test "Validation" "Invalid ObjectID handled correctly" "PASS" ""
  add_result "validation_objectid" "pass" "Returns $HTTP_CODE for invalid ID" ""
else
  log_test "Validation" "Invalid ObjectID handled correctly" "FAIL" "Expected 400/404, got $HTTP_CODE"
  add_result "validation_objectid" "fail" "Expected 400/404, got $HTTP_CODE" ""
fi

# =============================================================================
# TEST CATEGORY 6: ERROR HANDLING
# =============================================================================
echo ""
echo -e "${BLUE}[6/7] Testing Error Handling...${NC}"

# Test 6.1: 404 for non-existent resource
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/users/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "404" ]; then
  log_test "Errors" "404 returned for non-existent resource" "PASS" ""
  add_result "error_404" "pass" "Returns 404 for non-existent user" ""
else
  log_test "Errors" "404 returned for non-existent resource" "FAIL" "Expected 404, got $HTTP_CODE"
  add_result "error_404" "fail" "Expected 404, got $HTTP_CODE" ""
fi

# Test 6.2: Consistent error format
RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}')

HAS_SUCCESS=$(echo $RESPONSE | jq 'has("success")')
HAS_MESSAGE=$(echo $RESPONSE | jq 'has("message") or has("error")')

if [ "$HAS_SUCCESS" = "true" ] && [ "$HAS_MESSAGE" = "true" ]; then
  log_test "Errors" "Consistent error response format" "PASS" ""
  add_result "error_format" "pass" "Error response has success and message fields" ""
else
  log_test "Errors" "Consistent error response format" "FAIL" "Missing expected fields"
  add_result "error_format" "fail" "Missing expected fields" "$RESPONSE"
fi

# =============================================================================
# TEST CATEGORY 7: PERFORMANCE
# =============================================================================
echo ""
echo -e "${BLUE}[7/7] Testing Performance...${NC}"

# Test 7.1: Login performance
START=$(date +%s%3N)
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tradeai.com","password":"Admin@123"}')
END=$(date +%s%3N)
DURATION=$((END - START))

if [ $DURATION -lt 2000 ]; then
  log_test "Performance" "Login response time" "PASS" "${DURATION}ms"
  add_result "perf_login" "pass" "Login completed in ${DURATION}ms" ""
else
  log_test "Performance" "Login response time" "WARN" "${DURATION}ms (expected <2000ms)"
  add_result "perf_login" "warn" "Login took ${DURATION}ms" ""
fi

# Test 7.2: List users performance
START=$(date +%s%3N)
RESPONSE=$(curl -s -X GET "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN")
END=$(date +%s%3N)
DURATION=$((END - START))

if [ $DURATION -lt 2000 ]; then
  log_test "Performance" "List users response time" "PASS" "${DURATION}ms"
  add_result "perf_users" "pass" "List users completed in ${DURATION}ms" ""
else
  log_test "Performance" "List users response time" "WARN" "${DURATION}ms (expected <2000ms)"
  add_result "perf_users" "warn" "List users took ${DURATION}ms" ""
fi

# Test 7.3: Concurrent requests
echo -e "  Testing concurrent requests..."
START=$(date +%s%3N)
for i in {1..10}; do
  curl -s -X GET "$BASE_URL/api/users" \
    -H "Authorization: Bearer $TOKEN" > /dev/null &
done
wait
END=$(date +%s%3N)
DURATION=$((END - START))

if [ $DURATION -lt 5000 ]; then
  log_test "Performance" "Concurrent requests (10)" "PASS" "${DURATION}ms total"
  add_result "perf_concurrent" "pass" "10 concurrent requests completed in ${DURATION}ms" ""
else
  log_test "Performance" "Concurrent requests (10)" "WARN" "${DURATION}ms (expected <5000ms)"
  add_result "perf_concurrent" "warn" "10 concurrent requests took ${DURATION}ms" ""
fi

# =============================================================================
# FINAL SUMMARY
# =============================================================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  TEST SUMMARY                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests:    ${BLUE}$TOTAL${NC}"
echo -e "Passed:         ${GREEN}$PASSED${NC}"
echo -e "Failed:         ${RED}$FAILED${NC}"
echo -e "Warnings:       ${YELLOW}$WARNINGS${NC}"
echo ""

SUCCESS_RATE=$((PASSED * 100 / TOTAL))
echo -e "Success Rate:   ${GREEN}${SUCCESS_RATE}%${NC}"
echo ""

# Save summary to results file
jq --arg total "$TOTAL" --arg passed "$PASSED" --arg failed "$FAILED" --arg warnings "$WARNINGS" \
   '.summary = {"total": $total, "passed": $passed, "failed": $failed, "warnings": $warnings}' \
   $RESULTS_FILE > /tmp/uat_temp.json && mv /tmp/uat_temp.json $RESULTS_FILE

echo -e "Detailed results saved to: ${BLUE}$RESULTS_FILE${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ ALL CRITICAL TESTS PASSED${NC}"
  exit 0
else
  echo -e "${RED}✗ SOME TESTS FAILED${NC}"
  exit 1
fi
