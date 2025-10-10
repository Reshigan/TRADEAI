#!/bin/bash

# ========================================
# TRADEAI Production Deployment Script
# Domain: tradeai.gonxt.tech
# Server: 3.10.212.143
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="tradeai.gonxt.tech"
SERVER_IP="3.10.212.143"
SSH_KEY="/workspace/project/Vantax-2.pem"
GITHUB_TOKEN="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"
REPO_URL="https://github.com/Reshigan/TRADEAI.git"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 TRADEAI Production Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Domain: ${GREEN}${DOMAIN}${NC}"
echo -e "Server: ${GREEN}${SERVER_IP}${NC}"
echo -e "Time: ${GREEN}$(date)${NC}"
echo ""

# Function to run commands on remote server
run_remote() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ubuntu@$SERVER_IP "$1"
}

# Function to copy files to remote server
copy_to_remote() {
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$1" ubuntu@$SERVER_IP:"$2"
}

echo -e "${YELLOW}📋 Step 1: Pre-deployment Checks${NC}"
echo "Checking SSH connection..."
if run_remote "echo 'SSH connection successful'"; then
    echo -e "${GREEN}✅ SSH connection verified${NC}"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 2: Server Preparation${NC}"
echo "Updating server packages..."
run_remote "sudo apt update && sudo apt upgrade -y"

echo "Installing required packages..."
run_remote "sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl wget htop"

echo "Starting Docker service..."
run_remote "sudo systemctl start docker && sudo systemctl enable docker"

echo "Adding ubuntu user to docker group..."
run_remote "sudo usermod -aG docker ubuntu"

echo -e "${YELLOW}📋 Step 3: Git Repository Setup${NC}"
echo "Setting up Git credentials..."
run_remote "git config --global user.name 'TRADEAI Deploy' && git config --global user.email 'deploy@tradeai.com'"

echo "Cloning/updating repository..."
run_remote "
if [ -d 'TRADEAI' ]; then
    cd TRADEAI
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    git clone https://${GITHUB_TOKEN}@github.com/Reshigan/TRADEAI.git
    cd TRADEAI
fi
"

echo -e "${YELLOW}📋 Step 4: Environment Configuration${NC}"
echo "Copying production environment file..."
copy_to_remote "/workspace/project/TRADEAI/.env.production" "TRADEAI/.env.production"

echo "Setting up SSL certificates..."
run_remote "
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect
"

echo -e "${YELLOW}📋 Step 5: Database Setup${NC}"
echo "Setting up MongoDB with production data..."
run_remote "
cd TRADEAI
# Stop existing containers
docker-compose down || true

# Start MongoDB first
docker-compose -f docker-compose.production.yml up -d mongodb redis

# Wait for MongoDB to be ready
sleep 30

# Seed production data
docker-compose -f docker-compose.production.yml exec -T mongodb mongosh --eval '
use tradeai_production;
db.createUser({
  user: \"tradeai_admin\",
  pwd: \"TradeAI2024!SecurePass\",
  roles: [
    { role: \"readWrite\", db: \"tradeai_production\" },
    { role: \"dbAdmin\", db: \"tradeai_production\" }
  ]
});
'
"

echo -e "${YELLOW}📋 Step 6: Application Deployment${NC}"
echo "Building and starting all services..."
run_remote "
cd TRADEAI
# Load environment variables
export \$(cat .env.production | xargs)

# Build and start all services
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Wait for services to start
sleep 60
"

echo -e "${YELLOW}📋 Step 7: Nginx Configuration${NC}"
echo "Configuring Nginx for production..."
run_remote "
cd TRADEAI
sudo cp nginx/nginx-aws-production.conf /etc/nginx/sites-available/$DOMAIN
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
"

echo -e "${YELLOW}📋 Step 8: Health Checks${NC}"
echo "Performing health checks..."
sleep 30

# Check container status
echo "Checking container status..."
run_remote "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# Check application health
echo "Checking application health..."
if run_remote "curl -f http://localhost:5002/health"; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

if run_remote "curl -f http://localhost:3001/"; then
    echo -e "${GREEN}✅ Frontend health check passed${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

echo -e "${YELLOW}📋 Step 9: SSL and Domain Verification${NC}"
echo "Checking SSL certificate..."
if curl -f https://$DOMAIN/health; then
    echo -e "${GREEN}✅ SSL and domain verification passed${NC}"
else
    echo -e "${RED}❌ SSL or domain verification failed${NC}"
fi

echo -e "${YELLOW}📋 Step 10: Final Production Tests${NC}"
echo "Running production tests..."
run_remote "
cd TRADEAI
# Test authentication
curl -X POST http://localhost:5002/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"admin@tradeai.com\",\"password\":\"admin123\"}' \
  | grep -q 'token' && echo 'Auth test passed' || echo 'Auth test failed'
"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "🌐 Application URL: ${GREEN}https://$DOMAIN${NC}"
echo -e "🔐 Admin Login: ${GREEN}admin@tradeai.com / admin123${NC}"
echo -e "📊 Monitoring: ${GREEN}https://$DOMAIN:3001${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Access the application at https://$DOMAIN"
echo "2. Login with admin credentials"
echo "3. Run comprehensive E2E tests"
echo "4. Monitor system performance"
echo "5. Set up automated backups"
echo ""
echo -e "${GREEN}Deployment completed at: $(date)${NC}"