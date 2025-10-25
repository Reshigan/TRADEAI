#!/bin/bash
###############################################################################
# TRADEAI - Complete E2E Test Suite Runner
# Runs all tests: Backend + Frontend + Integration + E2E
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TRADEAI COMPREHENSIVE TEST SUITE        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}\n"

# Setup test environment
export NODE_ENV=test
export MONGODB_TEST_URI="mongodb://localhost:27017/tradeai_test"

# 1. Backend Unit Tests
echo -e "${BLUE}[1/5] Running Backend Unit Tests...${NC}"
cd backend && npm run test:unit
echo -e "${GREEN}✓ Backend unit tests passed${NC}\n"

# 2. Backend Integration Tests
echo -e "${BLUE}[2/5] Running Backend Integration Tests...${NC}"
npm run test:integration
echo -e "${GREEN}✓ Backend integration tests passed${NC}\n"

# 3. Backend E2E Tests
echo -e "${BLUE}[3/5] Running Backend E2E Tests...${NC}"
npm run test:e2e
echo -e "${GREEN}✓ Backend E2E tests passed${NC}\n"

# 4. Start servers for frontend tests
echo -e "${BLUE}[4/5] Starting servers for Frontend E2E...${NC}"
npm start > /tmp/backend-test.log 2>&1 &
BACKEND_PID=$!
cd ../frontend && npm start > /tmp/frontend-test.log 2>&1 &
FRONTEND_PID=$!

sleep 10  # Wait for servers to start

# 5. Frontend E2E Tests (Cypress)
echo -e "${BLUE}[5/5] Running Frontend E2E Tests (Cypress)...${NC}"
npx cypress run

# Cleanup
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true

echo -e "\n${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ ALL TESTS PASSED SUCCESSFULLY!          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}\n"
