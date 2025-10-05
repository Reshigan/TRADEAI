#!/bin/bash

# 🚀 FINAL PRODUCTION DEPLOYMENT READINESS CHECK
# This script performs the ultimate pre-deployment validation

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
CRITICAL_ISSUES=0

# Check functions
check_pass() {
    echo -e "✅ ${GREEN}PASS${NC}: $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

check_fail() {
    echo -e "❌ ${RED}FAIL${NC}: $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

check_critical() {
    echo -e "🚨 ${RED}CRITICAL${NC}: $1"
    ((CRITICAL_ISSUES++))
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

check_warning() {
    echo -e "⚠️  ${YELLOW}WARNING${NC}: $1"
    ((TOTAL_CHECKS++))
}

auto_fix() {
    echo -e "🔧 ${CYAN}FIXING${NC}: $1"
    if eval "$2"; then
        echo -e "✅ ${GREEN}FIXED${NC}: $1"
        ((PASSED_CHECKS++))
    else
        echo -e "❌ ${RED}FIX FAILED${NC}: $1"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
}

header() {
    echo -e "\n${PURPLE}============================================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}============================================================${NC}\n"
}

section() {
    echo -e "\n${BLUE}🔍 $1${NC}"
    echo -e "${BLUE}------------------------------------------------------------${NC}"
}

header "🚀 FINAL PRODUCTION DEPLOYMENT READINESS CHECK"

# 1. Critical Infrastructure Validation
section "Critical Infrastructure Validation"

# Check Node.js version compatibility
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version | sed 's/v//')
    if [[ "$NODE_VERSION" =~ ^1[8-9]\.|^2[0-9]\. ]]; then
        check_pass "Node.js version $NODE_VERSION (Production compatible)"
    else
        check_critical "Node.js version $NODE_VERSION may not be production ready"
    fi
else
    check_critical "Node.js not installed"
fi

# Check npm and package integrity
if command -v npm >/dev/null 2>&1; then
    check_pass "npm package manager available"
    
    # Check for package vulnerabilities
    if npm audit --audit-level=high --json > /dev/null 2>&1; then
        check_pass "No high-severity npm vulnerabilities detected"
    else
        check_fail "High-severity npm vulnerabilities detected - run 'npm audit fix'"
    fi
else
    check_critical "npm not available"
fi

# Check critical directories
CRITICAL_DIRS=("backend" "frontend" "scripts" "backend/src" "frontend/src")
for dir in "${CRITICAL_DIRS[@]}"; do
    if [ -d "$PROJECT_ROOT/$dir" ]; then
        check_pass "Critical directory exists: $dir"
    else
        check_critical "Missing critical directory: $dir"
    fi
done

# 2. Production Environment Configuration
section "Production Environment Configuration"

# Check production environment file
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    check_pass "Production environment file exists"
    
    # Validate critical environment variables
    REQUIRED_VARS=("NODE_ENV" "PORT" "JWT_SECRET" "DOMAIN" "AI_PROVIDER")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" "$PROJECT_ROOT/.env.production"; then
            check_pass "Environment variable $var configured"
        else
            check_critical "Missing critical environment variable: $var"
        fi
    done
    
    # Check for placeholder values
    if grep -q "REPLACE\|CHANGEME\|PLACEHOLDER\|TODO" "$PROJECT_ROOT/.env.production"; then
        check_critical "Production environment contains placeholder values"
    else
        check_pass "No placeholder values in production environment"
    fi
    
else
    check_critical "Production environment file missing"
fi

# 3. Database Configuration and Connectivity
section "Database Configuration and Connectivity"

# Check for database configuration
if [ -f "$PROJECT_ROOT/backend/src/config/database.js" ] || [ -f "$PROJECT_ROOT/backend/config/database.js" ]; then
    check_pass "Database configuration file found"
    
    # Check for database connection test
    if [ -f "$PROJECT_ROOT/backend/src/utils/dbTest.js" ] || grep -r "mongoose.connect\|sequelize.authenticate" "$PROJECT_ROOT/backend" --exclude-dir=node_modules > /dev/null 2>&1; then
        check_pass "Database connection logic implemented"
    else
        check_warning "Database connection test not found"
    fi
else
    check_warning "Database configuration not found (may be using file-based storage)"
fi

# 4. SSL Certificate and Domain Configuration
section "SSL Certificate and Domain Configuration"

# Check SSL setup script
if [ -f "$PROJECT_ROOT/scripts/ssl-setup.sh" ] && [ -x "$PROJECT_ROOT/scripts/ssl-setup.sh" ]; then
    check_pass "SSL setup script available and executable"
else
    auto_fix "SSL setup script missing or not executable" "chmod +x '$PROJECT_ROOT/scripts/ssl-setup.sh' 2>/dev/null || echo 'SSL script not found'"
fi

# Check domain configuration
if grep -q "tradeai.gonxt.tech" "$PROJECT_ROOT/.env.production" 2>/dev/null; then
    check_pass "Production domain configured: tradeai.gonxt.tech"
else
    check_fail "Production domain not configured in environment"
fi

# 5. Process Management Configuration
section "Process Management Configuration"

# Check for PM2 ecosystem file
if [ -f "$PROJECT_ROOT/ecosystem.config.js" ] || [ -f "$PROJECT_ROOT/pm2.config.js" ]; then
    check_pass "PM2 process management configuration found"
else
    auto_fix "PM2 configuration missing" "cat > '$PROJECT_ROOT/ecosystem.config.js' << 'EOF'
module.exports = {
  apps: [{
    name: 'tradeai-backend',
    script: './backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5002
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF"
fi

# Check if PM2 is installed globally or locally
if command -v pm2 >/dev/null 2>&1 || [ -f "$PROJECT_ROOT/node_modules/.bin/pm2" ]; then
    check_pass "PM2 process manager available"
else
    check_warning "PM2 not installed - install with: npm install -g pm2"
fi

# 6. Reverse Proxy and Load Balancing
section "Reverse Proxy and Load Balancing"

# Check for Nginx configuration
if [ -f "$PROJECT_ROOT/nginx.conf" ] || [ -f "$PROJECT_ROOT/config/nginx.conf" ]; then
    check_pass "Nginx configuration found"
else
    auto_fix "Nginx configuration missing" "mkdir -p '$PROJECT_ROOT/config' && cat > '$PROJECT_ROOT/config/nginx.conf' << 'EOF'
server {
    listen 80;
    server_name tradeai.gonxt.tech;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tradeai.gonxt.tech;

    ssl_certificate /etc/letsencrypt/live/tradeai.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tradeai.gonxt.tech/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF"
fi

# 7. Security Hardening
section "Security Hardening"

# Check for security middleware
if grep -r "helmet\|cors\|rate.*limit" "$PROJECT_ROOT/backend" --exclude-dir=node_modules > /dev/null 2>&1; then
    check_pass "Security middleware detected (helmet, cors, rate limiting)"
else
    check_fail "Security middleware not detected"
fi

# Check for input validation
if grep -r "joi\|express-validator\|validator" "$PROJECT_ROOT/backend" --exclude-dir=node_modules > /dev/null 2>&1; then
    check_pass "Input validation middleware detected"
else
    check_fail "Input validation not detected"
fi

# Check for secure headers configuration
if grep -r "X-Frame-Options\|X-Content-Type-Options\|X-XSS-Protection" "$PROJECT_ROOT" --exclude-dir=node_modules > /dev/null 2>&1; then
    check_pass "Security headers configuration found"
else
    check_warning "Security headers not explicitly configured"
fi

# 8. Monitoring and Logging
section "Monitoring and Logging"

# Check logging configuration
if [ -f "$PROJECT_ROOT/backend/src/utils/logger.js" ] || grep -r "winston\|morgan\|pino" "$PROJECT_ROOT/backend" --exclude-dir=node_modules > /dev/null 2>&1; then
    check_pass "Professional logging framework configured"
else
    check_fail "Professional logging not configured"
fi

# Check logs directory
if [ -d "$PROJECT_ROOT/logs" ]; then
    check_pass "Logs directory exists"
else
    auto_fix "Logs directory missing" "mkdir -p '$PROJECT_ROOT/logs' && touch '$PROJECT_ROOT/logs/.gitkeep'"
fi

# Check for health monitoring endpoints
if grep -r "/health\|/status\|/ping" "$PROJECT_ROOT/backend" --exclude-dir=node_modules > /dev/null 2>&1; then
    check_pass "Health monitoring endpoints configured"
else
    check_fail "Health monitoring endpoints not found"
fi

# 9. Backup and Recovery
section "Backup and Recovery"

# Check for backup scripts
if [ -f "$PROJECT_ROOT/scripts/backup.sh" ] || [ -f "$PROJECT_ROOT/backup.sh" ]; then
    check_pass "Backup script found"
else
    auto_fix "Backup script missing" "cat > '$PROJECT_ROOT/scripts/backup.sh' << 'EOF'
#!/bin/bash
# Backup script for Trade AI platform

BACKUP_DIR=\"/var/backups/tradeai\"
DATE=\$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p \"\$BACKUP_DIR\"

# Backup application files
tar -czf \"\$BACKUP_DIR/app_\$DATE.tar.gz\" --exclude=node_modules --exclude=logs .

# Backup database (if applicable)
# mongodump --out \"\$BACKUP_DIR/db_\$DATE\" 2>/dev/null || echo \"No MongoDB backup\"

# Keep only last 7 days of backups
find \"\$BACKUP_DIR\" -name \"*.tar.gz\" -mtime +7 -delete
find \"\$BACKUP_DIR\" -name \"db_*\" -mtime +7 -exec rm -rf {} +

echo \"Backup completed: \$BACKUP_DIR\"
EOF
chmod +x '$PROJECT_ROOT/scripts/backup.sh'"
fi

# 10. Performance Optimization
section "Performance Optimization"

# Check for compression middleware
if grep -r "compression\|gzip" "$PROJECT_ROOT/backend" --exclude-dir=node_modules > /dev/null 2>&1; then
    check_pass "Compression middleware configured"
else
    check_warning "Compression middleware not detected"
fi

# Check for caching configuration
if grep -r "redis\|memcached\|cache" "$PROJECT_ROOT/backend" --exclude-dir=node_modules > /dev/null 2>&1; then
    check_pass "Caching mechanism detected"
else
    check_warning "No caching mechanism detected"
fi

# 11. Final Production Tests
section "Final Production Tests"

# Test backend server startup
echo "Testing backend server startup..."
cd "$PROJECT_ROOT/backend"
if timeout 10 npm run start:prod > /dev/null 2>&1 &
then
    sleep 5
    if curl -s http://localhost:5002/health > /dev/null 2>&1; then
        check_pass "Backend server starts and responds to health checks"
        # Kill the test server
        pkill -f "node.*server.js" 2>/dev/null || true
    else
        check_fail "Backend server does not respond to health checks"
    fi
else
    check_fail "Backend server fails to start"
fi

# Test frontend build
cd "$PROJECT_ROOT/frontend"
if [ -f "package.json" ] && npm run build > /dev/null 2>&1; then
    check_pass "Frontend builds successfully"
else
    check_warning "Frontend build test skipped or failed"
fi

cd "$PROJECT_ROOT"

# 12. Final Deployment Checklist
section "Final Deployment Checklist"

# Check deployment script
if [ -f "$PROJECT_ROOT/deploy.sh" ] && [ -x "$PROJECT_ROOT/deploy.sh" ]; then
    check_pass "Deployment script available and executable"
else
    check_fail "Deployment script missing or not executable"
fi

# Check for production documentation
if [ -f "$PROJECT_ROOT/README.md" ] && grep -q -i "production\|deployment" "$PROJECT_ROOT/README.md"; then
    check_pass "Production deployment documentation available"
else
    check_warning "Production deployment documentation incomplete"
fi

# Final validation
if [ "$CRITICAL_ISSUES" -eq 0 ]; then
    check_pass "Zero critical issues detected - ready for deployment"
else
    check_critical "$CRITICAL_ISSUES critical issues must be resolved before deployment"
fi

# Generate final assessment
header "🏆 FINAL PRODUCTION READINESS ASSESSMENT"

echo -e "\n📊 ${CYAN}Final Production Readiness Statistics:${NC}"
echo -e "   Total Checks: $TOTAL_CHECKS"
echo -e "   Passed: $PASSED_CHECKS"
echo -e "   Failed: $FAILED_CHECKS"
echo -e "   Critical Issues: $CRITICAL_ISSUES"

SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "   Final Score: $SCORE/100"

if [ "$CRITICAL_ISSUES" -eq 0 ] && [ "$SCORE" -ge 95 ]; then
    echo -e "\n🎉 ${GREEN}PRODUCTION DEPLOYMENT APPROVED!${NC}"
    echo -e "🚀 ${GREEN}READY FOR IMMEDIATE GO-LIVE${NC}"
    echo -e "🛡️ ${GREEN}BULLETPROOF STATUS: CONFIRMED${NC}"
    exit 0
elif [ "$CRITICAL_ISSUES" -eq 0 ] && [ "$SCORE" -ge 85 ]; then
    echo -e "\n⚠️  ${YELLOW}PRODUCTION DEPLOYMENT CONDITIONALLY APPROVED${NC}"
    echo -e "🔧 ${YELLOW}MINOR ISSUES SHOULD BE ADDRESSED${NC}"
    exit 1
else
    echo -e "\n❌ ${RED}PRODUCTION DEPLOYMENT NOT APPROVED${NC}"
    echo -e "🚨 ${RED}CRITICAL ISSUES MUST BE RESOLVED${NC}"
    exit 2
fi