#!/bin/bash

###############################################################################
# TRADEAI Enterprise Features Testing Script
# Tests all enterprise endpoints and features
###############################################################################

set -e

# Configuration
API_URL="${API_URL:-https://tradeai.gonxt.tech/api}"
TOKEN=""
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@gonxt.tech}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123456}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Function to make authenticated API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "${API_URL}${endpoint}"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${API_URL}${endpoint}"
    fi
}

# Login and get token
print_header "Authentication"
print_test "Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    "${API_URL}/auth/login")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -n "$TOKEN" ]; then
    print_pass "Authentication successful"
else
    print_fail "Authentication failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

###############################################################################
# TEST SUITE 1: DASHBOARD ENDPOINTS
###############################################################################

print_header "Testing Dashboard Endpoints"

# Test 1: Executive Dashboard
print_test "GET /enterprise/dashboards/executive"
EXEC_DASH=$(api_call GET "/enterprise/dashboards/executive?year=2025")
if echo "$EXEC_DASH" | grep -q "success"; then
    print_pass "Executive dashboard accessible"
else
    print_fail "Executive dashboard failed"
    echo "Response: $EXEC_DASH"
fi

# Test 2: Real-time KPIs
print_test "GET /enterprise/dashboards/kpis/realtime"
KPI_RESPONSE=$(api_call GET "/enterprise/dashboards/kpis/realtime?period=today")
if echo "$KPI_RESPONSE" | grep -q "success"; then
    print_pass "Real-time KPIs accessible"
else
    print_fail "Real-time KPIs failed"
fi

# Test 3: Trade Spend Dashboard
print_test "GET /enterprise/dashboards/trade-spend"
TRADE_SPEND=$(api_call GET "/enterprise/dashboards/trade-spend?year=2025")
if echo "$TRADE_SPEND" | grep -q "success"; then
    print_pass "Trade spend dashboard accessible"
else
    print_fail "Trade spend dashboard failed"
fi

# Test 4: Promotion Dashboard
print_test "GET /enterprise/dashboards/promotions"
PROMO_DASH=$(api_call GET "/enterprise/dashboards/promotions?period=current")
if echo "$PROMO_DASH" | grep -q "success"; then
    print_pass "Promotion dashboard accessible"
else
    print_fail "Promotion dashboard failed"
fi

# Test 5: Sales Performance Dashboard
print_test "GET /enterprise/dashboards/sales-performance"
SALES_DASH=$(api_call GET "/enterprise/dashboards/sales-performance?period=ytd")
if echo "$SALES_DASH" | grep -q "success"; then
    print_pass "Sales performance dashboard accessible"
else
    print_fail "Sales performance dashboard failed"
fi

###############################################################################
# TEST SUITE 2: SIMULATION ENDPOINTS
###############################################################################

print_header "Testing Simulation Endpoints"

# Test 6: Promotion Impact Simulation
print_test "POST /enterprise/simulations/promotion-impact"
PROMO_SIM=$(api_call POST "/enterprise/simulations/promotion-impact" '{
    "promotionType": "discount",
    "discount": 0.15,
    "duration": 30,
    "products": [],
    "budget": 50000
}')
if echo "$PROMO_SIM" | grep -q "success"; then
    print_pass "Promotion simulation works"
else
    print_fail "Promotion simulation failed"
    echo "Response: $PROMO_SIM"
fi

# Test 7: Budget Allocation Simulation
print_test "POST /enterprise/simulations/budget-allocation"
BUDGET_SIM=$(api_call POST "/enterprise/simulations/budget-allocation" '{
    "totalBudget": 100000,
    "categories": ["marketing", "trade", "promotion"],
    "objective": "maximize_roi"
}')
if echo "$BUDGET_SIM" | grep -q "success"; then
    print_pass "Budget allocation simulation works"
else
    print_fail "Budget allocation simulation failed"
fi

# Test 8: Pricing Strategy Simulation
print_test "POST /enterprise/simulations/pricing-strategy"
PRICING_SIM=$(api_call POST "/enterprise/simulations/pricing-strategy" '{
    "products": [],
    "pricingModel": "value_based",
    "priceChange": 0.10,
    "targetMargin": 25
}')
if echo "$PRICING_SIM" | grep -q "success"; then
    print_pass "Pricing strategy simulation works"
else
    print_fail "Pricing strategy simulation failed"
fi

# Test 9: ROI Optimization Simulation
print_test "POST /enterprise/simulations/roi-optimization"
ROI_SIM=$(api_call POST "/enterprise/simulations/roi-optimization" '{
    "budget": 75000,
    "activities": ["trade_marketing", "consumer_promotion", "digital_advertising"],
    "targetROI": 150
}')
if echo "$ROI_SIM" | grep -q "success"; then
    print_pass "ROI optimization simulation works"
else
    print_fail "ROI optimization simulation failed"
fi

###############################################################################
# TEST SUITE 3: TRANSACTION ENDPOINTS
###############################################################################

print_header "Testing Transaction Endpoints"

# Test 10: Create Transaction
print_test "POST /enterprise/transactions"
CREATE_TRANS=$(api_call POST "/enterprise/transactions" '{
    "transactionType": "order",
    "customerId": "507f1f77bcf86cd799439011",
    "items": [
        {
            "productId": "507f1f77bcf86cd799439012",
            "quantity": 10,
            "unitPrice": 100,
            "total": 1000
        }
    ],
    "amount": {
        "gross": 1000,
        "net": 1000,
        "tax": 0,
        "discount": 0
    },
    "currency": "USD"
}' 2>&1)

TRANSACTION_ID=""
if echo "$CREATE_TRANS" | grep -q "success\|_id"; then
    print_pass "Transaction creation works"
    TRANSACTION_ID=$(echo "$CREATE_TRANS" | grep -o '"_id":"[^"]*' | cut -d'"' -f4 | head -1)
else
    print_fail "Transaction creation failed"
    echo "Response: $CREATE_TRANS"
fi

# Test 11: Get Transactions
print_test "GET /enterprise/transactions"
GET_TRANS=$(api_call GET "/enterprise/transactions?page=1&limit=10")
if echo "$GET_TRANS" | grep -q "success\|data"; then
    print_pass "Get transactions works"
else
    print_fail "Get transactions failed"
fi

# Test 12: Get Pending Approvals
print_test "GET /enterprise/transactions/pending-approvals"
PENDING=$(api_call GET "/enterprise/transactions/pending-approvals")
if echo "$PENDING" | grep -q "success\|data"; then
    print_pass "Get pending approvals works"
else
    print_fail "Get pending approvals failed"
fi

###############################################################################
# TEST SUITE 4: DATA MANAGEMENT ENDPOINTS
###############################################################################

print_header "Testing Data Management Endpoints"

# Test 13: Search with Facets
print_test "POST /enterprise/data/product/search"
SEARCH_RESULT=$(api_call POST "/enterprise/data/product/search" '{
    "filters": {},
    "facets": ["category", "brand"]
}' 2>&1)
if echo "$SEARCH_RESULT" | grep -q "success\|documents"; then
    print_pass "Faceted search works"
else
    print_fail "Faceted search failed"
    echo "Response: $SEARCH_RESULT"
fi

# Test 14: Export Data (dry run test)
print_test "POST /enterprise/data/product/export (validation)"
EXPORT_TEST=$(api_call POST "/enterprise/data/product/export" '{
    "format": "json",
    "filters": {},
    "fields": ["name", "sku", "price"]
}' 2>&1)
if echo "$EXPORT_TEST" | grep -q "success\|\["; then
    print_pass "Export endpoint accessible"
else
    print_fail "Export endpoint failed"
    echo "Response: $EXPORT_TEST"
fi

###############################################################################
# TEST SUITE 5: HEALTH CHECKS
###############################################################################

print_header "System Health Checks"

# Test 15: API Health
print_test "GET /health"
HEALTH=$(curl -s "${API_URL}/health")
if echo "$HEALTH" | grep -q "ok"; then
    print_pass "API health check passed"
else
    print_fail "API health check failed"
fi

# Test 16: Enterprise Routes Registered
print_test "Enterprise routes registration"
# Check if enterprise endpoint returns appropriate response (not 404)
ENTERPRISE_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/enterprise" 2>&1)
if [ "$ENTERPRISE_CHECK" != "404" ]; then
    print_pass "Enterprise routes registered"
else
    print_fail "Enterprise routes not found"
fi

###############################################################################
# TEST SUMMARY
###############################################################################

print_header "Test Results Summary"

echo ""
echo "Total Tests:  $TOTAL_TESTS"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo ""

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "Pass Rate:    ${PASS_RATE}%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         All Enterprise Features Tests PASSED!             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║    Some tests failed. Review output above for details.    ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
