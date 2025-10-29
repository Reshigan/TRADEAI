#!/bin/bash

# TRADEAI Authentication Setup Verification Script
# Checks if authentication is properly configured

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}TRADEAI Authentication Setup Verification${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to check a condition
check() {
    local name="$1"
    local condition="$2"
    
    printf "%-50s" "  $name..."
    
    if eval "$condition"; then
        echo -e "${GREEN}PASS${NC}"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        ((FAIL_COUNT++))
        return 1
    fi
}

# Function to warn about something
warn() {
    local name="$1"
    local message="$2"
    
    printf "%-50s" "  $name..."
    echo -e "${YELLOW}WARN${NC}"
    echo -e "    ${YELLOW}→ $message${NC}"
    ((WARN_COUNT++))
}

# Check 1: Environment File Exists
echo -e "${BLUE}[1/10] Checking Environment Configuration${NC}"
check "Backend .env file exists" "[ -f '$PROJECT_ROOT/backend/.env' ]"

if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    # Check database mode
    DATABASE_MODE=$(grep "^DATABASE_MODE=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 | tr -d '\r\n' || echo "")
    MOCK_DATA=$(grep "^MOCK_DATA_ENABLED=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 | tr -d '\r\n' || echo "")
    
    if [ "$DATABASE_MODE" = "real" ]; then
        check "DATABASE_MODE is 'real'" "true"
    else
        check "DATABASE_MODE is 'real'" "false"
        echo -e "    ${RED}→ Current value: $DATABASE_MODE${NC}"
    fi
    
    if [ "$MOCK_DATA" = "false" ]; then
        check "MOCK_DATA_ENABLED is 'false'" "true"
    else
        check "MOCK_DATA_ENABLED is 'false'" "false"
        echo -e "    ${RED}→ Current value: $MOCK_DATA${NC}"
    fi
fi

echo ""

# Check 2: MongoDB Configuration
echo -e "${BLUE}[2/10] Checking MongoDB Configuration${NC}"
MONGODB_URI=$(grep "^MONGODB_URI=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 | tr -d '\r\n' || echo "")

if [ -n "$MONGODB_URI" ]; then
    check "MONGODB_URI is set" "true"
    
    # Try to connect to MongoDB
    if command -v mongosh &> /dev/null; then
        if mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" --quiet &> /dev/null; then
            check "MongoDB connection successful" "true"
        else
            check "MongoDB connection successful" "false"
            echo -e "    ${RED}→ Cannot connect to MongoDB${NC}"
        fi
    else
        warn "MongoDB connection test" "mongosh not installed, skipping connection test"
    fi
else
    check "MONGODB_URI is set" "false"
fi

echo ""

# Check 3: JWT Configuration
echo -e "${BLUE}[3/10] Checking JWT Configuration${NC}"
JWT_SECRET=$(grep "^JWT_SECRET=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 | tr -d '\r\n' || echo "")
JWT_REFRESH_SECRET=$(grep "^JWT_REFRESH_SECRET=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 | tr -d '\r\n' || echo "")

if [ -n "$JWT_SECRET" ]; then
    check "JWT_SECRET is set" "true"
    
    # Check if it's the default/weak secret
    if [[ "$JWT_SECRET" == *"change"* ]] || [[ "$JWT_SECRET" == *"secret"* ]]; then
        warn "JWT_SECRET strength" "Appears to be a default/weak secret. Generate a new one!"
    else
        check "JWT_SECRET is not default" "true"
    fi
    
    # Check length
    JWT_SECRET_LEN=${#JWT_SECRET}
    if [ $JWT_SECRET_LEN -ge 64 ]; then
        check "JWT_SECRET length (>= 64 chars)" "true"
    else
        check "JWT_SECRET length (>= 64 chars)" "false"
        echo -e "    ${RED}→ Current length: $JWT_SECRET_LEN characters${NC}"
    fi
else
    check "JWT_SECRET is set" "false"
fi

if [ -n "$JWT_REFRESH_SECRET" ]; then
    check "JWT_REFRESH_SECRET is set" "true"
else
    check "JWT_REFRESH_SECRET is set" "false"
fi

echo ""

# Check 4: Redis Configuration
echo -e "${BLUE}[4/10] Checking Redis Configuration${NC}"
REDIS_HOST=$(grep "^REDIS_HOST=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 | tr -d '\r\n' || echo "localhost")
REDIS_PORT=$(grep "^REDIS_PORT=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 | tr -d '\r\n' || echo "6379")
REDIS_PASSWORD=$(grep "^REDIS_PASSWORD=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 | tr -d '\r\n' || echo "")
REDIS_ENABLED=$(grep "^REDIS_ENABLED=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 | tr -d '\r\n' || echo "false")

if [ "$REDIS_ENABLED" = "true" ]; then
    check "REDIS_ENABLED is 'true'" "true"
    
    # Try to connect to Redis
    if command -v redis-cli &> /dev/null; then
        if [ -n "$REDIS_PASSWORD" ]; then
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --no-auth-warning ping &> /dev/null; then
                check "Redis connection successful" "true"
            else
                check "Redis connection successful" "false"
            fi
        else
            warn "Redis password" "No Redis password set (not recommended for production)"
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &> /dev/null; then
                check "Redis connection successful" "true"
            else
                check "Redis connection successful" "false"
            fi
        fi
    else
        warn "Redis connection test" "redis-cli not installed, skipping connection test"
    fi
else
    warn "Redis configuration" "Redis is disabled (optional but recommended for production)"
fi

echo ""

# Check 5: CORS Configuration
echo -e "${BLUE}[5/10] Checking CORS Configuration${NC}"
CORS_ORIGIN=$(grep "^CORS_ORIGIN=" "$PROJECT_ROOT/backend/.env" | cut -d '=' -f2 | tr -d '\r\n' || echo "")

if [ -n "$CORS_ORIGIN" ]; then
    check "CORS_ORIGIN is set" "true"
    
    if [ "$CORS_ORIGIN" = "*" ]; then
        warn "CORS security" "CORS allows all origins (*). Not recommended for production!"
    fi
else
    check "CORS_ORIGIN is set" "false"
fi

echo ""

# Check 6: Required Files
echo -e "${BLUE}[6/10] Checking Required Files${NC}"
check "AuthController exists" "[ -f '$PROJECT_ROOT/backend/src/controllers/authController.js' ]"
check "Auth middleware exists" "[ -f '$PROJECT_ROOT/backend/src/middleware/auth.js' ]"
check "User model exists" "[ -f '$PROJECT_ROOT/backend/src/models/User.js' ]"
check "Auth service (frontend) exists" "[ -f '$PROJECT_ROOT/frontend/src/services/api/authService.js' ]"
check "Seed script exists" "[ -f '$PROJECT_ROOT/scripts/seed-production-users.js' ]"

echo ""

# Check 7: Backend Dependencies
echo -e "${BLUE}[7/10] Checking Backend Dependencies${NC}"
if [ -f "$PROJECT_ROOT/backend/package.json" ]; then
    check "package.json exists" "true"
    
    # Check for critical packages
    if grep -q '"jsonwebtoken"' "$PROJECT_ROOT/backend/package.json"; then
        check "jsonwebtoken package declared" "true"
    else
        check "jsonwebtoken package declared" "false"
    fi
    
    if grep -q '"bcryptjs"' "$PROJECT_ROOT/backend/package.json" || grep -q '"bcrypt"' "$PROJECT_ROOT/backend/package.json"; then
        check "bcrypt package declared" "true"
    else
        check "bcrypt package declared" "false"
    fi
    
    # Check if node_modules exists
    if [ -d "$PROJECT_ROOT/backend/node_modules" ]; then
        check "node_modules installed" "true"
    else
        check "node_modules installed" "false"
        echo -e "    ${RED}→ Run: cd backend && npm install${NC}"
    fi
else
    check "package.json exists" "false"
fi

echo ""

# Check 8: Frontend Dependencies
echo -e "${BLUE}[8/10] Checking Frontend Dependencies${NC}"
if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
    check "package.json exists" "true"
    
    # Check for axios
    if grep -q '"axios"' "$PROJECT_ROOT/frontend/package.json"; then
        check "axios package declared" "true"
    else
        check "axios package declared" "false"
    fi
    
    # Check if node_modules exists
    if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
        check "node_modules installed" "true"
    else
        check "node_modules installed" "false"
        echo -e "    ${RED}→ Run: cd frontend && npm install${NC}"
    fi
else
    check "package.json exists" "false"
fi

echo ""

# Check 9: Database Users
echo -e "${BLUE}[9/10] Checking Database Users${NC}"
if [ -n "$MONGODB_URI" ] && command -v mongosh &> /dev/null; then
    if mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" --quiet &> /dev/null; then
        USER_COUNT=$(mongosh "$MONGODB_URI" --quiet --eval "db.users.countDocuments()" 2>/dev/null || echo "0")
        
        if [ "$USER_COUNT" -gt "0" ]; then
            check "Users exist in database" "true"
            echo -e "    ${GREEN}→ Found $USER_COUNT user(s)${NC}"
        else
            check "Users exist in database" "false"
            echo -e "    ${RED}→ Run: node scripts/seed-production-users.js${NC}"
        fi
    else
        warn "User check" "Cannot connect to MongoDB to check users"
    fi
else
    warn "User check" "MongoDB not accessible or mongosh not installed"
fi

echo ""

# Check 10: Service Status (if running)
echo -e "${BLUE}[10/10] Checking Service Status${NC}"

# Check backend
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    check "Backend service running" "true"
else
    warn "Backend service" "Backend not running on port 5000"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    check "Frontend service running" "true"
else
    warn "Frontend service" "Frontend not running on port 3000"
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "  ${GREEN}Passed:${NC} $PASS_COUNT"
echo -e "  ${RED}Failed:${NC} $FAIL_COUNT"
echo -e "  ${YELLOW}Warnings:${NC} $WARN_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ Authentication setup verification passed!${NC}"
    echo ""
    if [ $WARN_COUNT -gt 0 ]; then
        echo -e "${YELLOW}⚠ There are $WARN_COUNT warning(s) that should be addressed.${NC}"
    fi
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "1. Start services: ${GREEN}./scripts/start-production.sh${NC}"
    echo -e "2. Test login: ${GREEN}http://localhost:3000${NC}"
    echo -e "3. Review documentation: ${GREEN}QUICK_START_AUTHENTICATION.md${NC}"
    exit 0
else
    echo -e "${RED}✗ Authentication setup has $FAIL_COUNT issue(s) that must be fixed.${NC}"
    echo ""
    echo -e "${BLUE}Common fixes:${NC}"
    echo -e "1. Update backend/.env with proper values"
    echo -e "2. Ensure DATABASE_MODE=real and MOCK_DATA_ENABLED=false"
    echo -e "3. Set MONGODB_URI to your database connection string"
    echo -e "4. Generate secure JWT secrets"
    echo -e "5. Install dependencies: cd backend && npm install"
    echo ""
    echo -e "See ${GREEN}QUICK_START_AUTHENTICATION.md${NC} for detailed instructions."
    exit 1
fi
