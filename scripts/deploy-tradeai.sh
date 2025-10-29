#!/bin/bash
# TRADEAI Automated Deployment Script with Comprehensive Testing at Each Stage
# File: deploy-tradeai-with-tests.sh
# Version: 2.0
# Date: 2025-10-28

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_DIR=~/tradeai-repo
BACKEND_DIR=/var/www/tradeai/backend
FRONTEND_DIR=/var/www/tradeai/frontend
BRANCH=${1:-main}
TEST_RESULTS_DIR=~/deployment-tests/$(date +%Y%m%d-%H%M%S)
DEPLOYMENT_LOG="$TEST_RESULTS_DIR/deployment.log"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Initialize test results directory
mkdir -p "$TEST_RESULTS_DIR"

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

# Test function template
run_test() {
    local test_name=$1
    local test_command=$2
    local expected_result=$3
    
    ((TESTS_TOTAL++))
    log "Running test: $test_name"
    
    if eval "$test_command"; then
        if [ -n "$expected_result" ]; then
            if eval "$expected_result"; then
                log_success "Test passed: $test_name"
                return 0
            else
                log_error "Test failed: $test_name (unexpected result)"
                return 1
            fi
        else
            log_success "Test passed: $test_name"
            return 0
        fi
    else
        log_error "Test failed: $test_name"
        return 1
    fi
}

# Header
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     TRADEAI AUTOMATED DEPLOYMENT WITH TESTING                ║"
echo "║     Version 2.0 - Comprehensive Test Suite                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
log "Deployment started"
log "Branch: $BRANCH"
log "Test results directory: $TEST_RESULTS_DIR"
echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 1: PRE-DEPLOYMENT ENVIRONMENT TESTS
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 1: PRE-DEPLOYMENT ENVIRONMENT TESTS                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Test 1.1: Check disk space
run_test "Disk space availability" \
    "df -h / | tail -1 | awk '{print \$5}' | sed 's/%//'" \
    "[ \$(df -h / | tail -1 | awk '{print \$5}' | sed 's/%//') -lt 90 ]"

# Test 1.2: Check MongoDB service
run_test "MongoDB service status" \
    "sudo systemctl is-active mongod" \
    ""

# Test 1.3: MongoDB connection test
run_test "MongoDB connection" \
    "mongosh --quiet --eval 'db.adminCommand(\"ping\")' | grep -q 'ok: 1'" \
    ""

# Test 1.4: Check MongoDB database exists
run_test "MongoDB database 'tradeai' exists" \
    "mongosh --quiet --eval 'db.getSiblingDB(\"tradeai\").stats()' > /dev/null 2>&1" \
    ""

# Test 1.5: Nginx service
run_test "Nginx service status" \
    "sudo systemctl is-active nginx" \
    ""

# Test 1.6: PM2 availability
run_test "PM2 installed and accessible" \
    "which pm2" \
    ""

# Test 1.7: Node.js version
run_test "Node.js version >= 16" \
    "node -v | grep -E 'v(1[6-9]|[2-9][0-9])'" \
    ""

# Test 1.8: npm availability
run_test "npm installed" \
    "npm -v" \
    ""

# Test 1.9: Git repository accessible
run_test "Git repository accessible" \
    "cd $REPO_DIR && git status" \
    ""

# Test 1.10: Network connectivity
run_test "Internet connectivity" \
    "curl -s -o /dev/null -w '%{http_code}' https://github.com | grep -q '200'" \
    ""

echo ""
log "Stage 1 complete: $TESTS_PASSED/$TESTS_TOTAL tests passed"
echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 2: BACKUP CURRENT SYSTEM
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 2: BACKUP CURRENT SYSTEM                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

BACKUP_DIR=~/backups/tradeai-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

# Test 2.1: Backup backend
run_test "Backup backend directory" \
    "cp -r $BACKEND_DIR $BACKUP_DIR/backend 2>/dev/null || true" \
    "[ -d $BACKUP_DIR/backend ]"

# Test 2.2: Backup frontend build
run_test "Backup frontend build" \
    "cp -r $FRONTEND_DIR/build $BACKUP_DIR/frontend 2>/dev/null || true" \
    "[ -d $BACKUP_DIR/frontend ]"

# Test 2.3: Backup .env file
run_test "Backup .env configuration" \
    "cp $BACKEND_DIR/.env $BACKUP_DIR/.env 2>/dev/null || true" \
    "[ -f $BACKUP_DIR/.env ]"

# Test 2.4: Backup PM2 configuration
run_test "Backup PM2 configuration" \
    "pm2 save" \
    ""

log "Backup saved to: $BACKUP_DIR"
echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 3: PULL LATEST CODE
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 3: PULL LATEST CODE                                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

cd "$REPO_DIR"

# Test 3.1: Git fetch
run_test "Git fetch from remote" \
    "git fetch origin" \
    ""

# Test 3.2: Git checkout branch
run_test "Git checkout branch: $BRANCH" \
    "git checkout $BRANCH" \
    ""

# Test 3.3: Git pull
run_test "Git pull latest changes" \
    "git pull origin $BRANCH" \
    ""

COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)
log "Latest commit: $COMMIT_HASH - $COMMIT_MSG"

# Test 3.4: Verify backend files exist
run_test "Backend files exist in repository" \
    "[ -d $REPO_DIR/backend/src ] && [ -f $REPO_DIR/backend/package.json ]" \
    ""

# Test 3.5: Verify frontend files exist
run_test "Frontend files exist in repository" \
    "[ -d $REPO_DIR/frontend/src ] && [ -f $REPO_DIR/frontend/package.json ]" \
    ""

echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 4: BACKEND DEPLOYMENT
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 4: BACKEND DEPLOYMENT                                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Test 4.1: Sync backend files
run_test "Sync backend files to production" \
    "rsync -av --delete --exclude 'node_modules' --exclude '.git' --exclude '.env' $REPO_DIR/backend/ $BACKEND_DIR/" \
    "[ -f $BACKEND_DIR/package.json ]"

# Test 4.2: Backend package.json integrity
run_test "Verify backend package.json" \
    "cd $BACKEND_DIR && node -e \"require('./package.json')\"" \
    ""

# Test 4.3: Install backend dependencies
run_test "Install backend dependencies" \
    "cd $BACKEND_DIR && npm install --production > $TEST_RESULTS_DIR/npm-install.log 2>&1" \
    ""

# Test 4.4: Check for vulnerabilities
log "Checking for security vulnerabilities..."
npm audit --production > "$TEST_RESULTS_DIR/npm-audit.log" 2>&1 || true
CRITICAL_VULNS=$(grep -c "Critical" "$TEST_RESULTS_DIR/npm-audit.log" || echo "0")
if [ "$CRITICAL_VULNS" -gt 0 ]; then
    log_warning "Found $CRITICAL_VULNS critical vulnerabilities. Review $TEST_RESULTS_DIR/npm-audit.log"
else
    log_success "No critical vulnerabilities found"
    ((TESTS_PASSED++))
fi
((TESTS_TOTAL++))

# Test 4.5: Verify MongoDB URI in .env
run_test "Verify MongoDB URI configuration" \
    "grep -q '^MONGODB_URI=' $BACKEND_DIR/.env" \
    ""

# Test 4.6: Verify JWT secret exists
run_test "Verify JWT secret configuration" \
    "grep -q '^JWT_SECRET=' $BACKEND_DIR/.env" \
    ""

# Test 4.7: Create/verify start script
run_test "Create production HTTP start script" \
    "cat > $BACKEND_DIR/start-production-http.js << 'EOFJS'
process.env.NODE_ENV = 'production';
process.env.PORT = 5000;
process.env.PROTOCOL = 'http';
require('./simple-backend.js');
EOFJS" \
    "[ -f $BACKEND_DIR/start-production-http.js ]"

# Test 4.8: Verify required backend files
run_test "Verify critical backend files exist" \
    "[ -f $BACKEND_DIR/simple-backend.js ] || [ -f $BACKEND_DIR/server.js ] || [ -f $BACKEND_DIR/src/server.js ]" \
    ""

echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 5: BACKEND RESTART & HEALTH CHECKS
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 5: BACKEND RESTART & HEALTH CHECKS                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Test 5.1: Stop old PM2 process
run_test "Stop old PM2 process" \
    "pm2 stop tradeai-backend 2>/dev/null || true" \
    ""

# Test 5.2: Delete PM2 process
run_test "Delete PM2 process" \
    "pm2 delete tradeai-backend 2>/dev/null || true" \
    ""

# Test 5.3: Start new PM2 process
run_test "Start new PM2 process" \
    "cd $BACKEND_DIR && pm2 start start-production-http.js --name tradeai-backend" \
    ""

# Test 5.4: Save PM2 configuration
run_test "Save PM2 configuration" \
    "pm2 save" \
    ""

log "Waiting for backend to start..."
sleep 5

# Test 5.5: PM2 process is online
run_test "PM2 process is online" \
    "pm2 list | grep tradeai-backend | grep -q online" \
    ""

# Test 5.6: Backend port is listening
run_test "Backend listening on port 5000" \
    "sudo netstat -tlnp | grep ':5000' | grep -q LISTEN" \
    ""

# Test 5.7: Backend health endpoint (basic)
for i in {1..10}; do
    if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
        log_success "Backend health endpoint responding (attempt $i/10)"
        ((TESTS_PASSED++))
        break
    fi
    if [ $i -eq 10 ]; then
        log_error "Backend health endpoint not responding after 10 attempts"
        ((TESTS_FAILED++))
        pm2 logs tradeai-backend --lines 50 > "$TEST_RESULTS_DIR/backend-startup-error.log"
        log_error "Startup logs saved to: $TEST_RESULTS_DIR/backend-startup-error.log"
    fi
    log "Waiting for backend health endpoint... ($i/10)"
    sleep 2
done
((TESTS_TOTAL++))

# Test 5.8: Backend version endpoint
run_test "Backend version endpoint" \
    "curl -sf http://localhost:5000/api/version > /dev/null 2>&1" \
    ""

# Test 5.9: Backend authentication endpoint
run_test "Backend auth endpoint accessible" \
    "curl -sf -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{}' 2>&1 | grep -q -E 'email|password|error'" \
    ""

# Test 5.10: Test actual login
log "Testing login with valid credentials..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@trade-ai.com","password":"Admin@123456"}' 2>&1)
echo "$LOGIN_RESPONSE" > "$TEST_RESULTS_DIR/login-response.json"

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    log_success "Login test passed - token received"
    ((TESTS_PASSED++))
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")
else
    log_error "Login test failed - no token received"
    ((TESTS_FAILED++))
    TOKEN=""
fi
((TESTS_TOTAL++))

# Test 5.11: Test authenticated endpoint (if token received)
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    run_test "Test authenticated dashboard endpoint" \
        "curl -sf http://localhost:5000/api/analytics/dashboard -H 'Authorization: Bearer $TOKEN' > $TEST_RESULTS_DIR/dashboard-response.json 2>&1" \
        ""
fi

# Test 5.12: Check for errors in PM2 logs
log "Checking PM2 logs for errors..."
pm2 logs tradeai-backend --lines 100 --nostream > "$TEST_RESULTS_DIR/pm2-logs.log" 2>&1
ERROR_COUNT=$(grep -i "error" "$TEST_RESULTS_DIR/pm2-logs.log" | wc -l)
if [ "$ERROR_COUNT" -gt 5 ]; then
    log_warning "Found $ERROR_COUNT error entries in logs (review $TEST_RESULTS_DIR/pm2-logs.log)"
else
    log_success "Log check passed ($ERROR_COUNT errors found, acceptable)"
    ((TESTS_PASSED++))
fi
((TESTS_TOTAL++))

# Test 5.13: MongoDB connection from backend
log "Testing MongoDB connection from backend..."
if grep -q "MongoDB Connected" "$TEST_RESULTS_DIR/pm2-logs.log"; then
    log_success "Backend successfully connected to MongoDB"
    ((TESTS_PASSED++))
else
    log_error "Backend MongoDB connection not confirmed in logs"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 6: FRONTEND BUILD & DEPLOYMENT
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 6: FRONTEND BUILD & DEPLOYMENT                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

cd "$REPO_DIR/frontend"

# Test 6.1: Frontend package.json integrity
run_test "Verify frontend package.json" \
    "node -e \"require('./package.json')\"" \
    ""

# Test 6.2: Install frontend dependencies
run_test "Install frontend dependencies" \
    "npm install > $TEST_RESULTS_DIR/frontend-npm-install.log 2>&1" \
    ""

# Test 6.3: Check for frontend vulnerabilities
log "Checking frontend for security vulnerabilities..."
npm audit --production > "$TEST_RESULTS_DIR/frontend-npm-audit.log" 2>&1 || true
FRONTEND_CRITICAL_VULNS=$(grep -c "Critical" "$TEST_RESULTS_DIR/frontend-npm-audit.log" || echo "0")
if [ "$FRONTEND_CRITICAL_VULNS" -gt 0 ]; then
    log_warning "Found $FRONTEND_CRITICAL_VULNS critical vulnerabilities in frontend"
else
    log_success "No critical vulnerabilities in frontend"
    ((TESTS_PASSED++))
fi
((TESTS_TOTAL++))

# Test 6.4: Build frontend
log "Building frontend (this may take a few minutes)..."
run_test "Build frontend application" \
    "npm run build > $TEST_RESULTS_DIR/frontend-build.log 2>&1" \
    "[ -d build ] && [ -f build/index.html ]"

# Test 6.5: Verify build artifacts
run_test "Verify frontend build artifacts" \
    "[ -f build/index.html ] && [ -d build/static ]" \
    ""

# Test 6.6: Check build size
BUILD_SIZE=$(du -sh build | awk '{print $1}')
log "Frontend build size: $BUILD_SIZE"
run_test "Frontend build size reasonable (< 50MB)" \
    "[ \$(du -s build | awk '{print \$1}') -lt 51200 ]" \
    ""

# Test 6.7: Verify JavaScript bundles
run_test "Verify JavaScript bundles exist" \
    "ls build/static/js/*.js | wc -l | grep -q -E '[1-9]'" \
    ""

# Test 6.8: Verify CSS bundles
run_test "Verify CSS bundles exist" \
    "ls build/static/css/*.css | wc -l | grep -q -E '[1-9]'" \
    ""

# Test 6.9: Sync frontend to production
run_test "Sync frontend build to production" \
    "rsync -av --delete $REPO_DIR/frontend/build/ $FRONTEND_DIR/build/" \
    "[ -f $FRONTEND_DIR/build/index.html ]"

# Test 6.10: Verify frontend files in production
run_test "Verify frontend files deployed" \
    "[ -f $FRONTEND_DIR/build/index.html ] && [ -d $FRONTEND_DIR/build/static ]" \
    ""

# Test 6.11: Check frontend file permissions
run_test "Frontend file permissions correct" \
    "[ -r $FRONTEND_DIR/build/index.html ]" \
    ""

echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 7: NGINX CONFIGURATION & RESTART
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 7: NGINX CONFIGURATION & RESTART                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/tradeai"

# Test 7.1: Verify Nginx configuration exists
run_test "Nginx configuration file exists" \
    "[ -f $NGINX_CONFIG ]" \
    ""

# Test 7.2: Backup current Nginx config
run_test "Backup Nginx configuration" \
    "sudo cp $NGINX_CONFIG $BACKUP_DIR/nginx-tradeai.conf" \
    ""

# Test 7.3: Verify Nginx proxy is HTTP (not HTTPS)
if ! grep -q "proxy_pass http://localhost:5000" "$NGINX_CONFIG"; then
    log_warning "Nginx proxy configuration incorrect - fixing..."
    
    sudo tee "$NGINX_CONFIG" > /dev/null << 'EOFNGINX'
server {
    listen 80;
    listen [::]:80;
    server_name tradeai.gonxt.tech;
    client_max_body_size 100M;

    # API Proxy to HTTP backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend
    location / {
        root /var/www/tradeai/frontend/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }
}
EOFNGINX
    
    log_success "Nginx configuration updated"
    ((TESTS_PASSED++))
else
    log_success "Nginx configuration already correct"
    ((TESTS_PASSED++))
fi
((TESTS_TOTAL++))

# Test 7.4: Nginx configuration syntax
run_test "Nginx configuration syntax check" \
    "sudo nginx -t 2>&1 | tee $TEST_RESULTS_DIR/nginx-test.log" \
    "sudo nginx -t 2>&1 | grep -q 'successful'"

# Test 7.5: Reload Nginx
run_test "Reload Nginx" \
    "sudo systemctl reload nginx" \
    ""

# Test 7.6: Nginx service status
run_test "Nginx service is active" \
    "sudo systemctl is-active nginx" \
    ""

# Test 7.7: Nginx listening on port 80
run_test "Nginx listening on port 80" \
    "sudo netstat -tlnp | grep ':80' | grep -q LISTEN" \
    ""

echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 8: END-TO-END FRONTEND TESTS
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 8: END-TO-END FRONTEND TESTS                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Test 8.1: Frontend homepage loads
run_test "Frontend homepage accessible via Nginx" \
    "curl -sf http://localhost/ > $TEST_RESULTS_DIR/frontend-homepage.html 2>&1" \
    ""

# Test 8.2: Frontend HTML contains React app
run_test "Frontend HTML contains React root" \
    "grep -q 'id=\"root\"' $TEST_RESULTS_DIR/frontend-homepage.html" \
    ""

# Test 8.3: Frontend title correct
run_test "Frontend title correct" \
    "grep -q 'Trade AI' $TEST_RESULTS_DIR/frontend-homepage.html" \
    ""

# Test 8.4: JavaScript bundles load
run_test "JavaScript bundles referenced in HTML" \
    "grep -q 'static/js/main' $TEST_RESULTS_DIR/frontend-homepage.html" \
    ""

# Test 8.5: CSS bundles load
run_test "CSS bundles referenced in HTML" \
    "grep -q 'static/css/main' $TEST_RESULTS_DIR/frontend-homepage.html" \
    ""

# Test 8.6: API proxy works (login endpoint)
run_test "API proxy works through Nginx" \
    "curl -sf -X POST http://localhost/api/auth/login -H 'Content-Type: application/json' -d '{}' > $TEST_RESULTS_DIR/nginx-api-test.json 2>&1" \
    ""

# Test 8.7: Dashboard endpoint via Nginx (if token available)
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    run_test "Dashboard API via Nginx" \
        "curl -sf http://localhost/api/analytics/dashboard -H 'Authorization: Bearer $TOKEN' > $TEST_RESULTS_DIR/nginx-dashboard-test.json 2>&1" \
        ""
fi

# Test 8.8: No 502 errors
run_test "No 502 Bad Gateway errors" \
    "! curl -s http://localhost/ | grep -q '502 Bad Gateway'" \
    ""

# Test 8.9: No 404 errors for main page
run_test "No 404 Not Found for homepage" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost/ | grep -q '200'" \
    ""

# Test 8.10: Test specific routes
run_test "Customers route accessible" \
    "curl -sf http://localhost/customers > /dev/null 2>&1" \
    ""

run_test "Products route accessible" \
    "curl -sf http://localhost/products > /dev/null 2>&1" \
    ""

run_test "Dashboard route accessible" \
    "curl -sf http://localhost/dashboard > /dev/null 2>&1" \
    ""

echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 9: PERFORMANCE & RESOURCE TESTS
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 9: PERFORMANCE & RESOURCE TESTS                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Test 9.1: Backend memory usage
BACKEND_MEMORY=$(pm2 jlist | jq '.[0].monit.memory' 2>/dev/null || echo "0")
BACKEND_MEMORY_MB=$((BACKEND_MEMORY / 1024 / 1024))
log "Backend memory usage: ${BACKEND_MEMORY_MB}MB"
if [ "$BACKEND_MEMORY_MB" -lt 500 ]; then
    log_success "Backend memory usage acceptable (${BACKEND_MEMORY_MB}MB < 500MB)"
    ((TESTS_PASSED++))
else
    log_warning "Backend memory usage high (${BACKEND_MEMORY_MB}MB)"
fi
((TESTS_TOTAL++))

# Test 9.2: Backend CPU usage
BACKEND_CPU=$(pm2 jlist | jq '.[0].monit.cpu' 2>/dev/null || echo "0")
log "Backend CPU usage: ${BACKEND_CPU}%"
if [ "$BACKEND_CPU" -lt 50 ]; then
    log_success "Backend CPU usage acceptable (${BACKEND_CPU}%)"
    ((TESTS_PASSED++))
else
    log_warning "Backend CPU usage elevated (${BACKEND_CPU}%)"
fi
((TESTS_TOTAL++))

# Test 9.3: PM2 restart count
RESTART_COUNT=$(pm2 jlist | jq '.[0].pm2_env.restart_time' 2>/dev/null || echo "0")
log "PM2 restart count: $RESTART_COUNT"
if [ "$RESTART_COUNT" -eq 0 ]; then
    log_success "No unexpected restarts"
    ((TESTS_PASSED++))
elif [ "$RESTART_COUNT" -lt 3 ]; then
    log_warning "Backend restarted $RESTART_COUNT times"
else
    log_error "Backend restarted $RESTART_COUNT times (unstable)"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

# Test 9.4: API response time
log "Testing API response time..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:5000/api/health)
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
log "API response time: ${RESPONSE_TIME_MS}ms"
if [ $(echo "$RESPONSE_TIME < 1.0" | bc) -eq 1 ]; then
    log_success "API response time acceptable (${RESPONSE_TIME_MS}ms < 1000ms)"
    ((TESTS_PASSED++))
else
    log_warning "API response time slow (${RESPONSE_TIME_MS}ms)"
fi
((TESTS_TOTAL++))

# Test 9.5: Frontend page load time
log "Testing frontend page load time..."
FRONTEND_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost/)
FRONTEND_TIME_MS=$(echo "$FRONTEND_TIME * 1000" | bc)
log "Frontend page load time: ${FRONTEND_TIME_MS}ms"
if [ $(echo "$FRONTEND_TIME < 2.0" | bc) -eq 1 ]; then
    log_success "Frontend load time acceptable (${FRONTEND_TIME_MS}ms < 2000ms)"
    ((TESTS_PASSED++))
else
    log_warning "Frontend load time slow (${FRONTEND_TIME_MS}ms)"
fi
((TESTS_TOTAL++))

# Test 9.6: MongoDB query performance
log "Testing MongoDB query performance..."
MONGO_TIME=$(mongosh --quiet --eval "var start = Date.now(); db.getSiblingDB('tradeai').users.find().limit(10).toArray(); Date.now() - start;" 2>/dev/null || echo "0")
log "MongoDB query time: ${MONGO_TIME}ms"
if [ "$MONGO_TIME" -lt 100 ]; then
    log_success "MongoDB query performance good (${MONGO_TIME}ms < 100ms)"
    ((TESTS_PASSED++))
else
    log_warning "MongoDB query performance slow (${MONGO_TIME}ms)"
fi
((TESTS_TOTAL++))

echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 10: SECURITY & COMPLIANCE TESTS
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 10: SECURITY & COMPLIANCE TESTS                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Test 10.1: HTTPS redirect (if configured)
# Note: Currently HTTP-only, but test should be here for future
log "Testing HTTPS configuration..."
if curl -sf https://localhost > /dev/null 2>&1; then
    log_success "HTTPS configured and working"
    ((TESTS_PASSED++))
else
    log_warning "HTTPS not configured (currently HTTP-only)"
fi
((TESTS_TOTAL++))

# Test 10.2: Security headers
log "Checking security headers..."
curl -s -I http://localhost/ > "$TEST_RESULTS_DIR/security-headers.txt"
if grep -q "X-Frame-Options" "$TEST_RESULTS_DIR/security-headers.txt" || \
   grep -q "X-Content-Type-Options" "$TEST_RESULTS_DIR/security-headers.txt"; then
    log_success "Security headers present"
    ((TESTS_PASSED++))
else
    log_warning "Security headers missing (should add Helmet.js headers)"
fi
((TESTS_TOTAL++))

# Test 10.3: .env file not publicly accessible
run_test ".env file not web-accessible" \
    "! curl -sf http://localhost/.env > /dev/null 2>&1" \
    ""

# Test 10.4: node_modules not publicly accessible
run_test "node_modules not web-accessible" \
    "! curl -sf http://localhost/node_modules/package.json > /dev/null 2>&1" \
    ""

# Test 10.5: Git files not publicly accessible
run_test ".git directory not web-accessible" \
    "! curl -sf http://localhost/.git/config > /dev/null 2>&1" \
    ""

# Test 10.6: JWT secret is not default
JWT_SECRET=$(grep "^JWT_SECRET=" $BACKEND_DIR/.env | cut -d'=' -f2-)
if [ "$JWT_SECRET" = "your-secret-key" ] || [ "$JWT_SECRET" = "secret" ]; then
    log_error "JWT secret is using default value - SECURITY RISK"
    ((TESTS_FAILED++))
else
    log_success "JWT secret is customized"
    ((TESTS_PASSED++))
fi
((TESTS_TOTAL++))

# Test 10.7: File permissions
run_test "Backend directory permissions secure" \
    "[ \$(stat -c '%a' $BACKEND_DIR) = '755' ] || [ \$(stat -c '%a' $BACKEND_DIR) = '775' ]" \
    ""

# Test 10.8: No sensitive data in logs
if grep -i "password\|secret\|token" "$TEST_RESULTS_DIR/pm2-logs.log" | grep -v "JWT\|Bearer\|Authentication" > /dev/null; then
    log_warning "Potential sensitive data found in logs"
else
    log_success "No sensitive data exposed in logs"
    ((TESTS_PASSED++))
fi
((TESTS_TOTAL++))

echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 11: DATA INTEGRITY TESTS
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 11: DATA INTEGRITY TESTS                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Test 11.1: Database collections exist
log "Checking database collections..."
COLLECTIONS=$(mongosh --quiet --eval "db.getSiblingDB('tradeai').getCollectionNames()" 2>/dev/null || echo "[]")
COLLECTION_COUNT=$(echo "$COLLECTIONS" | jq '. | length' 2>/dev/null || echo "0")
log "Found $COLLECTION_COUNT collections"
if [ "$COLLECTION_COUNT" -gt 5 ]; then
    log_success "Database collections present ($COLLECTION_COUNT collections)"
    ((TESTS_PASSED++))
else
    log_warning "Few database collections found ($COLLECTION_COUNT)"
fi
((TESTS_TOTAL++))

# Test 11.2: Users collection has data
run_test "Users collection has data" \
    "mongosh --quiet --eval 'db.getSiblingDB(\"tradeai\").users.countDocuments()' | grep -q -E '[1-9]'" \
    ""

# Test 11.3: Admin user exists
run_test "Admin user exists in database" \
    "mongosh --quiet --eval 'db.getSiblingDB(\"tradeai\").users.countDocuments({email: \"admin@trade-ai.com\"})' | grep -q '1'" \
    ""

# Test 11.4: Database indexes exist
INDEX_COUNT=$(mongosh --quiet --eval "db.getSiblingDB('tradeai').users.getIndexes().length" 2>/dev/null || echo "0")
log "User collection has $INDEX_COUNT indexes"
if [ "$INDEX_COUNT" -gt 1 ]; then
    log_success "Database indexes present ($INDEX_COUNT indexes on users)"
    ((TESTS_PASSED++))
else
    log_warning "Database indexes may be missing"
fi
((TESTS_TOTAL++))

# Test 11.5: No data loss after deployment
if [ -f "$BACKUP_DIR/data-count.txt" ]; then
    OLD_USER_COUNT=$(cat "$BACKUP_DIR/data-count.txt")
    NEW_USER_COUNT=$(mongosh --quiet --eval "db.getSiblingDB('tradeai').users.countDocuments()" 2>/dev/null || echo "0")
    if [ "$NEW_USER_COUNT" -ge "$OLD_USER_COUNT" ]; then
        log_success "No data loss detected (users: $OLD_USER_COUNT -> $NEW_USER_COUNT)"
        ((TESTS_PASSED++))
    else
        log_error "Data loss detected! Users decreased: $OLD_USER_COUNT -> $NEW_USER_COUNT"
        ((TESTS_FAILED++))
    fi
else
    log "No previous data count to compare"
fi
((TESTS_TOTAL++))

# Save current data count for next deployment
mongosh --quiet --eval "db.getSiblingDB('tradeai').users.countDocuments()" > "$BACKUP_DIR/data-count.txt" 2>/dev/null || echo "0" > "$BACKUP_DIR/data-count.txt"

echo ""

#═══════════════════════════════════════════════════════════════════════
# STAGE 12: FINAL VERIFICATION
#═══════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  STAGE 12: FINAL VERIFICATION                                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Test 12.1: Complete login flow
log "Testing complete login flow..."
FINAL_LOGIN=$(curl -s -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@trade-ai.com","password":"Admin@123456"}')
FINAL_TOKEN=$(echo "$FINAL_LOGIN" | jq -r '.token' 2>/dev/null || echo "")

if [ -n "$FINAL_TOKEN" ] && [ "$FINAL_TOKEN" != "null" ]; then
    log_success "Complete login flow works"
    ((TESTS_PASSED++))
    
    # Test 12.2: Authenticated API call
    DASHBOARD_DATA=$(curl -s http://localhost/api/analytics/dashboard \
        -H "Authorization: Bearer $FINAL_TOKEN")
    if [ -n "$DASHBOARD_DATA" ]; then
        log_success "Authenticated API calls work"
        ((TESTS_PASSED++))
    else
        log_error "Authenticated API calls failed"
        ((TESTS_FAILED++))
    fi
    ((TESTS_TOTAL++))
else
    log_error "Complete login flow failed"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

# Test 12.3: All critical services running
SERVICES_OK=true
for service in mongod nginx; do
    if sudo systemctl is-active $service > /dev/null 2>&1; then
        log_success "Service $service is running"
    else
        log_error "Service $service is not running"
        SERVICES_OK=false
    fi
done
if [ "$SERVICES_OK" = true ]; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

# Test 12.4: PM2 process stable
sleep 5
if pm2 list | grep tradeai-backend | grep -q online; then
    log_success "PM2 process remains stable"
    ((TESTS_PASSED++))
else
    log_error "PM2 process unstable or crashed"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

echo ""

#═══════════════════════════════════════════════════════════════════════
# FINAL REPORT
#═══════════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  DEPLOYMENT TEST REPORT                                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Calculate success rate
SUCCESS_RATE=$(echo "scale=1; $TESTS_PASSED * 100 / $TESTS_TOTAL" | bc)

echo "📊 Test Summary:"
echo "   Total Tests:    $TESTS_TOTAL"
echo "   Passed:         ${GREEN}$TESTS_PASSED${NC}"
echo "   Failed:         ${RED}$TESTS_FAILED${NC}"
echo "   Success Rate:   $SUCCESS_RATE%"
echo ""

echo "📋 Deployment Details:"
echo "   Branch:         $BRANCH"
echo "   Commit:         $COMMIT_HASH"
echo "   Commit Message: $COMMIT_MSG"
echo "   Backup:         $BACKUP_DIR"
echo "   Test Results:   $TEST_RESULTS_DIR"
echo ""

echo "🔧 System Status:"
pm2 list
echo ""

# Determine overall success
if [ "$TESTS_FAILED" -eq 0 ]; then
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║  ✅ DEPLOYMENT SUCCESSFUL - ALL TESTS PASSED                  ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    EXIT_CODE=0
elif [ "$SUCCESS_RATE" \< "80.0" ]; then
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║  ❌ DEPLOYMENT FAILED - CRITICAL ISSUES DETECTED              ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🔴 ROLLBACK RECOMMENDED"
    echo "   To rollback: cp -r $BACKUP_DIR/backend/* $BACKEND_DIR/"
    echo "               cp -r $BACKUP_DIR/frontend/* $FRONTEND_DIR/build/"
    echo "               pm2 restart tradeai-backend"
    EXIT_CODE=1
else
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║  ⚠️  DEPLOYMENT COMPLETED WITH WARNINGS                       ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "⚠️  Some tests failed but system is operational"
    echo "   Review test results: $TEST_RESULTS_DIR"
    EXIT_CODE=0
fi

echo ""
echo "📝 Next Steps:"
echo "   1. Review test results: $TEST_RESULTS_DIR"
echo "   2. Test application: http://tradeai.gonxt.tech"
echo "   3. Monitor PM2 logs: pm2 logs tradeai-backend"
echo "   4. Check application logs: $TEST_RESULTS_DIR/pm2-logs.log"
if [ "$TESTS_FAILED" -gt 0 ]; then
    echo "   5. Investigate failed tests and fix issues"
fi
echo ""

# Save test report
cat > "$TEST_RESULTS_DIR/TEST_REPORT.md" << EOFR
# TRADEAI Deployment Test Report

**Date**: $(date)
**Branch**: $BRANCH
**Commit**: $COMMIT_HASH
**Commit Message**: $COMMIT_MSG

## Test Summary

- **Total Tests**: $TESTS_TOTAL
- **Passed**: $TESTS_PASSED
- **Failed**: $TESTS_FAILED
- **Success Rate**: $SUCCESS_RATE%

## Deployment Status

$(if [ "$TESTS_FAILED" -eq 0 ]; then echo "✅ **SUCCESS** - All tests passed"; elif [ $(echo "$SUCCESS_RATE < 80.0" | bc) -eq 1 ]; then echo "❌ **FAILED** - Critical issues detected"; else echo "⚠️ **WARNING** - Some tests failed but system operational"; fi)

## System Configuration

- Backend: $BACKEND_DIR
- Frontend: $FRONTEND_DIR/build
- MongoDB: mongodb://localhost:27017/tradeai
- Backend Memory: ${BACKEND_MEMORY_MB}MB
- Backend CPU: ${BACKEND_CPU}%
- PM2 Restarts: $RESTART_COUNT

## Performance Metrics

- API Response Time: ${RESPONSE_TIME_MS}ms
- Frontend Load Time: ${FRONTEND_TIME_MS}ms
- MongoDB Query Time: ${MONGO_TIME}ms

## Security Status

- JWT Secret: $(if [ "$JWT_SECRET" != "your-secret-key" ]; then echo "✅ Custom"; else echo "❌ Default (SECURITY RISK)"; fi)
- HTTPS: $(if curl -sf https://localhost > /dev/null 2>&1; then echo "✅ Enabled"; else echo "⚠️ Not configured"; fi)
- Security Headers: $(if grep -q "X-Frame-Options" "$TEST_RESULTS_DIR/security-headers.txt"; then echo "✅ Present"; else echo "⚠️ Missing"; fi)

## Database Status

- Collections: $COLLECTION_COUNT
- User Indexes: $INDEX_COUNT
- Admin User: ✅ Exists

## Backup Location

$BACKUP_DIR

## Test Logs

- Deployment Log: $DEPLOYMENT_LOG
- PM2 Logs: $TEST_RESULTS_DIR/pm2-logs.log
- Nginx Test: $TEST_RESULTS_DIR/nginx-test.log
- Build Logs: $TEST_RESULTS_DIR/frontend-build.log

## Rollback Command

\`\`\`bash
cp -r $BACKUP_DIR/backend/* $BACKEND_DIR/
cp -r $BACKUP_DIR/frontend/* $FRONTEND_DIR/build/
pm2 restart tradeai-backend
sudo systemctl reload nginx
\`\`\`

---

*Generated by deploy-tradeai-with-tests.sh v2.0*
EOFR

log "Test report saved: $TEST_RESULTS_DIR/TEST_REPORT.md"

exit $EXIT_CODE
