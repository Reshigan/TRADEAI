#!/bin/bash
set -e

echo "=================================================="
echo "🚀 TradeAI Production Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DEPLOY_USER="ubuntu"
DEPLOY_DIR="/opt/tradeai"
REPO_URL="https://github.com/Reshigan/TRADEAI.git"
DOMAIN="tradeai.gonxt.tech"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Check if running as correct user
if [ "$USER" != "$DEPLOY_USER" ]; then
    print_error "This script must be run as $DEPLOY_USER user"
    exit 1
fi

# Step 1: Fix MongoDB configuration
print_info "Step 1: Configuring MongoDB..."
sudo systemctl stop mongod || true
sudo mkdir -p /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo mkdir -p /var/log/mongodb
sudo chown -R mongodb:mongodb /var/log/mongodb
sudo systemctl start mongod
sudo systemctl enable mongod
sleep 3
print_status "MongoDB configured and started"

# Step 2: Fix Redis configuration  
print_info "Step 2: Configuring Redis..."
sudo systemctl stop redis-server || true
sudo sed -i 's/^requirepass/#requirepass/g' /etc/redis/redis.conf 2>/dev/null || true
sudo systemctl start redis-server
sudo systemctl enable redis-server
print_status "Redis configured and started"

# Step 3: Install PM2 globally if not installed
print_info "Step 3: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_status "PM2 installed"
else
    print_status "PM2 already installed"
fi

# Step 4: Clone or update repository
print_info "Step 4: Setting up application code..."
if [ -d "$DEPLOY_DIR/.git" ]; then
    cd $DEPLOY_DIR
    git fetch origin
    git reset --hard origin/main
    git pull origin main
    print_status "Repository updated"
else
    sudo rm -rf $DEPLOY_DIR
    sudo mkdir -p $DEPLOY_DIR
    sudo chown $DEPLOY_USER:$DEPLOY_USER $DEPLOY_DIR
    git clone $REPO_URL $DEPLOY_DIR
    cd $DEPLOY_DIR
    print_status "Repository cloned"
fi

# Step 5: Setup backend
print_info "Step 5: Setting up backend..."
cd $DEPLOY_DIR/backend

# Create production environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DATABASE_MODE=real
MOCK_DATA_ENABLED=false
MONGODB_URI=mongodb://localhost:27017/tradeai
MONGO_DATABASE=tradeai
JWT_SECRET=e9690c1f68235ef648f7daa94acbc31f948b48fb015c60c82ea61580c4ab608c989baa2c1231e3e81b8f252bb018ad1fd85c3e2ebb7033aab2826aadbe9fe036
JWT_EXPIRE=24h
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=a202603a7b3ed6662c12c3420f6dae329dcaf08e6220d144c99bba10f12cbc8dd42bf7375d74b383b3e2deac25778725703e2291960484fd11a8383bbc3ef739
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=91edbe864af630bc5f51099693bab722867bf59f8d89974966e546a5908fbd8cefb47a21c26c55bf1cb3b620e931cd32ae0c2eecb16bc6f3c1f6abdc85821b27
REDIS_ENABLED=false
BCRYPT_ROUNDS=12
API_BASE_URL=https://tradeai.gonxt.tech/api
FRONTEND_URL=https://tradeai.gonxt.tech
CORS_ORIGIN=https://tradeai.gonxt.tech,http://localhost:5173
LOG_LEVEL=info
ENVEOF

print_status "Environment configuration created"

# Install dependencies
npm install --production
print_status "Backend dependencies installed"

# Seed database
print_info "Seeding database..."
node seed-production-demo.js
print_status "Database seeded"

# Stop existing PM2 processes
pm2 delete all 2>/dev/null || true
pm2 flush

# Start backend with PM2
pm2 start server-production.js --name tradeai-backend --time
pm2 save
print_status "Backend started with PM2"

# Step 6: Setup frontend
print_info "Step 6: Building frontend..."
cd $DEPLOY_DIR/frontend-v2

# Create frontend environment
cat > .env.production << FENVEOF
VITE_API_URL=https://tradeai.gonxt.tech/api
VITE_APP_NAME=TradeAI
VITE_ENABLE_ANALYTICS=true
FENVEOF

# Install dependencies and build
npm install
npm run build
print_status "Frontend built successfully"

# Deploy frontend
sudo mkdir -p /var/www/tradeai
sudo cp -r build/* /var/www/tradeai/
sudo chown -R www-data:www-data /var/www/tradeai
print_status "Frontend deployed"

# Step 7: Configure Nginx
print_info "Step 7: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/tradeai > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name tradeai.gonxt.tech;
    
    location / {
        root /var/www/tradeai;
        try_files $uri $uri/ /index.html;
    }
    
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
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/tradeai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
print_status "Nginx configured"

# Step 8: Setup SSL
print_info "Step 8: Setting up SSL..."
if ! command -v certbot &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect || print_error "SSL setup failed"

echo ""
echo "=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo "🌐 URL: https://$DOMAIN"
echo "🔧 API: https://$DOMAIN/api"
echo "📝 Credentials: admin@tradeai.com / admin123"
echo "=================================================="
pm2 list
