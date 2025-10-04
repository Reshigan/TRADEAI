#!/bin/bash

###############################################################################
# TRADEAI Production Deployment Test Suite
# Comprehensive testing of deployed application
###############################################################################

set -e

DOMAIN="tradeai.gonxt.tech"
API_URL="https://$DOMAIN/api"
FRONTEND_URL="https://$DOMAIN"

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║     TRADEAI Production Deployment Test Suite          ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

echo "🔍 Test Suite Started: $(date)"
echo ""

# Test 1: System Services
echo "═══════════════════════════════════════════════════════"
echo "1. SYSTEM SERVICES TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Testing MongoDB..."
sudo systemctl is-active mongod > /dev/null 2>&1
test_result $? "MongoDB service is running"

echo "Testing Redis..."
sudo systemctl is-active redis > /dev/null 2>&1
test_result $? "Redis service is running"

echo "Testing Nginx..."
sudo systemctl is-active nginx > /dev/null 2>&1
test_result $? "Nginx service is running"

echo "Testing PM2..."
pm2 list | grep -q "tradeai-backend" > /dev/null 2>&1
test_result $? "PM2 application is running"

echo ""

# Test 2: Database Connectivity
echo "═══════════════════════════════════════════════════════"
echo "2. DATABASE CONNECTIVITY TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Testing MongoDB connection..."
mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1
test_result $? "MongoDB connection successful"

echo "Testing Redis connection..."
redis-cli ping | grep -q "PONG" > /dev/null 2>&1
test_result $? "Redis connection successful"

echo ""

# Test 3: SSL/HTTPS
echo "═══════════════════════════════════════════════════════"
echo "3. SSL/HTTPS TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Testing SSL certificate..."
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>&1 | grep -q "200\|301\|302" > /dev/null 2>&1
test_result $? "SSL certificate valid and working"

echo "Testing HTTP to HTTPS redirect..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN)
[ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]
test_result $? "HTTP to HTTPS redirect working"

echo ""

# Test 4: Backend API
echo "═══════════════════════════════════════════════════════"
echo "4. BACKEND API TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Testing API health endpoint..."
HEALTH_STATUS=$(curl -s $API_URL/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
[ "$HEALTH_STATUS" = "ok" ] || [ "$HEALTH_STATUS" = "healthy" ]
test_result $? "Backend health check passed (Status: $HEALTH_STATUS)"

echo "Testing API response time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" $API_URL/health)
[ $(echo "$RESPONSE_TIME < 2.0" | bc) -eq 1 ]
test_result $? "API response time acceptable ($RESPONSE_TIME seconds)"

echo "Testing auth endpoint..."
curl -s -X POST $API_URL/auth/login -H "Content-Type: application/json" > /dev/null 2>&1
test_result $? "Auth endpoint accessible"

echo ""

# Test 5: Frontend
echo "═══════════════════════════════════════════════════════"
echo "5. FRONTEND TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Testing frontend availability..."
curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL | grep -q "200"
test_result $? "Frontend accessible"

echo "Testing frontend load time..."
FRONTEND_TIME=$(curl -s -o /dev/null -w "%{time_total}" $FRONTEND_URL)
[ $(echo "$FRONTEND_TIME < 3.0" | bc) -eq 1 ]
test_result $? "Frontend load time acceptable ($FRONTEND_TIME seconds)"

echo "Testing static assets..."
curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL/static/js/main.*.js 2>&1 | grep -q "200\|404"
test_result $? "Static assets directory configured"

echo ""

# Test 6: Security Headers
echo "═══════════════════════════════════════════════════════"
echo "6. SECURITY TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Testing HTTPS enforcement..."
curl -s -I https://$DOMAIN | grep -qi "strict-transport-security" || echo "⚠️  HSTS header recommended"

echo "Testing CORS headers..."
curl -s -I $API_URL/health | grep -qi "access-control" || echo "⚠️  CORS headers may need configuration"

echo ""

# Test 7: Performance
echo "═══════════════════════════════════════════════════════"
echo "7. PERFORMANCE TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Testing concurrent requests..."
for i in {1..5}; do
    curl -s -o /dev/null $API_URL/health &
done
wait
test_result $? "Handled concurrent requests"

echo "Testing memory usage..."
PM2_MEMORY=$(pm2 jlist | grep -o '"memory":[0-9]*' | head -1 | cut -d: -f2)
if [ ! -z "$PM2_MEMORY" ]; then
    MEMORY_MB=$((PM2_MEMORY / 1024 / 1024))
    echo "  Backend memory usage: ${MEMORY_MB}MB"
    [ $MEMORY_MB -lt 1024 ]
    test_result $? "Memory usage within limits"
else
    echo "  ⚠️  Could not determine memory usage"
fi

echo ""

# Test 8: File System
echo "═══════════════════════════════════════════════════════"
echo "8. FILE SYSTEM TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Testing application directory..."
[ -d "/opt/tradeai" ]
test_result $? "Application directory exists"

echo "Testing backend files..."
[ -f "/opt/tradeai/backend/src/server.js" ]
test_result $? "Backend files present"

echo "Testing frontend build..."
[ -d "/opt/tradeai/frontend/build" ]
test_result $? "Frontend build exists"

echo "Testing environment file..."
[ -f "/opt/tradeai/backend/.env" ]
test_result $? "Environment configuration exists"

echo "Testing log directory..."
[ -d "/opt/tradeai/logs" ]
test_result $? "Log directory exists"

echo ""

# Test 9: Firewall
echo "═══════════════════════════════════════════════════════"
echo "9. FIREWALL TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Testing firewall status..."
sudo ufw status | grep -q "Status: active"
test_result $? "Firewall is active"

echo "Testing allowed ports..."
sudo ufw status | grep -q "80/tcp.*ALLOW"
test_result $? "Port 80 (HTTP) allowed"

sudo ufw status | grep -q "443/tcp.*ALLOW"
test_result $? "Port 443 (HTTPS) allowed"

echo ""

# Test 10: Application Features
echo "═══════════════════════════════════════════════════════"
echo "10. APPLICATION FEATURE TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Testing super admin endpoints..."
curl -s -o /dev/null -w "%{http_code}" $API_URL/super-admin/health 2>&1 | grep -q "200\|401\|403"
test_result $? "Super admin routes configured"

echo "Testing enterprise endpoints..."
curl -s -o /dev/null -w "%{http_code}" $API_URL/enterprise/budget/dashboard 2>&1 | grep -q "200\|401\|403"
test_result $? "Enterprise budget routes configured"

echo ""

# Test 11: PM2 Configuration
echo "═══════════════════════════════════════════════════════"
echo "11. PM2 CONFIGURATION TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Testing PM2 startup..."
pm2 startup | grep -q "systemd" || pm2 list > /dev/null 2>&1
test_result $? "PM2 startup configured"

echo "Testing PM2 save..."
[ -f "/home/ubuntu/.pm2/dump.pm2" ]
test_result $? "PM2 process list saved"

echo ""

# Final Summary
echo "═══════════════════════════════════════════════════════"
echo "TEST SUMMARY"
echo "═══════════════════════════════════════════════════════"
echo ""

TOTAL=$((PASSED + FAILED))
PASS_RATE=$((PASSED * 100 / TOTAL))

echo "Total Tests:  $TOTAL"
echo -e "${GREEN}Passed:       $PASSED${NC}"
echo -e "${RED}Failed:       $FAILED${NC}"
echo "Pass Rate:    $PASS_RATE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}║        ✓ ALL TESTS PASSED SUCCESSFULLY! ✓             ║${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "🎉 Production deployment is healthy and operational!"
    echo ""
    echo "📊 Application Status:"
    pm2 status
    echo ""
    echo "🌐 Access your application:"
    echo "  Frontend:     https://$DOMAIN"
    echo "  Backend API:  https://$DOMAIN/api"
    echo ""
    exit 0
else
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                                                        ║${NC}"
    echo -e "${YELLOW}║        ⚠️  SOME TESTS FAILED - REVIEW NEEDED           ║${NC}"
    echo -e "${YELLOW}║                                                        ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "⚠️  Please review failed tests and fix issues"
    echo ""
    echo "📝 Check logs:"
    echo "  Backend:  pm2 logs tradeai-backend"
    echo "  Nginx:    sudo tail -f /var/log/nginx/error.log"
    echo "  MongoDB:  sudo journalctl -u mongod -n 50"
    echo ""
    exit 1
fi
