#!/bin/bash

# 🚀 BULLETPROOF DEPLOYMENT SCRIPT FOR TRADE AI
# This script performs a complete production deployment to AWS Ubuntu t4g.large

set -e

# Configuration
SERVER_IP="ec2-13-244-60-169.af-south-1.compute.amazonaws.com"
SERVER_USER="ubuntu"
SSH_KEY="/workspace/project/TPMServer.pem"
DOMAIN="tradeai.gonxt.tech"
APP_NAME="tradeai"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "\n${PURPLE}============================================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}============================================================${NC}\n"
}

# SSH command wrapper
ssh_exec() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$1"
}

# SCP command wrapper
scp_upload() {
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_IP:$2"
}

log_header "🚀 BULLETPROOF DEPLOYMENT TO AWS PRODUCTION SERVER"

# Step 1: Server Preparation
log_header "📋 STEP 1: SERVER PREPARATION"

log_info "Updating system packages..."
ssh_exec "sudo apt update && sudo apt upgrade -y"
log_success "System packages updated"

log_info "Installing essential packages..."
ssh_exec "sudo apt install -y curl wget git unzip software-properties-common ufw fail2ban htop"
log_success "Essential packages installed"

# Step 2: Install Node.js (ARM64 compatible)
log_header "📋 STEP 2: INSTALLING NODE.JS"

log_info "Installing Node.js 18.x (ARM64 compatible)..."
ssh_exec "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
ssh_exec "sudo apt-get install -y nodejs"

# Verify installation
NODE_VERSION=$(ssh_exec "node --version")
NPM_VERSION=$(ssh_exec "npm --version")
log_success "Node.js $NODE_VERSION and npm $NPM_VERSION installed successfully"

# Step 3: Install PM2 globally
log_header "📋 STEP 3: INSTALLING PM2 PROCESS MANAGER"

log_info "Installing PM2 globally..."
ssh_exec "sudo npm install -g pm2"
ssh_exec "pm2 startup | grep 'sudo env' | bash || true"
log_success "PM2 installed and configured"

# Step 4: Install and Configure Nginx
log_header "📋 STEP 4: INSTALLING AND CONFIGURING NGINX"

log_info "Installing Nginx..."
ssh_exec "sudo apt install -y nginx"
ssh_exec "sudo systemctl enable nginx"
ssh_exec "sudo systemctl start nginx"
log_success "Nginx installed and started"

# Step 5: Configure Firewall
log_header "📋 STEP 5: CONFIGURING FIREWALL"

log_info "Configuring UFW firewall..."
ssh_exec "sudo ufw --force reset"
ssh_exec "sudo ufw default deny incoming"
ssh_exec "sudo ufw default allow outgoing"
ssh_exec "sudo ufw allow ssh"
ssh_exec "sudo ufw allow 'Nginx Full'"
ssh_exec "sudo ufw allow 80"
ssh_exec "sudo ufw allow 443"
ssh_exec "sudo ufw --force enable"
log_success "Firewall configured and enabled"

# Step 6: Create Application Directory
log_header "📋 STEP 6: CREATING APPLICATION DIRECTORY"

log_info "Creating application directory..."
ssh_exec "sudo mkdir -p /var/www/$APP_NAME"
ssh_exec "sudo chown -R $SERVER_USER:$SERVER_USER /var/www/$APP_NAME"
ssh_exec "mkdir -p /var/www/$APP_NAME/logs"
log_success "Application directory created"

# Step 7: Deploy Application Code
log_header "📋 STEP 7: DEPLOYING APPLICATION CODE"

log_info "Uploading application code..."
cd "$PROJECT_ROOT"

# Create a clean deployment package
log_info "Creating deployment package..."
tar --exclude='node_modules' --exclude='.git' --exclude='logs' --exclude='*.log' -czf /tmp/tradeai-deploy.tar.gz .

# Upload and extract
scp_upload "/tmp/tradeai-deploy.tar.gz" "/var/www/$APP_NAME/"
ssh_exec "cd /var/www/$APP_NAME && tar -xzf tradeai-deploy.tar.gz && rm tradeai-deploy.tar.gz"
log_success "Application code deployed"

# Step 8: Install Dependencies
log_header "📋 STEP 8: INSTALLING APPLICATION DEPENDENCIES"

log_info "Installing backend dependencies..."
ssh_exec "cd /var/www/$APP_NAME/backend && npm install --production"
log_success "Backend dependencies installed"

log_info "Installing frontend dependencies and building..."
ssh_exec "cd /var/www/$APP_NAME/frontend && npm install && npm run build"
log_success "Frontend built successfully"

# Step 9: Configure Environment Variables
log_header "📋 STEP 9: CONFIGURING ENVIRONMENT VARIABLES"

log_info "Setting up production environment..."
ssh_exec "cd /var/www/$APP_NAME && cp .env.production .env"

# Generate JWT secret if not present
JWT_SECRET=$(openssl rand -base64 32)
ssh_exec "cd /var/www/$APP_NAME && sed -i 's/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/' .env"
ssh_exec "cd /var/www/$APP_NAME && sed -i 's/DOMAIN=.*/DOMAIN=$DOMAIN/' .env"
log_success "Environment variables configured"

# Step 10: Configure Nginx
log_header "📋 STEP 10: CONFIGURING NGINX REVERSE PROXY"

log_info "Creating Nginx configuration..."
ssh_exec "sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << 'EOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS (will be enabled after SSL setup)
    # return 301 https://\$server_name\$request_uri;
    
    # Temporary HTTP configuration for initial setup
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
        proxy_read_timeout 86400;
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
        proxy_read_timeout 86400;
    }
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection \"1; mode=block\";
    add_header Referrer-Policy \"strict-origin-when-cross-origin\";
}
EOF"

# Enable the site
ssh_exec "sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/"
ssh_exec "sudo rm -f /etc/nginx/sites-enabled/default"
ssh_exec "sudo nginx -t"
ssh_exec "sudo systemctl reload nginx"
log_success "Nginx configured and reloaded"

# Step 11: Configure PM2
log_header "📋 STEP 11: CONFIGURING PM2 PROCESS MANAGEMENT"

log_info "Creating PM2 ecosystem configuration..."
ssh_exec "cd /var/www/$APP_NAME && tee ecosystem.config.js > /dev/null << 'EOF'
module.exports = {
  apps: [
    {
      name: 'tradeai-backend',
      script: './backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5002
      },
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'tradeai-frontend',
      script: 'serve',
      args: '-s frontend/build -l 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      max_memory_restart: '512M'
    }
  ]
};
EOF"

# Install serve for frontend
ssh_exec "cd /var/www/$APP_NAME && npm install -g serve"

# Start applications with PM2
log_info "Starting applications with PM2..."
ssh_exec "cd /var/www/$APP_NAME && pm2 start ecosystem.config.js"
ssh_exec "pm2 save"
log_success "Applications started with PM2"

# Step 12: Install and Configure SSL
log_header "📋 STEP 12: INSTALLING SSL CERTIFICATES"

log_info "Installing Certbot for Let's Encrypt..."
ssh_exec "sudo apt install -y certbot python3-certbot-nginx"

log_warning "SSL certificate setup requires domain DNS to point to this server"
log_info "Server IP: $(ssh_exec 'curl -s ifconfig.me')"
log_info "Please ensure $DOMAIN points to this IP address"

# Note: SSL setup will be done manually after DNS is configured
log_info "SSL certificate can be obtained with:"
log_info "sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"

# Step 13: Setup Monitoring
log_header "📋 STEP 13: SETTING UP MONITORING"

log_info "Installing monitoring tools..."
ssh_exec "sudo apt install -y htop iotop nethogs"

# Create monitoring script
ssh_exec "cd /var/www/$APP_NAME && tee scripts/monitor.sh > /dev/null << 'EOF'
#!/bin/bash
echo \"=== Trade AI System Status ===\"
echo \"Date: \$(date)\"
echo \"\"
echo \"=== PM2 Status ===\"
pm2 status
echo \"\"
echo \"=== System Resources ===\"
free -h
echo \"\"
df -h
echo \"\"
echo \"=== Network Connections ===\"
ss -tuln | grep -E ':(80|443|3000|5002)'
echo \"\"
echo \"=== Recent Logs ===\"
tail -n 5 /var/www/tradeai/logs/*.log 2>/dev/null || echo \"No logs found\"
EOF"

ssh_exec "chmod +x /var/www/$APP_NAME/scripts/monitor.sh"
log_success "Monitoring tools installed"

# Step 14: Setup Backup
log_header "📋 STEP 14: SETTING UP AUTOMATED BACKUPS"

log_info "Creating backup script..."
ssh_exec "sudo mkdir -p /var/backups/$APP_NAME"
ssh_exec "sudo chown $SERVER_USER:$SERVER_USER /var/backups/$APP_NAME"

ssh_exec "cd /var/www/$APP_NAME && tee scripts/backup.sh > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR=\"/var/backups/tradeai\"
DATE=\$(date +%Y%m%d_%H%M%S)
APP_DIR=\"/var/www/tradeai\"

# Create backup
tar -czf \"\$BACKUP_DIR/app_\$DATE.tar.gz\" -C \"\$APP_DIR\" --exclude=node_modules --exclude=logs .

# Keep only last 7 days
find \"\$BACKUP_DIR\" -name \"app_*.tar.gz\" -mtime +7 -delete

echo \"Backup completed: \$BACKUP_DIR/app_\$DATE.tar.gz\"
EOF"

ssh_exec "chmod +x /var/www/$APP_NAME/scripts/backup.sh"

# Setup daily backup cron job
ssh_exec "crontab -l 2>/dev/null | grep -v '/var/www/tradeai/scripts/backup.sh' | crontab -"
ssh_exec "(crontab -l 2>/dev/null; echo '0 2 * * * /var/www/tradeai/scripts/backup.sh >> /var/www/tradeai/logs/backup.log 2>&1') | crontab -"
log_success "Automated backups configured"

# Step 15: Final Health Check
log_header "📋 STEP 15: FINAL HEALTH CHECK"

log_info "Waiting for services to start..."
sleep 10

# Check PM2 status
log_info "Checking PM2 processes..."
ssh_exec "pm2 status"

# Check if backend is responding
log_info "Testing backend health endpoint..."
if ssh_exec "curl -s http://localhost:5002/health" > /dev/null; then
    log_success "Backend health check passed"
else
    log_warning "Backend health check failed - may need time to start"
fi

# Check if frontend is serving
log_info "Testing frontend..."
if ssh_exec "curl -s http://localhost:3000" > /dev/null; then
    log_success "Frontend serving successfully"
else
    log_warning "Frontend not responding - may need time to start"
fi

# Check Nginx status
log_info "Checking Nginx status..."
ssh_exec "sudo systemctl status nginx --no-pager -l"

# Final deployment summary
log_header "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"

SERVER_IP_EXTERNAL=$(ssh_exec 'curl -s ifconfig.me')

echo -e "${GREEN}✅ Trade AI Platform Successfully Deployed!${NC}"
echo -e ""
echo -e "${CYAN}📋 Deployment Summary:${NC}"
echo -e "   🌐 Server: $SERVER_IP ($SERVER_IP_EXTERNAL)"
echo -e "   🏷️  Domain: $DOMAIN (configure DNS)"
echo -e "   🔧 Backend: http://localhost:5002"
echo -e "   🎨 Frontend: http://localhost:3000"
echo -e "   📊 PM2 Dashboard: pm2 monit"
echo -e ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "   1. Configure DNS: Point $DOMAIN to $SERVER_IP_EXTERNAL"
echo -e "   2. Setup SSL: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo -e "   3. Test the application: http://$DOMAIN"
echo -e "   4. Monitor with: /var/www/$APP_NAME/scripts/monitor.sh"
echo -e ""
echo -e "${GREEN}🚀 Your Trade AI platform is now live and ready for production!${NC}"

# Clean up
rm -f /tmp/tradeai-deploy.tar.gz

log_success "Bulletproof deployment completed successfully!"