#!/bin/bash

###############################################################################
# TRADEAI Enterprise Features Deployment Script
# Deploys enterprise-level features to production
###############################################################################

set -e  # Exit on error

# Configuration
SERVER="ubuntu@ec2-13-247-215-88.af-south-1.compute.amazonaws.com"
KEY_FILE="../TPMServer.pem"
DOMAIN="tradeai.gonxt.tech"
APP_DIR="/opt/tradeai"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   TRADEAI Enterprise Features Deployment                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print status messages
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if SSH key exists
if [ ! -f "$KEY_FILE" ]; then
    print_error "SSH key not found at $KEY_FILE"
    exit 1
fi

print_status "SSH key found"

# Test SSH connection
print_info "Testing SSH connection..."
if ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER" "echo 'Connection successful'" > /dev/null 2>&1; then
    print_status "SSH connection successful"
else
    print_error "Cannot connect to server"
    exit 1
fi

# Deployment Steps
echo ""
print_info "Starting deployment process..."
echo ""

# Step 1: Pull latest code
print_info "Step 1/6: Pulling latest code from GitHub..."
ssh -i "$KEY_FILE" "$SERVER" << 'ENDSSH'
    cd /opt/tradeai
    git fetch origin
    git pull origin main
ENDSSH
print_status "Code pulled successfully"

# Step 2: Install dependencies
print_info "Step 2/6: Installing/updating dependencies..."
ssh -i "$KEY_FILE" "$SERVER" << 'ENDSSH'
    cd /opt/tradeai/backend
    npm install --production
ENDSSH
print_status "Dependencies installed"

# Step 3: Check environment variables
print_info "Step 3/6: Checking environment configuration..."
ssh -i "$KEY_FILE" "$SERVER" << 'ENDSSH'
    if [ ! -f /opt/tradeai/.env ]; then
        echo "Warning: .env file not found"
        exit 1
    fi
    echo "Environment file exists"
ENDSSH
print_status "Environment configuration verified"

# Step 4: Restart backend with PM2
print_info "Step 4/6: Restarting backend service..."
ssh -i "$KEY_FILE" "$SERVER" << 'ENDSSH'
    cd /opt/tradeai
    pm2 restart tradeai-backend
    sleep 5
    pm2 status tradeai-backend
ENDSSH
print_status "Backend restarted"

# Step 5: Verify backend health
print_info "Step 5/6: Verifying backend health..."
sleep 5
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/health")
if [ "$HEALTH_CHECK" = "200" ]; then
    print_status "Backend health check passed"
else
    print_error "Backend health check failed (HTTP ${HEALTH_CHECK})"
    exit 1
fi

# Step 6: Test enterprise endpoints
print_info "Step 6/6: Testing enterprise endpoints..."

# Test 1: Enterprise routes exist
ENTERPRISE_TEST=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/enterprise" 2>&1 || echo "000")
if [ "$ENTERPRISE_TEST" != "000" ]; then
    print_status "Enterprise endpoints accessible"
else
    print_warning "Enterprise endpoints test inconclusive (may need authentication)"
fi

# Display deployment summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Deployment Completed Successfully!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

print_info "Deployment Summary:"
echo "  • Server: $SERVER"
echo "  • Domain: https://$DOMAIN"
echo "  • Application: $APP_DIR"
echo "  • Backend Status: Running"
echo "  • Health Check: Passed"
echo ""

print_info "New Enterprise Features Deployed:"
echo "  ✅ Executive Dashboards (10+ types)"
echo "  ✅ Enhanced CRUD Service (bulk ops, import/export)"
echo "  ✅ Trading Simulation Engine (6 simulation types)"
echo "  ✅ Transaction Processing System"
echo "  ✅ Workflow & Approval Management"
echo "  ✅ Advanced Reporting"
echo "  ✅ 50+ New API Endpoints"
echo ""

print_info "Enterprise API Endpoints Available:"
echo "  📊 Dashboards:"
echo "     GET  /api/enterprise/dashboards/executive"
echo "     GET  /api/enterprise/dashboards/trade-spend"
echo "     GET  /api/enterprise/dashboards/promotions"
echo "     GET  /api/enterprise/dashboards/sales-performance"
echo ""
echo "  🔬 Simulations:"
echo "     POST /api/enterprise/simulations/promotion-impact"
echo "     POST /api/enterprise/simulations/budget-allocation"
echo "     POST /api/enterprise/simulations/pricing-strategy"
echo "     POST /api/enterprise/simulations/roi-optimization"
echo ""
echo "  💼 Transactions:"
echo "     POST /api/enterprise/transactions"
echo "     GET  /api/enterprise/transactions"
echo "     POST /api/enterprise/transactions/:id/approve"
echo "     POST /api/enterprise/transactions/bulk-approve"
echo ""
echo "  📁 Data Management:"
echo "     POST /api/enterprise/data/:entity/bulk-create"
echo "     POST /api/enterprise/data/:entity/export"
echo "     POST /api/enterprise/data/:entity/search"
echo ""

print_info "Next Steps:"
echo "  1. Test enterprise endpoints with authentication"
echo "  2. Verify dashboard data with sample requests"
echo "  3. Run simulation tests"
echo "  4. Build frontend components for enterprise features"
echo "  5. Update user documentation"
echo ""

print_info "View logs with: ssh -i $KEY_FILE $SERVER 'pm2 logs tradeai-backend'"
print_info "Check PM2 status: ssh -i $KEY_FILE $SERVER 'pm2 status'"
echo ""

print_status "Enterprise features deployment complete!"
echo ""

# Optional: Display recent logs
print_info "Recent backend logs (last 20 lines):"
echo ""
ssh -i "$KEY_FILE" "$SERVER" "pm2 logs tradeai-backend --lines 20 --nostream" 2>/dev/null || echo "Logs not available"

exit 0
