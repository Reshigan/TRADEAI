#!/bin/bash

###############################################################################
# TRADEAI Production Deployment Script
# =============================================================================
# This script deploys the complete TRADEAI system to production server
# Including: Database, Backend API, Frontend, SSL Configuration
#
# Server: 3.10.212.143
# Domain: tradeai.gonxt.tech
# SSL: Let's Encrypt
#
# Usage: ./deploy-production.sh
###############################################################################

set -e  # Exit on error

# Configuration
SERVER_IP="3.10.212.143"
SERVER_USER="ubuntu"
PEM_KEY="/workspace/project/Vantax-2.pem"
DOMAIN="tradeai.gonxt.tech"
APP_DIR="/home/ubuntu/tradeai"
GIT_TOKEN="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"
GIT_REPO="https://github.com/Reshigan/TRADEAI.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# SSH command wrapper
ssh_cmd() {
    ssh -o StrictHostKeyChecking=no -i "$PEM_KEY" "${SERVER_USER}@${SERVER_IP}" "$@"
}

# SCP command wrapper
scp_cmd() {
    scp -o StrictHostKeyChecking=no -i "$PEM_KEY" "$@"
}

log_info "Starting TRADEAI Production Deployment..."
log_info "================================================"

# Step 1: Verify SSH Connection
log_info "Step 1: Verifying SSH connection to production server..."
if ssh_cmd "echo 'SSH connection successful'"; then
    log_info "✓ SSH connection verified"
else
    log_error "✗ SSH connection failed"
    exit 1
fi

# Step 2: Update system and install dependencies
log_info "Step 2: Installing system dependencies..."
ssh_cmd "sudo apt-get update && sudo apt-get upgrade -y"
ssh_cmd "sudo apt-get install -y nginx git curl python3 python3-pip python3-venv nodejs npm mongodb certbot python3-certbot-nginx"

# Step 3: Clone or update repository
log_info "Step 3: Cloning/updating TRADEAI repository..."
ssh_cmd "
    if [ -d '$APP_DIR' ]; then
        cd $APP_DIR && git pull origin main
    else
        git clone https://${GIT_TOKEN}@github.com/Reshigan/TRADEAI.git $APP_DIR
    fi
"

# Step 4: Setup MongoDB
log_info "Step 4: Configuring MongoDB..."
ssh_cmd "
    sudo systemctl start mongodb
    sudo systemctl enable mongodb
    mongo --eval 'db.version()'
"

# Step 5: Configure Production Environment Variables
log_info "Step 5: Setting up production environment variables..."
ssh_cmd "cat > $APP_DIR/.env.production << 'EOF'
# Production Environment Variables
NODE_ENV=production
PORT=5002

# Database
MONGODB_URI=mongodb://localhost:27017/tradeai_production
DB_NAME=tradeai_production

# JWT
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRE=7d

# API
API_URL=https://${DOMAIN}
FRONTEND_URL=https://${DOMAIN}

# CORS
CORS_ORIGIN=https://${DOMAIN}

# SSL
SSL_ENABLED=true

# Email (if configured)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Monitoring
ENABLE_MONITORING=true
LOG_LEVEL=info
EOF
"

# Step 6: Deploy Backend
log_info "Step 6: Deploying Backend API..."
ssh_cmd "
    cd $APP_DIR/backend
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    # Initialize database
    python init_db.py
    # Create systemd service
    sudo tee /etc/systemd/system/tradeai-backend.service > /dev/null << 'SERVICE'
[Unit]
Description=TRADEAI Backend API
After=network.target mongodb.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR/backend
Environment=\"PATH=$APP_DIR/backend/venv/bin\"
ExecStart=$APP_DIR/backend/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE
    sudo systemctl daemon-reload
    sudo systemctl enable tradeai-backend
    sudo systemctl restart tradeai-backend
"

# Step 7: Deploy Frontend
log_info "Step 7: Building and deploying Frontend..."
ssh_cmd "
    cd $APP_DIR/frontend
    npm install
    # Create production environment file
    cat > .env.production << 'ENVFILE'
REACT_APP_API_URL=https://${DOMAIN}/api
REACT_APP_ENV=production
ENVFILE
    npm run build
"

# Step 8: Configure Nginx
log_info "Step 8: Configuring Nginx..."
ssh_cmd "sudo tee /etc/nginx/sites-available/tradeai << 'NGINX'
server {
    listen 80;
    server_name ${DOMAIN};
    
    # Redirect HTTP to HTTPS (will be uncommented after SSL setup)
    # return 301 https://\$server_name\$request_uri;
    
    # Frontend
    root $APP_DIR/frontend/build;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files caching
    location /static/ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
}
NGINX
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/tradeai /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl restart nginx
"

# Step 9: Setup SSL with Let's Encrypt
log_info "Step 9: Configuring SSL certificate..."
ssh_cmd "
    sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} --redirect
    sudo systemctl reload nginx
"

# Step 10: Setup firewall
log_info "Step 10: Configuring firewall..."
ssh_cmd "
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
"

# Step 11: Verify deployment
log_info "Step 11: Verifying deployment..."
sleep 5

BACKEND_STATUS=$(ssh_cmd "sudo systemctl is-active tradeai-backend")
NGINX_STATUS=$(ssh_cmd "sudo systemctl is-active nginx")
MONGODB_STATUS=$(ssh_cmd "sudo systemctl is-active mongodb")

log_info "Service Status:"
log_info "  Backend API: $BACKEND_STATUS"
log_info "  Nginx: $NGINX_STATUS"
log_info "  MongoDB: $MONGODB_STATUS"

# Test endpoints
log_info "Testing application endpoints..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}" || echo "000")
log_info "  HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    log_info "✓ Application is responding"
else
    log_warn "⚠ Application may not be responding correctly"
fi

# Step 12: Display deployment information
log_info "================================================"
log_info "🎉 Deployment Complete!"
log_info "================================================"
log_info ""
log_info "Application URLs:"
log_info "  Frontend: https://${DOMAIN}"
log_info "  Backend API: https://${DOMAIN}/api"
log_info ""
log_info "Server Details:"
log_info "  IP: ${SERVER_IP}"
log_info "  Domain: ${DOMAIN}"
log_info "  SSL: Enabled (Let's Encrypt)"
log_info ""
log_info "Login Credentials:"
log_info "  Email: admin@tradeai.com"
log_info "  Password: admin123"
log_info ""
log_info "Service Management:"
log_info "  Backend: sudo systemctl [start|stop|restart|status] tradeai-backend"
log_info "  Nginx: sudo systemctl [start|stop|restart|status] nginx"
log_info "  MongoDB: sudo systemctl [start|stop|restart|status] mongodb"
log_info ""
log_info "Logs:"
log_info "  Backend: sudo journalctl -u tradeai-backend -f"
log_info "  Nginx: sudo tail -f /var/log/nginx/error.log"
log_info ""
log_info "Next Steps:"
log_info "  1. Access the application at: https://${DOMAIN}"
log_info "  2. Run E2E tests: npm run test:e2e:production"
log_info "  3. Monitor logs for any issues"
log_info "  4. Configure backups for MongoDB"
log_info ""
log_info "================================================"
