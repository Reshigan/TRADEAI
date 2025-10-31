#!/bin/bash

#########################################################
# TRADEAI Frontend SSL Setup Script
# 
# Deploys frontend to tradeai.gonxt.tech with SSL
# Usage: Run this script ON THE SERVER (after SSH)
#########################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="tradeai.gonxt.tech"
SUBDOMAIN="app.${DOMAIN}"  # We'll use app subdomain for frontend
FRONTEND_DIR="/var/www/tradeai-frontend"
NGINX_AVAILABLE="/etc/nginx/sites-available/tradeai-frontend"
NGINX_ENABLED="/etc/nginx/sites-enabled/tradeai-frontend"
EMAIL="admin@${DOMAIN}"  # Change this to your email

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     TRADEAI Frontend SSL Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo -e "   Domain: ${SUBDOMAIN}"
echo -e "   Directory: ${FRONTEND_DIR}"
echo -e "   SSL: Let's Encrypt (Free)"
echo -e "   Email: ${EMAIL}\n"

read -p "$(echo -e ${YELLOW}Continue with SSL setup? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Setup cancelled${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "\n${BLUE}[1/8] Updating system packages...${NC}"
sudo apt update

# Step 2: Install Nginx
echo -e "\n${BLUE}[2/8] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install nginx -y
    echo -e "${GREEN}✅ Nginx installed${NC}"
else
    echo -e "${GREEN}✅ Nginx already installed${NC}"
fi

# Step 3: Install Certbot
echo -e "\n${BLUE}[3/8] Installing Certbot for SSL...${NC}"
if ! command -v certbot &> /dev/null; then
    sudo apt install certbot python3-certbot-nginx -y
    echo -e "${GREEN}✅ Certbot installed${NC}"
else
    echo -e "${GREEN}✅ Certbot already installed${NC}"
fi

# Step 4: Install Node.js (if needed)
echo -e "\n${BLUE}[4/8] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}✅ Node.js installed${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed ($(node -v))${NC}"
fi

# Step 5: Create frontend directory
echo -e "\n${BLUE}[5/8] Setting up frontend directory...${NC}"
sudo mkdir -p ${FRONTEND_DIR}
sudo chown -R $USER:$USER ${FRONTEND_DIR}
echo -e "${GREEN}✅ Directory created: ${FRONTEND_DIR}${NC}"

# Step 6: Deploy frontend files
echo -e "\n${BLUE}[6/8] Deploying frontend files...${NC}"
echo -e "${YELLOW}⚠️  Choose deployment method:${NC}"
echo "   1) Clone from GitHub and build"
echo "   2) I will upload files manually (skip this step)"
echo ""
read -p "Enter choice [1-2]: " DEPLOY_CHOICE

if [ "$DEPLOY_CHOICE" == "1" ]; then
    echo -e "\n${BLUE}Cloning repository...${NC}"
    cd /tmp
    rm -rf TRADEAI
    git clone https://github.com/Reshigan/TRADEAI.git
    cd TRADEAI/frontend-v3
    
    echo -e "\n${BLUE}Installing dependencies...${NC}"
    npm install
    
    echo -e "\n${BLUE}Building production bundle...${NC}"
    npm run build
    
    echo -e "\n${BLUE}Copying files...${NC}"
    sudo cp -r dist/* ${FRONTEND_DIR}/
    
    cd /tmp
    rm -rf TRADEAI
    
    echo -e "${GREEN}✅ Frontend files deployed${NC}"
elif [ "$DEPLOY_CHOICE" == "2" ]; then
    echo -e "${YELLOW}⚠️  Upload your dist/ files to: ${FRONTEND_DIR}${NC}"
    echo "   From your local machine, run:"
    echo "   scp -i /workspace/project/Vantax-2.pem -r dist/* ubuntu@${DOMAIN}:${FRONTEND_DIR}/"
    echo ""
    read -p "Press Enter when files are uploaded..."
else
    echo -e "${RED}❌ Invalid choice${NC}"
    exit 1
fi

# Step 7: Configure Nginx
echo -e "\n${BLUE}[7/8] Configuring Nginx...${NC}"

# Create Nginx config
sudo tee ${NGINX_AVAILABLE} > /dev/null <<EOF
# HTTP Server - Will redirect to HTTPS after SSL is set up
server {
    listen 80;
    listen [::]:80;
    server_name ${SUBDOMAIN};
    
    root ${FRONTEND_DIR};
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/x-javascript
        application/xml
        application/xml+rss
        application/xhtml+xml
        application/x-font-ttf
        application/x-font-opentype
        application/vnd.ms-fontobject
        image/svg+xml;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Optional: Proxy to production server health check
    location /health {
        proxy_pass http://localhost:12000/health;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security - deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo -e "${GREEN}✅ Nginx configuration created${NC}"

# Enable site
sudo ln -sf ${NGINX_AVAILABLE} ${NGINX_ENABLED}

# Test Nginx configuration
echo -e "\n${BLUE}Testing Nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    exit 1
fi

# Restart Nginx
echo -e "\n${BLUE}Restarting Nginx...${NC}"
sudo systemctl restart nginx
sudo systemctl enable nginx

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx failed to start${NC}"
    sudo systemctl status nginx
    exit 1
fi

# Step 8: Setup SSL with Let's Encrypt
echo -e "\n${BLUE}[8/8] Setting up SSL certificate...${NC}"

echo -e "${YELLOW}⚠️  Before proceeding, ensure:${NC}"
echo "   1. DNS A record for ${SUBDOMAIN} points to this server"
echo "   2. Port 80 and 443 are open in firewall"
echo ""

read -p "$(echo -e ${YELLOW}DNS configured correctly? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Please configure DNS first:${NC}"
    echo "   Type: A"
    echo "   Name: app"
    echo "   Value: $(curl -s ifconfig.me)"
    echo "   TTL: 3600"
    echo ""
    echo "Then wait 5-10 minutes for DNS propagation"
    echo "Test with: nslookup ${SUBDOMAIN}"
    exit 0
fi

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo -e "\n${BLUE}Server IP: ${PUBLIC_IP}${NC}"
echo -e "${BLUE}Verifying DNS...${NC}"

DNS_IP=$(dig +short ${SUBDOMAIN} | tail -n1)
if [ "$DNS_IP" == "$PUBLIC_IP" ]; then
    echo -e "${GREEN}✅ DNS is correctly configured${NC}"
else
    echo -e "${RED}❌ DNS mismatch!${NC}"
    echo "   Expected: ${PUBLIC_IP}"
    echo "   Got: ${DNS_IP}"
    echo ""
    echo "Please wait for DNS propagation or fix DNS configuration"
    exit 1
fi

# Install SSL certificate
echo -e "\n${BLUE}Installing SSL certificate...${NC}"
echo -e "${YELLOW}You will be prompted for:${NC}"
echo "   - Email address (for renewal notifications)"
echo "   - Terms of Service agreement"
echo "   - Redirect HTTP to HTTPS (choose Yes)"
echo ""

sudo certbot --nginx -d ${SUBDOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate installed successfully!${NC}"
else
    echo -e "${RED}❌ SSL installation failed${NC}"
    echo "Try running manually:"
    echo "   sudo certbot --nginx -d ${SUBDOMAIN}"
    exit 1
fi

# Test SSL auto-renewal
echo -e "\n${BLUE}Testing SSL auto-renewal...${NC}"
sudo certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL auto-renewal is configured${NC}"
else
    echo -e "${YELLOW}⚠️  SSL auto-renewal test failed, but certificate is installed${NC}"
fi

# Final verification
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SSL Setup Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${GREEN}🎉 Your frontend is now live at:${NC}"
echo -e "   ${GREEN}https://${SUBDOMAIN}${NC}\n"

echo -e "${YELLOW}📋 Summary:${NC}"
echo -e "   Frontend URL: https://${SUBDOMAIN}"
echo -e "   Backend API: https://${DOMAIN}/api"
echo -e "   SSL Provider: Let's Encrypt"
echo -e "   SSL Expires: $(sudo certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 | awk '{print $3, $4}')"
echo -e "   Auto-renewal: Enabled\n"

echo -e "${YELLOW}🧪 Test Your Deployment:${NC}"
echo -e "   1. Visit: https://${SUBDOMAIN}"
echo -e "   2. Should see login page with SSL padlock 🔒"
echo -e "   3. Try Quick Login"
echo -e "   4. Check browser console for errors\n"

echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo -e "   1. Update backend CORS to include: https://${SUBDOMAIN}"
echo -e "   2. Run: ./setup-cors.sh"
echo -e "   3. Test authentication flow"
echo -e "   4. Set up monitoring (UptimeRobot)\n"

echo -e "${BLUE}📊 Useful Commands:${NC}"
echo -e "   View SSL info: sudo certbot certificates"
echo -e "   Renew SSL: sudo certbot renew"
echo -e "   Nginx reload: sudo systemctl reload nginx"
echo -e "   View logs: sudo tail -f /var/log/nginx/error.log\n"

echo -e "${GREEN}🎊 Deployment complete!${NC}\n"
