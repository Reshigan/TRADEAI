#!/bin/bash

# Trade AI Platform - Deployment Bulletproof Assessment
# Comprehensive production readiness validation

set -euo pipefail

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
REPORT_FILE="/tmp/deployment-bulletproof-${TIMESTAMP}.md"

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
    echo "✅ **PASS**: $1" >> "$REPORT_FILE"
}

check_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    if [ $# -gt 1 ]; then
        echo -e "${RED}   └─ $2${NC}"
        echo "❌ **FAIL**: $1 - $2" >> "$REPORT_FILE"
    else
        echo "❌ **FAIL**: $1" >> "$REPORT_FILE"
    fi
    ((FAILED_CHECKS++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN: $1${NC}"
    if [ $# -gt 1 ]; then
        echo -e "${YELLOW}   └─ $2${NC}"
        echo "⚠️ **WARN**: $1 - $2" >> "$REPORT_FILE"
    else
        echo "⚠️ **WARN**: $1" >> "$REPORT_FILE"
    fi
    ((WARNING_CHECKS++))
}

check_critical() {
    echo -e "${RED}🚨 CRITICAL: $1${NC}"
    if [ $# -gt 1 ]; then
        echo -e "${RED}   └─ $2${NC}"
        echo "🚨 **CRITICAL**: $1 - $2" >> "$REPORT_FILE"
    else
        echo "🚨 **CRITICAL**: $1" >> "$REPORT_FILE"
    fi
    ((CRITICAL_ISSUES++))
    ((FAILED_CHECKS++))
}

info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
    echo "ℹ️ **INFO**: $1" >> "$REPORT_FILE"
}

# Initialize report
cat > "$REPORT_FILE" << EOF
# 🛡️ Trade AI Platform - Deployment Bulletproof Assessment

**Assessment Date**: $(date)  
**Domain**: tradeai.gonxt.tech  
**Target Environment**: AWS Ubuntu t4g.large  

---

## 📊 Assessment Results

EOF

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

# Check for SSL configuration
if [ -f "$PROJECT_ROOT/ssl-setup.sh" ] || [ -f "$PROJECT_ROOT/scripts/ssl-setup.sh" ]; then
    check_pass "SSL setup script available"
else
    check_warn "SSL setup script not found"
fi
((TOTAL_CHECKS++))

# 2. Dependencies & Security Assessment
section "Dependencies & Security"

# Check for security vulnerabilities
cd "$PROJECT_ROOT/backend"
if npm audit --audit-level=high --json > /tmp/audit.json 2>/dev/null; then
    HIGH_VULNS=$(cat /tmp/audit.json | jq -r '.metadata.vulnerabilities.high // 0')
    CRITICAL_VULNS=$(cat /tmp/audit.json | jq -r '.metadata.vulnerabilities.critical // 0')
    
    if [ "$CRITICAL_VULNS" -gt 0 ]; then
        check_critical "Found $CRITICAL_VULNS critical security vulnerabilities"
    elif [ "$HIGH_VULNS" -gt 0 ]; then
        check_fail "Found $HIGH_VULNS high security vulnerabilities"
    else
        check_pass "No critical or high security vulnerabilities"
    fi
else
    check_warn "Could not run security audit"
fi
((TOTAL_CHECKS++))

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
    REQUIRED_VARS=("NODE_ENV" "PORT" "JWT_SECRET" "DATABASE_URL")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" "$ENV_FILE"; then
            check_pass "Required environment variable: $var"
        else
            check_fail "Missing required environment variable: $var"
        fi
        ((TOTAL_CHECKS++))
    done
    
    # Check for sensitive data exposure
    if grep -q "password.*=" "$ENV_FILE" | grep -v "PASSWORD_HASH"; then
        check_warn "Potential password exposure in environment file"
    else
        check_pass "No obvious password exposure"
    fi
    ((TOTAL_CHECKS++))
    
    # Check AI configuration
    if grep -q "AI_PROVIDER=local" "$ENV_FILE"; then
        check_pass "AI provider set to local-only"
    else
        check_fail "AI provider not configured for local processing"
    fi
    ((TOTAL_CHECKS++))
    
else
    check_critical "Production environment file not found"
    ((TOTAL_CHECKS += 6))
fi

# 4. Database & Storage Assessment
section "Database & Storage"

# Check for database configuration
if [ -f "$PROJECT_ROOT/backend/src/config/database.js" ] || [ -f "$PROJECT_ROOT/backend/config/database.js" ]; then
    check_pass "Database configuration file exists"
else
    check_fail "Database configuration file not found"
fi
((TOTAL_CHECKS++))

# Check for migration files
if [ -d "$PROJECT_ROOT/backend/migrations" ] || [ -d "$PROJECT_ROOT/migrations" ]; then
    MIGRATION_COUNT=$(find "$PROJECT_ROOT" -name "*migration*" -type f | wc -l)
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        check_pass "Database migrations available ($MIGRATION_COUNT files)"
    else
        check_warn "No database migration files found"
    fi
else
    check_warn "No migrations directory found"
fi
((TOTAL_CHECKS++))

# 5. API & Backend Assessment
section "API & Backend"

# Check if backend is running
if curl -s "http://localhost:5002/health" > /dev/null 2>&1; then
    check_pass "Backend health endpoint responding"
    
    # Test API endpoints
    if curl -s "http://localhost:5002/api/health" | grep -q "ok"; then
        check_pass "API health endpoint functional"
    else
        check_fail "API health endpoint not responding correctly"
    fi
    ((TOTAL_CHECKS++))
    
    # Test authentication endpoints
    if curl -s -X POST "http://localhost:5002/api/auth/login" -H "Content-Type: application/json" -d '{}' | grep -q "error\|message"; then
        check_pass "Authentication endpoint responding"
    else
        check_fail "Authentication endpoint not responding"
    fi
    ((TOTAL_CHECKS++))
    
else
    check_critical "Backend server not running or not accessible"
    ((TOTAL_CHECKS += 2))
fi
((TOTAL_CHECKS++))

# 6. Frontend Assessment
section "Frontend"

# Check if frontend build exists
if [ -d "$PROJECT_ROOT/frontend/build" ] || [ -d "$PROJECT_ROOT/frontend/dist" ]; then
    check_pass "Frontend build directory exists"
else
    check_warn "Frontend build directory not found - may need to build"
fi
((TOTAL_CHECKS++))

# Check frontend configuration
if [ -f "$PROJECT_ROOT/frontend/src/config.js" ] || [ -f "$PROJECT_ROOT/frontend/src/config/index.js" ]; then
    check_pass "Frontend configuration file exists"
else
    check_warn "Frontend configuration file not found"
fi
((TOTAL_CHECKS++))

# 7. SSL & Security Assessment
section "SSL & Security"

# Check for SSL certificate files
if [ -f "$PROJECT_ROOT/ssl/cert.pem" ] || [ -f "$PROJECT_ROOT/certs/cert.pem" ]; then
    check_pass "SSL certificate files found"
else
    check_warn "SSL certificate files not found - will need Let's Encrypt setup"
fi
((TOTAL_CHECKS++))

# Check for security headers configuration
if grep -r "helmet\|security.*headers" "$PROJECT_ROOT/backend" > /dev/null 2>&1; then
    check_pass "Security headers middleware configured"
else
    check_warn "Security headers middleware not found"
fi
((TOTAL_CHECKS++))

# Check for CORS configuration
if grep -r "cors" "$PROJECT_ROOT/backend" > /dev/null 2>&1; then
    check_pass "CORS configuration found"
else
    check_fail "CORS configuration not found"
fi
((TOTAL_CHECKS++))

# 8. Local AI/ML Assessment
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

# 9. Performance & Scalability Assessment
section "Performance & Scalability"

# Check for PM2 configuration
if [ -f "$PROJECT_ROOT/ecosystem.config.js" ] || [ -f "$PROJECT_ROOT/pm2.config.js" ]; then
    check_pass "PM2 process manager configuration found"
else
    check_warn "PM2 configuration not found - single process deployment"
fi
((TOTAL_CHECKS++))

# Check for caching configuration
if grep -r "redis\|cache" "$PROJECT_ROOT/backend" > /dev/null 2>&1; then
    check_pass "Caching configuration found"
else
    check_warn "No caching configuration found"
fi
((TOTAL_CHECKS++))

# 10. Monitoring & Logging Assessment
section "Monitoring & Logging"

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

# 11. Deployment Scripts Assessment
section "Deployment Scripts"

# Check for deployment scripts
DEPLOY_SCRIPTS=("deploy.sh" "start.sh" "setup.sh" "install.sh")
FOUND_SCRIPTS=0
for script in "${DEPLOY_SCRIPTS[@]}"; do
    if [ -f "$PROJECT_ROOT/$script" ] || [ -f "$PROJECT_ROOT/scripts/$script" ]; then
        ((FOUND_SCRIPTS++))
    fi
done

if [ "$FOUND_SCRIPTS" -gt 0 ]; then
    check_pass "Deployment scripts available ($FOUND_SCRIPTS found)"
else
    check_warn "No deployment scripts found"
fi
((TOTAL_CHECKS++))

# 12. AWS t4g.large Compatibility Assessment
section "AWS t4g.large Compatibility"

# Check for ARM64 compatibility
if grep -r "arm64\|aarch64" "$PROJECT_ROOT" > /dev/null 2>&1; then
    check_pass "ARM64 architecture considerations found"
else
    check_warn "No ARM64 specific configurations found"
fi
((TOTAL_CHECKS++))

# Check memory requirements
if [ -f "$PROJECT_ROOT/backend/package.json" ]; then
    if grep -q "node.*--max-old-space-size" "$PROJECT_ROOT/backend/package.json"; then
        check_pass "Memory optimization configured"
    else
        check_warn "No memory optimization flags found"
    fi
else
    check_warn "Cannot check memory configuration"
fi
((TOTAL_CHECKS++))

# Generate final report
header "📊 BULLETPROOF ASSESSMENT SUMMARY"

cat >> "$REPORT_FILE" << EOF

---

## 📊 Final Assessment Summary

**Total Checks**: $TOTAL_CHECKS  
**Passed**: $PASSED_CHECKS  
**Failed**: $FAILED_CHECKS  
**Warnings**: $WARNING_CHECKS  
**Critical Issues**: $CRITICAL_ISSUES  

### 🎯 Deployment Readiness Score
EOF

# Calculate score
SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
echo "**Score**: $SCORE/100" >> "$REPORT_FILE"

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
echo "**Status**: $READINESS" >> "$REPORT_FILE"

# Summary statistics
echo -e "\n${BLUE}📊 Assessment Statistics:${NC}"
echo -e "   Total Checks: $TOTAL_CHECKS"
echo -e "   ${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "   ${RED}Failed: $FAILED_CHECKS${NC}"
echo -e "   ${YELLOW}Warnings: $WARNING_CHECKS${NC}"
echo -e "   ${RED}Critical: $CRITICAL_ISSUES${NC}"
echo -e "   ${PURPLE}Score: $SCORE/100${NC}"

# Recommendations
cat >> "$REPORT_FILE" << EOF

### 🔧 Recommendations

EOF

if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    echo "🚨 **CRITICAL**: Address all critical issues before deployment" >> "$REPORT_FILE"
fi

if [ "$FAILED_CHECKS" -gt 0 ]; then
    echo "❌ **HIGH PRIORITY**: Fix failed checks to improve reliability" >> "$REPORT_FILE"
fi

if [ "$WARNING_CHECKS" -gt 0 ]; then
    echo "⚠️ **MEDIUM PRIORITY**: Address warnings for optimal performance" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

### 🚀 Next Steps

1. **Address Critical Issues**: Fix any critical failures immediately
2. **Resolve Failed Checks**: Address failed checks systematically  
3. **Optimize Warnings**: Improve warnings for better performance
4. **Final Testing**: Run comprehensive UAT after fixes
5. **Deploy**: Proceed with deployment when score ≥ 85

---

*Assessment completed at $(date)*  
*Report saved to: $REPORT_FILE*
EOF

echo -e "\n${CYAN}📄 Full report saved to: $REPORT_FILE${NC}"

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