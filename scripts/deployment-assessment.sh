#!/bin/bash

# Trade AI Platform - Deployment Assessment (Robust Version)
# Comprehensive production readiness validation

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0
CRITICAL_ISSUES=0

# Functions
header() {
    echo -e "\n${PURPLE}============================================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}============================================================${NC}\n"
}

section() {
    echo -e "\n${CYAN}🔍 $1${NC}"
    echo -e "${CYAN}------------------------------------------------------------${NC}"
}

check_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    ((PASSED_CHECKS++))
}

check_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    if [ $# -gt 1 ]; then
        echo -e "${RED}   └─ $2${NC}"
    fi
    ((FAILED_CHECKS++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN: $1${NC}"
    if [ $# -gt 1 ]; then
        echo -e "${YELLOW}   └─ $2${NC}"
    fi
    ((WARNING_CHECKS++))
}

check_critical() {
    echo -e "${RED}🚨 CRITICAL: $1${NC}"
    if [ $# -gt 1 ]; then
        echo -e "${RED}   └─ $2${NC}"
    fi
    ((CRITICAL_ISSUES++))
    ((FAILED_CHECKS++))
}

info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
}

# Start assessment
header "🛡️ TRADE AI DEPLOYMENT BULLETPROOF ASSESSMENT"
info "Starting comprehensive production readiness validation"
info "Target: tradeai.gonxt.tech on AWS Ubuntu t4g.large"

# 1. Code Quality & Structure Assessment
section "Code Quality & Structure"
((TOTAL_CHECKS++))

# Check for critical files
if [ -f "$PROJECT_ROOT/package.json" ] && [ -f "$PROJECT_ROOT/backend/package.json" ] && [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
    check_pass "Project structure is complete"
else
    check_fail "Missing critical package.json files"
fi
((TOTAL_CHECKS++))

# Check for environment files
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    check_pass "Production environment file exists"
else
    check_critical "Missing .env.production file"
fi
((TOTAL_CHECKS++))

# 2. Dependencies & Security Assessment
section "Dependencies & Security"

# Check Node.js version compatibility
NODE_VERSION=$(node --version | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
if [ "$MAJOR_VERSION" -ge 18 ]; then
    check_pass "Node.js version $NODE_VERSION is compatible"
else
    check_fail "Node.js version $NODE_VERSION may be incompatible (requires 18+)"
fi
((TOTAL_CHECKS++))

# 3. Environment Configuration Assessment
section "Environment Configuration"

# Check production environment variables
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    ENV_FILE="$PROJECT_ROOT/.env.production"
    
    # Check for required variables
    REQUIRED_VARS=("NODE_ENV" "PORT" "JWT_SECRET")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
            check_pass "Required environment variable: $var"
        else
            check_fail "Missing required environment variable: $var"
        fi
        ((TOTAL_CHECKS++))
    done
    
    # Check AI configuration
    if grep -q "AI_PROVIDER=local" "$ENV_FILE" 2>/dev/null; then
        check_pass "AI provider set to local-only"
    else
        check_fail "AI provider not configured for local processing"
    fi
    ((TOTAL_CHECKS++))
    
else
    check_critical "Production environment file not found"
    ((TOTAL_CHECKS += 4))
fi

# 4. API & Backend Assessment
section "API & Backend"

# Check if backend is running
if curl -s "http://localhost:5002/health" > /dev/null 2>&1; then
    check_pass "Backend health endpoint responding"
    
    # Test API endpoints
    if curl -s "http://localhost:5002/api/health" 2>/dev/null | grep -q "ok"; then
        check_pass "API health endpoint functional"
    else
        check_fail "API health endpoint not responding correctly"
    fi
    ((TOTAL_CHECKS++))
    
else
    check_critical "Backend server not running or not accessible"
    ((TOTAL_CHECKS++))
fi
((TOTAL_CHECKS++))

# 5. Local AI/ML Assessment
section "Local AI/ML Configuration"

# Run AI validation
if [ -f "$PROJECT_ROOT/scripts/validate-local-ai.js" ]; then
    if cd "$PROJECT_ROOT" && node scripts/validate-local-ai.js > /dev/null 2>&1; then
        check_pass "Local AI/ML validation passed"
    else
        check_fail "Local AI/ML validation failed"
    fi
else
    check_fail "Local AI/ML validation script not found"
fi
((TOTAL_CHECKS++))

# Check TensorFlow.js installation
cd "$PROJECT_ROOT/backend"
if npm list @tensorflow/tfjs-node > /dev/null 2>&1; then
    check_pass "TensorFlow.js Node backend installed"
else
    check_fail "TensorFlow.js Node backend not installed"
fi
((TOTAL_CHECKS++))

# 6. Security Assessment
section "Security Configuration"

# Check for CORS configuration
if grep -r "cors" "$PROJECT_ROOT/backend" > /dev/null 2>&1; then
    check_pass "CORS configuration found"
else
    check_fail "CORS configuration not found"
fi
((TOTAL_CHECKS++))

# Check for security headers
if grep -r "helmet\|security.*headers" "$PROJECT_ROOT/backend" > /dev/null 2>&1; then
    check_pass "Security headers middleware configured"
else
    check_warn "Security headers middleware not found"
fi
((TOTAL_CHECKS++))

# 7. Performance Assessment
section "Performance & Monitoring"

# Check for logging configuration
if grep -r "winston\|morgan\|logger" "$PROJECT_ROOT/backend" > /dev/null 2>&1; then
    check_pass "Logging framework configured"
else
    check_warn "No logging framework found"
fi
((TOTAL_CHECKS++))

# Check for error handling
if grep -r "try.*catch\|error.*handler" "$PROJECT_ROOT/backend" > /dev/null 2>&1; then
    check_pass "Error handling implemented"
else
    check_fail "Insufficient error handling"
fi
((TOTAL_CHECKS++))

# Generate final assessment
header "📊 BULLETPROOF ASSESSMENT SUMMARY"

# Calculate score
SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))

# Determine deployment readiness
if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    READINESS="🚨 NOT READY - CRITICAL ISSUES"
    READINESS_COLOR="$RED"
elif [ "$FAILED_CHECKS" -gt 5 ]; then
    READINESS="❌ NOT READY - TOO MANY FAILURES"
    READINESS_COLOR="$RED"
elif [ "$SCORE" -ge 85 ]; then
    READINESS="✅ BULLETPROOF - READY FOR PRODUCTION"
    READINESS_COLOR="$GREEN"
elif [ "$SCORE" -ge 70 ]; then
    READINESS="⚠️ MOSTLY READY - MINOR ISSUES"
    READINESS_COLOR="$YELLOW"
else
    READINESS="❌ NOT READY - SIGNIFICANT ISSUES"
    READINESS_COLOR="$RED"
fi

echo -e "\n${READINESS_COLOR}${READINESS}${NC}"

# Summary statistics
echo -e "\n${BLUE}📊 Assessment Statistics:${NC}"
echo -e "   Total Checks: $TOTAL_CHECKS"
echo -e "   ${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "   ${RED}Failed: $FAILED_CHECKS${NC}"
echo -e "   ${YELLOW}Warnings: $WARNING_CHECKS${NC}"
echo -e "   ${RED}Critical: $CRITICAL_ISSUES${NC}"
echo -e "   ${PURPLE}Score: $SCORE/100${NC}"

# Detailed recommendations
echo -e "\n${CYAN}🔧 Recommendations:${NC}"

if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    echo -e "   ${RED}🚨 CRITICAL: Address all critical issues before deployment${NC}"
fi

if [ "$FAILED_CHECKS" -gt 0 ]; then
    echo -e "   ${RED}❌ HIGH PRIORITY: Fix failed checks to improve reliability${NC}"
fi

if [ "$WARNING_CHECKS" -gt 0 ]; then
    echo -e "   ${YELLOW}⚠️ MEDIUM PRIORITY: Address warnings for optimal performance${NC}"
fi

echo -e "\n${CYAN}🚀 Next Steps:${NC}"
echo -e "   1. Address Critical Issues: Fix any critical failures immediately"
echo -e "   2. Resolve Failed Checks: Address failed checks systematically"
echo -e "   3. Optimize Warnings: Improve warnings for better performance"
echo -e "   4. Final Testing: Run comprehensive UAT after fixes"
echo -e "   5. Deploy: Proceed with deployment when score ≥ 85"

# Exit with appropriate code
if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    exit 2
elif [ "$FAILED_CHECKS" -gt 5 ]; then
    exit 1
elif [ "$SCORE" -lt 70 ]; then
    exit 1
else
    exit 0
fi