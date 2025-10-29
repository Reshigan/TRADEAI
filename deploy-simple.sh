#!/bin/bash
###############################################################################
# TRADEAI Simple Production Deployment Script
# Server: tradeai.gonxt.tech (3.10.212.143)
###############################################################################

set -e
cd /tmp

DOMAIN="tradeai.gonxt.tech"
APP_DIR="/var/www/tradeai"

echo "========================================="
echo "TRADEAI Simplified Deployment"
echo "========================================="

# Stop existing services
echo "1. Stopping existing services..."
sudo systemctl stop nginx 2>/dev/null || true
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Create app directory
echo "2. Creating application directory..."
sudo mkdir -p ${APP_DIR}
sudo chown -R ubuntu:ubuntu ${APP_DIR}

# Copy files
echo "3. Copying application files..."
sudo cp -r /tmp/backend ${APP_DIR}/
sudo cp -r /tmp/frontend ${APP_DIR}/
sudo chown -R ubuntu:ubuntu ${APP_DIR}

# Install backend dependencies
echo "4. Installing backend dependencies..."
cd ${APP_DIR}/backend
npm install --production 2>&1 | tail -5

# Build frontend
echo "5. Building frontend..."
cd ${APP_DIR}/frontend
npm install --production 2>&1 | tail -5
npm run build 2>&1 | tail -5

# Configure environment
echo "6. Configuring environment..."
cat > ${APP_DIR}/backend/.env << EOF
NODE_ENV=production
PORT=5000
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/tradeai
DB_NAME=tradeai
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=7200000
CORS_ORIGIN=https://${DOMAIN},https://www.${DOMAIN},http://${DOMAIN}
HTTPS_ENABLED=false
LOG_LEVEL=info
LOG_DIR=${APP_DIR}/backend/logs
EOF

# Start MongoDB
echo "7. Starting MongoDB..."
sudo systemctl start mongod || true
sleep 3

# Configure PM2
echo "8. Starting backend with PM2..."
cd ${APP_DIR}/backend
cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'tradeai-backend',
    script: 'server-production.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOFPM2

pm2 start ecosystem.config.js
pm2 save
sleep 3

# Configure Nginx (HTTP only for now)
echo "9. Configuring Nginx..."
sudo tee /etc/nginx/sites-available/tradeai > /dev/null << 'EOFNGINX'
server {
    listen 80;
    listen [::]:80;
    server_name tradeai.gonxt.tech www.tradeai.gonxt.tech;

    client_max_body_size 100M;

    # API Proxy
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
    }

    # Frontend
    location / {
        root /var/www/tradeai/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
EOFNGINX

sudo ln -sf /etc/nginx/sites-available/tradeai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

echo "10. Checking status..."
pm2 list
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "========================================="
echo "✓ Deployment Complete!"
echo "========================================="
echo "URL: http://${DOMAIN}"
echo "API: http://${DOMAIN}/api/health"
echo ""
echo "Credentials:"
echo "  Email: admin@trade-ai.com"
echo "  Password: Admin@123456"
echo ""
echo "To add SSL later, run:"
echo "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "========================================="
