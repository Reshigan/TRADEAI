#!/bin/bash

# TRADEAI Complete Production Deployment Script
# Deploys both Backend (Workers) and Frontend (Pages) to Cloudflare

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         TRADEAI Complete Production Deployment          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

PROJECT_ROOT="/workspace/project/TRADEAI"
BACKEND_DIR="$PROJECT_ROOT/workers-backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Check Cloudflare authentication
echo -e "${BLUE}Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}Not authenticated with Cloudflare. Please login:${NC}"
    wrangler login
fi

CLOUDFLARE_USER=$(wrangler whoami 2>/dev/null | grep "Logged in as" | cut -d'(' -f2 | cut -d')' -f1)
echo -e "${GREEN}✅ Logged in as: $CLOUDFLARE_USER${NC}"
echo ""

# =====================
# DEPLOY BACKEND
# =====================
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Step 1: Deploying Backend (Cloudflare Workers)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

cd "$BACKEND_DIR"

echo -e "${BLUE}Installing backend dependencies...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

echo -e "${BLUE}Deploying to Cloudflare Workers...${NC}"
npm run deploy

echo ""
echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
echo -e "${GREEN}   API URL: https://tradeai-api.reshigan-085.workers.dev/api${NC}"
echo ""

# Verify backend deployment
echo -e "${BLUE}Verifying backend deployment...${NC}"
sleep 5
BACKEND_HEALTH=$(curl -s --connect-timeout 10 https://tradeai-api.reshigan-085.workers.dev/api/health 2>/dev/null || echo '{"status":"error"}')
echo -e "${GREEN}   Health: $BACKEND_HEALTH${NC}"
echo ""

# =====================
# DEPLOY FRONTEND
# =====================
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Step 2: Deploying Frontend (Cloudflare Pages)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

cd "$FRONTEND_DIR"

echo -e "${BLUE}Installing frontend dependencies...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

echo -e "${BLUE}Building frontend for production...${NC}"
echo -e "${YELLOW}This may take 3-5 minutes...${NC}"

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
echo -e "${GREEN}✅ Build completed (${BUILD_SIZE})${NC}"

# Show new bundle info
if [ -f "$BUILD_DIR/static/js/main.*.js" ]; then
    NEW_BUNDLE=$(ls "$BUILD_DIR"/static/js/main.*.js | head -1 | xargs basename)
    echo -e "${GREEN}   New bundle: $NEW_BUNDLE${NC}"
fi

echo ""
echo -e "${BLUE}Deploying to Cloudflare Pages...${NC}"
wrangler pages deploy "$BUILD_DIR" --project-name=tradeai

echo ""
echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo -e "${GREEN}   URL: https://tradeai.vantax.co.za${NC}"
echo ""

# Verify frontend deployment
echo -e "${BLUE}Verifying frontend deployment...${NC}"
sleep 5
FRONTEND_HEALTH=$(curl -s --connect-timeout 10 https://tradeai.vantax.co.za/health.json 2>/dev/null || echo '{"status":"error"}')
echo -e "${GREEN}   Health: $FRONTEND_HEALTH${NC}"
echo ""

# =====================
# DEPLOYMENT SUMMARY
# =====================
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}              DEPLOYMENT COMPLETE!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Backend (Workers):${NC} https://tradeai-api.reshigan-085.workers.dev/api"
echo -e "${GREEN}✅ Frontend (Pages):${NC} https://tradeai.vantax.co.za"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Clear browser cache to see new UI:${NC}"
echo -e "${YELLOW}   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)${NC}"
echo -e "${YELLOW}   - Or clear browser cache completely${NC}"
echo -e "${YELLOW}   - Or open in incognito/private mode${NC}"
echo ""
echo -e "${CYAN}New Features Now Available:${NC}"
echo -e "  🤖 AI Assistant & Copilot"
echo -e "  📊 Enhanced Analytics Dashboard"
echo -e "  💼 Advanced Budget & Promotion Management"
echo -e "  ⚙️ Enterprise Admin Features"
echo -e "  🔧 Workflow Automation"
echo ""
echo -e "${GREEN}Deployment completed at: $(date +"%Y-%m-%d %H:%M:%S UTC")${NC}"
echo ""

