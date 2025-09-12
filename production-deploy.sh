#!/bin/bash

# TRADEAI Production Deployment Script
# ====================================
# This script deploys the TRADEAI platform to your production server
# Run this script on your production server as root or with sudo privileges

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 TRADEAI Production Deployment${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${YELLOW}⚠️  Running as root. This is recommended for production deployment.${NC}"
else
   echo -e "${YELLOW}⚠️  Not running as root. You may need sudo privileges for some operations.${NC}"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Docker if not present
if ! command_exists docker; then
    echo -e "${YELLOW}📦 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker is already installed${NC}"
fi

# Install Docker Compose if not present
if ! command_exists docker-compose; then
    echo -e "${YELLOW}📦 Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker Compose is already installed${NC}"
fi

# Install Git if not present
if ! command_exists git; then
    echo -e "${YELLOW}📦 Installing Git...${NC}"
    apt-get update
    apt-get install -y git
    echo -e "${GREEN}✅ Git installed successfully${NC}"
else
    echo -e "${GREEN}✅ Git is already installed${NC}"
fi

# Use current directory for deployment
DEPLOY_DIR=$(pwd)
echo -e "${BLUE}📁 Using current directory for deployment: $DEPLOY_DIR${NC}"

# Check if we're in a TRADEAI repository
if [ -d ".git" ]; then
    # Check if it's the TRADEAI repository
    REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
    if [[ "$REPO_URL" == *"TRADEAI"* ]]; then
        echo -e "${BLUE}🔄 Updating existing TRADEAI repository...${NC}"
        git fetch origin
        git reset --hard origin/main
    else
        echo -e "${RED}❌ Current directory contains a different git repository${NC}"
        echo -e "${YELLOW}Please navigate to your TRADEAI repository directory or clone it first:${NC}"
        echo -e "${BLUE}git clone https://github.com/Reshigan/TRADEAI.git${NC}"
        echo -e "${BLUE}cd TRADEAI${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Current directory is not a git repository${NC}"
    echo -e "${YELLOW}Please clone the TRADEAI repository first:${NC}"
    echo -e "${BLUE}git clone https://github.com/Reshigan/TRADEAI.git${NC}"
    echo -e "${BLUE}cd TRADEAI${NC}"
    exit 1
fi

# Make scripts executable
chmod +x production/deploy.sh
chmod +x production/backup.sh
chmod +x production/restore.sh

# Copy production environment files
echo -e "${BLUE}⚙️  Setting up production environment...${NC}"
cp production/.env.production .env
cp production/.env.frontend.production frontend/.env
cp production/.env.backend.production backend/.env

# Generate secure passwords and secrets
echo -e "${YELLOW}🔐 Generating secure credentials...${NC}"

# Generate random passwords (using only alphanumeric characters to avoid sed issues)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/\n" | tr -cd '[:alnum:]' | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/\n" | tr -cd '[:alnum:]' | cut -c1-64)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/\n" | tr -cd '[:alnum:]' | cut -c1-25)
ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/\n" | tr -cd '[:alnum:]' | cut -c1-32)

# Update environment files with generated passwords using | as delimiter
sed -i "s|your_secure_db_password_here|$DB_PASSWORD|g" .env
sed -i "s|your_jwt_secret_key_here|$JWT_SECRET|g" .env
sed -i "s|your_redis_password_here|$REDIS_PASSWORD|g" .env
sed -i "s|your_encryption_key_here|$ENCRYPTION_KEY|g" .env

sed -i "s|your_secure_db_password_here|$DB_PASSWORD|g" backend/.env
sed -i "s|your_jwt_secret_key_here|$JWT_SECRET|g" backend/.env
sed -i "s|your_redis_password_here|$REDIS_PASSWORD|g" backend/.env
sed -i "s|your_encryption_key_here|$ENCRYPTION_KEY|g" backend/.env

# Get server IP for configuration
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo -e "${BLUE}🌐 Detected server IP: $SERVER_IP${NC}"

# Update environment files with server IP
sed -i "s|your_server_ip_here|$SERVER_IP|g" .env
sed -i "s|your_server_ip_here|$SERVER_IP|g" frontend/.env
sed -i "s|your_server_ip_here|$SERVER_IP|g" backend/.env

# Create data directories
echo -e "${BLUE}📁 Creating data directories...${NC}"
mkdir -p data/mongodb
mkdir -p data/redis
mkdir -p data/uploads
mkdir -p data/backups
mkdir -p logs
mkdir -p backups/mongodb
mkdir -p backups/redis
mkdir -p backups/backend

# Set proper permissions
chown -R 1000:1000 data/
chown -R 1000:1000 logs/

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.production.yml down --remove-orphans || true

# Pull latest images
echo -e "${BLUE}📥 Pulling latest Docker images...${NC}"
docker-compose -f docker-compose.production.yml pull

# Build and start services
echo -e "${BLUE}🏗️  Building and starting services...${NC}"
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Check service health
echo -e "${BLUE}🏥 Checking service health...${NC}"
docker-compose -f docker-compose.production.yml ps

# Run database migrations and seed data
echo -e "${BLUE}🗄️  Setting up database...${NC}"
docker-compose -f docker-compose.production.yml exec -T backend npm run migrate
docker-compose -f docker-compose.production.yml exec -T backend npm run seed:production

# Setup SSL certificate (Let's Encrypt)
echo -e "${YELLOW}🔒 SSL Certificate Setup${NC}"
echo -e "${BLUE}To enable HTTPS, run the following commands after deployment:${NC}"
echo -e "${YELLOW}1. Install Certbot:${NC}"
echo "   apt-get install -y certbot python3-certbot-nginx"
echo -e "${YELLOW}2. Get SSL certificate (replace your-domain.com):${NC}"
echo "   certbot --nginx -d your-domain.com"
echo -e "${YELLOW}3. Update nginx configuration to use SSL${NC}"

# Display deployment information
echo ""
echo -e "${GREEN}🎉 TRADEAI Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}📊 Service URLs:${NC}"
echo -e "   Frontend: http://$SERVER_IP:3000"
echo -e "   Backend API: http://$SERVER_IP:5000"
echo -e "   Admin Panel: http://$SERVER_IP:3000/admin"
echo ""
echo -e "${BLUE}🔐 Default Admin Credentials:${NC}"
echo -e "   Email: admin@gonxt.com"
echo -e "   Password: Admin123!"
echo ""
echo -e "${BLUE}🏢 Test Company:${NC}"
echo -e "   Company: GONXT"
echo -e "   8 role-based test accounts available"
echo ""
echo -e "${BLUE}📁 Important Directories:${NC}"
echo -e "   Deployment: $DEPLOY_DIR"
echo -e "   Data: $DEPLOY_DIR/data"
echo -e "   Logs: $DEPLOY_DIR/logs"
echo -e "   Backups: $DEPLOY_DIR/data/backups"
echo ""
echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo -e "   View logs: docker-compose -f docker-compose.production.yml logs -f"
echo -e "   Restart: docker-compose -f docker-compose.production.yml restart"
echo -e "   Stop: docker-compose -f docker-compose.production.yml down"
echo -e "   Backup: ./production/backup.sh"
echo -e "   Update: git pull && docker-compose -f docker-compose.production.yml up -d --build"
echo ""
echo -e "${YELLOW}⚠️  Security Reminders:${NC}"
echo -e "   1. Change default admin password immediately"
echo -e "   2. Configure firewall (UFW recommended)"
echo -e "   3. Set up SSL certificate for HTTPS"
echo -e "   4. Configure regular backups"
echo -e "   5. Monitor logs regularly"
echo ""
echo -e "${GREEN}✅ TRADEAI is now running in production mode!${NC}"

# Save deployment info
cat > deployment-info.txt << EOF
TRADEAI Production Deployment
============================
Deployment Date: $(date)
Server IP: $SERVER_IP
Deployment Directory: $DEPLOY_DIR

Service URLs:
- Frontend: http://$SERVER_IP:3000
- Backend API: http://$SERVER_IP:5000
- Admin Panel: http://$SERVER_IP:3000/admin

Default Admin Credentials:
- Email: admin@gonxt.com
- Password: Admin123!

Generated Passwords (KEEP SECURE):
- Database Password: $DB_PASSWORD
- JWT Secret: $JWT_SECRET
- Redis Password: $REDIS_PASSWORD
- Encryption Key: $ENCRYPTION_KEY

Management Commands:
- View logs: docker-compose -f docker-compose.production.yml logs -f
- Restart: docker-compose -f docker-compose.production.yml restart
- Stop: docker-compose -f docker-compose.production.yml down
- Backup: ./production/backup.sh
- Update: git pull && docker-compose -f docker-compose.production.yml up -d --build
EOF

echo -e "${GREEN}📄 Deployment information saved to: deployment-info.txt${NC}"
echo -e "${RED}🔒 Keep deployment-info.txt secure - it contains sensitive passwords!${NC}"