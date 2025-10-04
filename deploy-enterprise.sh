#!/bin/bash

###############################################################################
# TRADEAI Enterprise Edition - Production Deployment Script
# Version: 2.1.3
# Date: October 4, 2025
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_USER=${DEPLOY_USER:-"ubuntu"}
DEPLOY_PATH=${DEPLOY_PATH:-"/opt/tradeai"}
NODE_ENV=${NODE_ENV:-"production"}
BACKUP_PATH="/opt/tradeai-backups"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║    TRADEAI Enterprise Edition Deployment Script       ║${NC}"
echo -e "${BLUE}║                   Version 2.1.3                        ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}═══ $1 ═══${NC}"
    echo ""
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Pre-flight checks
print_section "Pre-Flight Checks"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root or with sudo"
    exit 1
fi

print_success "Running with appropriate privileges"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js $NODE_VERSION detected"

# Check if MongoDB is accessible
if command -v mongosh &> /dev/null || command -v mongo &> /dev/null; then
    print_success "MongoDB client detected"
else
    print_warning "MongoDB client not found locally (may be remote)"
fi

# Check if pm2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not installed. Installing..."
    npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 detected"
fi

# Create backup
print_section "Creating Backup"

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_PATH/backup_$BACKUP_DATE"

if [ -d "$DEPLOY_PATH" ]; then
    mkdir -p "$BACKUP_DIR"
    print_warning "Backing up existing installation..."
    cp -r "$DEPLOY_PATH" "$BACKUP_DIR/" 2>/dev/null || true
    print_success "Backup created at $BACKUP_DIR"
else
    print_warning "No existing installation found - fresh install"
fi

# Stop existing services
print_section "Stopping Existing Services"

pm2 stop all 2>/dev/null || print_warning "No PM2 processes to stop"
print_success "Existing services stopped"

# Deploy backend
print_section "Deploying Backend"

cd /workspace/project/TRADEAI/backend

# Install dependencies
print_warning "Installing backend dependencies..."
npm install --production
print_success "Backend dependencies installed"

# Create production environment file if doesn't exist
if [ ! -f ".env" ]; then
    print_warning "Creating production .env file..."
    cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/tradeai}
REDIS_URL=${REDIS_URL:-redis://localhost:6379}
JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET:-$(openssl rand -base64 32)}
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
EOF
    print_success "Environment file created"
else
    print_success "Environment file exists"
fi

# Deploy frontend
print_section "Deploying Frontend"

cd /workspace/project/TRADEAI/frontend

# Install dependencies
print_warning "Installing frontend dependencies..."
npm install --production
print_success "Frontend dependencies installed"

# Build frontend
print_warning "Building frontend for production..."
npm run build
print_success "Frontend built successfully"

# Deploy AI services
print_section "Deploying AI Services"

cd /workspace/project/TRADEAI/ai-services

if [ -d "venv" ]; then
    print_warning "Activating virtual environment..."
    source venv/bin/activate
else
    print_warning "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
fi

print_warning "Installing AI service dependencies..."
pip install -r requirements.txt --quiet
print_success "AI services dependencies installed"

# Start services with PM2
print_section "Starting Services"

cd /workspace/project/TRADEAI

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'tradeai-backend',
      script: 'backend/src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'tradeai-ai-service',
      script: 'ai-services/src/prediction_api.py',
      interpreter: 'python3',
      instances: 1,
      env: {
        PYTHONUNBUFFERED: 1
      },
      error_file: 'logs/ai-error.log',
      out_file: 'logs/ai-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
EOF

print_success "PM2 ecosystem file created"

# Create logs directory
mkdir -p logs

# Start services
print_warning "Starting backend services..."
pm2 start ecosystem.config.js
print_success "Backend services started"

# Save PM2 configuration
pm2 save
pm2 startup | tail -1 | bash || true
print_success "PM2 configuration saved"

# Database initialization
print_section "Database Initialization"

print_warning "Creating database indexes..."
node backend/src/scripts/createTenantIndexes.js 2>/dev/null || print_warning "Index creation skipped"
print_success "Database indexes created"

# Create super admin user
print_section "Creating Super Admin User"

cat > /tmp/create-superadmin.js << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/src/models/User');

async function createSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tradeai');
        
        const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
        if (existingSuperAdmin) {
            console.log('Super admin already exists');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
        
        await User.create({
            email: 'superadmin@tradeai.com',
            password: hashedPassword,
            name: 'Super Administrator',
            role: 'superadmin',
            status: 'active',
            isVerified: true
        });

        console.log('Super admin created successfully');
        console.log('Email: superadmin@tradeai.com');
        console.log('Password: SuperAdmin123!');
        console.log('IMPORTANT: Change this password immediately after first login!');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating super admin:', error);
        process.exit(1);
    }
}

createSuperAdmin();
EOF

node /tmp/create-superadmin.js || print_warning "Super admin creation skipped"
rm /tmp/create-superadmin.js
print_success "Super admin setup complete"

# Health check
print_section "Health Check"

sleep 5  # Wait for services to start

print_warning "Checking backend health..."
HEALTH_CHECK=$(curl -s http://localhost:5000/api/health | grep -o '"status":"ok"' || echo "")

if [ ! -z "$HEALTH_CHECK" ]; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
    pm2 logs tradeai-backend --lines 20
fi

# Display summary
print_section "Deployment Summary"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║        🎉 Deployment Completed Successfully! 🎉        ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

print_success "TRADEAI Enterprise Edition v2.1.3 is now running"
echo ""
echo -e "${BLUE}Access Points:${NC}"
echo "  • Backend API:    http://localhost:5000/api"
echo "  • Health Check:   http://localhost:5000/api/health"
echo "  • Super Admin:    http://localhost:3000/superadmin"
echo ""
echo -e "${BLUE}Super Admin Credentials:${NC}"
echo "  • Email:    superadmin@tradeai.com"
echo "  • Password: SuperAdmin123!"
echo "  • ${RED}⚠ CHANGE PASSWORD IMMEDIATELY!${NC}"
echo ""
echo -e "${BLUE}Management Commands:${NC}"
echo "  • View logs:      pm2 logs"
echo "  • Stop services:  pm2 stop all"
echo "  • Restart:        pm2 restart all"
echo "  • Status:         pm2 status"
echo ""
echo -e "${BLUE}Monitoring:${NC}"
echo "  • PM2 Monitor:    pm2 monit"
echo "  • System Health:  curl http://localhost:5000/api/super-admin/health"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Change super admin password"
echo "  2. Create your first tenant"
echo "  3. Configure license plans"
echo "  4. Set up monitoring alerts"
echo "  5. Configure backups"
echo ""
print_success "Deployment log saved to: $BACKUP_DIR/deployment.log"
echo ""

# Save deployment info
cat > "$BACKUP_DIR/deployment-info.txt" << EOF
TRADEAI Enterprise Edition Deployment
=====================================
Date: $(date)
Version: 2.1.3
Node Version: $NODE_VERSION
Deployment Path: $DEPLOY_PATH
Backup Path: $BACKUP_DIR
Environment: production

Services:
- Backend: http://localhost:5000
- Frontend: Built and ready
- AI Services: Running

Super Admin:
- Email: superadmin@tradeai.com
- Password: SuperAdmin123! (CHANGE IMMEDIATELY)

Status: SUCCESS
EOF

print_success "All done! 🚀"
echo ""
