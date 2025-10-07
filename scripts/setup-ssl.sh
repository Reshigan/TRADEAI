#!/bin/bash

# SSL Certificate Setup Script for Trade AI Platform
# This script sets up SSL certificates using Let's Encrypt (Certbot)

set -e

# Configuration
DOMAIN="tradeai.gonxt.tech"
EMAIL="admin@gonxt.tech"
SSL_DIR="/etc/nginx/ssl"
WEBROOT_PATH="/var/www/certbot"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Trade AI Platform SSL Setup ===${NC}"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "SSL Directory: $SSL_DIR"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

# Update system packages
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update -y

# Install required packages
echo -e "${YELLOW}Installing required packages...${NC}"
apt-get install -y snapd nginx certbot python3-certbot-nginx

# Install certbot via snap (recommended method)
snap install core; snap refresh core
snap install --classic certbot

# Create symbolic link
ln -sf /snap/bin/certbot /usr/bin/certbot

# Create SSL directory
mkdir -p "$SSL_DIR"
mkdir -p "$WEBROOT_PATH"

# Create temporary nginx configuration for certificate generation
echo -e "${YELLOW}Creating temporary nginx configuration...${NC}"
cat > /etc/nginx/sites-available/temp-ssl << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root $WEBROOT_PATH;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

# Enable the temporary configuration
ln -sf /etc/nginx/sites-available/temp-ssl /etc/nginx/sites-enabled/temp-ssl
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx

# Generate SSL certificate
echo -e "${YELLOW}Generating SSL certificate...${NC}"
certbot certonly \
    --webroot \
    --webroot-path="$WEBROOT_PATH" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --domains "$DOMAIN,www.$DOMAIN"

# Copy certificates to our SSL directory
echo -e "${YELLOW}Copying certificates...${NC}"
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$SSL_DIR/"
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$SSL_DIR/"

# Set proper permissions
chmod 644 "$SSL_DIR/fullchain.pem"
chmod 600 "$SSL_DIR/privkey.pem"
chown root:root "$SSL_DIR"/*.pem

# Create certificate renewal script
echo -e "${YELLOW}Creating certificate renewal script...${NC}"
cat > /etc/cron.d/certbot-renew << EOF
# Renew Let's Encrypt certificates twice daily
0 */12 * * * root certbot renew --quiet --post-hook "systemctl reload nginx && docker-compose -f /workspace/project/trade-ai-platform-v2/docker-compose.production.yml restart nginx"
EOF

# Create DH parameters for enhanced security
echo -e "${YELLOW}Generating DH parameters (this may take a while)...${NC}"
openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048

# Remove temporary nginx configuration
rm -f /etc/nginx/sites-enabled/temp-ssl

echo -e "${GREEN}SSL setup completed successfully!${NC}"
echo -e "${GREEN}Certificates are located in: $SSL_DIR${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Start your Docker containers with: docker-compose -f docker-compose.production.yml up -d"
echo "2. Nginx will automatically use the SSL certificates"
echo "3. Certificate auto-renewal is configured via cron"
echo ""
echo -e "${GREEN}SSL Certificate Information:${NC}"
certbot certificates