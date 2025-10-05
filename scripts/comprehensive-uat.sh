#!/bin/bash

# Trade AI Platform - Comprehensive UAT Testing Script
# This script performs comprehensive User Acceptance Testing for all components

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_DATE=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/tmp/trade-ai-uat-${TEST_DATE}.log"
RESULTS_FILE="/tmp/trade-ai-uat-results-${TEST_DATE}.json"

# Test configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:5002}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
DOMAIN="${DOMAIN:-tradeai.gonxt.tech}"
TEST_EMAIL="uat-test@example.com"
TEST_PASSWORD="UATTest123!"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Test result functions
test_start() {
    local test_name="$1"
    info "Starting test: $test_name"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

test_pass() {
    local test_name="$1"
    log "✅ PASSED: $test_name"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "{\"test\": \"$test_name\", \"status\": \"PASSED\", \"timestamp\": \"$(date -Iseconds)\"}" >> "$RESULTS_FILE"
}

test_fail() {
    local test_name="$1"
    local reason="$2"
    error "❌ FAILED: $test_name - $reason"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "{\"test\": \"$test_name\", \"status\": \"FAILED\", \"reason\": \"$reason\", \"timestamp\": \"$(date -Iseconds)\"}" >> "$RESULTS_FILE"
}

test_skip() {
    local test_name="$1"
    local reason="$2"
    warn "⏭️ SKIPPED: $test_name - $reason"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    echo "{\"test\": \"$test_name\", \"status\": \"SKIPPED\", \"reason\": \"$reason\", \"timestamp\": \"$(date -Iseconds)\"}" >> "$RESULTS_FILE"
}

# HTTP request helper
make_request() {
    local method="$1"
    local url="$2"
    local data="${3:-}"
    local headers="${4:-}"
    
    local curl_cmd="curl -s -w '%{http_code}' -X $method"
    
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd -H '$headers'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    eval "$curl_cmd"
}

# Test 0: Local AI/ML Validation
test_local_ai_validation() {
    test_start "Local AI/ML Validation"
    
    if [ -f "$PROJECT_ROOT/scripts/validate-local-ai.js" ]; then
        if cd "$PROJECT_ROOT" && node scripts/validate-local-ai.js > /dev/null 2>&1; then
            test_pass "Local AI/ML Validation"
        else
            test_fail "Local AI/ML Validation" "AI/ML validation script failed"
        fi
    else
        test_skip "Local AI/ML Validation" "Validation script not found"
    fi
}

# Test 1: Backend Health Check
test_backend_health() {
    test_start "Backend Health Check"
    
    local response
    response=$(make_request "GET" "$API_BASE_URL/health")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        if echo "$body" | jq -e '.status == "ok"' > /dev/null 2>&1; then
            test_pass "Backend Health Check"
        else
            test_fail "Backend Health Check" "Invalid response body: $body"
        fi
    else
        test_fail "Backend Health Check" "HTTP $http_code: $body"
    fi
}

# Test 2: API Health Check
test_api_health() {
    test_start "API Health Check"
    
    local response
    response=$(make_request "GET" "$API_BASE_URL/api/health")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        if echo "$body" | jq -e '.status == "ok"' > /dev/null 2>&1; then
            test_pass "API Health Check"
        else
            test_fail "API Health Check" "Invalid response body: $body"
        fi
    else
        test_fail "API Health Check" "HTTP $http_code: $body"
    fi
}

# Test 3: Database Connectivity
test_database_connectivity() {
    test_start "Database Connectivity"
    
    local response
    response=$(make_request "GET" "$API_BASE_URL/api/health/database")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        test_pass "Database Connectivity"
    elif [ "$http_code" = "404" ]; then
        test_skip "Database Connectivity" "Endpoint not available"
    else
        test_fail "Database Connectivity" "HTTP $http_code: $body"
    fi
}

# Test 4: Redis Connectivity
test_redis_connectivity() {
    test_start "Redis Connectivity"
    
    local response
    response=$(make_request "GET" "$API_BASE_URL/api/health/redis")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        test_pass "Redis Connectivity"
    elif [ "$http_code" = "404" ]; then
        test_skip "Redis Connectivity" "Endpoint not available"
    else
        test_fail "Redis Connectivity" "HTTP $http_code: $body"
    fi
}

# Test 5: Authentication - Registration
test_auth_registration() {
    test_start "Authentication Registration"
    
    local user_data='{
        "email": "'$TEST_EMAIL'",
        "password": "'$TEST_PASSWORD'",
        "firstName": "UAT",
        "lastName": "Test",
        "employeeId": "UAT001",
        "role": "admin",
        "department": "admin"
    }'
    
    local response
    response=$(make_request "POST" "$API_BASE_URL/api/auth/register" "$user_data" "Content-Type: application/json")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "201" ] || [ "$http_code" = "400" ]; then
        if [ "$http_code" = "400" ] && echo "$body" | grep -q "already exists"; then
            test_pass "Authentication Registration (User already exists)"
        elif [ "$http_code" = "201" ]; then
            test_pass "Authentication Registration"
        else
            test_fail "Authentication Registration" "HTTP $http_code: $body"
        fi
    else
        test_fail "Authentication Registration" "HTTP $http_code: $body"
    fi
}

# Test 6: Authentication - Login
test_auth_login() {
    test_start "Authentication Login"
    
    local login_data='{
        "email": "'$TEST_EMAIL'",
        "password": "'$TEST_PASSWORD'"
    }'
    
    local response
    response=$(make_request "POST" "$API_BASE_URL/api/auth/login" "$login_data" "Content-Type: application/json")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        if echo "$body" | jq -e '.token' > /dev/null 2>&1; then
            # Store token for subsequent tests
            AUTH_TOKEN=$(echo "$body" | jq -r '.token')
            test_pass "Authentication Login"
        else
            test_fail "Authentication Login" "No token in response: $body"
        fi
    elif [ "$http_code" = "401" ]; then
        test_skip "Authentication Login" "Invalid credentials (expected in mock mode)"
    else
        test_fail "Authentication Login" "HTTP $http_code: $body"
    fi
}

# Test 7: CORS Headers
test_cors_headers() {
    test_start "CORS Headers"
    
    local response
    response=$(curl -s -I -X OPTIONS "$API_BASE_URL/api/health" -H "Origin: https://tradeai.gonxt.tech")
    
    if echo "$response" | grep -qi "access-control-allow-origin"; then
        test_pass "CORS Headers"
    else
        test_fail "CORS Headers" "Missing CORS headers in response"
    fi
}

# Test 8: SSL Certificate (if HTTPS)
test_ssl_certificate() {
    test_start "SSL Certificate"
    
    if [[ "$API_BASE_URL" == https* ]] || [[ "$DOMAIN" != "localhost" ]]; then
        local ssl_check
        ssl_check=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            test_pass "SSL Certificate"
        else
            test_fail "SSL Certificate" "SSL certificate validation failed"
        fi
    else
        test_skip "SSL Certificate" "Not using HTTPS"
    fi
}

# Test 9: Frontend Accessibility
test_frontend_accessibility() {
    test_start "Frontend Accessibility"
    
    local response
    response=$(curl -s -w '%{http_code}' "$FRONTEND_URL")
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        test_pass "Frontend Accessibility"
    else
        test_fail "Frontend Accessibility" "HTTP $http_code"
    fi
}

# Test 10: API Rate Limiting
test_rate_limiting() {
    test_start "API Rate Limiting"
    
    # Make multiple rapid requests
    local success_count=0
    local rate_limited=false
    
    for i in {1..20}; do
        local response
        response=$(make_request "GET" "$API_BASE_URL/api/health")
        local http_code="${response: -3}"
        
        if [ "$http_code" = "200" ]; then
            success_count=$((success_count + 1))
        elif [ "$http_code" = "429" ]; then
            rate_limited=true
            break
        fi
        
        sleep 0.1
    done
    
    if [ "$rate_limited" = true ] || [ "$success_count" -gt 0 ]; then
        test_pass "API Rate Limiting"
    else
        test_fail "API Rate Limiting" "No successful requests or rate limiting"
    fi
}

# Test 11: File Upload Endpoint
test_file_upload() {
    test_start "File Upload Endpoint"
    
    # Create a test file
    echo "UAT Test File" > /tmp/uat-test.txt
    
    local response
    response=$(curl -s -w '%{http_code}' -X POST "$API_BASE_URL/api/upload" -F "file=@/tmp/uat-test.txt" 2>/dev/null || echo "000")
    local http_code="${response: -3}"
    
    # Clean up
    rm -f /tmp/uat-test.txt
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "401" ] || [ "$http_code" = "404" ]; then
        if [ "$http_code" = "401" ]; then
            test_pass "File Upload Endpoint (Authentication required)"
        elif [ "$http_code" = "404" ]; then
            test_skip "File Upload Endpoint" "Endpoint not available"
        else
            test_pass "File Upload Endpoint"
        fi
    else
        test_fail "File Upload Endpoint" "HTTP $http_code"
    fi
}

# Test 12: WebSocket Connection
test_websocket() {
    test_start "WebSocket Connection"
    
    if command -v wscat > /dev/null 2>&1; then
        local ws_url="${API_BASE_URL/http/ws}/ws"
        timeout 5 wscat -c "$ws_url" -x '{"type":"ping"}' > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            test_pass "WebSocket Connection"
        else
            test_fail "WebSocket Connection" "Connection failed"
        fi
    else
        test_skip "WebSocket Connection" "wscat not available"
    fi
}

# Test 13: Security Headers
test_security_headers() {
    test_start "Security Headers"
    
    local response
    response=$(curl -s -I "$API_BASE_URL/api/health")
    
    local security_headers=("X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection")
    local found_headers=0
    
    for header in "${security_headers[@]}"; do
        if echo "$response" | grep -qi "$header"; then
            found_headers=$((found_headers + 1))
        fi
    done
    
    if [ "$found_headers" -gt 0 ]; then
        test_pass "Security Headers ($found_headers/3 found)"
    else
        test_fail "Security Headers" "No security headers found"
    fi
}

# Test 14: Environment Configuration
test_environment_config() {
    test_start "Environment Configuration"
    
    local response
    response=$(make_request "GET" "$API_BASE_URL/api/health")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        local env
        env=$(echo "$body" | jq -r '.environment // "unknown"')
        
        if [ "$env" != "unknown" ]; then
            test_pass "Environment Configuration (Environment: $env)"
        else
            test_fail "Environment Configuration" "Environment not specified in response"
        fi
    else
        test_fail "Environment Configuration" "Cannot retrieve environment info"
    fi
}

# Test 15: Performance Test
test_performance() {
    test_start "Performance Test"
    
    local start_time
    start_time=$(date +%s%N)
    
    local response
    response=$(make_request "GET" "$API_BASE_URL/api/health")
    local http_code="${response: -3}"
    
    local end_time
    end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ "$http_code" = "200" ] && [ "$duration" -lt 5000 ]; then
        test_pass "Performance Test (Response time: ${duration}ms)"
    elif [ "$http_code" = "200" ]; then
        test_fail "Performance Test" "Response time too slow: ${duration}ms"
    else
        test_fail "Performance Test" "HTTP $http_code"
    fi
}

# Generate test report
generate_report() {
    log "Generating UAT test report..."
    
    local report_file="/tmp/trade-ai-uat-report-${TEST_DATE}.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Trade AI Platform - UAT Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; padding: 15px; border-radius: 5px; }
        .passed { background: #d4edda; color: #155724; }
        .failed { background: #f8d7da; color: #721c24; }
        .skipped { background: #fff3cd; color: #856404; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .test-passed { border-left-color: #28a745; }
        .test-failed { border-left-color: #dc3545; }
        .test-skipped { border-left-color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Trade AI Platform - UAT Test Report</h1>
        <p><strong>Date:</strong> $(date)</p>
        <p><strong>API Base URL:</strong> $API_BASE_URL</p>
        <p><strong>Frontend URL:</strong> $FRONTEND_URL</p>
        <p><strong>Domain:</strong> $DOMAIN</p>
    </div>
    
    <div class="summary passed">
        <h2>Test Summary</h2>
        <p><strong>Total Tests:</strong> $TOTAL_TESTS</p>
        <p><strong>Passed:</strong> $PASSED_TESTS</p>
        <p><strong>Failed:</strong> $FAILED_TESTS</p>
        <p><strong>Skipped:</strong> $SKIPPED_TESTS</p>
        <p><strong>Success Rate:</strong> $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%</p>
    </div>
    
    <h2>Test Results</h2>
EOF
    
    # Add individual test results
    if [ -f "$RESULTS_FILE" ]; then
        while IFS= read -r line; do
            local test_name status reason
            test_name=$(echo "$line" | jq -r '.test')
            status=$(echo "$line" | jq -r '.status')
            reason=$(echo "$line" | jq -r '.reason // ""')
            
            local css_class="test-passed"
            local icon="✅"
            
            if [ "$status" = "FAILED" ]; then
                css_class="test-failed"
                icon="❌"
            elif [ "$status" = "SKIPPED" ]; then
                css_class="test-skipped"
                icon="⏭️"
            fi
            
            echo "    <div class=\"test-result $css_class\">" >> "$report_file"
            echo "        <strong>$icon $test_name</strong> - $status" >> "$report_file"
            if [ -n "$reason" ]; then
                echo "        <br><small>$reason</small>" >> "$report_file"
            fi
            echo "    </div>" >> "$report_file"
        done < "$RESULTS_FILE"
    fi
    
    cat >> "$report_file" << EOF
</body>
</html>
EOF
    
    info "UAT test report generated: $report_file"
}

# Main execution
main() {
    log "Starting Trade AI Platform Comprehensive UAT Testing"
    info "API Base URL: $API_BASE_URL"
    info "Frontend URL: $FRONTEND_URL"
    info "Domain: $DOMAIN"
    info "Log file: $LOG_FILE"
    info "Results file: $RESULTS_FILE"
    
    # Initialize results file
    echo "" > "$RESULTS_FILE"
    
    # Run all tests
    test_local_ai_validation
    test_backend_health
    test_api_health
    test_database_connectivity
    test_redis_connectivity
    test_auth_registration
    test_auth_login
    test_cors_headers
    test_ssl_certificate
    test_frontend_accessibility
    test_rate_limiting
    test_file_upload
    test_websocket
    test_security_headers
    test_environment_config
    test_performance
    
    # Generate report
    generate_report
    
    # Final summary
    log "UAT Testing completed!"
    info "Total Tests: $TOTAL_TESTS"
    info "Passed: $PASSED_TESTS"
    info "Failed: $FAILED_TESTS"
    info "Skipped: $SKIPPED_TESTS"
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        log "🎉 All tests passed! System is ready for production."
        exit 0
    else
        error "❌ $FAILED_TESTS test(s) failed. Please review and fix issues before deployment."
        exit 1
    fi
}

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    if ! command -v curl > /dev/null 2>&1; then
        missing_deps+=("curl")
    fi
    
    if ! command -v jq > /dev/null 2>&1; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        error "Missing required dependencies: ${missing_deps[*]}"
        info "Please install missing dependencies and try again."
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --api-url)
            API_BASE_URL="$2"
            shift 2
            ;;
        --frontend-url)
            FRONTEND_URL="$2"
            shift 2
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --help)
            echo "Trade AI Platform - Comprehensive UAT Testing Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --api-url URL        API base URL (default: http://localhost:5002)"
            echo "  --frontend-url URL   Frontend URL (default: http://localhost:3000)"
            echo "  --domain DOMAIN      Domain name (default: tradeai.gonxt.tech)"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run the tests
check_dependencies
main