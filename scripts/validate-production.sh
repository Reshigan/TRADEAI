#!/bin/bash
# TRADEAI Production Validation Script
# Comprehensive checks for go-live readiness

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="${FRONTEND_URL:-https://tradeai.vantax.co.za}"
API_URL="${API_URL:-https://tradeai-api.reshigan-085.workers.dev}"

echo "========================================"
echo "🚀 TRADEAI Production Validation"
echo "========================================"
echo ""

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check HTTP status
check_http() {
    local url=$1
    local expected=$2
    local name=$3
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 || echo "000")
    
    if [ "$HTTP_STATUS" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} $name: HTTP $HTTP_STATUS"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $name: Expected HTTP $expected, got $HTTP_STATUS"
        ((FAILED++))
    fi
}

# Function to check response contains
check_response() {
    local url=$1
    local pattern=$2
    local name=$3
    
    RESPONSE=$(curl -s "$url" --max-time 10 || echo "")
    
    if echo "$RESPONSE" | grep -q "$pattern"; then
        echo -e "${GREEN}✓${NC} $name: Pattern found"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $name: Pattern not found"
        ((FAILED++))
    fi
}

# Function to check header
check_header() {
    local url=$1
    local header=$2
    local name=$3
    
    HEADER_VALUE=$(curl -s -I "$url" --max-time 10 | grep -i "$header" | tr -d '\r' || echo "")
    
    if [ -n "$HEADER_VALUE" ]; then
        echo -e "${GREEN}✓${NC} $name: $HEADER_VALUE"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} $name: Header not found"
        ((WARNINGS++))
    fi
}

echo "1️⃣  DNS & SSL/TLS Checks"
echo "----------------------------------------"

# Check DNS resolution
echo -n "Checking DNS resolution... "
if dig +short tradeai.vantax.co.za | grep -q "."; then
    echo -e "${GREEN}✓${NC} DNS resolving"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} DNS not resolving"
    ((FAILED++))
fi

# Check SSL certificate
echo -n "Checking SSL certificate... "
if echo | openssl s_client -connect tradeai.vantax.co.za:443 -servername tradeai.vantax.co.za 2>/dev/null | openssl x509 -noout -dates &>/dev/null; then
    echo -e "${GREEN}✓${NC} SSL certificate valid"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} SSL certificate issue"
    ((FAILED++))
fi

# Check HTTPS redirect
echo -n "Checking HTTP to HTTPS redirect... "
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" -L http://tradeai.vantax.co.za --max-time 10 || echo "000")
if [ "$HTTP_REDIRECT" = "200" ]; then
    echo -e "${GREEN}✓${NC} HTTP redirects to HTTPS"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} HTTP redirect issue (status: $HTTP_REDIRECT)"
    ((WARNINGS++))
fi

echo ""
echo "2️⃣  Frontend Health Checks"
echo "----------------------------------------"

check_http "$FRONTEND_URL" "200" "Frontend homepage"
check_response "$FRONTEND_URL" "Trade" "Frontend content"
check_header "$FRONTEND_URL" "x-frame-options" "X-Frame-Options"
check_header "$FRONTEND_URL" "strict-transport-security" "HSTS"

# Check static assets
check_http "$FRONTEND_URL/static/js/main.js" "200" "Main JS bundle"
check_http "$FRONTEND_URL/favicon.ico" "200" "Favicon"

echo ""
echo "3️⃣  Backend API Health Checks"
echo "----------------------------------------"

check_http "$API_URL/health" "200" "API health endpoint"
check_response "$API_URL/health" "healthy" "API health status"
check_response "$API_URL/health" "cloudflare-workers" "Platform detection"

# Check API security headers
check_header "$API_URL/health" "x-content-type-options" "X-Content-Type-Options"
check_header "$API_URL/health" "x-frame-options" "X-Frame-Options"
check_header "$API_URL/health" "content-security-policy" "CSP"

echo ""
echo "4️⃣  Authentication Tests"
echo "----------------------------------------"

# Test login endpoint (should reject invalid credentials)
echo -n "Testing auth endpoint security... "
AUTH_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"invalid"}' \
  --max-time 10)

if echo "$AUTH_RESPONSE" | grep -q "success.*false\|Unauthorized\|Invalid"; then
    echo -e "${GREEN}✓${NC} Auth endpoint rejecting invalid credentials"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Auth endpoint response unexpected"
    ((WARNINGS++))
fi

# Test protected endpoint without token
echo -n "Testing protected endpoint... "
PROTECTED_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/users" \
  --max-time 10 || echo "000")

if [ "$PROTECTED_STATUS" = "401" ]; then
    echo -e "${GREEN}✓${NC} Protected endpoints require authentication"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Protected endpoint status: $PROTECTED_STATUS"
    ((WARNINGS++))
fi

echo ""
echo "5️⃣  Performance Checks"
echo "----------------------------------------"

# Measure TTFB
echo -n "Measuring Time To First Byte... "
TTFB=$(curl -s -o /dev/null -w "%{time_starttransfer}" "$FRONTEND_URL" --max-time 10 || echo "0")
if (( $(echo "$TTFB < 0.5" | bc -l) )); then
    echo -e "${GREEN}✓${NC} TTFB: ${TTFB}s (< 0.5s)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} TTFB: ${TTFB}s (should be < 0.5s)"
    ((WARNINGS++))
fi

# Measure total load time
echo -n "Measuring total load time... "
TOTAL_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$FRONTEND_URL" --max-time 30 || echo "0")
if (( $(echo "$TOTAL_TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✓${NC} Total time: ${TOTAL_TIME}s (< 2.0s)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Total time: ${TOTAL_TIME}s (should be < 2.0s)"
    ((WARNINGS++))
fi

echo ""
echo "6️⃣  Security Scans"
echo "----------------------------------------"

# Check for exposed .env
echo -n "Checking for exposed .env... "
ENV_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/.env" --max-time 10 || echo "000")
if [ "$ENV_STATUS" = "404" ] || [ "$ENV_STATUS" = "403" ]; then
    echo -e "${GREEN}✓${NC} .env not accessible (HTTP $ENV_STATUS)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} .env exposed! (HTTP $ENV_STATUS)"
    ((FAILED++))
fi

# Check for exposed .git
echo -n "Checking for exposed .git... "
GIT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/.git/config" --max-time 10 || echo "000")
if [ "$GIT_STATUS" = "404" ] || [ "$GIT_STATUS" = "403" ]; then
    echo -e "${GREEN}✓${NC} .git not accessible (HTTP $GIT_STATUS)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} .git exposed! (HTTP $GIT_STATUS)"
    ((FAILED++))
fi

# Check Cloudflare is active
echo -n "Checking Cloudflare is active... "
CF_HEADER=$(curl -s -I "$FRONTEND_URL" --max-time 10 | grep -i "cf-ray" || echo "")
if [ -n "$CF_HEADER" ]; then
    echo -e "${GREEN}✓${NC} Cloudflare proxy active"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Cloudflare proxy not detected"
    ((WARNINGS++))
fi

echo ""
echo "========================================"
echo "📊 Validation Summary"
echo "========================================"
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC}   $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo "Critical issues detected. Do not proceed with deployment."
    exit 1
elif [ $WARNINGS -gt 5 ]; then
    echo -e "${YELLOW}⚠️  VALIDATION PASSED WITH WARNINGS${NC}"
    echo "Review warnings before proceeding."
    exit 0
else
    echo -e "${GREEN}✅ VALIDATION PASSED${NC}"
    echo "System is ready for production deployment!"
    exit 0
fi
