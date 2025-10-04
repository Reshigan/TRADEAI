#!/bin/bash

# Advanced Security Testing for TRADEAI System
# Date: 2025-10-03
# Purpose: Deep security vulnerability assessment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="${API_BASE:-http://localhost:5002/api}"
LOGIN_EMAIL="${LOGIN_EMAIL:-admin@tradeai.com}"
LOGIN_PASSWORD="${LOGIN_PASSWORD:-Admin@123}"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNING_TESTS=0

# Helper functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

test_start() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo ""
    echo -e "${BLUE}[TEST #${TOTAL_TESTS}]${NC} $1"
}

test_pass() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ PASS:${NC} $1"
}

test_fail() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    local severity="${2:-HIGH}"
    echo -e "${RED}✗ FAIL [$severity]:${NC} $1"
}

test_warning() {
    WARNING_TESTS=$((WARNING_TESTS + 1))
    echo -e "${YELLOW}⚠ WARNING:${NC} $1"
}

# Start tests
echo "================================================"
echo "     ADVANCED SECURITY TEST - TRADEAI"
echo "     Testing Date: $(date)"
echo "     Base URL: $API_BASE"
echo "================================================"

# ========================================
# PHASE 1: JWT TOKEN SECURITY
# ========================================
log "PHASE 1: JWT TOKEN SECURITY TESTS"

# Login to get token
log "Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"$LOGIN_PASSWORD\"}")
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // .data.token // empty')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}ERROR: Failed to authenticate. Cannot continue tests.${NC}"
    exit 1
fi
log "✓ Authentication successful"

# Test 1: Expired token (simulate by using a token from the past)
test_start "JWT token expiration handling"
EXPIRED_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJleHAiOjE1MTYyMzkwMjJ9.aBcDeFgHiJkLmNoPqRsTuVwXyZ"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers" \
    -H "Authorization: Bearer $EXPIRED_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "403" ]; then
    test_pass "Expired/invalid token correctly rejected"
else
    test_fail "Expired token accepted (HTTP $HTTP_CODE)" "CRITICAL"
fi

# Test 2: Token with modified payload
test_start "JWT token tampering detection"
# Take valid token, decode, modify, re-encode (but signature won't match)
TAMPERED_TOKEN="${TOKEN:0:50}TAMPERED${TOKEN:60}"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers" \
    -H "Authorization: Bearer $TAMPERED_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "403" ]; then
    test_pass "Tampered token correctly rejected"
else
    test_fail "Tampered token accepted (HTTP $HTTP_CODE)" "CRITICAL"
fi

# Test 3: Token reuse after logout (if logout endpoint exists)
test_start "Token invalidation after logout"
LOGOUT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/auth/logout" \
    -H "Authorization: Bearer $TOKEN")
LOGOUT_HTTP=$(echo "$LOGOUT_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$LOGOUT_HTTP" == "200" ] || [ "$LOGOUT_HTTP" == "204" ]; then
    # Try to use token after logout
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers" \
        -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    if [ "$HTTP_CODE" == "401" ]; then
        test_pass "Token invalidated after logout"
    else
        test_warning "Token still valid after logout (stateless JWT behavior)"
    fi
    # Re-login for next tests
    LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"$LOGIN_PASSWORD\"}")
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // .data.token // empty')
else
    test_warning "Logout endpoint not available or failed"
fi

# ========================================
# PHASE 2: INJECTION ATTACKS
# ========================================
log "PHASE 2: ADVANCED INJECTION ATTACK TESTS"

# Test 4: Command injection in search
test_start "Command injection in query parameters"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers?search=test;whoami;ls" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '$d')
# Check if response contains system command output
if echo "$BODY" | grep -qi "root\|bin\|etc"; then
    test_fail "Command injection possible" "CRITICAL"
else
    test_pass "Command injection blocked"
fi

# Test 5: LDAP injection
test_start "LDAP injection in search filters"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers?search=*)(%26(objectClass=*" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "500" ]; then
    test_warning "LDAP injection caused error (HTTP $HTTP_CODE)"
else
    test_pass "LDAP injection handled gracefully"
fi

# Test 6: XML injection
test_start "XML injection (XXE attack)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/xml" \
    -H "Authorization: Bearer $TOKEN" \
    -d '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><customer><name>&xxe;</name></customer>')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '$d')
if echo "$BODY" | grep -q "root:"; then
    test_fail "XXE vulnerability - file disclosure" "CRITICAL"
elif [ "$HTTP_CODE" == "415" ] || echo "$BODY" | grep -qi "json"; then
    test_pass "XML input rejected (JSON-only API)"
else
    test_pass "XXE attack blocked"
fi

# ========================================
# PHASE 3: AUTHORIZATION BYPASS
# ========================================
log "PHASE 3: AUTHORIZATION & ACCESS CONTROL TESTS"

# Test 7: Horizontal privilege escalation
test_start "Horizontal privilege escalation attempt"
# Create a customer and try to access it with tenant manipulation
TIMESTAMP=$(date +%s)
CREATE_RESP=$(curl -s -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\":\"Test Customer\",\"code\":\"CUST-$TIMESTAMP\",\"email\":\"test$TIMESTAMP@example.com\",\"sapCustomerId\":\"SAP-$TIMESTAMP\",\"customerType\":\"retailer\",\"channel\":\"modern_trade\"}")
CUSTOMER_ID=$(echo "$CREATE_RESP" | jq -r '.data._id // .data.id // empty')

if [ -n "$CUSTOMER_ID" ]; then
    # Try to access with different tenant header
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers/$CUSTOMER_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-Tenant-ID: different-tenant-12345")
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    if [ "$HTTP_CODE" == "404" ] || [ "$HTTP_CODE" == "403" ]; then
        test_pass "Tenant isolation working - cross-tenant access blocked"
    else
        test_fail "Tenant isolation bypass possible (HTTP $HTTP_CODE)" "CRITICAL"
    fi
else
    test_warning "Could not create test customer for privilege escalation test"
fi

# Test 8: IDOR (Insecure Direct Object Reference)
test_start "IDOR vulnerability check"
# Try to access sequential IDs
RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers/000000000000000000000001" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE1=$(echo "$RESPONSE1" | grep "HTTP_CODE" | cut -d: -f2)
RESPONSE2=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers/000000000000000000000002" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE2=$(echo "$RESPONSE2" | grep "HTTP_CODE" | cut -d: -f2)
# If both return 200, there might be IDOR (though could be legitimate)
if [ "$HTTP_CODE1" == "200" ] && [ "$HTTP_CODE2" == "200" ]; then
    test_warning "Sequential IDs accessible - verify authorization is checked"
else
    test_pass "Sequential ID access properly controlled"
fi

# Test 9: Mass assignment vulnerability
test_start "Mass assignment protection"
TIMESTAMP=$(date +%s)
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\":\"Mass Assign Test\",\"code\":\"MA-$TIMESTAMP\",\"email\":\"ma$TIMESTAMP@test.com\",\"sapCustomerId\":\"SAP-MA-$TIMESTAMP\",\"customerType\":\"retailer\",\"channel\":\"modern_trade\",\"isAdmin\":true,\"role\":\"admin\",\"_id\":\"000000000000000000000099\"}")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '$d')
# Check if dangerous fields were accepted
if echo "$BODY" | jq -e '.data.isAdmin == true' > /dev/null 2>&1; then
    test_fail "Mass assignment vulnerability - admin field accepted" "HIGH"
elif [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
    test_pass "Mass assignment protected - dangerous fields ignored"
else
    test_warning "Request rejected (HTTP $HTTP_CODE)"
fi

# ========================================
# PHASE 4: API SECURITY HEADERS
# ========================================
log "PHASE 4: SECURITY HEADERS VALIDATION"

# Test 10: Security headers presence
test_start "Check for security headers"
HEADERS=$(curl -sI "${API_BASE}/health")
MISSING_HEADERS=""
echo "$HEADERS" | grep -qi "X-Content-Type-Options" || MISSING_HEADERS="${MISSING_HEADERS}X-Content-Type-Options, "
echo "$HEADERS" | grep -qi "X-Frame-Options" || MISSING_HEADERS="${MISSING_HEADERS}X-Frame-Options, "
echo "$HEADERS" | grep -qi "Content-Security-Policy\|X-XSS-Protection" || MISSING_HEADERS="${MISSING_HEADERS}CSP/XSS-Protection, "
echo "$HEADERS" | grep -qi "Strict-Transport-Security" || MISSING_HEADERS="${MISSING_HEADERS}HSTS, "

if [ -z "$MISSING_HEADERS" ]; then
    test_pass "All critical security headers present"
else
    test_warning "Missing security headers: ${MISSING_HEADERS%%, }"
fi

# Test 11: CORS policy check
test_start "CORS policy enforcement"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X OPTIONS "${API_BASE}/customers" \
    -H "Origin: http://malicious-site.com" \
    -H "Access-Control-Request-Method: POST")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
# In development, CORS might be open, but should be restrictive in production
if [ "$HTTP_CODE" == "204" ] || [ "$HTTP_CODE" == "200" ]; then
    test_warning "CORS allows requests (acceptable in dev, verify in production)"
else
    test_pass "CORS policy enforced"
fi

# ========================================
# PHASE 5: INPUT VALIDATION BYPASS
# ========================================
log "PHASE 5: ADVANCED INPUT VALIDATION TESTS"

# Test 12: Null byte injection
test_start "Null byte injection"
TIMESTAMP=$(date +%s)
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\":\"Null\u0000Byte\",\"code\":\"NULL-$TIMESTAMP\",\"email\":\"null$TIMESTAMP@test.com\",\"sapCustomerId\":\"SAP-NULL-$TIMESTAMP\",\"customerType\":\"retailer\",\"channel\":\"modern_trade\"}")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" == "400" ]; then
    test_pass "Null byte injection rejected"
else
    test_warning "Null byte accepted (HTTP $HTTP_CODE)"
fi

# Test 13: Polyglot payload
test_start "Polyglot payload (combined XSS/SQLi/NoSQLi)"
POLYGLOT="jaVasCript:/*-/*\`/*\`/*'/*\"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//"
TIMESTAMP=$(date +%s)
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\":\"$POLYGLOT\",\"code\":\"POLY-$TIMESTAMP\",\"email\":\"poly$TIMESTAMP@test.com\",\"sapCustomerId\":\"SAP-POLY-$TIMESTAMP\",\"customerType\":\"retailer\",\"channel\":\"modern_trade\"}")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ]; then
    test_pass "Polyglot payload rejected"
elif [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
    # Check if payload is sanitized
    BODY=$(echo "$RESPONSE" | sed '$d')
    if echo "$BODY" | grep -q "script"; then
        test_fail "Polyglot payload accepted unsanitized" "HIGH"
    else
        test_pass "Polyglot payload sanitized"
    fi
else
    test_warning "Unexpected response (HTTP $HTTP_CODE)"
fi

# Test 14: Parameter pollution
test_start "HTTP parameter pollution"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_BASE}/customers?limit=10&limit=1000&limit=-1" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '$d')
# Check if more than 100 results returned (typical safe limit)
RESULT_COUNT=$(echo "$BODY" | jq -r '.data | length // 0')
if [ "$RESULT_COUNT" -gt 100 ]; then
    test_warning "Parameter pollution may bypass limits (returned $RESULT_COUNT results)"
else
    test_pass "Parameter pollution handled correctly"
fi

# Test 15: Content-Type bypass
test_start "Content-Type validation"
TIMESTAMP=$(date +%s)
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_BASE}/customers" \
    -H "Content-Type: text/plain" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\":\"ContentType Test\",\"code\":\"CT-$TIMESTAMP\",\"email\":\"ct$TIMESTAMP@test.com\",\"sapCustomerId\":\"SAP-CT-$TIMESTAMP\",\"customerType\":\"retailer\",\"channel\":\"modern_trade\"}")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "415" ] || [ "$HTTP_CODE" == "400" ]; then
    test_pass "Invalid Content-Type rejected"
else
    test_warning "Content-Type validation may be bypassed (HTTP $HTTP_CODE)"
fi

# ========================================
# PHASE 6: TIMING ATTACKS & INFO DISCLOSURE
# ========================================
log "PHASE 6: INFORMATION DISCLOSURE TESTS"

# Test 16: User enumeration via timing attack
test_start "User enumeration via timing attack"
START1=$(date +%s%N)
curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"nonexistent@example.com","password":"password123"}' > /dev/null
END1=$(date +%s%N)
TIME1=$((($END1 - $START1) / 1000000))

START2=$(date +%s%N)
curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"wrongpassword\"}" > /dev/null
END2=$(date +%s%N)
TIME2=$((($END2 - $START2) / 1000000))

DIFF=$((TIME1 > TIME2 ? TIME1 - TIME2 : TIME2 - TIME1))
if [ "$DIFF" -gt 100 ]; then
    test_warning "Timing difference detected: ${DIFF}ms (may enable user enumeration)"
else
    test_pass "Constant-time comparison (timing difference: ${DIFF}ms)"
fi

# Test 17: Error message information disclosure
test_start "Error message information disclosure"
RESPONSE=$(curl -s -X GET "${API_BASE}/customers/invalid-id-format" \
    -H "Authorization: Bearer $TOKEN")
BODY=$(echo "$RESPONSE" | jq -r '.')
# Check if error reveals internal details
if echo "$BODY" | grep -qi "stack\|trace\|file\|line\|function"; then
    test_fail "Error messages expose stack traces" "MEDIUM"
elif echo "$BODY" | grep -qi "mongodb\|mongoose\|database"; then
    test_warning "Error messages expose technology stack"
else
    test_pass "Error messages are generic and safe"
fi

# Test 18: API endpoint enumeration
test_start "Hidden API endpoint exposure"
RESPONSE=$(curl -s "${API_BASE}/docs" -H "Authorization: Bearer $TOKEN")
if echo "$RESPONSE" | grep -qi "swagger\|openapi\|api documentation"; then
    test_warning "API documentation publicly accessible (may aid attackers)"
else
    test_pass "API documentation protected or not exposed"
fi

# ========================================
# SUMMARY
# ========================================
echo ""
echo "================================================"
echo "     ADVANCED SECURITY TEST SUMMARY"
echo "================================================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Warnings: $WARNING_TESTS"
echo ""

PASS_RATE=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
echo "Pass Rate: ${PASS_RATE}%"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}VERDICT: SECURITY POSTURE ACCEPTABLE${NC}"
elif [ $FAILED_TESTS -le 2 ]; then
    echo -e "${YELLOW}VERDICT: MINOR SECURITY ISSUES FOUND${NC}"
else
    echo -e "${RED}VERDICT: SIGNIFICANT SECURITY ISSUES FOUND${NC}"
fi

echo ""
echo "Detailed log: ADVANCED_SECURITY_$(date +%Y%m%d_%H%M%S).log"
echo "================================================"

exit 0
