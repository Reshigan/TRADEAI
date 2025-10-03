#!/bin/bash

##############################################################################
# COMPREHENSIVE USER ACCEPTANCE TEST (UAT) SUITE
# Tests all 49 endpoints across basic auth and advanced features
##############################################################################

# Note: Not using 'set -e' to allow all tests to run even if some fail

BASE_URL="http://localhost:5002"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test result tracking
declare -a FAILED_TEST_NAMES=()
declare -a WARNING_TEST_NAMES=()

echo "════════════════════════════════════════════════════════════════════"
echo "              TRADEAI COMPREHENSIVE UAT TEST SUITE                  "
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Test Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Base URL: $BASE_URL"
echo ""

##############################################################################
# HELPER FUNCTIONS
##############################################################################

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local token="$5"
    local expected_status="$6"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local headers=(-H "Content-Type: application/json")
    if [ -n "$token" ]; then
        headers+=(-H "Authorization: Bearer $token")
    fi
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${BASE_URL}${endpoint}" "${headers[@]}" -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${BASE_URL}${endpoint}" "${headers[@]}" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} TEST $TOTAL_TESTS: $name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} TEST $TOTAL_TESTS: $name"
        echo -e "  ${YELLOW}Expected: $expected_status, Got: $http_code${NC}"
        echo -e "  ${YELLOW}Response: ${body:0:200}${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_TEST_NAMES+=("$name (Expected: $expected_status, Got: $http_code)")
        return 1
    fi
}

test_json_field() {
    local name="$1"
    local response="$2"
    local field="$3"
    local expected="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    actual=$(echo "$response" | python3 -c "import json, sys; d=json.load(sys.stdin); print(d.get('$field', 'FIELD_NOT_FOUND'))" 2>/dev/null || echo "PARSE_ERROR")
    
    if [ "$actual" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} TEST $TOTAL_TESTS: $name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} TEST $TOTAL_TESTS: $name"
        echo -e "  ${YELLOW}Field: $field${NC}"
        echo -e "  ${YELLOW}Expected: $expected, Got: $actual${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_TEST_NAMES+=("$name (Field: $field, Expected: $expected, Got: $actual)")
        return 1
    fi
}

warning_test() {
    local name="$1"
    local message="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    WARNINGS=$((WARNINGS + 1))
    WARNING_TEST_NAMES+=("$name: $message")
    echo -e "${YELLOW}⚠${NC} TEST $TOTAL_TESTS: $name - $message"
}

section_header() {
    echo ""
    echo "════════════════════════════════════════════════════════════════════"
    echo -e "${BLUE}$1${NC}"
    echo "════════════════════════════════════════════════════════════════════"
    echo ""
}

##############################################################################
# PHASE 1: BASIC AUTHENTICATION TESTS (22 tests)
##############################################################################

section_header "PHASE 1: BASIC AUTHENTICATION & CORE FEATURES"

# Test 1-3: Health Checks
echo "--- Health & System Status ---"
test_endpoint "Health check endpoint" "GET" "/health" "" "" "200"
test_endpoint "Kubernetes liveness probe" "GET" "/health/liveness" "" "" "200"
test_endpoint "Kubernetes readiness probe" "GET" "/health/ready" "" "" "200"

# Test 4-5: Authentication
echo ""
echo "--- Authentication ---"
TOKEN=""
response=$(curl -s -X POST ${BASE_URL}/api/auth/quick-login \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}')

TOKEN=$(echo "$response" | python3 -c "import json, sys; d=json.load(sys.stdin); print(d.get('data', {}).get('accessToken', ''))" 2>/dev/null || echo "")

# Extract tenantId from token for use as company ID
if [ -n "$TOKEN" ] && [ "$TOKEN" != "None" ]; then
    # Decode JWT token to extract tenantId
    TENANT_ID=$(echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | python3 -c "import json, sys; d=json.load(sys.stdin); print(d.get('tenantId', ''))" 2>/dev/null || echo "")
    echo -e "${GREEN}✓${NC} TEST 4: Quick login successful (admin token obtained)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${RED}✗${NC} TEST 4: Quick login failed (no token received)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TEST_NAMES+=("Quick login failed")
    echo "Cannot continue without authentication token"
    exit 1
fi

test_endpoint "Protected endpoint with valid token" "GET" "/api/users/me" "" "$TOKEN" "200"

# Test 6-8: User Management
echo ""
echo "--- User Management ---"
test_endpoint "Get all users" "GET" "/api/users" "" "$TOKEN" "200"
test_endpoint "Get current user profile" "GET" "/api/users/me" "" "$TOKEN" "200"
test_endpoint "Get specific user by ID" "GET" "/api/users/68dfb3dbef224f907f5fdc1e" "" "$TOKEN" "200"

# Test 9-11: Customer Management
echo ""
echo "--- Customer Management ---"
test_endpoint "Get all customers" "GET" "/api/customers" "" "$TOKEN" "200"

customer_response=$(curl -s -X POST ${BASE_URL}/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Customer UAT",
    "code": "TST-UAT-'$(date +%s)'",
    "sapCustomerId": "SAP-CUST-'$(date +%s)'",
    "customerType": "retailer",
    "channel": "modern_trade",
    "tier": "silver",
    "status": "active"
  }')

CUSTOMER_ID=$(echo "$customer_response" | python3 -c "import json, sys; d=json.load(sys.stdin); print(d.get('data', {}).get('_id', ''))" 2>/dev/null || echo "")

if [ -n "$CUSTOMER_ID" ] && [ "$CUSTOMER_ID" != "None" ]; then
    echo -e "${GREEN}✓${NC} TEST 9: Create customer successful (ID: ${CUSTOMER_ID:0:24})"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${RED}✗${NC} TEST 9: Create customer failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TEST_NAMES+=("Create customer failed")
fi

if [ -n "$CUSTOMER_ID" ]; then
    test_endpoint "Get specific customer" "GET" "/api/customers/$CUSTOMER_ID" "" "$TOKEN" "200"
    test_endpoint "Delete customer" "DELETE" "/api/customers/$CUSTOMER_ID" "" "$TOKEN" "200"
else
    warning_test "Get specific customer" "Skipped - no customer ID"
    warning_test "Delete customer" "Skipped - no customer ID"
fi

# Test 12-14: Product Management
echo ""
echo "--- Product Management ---"
test_endpoint "Get all products" "GET" "/api/products" "" "$TOKEN" "200"

product_response=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Product UAT",
    "sku": "TST-PRD-'$(date +%s)'",
    "sapMaterialId": "SAP-MAT-'$(date +%s)'",
    "productType": "own_brand",
    "category": {"primary": "Electronics"},
    "brand": {"name": "TestBrand"},
    "description": "UAT test product",
    "pricing": {
      "listPrice": 99.99,
      "currency": "ZAR"
    },
    "status": "active"
  }')

PRODUCT_ID=$(echo "$product_response" | python3 -c "import json, sys; d=json.load(sys.stdin); print(d.get('data', {}).get('_id', ''))" 2>/dev/null || echo "")

if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "None" ]; then
    echo -e "${GREEN}✓${NC} TEST 12: Create product successful (ID: ${PRODUCT_ID:0:24})"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${RED}✗${NC} TEST 12: Create product failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TEST_NAMES+=("Create product failed")
fi

if [ -n "$PRODUCT_ID" ]; then
    test_endpoint "Get specific product" "GET" "/api/products/$PRODUCT_ID" "" "$TOKEN" "200"
    test_endpoint "Delete product" "DELETE" "/api/products/$PRODUCT_ID" "" "$TOKEN" "200"
else
    warning_test "Get specific product" "Skipped - no product ID"
    warning_test "Delete product" "Skipped - no product ID"
fi

# Test 15-17: Vendor Management
echo ""
echo "--- Vendor Management ---"
test_endpoint "Get all vendors" "GET" "/api/vendors" "" "$TOKEN" "200"

vendor_response=$(curl -s -X POST ${BASE_URL}/api/vendors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Vendor UAT",
    "code": "TST-VND-'$(date +%s)'",
    "sapVendorId": "SAP-VND-'$(date +%s)'",
    "vendorType": "distributor",
    "status": "active"
  }')

VENDOR_ID=$(echo "$vendor_response" | python3 -c "import json, sys; d=json.load(sys.stdin); print(d.get('data', {}).get('_id', ''))" 2>/dev/null || echo "")

if [ -n "$VENDOR_ID" ] && [ "$VENDOR_ID" != "None" ]; then
    echo -e "${GREEN}✓${NC} TEST 15: Create vendor successful (ID: ${VENDOR_ID:0:24})"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${RED}✗${NC} TEST 15: Create vendor failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TEST_NAMES+=("Create vendor failed")
fi

if [ -n "$VENDOR_ID" ]; then
    test_endpoint "Get specific vendor" "GET" "/api/vendors/$VENDOR_ID" "" "$TOKEN" "200"
    test_endpoint "Delete vendor" "DELETE" "/api/vendors/$VENDOR_ID" "" "$TOKEN" "200"
else
    warning_test "Get specific vendor" "Skipped - no vendor ID"
    warning_test "Delete vendor" "Skipped - no vendor ID"
fi

# Test 18-22: Error Handling & Security
echo ""
echo "--- Error Handling & Security ---"
test_endpoint "404 on invalid endpoint" "GET" "/api/invalid-endpoint-test" "" "$TOKEN" "404"
test_endpoint "400 on missing tenant/auth" "GET" "/api/users" "" "" "400"
test_endpoint "401 on invalid token" "GET" "/api/users" "" "invalid_token_12345" "401"
test_endpoint "400 on invalid data format" "POST" "/api/customers" '{"invalid": "data"}' "$TOKEN" "400"
test_endpoint "404 on unsupported method" "PATCH" "/health" "" "" "404"

##############################################################################
# PHASE 2: ADVANCED FEATURES TESTS (27 tests)
##############################################################################

section_header "PHASE 2: ADVANCED FEATURES"

# Test 23-29: Trade Spend Routes (7 tests)
echo "--- Trade Spend Management ---"
test_endpoint "List all trade spend records" "GET" "/api/trade-spends" "" "$TOKEN" "200"

trade_spend_response=$(curl -s -X POST ${BASE_URL}/api/trade-spends \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "spendType": "marketing",
    "category": "trade_marketing",
    "amount": {
      "requested": 5000,
      "currency": "ZAR"
    },
    "period": {
      "startDate": "2025-10-01T00:00:00.000Z",
      "endDate": "2025-10-31T23:59:59.000Z"
    },
    "company": "'$TENANT_ID'",
    "customer": "'$CUSTOMER_ID'",
    "vendor": "'$VENDOR_ID'",
    "description": "UAT test trade spend",
    "status": "draft"
  }')

TRADE_SPEND_ID=$(echo "$trade_spend_response" | python3 -c "import json, sys; d=json.load(sys.stdin); print(d.get('data', {}).get('_id', ''))" 2>/dev/null || echo "")

if [ -n "$TRADE_SPEND_ID" ] && [ "$TRADE_SPEND_ID" != "None" ]; then
    echo -e "${GREEN}✓${NC} TEST 23: Create trade spend successful (ID: ${TRADE_SPEND_ID:0:24})"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${YELLOW}⚠${NC} TEST 23: Create trade spend - checking response..."
    echo "$trade_spend_response" | python3 -c "import json, sys; print(json.dumps(json.load(sys.stdin), indent=2))" 2>/dev/null | head -20
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TEST_NAMES+=("Create trade spend failed")
fi

if [ -n "$TRADE_SPEND_ID" ] && [ "$TRADE_SPEND_ID" != "None" ]; then
    test_endpoint "Get specific trade spend" "GET" "/api/trade-spends/$TRADE_SPEND_ID" "" "$TOKEN" "200"
    test_endpoint "Update trade spend" "PUT" "/api/trade-spends/$TRADE_SPEND_ID" '{"amount": {"requested": 6000, "currency": "ZAR"}}' "$TOKEN" "200"
    test_endpoint "Get trade spend by vendor" "GET" "/api/trade-spends/vendor/$VENDOR_ID" "" "$TOKEN" "200"
    test_endpoint "Get trade spend analytics" "GET" "/api/analytics/trade-spend" "" "$TOKEN" "200"
    test_endpoint "Delete trade spend" "DELETE" "/api/trade-spends/$TRADE_SPEND_ID" "" "$TOKEN" "200"
else
    warning_test "Get specific trade spend" "Skipped - no trade spend ID"
    warning_test "Update trade spend" "Skipped - no trade spend ID"
    warning_test "Get trade spend by vendor" "Skipped - no vendor ID"
    warning_test "Get trade spend analytics" "Skipped - dependency failed"
    warning_test "Delete trade spend" "Skipped - no trade spend ID"
fi

# Test 30-36: Promotion Routes (7 tests)
echo ""
echo "--- Promotion Management ---"
test_endpoint "List all promotions" "GET" "/api/promotions" "" "$TOKEN" "200"

promotion_response=$(curl -s -X POST ${BASE_URL}/api/promotions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "promotionId": "UAT-PROMO-001",
    "name": "UAT Test Promotion",
    "promotionType": "price_discount",
    "description": "Test promotion for UAT",
    "period": {
      "startDate": "2025-10-01T00:00:00.000Z",
      "endDate": "2025-10-31T23:59:59.000Z"
    },
    "products": [
      {
        "product": "'$PRODUCT_ID'",
        "includeVariants": true
      }
    ],
    "scope": {
      "customers": [
        {
          "customer": "'$CUSTOMER_ID'",
          "stores": [],
          "exclusions": []
        }
      ]
    },
    "mechanics": {
      "discountType": "percentage",
      "discountValue": 15
    },
    "status": "draft"
  }')

PROMOTION_ID=$(echo "$promotion_response" | python3 -c "import json, sys; d=json.load(sys.stdin); print(d.get('data', {}).get('_id', ''))" 2>/dev/null || echo "")

if [ -n "$PROMOTION_ID" ] && [ "$PROMOTION_ID" != "None" ]; then
    echo -e "${GREEN}✓${NC} TEST 30: Create promotion successful (ID: ${PROMOTION_ID:0:24})"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${YELLOW}⚠${NC} TEST 30: Create promotion - checking response..."
    echo "$promotion_response" | python3 -c "import json, sys; print(json.dumps(json.load(sys.stdin), indent=2))" 2>/dev/null | head -20
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TEST_NAMES+=("Create promotion failed")
fi

if [ -n "$PROMOTION_ID" ] && [ "$PROMOTION_ID" != "None" ]; then
    test_endpoint "Get specific promotion" "GET" "/api/promotions/$PROMOTION_ID" "" "$TOKEN" "200"
    test_endpoint "Update promotion" "PUT" "/api/promotions/$PROMOTION_ID" '{"discountPercentage": 20}' "$TOKEN" "200"
    test_endpoint "Get active promotions" "GET" "/api/promotions?status=active" "" "$TOKEN" "200"
    test_endpoint "Get promotion analytics" "GET" "/api/analytics/promotions" "" "$TOKEN" "200"
    test_endpoint "Delete promotion" "DELETE" "/api/promotions/$PROMOTION_ID" "" "$TOKEN" "200"
else
    warning_test "Get specific promotion" "Skipped - no promotion ID"
    warning_test "Update promotion" "Skipped - no promotion ID"
    warning_test "Get active promotions" "Skipped - dependency failed"
    warning_test "Get promotion analytics" "Skipped - dependency failed"
    warning_test "Delete promotion" "Skipped - no promotion ID"
fi

# Test 37-41: Budget Routes (5 tests)
echo ""
echo "--- Budget Management ---"
test_endpoint "List all budgets" "GET" "/api/budgets" "" "$TOKEN" "200"

TIMESTAMP=$(date +%s)
budget_response=$(curl -s -X POST ${BASE_URL}/api/budgets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "UAT-BUDGET-2025-'$TIMESTAMP'",
    "name": "UAT Test Budget 2025",
    "company": "'$TENANT_ID'",
    "year": 2025,
    "budgetType": "budget",
    "scope": {
      "level": "company"
    },
    "totalAmount": 100000,
    "currency": "ZAR",
    "generateForecast": false,
    "status": "draft"
  }')

BUDGET_ID=$(echo "$budget_response" | python3 -c "import json, sys; d=json.load(sys.stdin); print(d.get('data', {}).get('_id', ''))" 2>/dev/null || echo "")

if [ -n "$BUDGET_ID" ] && [ "$BUDGET_ID" != "None" ]; then
    echo -e "${GREEN}✓${NC} TEST 37: Create budget successful (ID: ${BUDGET_ID:0:24})"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${YELLOW}⚠${NC} TEST 37: Create budget - checking response..."
    echo "$budget_response" | python3 -c "import json, sys; print(json.dumps(json.load(sys.stdin), indent=2))" 2>/dev/null | head -20
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TEST_NAMES+=("Create budget failed")
fi

if [ -n "$BUDGET_ID" ] && [ "$BUDGET_ID" != "None" ]; then
    test_endpoint "Get specific budget" "GET" "/api/budgets/$BUDGET_ID" "" "$TOKEN" "200"
    test_endpoint "Update budget" "PUT" "/api/budgets/$BUDGET_ID" '{"totalAmount": 120000}' "$TOKEN" "200"
    test_endpoint "Delete budget" "DELETE" "/api/budgets/$BUDGET_ID" "" "$TOKEN" "200"
else
    warning_test "Get specific budget" "Skipped - no budget ID"
    warning_test "Update budget" "Skipped - no budget ID"
    warning_test "Delete budget" "Skipped - no budget ID"
fi

# Test 42-45: Analytics Routes (4 tests)
echo ""
echo "--- Analytics ---"
test_endpoint "Get dashboard analytics" "GET" "/api/analytics/dashboard" "" "$TOKEN" "200"
test_endpoint "Get trade spend analytics" "GET" "/api/analytics/trade-spend" "" "$TOKEN" "200"
test_endpoint "Get promotion analytics" "GET" "/api/analytics/promotions" "" "$TOKEN" "200"
test_endpoint "Get budget analytics" "GET" "/api/analytics/budgets" "" "$TOKEN" "200"

# Test 46-49: ML/AI Routes (4 tests)
echo ""
echo "--- ML/AI Features ---"
test_endpoint "List ML models" "GET" "/api/ml/models" "" "$TOKEN" "200"
test_endpoint "Get AI insights" "GET" "/api/ml/insights/sales-forecast" "" "$TOKEN" "200"
test_endpoint "Make ML forecast" "POST" "/api/ml/forecast" '{"type": "sales", "targetId": "'$PRODUCT_ID'", "horizon": 3}' "$TOKEN" "200"
test_endpoint "Train ML model" "POST" "/api/ml/train" '{"modelId": "sales-forecast", "parameters": {}}' "$TOKEN" "200"

##############################################################################
# TEST SUMMARY
##############################################################################

section_header "TEST EXECUTION SUMMARY"

echo "Total Tests Executed:  $TOTAL_TESTS"
echo -e "${GREEN}Tests Passed:          $PASSED_TESTS${NC}"
echo -e "${RED}Tests Failed:          $FAILED_TESTS${NC}"
echo -e "${YELLOW}Tests with Warnings:   $WARNINGS${NC}"
echo ""

PASS_RATE=0
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
fi

echo "Pass Rate: $PASS_RATE%"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
    echo "════════════════════════════════════════════════════════════════════"
    echo -e "${RED}FAILED TESTS:${NC}"
    echo "════════════════════════════════════════════════════════════════════"
    for test_name in "${FAILED_TEST_NAMES[@]}"; do
        echo -e "  ${RED}✗${NC} $test_name"
    done
    echo ""
fi

if [ $WARNINGS -gt 0 ]; then
    echo "════════════════════════════════════════════════════════════════════"
    echo -e "${YELLOW}WARNINGS:${NC}"
    echo "════════════════════════════════════════════════════════════════════"
    for warning_name in "${WARNING_TEST_NAMES[@]}"; do
        echo -e "  ${YELLOW}⚠${NC} $warning_name"
    done
    echo ""
fi

echo "════════════════════════════════════════════════════════════════════"
if [ $PASS_RATE -ge 95 ]; then
    echo -e "${GREEN}✓ EXCELLENT: UAT PASSED WITH ${PASS_RATE}% SUCCESS RATE${NC}"
elif [ $PASS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠ GOOD: UAT PASSED WITH ${PASS_RATE}% SUCCESS RATE (Some issues)${NC}"
elif [ $PASS_RATE -ge 60 ]; then
    echo -e "${YELLOW}⚠ FAIR: UAT COMPLETED WITH ${PASS_RATE}% SUCCESS RATE (Multiple issues)${NC}"
else
    echo -e "${RED}✗ CRITICAL: UAT FAILED WITH ${PASS_RATE}% SUCCESS RATE${NC}"
fi
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Exit with appropriate code
if [ $PASS_RATE -ge 80 ]; then
    exit 0
else
    exit 1
fi
