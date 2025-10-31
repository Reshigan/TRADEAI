#!/bin/bash

# TRADEAI Backend API Discovery Script
# Explores and documents actual backend endpoints
# Version: 1.0

set -e

# Configuration
API_URL="${API_URL:-https://tradeai.gonxt.tech/api}"
OUTPUT_DIR="backend-api-discovery"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create output directory
mkdir -p "$OUTPUT_DIR"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test endpoint and save response
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local auth_token="$3"
    local data="$4"
    local description="$5"
    
    log_info "Testing: $method $endpoint"
    
    local headers="-H 'Content-Type: application/json'"
    if [ -n "$auth_token" ]; then
        headers="$headers -H 'Authorization: Bearer $auth_token'"
    fi
    
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method '$API_URL$endpoint'"
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd $headers"
    
    local response=$(eval $curl_cmd 2>&1 || echo "ERROR")
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    # Save to file
    local filename=$(echo "$endpoint" | sed 's/\//_/g' | sed 's/^_//')
    cat > "$OUTPUT_DIR/${method}_${filename}_${status}.json" << EOF
{
  "endpoint": "$endpoint",
  "method": "$method",
  "description": "$description",
  "status": "$status",
  "timestamp": "$(date -Iseconds)",
  "response": $body
}
EOF
    
    if [ "$status" = "200" ] || [ "$status" = "201" ]; then
        log_success "$method $endpoint → HTTP $status"
    elif [ "$status" = "401" ]; then
        log_warning "$method $endpoint → HTTP $status (authentication required)"
    elif [ "$status" = "404" ]; then
        log_warning "$method $endpoint → HTTP $status (not found)"
    else
        log_error "$method $endpoint → HTTP $status"
    fi
    
    echo "$method|$endpoint|$status|$description" >> "$OUTPUT_DIR/endpoints.csv"
    
    sleep 0.5
}

echo ""
echo "=========================================="
echo "  TRADEAI Backend API Discovery          "
echo "=========================================="
echo ""
log_info "Exploring API: $API_URL"
log_info "Output directory: $OUTPUT_DIR"
echo ""

# Initialize CSV
echo "Method,Endpoint,Status,Description" > "$OUTPUT_DIR/endpoints.csv"

# 1. HEALTH CHECK
log_info "=== Testing Health Endpoints ==="
test_endpoint "GET" "/health" "" "" "Health check endpoint"
test_endpoint "GET" "/" "" "" "Root endpoint"
test_endpoint "GET" "/api" "" "" "API root"

# 2. AUTHENTICATION ENDPOINTS
log_info ""
log_info "=== Testing Authentication Endpoints ==="
test_endpoint "POST" "/auth/login" "" '{"email":"test@example.com","password":"Test123!@#"}' "User login"
test_endpoint "POST" "/auth/register" "" '{"email":"newuser@example.com","password":"Test123!@#","name":"New User"}' "User registration"
test_endpoint "POST" "/auth/refresh" "" "" "Token refresh"
test_endpoint "POST" "/auth/logout" "" "" "User logout"
test_endpoint "GET" "/auth/me" "" "" "Get current user"
test_endpoint "POST" "/auth/forgot-password" "" '{"email":"test@example.com"}' "Forgot password"
test_endpoint "POST" "/auth/reset-password" "" '{"token":"dummy","password":"NewPass123!"}' "Reset password"

# 3. USER MANAGEMENT
log_info ""
log_info "=== Testing User Management Endpoints ==="
test_endpoint "GET" "/users" "" "" "List all users"
test_endpoint "GET" "/users/1" "" "" "Get user by ID"
test_endpoint "POST" "/users" "" '{"email":"api@test.com","name":"API Test","role":"user"}' "Create user"
test_endpoint "PUT" "/users/1" "" '{"name":"Updated Name"}' "Update user"
test_endpoint "DELETE" "/users/1" "" "" "Delete user"

# 4. CUSTOMERS
log_info ""
log_info "=== Testing Customer Endpoints ==="
test_endpoint "GET" "/customers" "" "" "List all customers"
test_endpoint "GET" "/customers/1" "" "" "Get customer by ID"
test_endpoint "POST" "/customers" "" '{"name":"Test Customer","email":"customer@test.com","tier":"gold"}' "Create customer"
test_endpoint "PUT" "/customers/1" "" '{"name":"Updated Customer"}' "Update customer"
test_endpoint "DELETE" "/customers/1" "" "" "Delete customer"
test_endpoint "GET" "/customers/search" "" "" "Search customers"
test_endpoint "GET" "/customers/stats" "" "" "Customer statistics"

# 5. PRODUCTS
log_info ""
log_info "=== Testing Product Endpoints ==="
test_endpoint "GET" "/products" "" "" "List all products"
test_endpoint "GET" "/products/1" "" "" "Get product by ID"
test_endpoint "POST" "/products" "" '{"name":"Test Product","sku":"TEST001","price":99.99}' "Create product"
test_endpoint "PUT" "/products/1" "" '{"name":"Updated Product"}' "Update product"
test_endpoint "DELETE" "/products/1" "" "" "Delete product"
test_endpoint "GET" "/products/categories" "" "" "Product categories"
test_endpoint "GET" "/products/search" "" "" "Search products"

# 6. ORDERS
log_info ""
log_info "=== Testing Order Endpoints ==="
test_endpoint "GET" "/orders" "" "" "List all orders"
test_endpoint "GET" "/orders/1" "" "" "Get order by ID"
test_endpoint "POST" "/orders" "" '{"customerId":1,"items":[{"productId":1,"quantity":2}]}' "Create order"
test_endpoint "PUT" "/orders/1" "" '{"status":"shipped"}' "Update order"
test_endpoint "DELETE" "/orders/1" "" "" "Delete order"
test_endpoint "GET" "/orders/stats" "" "" "Order statistics"

# 7. PROMOTIONS/BUDGETS
log_info ""
log_info "=== Testing Promotion/Budget Endpoints ==="
test_endpoint "GET" "/promotions" "" "" "List promotions"
test_endpoint "GET" "/budgets" "" "" "List budgets"
test_endpoint "POST" "/promotions" "" '{"name":"Test Promo","discount":10}' "Create promotion"
test_endpoint "POST" "/budgets" "" '{"name":"Q4 Budget","amount":100000}' "Create budget"

# 8. REBATES
log_info ""
log_info "=== Testing Rebate Endpoints ==="
test_endpoint "GET" "/rebates" "" "" "List rebates"
test_endpoint "POST" "/rebates" "" '{"customerId":1,"amount":500,"type":"volume"}' "Create rebate"
test_endpoint "POST" "/rebates/calculate" "" '{"customerId":1,"orderAmount":1000}' "Calculate rebate"

# 9. ANALYTICS/REPORTS
log_info ""
log_info "=== Testing Analytics Endpoints ==="
test_endpoint "GET" "/analytics" "" "" "Analytics dashboard"
test_endpoint "GET" "/analytics/revenue" "" "" "Revenue analytics"
test_endpoint "GET" "/analytics/customers" "" "" "Customer analytics"
test_endpoint "GET" "/reports" "" "" "List reports"
test_endpoint "POST" "/reports" "" '{"type":"sales","period":"month"}' "Generate report"
test_endpoint "GET" "/reports/1" "" "" "Get report by ID"

# 10. ADMIN
log_info ""
log_info "=== Testing Admin Endpoints ==="
test_endpoint "GET" "/admin/dashboard" "" "" "Admin dashboard"
test_endpoint "GET" "/admin/users" "" "" "Admin user management"
test_endpoint "GET" "/admin/settings" "" "" "System settings"
test_endpoint "GET" "/admin/logs" "" "" "System logs"
test_endpoint "GET" "/admin/health" "" "" "System health"

# 11. INTEGRATIONS
log_info ""
log_info "=== Testing Integration Endpoints ==="
test_endpoint "GET" "/integrations" "" "" "List integrations"
test_endpoint "POST" "/integrations" "" '{"type":"api","name":"Test Integration"}' "Create integration"
test_endpoint "GET" "/webhooks" "" "" "List webhooks"

# 12. NOTIFICATIONS
log_info ""
log_info "=== Testing Notification Endpoints ==="
test_endpoint "GET" "/notifications" "" "" "List notifications"
test_endpoint "POST" "/notifications" "" '{"userId":1,"message":"Test notification"}' "Create notification"
test_endpoint "PUT" "/notifications/1/read" "" "" "Mark as read"

# 13. ML/AI
log_info ""
log_info "=== Testing ML/AI Endpoints ==="
test_endpoint "GET" "/ml/models" "" "" "List ML models"
test_endpoint "POST" "/ml/predict" "" '{"modelId":1,"data":{}}' "Make prediction"
test_endpoint "GET" "/ml/predictions" "" "" "List predictions"

# Generate summary report
log_info ""
log_info "Generating summary report..."

cat > "$OUTPUT_DIR/DISCOVERY_REPORT.md" << 'EOFMD'
# TRADEAI Backend API Discovery Report

**Date**: $(date)  
**API Base URL**: $API_URL  
**Discovery Method**: Automated endpoint exploration

---

## Summary

This report documents the actual backend API endpoints discovered through automated testing.

### Endpoint Categories Tested

1. Health Check
2. Authentication
3. User Management
4. Customers
5. Products
6. Orders
7. Promotions/Budgets
8. Rebates
9. Analytics/Reports
10. Admin
11. Integrations
12. Notifications
13. ML/AI

### Results

Total endpoints tested: $(wc -l < "$OUTPUT_DIR/endpoints.csv")

Status code distribution:
EOFMD

# Count status codes
cat "$OUTPUT_DIR/endpoints.csv" | tail -n +2 | cut -d'|' -f3 | sort | uniq -c | while read count code; do
    echo "- HTTP $code: $count endpoints" >> "$OUTPUT_DIR/DISCOVERY_REPORT.md"
done

cat >> "$OUTPUT_DIR/DISCOVERY_REPORT.md" << 'EOFMD'

---

## Detailed Endpoint List

EOFMD

# Add table of endpoints
echo "| Method | Endpoint | Status | Description |" >> "$OUTPUT_DIR/DISCOVERY_REPORT.md"
echo "|--------|----------|--------|-------------|" >> "$OUTPUT_DIR/DISCOVERY_REPORT.md"
cat "$OUTPUT_DIR/endpoints.csv" | tail -n +2 | sed 's/|/ | /g' | sed 's/^/| /' | sed 's/$/ |/' >> "$OUTPUT_DIR/DISCOVERY_REPORT.md"

cat >> "$OUTPUT_DIR/DISCOVERY_REPORT.md" << 'EOFMD'

---

## Response Examples

Individual endpoint responses have been saved to JSON files in this directory.
Each file follows the naming pattern: `{METHOD}_{endpoint}_{status}.json`

---

## Next Steps

1. Review discovered endpoints
2. Test authentication flow with real credentials
3. Explore authenticated endpoints
4. Document request/response schemas
5. Create user stories based on actual capabilities

EOFMD

echo ""
log_success "Discovery complete!"
log_info "Results saved to: $OUTPUT_DIR/"
log_info "Summary report: $OUTPUT_DIR/DISCOVERY_REPORT.md"
log_info "CSV data: $OUTPUT_DIR/endpoints.csv"
log_info "JSON responses: $OUTPUT_DIR/*.json"
echo ""

# Display summary
echo "=========================================="
echo "  Discovery Summary                       "
echo "=========================================="
cat "$OUTPUT_DIR/endpoints.csv" | tail -n +2 | cut -d'|' -f3 | sort | uniq -c
echo "=========================================="
echo ""
log_info "Review the discovery report and JSON responses to understand the backend API structure."
