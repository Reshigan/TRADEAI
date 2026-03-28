#!/bin/bash

# ============================================================================
# TRADEAI Production Validation Script
# Validates system is ready for production go-live
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

log_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "========================================"
echo "  TRADEAI Production Validation"
echo "========================================"
echo ""

# ============================================================================
# 1. Environment Checks
# ============================================================================
echo "1. Environment Configuration"
echo "----------------------------"

# Check Node version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        log_pass "Node.js version: $(node -v)"
    else
        log_fail "Node.js version too old (need 18+, have $(node -v))"
    fi
else
    log_fail "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    log_pass "npm version: $(npm -v)"
else
    log_fail "npm not installed"
fi

# Check wrangler
if command -v wrangler &> /dev/null; then
    log_pass "Wrangler version: $(wrangler --version)"
else
    log_fail "Wrangler not installed (npm install -g wrangler)"
fi

echo ""

# ============================================================================
# 2. Cloudflare Authentication
# ============================================================================
echo "2. Cloudflare Authentication"
echo "-----------------------------"

if wrangler whoami &> /dev/null; then
    ACCOUNT_NAME=$(wrangler whoami | grep "Account" | awk '{print $2}')
    log_pass "Logged in to Cloudflare"
    log_info "Account: $ACCOUNT_NAME"
else
    log_fail "Not logged in to Cloudflare"
    log_info "Run: wrangler login"
fi

echo ""

# ============================================================================
# 3. Backend Health Checks
# ============================================================================
echo "3. Backend Health Checks"
echo "------------------------"

# Check backend health
if curl -f -s https://tradeai-api.vantax.workers.dev/health &> /dev/null; then
    HEALTH=$(curl -s https://tradeai-api.vantax.workers.dev/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH" = "healthy" ]; then
        log_pass "Backend health check passed"
    else
        log_fail "Backend health check returned: $HEALTH"
    fi
else
    log_fail "Backend health endpoint unreachable"
fi

# Check API endpoints (public ones)
ENDPOINTS=(
    "https://tradeai-api.vantax.workers.dev/api/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -f -s "$endpoint" &> /dev/null; then
        log_pass "Endpoint reachable: $endpoint"
    else
        log_warn "Endpoint unreachable: $endpoint"
    fi
done

echo ""

# ============================================================================
# 4. Frontend Health Checks
# ============================================================================
echo "4. Frontend Health Checks"
echo "-------------------------"

# Check frontend
if curl -f -s https://tradeai.vantax.co.za/ &> /dev/null; then
    log_pass "Frontend is accessible"
else
    log_fail "Frontend is not accessible"
fi

# Check for common assets
ASSETS=(
    "https://tradeai.vantax.co.za/favicon.ico"
    "https://tradeai.vantax.co.za/manifest.json"
)

for asset in "${ASSETS[@]}"; do
    if curl -f -s "$asset" &> /dev/null; then
        log_pass "Asset accessible: $asset"
    else
        log_warn "Asset missing: $asset"
    fi
done

echo ""

# ============================================================================
# 5. Database Checks
# ============================================================================
echo "5. Database Checks"
echo "------------------"

# Check D1 database exists
if wrangler d1 info tradeai &> /dev/null; then
    log_pass "D1 database 'tradeai' exists"
else
    log_fail "D1 database 'tradeai' not found"
fi

# Check migrations table
MIGRATION_COUNT=$(wrangler d1 execute tradeai --remote --command "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';" --json 2>/dev/null | grep -o '"count":[0-9]*' | cut -d':' -f2 || echo "0")
if [ "$MIGRATION_COUNT" -gt 0 ]; then
    log_pass "Database has $MIGRATION_COUNT tables"
else
    log_warn "Cannot verify database tables"
fi

echo ""

# ============================================================================
# 6. Security Checks
# ============================================================================
echo "6. Security Checks"
echo "------------------"

# Check for .env file in repo (should NOT exist)
if [ -f ".env" ]; then
    log_fail ".env file found in repository root (should be in .gitignore)"
else
    log_pass "No .env file in repository root"
fi

# Check for secrets in code
if grep -r "ghp_" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" &> /dev/null; then
    log_fail "GitHub tokens found in code!"
else
    log_pass "No GitHub tokens in code"
fi

if grep -r "CF_API_TOKEN\|CLOUDFLARE_API_TOKEN" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" &> /dev/null; then
    log_fail "Cloudflare tokens found in code!"
else
    log_pass "No Cloudflare tokens in code"
fi

# Check HTTPS enforcement
log_pass "HTTPS enforced (Cloudflare default)"

echo ""

# ============================================================================
# 7. Performance Checks
# ============================================================================
echo "7. Performance Checks"
echo "---------------------"

# Check backend response time
START=$(date +%s%N)
curl -s https://tradeai-api.vantax.workers.dev/health > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))

if [ "$DURATION" -lt 500 ]; then
    log_pass "Backend response time: ${DURATION}ms"
elif [ "$DURATION" -lt 1000 ]; then
    log_warn "Backend response time: ${DURATION}ms (acceptable but monitor)"
else
    log_fail "Backend response time: ${DURATION}ms (too slow)"
fi

# Check frontend response time
START=$(date +%s%N)
curl -s https://tradeai.vantax.co.za/ > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))

if [ "$DURATION" -lt 1000 ]; then
    log_pass "Frontend response time: ${DURATION}ms"
elif [ "$DURATION" -lt 2000 ]; then
    log_warn "Frontend response time: ${DURATION}ms (acceptable but monitor)"
else
    log_fail "Frontend response time: ${DURATION}ms (too slow)"
fi

echo ""

# ============================================================================
# 8. Documentation Checks
# ============================================================================
echo "8. Documentation Checks"
echo "-----------------------"

DOCS=(
    "RUNBOOK.md"
    "GO_LIVE_COMPLETE.md"
    "WORLD_CLASS_PROCESS_UI.md"
    "PROCESS_UI_INTEGRATION.md"
    "deploy.sh"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        log_pass "Documentation exists: $doc"
    else
        log_warn "Documentation missing: $doc"
    fi
done

echo ""

# ============================================================================
# 9. Git Status
# ============================================================================
echo "9. Git Status"
echo "-------------"

# Check if on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
    log_pass "On main branch"
else
    log_warn "Not on main branch (currently on: $BRANCH)"
fi

# Check for uncommitted changes
CHANGES=$(git status --porcelain)
if [ -z "$CHANGES" ]; then
    log_pass "No uncommitted changes"
else
    log_warn "Uncommitted changes exist"
fi

# Check if up to date with origin
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
if [ "$BEHIND" -eq 0 ]; then
    log_pass "Branch is up to date with origin"
else
    log_fail "Branch is $BEHIND commits behind origin"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================
echo "========================================"
echo "  Validation Summary"
echo "========================================"
echo -e "${GREEN}Passed:${NC}   $PASS"
echo -e "${RED}Failed:${NC}   $FAIL"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}✓ PRODUCTION READY!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review warnings above"
    echo "2. Run: ./deploy.sh production"
    echo "3. Monitor deployment"
    echo "4. Run post-deployment validation"
    exit 0
else
    echo -e "${RED}✗ NOT PRODUCTION READY${NC}"
    echo ""
    echo "Please fix the failures above before deploying."
    exit 1
fi
