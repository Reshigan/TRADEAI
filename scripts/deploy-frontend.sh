#!/bin/bash

# TRADEAI Frontend Deployment Script
# This script builds and deploys the frontend to Cloudflare Pages

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        TRADEAI Frontend Deployment to Cloudflare        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

cd "$FRONTEND_DIR"

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  wrangler not found. Installing...${NC}"
    npm install -g wrangler
fi

WRANGLER_VERSION=$(wrangler --version)
echo -e "${GREEN}✅ $WRANGLER_VERSION${NC}"

# Step 2: Install dependencies
echo -e "\n${BLUE}Step 2: Installing dependencies...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Build the frontend
echo -e "\n${BLUE}Step 3: Building frontend...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"

# Set environment variables for production build
export CI=true
export GENERATE_SOURCEMAP=false
export REACT_APP_API_URL="${REACT_APP_API_URL:-https://tradeai-api.reshigan-085.workers.dev/api}"
export REACT_APP_API_BASE_URL="${REACT_APP_API_BASE_URL:-https://tradeai-api.reshigan-085.workers.dev/api}"
export REACT_APP_ML_API_URL="${REACT_APP_ML_API_URL:-https://tradeai-api.reshigan-085.workers.dev/api/ml}"

npm run build

BUILD_DIR="$FRONTEND_DIR/build"

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Build failed - build directory not found${NC}"
    exit 1
fi

BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
echo -e "${GREEN}✅ Build completed successfully (${BUILD_SIZE})${NC}"

# Show build info
if [ -f "$BUILD_DIR/static/js/main.*.js" ]; then
    MAIN_BUNDLE=$(ls "$BUILD_DIR"/static/js/main.*.js | head -1 | xargs basename)
    echo -e "${GREEN}   Main bundle: $MAIN_BUNDLE${NC}"
fi

# Extract build ID if available
if grep -q "__BUILD_ID__" "$BUILD_DIR"/static/js/main.*.js 2>/dev/null; then
    BUILD_ID=$(grep -o '__BUILD_ID__="[^\"]*"' "$BUILD_DIR"/static/js/main.*.js | head -1 | cut -d'"' -f2)
    if [ -n "$BUILD_ID" ]; then
        echo -e "${GREEN}   Build ID: $BUILD_ID${NC}"
    fi
fi

# Step 4: Deploy to Cloudflare Pages
echo -e "\n${BLUE}Step 4: Deploying to Cloudflare Pages...${NC}"

if [ -z "${CLOUDFLARE_API_KEY:-}" ] || [ -z "${CLOUDFLARE_EMAIL:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
    echo -e "${YELLOW}⚠️  Cloudflare credentials not set in environment${NC}"
    echo -e "${YELLOW}   Please set the following environment variables:${NC}"
    echo -e "${YELLOW}   - CLOUDFLARE_API_KEY${NC}"
    echo -e "${YELLOW}   - CLOUDFLARE_EMAIL${NC}"
    echo -e "${YELLOW}   - CLOUDFLARE_ACCOUNT_ID${NC}"
    echo ""
    echo -e "${YELLOW}   Or run: wrangler login${NC}"
    echo ""
    read -p "Do you want to continue with wrangler login? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        wrangler login
    else
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}Deploying to project: tradeai${NC}"
wrangler pages deploy "$BUILD_DIR" --project-name=tradeai

# Step 5: Verify deployment
echo -e "\n${BLUE}Step 5: Verifying deployment...${NC}"
sleep 5

echo -e "${YELLOW}Testing frontend health...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://tradeai.vantax.co.za/health.json 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}   Frontend URL: https://tradeai.vantax.co.za${NC}"
    echo -e "${GREEN}   Health check: HTTP $HTTP_CODE${NC}"
else
    echo -e "${YELLOW}⚠️  Deployment completed but health check returned HTTP $HTTP_CODE${NC}"
    echo -e "${YELLOW}   Please verify manually at: https://tradeai.vantax.co.za${NC}"
fi

# Clear browser cache notice
echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Clear your browser cache or do a hard refresh${NC}"
echo -e "${YELLOW}   (Ctrl+Shift+R or Cmd+Shift+R) to see the new UI${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${GREEN}✅ Frontend deployment complete!${NC}"
