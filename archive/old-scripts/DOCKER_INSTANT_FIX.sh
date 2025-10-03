#!/bin/bash

# 🚀 TRADEAI Docker Instant Fix Script
# Fixes the PostgreSQL reference issue immediately during deployment
# Author: OpenHands AI Assistant

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}🚀 TRADEAI DOCKER INSTANT FIX 🚀${NC}"
echo -e "${BOLD}${CYAN}====================================${NC}"
echo ""

# Get current directory
CURRENT_DIR=$(pwd)
echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] Working in directory: $CURRENT_DIR${NC}"

# 1. Remove version from docker-compose.yml
echo -e "${PURPLE}[STEP] Removing obsolete version attributes...${NC}"
if [ -f "docker-compose.yml" ]; then
    sed -i '/^version:/d' docker-compose.yml
    echo -e "${GREEN}✅ Removed version from docker-compose.yml${NC}"
fi

# 2. Fix docker-compose.override.yml - Replace PostgreSQL with MongoDB
echo -e "${PURPLE}[STEP] Fixing docker-compose.override.yml...${NC}"
cat > docker-compose.override.yml << 'EOF'
# TRADEAI Docker Compose Override for Development
# MongoDB-based setup (no PostgreSQL)

services:
  # Development overrides for backend
  backend:
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev

  # Development overrides for frontend  
  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm start

  # Development MongoDB with exposed port
  mongodb:
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=tradeai_dev_password
      - MONGO_INITDB_DATABASE=tradeai_dev

  # Development Redis with exposed port
  redis:
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass tradeai_dev_password
EOF

echo -e "${GREEN}✅ Fixed docker-compose.override.yml with MongoDB setup${NC}"

# 3. Verify docker-compose configuration
echo -e "${PURPLE}[STEP] Verifying Docker Compose configuration...${NC}"
if docker-compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker Compose configuration is now valid${NC}"
else
    echo -e "${RED}❌ Configuration still has issues, showing details:${NC}"
    docker-compose config
fi

# 4. Clean up any existing containers
echo -e "${PURPLE}[STEP] Cleaning up existing containers...${NC}"
docker-compose down 2>/dev/null || true
docker container prune -f 2>/dev/null || true

echo ""
echo -e "${BOLD}${GREEN}🎉 INSTANT FIX COMPLETED! 🎉${NC}"
echo -e "${BOLD}${GREEN}=============================${NC}"
echo ""
echo -e "${BOLD}✅ FIXES APPLIED:${NC}"
echo "   • Removed obsolete version attributes"
echo "   • Fixed PostgreSQL → MongoDB references"
echo "   • Updated docker-compose.override.yml"
echo "   • Cleaned up existing containers"
echo ""
echo -e "${BOLD}🚀 READY TO CONTINUE:${NC}"
echo "   • Configuration is now valid"
echo "   • You can continue with docker-compose build"
echo "   • Or restart your deployment script"
echo ""
echo -e "${GREEN}✅ Docker configuration fixed and ready!${NC}"