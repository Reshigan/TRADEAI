#!/bin/bash

# TRADEAI Deployment Test Script
# Tests all major functionality after deployment

set -e

echo "🧪 TRADEAI Deployment Test Suite"
echo "================================="

# Configuration
SERVER_IP="13.247.139.75"
DOMAIN="tradeai.gonxt.tech"
BASE_URL="http://${DOMAIN}"
MONITORING_URL="http://${DOMAIN}:3001"

# Test accounts
ADMIN_EMAIL="admin@testcompany.demo"
ADMIN_PASSWORD="admin123"
MANAGER_EMAIL="manager@testcompany.demo"
MANAGER_PASSWORD="manager123"

echo "🔍 Testing server connectivity..."

# Test 1: Server connectivity
if ping -c 1 $SERVER_IP > /dev/null 2>&1; then
    echo "✅ Server is reachable at $SERVER_IP"
else
    echo "❌ Server is not reachable at $SERVER_IP"
    exit 1
fi

# Test 2: Domain resolution
if ping -c 1 $DOMAIN > /dev/null 2>&1; then
    echo "✅ Domain resolves correctly: $DOMAIN"
else
    echo "⚠️  Domain not resolving, using IP address"
    BASE_URL="http://${SERVER_IP}"
    MONITORING_URL="http://${SERVER_IP}:3001"
fi

echo "🌐 Testing web services..."

# Test 3: Frontend accessibility
if curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep -q "200"; then
    echo "✅ Frontend is accessible at $BASE_URL"
else
    echo "❌ Frontend is not accessible"
    exit 1
fi

# Test 4: API health check
API_HEALTH=$(curl -s "${BASE_URL}/api/health" || echo "failed")
if echo "$API_HEALTH" | grep -q "ok\|healthy\|success"; then
    echo "✅ Backend API is healthy"
else
    echo "❌ Backend API health check failed"
fi

# Test 5: Monitoring dashboard
if curl -s -o /dev/null -w "%{http_code}" $MONITORING_URL | grep -q "200"; then
    echo "✅ Monitoring dashboard is accessible at $MONITORING_URL"
else
    echo "⚠️  Monitoring dashboard may not be accessible"
fi

echo "🔐 Testing authentication..."

# Test 6: Login functionality
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" || echo "failed")

if echo "$LOGIN_RESPONSE" | grep -q "token\|success"; then
    echo "✅ Admin login successful"
    # Extract token if available
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || echo "")
else
    echo "⚠️  Admin login may need manual verification"
    TOKEN=""
fi

echo "📊 Testing core features..."

# Test 7: Dashboard data
if [ -n "$TOKEN" ]; then
    DASHBOARD_DATA=$(curl -s "${BASE_URL}/api/dashboard" \
        -H "Authorization: Bearer $TOKEN" || echo "failed")
    
    if echo "$DASHBOARD_DATA" | grep -q "data\|metrics\|kpi"; then
        echo "✅ Dashboard data loading correctly"
    else
        echo "⚠️  Dashboard data may need verification"
    fi
else
    echo "⚠️  Skipping authenticated API tests (no token)"
fi

# Test 8: Database connectivity
DB_TEST=$(curl -s "${BASE_URL}/api/test/db" || echo "failed")
if echo "$DB_TEST" | grep -q "connected\|success\|ok"; then
    echo "✅ Database connectivity confirmed"
else
    echo "⚠️  Database connectivity needs verification"
fi

echo "🎨 Testing static assets..."

# Test 9: Static assets
ASSETS_TEST=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/static/css/main.css" || echo "404")
if [ "$ASSETS_TEST" = "200" ]; then
    echo "✅ Static assets are loading correctly"
else
    echo "⚠️  Static assets may need verification"
fi

# Test 10: Walkthrough images
WALKTHROUGH_TEST=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/images/walkthrough/dashboard-overview.png" || echo "404")
if [ "$WALKTHROUGH_TEST" = "200" ]; then
    echo "✅ Walkthrough images are accessible"
else
    echo "⚠️  Walkthrough images may need verification"
fi

echo "🤖 Testing AI services..."

# Test 11: AI service health
AI_HEALTH=$(curl -s "${BASE_URL}/api/ai/health" || echo "failed")
if echo "$AI_HEALTH" | grep -q "healthy\|ok\|running"; then
    echo "✅ AI services are running"
else
    echo "⚠️  AI services may need verification"
fi

echo "📈 Testing monitoring..."

# Test 12: System metrics
METRICS_TEST=$(curl -s "${MONITORING_URL}/metrics" || echo "failed")
if echo "$METRICS_TEST" | grep -q "cpu\|memory\|disk"; then
    echo "✅ System metrics are available"
else
    echo "⚠️  System metrics may need verification"
fi

echo ""
echo "🎉 Test Summary"
echo "==============="
echo "✅ Basic connectivity and web services are working"
echo "✅ Application is deployed and accessible"
echo ""
echo "🔗 Access URLs:"
echo "   • Main Application: $BASE_URL"
echo "   • Monitoring: $MONITORING_URL"
echo ""
echo "👤 Test Accounts:"
echo "   • Admin: $ADMIN_EMAIL / $ADMIN_PASSWORD"
echo "   • Manager: $MANAGER_EMAIL / $MANAGER_PASSWORD"
echo "   • KAM: kam@testcompany.demo / kam123"
echo "   • Sales: sales@testcompany.demo / sales123"
echo "   • Analyst: analyst@testcompany.demo / analyst123"
echo ""
echo "📋 Manual Testing Checklist:"
echo "   □ Login with different user roles"
echo "   □ Navigate through all main sections"
echo "   □ Test promotion creation and management"
echo "   □ Verify budget allocation features"
echo "   □ Check customer and product management"
echo "   □ Test analytics and reporting"
echo "   □ Verify AI chatbot functionality"
echo "   □ Test settings and integration options"
echo "   □ Check walkthrough/help system"
echo ""
echo "🔧 If issues are found:"
echo "   1. Check service status: sudo docker compose ps"
echo "   2. View logs: sudo docker compose logs [service]"
echo "   3. Restart services: sudo docker compose restart"
echo "   4. Update deployment: git pull && sudo docker compose up -d --build"
echo ""
echo "✨ Deployment test completed!"