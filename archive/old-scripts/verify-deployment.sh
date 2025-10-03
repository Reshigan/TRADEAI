#!/bin/bash

# TRADEAI Deployment Verification Script
# This script verifies that the TRADEAI deployment is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${DOMAIN:-tradeai.gonxt.tech}"
INSTALL_DIR="${INSTALL_DIR:-/opt/tradeai}"
TIMEOUT=30

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

header() {
    echo
    echo -e "${BLUE}=== $1 ===${NC}"
    echo
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Test HTTP endpoint
test_http_endpoint() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    info "Testing $description: $url"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$url" 2>/dev/null || echo "000")
    
    if [[ "$response" == "$expected_status" ]]; then
        success "$description is responding (HTTP $response)"
        return 0
    else
        warning "$description returned HTTP $response (expected $expected_status)"
        return 1
    fi
}

# Test HTTPS endpoint
test_https_endpoint() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    info "Testing $description: $url"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT -k "$url" 2>/dev/null || echo "000")
    
    if [[ "$response" == "$expected_status" ]]; then
        success "$description is responding (HTTPS $response)"
        return 0
    else
        warning "$description returned HTTPS $response (expected $expected_status)"
        return 1
    fi
}

# Check Docker services
check_docker_services() {
    header "Checking Docker Services"
    
    cd "$INSTALL_DIR"
    
    # Check if Docker is running
    if ! systemctl is-active --quiet docker; then
        error "Docker service is not running"
    fi
    success "Docker service is running"
    
    # Detect compose file
    local compose_file="docker-compose.yml"
    if [[ $(uname -m) == "aarch64" ]]; then
        compose_file="docker-compose-arm64.yml"
    fi
    
    # Check if compose file exists
    if [[ ! -f "$compose_file" ]]; then
        error "Docker compose file not found: $compose_file"
    fi
    success "Docker compose file found: $compose_file"
    
    # Get service status
    info "Checking service status..."
    local services=$(docker compose -f "$compose_file" ps --services)
    local running_services=0
    local total_services=0
    
    for service in $services; do
        ((total_services++))
        local status=$(docker compose -f "$compose_file" ps --filter "service=$service" --format "{{.State}}")
        if [[ "$status" == "running" ]]; then
            success "$service: running"
            ((running_services++))
        else
            warning "$service: $status"
        fi
    done
    
    info "Services running: $running_services/$total_services"
    
    if [[ $running_services -eq $total_services ]]; then
        success "All Docker services are running"
    else
        warning "Some services are not running properly"
    fi
}

# Check SSL certificate
check_ssl_certificate() {
    header "Checking SSL Certificate"
    
    info "Checking SSL certificate for $DOMAIN..."
    
    # Check if certificate files exist
    if [[ -f "$INSTALL_DIR/ssl/fullchain.pem" && -f "$INSTALL_DIR/ssl/privkey.pem" ]]; then
        success "SSL certificate files found"
        
        # Check certificate validity
        local cert_info=$(openssl x509 -in "$INSTALL_DIR/ssl/fullchain.pem" -text -noout 2>/dev/null || echo "")
        if [[ -n "$cert_info" ]]; then
            local expiry=$(openssl x509 -in "$INSTALL_DIR/ssl/fullchain.pem" -enddate -noout | cut -d= -f2)
            success "SSL certificate is valid until: $expiry"
        else
            warning "SSL certificate file exists but may be invalid"
        fi
    else
        warning "SSL certificate files not found"
    fi
    
    # Test SSL connection
    if command -v openssl &> /dev/null; then
        info "Testing SSL connection..."
        if echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | grep -q "CONNECTED"; then
            success "SSL connection successful"
        else
            warning "SSL connection failed"
        fi
    fi
}

# Check database connectivity
check_database_connectivity() {
    header "Checking Database Connectivity"
    
    cd "$INSTALL_DIR"
    
    # Detect compose file
    local compose_file="docker-compose.yml"
    if [[ $(uname -m) == "aarch64" ]]; then
        compose_file="docker-compose-arm64.yml"
    fi
    
    # Test MongoDB
    info "Testing MongoDB connectivity..."
    if docker compose -f "$compose_file" exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" > /dev/null 2>&1; then
        success "MongoDB is accessible"
        
        # Check if test data exists
        local company_count=$(docker compose -f "$compose_file" exec -T mongodb mongosh --quiet --eval "use('tradeai'); db.companies.countDocuments()" 2>/dev/null | tail -1)
        if [[ "$company_count" -gt 0 ]]; then
            success "Database contains $company_count companies"
        else
            warning "Database appears to be empty"
        fi
    else
        warning "MongoDB is not accessible"
    fi
    
    # Test Redis
    info "Testing Redis connectivity..."
    if docker compose -f "$compose_file" exec -T redis redis-cli ping > /dev/null 2>&1; then
        success "Redis is accessible"
    else
        warning "Redis is not accessible"
    fi
}

# Check web endpoints
check_web_endpoints() {
    header "Checking Web Endpoints"
    
    local base_url="https://$DOMAIN"
    local passed=0
    local total=0
    
    # Test main endpoints
    local endpoints=(
        "$base_url|Main Application"
        "$base_url/health|Health Check"
        "$base_url/api/health|API Health Check"
        "$base_url/api/v1/companies|Companies API"
        "$base_url/monitoring/health|Monitoring Health"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS='|' read -r url description <<< "$endpoint_info"
        ((total++))
        if test_https_endpoint "$url" "$description"; then
            ((passed++))
        fi
    done
    
    info "Web endpoints test: $passed/$total passed"
    
    # Test HTTP to HTTPS redirect
    info "Testing HTTP to HTTPS redirect..."
    local redirect_response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "http://$DOMAIN" 2>/dev/null || echo "000")
    if [[ "$redirect_response" == "301" || "$redirect_response" == "302" ]]; then
        success "HTTP to HTTPS redirect is working"
    else
        warning "HTTP to HTTPS redirect may not be working (got HTTP $redirect_response)"
    fi
}

# Check system resources
check_system_resources() {
    header "Checking System Resources"
    
    # Check disk space
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    info "Disk usage: ${disk_usage}%"
    if [[ $disk_usage -lt 80 ]]; then
        success "Disk space is adequate"
    else
        warning "Disk space is running low (${disk_usage}% used)"
    fi
    
    # Check memory usage
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    info "Memory usage: ${mem_usage}%"
    if [[ $mem_usage -lt 80 ]]; then
        success "Memory usage is normal"
    else
        warning "Memory usage is high (${mem_usage}%)"
    fi
    
    # Check load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    info "Load average: $load_avg"
    
    # Check if ports are listening
    info "Checking port availability..."
    local ports=(80 443)
    for port in "${ports[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            success "Port $port is listening"
        else
            warning "Port $port is not listening"
        fi
    done
}

# Check logs for errors
check_logs() {
    header "Checking Recent Logs"
    
    cd "$INSTALL_DIR"
    
    # Detect compose file
    local compose_file="docker-compose.yml"
    if [[ $(uname -m) == "aarch64" ]]; then
        compose_file="docker-compose-arm64.yml"
    fi
    
    info "Checking for recent errors in logs..."
    
    # Check for common error patterns
    local error_patterns=("ERROR" "FATAL" "Exception" "failed" "timeout")
    local errors_found=0
    
    for pattern in "${error_patterns[@]}"; do
        local count=$(docker compose -f "$compose_file" logs --since="1h" 2>/dev/null | grep -i "$pattern" | wc -l)
        if [[ $count -gt 0 ]]; then
            warning "Found $count '$pattern' entries in recent logs"
            ((errors_found++))
        fi
    done
    
    if [[ $errors_found -eq 0 ]]; then
        success "No critical errors found in recent logs"
    else
        warning "Found potential issues in logs - review with: docker compose logs"
    fi
}

# Generate summary report
generate_summary() {
    header "Deployment Verification Summary"
    
    echo "🏢 TRADEAI Deployment Verification Report"
    echo "📅 Generated: $(date)"
    echo "🌐 Domain: $DOMAIN"
    echo "📁 Install Directory: $INSTALL_DIR"
    echo
    
    echo "🔍 Quick Access URLs:"
    echo "   • Main Application: https://$DOMAIN"
    echo "   • API Documentation: https://$DOMAIN/api"
    echo "   • Monitoring Dashboard: https://$DOMAIN/monitoring"
    echo "   • Health Check: https://$DOMAIN/health"
    echo
    
    echo "📊 Test Credentials:"
    echo "   • Username: testuser"
    echo "   • Email: test@tradeai.com"
    echo "   • Portfolio: Test Portfolio with sample data"
    echo
    
    echo "🛠️  Management Commands:"
    echo "   • View services: cd $INSTALL_DIR && sudo docker compose ps"
    echo "   • View logs: cd $INSTALL_DIR && sudo docker compose logs -f"
    echo "   • Restart: cd $INSTALL_DIR && sudo docker compose restart"
    echo
    
    success "Verification completed! Check any warnings above."
}

# Main verification function
main() {
    header "TRADEAI Deployment Verification"
    
    log "Starting deployment verification for $DOMAIN"
    
    # Run all checks
    check_root
    check_docker_services
    check_ssl_certificate
    check_database_connectivity
    check_web_endpoints
    check_system_resources
    check_logs
    generate_summary
    
    log "Deployment verification completed"
}

# Handle script interruption
trap 'error "Verification interrupted"' INT TERM

# Run main function
main "$@"