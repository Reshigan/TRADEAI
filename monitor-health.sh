#!/bin/bash

# TRADEAI Health Monitoring Script
# Monitors frontend, backend API, and WebSocket connectivity
# Version: 1.0

set -e

# Configuration
FRONTEND_URL="${FRONTEND_URL:-https://your-domain.com}"
API_URL="${API_URL:-https://tradeai.gonxt.tech/api}"
WS_URL="${WS_URL:-wss://tradeai.gonxt.tech/ws}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@example.com}"
LOG_FILE="${LOG_FILE:-/var/log/tradeai-health.log}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1" | tee -a "$LOG_FILE"
}

# Alert functions
send_alert() {
    local subject="$1"
    local message="$2"
    
    # Email alert
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
    fi
    
    # Slack alert
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"$subject\n$message\"}" \
            2>/dev/null || true
    fi
}

# Health check functions
check_frontend() {
    log_info "Checking frontend health..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" --max-time 10)
    
    if [ "$response" = "200" ]; then
        log_success "Frontend is healthy (HTTP $response)"
        return 0
    else
        log_error "Frontend check failed (HTTP $response)"
        send_alert "TRADEAI Frontend Down" "Frontend returned HTTP $response"
        return 1
    fi
}

check_api() {
    log_info "Checking API health..."
    
    local health_url="$API_URL/health"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" --max-time 10)
    
    if [ "$response" = "200" ]; then
        log_success "API is healthy (HTTP $response)"
        
        # Get detailed health info
        local health_data=$(curl -s "$health_url" --max-time 10)
        echo "  API Details: $health_data"
        return 0
    else
        log_error "API check failed (HTTP $response)"
        send_alert "TRADEAI API Down" "API returned HTTP $response"
        return 1
    fi
}

check_authentication() {
    log_info "Checking authentication endpoint..."
    
    local auth_url="$API_URL/auth/login"
    local response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$auth_url" --max-time 10)
    
    if [ "$response" = "200" ] || [ "$response" = "204" ]; then
        log_success "Authentication endpoint accessible (HTTP $response)"
        return 0
    else
        log_warning "Authentication endpoint returned HTTP $response"
        return 1
    fi
}

check_websocket() {
    log_info "Checking WebSocket connectivity..."
    
    # Simple WebSocket check using curl (if available)
    local ws_test=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Connection: Upgrade" \
        -H "Upgrade: websocket" \
        -H "Sec-WebSocket-Version: 13" \
        -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
        "${WS_URL/wss:/https:}" --max-time 10)
    
    if [ "$ws_test" = "101" ] || [ "$ws_test" = "200" ]; then
        log_success "WebSocket endpoint accessible"
        return 0
    else
        log_warning "WebSocket check inconclusive (HTTP $ws_test)"
        return 0  # Don't fail on WebSocket for now
    fi
}

check_ssl_certificate() {
    log_info "Checking SSL certificate..."
    
    local domain=$(echo "$FRONTEND_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
    local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)
    
    if [ -n "$expiry_date" ]; then
        local expiry_epoch=$(date -d "$expiry_date" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( ($expiry_epoch - $current_epoch) / 86400 ))
        
        if [ $days_until_expiry -gt 30 ]; then
            log_success "SSL certificate valid (expires in $days_until_expiry days)"
        elif [ $days_until_expiry -gt 0 ]; then
            log_warning "SSL certificate expires soon ($days_until_expiry days)"
            send_alert "SSL Certificate Expiring" "Certificate expires in $days_until_expiry days"
        else
            log_error "SSL certificate expired"
            send_alert "SSL Certificate Expired" "Certificate expired $days_until_expiry days ago"
            return 1
        fi
    else
        log_warning "Could not check SSL certificate"
    fi
    
    return 0
}

check_response_time() {
    log_info "Checking response times..."
    
    local start_time=$(date +%s%N)
    curl -s "$FRONTEND_URL" -o /dev/null --max-time 10
    local end_time=$(date +%s%N)
    local response_time=$(( ($end_time - $start_time) / 1000000 ))
    
    if [ $response_time -lt 1000 ]; then
        log_success "Response time: ${response_time}ms (excellent)"
    elif [ $response_time -lt 3000 ]; then
        log_success "Response time: ${response_time}ms (good)"
    else
        log_warning "Response time: ${response_time}ms (slow)"
    fi
}

check_disk_space() {
    log_info "Checking disk space..."
    
    local usage=$(df -h /var/www 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ -n "$usage" ]; then
        if [ $usage -lt 80 ]; then
            log_success "Disk space: ${usage}% used (healthy)"
        elif [ $usage -lt 90 ]; then
            log_warning "Disk space: ${usage}% used (monitor)"
        else
            log_error "Disk space: ${usage}% used (critical)"
            send_alert "Disk Space Critical" "Disk usage at ${usage}%"
        fi
    fi
}

check_nginx() {
    log_info "Checking Nginx status..."
    
    if systemctl is-active --quiet nginx 2>/dev/null; then
        log_success "Nginx is running"
        
        # Check config
        if nginx -t 2>&1 | grep -q "successful"; then
            log_success "Nginx configuration valid"
        else
            log_error "Nginx configuration has errors"
        fi
    else
        log_error "Nginx is not running"
        send_alert "Nginx Down" "Nginx service is not running"
    fi
}

generate_report() {
    log_info "Generating health report..."
    
    cat << EOF

========================================
TRADEAI Health Report
========================================
Date: $(date)
Uptime: $(uptime -p 2>/dev/null || echo "N/A")

Frontend URL: $FRONTEND_URL
API URL: $API_URL
WebSocket URL: $WS_URL

Check Results:
$(tail -n 50 "$LOG_FILE")

========================================
EOF
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "  TRADEAI Health Check                    "
    echo "=========================================="
    echo ""
    
    log "Starting health check..."
    
    local failed=0
    
    # Run all checks
    check_frontend || ((failed++))
    check_api || ((failed++))
    check_authentication || ((failed++))
    check_websocket || ((failed++))
    check_ssl_certificate || ((failed++))
    check_response_time
    check_disk_space
    check_nginx || ((failed++))
    
    echo ""
    echo "=========================================="
    
    if [ $failed -eq 0 ]; then
        log_success "All health checks passed!"
        echo "Status: 🟢 HEALTHY"
    else
        log_error "$failed health check(s) failed"
        echo "Status: 🔴 UNHEALTHY"
        send_alert "TRADEAI Health Check Failed" "$failed check(s) failed. See logs for details."
    fi
    
    echo "=========================================="
    echo ""
    
    # Generate report if requested
    if [ "$1" = "--report" ]; then
        generate_report
    fi
    
    exit $failed
}

# Run main function
main "$@"
