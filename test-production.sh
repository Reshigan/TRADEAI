#!/bin/bash
# Production System Test Script
# Tests all components of the TRADEAI production system

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       TRADEAI Production System Test Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

BASE_URL="https://tradeai.gonxt.tech"
PASS_COUNT=0
FAIL_COUNT=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="$3"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_code, Got: $response)"
        ((FAIL_COUNT++))
        return 1
    fi
}

test_cors() {
    local name="$1"
    local url="$2"
    
    echo -n "Testing $name... "
    
    cors_header=$(curl -sI -H "Origin: https://tradeai.gonxt.tech" \
                       -H "Access-Control-Request-Method: GET" \
                       -X OPTIONS "$url" 2>/dev/null | \
                       grep -i "Access-Control-Allow-Origin" | \
                       grep -c "https://tradeai.gonxt.tech")
    
    if [ "$cors_header" -gt 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAIL_COUNT++))
        return 1
    fi
}

test_auth() {
    echo -n "Testing Authentication... "
    
    response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
                    -H "Content-Type: application/json" \
                    -H "Origin: https://tradeai.gonxt.tech" \
                    -d '{"email":"admin@mondelez.com","password":"Admin@123"}' 2>/dev/null)
    
    success=$(echo "$response" | grep -c '"success":true')
    token=$(echo "$response" | grep -c '"token"')
    
    if [ "$success" -gt 0 ] && [ "$token" -gt 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "Response: $response"
        ((FAIL_COUNT++))
        return 1
    fi
}

echo -e "${YELLOW}1. Frontend Tests${NC}"
echo "─────────────────────────────────────────────────────"
test_endpoint "Frontend Homepage" "$BASE_URL" "200"
test_endpoint "Frontend Routing" "$BASE_URL/dashboard" "200"
test_endpoint "Static Assets" "$BASE_URL/vite.svg" "200"
echo ""

echo -e "${YELLOW}2. Backend API Tests${NC}"
echo "─────────────────────────────────────────────────────"
test_endpoint "Health Endpoint" "$BASE_URL/api/health" "200"
echo ""

echo -e "${YELLOW}3. CORS Tests${NC}"
echo "─────────────────────────────────────────────────────"
test_cors "CORS Preflight" "$BASE_URL/api/health"
echo ""

echo -e "${YELLOW}4. Authentication Tests${NC}"
echo "─────────────────────────────────────────────────────"
test_auth
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    Test Results${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

TOTAL=$((PASS_COUNT + FAIL_COUNT))

echo -e "Total Tests:  $TOTAL"
echo -e "${GREEN}Passed:       $PASS_COUNT${NC}"
echo -e "${RED}Failed:       $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Production system is operational.${NC}"
    echo ""
    echo -e "${BLUE}Access your system at:${NC}"
    echo -e "  🌐 URL: https://tradeai.gonxt.tech"
    echo -e "  👤 Email: admin@mondelez.com"
    echo -e "  🔑 Password: Admin@123"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the system.${NC}"
    exit 1
fi
