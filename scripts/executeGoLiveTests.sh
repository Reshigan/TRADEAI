#!/bin/bash

# TRADEAI Go-Live Testing Script
# Comprehensive end-to-end testing for deployment readiness

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3001"}
BACKEND_URL=${BACKEND_URL:-"http://localhost:3000"}
TEST_TIMEOUT=${TEST_TIMEOUT:-300}
REPORT_DIR="./test-reports"

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
CRITICAL_FAILURES=0

echo -e "${BLUE}🚀 TRADEAI Go-Live Testing Suite${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""
echo -e "Frontend URL: ${FRONTEND_URL}"
echo -e "Backend URL: ${BACKEND_URL}"
echo -e "Test Timeout: ${TEST_TIMEOUT}s"
echo ""

# Create report directory
mkdir -p "${REPORT_DIR}"

# Function to log test results
log_test_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ ${test_name}: PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ ${test_name}: FAILED${NC}"
        if [ -n "$message" ]; then
            echo -e "${RED}   Error: ${message}${NC}"
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ "$4" = "CRITICAL" ]; then
            CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
        fi
    fi
}

# Function to check service health
check_service_health() {
    local service_name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -e "${YELLOW}🔍 Checking ${service_name} health...${NC}"
    
    if response=$(curl -s -w "%{http_code}" -o /tmp/health_response "${url}" --max-time 10); then
        if [ "$response" = "$expected_status" ]; then
            log_test_result "${service_name} Health Check" "PASS"
            return 0
        else
            log_test_result "${service_name} Health Check" "FAIL" "HTTP ${response}" "CRITICAL"
            return 1
        fi
    else
        log_test_result "${service_name} Health Check" "FAIL" "Connection failed" "CRITICAL"
        return 1
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    echo -e "${YELLOW}🧪 Testing API Endpoints...${NC}"
    
    # Test health endpoint
    if curl -s "${BACKEND_URL}/health" | grep -q "healthy"; then
        log_test_result "API Health Endpoint" "PASS"
    else
        log_test_result "API Health Endpoint" "FAIL" "Health check failed" "CRITICAL"
    fi
    
    # Test status endpoint
    if curl -s "${BACKEND_URL}/api/status" | grep -q "database"; then
        log_test_result "API Status Endpoint" "PASS"
    else
        log_test_result "API Status Endpoint" "FAIL" "Status check failed" "CRITICAL"
    fi
    
    # Test CORS headers
    if curl -s -I -H "Origin: https://example.com" "${BACKEND_URL}/api/health" | grep -q "Access-Control-Allow-Origin"; then
        log_test_result "CORS Headers" "PASS"
    else
        log_test_result "CORS Headers" "FAIL" "CORS headers missing"
    fi
    
    # Test rate limiting (make multiple requests)
    echo -e "${YELLOW}   Testing rate limiting...${NC}"
    rate_limit_triggered=false
    for i in {1..25}; do
        if response=$(curl -s -w "%{http_code}" -o /dev/null "${BACKEND_URL}/api/health" --max-time 2); then
            if [ "$response" = "429" ]; then
                rate_limit_triggered=true
                break
            fi
        fi
    done
    
    if [ "$rate_limit_triggered" = true ]; then
        log_test_result "Rate Limiting" "PASS"
    else
        log_test_result "Rate Limiting" "FAIL" "Rate limiting not triggered"
    fi
}

# Function to test frontend functionality
test_frontend_functionality() {
    echo -e "${YELLOW}🌐 Testing Frontend Functionality...${NC}"
    
    # Test frontend health
    if curl -s "${FRONTEND_URL}" | grep -q "TRADEAI\|Trade AI\|tradeai"; then
        log_test_result "Frontend Loading" "PASS"
    else
        log_test_result "Frontend Loading" "FAIL" "Frontend not loading properly" "CRITICAL"
    fi
    
    # Test static assets
    if curl -s -I "${FRONTEND_URL}/static/css/main.css" | grep -q "200\|304"; then
        log_test_result "CSS Assets Loading" "PASS"
    else
        log_test_result "CSS Assets Loading" "FAIL" "CSS assets not loading"
    fi
    
    if curl -s -I "${FRONTEND_URL}/static/js/main.js" | grep -q "200\|304"; then
        log_test_result "JS Assets Loading" "PASS"
    else
        log_test_result "JS Assets Loading" "FAIL" "JS assets not loading"
    fi
    
    # Test PWA manifest
    if curl -s "${FRONTEND_URL}/manifest.json" | grep -q "TRADEAI\|Trade AI"; then
        log_test_result "PWA Manifest" "PASS"
    else
        log_test_result "PWA Manifest" "FAIL" "PWA manifest not found"
    fi
    
    # Test service worker
    if curl -s "${FRONTEND_URL}/sw.js" | grep -q "service.*worker\|cache\|fetch"; then
        log_test_result "Service Worker" "PASS"
    else
        log_test_result "Service Worker" "FAIL" "Service worker not found"
    fi
}

# Function to test database connectivity
test_database_connectivity() {
    echo -e "${YELLOW}🗄️ Testing Database Connectivity...${NC}"
    
    # Test database connection through API
    if response=$(curl -s "${BACKEND_URL}/api/status"); then
        if echo "$response" | grep -q '"database":"connected"'; then
            log_test_result "Database Connection" "PASS"
        else
            log_test_result "Database Connection" "FAIL" "Database not connected" "CRITICAL"
        fi
        
        if echo "$response" | grep -q '"redis":"connected"'; then
            log_test_result "Redis Connection" "PASS"
        else
            log_test_result "Redis Connection" "FAIL" "Redis not connected" "CRITICAL"
        fi
    else
        log_test_result "Database Connection" "FAIL" "Status endpoint not responding" "CRITICAL"
        log_test_result "Redis Connection" "FAIL" "Status endpoint not responding" "CRITICAL"
    fi
}

# Function to test security features
test_security_features() {
    echo -e "${YELLOW}🔒 Testing Security Features...${NC}"
    
    # Test HTTPS redirect (if applicable)
    if [ "${FRONTEND_URL:0:5}" = "https" ]; then
        http_url="${FRONTEND_URL/https/http}"
        if response=$(curl -s -I "$http_url" --max-time 10); then
            if echo "$response" | grep -q "301\|302"; then
                log_test_result "HTTPS Redirect" "PASS"
            else
                log_test_result "HTTPS Redirect" "FAIL" "No HTTPS redirect found"
            fi
        else
            log_test_result "HTTPS Redirect" "FAIL" "HTTP endpoint not responding"
        fi
    else
        echo -e "${YELLOW}   Skipping HTTPS redirect test (HTTP environment)${NC}"
    fi
    
    # Test security headers
    if response=$(curl -s -I "${FRONTEND_URL}"); then
        if echo "$response" | grep -q "X-Frame-Options\|X-Content-Type-Options\|X-XSS-Protection"; then
            log_test_result "Security Headers" "PASS"
        else
            log_test_result "Security Headers" "FAIL" "Security headers missing"
        fi
    else
        log_test_result "Security Headers" "FAIL" "Could not check headers"
    fi
    
    # Test SQL injection protection
    if response=$(curl -s -X POST "${BACKEND_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"'\''OR 1=1--","password":"test"}' \
        --max-time 10); then
        if echo "$response" | grep -q "error\|invalid\|400\|401"; then
            log_test_result "SQL Injection Protection" "PASS"
        else
            log_test_result "SQL Injection Protection" "FAIL" "SQL injection not blocked" "CRITICAL"
        fi
    else
        log_test_result "SQL Injection Protection" "FAIL" "Could not test SQL injection"
    fi
}

# Function to test performance
test_performance() {
    echo -e "${YELLOW}⚡ Testing Performance...${NC}"
    
    # Test frontend load time
    start_time=$(date +%s%N)
    if curl -s "${FRONTEND_URL}" > /dev/null; then
        end_time=$(date +%s%N)
        load_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        
        if [ "$load_time" -lt 3000 ]; then # Less than 3 seconds
            log_test_result "Frontend Load Time" "PASS"
        else
            log_test_result "Frontend Load Time" "FAIL" "Load time: ${load_time}ms (>3000ms)"
        fi
    else
        log_test_result "Frontend Load Time" "FAIL" "Could not load frontend"
    fi
    
    # Test API response time
    start_time=$(date +%s%N)
    if curl -s "${BACKEND_URL}/api/health" > /dev/null; then
        end_time=$(date +%s%N)
        response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        
        if [ "$response_time" -lt 1000 ]; then # Less than 1 second
            log_test_result "API Response Time" "PASS"
        else
            log_test_result "API Response Time" "FAIL" "Response time: ${response_time}ms (>1000ms)"
        fi
    else
        log_test_result "API Response Time" "FAIL" "Could not test API response time"
    fi
}

# Function to test authentication flow
test_authentication_flow() {
    echo -e "${YELLOW}🔐 Testing Authentication Flow...${NC}"
    
    # Test login endpoint exists
    if response=$(curl -s -X POST "${BACKEND_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"wrongpassword"}' \
        --max-time 10); then
        if echo "$response" | grep -q "error\|invalid\|401\|400"; then
            log_test_result "Login Endpoint" "PASS"
        else
            log_test_result "Login Endpoint" "FAIL" "Login endpoint not working properly"
        fi
    else
        log_test_result "Login Endpoint" "FAIL" "Login endpoint not responding" "CRITICAL"
    fi
    
    # Test protected endpoint without token
    if response=$(curl -s -w "%{http_code}" -o /dev/null "${BACKEND_URL}/api/user/profile" --max-time 10); then
        if [ "$response" = "401" ]; then
            log_test_result "Protected Endpoint Security" "PASS"
        else
            log_test_result "Protected Endpoint Security" "FAIL" "Protected endpoint not secured" "CRITICAL"
        fi
    else
        log_test_result "Protected Endpoint Security" "FAIL" "Could not test protected endpoint"
    fi
}

# Function to run comprehensive tests
run_comprehensive_tests() {
    echo -e "${BLUE}🧪 Running Comprehensive Go-Live Tests${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
    
    # Service health checks
    check_service_health "Frontend" "${FRONTEND_URL}" "200"
    check_service_health "Backend" "${BACKEND_URL}/health" "200"
    
    # Core functionality tests
    test_api_endpoints
    test_frontend_functionality
    test_database_connectivity
    test_security_features
    test_performance
    test_authentication_flow
    
    echo ""
    echo -e "${BLUE}📊 Test Summary${NC}"
    echo -e "${BLUE}===============${NC}"
    echo -e "Total Tests: ${TOTAL_TESTS}"
    echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
    echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
    echo -e "${RED}Critical Failures: ${CRITICAL_FAILURES}${NC}"
    
    # Calculate pass rate
    if [ "$TOTAL_TESTS" -gt 0 ]; then
        pass_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
        echo -e "Pass Rate: ${pass_rate}%"
    fi
    
    echo ""
    
    # Generate report
    generate_test_report
    
    # Determine overall result
    if [ "$CRITICAL_FAILURES" -eq 0 ] && [ "$pass_rate" -ge 90 ]; then
        echo -e "${GREEN}🎉 GO-LIVE STATUS: READY FOR DEPLOYMENT${NC}"
        echo -e "${GREEN}All critical tests passed and pass rate is acceptable.${NC}"
        return 0
    else
        echo -e "${RED}🚫 GO-LIVE STATUS: NOT READY FOR DEPLOYMENT${NC}"
        if [ "$CRITICAL_FAILURES" -gt 0 ]; then
            echo -e "${RED}Critical failures must be resolved before deployment.${NC}"
        fi
        if [ "$pass_rate" -lt 90 ]; then
            echo -e "${RED}Pass rate (${pass_rate}%) is below acceptable threshold (90%).${NC}"
        fi
        return 1
    fi
}

# Function to generate test report
generate_test_report() {
    local report_file="${REPORT_DIR}/go-live-test-report-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": {
    "frontend_url": "${FRONTEND_URL}",
    "backend_url": "${BACKEND_URL}",
    "test_timeout": ${TEST_TIMEOUT}
  },
  "summary": {
    "total_tests": ${TOTAL_TESTS},
    "passed_tests": ${PASSED_TESTS},
    "failed_tests": ${FAILED_TESTS},
    "critical_failures": ${CRITICAL_FAILURES},
    "pass_rate": $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
  },
  "status": "$([ "$CRITICAL_FAILURES" -eq 0 ] && [ "$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))" -ge 90 ] && echo "READY" || echo "NOT_READY")"
}
EOF
    
    echo -e "${BLUE}📄 Test report generated: ${report_file}${NC}"
}

# Main execution
main() {
    # Check if services are running
    echo -e "${YELLOW}🔍 Checking if services are accessible...${NC}"
    
    if ! curl -s "${FRONTEND_URL}" > /dev/null; then
        echo -e "${RED}❌ Frontend not accessible at ${FRONTEND_URL}${NC}"
        echo -e "${RED}Please ensure the frontend service is running.${NC}"
        exit 1
    fi
    
    if ! curl -s "${BACKEND_URL}/health" > /dev/null; then
        echo -e "${RED}❌ Backend not accessible at ${BACKEND_URL}${NC}"
        echo -e "${RED}Please ensure the backend service is running.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Services are accessible${NC}"
    echo ""
    
    # Run comprehensive tests
    if run_comprehensive_tests; then
        echo ""
        echo -e "${GREEN}🚀 Platform is ready for go-live deployment!${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}🛑 Platform is not ready for deployment. Please fix the issues and re-run tests.${NC}"
        exit 1
    fi
}

# Execute main function
main "$@"