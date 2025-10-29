#!/bin/bash

# 🚀 TRADEAI Production Deployment Script
# This script ensures the correct backend is always deployed

set -e  # Exit on error

echo "🚀 =================================="
echo "   TRADEAI Production Deployment"
echo "=================================="
echo ""

# Configuration
BACKEND_FILE="server-production.js"
PROCESS_NAME="tradeai-backend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify we're running the correct file
echo "📋 Step 1: Verifying backend configuration..."
if [ ! -f "$BACKEND_FILE" ]; then
    echo -e "${RED}❌ ERROR: $BACKEND_FILE not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend file found: $BACKEND_FILE${NC}"

# Step 2: Check if SalesTransaction.js exists in src/models
echo ""
echo "📋 Step 2: Checking required dependencies..."
if [ ! -f "src/models/SalesTransaction.js" ]; then
    echo -e "${YELLOW}⚠️  WARNING: SalesTransaction.js missing from src/models/${NC}"
    echo "   Copying from models/..."
    cp models/SalesTransaction.js src/models/SalesTransaction.js || {
        echo -e "${RED}❌ ERROR: Failed to copy SalesTransaction.js${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ SalesTransaction.js copied successfully${NC}"
else
    echo -e "${GREEN}✅ SalesTransaction.js exists${NC}"
fi

# Step 3: Stop current process
echo ""
echo "📋 Step 3: Stopping current backend..."
pm2 stop $PROCESS_NAME 2>/dev/null || echo "   Process not running"
pm2 delete $PROCESS_NAME 2>/dev/null || echo "   Process not in PM2"
echo -e "${GREEN}✅ Old process stopped${NC}"

# Step 4: Start correct backend
echo ""
echo "📋 Step 4: Starting production backend..."
pm2 start $BACKEND_FILE --name $PROCESS_NAME || {
    echo -e "${RED}❌ ERROR: Failed to start backend${NC}"
    exit 1
}
echo -e "${GREEN}✅ Backend started with PM2${NC}"

# Step 5: Wait for startup
echo ""
echo "📋 Step 5: Waiting for backend to initialize..."
sleep 5

# Step 6: Health check
echo ""
echo "📋 Step 6: Running health check..."
HEALTH_STATUS=$(curl -s http://localhost:5000/api/health | jq -r '.status' 2>/dev/null || echo "failed")

if [ "$HEALTH_STATUS" == "healthy" ]; then
    echo -e "${GREEN}✅ Backend is healthy!${NC}"
else
    echo -e "${RED}❌ ERROR: Health check failed (status: $HEALTH_STATUS)${NC}"
    echo "   Check logs with: pm2 logs $PROCESS_NAME"
    exit 1
fi

# Step 7: Test authentication
echo ""
echo "📋 Step 7: Testing authentication..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trade-ai.com","password":"Admin@123456"}' \
  | jq -r '.token' 2>/dev/null || echo "")

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo -e "${RED}❌ ERROR: Authentication test failed${NC}"
    exit 1
elif [[ "$TOKEN" == demo-token-* ]]; then
    echo -e "${RED}❌ ERROR: Receiving mock tokens (wrong backend running!)${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Authentication working (real JWT tokens)${NC}"
fi

# Step 8: Test CRUD endpoints
echo ""
echo "📋 Step 8: Testing CRUD endpoints..."

# Test customers
CUSTOMERS_SUCCESS=$(curl -s http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.success' 2>/dev/null || echo "false")

if [ "$CUSTOMERS_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✅ Customers endpoint working${NC}"
else
    echo -e "${RED}❌ ERROR: Customers endpoint failed${NC}"
    exit 1
fi

# Test promotions
PROMOTIONS_SUCCESS=$(curl -s http://localhost:5000/api/promotions \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.success' 2>/dev/null || echo "false")

if [ "$PROMOTIONS_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✅ Promotions endpoint working${NC}"
else
    echo -e "${RED}❌ ERROR: Promotions endpoint failed${NC}"
    exit 1
fi

# Test products
PRODUCTS_SUCCESS=$(curl -s http://localhost:5000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.success' 2>/dev/null || echo "false")

if [ "$PRODUCTS_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✅ Products endpoint working${NC}"
else
    echo -e "${RED}❌ ERROR: Products endpoint failed${NC}"
    exit 1
fi

# Step 9: Display status
echo ""
echo "📋 Step 9: PM2 Status:"
pm2 status | grep $PROCESS_NAME

# Success!
echo ""
echo -e "${GREEN}=================================="
echo "   ✅ Deployment Successful!"
echo "==================================${NC}"
echo ""
echo "📊 System Status:"
echo "   Backend: $BACKEND_FILE"
echo "   Process: $PROCESS_NAME"
echo "   Health: healthy"
echo "   Auth: Real JWT tokens ✅"
echo "   CRUD: All endpoints working ✅"
echo ""
echo "🌐 URLs:"
echo "   Frontend: https://tradeai.gonxt.tech"
echo "   API: https://tradeai.gonxt.tech/api"
echo "   Health: https://tradeai.gonxt.tech/api/health"
echo ""
echo "📝 Logs: pm2 logs $PROCESS_NAME"
echo "📊 Status: pm2 status"
echo ""
