#!/bin/bash

# CRITICAL USER ACCEPTANCE TEST - TRADEAI SYSTEM
# This test goes beyond basic functionality to find edge cases, validation issues, and security problems
# Focus: Be CRITICAL and find problems

set -e

BASE_URL="http://localhost:5002"
API_BASE="${BASE_URL}/api"
TIMESTAMP=$(date +%s)

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
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0

# Log file
LOG_FILE="CRITICAL_UAT_$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')]  $1" | tee -a "$LOG_FILE"
}

test_start() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}[TEST #$TOTAL_TESTS]${NC} $1" | tee -a "$LOG_FILE"
}

test_pass() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ PASS${NC}: $1" | tee -a "$LOG_FILE"
}

test_fail() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    local severity=$2
    if [ "$severity" == "CRITICAL" ]; then
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
        echo -e "${RED}✗ FAIL [CRITICAL]${NC}: $1" | tee -a "$LOG_FILE"
    elif [ "$severity" == "HIGH" ]; then
        HIGH_ISSUES=$((HIGH_ISSUES + 1))
        echo -e "${RED}✗ FAIL [HIGH]${NC}: $1" | tee -a "$LOG_FILE"
    else
        MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
        echo -e "${YELLOW}✗ FAIL [MEDIUM]${NC}: $1" | tee -a "$LOG_FILE"
    fi
}

test_warning() {
    echo -e "${YELLOW}⚠ WARNING${NC}: $1" | tee -a "$LOG_FILE"
}

echo "================================================" | tee "$LOG_FILE"
echo "     CRITICAL UAT - TRADEAI SYSTEM" | tee -a "$LOG_FILE"
echo "     Testing Date: $(date)" | tee -a "$LOG_FILE"
echo "     Base URL: $BASE_URL" | tee -a "$LOG_FILE"
echo "================================================" | tee -a "$LOG_FILE"

# ==========================================
# PHASE 1: AUTHENTICATION & SECURITY TESTS
# ==========================================

log "PHASE 1: CRITICAL AUTHENTICATION & SECURITY TESTS"

# Get auth token first
log "Logging in to get authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@tradeai.com","password":"Admin@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // empty')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user._id // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo -e "${RED}FATAL ERROR: Cannot authenticate. Aborting tests.${NC}"
    exit 1
fi

log "✓ Authentication successful"

# Test 1: Empty password should be rejected
test_start "Login with empty password should fail"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@tradeai.com","password":""}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "401" ]; then
    test_pass "Empty password correctly rejected"
else
    test_fail "Empty password was not rejected (HTTP $HTTP_CODE)" "HIGH"
fi

# Test 2: SQL Injection attempt in email
test_start "SQL Injection in login email field"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@tradeai.com'\'' OR 1=1--","password":"test"}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "401" ]; then
    test_pass "SQL Injection attempt blocked"
else
    test_fail "SQL Injection might be possible (HTTP $HTTP_CODE)" "CRITICAL"
fi

# Test 3: NoSQL Injection attempt
test_start "NoSQL Injection in login"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_CODE}" -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":{"$ne":null},"password":{"$ne":null}}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "401" ]; then
    test_pass "NoSQL Injection attempt blocked"
else
    test_fail "NoSQL Injection might be possible (HTTP $HTTP_CODE)" "CRITICAL"
fi

# Test 4: Extremely long email (Buffer overflow test)
test_start "Buffer overflow test - extremely long email"
LONG_EMAIL=$(python3 -c "print('a'*10000 + '@test.com')")
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$LONG_EMAIL\",\"password\":\"test\"}")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "413" ]; then
    test_pass "Long input rejected appropriately"
else
    test_warning "Long input handling unclear (HTTP $HTTP_CODE)"
fi

# Test 5: XSS in login fields
test_start "XSS attempt in login email"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"<script>alert(1)</script>@test.com","password":"test"}')
BODY=$(echo "$RESPONSE" | sed '$d')
if echo "$BODY" | grep -q "<script>" ; then
    test_fail "XSS content not sanitized in response" "CRITICAL"
else
    test_pass "XSS content properly handled"
fi

# ==========================================
# PHASE 2: DATA VALIDATION TESTS
# ==========================================

log "PHASE 2: CRITICAL DATA VALIDATION TESTS"

# Test 6: Create customer with missing required fields
test_start "Create customer without required fields"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ]; then
    test_pass "Missing required fields correctly rejected"
else
    test_fail "Missing required fields not validated (HTTP $HTTP_CODE)" "HIGH"
fi

# Test 7: Create customer with invalid email format
test_start "Create customer with invalid email"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Test","code":"TEST-'$TIMESTAMP'","email":"not-an-email"}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" == "400" ] || echo "$BODY" | grep -iq "email"; then
    test_pass "Invalid email format rejected"
else
    test_fail "Invalid email format accepted (HTTP $HTTP_CODE)" "MEDIUM"
fi

# Test 8: Create customer with negative credit limit
test_start "Create customer with negative credit limit"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Test","code":"TEST-NEG-'$TIMESTAMP'","email":"test@test.com","creditLimit":-1000}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ]; then
    test_pass "Negative credit limit rejected"
else
    test_fail "Negative credit limit accepted (HTTP $HTTP_CODE)" "HIGH"
fi

# Test 9: Create product with negative price
test_start "Create product with negative price"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Test Product","code":"PROD-NEG-'$TIMESTAMP'","category":"Test","price":-100}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ]; then
    test_pass "Negative price rejected"
else
    test_fail "Negative price accepted (HTTP $HTTP_CODE)" "HIGH"
fi

# Test 10: Create product with price as string
test_start "Create product with price as string instead of number"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Test Product","code":"PROD-STR-'$TIMESTAMP'","category":"Test","price":"not-a-number"}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ]; then
    test_pass "Invalid price type rejected"
else
    test_fail "Invalid price type accepted (HTTP $HTTP_CODE)" "MEDIUM"
fi

# ==========================================
# PHASE 3: BUSINESS LOGIC TESTS
# ==========================================

log "PHASE 3: CRITICAL BUSINESS LOGIC TESTS"

# First create a customer for testing
CUSTOMER_RESPONSE=$(curl -s -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Test Customer","code":"CUST-'$TIMESTAMP'","email":"test'$TIMESTAMP'@test.com"}')
CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '._id // .id // empty')

# Test 11: Delete non-existent record
test_start "Delete non-existent customer"
FAKE_ID="000000000000000000000000"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "${API_BASE}/customers/$FAKE_ID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "404" ]; then
    test_pass "Non-existent record returns 404"
else
    test_fail "Non-existent record returns incorrect status (HTTP $HTTP_CODE)" "MEDIUM"
fi

# Test 12: Update with invalid ObjectId
test_start "Update customer with malformed ID"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT "${API_BASE}/customers/invalid-id" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Updated"}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "404" ]; then
    test_pass "Malformed ID rejected"
else
    test_fail "Malformed ID not properly handled (HTTP $HTTP_CODE)" "MEDIUM"
fi

# Test 13: Create duplicate customer code
test_start "Create customer with duplicate code"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Duplicate","code":"CUST-'$TIMESTAMP'","email":"duplicate'$TIMESTAMP'@test.com"}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "409" ]; then
    test_pass "Duplicate code rejected"
else
    test_fail "Duplicate code accepted (HTTP $HTTP_CODE)" "HIGH"
fi

# ==========================================
# PHASE 4: AUTHORIZATION TESTS
# ==========================================

log "PHASE 4: AUTHORIZATION & ACCESS CONTROL TESTS"

# Test 14: Access endpoint without token
test_start "Access protected endpoint without authentication"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "401" ]; then
    test_pass "Unauthenticated access correctly blocked"
else
    test_fail "Unauthenticated access not blocked (HTTP $HTTP_CODE)" "CRITICAL"
fi

# Test 15: Access with malformed token
test_start "Access with malformed JWT token"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers" \
    -H "Authorization: Bearer invalid.token.here")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "401" ]; then
    test_pass "Malformed token correctly rejected"
else
    test_fail "Malformed token not properly handled (HTTP $HTTP_CODE)" "HIGH"
fi

# Test 16: Access with expired/wrong token
test_start "Access with fake token"
FAKE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers" \
    -H "Authorization: Bearer $FAKE_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "401" ]; then
    test_pass "Fake token correctly rejected"
else
    test_fail "Fake token not properly validated (HTTP $HTTP_CODE)" "CRITICAL"
fi

# ==========================================
# PHASE 5: API CONSISTENCY TESTS
# ==========================================

log "PHASE 5: API CONSISTENCY & REST COMPLIANCE TESTS"

# Test 17: Check if list endpoints support pagination
test_start "Check if list endpoints return pagination metadata"
RESPONSE=$(curl -s -X GET "${API_BASE}/customers" \
    -H "Authorization: Bearer $TOKEN")
if echo "$RESPONSE" | jq -e '.pagination or .page or .limit or .total' > /dev/null 2>&1; then
    test_pass "Pagination metadata present"
else
    test_warning "No pagination metadata found - could be issue with large datasets"
fi

# Test 18: Check proper HTTP status codes for POST
test_start "POST should return 201 Created on success"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Status Test","sku":"SKU-STAT-'$TIMESTAMP'","sapMaterialId":"MAT-STAT-'$TIMESTAMP'","productType":"own_brand","pricing":{"listPrice":100}}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "201" ]; then
    test_pass "POST returns correct 201 status"
else
    test_warning "POST returns $HTTP_CODE instead of 201 (not critical but not RESTful)"
fi

# Test 19: Check if PUT is idempotent
test_start "Check if PUT updates are idempotent"
if [ -n "$CUSTOMER_ID" ]; then
    RESPONSE1=$(curl -s -X PUT "${API_BASE}/customers/$CUSTOMER_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"name":"Updated Name"}')
    
    RESPONSE2=$(curl -s -X PUT "${API_BASE}/customers/$CUSTOMER_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"name":"Updated Name"}')
    
    if [ "$RESPONSE1" == "$RESPONSE2" ]; then
        test_pass "PUT is idempotent"
    else
        test_warning "PUT might not be idempotent"
    fi
else
    test_warning "Skipping idempotency test - no customer ID"
fi

# Test 20: Check error response format consistency
test_start "Check error response format is consistent"
ERROR_RESPONSE=$(curl -s -X GET "${API_BASE}/customers/invalid-id" \
    -H "Authorization: Bearer $TOKEN")
if echo "$ERROR_RESPONSE" | jq -e '.error or .message' > /dev/null 2>&1; then
    test_pass "Error responses have consistent format"
else
    test_warning "Error response format might be inconsistent"
fi

# ==========================================
# PHASE 6: EDGE CASE TESTS  
# ==========================================

log "PHASE 6: EDGE CASE & BOUNDARY TESTS"

# Test 21: Unicode characters in names
test_start "Unicode characters in customer name"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json; charset=utf-8" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Test 测试 тест","code":"UNI-'$TIMESTAMP'","email":"unicode'$TIMESTAMP'@test.com","sapCustomerId":"SAP-UNI-'$TIMESTAMP'","customerType":"retailer","channel":"modern_trade"}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
    test_pass "Unicode characters handled correctly"
else
    test_fail "Unicode characters not properly handled (HTTP $HTTP_CODE)" "MEDIUM"
fi

# Test 22: Empty string vs null values
test_start "Differentiate between empty string and null"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"","code":"EMPTY-'$TIMESTAMP'","email":"empty'$TIMESTAMP'@test.com"}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ]; then
    test_pass "Empty string correctly rejected"
else
    test_fail "Empty string accepted as valid (HTTP $HTTP_CODE)" "MEDIUM"
fi

# Test 23: Very large numbers
test_start "Handle very large numbers (JavaScript MAX_SAFE_INTEGER)"
MAX_SAFE_INT="9007199254740991"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Big Price","sku":"SKU-BIG-'$TIMESTAMP'","sapMaterialId":"MAT-BIG-'$TIMESTAMP'","productType":"own_brand","pricing":{"listPrice":'$MAX_SAFE_INT'}}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
    # Check if the number is preserved correctly
    SAVED_PRICE=$(echo "$BODY" | jq -r '.data.pricing.listPrice // .pricing.listPrice // .price // .data.price')
    if [ "$SAVED_PRICE" == "$MAX_SAFE_INT" ]; then
        test_pass "Large numbers handled correctly"
    else
        test_fail "Large number precision lost (Expected: $MAX_SAFE_INT, Got: $SAVED_PRICE)" "MEDIUM"
    fi
else
    test_warning "Large number rejected (HTTP $HTTP_CODE)"
fi

# Test 24: Special characters in codes
test_start "Special characters in product code"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Special","code":"TEST<>\"/'$TIMESTAMP'","category":"Test","price":100}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" == "400" ]; then
    test_pass "Special characters in code rejected"
elif echo "$BODY" | grep -q "<\|>\|\""; then
    test_fail "Special characters not escaped - XSS risk" "HIGH"
else
    test_pass "Special characters handled safely"
fi

# ==========================================
# PHASE 7: PERFORMANCE & CONCURRENCY
# ==========================================

log "PHASE 7: PERFORMANCE & CONCURRENCY TESTS"

# Test 25: Rate limiting check
test_start "Check if rate limiting is enforced"
RATE_LIMIT_TRIGGERED=false
for i in {1..110}; do
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/health")
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    if [ "$HTTP_CODE" == "429" ]; then
        RATE_LIMIT_TRIGGERED=true
        break
    fi
done
if [ "$RATE_LIMIT_TRIGGERED" == true ]; then
    test_pass "Rate limiting is active"
else
    test_warning "Rate limiting not triggered after 110 requests"
fi

# Test 26: Concurrent requests (race condition)
test_start "Test for race conditions in concurrent creates"
# Create multiple customers with same code simultaneously
RACE_CODE="RACE-$TIMESTAMP"
(curl -s -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Race1","code":"'$RACE_CODE'","email":"race1'$TIMESTAMP'@test.com"}' > /tmp/race1.txt 2>&1) &
(curl -s -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Race2","code":"'$RACE_CODE'","email":"race2'$TIMESTAMP'@test.com"}' > /tmp/race2.txt 2>&1) &
wait
SUCCESS_COUNT=$(grep -l "\"code\":\"$RACE_CODE\"" /tmp/race*.txt 2>/dev/null | wc -l)
if [ "$SUCCESS_COUNT" -le 1 ]; then
    test_pass "Race condition handled - only one request succeeded"
else
    test_fail "Race condition detected - duplicate code created" "HIGH"
fi

# ==========================================
# SUMMARY
# ==========================================

echo "" | tee -a "$LOG_FILE"
echo "================================================" | tee -a "$LOG_FILE"
echo "          CRITICAL UAT TEST SUMMARY" | tee -a "$LOG_FILE"
echo "================================================" | tee -a "$LOG_FILE"
echo "Total Tests: $TOTAL_TESTS" | tee -a "$LOG_FILE"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}" | tee -a "$LOG_FILE"
echo -e "${RED}Failed: $FAILED_TESTS${NC}" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Issues by Severity:" | tee -a "$LOG_FILE"
echo -e "${RED}  CRITICAL: $CRITICAL_ISSUES${NC}" | tee -a "$LOG_FILE"
echo -e "${RED}  HIGH: $HIGH_ISSUES${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}  MEDIUM: $MEDIUM_ISSUES${NC}" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "Pass Rate: $PASS_RATE%" | tee -a "$LOG_FILE"

if [ $CRITICAL_ISSUES -gt 0 ]; then
    echo -e "${RED}VERDICT: CRITICAL ISSUES FOUND - DO NOT DEPLOY${NC}" | tee -a "$LOG_FILE"
elif [ $HIGH_ISSUES -gt 3 ]; then
    echo -e "${YELLOW}VERDICT: MULTIPLE HIGH ISSUES - REQUIRES FIXES${NC}" | tee -a "$LOG_FILE"
elif [ $PASS_RATE -lt 80 ]; then
    echo -e "${YELLOW}VERDICT: PASS RATE TOO LOW - REQUIRES FIXES${NC}" | tee -a "$LOG_FILE"
else
    echo -e "${GREEN}VERDICT: ACCEPTABLE FOR DEPLOYMENT WITH FIXES${NC}" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "Detailed log saved to: $LOG_FILE" | tee -a "$LOG_FILE"
echo "================================================" | tee -a "$LOG_FILE"

exit 0
