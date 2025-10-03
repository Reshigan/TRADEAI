#!/bin/bash

# TRADEAI Security Audit Script
# Performs comprehensive security checks on the codebase

set -e

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                                                                    ║"
echo "║                    TRADEAI Security Audit                          ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

echo "📋 Running security audit..."
echo ""

# 1. Check for sensitive files
echo "1️⃣  Checking for sensitive files..."
SENSITIVE_FILES=(
  ".env"
  ".env.production"
  ".env.local"
  "*.pem"
  "*.key"
  "*.p12"
  "*.pfx"
  "id_rsa"
  "id_dsa"
)

for pattern in "${SENSITIVE_FILES[@]}"; do
  if find . -name "$pattern" -not -path "./node_modules/*" -not -path "./archive/*" | grep -q .; then
    echo -e "${RED}   ❌ Found sensitive files matching: $pattern${NC}"
    find . -name "$pattern" -not -path "./node_modules/*" -not -path "./archive/*"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
done

if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}   ✅ No sensitive files found in repository${NC}"
fi
echo ""

# 2. Check for hardcoded credentials
echo "2️⃣  Checking for hardcoded credentials..."
CREDENTIAL_PATTERNS=(
  "password\s*=\s*['\"][^'\"]{3,}"
  "api[_-]?key\s*=\s*['\"][^'\"]{10,}"
  "secret\s*=\s*['\"][^'\"]{10,}"
  "token\s*=\s*['\"][^'\"]{20,}"
  "mongodb:\/\/[^:]+:[^@]{6,}@"
  "redis:\/\/[^:]+:[^@]{6,}@"
)

for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
  results=$(grep -rI -E "$pattern" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=archive --exclude="*.md" --exclude="security-audit.sh" . 2>/dev/null || true)
  if [ ! -z "$results" ]; then
    echo -e "${RED}   ❌ Potential hardcoded credentials found:${NC}"
    echo "$results" | head -5
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
done

if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}   ✅ No obvious hardcoded credentials found${NC}"
fi
echo ""

# 3. Check .gitignore
echo "3️⃣  Checking .gitignore configuration..."
REQUIRED_GITIGNORE=(
  ".env"
  ".env.production"
  "*.pem"
  "*.key"
  "node_modules"
)

if [ ! -f ".gitignore" ]; then
  echo -e "${RED}   ❌ .gitignore file not found!${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  for item in "${REQUIRED_GITIGNORE[@]}"; do
    if ! grep -q "$item" .gitignore; then
      echo -e "${YELLOW}   ⚠️  Missing in .gitignore: $item${NC}"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  done
  echo -e "${GREEN}   ✅ .gitignore contains essential patterns${NC}"
fi
echo ""

# 4. Check for weak dependencies (npm audit)
echo "4️⃣  Checking for vulnerable dependencies..."
if [ -d "backend" ]; then
  echo "   Backend dependencies:"
  cd backend
  if npm audit --audit-level=high 2>&1 | grep -q "found 0 vulnerabilities"; then
    echo -e "${GREEN}   ✅ No high/critical vulnerabilities in backend${NC}"
  else
    echo -e "${RED}   ❌ Vulnerabilities found in backend dependencies${NC}"
    npm audit --audit-level=high
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
  cd ..
fi

if [ -d "frontend" ]; then
  echo "   Frontend dependencies:"
  cd frontend
  if npm audit --audit-level=high 2>&1 | grep -q "found 0 vulnerabilities"; then
    echo -e "${GREEN}   ✅ No high/critical vulnerabilities in frontend${NC}"
  else
    echo -e "${RED}   ❌ Vulnerabilities found in frontend dependencies${NC}"
    npm audit --audit-level=high
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
  cd ..
fi
echo ""

# 5. Check for security headers in backend
echo "5️⃣  Checking for security middleware..."
if grep -q "helmet" backend/package.json 2>/dev/null; then
  echo -e "${GREEN}   ✅ Helmet security headers configured${NC}"
else
  echo -e "${RED}   ❌ Helmet not found in backend dependencies${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if grep -q "express-mongo-sanitize\|mongo-sanitize" backend/package.json 2>/dev/null; then
  echo -e "${GREEN}   ✅ MongoDB sanitization configured${NC}"
else
  echo -e "${YELLOW}   ⚠️  MongoDB sanitization not found${NC}"
fi

if grep -q "express-rate-limit" backend/package.json 2>/dev/null; then
  echo -e "${GREEN}   ✅ Rate limiting configured${NC}"
else
  echo -e "${RED}   ❌ Rate limiting not configured${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# 6. Check for HTTPS in production
echo "6️⃣  Checking HTTPS configuration..."
if grep -q "https" backend/src/config/index.js 2>/dev/null || grep -q "SSL_CERT" backend/src/config/index.js 2>/dev/null; then
  echo -e "${GREEN}   ✅ HTTPS configuration found${NC}"
else
  echo -e "${YELLOW}   ⚠️  HTTPS configuration not detected (ensure it's configured in production)${NC}"
fi
echo ""

# 7. Check for exposed debug/console logs
echo "7️⃣  Checking for debug statements..."
DEBUG_COUNT=$(grep -rI "console\.[log|debug|info]" backend/src --exclude-dir=node_modules --exclude="logger.js" 2>/dev/null | wc -l || echo "0")
if [ "$DEBUG_COUNT" -gt 20 ]; then
  echo -e "${YELLOW}   ⚠️  Found $DEBUG_COUNT console statements (consider using proper logging)${NC}"
else
  echo -e "${GREEN}   ✅ Debug statements appear minimal${NC}"
fi
echo ""

# 8. Check for JWT secret validation
echo "8️⃣  Checking JWT configuration..."
if grep -q "JWT_SECRET" backend/src/config/index.js 2>/dev/null; then
  echo -e "${GREEN}   ✅ JWT configuration found${NC}"
  if grep -q "validateJWTSecret\|validateEnv" backend/src 2>/dev/null; then
    echo -e "${GREEN}   ✅ JWT secret validation implemented${NC}"
  else
    echo -e "${YELLOW}   ⚠️  JWT secret validation not found${NC}"
  fi
else
  echo -e "${RED}   ❌ JWT configuration not found${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# 9. Check for CORS configuration
echo "9️⃣  Checking CORS configuration..."
if grep -q "cors" backend/src/app.js 2>/dev/null; then
  if grep -q "origin: '\*'" backend/src/config/index.js 2>/dev/null; then
    echo -e "${YELLOW}   ⚠️  CORS configured to allow all origins (should be restricted in production)${NC}"
  else
    echo -e "${GREEN}   ✅ CORS appears to be properly configured${NC}"
  fi
else
  echo -e "${RED}   ❌ CORS not configured${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# 10. Check for input validation
echo "🔟  Checking input validation..."
if grep -q "express-validator\|joi\|yup" backend/package.json 2>/dev/null; then
  echo -e "${GREEN}   ✅ Input validation library found${NC}"
else
  echo -e "${YELLOW}   ⚠️  No input validation library detected${NC}"
fi

if [ -d "frontend/src/utils" ] && [ -f "frontend/src/utils/validation.js" ]; then
  echo -e "${GREEN}   ✅ Frontend validation utilities found${NC}"
else
  echo -e "${YELLOW}   ⚠️  Frontend validation utilities not found${NC}"
fi
echo ""

# Summary
echo "════════════════════════════════════════════════════════════════════"
echo ""
if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ Security audit passed! No critical issues found.${NC}"
  echo ""
  echo "📝 Recommendations:"
  echo "   - Regularly update dependencies (npm audit)"
  echo "   - Review code for security issues before deployment"
  echo "   - Use environment variables for all sensitive data"
  echo "   - Enable 2FA for admin accounts"
  echo "   - Conduct penetration testing before production"
  exit 0
else
  echo -e "${RED}❌ Security audit found $ISSUES_FOUND issue(s) that need attention.${NC}"
  echo ""
  echo "📝 Next steps:"
  echo "   1. Review all issues listed above"
  echo "   2. Fix critical security vulnerabilities"
  echo "   3. Re-run this audit after fixes"
  echo "   4. Consider professional security audit before production"
  exit 1
fi
