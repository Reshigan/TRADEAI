#!/bin/bash

###############################################################################
# TRADEAI Enterprise Production Test Suite
# Tests all enterprise endpoints with real demo data
###############################################################################

API_URL="https://tradeai.gonxt.tech/api"
TOKEN=""
TENANT_ID=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test API endpoint
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    local data="$4"
    
    log_test "$description"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        log_success "HTTP $http_code - $description"
        echo "$body" | jq '.' 2>/dev/null | head -10
    else
        log_failure "HTTP $http_code - $description"
        echo "$body" | head -5
    fi
    
    echo ""
}

###############################################################################
# START TESTS
###############################################################################

echo "═══════════════════════════════════════════════════════════"
echo "  TRADEAI Enterprise Production Test Suite"
echo "  Testing: $API_URL"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test 1: Health Check
log_test "System Health Check"
health=$(curl -s "$API_URL/health")
if echo "$health" | grep -q "healthy"; then
    log_success "System is healthy"
else
    log_failure "System health check failed"
fi
echo ""

# Test 2: Login
log_test "Authentication - Admin Login"
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@mondelez.co.za","password":"Admin@123456"}' \
    "$API_URL/auth/login")

TOKEN=$(echo "$login_response" | jq -r '.token // .data.token // .access_token // empty' 2>/dev/null)
TENANT_ID=$(echo "$login_response" | jq -r '.user.tenantId // .data.user.tenantId // empty' 2>/dev/null)

if [ -n "$TOKEN" ]; then
    log_success "Login successful - Token received"
    log_info "Tenant ID: $TENANT_ID"
else
    log_failure "Login failed - No token received"
    echo "$login_response" | jq '.' 2>/dev/null
    exit 1
fi
echo ""

###############################################################################
# ENTERPRISE DASHBOARD TESTS
###############################################################################

echo "───────────────────────────────────────────────────────────"
echo "  ENTERPRISE DASHBOARD TESTS"
echo "───────────────────────────────────────────────────────────"
echo ""

# Test Executive Dashboard
test_endpoint "GET" "/enterprise/dashboards/executive" "Executive Dashboard"

# Test Sales Dashboard
test_endpoint "GET" "/enterprise/dashboards/sales" "Sales Dashboard"

# Test Financial Dashboard
test_endpoint "GET" "/enterprise/dashboards/financial" "Financial Dashboard"

# Test Customer Dashboard
test_endpoint "GET" "/enterprise/dashboards/customer" "Customer Dashboard"

# Test Product Dashboard
test_endpoint "GET" "/enterprise/dashboards/product" "Product Dashboard"

# Test Operations Dashboard
test_endpoint "GET" "/enterprise/dashboards/operations" "Operations Dashboard"

###############################################################################
# CRUD OPERATIONS TESTS
###############################################################################

echo "───────────────────────────────────────────────────────────"
echo "  CRUD OPERATIONS TESTS"
echo "───────────────────────────────────────────────────────────"
echo ""

# Test List Customers
test_endpoint "GET" "/enterprise/crud/customers?page=1&limit=10" "List Customers (Paginated)"

# Test List Products
test_endpoint "GET" "/enterprise/crud/products?page=1&limit=10" "List Products (Paginated)"

# Test List Transactions
test_endpoint "GET" "/enterprise/crud/transactions?page=1&limit=10" "List Transactions (Paginated)"

# Test Search
test_endpoint "GET" "/enterprise/crud/customers?search=shoprite" "Search Customers"

# Test Bulk Export
test_endpoint "POST" "/enterprise/crud/transactions/export" "Export Transactions (CSV)" \
    '{"format":"csv","filters":{"status":"completed"},"limit":100}'

###############################################################################
# SIMULATION TESTS
###############################################################################

echo "───────────────────────────────────────────────────────────"
echo "  SIMULATION ENGINE TESTS"
echo "───────────────────────────────────────────────────────────"
echo ""

# Test Price Sensitivity Simulation
test_endpoint "POST" "/enterprise/simulations/price-sensitivity" "Price Sensitivity Simulation" \
    '{"productIds":[],"priceChanges":[{"percentage":10},{"percentage":-10}],"period":"2024-Q4"}'

# Test Promotion Impact Simulation
test_endpoint "POST" "/enterprise/simulations/promotion-impact" "Promotion Impact Simulation" \
    '{"promotionType":"discount","discountPercentage":15,"durationDays":14,"targetProducts":[]}'

# Test Budget Allocation Simulation
test_endpoint "POST" "/enterprise/simulations/budget-allocation" "Budget Allocation Simulation" \
    '{"totalBudget":1000000,"categories":["marketing","trade","promotions"]}'

# Test Demand Forecast
test_endpoint "POST" "/enterprise/simulations/demand-forecast" "Demand Forecasting" \
    '{"period":"2024-Q4","products":[],"method":"ml"}'

###############################################################################
# TRANSACTION MANAGEMENT TESTS
###############################################################################

echo "───────────────────────────────────────────────────────────"
echo "  TRANSACTION MANAGEMENT TESTS"
echo "───────────────────────────────────────────────────────────"
echo ""

# Test Transaction Analytics
test_endpoint "GET" "/enterprise/transactions/analytics?period=last_30_days" "Transaction Analytics"

# Test Transaction Summary
test_endpoint "GET" "/enterprise/transactions/summary" "Transaction Summary"

# Test Transaction Trends
test_endpoint "GET" "/enterprise/transactions/trends?period=2024" "Transaction Trends"

###############################################################################
# ANALYTICS & REPORTING TESTS
###############################################################################

echo "───────────────────────────────────────────────────────────"
echo "  ANALYTICS & REPORTING TESTS"
echo "───────────────────────────────────────────────────────────"
echo ""

# Test KPIs
test_endpoint "GET" "/enterprise/dashboards/kpis" "Key Performance Indicators"

# Test Drill-down Analysis
test_endpoint "POST" "/enterprise/dashboards/drill-down" "Drill-down Analysis" \
    '{"metric":"revenue","dimension":"customer","filters":{}}'

# Test Comparative Analysis
test_endpoint "POST" "/enterprise/dashboards/compare" "Comparative Analysis" \
    '{"metrics":["revenue","profit"],"periods":["2024-Q3","2024-Q4"]}'

###############################################################################
# DATA INTEGRITY TESTS
###############################################################################

echo "───────────────────────────────────────────────────────────"
echo "  DATA INTEGRITY TESTS"
echo "───────────────────────────────────────────────────────────"
echo ""

log_test "Verify Seeded Data - Users"
user_count=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/users" | jq '. | length' 2>/dev/null || echo "0")
if [ "$user_count" -ge 8 ]; then
    log_success "Users: $user_count (expected: 8)"
else
    log_failure "Users: $user_count (expected: >= 8)"
fi
echo ""

log_test "Verify Seeded Data - Customers"
customer_count=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/customers" | jq '.data | length' 2>/dev/null || echo "0")
if [ "$customer_count" -ge 10 ]; then
    log_success "Customers: $customer_count (expected: 10)"
else
    log_failure "Customers: $customer_count (expected: >= 10)"
fi
echo ""

log_test "Verify Seeded Data - Products"
product_count=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/products" | jq '.data | length' 2>/dev/null || echo "0")
if [ "$product_count" -ge 10 ]; then
    log_success "Products: $product_count (expected: 10)"
else
    log_failure "Products: $product_count (expected: >= 10)"
fi
echo ""

log_test "Verify Seeded Data - Transactions"
transaction_response=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/transactions?page=1&limit=1")
transaction_total=$(echo "$transaction_response" | jq '.pagination.total' 2>/dev/null || echo "0")
if [ "$transaction_total" -ge 50000 ]; then
    log_success "Transactions: $transaction_total (expected: 50,000)"
else
    log_failure "Transactions: $transaction_total (expected: >= 50,000)"
fi
echo ""

###############################################################################
# SUMMARY
###############################################################################

echo "═══════════════════════════════════════════════════════════"
echo "  TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo ""
    echo "🌍 Production System: https://tradeai.gonxt.tech"
    echo "📊 Database: 50,000+ transactions, 10 retailers, 10 products"
    echo "👤 Login: admin@mondelez.co.za / Admin@123456"
    echo ""
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    exit 1
fi
