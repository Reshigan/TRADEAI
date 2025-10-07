#!/bin/bash

# SSL Certificate Setup for tradeai.gonxt.tech
set -e

echo "🔒 Setting up SSL certificate for tradeai.gonxt.tech..."

# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Install Nginx if not present
sudo apt install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/tradeai.gonxt.tech << 'NGINX_EOF'
server {
    listen 80;
    server_name tradeai.gonxt.tech;
    
    location / {
        proxy_pass http://localhost:5002;
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
NGINX_EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/tradeai.gonxt.tech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d tradeai.gonxt.tech --non-interactive --agree-tos --email admin@gonxt.tech

# Set up auto-renewal
sudo systemctl enable certbot.timer

echo "✅ SSL certificate setup completed!"
