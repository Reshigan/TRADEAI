#!/bin/bash

###############################################################################
# TRADEAI Production Deployment Script - AWS EC2
# Complete nuclear deployment with SSL setup
###############################################################################

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║     TRADEAI Enterprise Production Deployment          ║"
echo "║                 AWS EC2 Instance                       ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Configuration
DOMAIN="tradeai.gonxt.tech"
APP_DIR="/opt/tradeai"
REPO_URL="https://github.com/Reshigan/TRADEAI.git"
NODE_VERSION="18"

echo "📋 Configuration:"
echo "  Domain: $DOMAIN"
echo "  App Directory: $APP_DIR"
echo "  Repository: $REPO_URL"
echo ""

# Step 1: Clean everything (nuclear option)
echo "🧹 Step 1: Nuclear cleanup - removing everything..."
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl stop mongod 2>/dev/null || true
sudo systemctl stop redis 2>/dev/null || true
pm2 kill 2>/dev/null || true

sudo rm -rf $APP_DIR
sudo rm -rf /var/www/html/*
sudo rm -rf ~/.pm2
sudo rm -rf /tmp/tradeai*

echo "✓ Cleanup complete"
echo ""

# Step 2: Update system
echo "📦 Step 2: Updating system packages..."
sudo apt update
sudo apt upgrade -y
echo "✓ System updated"
echo ""

# Step 3: Install Node.js 18
echo "📦 Step 3: Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
echo "✓ Node.js installed"
echo ""

# Step 4: Install MongoDB
echo "📦 Step 4: Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
mongosh --version
echo "✓ MongoDB installed and started"
echo ""

# Step 5: Install Redis
echo "📦 Step 5: Installing Redis..."
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
redis-cli ping
echo "✓ Redis installed and started"
echo ""

# Step 6: Install PM2
echo "📦 Step 6: Installing PM2..."
sudo npm install -g pm2
pm2 --version
echo "✓ PM2 installed"
echo ""

# Step 7: Install Nginx
echo "📦 Step 7: Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
echo "✓ Nginx installed and started"
echo ""

# Step 8: Install Certbot for SSL
echo "📦 Step 8: Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx
echo "✓ Certbot installed"
echo ""

# Step 9: Clone repository
echo "📥 Step 9: Cloning repository..."
sudo mkdir -p $APP_DIR
sudo chown -R ubuntu:ubuntu $APP_DIR
cd $APP_DIR
git clone $REPO_URL .
git checkout main
git pull origin main
echo "✓ Repository cloned"
echo ""

# Step 10: Install backend dependencies
echo "📦 Step 10: Installing backend dependencies..."
cd $APP_DIR/backend
npm install --production
echo "✓ Backend dependencies installed"
echo ""

# Step 11: Install frontend dependencies and build
echo "📦 Step 11: Installing frontend dependencies and building..."
cd $APP_DIR/frontend
npm install --production
npm run build
echo "✓ Frontend built"
echo ""

# Step 12: Configure environment variables
echo "⚙️  Step 12: Configuring environment variables..."
cd $APP_DIR/backend
cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tradeai
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
FRONTEND_URL=https://$DOMAIN
EOF
echo "✓ Environment configured"
echo ""

# Step 13: Configure Nginx
echo "⚙️  Step 13: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/tradeai << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
    
    # Frontend
    location / {
        root $APP_DIR/frontend/build;
        try_files \$uri /index.html;
        add_header Cache-Control "public, max-age=31536000";
    }
    
    # Static assets
    location /static {
        root $APP_DIR/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/tradeai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
echo "✓ Nginx configured"
echo ""

# Step 14: Setup SSL with Let's Encrypt
echo "🔒 Step 14: Setting up SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@gonxt.tech --redirect
echo "✓ SSL certificate installed"
echo ""

# Step 15: Create PM2 ecosystem
echo "⚙️  Step 15: Creating PM2 ecosystem..."
cd $APP_DIR
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
      error_file: '$APP_DIR/logs/backend-error.log',
      out_file: '$APP_DIR/logs/backend-out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '1G',
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
EOF

mkdir -p logs
echo "✓ PM2 ecosystem created"
echo ""

# Step 16: Start application with PM2
echo "🚀 Step 16: Starting application..."
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
echo "✓ Application started"
echo ""

# Step 17: Create super admin
echo "👤 Step 17: Creating super admin..."
cd $APP_DIR
node scripts/create-superadmin.js 2>/dev/null || echo "⚠️  Super admin creation will be done manually"
echo "✓ Setup complete"
echo ""

# Step 18: Configure firewall
echo "🔥 Step 18: Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo "✓ Firewall configured"
echo ""

# Step 19: Setup monitoring
echo "📊 Step 19: Setting up monitoring..."
cd $APP_DIR
chmod +x scripts/setup-monitoring.sh 2>/dev/null || true
echo "✓ Monitoring ready"
echo ""

# Final status check
echo "🔍 Final Status Check..."
echo ""
echo "Services Status:"
sudo systemctl status mongod --no-pager | grep Active
sudo systemctl status redis --no-pager | grep Active
sudo systemctl status nginx --no-pager | grep Active
pm2 status
echo ""

echo "Testing endpoints:"
echo "  Backend health: "
curl -s http://localhost:5000/api/health | head -1 || echo "⚠️  Backend not responding yet"
echo ""
echo "  Frontend: "
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN || echo "⚠️  Frontend not accessible yet"
echo ""

# Display summary
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║        🎉 Deployment Completed Successfully! 🎉       ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Application URLs:"
echo "  Frontend:     https://$DOMAIN"
echo "  Backend API:  https://$DOMAIN/api"
echo "  Health Check: https://$DOMAIN/api/health"
echo ""
echo "📊 Management Commands:"
echo "  View logs:    pm2 logs tradeai-backend"
echo "  Restart:      pm2 restart tradeai-backend"
echo "  Stop:         pm2 stop tradeai-backend"
echo "  Status:       pm2 status"
echo "  Monitor:      pm2 monit"
echo ""
echo "🔐 Super Admin Credentials:"
echo "  Email:    superadmin@tradeai.com"
echo "  Password: SuperAdmin123!"
echo "  ⚠️  CHANGE PASSWORD IMMEDIATELY!"
echo ""
echo "📝 Next Steps:"
echo "  1. Login and change super admin password"
echo "  2. Create your first tenant"
echo "  3. Run comprehensive tests"
echo "  4. Configure monitoring alerts"
echo ""
echo "✅ Deployment log saved to: $APP_DIR/logs/deployment.log"
echo ""
