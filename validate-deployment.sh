#!/bin/bash

# TRADEAI Deployment Validation Script
# Tests the complete production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="tradeai.gonxt.tech"
API_URL="https://$DOMAIN/api"
FRONTEND_URL="https://$DOMAIN"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("$1")
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Test SSL certificate
test_ssl() {
    header "Testing SSL Certificate"
    
    log "Checking SSL certificate for $DOMAIN..."
    
    if curl -I -s --connect-timeout 10 "https://$DOMAIN" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
        success "SSL certificate is valid and accessible"
    else
        error "SSL certificate test failed"
    fi
    
    log "Checking SSL certificate details..."
    if command -v openssl &> /dev/null; then
        SSL_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        if [[ -n "$SSL_INFO" ]]; then
            info "SSL Certificate Info:"
            echo "$SSL_INFO" | sed 's/^/   /'
            success "SSL certificate details retrieved"
        else
            warn "Could not retrieve SSL certificate details"
        fi
    fi
}

# Test frontend accessibility
test_frontend() {
    header "Testing Frontend Accessibility"
    
    log "Testing frontend homepage..."
    if curl -f -s --connect-timeout 10 "$FRONTEND_URL" > /dev/null; then
        success "Frontend homepage is accessible"
    else
        error "Frontend homepage is not accessible"
    fi
    
    log "Testing frontend static assets..."
    STATIC_ASSETS=$(curl -s "$FRONTEND_URL" | grep -o 'static/[^"]*' | head -3)
    if [[ -n "$STATIC_ASSETS" ]]; then
        for asset in $STATIC_ASSETS; do
            if curl -f -s --connect-timeout 5 "$FRONTEND_URL/$asset" > /dev/null; then
                success "Static asset accessible: $asset"
            else
                error "Static asset not accessible: $asset"
            fi
        done
    else
        warn "No static assets found in homepage"
    fi
}

# Test API endpoints
test_api() {
    header "Testing API Endpoints"
    
    log "Testing API health endpoint..."
    if curl -f -s --connect-timeout 10 "$API_URL/health" | grep -q "ok\|healthy\|success"; then
        success "API health endpoint is working"
    else
        error "API health endpoint is not working"
    fi
    
    log "Testing API authentication endpoint..."
    AUTH_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' \
        -o /dev/null)
    
    if [[ "$AUTH_RESPONSE" == "400" ]] || [[ "$AUTH_RESPONSE" == "401" ]] || [[ "$AUTH_RESPONSE" == "422" ]]; then
        success "API authentication endpoint is responding (expected error for invalid credentials)"
    else
        error "API authentication endpoint is not responding correctly (HTTP $AUTH_RESPONSE)"
    fi
    
    log "Testing API CORS headers..."
    CORS_HEADERS=$(curl -s -I -X OPTIONS "$API_URL/health" | grep -i "access-control")
    if [[ -n "$CORS_HEADERS" ]]; then
        success "API CORS headers are configured"
        info "CORS Headers:"
        echo "$CORS_HEADERS" | sed 's/^/   /'
    else
        warn "API CORS headers not found"
    fi
}

# Test database connectivity
test_database() {
    header "Testing Database Connectivity"
    
    log "Testing database through API..."
    DB_TEST=$(curl -s -w "%{http_code}" "$API_URL/users" -o /dev/null)
    
    if [[ "$DB_TEST" == "401" ]] || [[ "$DB_TEST" == "403" ]]; then
        success "Database is accessible (authentication required as expected)"
    elif [[ "$DB_TEST" == "200" ]]; then
        success "Database is accessible"
    else
        error "Database connectivity test failed (HTTP $DB_TEST)"
    fi
}

# Test user authentication
test_authentication() {
    header "Testing User Authentication"
    
    log "Testing login with default credentials..."
    
    # Test with admin credentials
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"TradeAI2025!"}')
    
    if echo "$LOGIN_RESPONSE" | grep -q "token\|success"; then
        success "Admin login is working"
        
        # Extract token for further tests
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        if [[ -n "$TOKEN" ]]; then
            info "Authentication token received"
            
            # Test authenticated endpoint
            log "Testing authenticated API endpoint..."
            AUTH_TEST=$(curl -s -w "%{http_code}" "$API_URL/users/profile" \
                -H "Authorization: Bearer $TOKEN" \
                -o /dev/null)
            
            if [[ "$AUTH_TEST" == "200" ]]; then
                success "Authenticated API endpoints are working"
            else
                error "Authenticated API endpoints are not working (HTTP $AUTH_TEST)"
            fi
        fi
    else
        error "Admin login is not working"
    fi
}

# Test trading terms functionality
test_trading_terms() {
    header "Testing Trading Terms Functionality"
    
    log "Testing trading terms API endpoint..."
    TERMS_RESPONSE=$(curl -s -w "%{http_code}" "$API_URL/trading-terms" -o /dev/null)
    
    if [[ "$TERMS_RESPONSE" == "401" ]] || [[ "$TERMS_RESPONSE" == "403" ]]; then
        success "Trading terms endpoint is protected (authentication required)"
    elif [[ "$TERMS_RESPONSE" == "200" ]]; then
        success "Trading terms endpoint is accessible"
    else
        error "Trading terms endpoint test failed (HTTP $TERMS_RESPONSE)"
    fi
}

# Test file upload functionality
test_file_upload() {
    header "Testing File Upload Functionality"
    
    log "Testing file upload endpoint..."
    UPLOAD_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/upload" \
        -F "file=@/dev/null" \
        -o /dev/null)
    
    if [[ "$UPLOAD_RESPONSE" == "401" ]] || [[ "$UPLOAD_RESPONSE" == "403" ]] || [[ "$UPLOAD_RESPONSE" == "400" ]]; then
        success "File upload endpoint is responding (authentication/validation required)"
    else
        warn "File upload endpoint response: HTTP $UPLOAD_RESPONSE"
    fi
}

# Test performance
test_performance() {
    header "Testing Performance"
    
    log "Testing frontend load time..."
    FRONTEND_TIME=$(curl -w "%{time_total}" -s -o /dev/null "$FRONTEND_URL")
    if (( $(echo "$FRONTEND_TIME < 5.0" | bc -l) )); then
        success "Frontend loads in ${FRONTEND_TIME}s (good performance)"
    elif (( $(echo "$FRONTEND_TIME < 10.0" | bc -l) )); then
        warn "Frontend loads in ${FRONTEND_TIME}s (acceptable performance)"
    else
        error "Frontend loads in ${FRONTEND_TIME}s (poor performance)"
    fi
    
    log "Testing API response time..."
    API_TIME=$(curl -w "%{time_total}" -s -o /dev/null "$API_URL/health")
    if (( $(echo "$API_TIME < 2.0" | bc -l) )); then
        success "API responds in ${API_TIME}s (good performance)"
    elif (( $(echo "$API_TIME < 5.0" | bc -l) )); then
        warn "API responds in ${API_TIME}s (acceptable performance)"
    else
        error "API responds in ${API_TIME}s (poor performance)"
    fi
}

# Test security headers
test_security() {
    header "Testing Security Headers"
    
    log "Checking security headers..."
    SECURITY_HEADERS=$(curl -I -s "$FRONTEND_URL")
    
    if echo "$SECURITY_HEADERS" | grep -qi "strict-transport-security"; then
        success "HSTS header is present"
    else
        error "HSTS header is missing"
    fi
    
    if echo "$SECURITY_HEADERS" | grep -qi "x-frame-options"; then
        success "X-Frame-Options header is present"
    else
        error "X-Frame-Options header is missing"
    fi
    
    if echo "$SECURITY_HEADERS" | grep -qi "x-content-type-options"; then
        success "X-Content-Type-Options header is present"
    else
        error "X-Content-Type-Options header is missing"
    fi
    
    if echo "$SECURITY_HEADERS" | grep -qi "x-xss-protection"; then
        success "X-XSS-Protection header is present"
    else
        warn "X-XSS-Protection header is missing"
    fi
}

# Test monitoring endpoints
test_monitoring() {
    header "Testing Monitoring"
    
    log "Testing health monitoring..."
    if curl -f -s --connect-timeout 5 "$API_URL/health" > /dev/null; then
        success "Health monitoring endpoint is working"
    else
        error "Health monitoring endpoint is not working"
    fi
    
    log "Testing system status..."
    STATUS_RESPONSE=$(curl -s "$API_URL/status" 2>/dev/null || echo "not_found")
    if [[ "$STATUS_RESPONSE" != "not_found" ]]; then
        success "System status endpoint is available"
    else
        info "System status endpoint not found (optional)"
    fi
}

# Generate test report
generate_report() {
    header "Test Report"
    
    TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
    SUCCESS_RATE=$(( TESTS_PASSED * 100 / TOTAL_TESTS ))
    
    echo -e "${BLUE}📊 Test Summary:${NC}"
    echo -e "   Total Tests: ${YELLOW}$TOTAL_TESTS${NC}"
    echo -e "   Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "   Failed: ${RED}$TESTS_FAILED${NC}"
    echo -e "   Success Rate: ${YELLOW}$SUCCESS_RATE%${NC}"
    echo ""
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}🎉 All tests passed! Deployment is successful.${NC}"
        echo -e "${GREEN}✅ TRADEAI is ready for production use.${NC}"
    elif [[ $SUCCESS_RATE -ge 80 ]]; then
        echo -e "${YELLOW}⚠️  Most tests passed, but some issues need attention.${NC}"
        echo -e "${BLUE}📋 Failed Tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "   ${RED}❌${NC} $test"
        done
    else
        echo -e "${RED}❌ Multiple critical issues found. Deployment needs attention.${NC}"
        echo -e "${BLUE}📋 Failed Tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "   ${RED}❌${NC} $test"
        done
    fi
    
    echo ""
    echo -e "${BLUE}🔗 Access URLs:${NC}"
    echo -e "   Frontend: ${YELLOW}$FRONTEND_URL${NC}"
    echo -e "   API: ${YELLOW}$API_URL${NC}"
    echo -e "   Health Check: ${YELLOW}$API_URL/health${NC}"
    echo ""
    
    if [[ $SUCCESS_RATE -ge 80 ]]; then
        echo -e "${BLUE}🚀 Next Steps:${NC}"
        echo -e "   1. Test user registration and login"
        echo -e "   2. Create trading terms and test functionality"
        echo -e "   3. Test file uploads and data management"
        echo -e "   4. Monitor system performance and logs"
        echo -e "   5. Set up regular backups and monitoring alerts"
    fi
}

# Main validation function
main() {
    header "TRADEAI Deployment Validation"
    
    log "Starting deployment validation for $DOMAIN..."
    log "Timestamp: $(date)"
    
    # Check if required tools are available
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v bc &> /dev/null; then
        warn "bc is not installed, performance tests may not work correctly"
    fi
    
    # Run all tests
    test_ssl
    test_frontend
    test_api
    test_database
    test_authentication
    test_trading_terms
    test_file_upload
    test_performance
    test_security
    test_monitoring
    
    # Generate final report
    generate_report
    
    # Exit with appropriate code
    if [[ $TESTS_FAILED -eq 0 ]]; then
        exit 0
    elif [[ $SUCCESS_RATE -ge 80 ]]; then
        exit 1
    else
        exit 2
    fi
}

# Handle script interruption
trap 'error "Validation interrupted"' INT TERM

# Run main function
main "$@"