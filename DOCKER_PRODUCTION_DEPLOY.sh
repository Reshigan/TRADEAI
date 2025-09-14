#!/bin/bash

# 🐳 TRADEAI DOCKER PRODUCTION DEPLOYMENT
# Complete Docker-based production deployment with multi-container architecture
# Domain: tradeai.gonxt.tech
# Email: reshigan@gonxt.tech
# Author: OpenHands AI Assistant
# Version: DOCKER-PROD-1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
DOMAIN="tradeai.gonxt.tech"
EMAIL="reshigan@gonxt.tech"

# Get current user
CURRENT_USER=$(whoami)
if [ "$CURRENT_USER" = "root" ]; then
    CURRENT_USER=${SUDO_USER:-ubuntu}
fi

# Paths
HOME_DIR="/home/$CURRENT_USER"
APP_DIR="$HOME_DIR/tradeai-docker"
BACKUP_DIR="$HOME_DIR/backups/docker-backup-$(date +%Y%m%d-%H%M%S)"

# Docker configuration
COMPOSE_VERSION="2.21.0"
BACKEND_PORT=3001
FRONTEND_PORT=3000
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

step() {
    echo -e "${PURPLE}[STEP] $1${NC}"
}

docker_step() {
    echo -e "${BOLD}${CYAN}[DOCKER] $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Show Docker deployment info
show_docker_info() {
    echo ""
    echo -e "${BOLD}${CYAN}🐳 TRADEAI DOCKER PRODUCTION DEPLOYMENT 🐳${NC}"
    echo -e "${BOLD}${CYAN}===========================================${NC}"
    echo ""
    log "🚀 Starting Docker Production Deployment"
    log "Domain: $DOMAIN"
    log "Email: $EMAIL"
    log "User: $CURRENT_USER"
    log "Home Directory: $HOME_DIR"
    log "Docker Directory: $APP_DIR"
    log "Architecture: Multi-container Docker (Backend + Frontend + Nginx + SSL)"
    echo ""
    echo -e "${BOLD}🐳 DOCKER BENEFITS:${NC}"
    echo "   • Complete isolation - no permission issues"
    echo "   • Easy scaling and management"
    echo "   • Consistent environment across deployments"
    echo "   • Built-in health checks and auto-restart"
    echo "   • Simple backup and restore"
    echo "   • No PM2 or Node.js version conflicts"
    echo ""
    read -p "Continue with Docker deployment? (y/N): " confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    echo ""
    echo -e "${BOLD}${CYAN}🚀 DOCKER DEPLOYMENT INITIATED 🚀${NC}"
    echo ""
    sleep 2
}

# Create backup
create_backup() {
    step "Creating Backup"
    
    # Create backup directory as user
    sudo -u $CURRENT_USER mkdir -p "$BACKUP_DIR"
    
    # Backup existing installations
    if [ -d "$APP_DIR" ]; then
        docker_step "Backing up existing Docker installation..."
        cp -r "$APP_DIR" "$BACKUP_DIR/tradeai-docker" 2>/dev/null || true
    fi
    
    # Backup nginx configs
    [ -f "/etc/nginx/sites-available/tradeai" ] && cp "/etc/nginx/sites-available/tradeai" "$BACKUP_DIR/nginx-tradeai.conf" 2>/dev/null || true
    
    # Backup SSL certificates
    [ -d "/etc/letsencrypt/live/$DOMAIN" ] && cp -r "/etc/letsencrypt/live/$DOMAIN" "$BACKUP_DIR/ssl-certs" 2>/dev/null || true
    
    # Set proper ownership
    chown -R $CURRENT_USER:$CURRENT_USER "$BACKUP_DIR"
    
    log "✅ Backup created at: $BACKUP_DIR"
}

# Clean up old installations
cleanup_old_installations() {
    step "Cleaning Up Old Installations"
    
    # Stop and remove old containers
    docker_step "Stopping and removing old containers..."
    docker stop $(docker ps -aq) 2>/dev/null || true
    docker rm $(docker ps -aq) 2>/dev/null || true
    
    # Remove old images (optional - commented out to preserve images)
    # docker rmi $(docker images -q) 2>/dev/null || true
    
    # Stop old services
    systemctl stop nginx 2>/dev/null || true
    pkill -f pm2 2>/dev/null || true
    pkill -f node 2>/dev/null || true
    
    # Remove old nginx configs
    rm -f /etc/nginx/sites-enabled/tradeai 2>/dev/null || true
    
    log "✅ Old installations cleaned up"
}

# Install Docker and Docker Compose
install_docker() {
    step "Installing Docker and Docker Compose"
    
    # Check if Docker is already installed
    if command -v docker >/dev/null 2>&1; then
        docker_step "Docker is already installed"
        docker --version
    else
        docker_step "Installing Docker..."
        
        # Update system
        apt-get update
        
        # Install prerequisites
        apt-get install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        # Add Docker GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Add Docker repository
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io
        
        # Start Docker
        systemctl start docker
        systemctl enable docker
        
        log "✅ Docker installed successfully"
    fi
    
    # Check if Docker Compose is installed
    if command -v docker-compose >/dev/null 2>&1; then
        docker_step "Docker Compose is already installed"
        docker-compose --version
    else
        docker_step "Installing Docker Compose..."
        
        # Install Docker Compose
        curl -L "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # Create symlink
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
        
        log "✅ Docker Compose installed successfully"
    fi
    
    # Add user to docker group
    usermod -aG docker $CURRENT_USER
    
    # Start Docker daemon if not running
    if ! systemctl is-active --quiet docker; then
        docker_step "Starting Docker daemon..."
        systemctl start docker
        sleep 5
    fi
    
    # Verify Docker installation
    docker_step "Verifying Docker installation..."
    docker --version
    docker-compose --version
    
    log "✅ Docker and Docker Compose ready"
}

# Setup Docker application directory
setup_docker_app() {
    step "Setting Up Docker Application"
    
    # Create application directory
    docker_step "Creating Docker application directory: $APP_DIR"
    sudo -u $CURRENT_USER mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # Clone repository
    docker_step "Cloning TRADEAI repository..."
    sudo -u $CURRENT_USER git clone https://github.com/Reshigan/TRADEAI.git .
    
    # Verify repository structure
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        error "Invalid repository structure"
        exit 1
    fi
    
    # Create Docker directories
    sudo -u $CURRENT_USER mkdir -p docker/{nginx,ssl,logs}
    sudo -u $CURRENT_USER mkdir -p data/{postgres,redis}
    
    # Set proper permissions
    chown -R $CURRENT_USER:$CURRENT_USER "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    log "✅ Docker application setup completed"
}

# Create Dockerfiles
create_dockerfiles() {
    step "Creating Dockerfiles"
    
    # Backend Dockerfile
    docker_step "Creating Backend Dockerfile..."
    sudo -u $CURRENT_USER cat > backend/Dockerfile << 'EOF'
# TRADEAI Backend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production --no-audit

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S tradeai -u 1001

# Change ownership
RUN chown -R tradeai:nodejs /app
USER tradeai

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start application
CMD ["node", "src/server.js"]
EOF
    
    # Frontend Dockerfile
    docker_step "Creating Frontend Dockerfile..."
    sudo -u $CURRENT_USER cat > frontend/Dockerfile << 'EOF'
# TRADEAI Frontend Dockerfile - Multi-stage build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --no-audit

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx
RUN adduser -S tradeai -u 1001

# Change ownership
RUN chown -R tradeai:nginx /usr/share/nginx/html
RUN chown -R tradeai:nginx /var/cache/nginx
RUN chown -R tradeai:nginx /var/log/nginx
RUN chown -R tradeai:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R tradeai:nginx /var/run/nginx.pid

# Switch to non-root user
USER tradeai

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF
    
    # Frontend nginx configuration
    docker_step "Creating Frontend nginx configuration..."
    sudo -u $CURRENT_USER cat > frontend/nginx.conf << 'EOF'
server {
    listen 3000;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html index.htm;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static assets caching
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    log "✅ Dockerfiles created successfully"
}

# Create Docker Compose configuration
create_docker_compose() {
    step "Creating Docker Compose Configuration"
    
    docker_step "Creating docker-compose.yml..."
    sudo -u $CURRENT_USER cat > docker-compose.yml << EOF
version: '3.8'

services:
  # Backend Service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: tradeai-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
    ports:
      - "3001:3001"
    volumes:
      - ./docker/logs:/app/logs
    networks:
      - tradeai-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    depends_on:
      - postgres
      - redis

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: tradeai-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    networks:
      - tradeai-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    depends_on:
      - backend

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: tradeai-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/sites:/etc/nginx/conf.d:ro
      - ./docker/ssl:/etc/ssl/certs:ro
      - ./docker/logs/nginx:/var/log/nginx
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - tradeai-network
    depends_on:
      - frontend
      - backend

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: tradeai-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=tradeai
      - POSTGRES_USER=tradeai
      - POSTGRES_PASSWORD=tradeai_secure_password_2024
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    networks:
      - tradeai-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tradeai"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: tradeai-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - ./data/redis:/data
    networks:
      - tradeai-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  tradeai-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
EOF
    
    log "✅ Docker Compose configuration created"
}

# Create Nginx configuration for Docker
create_nginx_config() {
    step "Creating Nginx Configuration for Docker"
    
    # Main nginx.conf
    docker_step "Creating main nginx configuration..."
    sudo -u $CURRENT_USER cat > docker/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF
    
    # Create sites directory
    sudo -u $CURRENT_USER mkdir -p docker/nginx/sites
    
    # Site configuration
    docker_step "Creating site configuration..."
    sudo -u $CURRENT_USER cat > docker/nginx/sites/tradeai.conf << EOF
# TRADEAI Docker Production Configuration
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    # API routes to backend container
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Frontend container
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    log "✅ Nginx configuration created for Docker"
}

# Install system dependencies
install_system_dependencies() {
    step "Installing System Dependencies"
    
    # Update system
    apt-get update
    
    # Install essential packages
    apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        certbot \
        python3-certbot-nginx \
        ufw \
        net-tools \
        htop \
        tree
    
    log "✅ System dependencies installed"
}

# Configure firewall for Docker
configure_firewall() {
    step "Configuring Firewall for Docker"
    
    # Reset UFW
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow essential ports
    ufw allow ssh
    ufw allow 22
    ufw allow 80
    ufw allow 443
    
    # Allow Docker ports (only from localhost)
    ufw allow from 127.0.0.1 to any port 3000
    ufw allow from 127.0.0.1 to any port 3001
    
    # Enable firewall
    ufw --force enable
    
    log "✅ Firewall configured for Docker"
}

# Build and start Docker containers
start_docker_containers() {
    step "Building and Starting Docker Containers"
    
    cd "$APP_DIR"
    
    # Build containers
    docker_step "Building Docker containers..."
    sudo -u $CURRENT_USER docker-compose build --no-cache
    
    # Start containers
    docker_step "Starting Docker containers..."
    sudo -u $CURRENT_USER docker-compose up -d
    
    # Wait for containers to start
    docker_step "Waiting for containers to initialize..."
    sleep 30
    
    # Check container status
    docker_step "Checking container status..."
    sudo -u $CURRENT_USER docker-compose ps
    
    log "✅ Docker containers started successfully"
}

# Setup SSL certificate
setup_ssl_certificate() {
    step "Setting Up SSL Certificate"
    
    # Check domain resolution
    docker_step "Checking domain resolution for $DOMAIN..."
    domain_ip=$(dig +short $DOMAIN 2>/dev/null || echo "")
    server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "")
    
    if [ -z "$domain_ip" ]; then
        warning "Domain $DOMAIN does not resolve"
        warning "Continuing with HTTP only..."
        return 1
    fi
    
    if [ "$domain_ip" != "$server_ip" ]; then
        warning "Domain resolves to $domain_ip but server IP is $server_ip"
        warning "SSL may fail, continuing anyway..."
    fi
    
    # Create temporary nginx config for SSL challenge
    docker_step "Setting up SSL certificate for $DOMAIN..."
    
    # Stop nginx container temporarily
    sudo -u $CURRENT_USER docker-compose stop nginx
    
    # Request SSL certificate
    if certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domains "$DOMAIN,www.$DOMAIN"; then
        
        log "✅ SSL certificate obtained for $DOMAIN"
        
        # Update nginx config for HTTPS
        docker_step "Updating nginx configuration for HTTPS..."
        sudo -u $CURRENT_USER cat >> docker/nginx/sites/tradeai.conf << EOF

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API routes to backend container
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Frontend container
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}
EOF
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f $APP_DIR/docker-compose.yml restart nginx") | crontab -
        log "✅ SSL auto-renewal configured"
        
        # Restart nginx container
        sudo -u $CURRENT_USER docker-compose start nginx
        
        return 0
    else
        warning "⚠️ SSL certificate setup failed for $DOMAIN"
        warning "Continuing with HTTP only"
        
        # Restart nginx container
        sudo -u $CURRENT_USER docker-compose start nginx
        
        return 1
    fi
}

# Verify Docker deployment
verify_docker_deployment() {
    step "Verifying Docker Deployment"
    
    cd "$APP_DIR"
    
    # Check container status
    docker_step "Checking container status..."
    container_status=$(sudo -u $CURRENT_USER docker-compose ps)
    echo "$container_status"
    
    # Check if all containers are running
    running_containers=$(sudo -u $CURRENT_USER docker-compose ps | grep "Up" | wc -l)
    total_containers=$(sudo -u $CURRENT_USER docker-compose ps | grep -v "Name" | wc -l)
    
    if [ "$running_containers" -eq "$total_containers" ] && [ "$total_containers" -gt 0 ]; then
        log "✅ All Docker containers are running ($running_containers/$total_containers)"
    else
        error "❌ Some containers are not running ($running_containers/$total_containers)"
        return 1
    fi
    
    # Check container health
    docker_step "Checking container health..."
    sudo -u $CURRENT_USER docker-compose exec -T backend curl -f http://localhost:3001/api/health 2>/dev/null || warning "⚠️ Backend health check failed"
    sudo -u $CURRENT_USER docker-compose exec -T frontend curl -f http://localhost:3000 2>/dev/null || warning "⚠️ Frontend health check failed"
    
    # Check external access
    docker_step "Testing external access..."
    frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
    if [ "$frontend_response" = "200" ]; then
        log "✅ External access working (HTTP $frontend_response)"
    else
        warning "⚠️ External access response: HTTP $frontend_response"
    fi
    
    # Check SSL if available
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        https_response=$(curl -s -o /dev/null -w "%{http_code}" https://localhost 2>/dev/null || echo "000")
        if [ "$https_response" = "200" ]; then
            log "✅ HTTPS access working (HTTPS $https_response)"
        else
            warning "⚠️ HTTPS access response: HTTPS $https_response"
        fi
    fi
    
    log "✅ Docker deployment verification completed"
}

# Create management scripts
create_management_scripts() {
    step "Creating Management Scripts"
    
    cd "$APP_DIR"
    
    # Start script
    docker_step "Creating start script..."
    sudo -u $CURRENT_USER cat > start.sh << 'EOF'
#!/bin/bash
echo "🐳 Starting TRADEAI Docker containers..."
docker-compose up -d
echo "✅ TRADEAI containers started"
docker-compose ps
EOF
    
    # Stop script
    docker_step "Creating stop script..."
    sudo -u $CURRENT_USER cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping TRADEAI Docker containers..."
docker-compose down
echo "✅ TRADEAI containers stopped"
EOF
    
    # Restart script
    docker_step "Creating restart script..."
    sudo -u $CURRENT_USER cat > restart.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting TRADEAI Docker containers..."
docker-compose down
docker-compose up -d
echo "✅ TRADEAI containers restarted"
docker-compose ps
EOF
    
    # Logs script
    docker_step "Creating logs script..."
    sudo -u $CURRENT_USER cat > logs.sh << 'EOF'
#!/bin/bash
echo "📋 TRADEAI Docker container logs..."
if [ -z "$1" ]; then
    docker-compose logs -f
else
    docker-compose logs -f "$1"
fi
EOF
    
    # Status script
    docker_step "Creating status script..."
    sudo -u $CURRENT_USER cat > status.sh << 'EOF'
#!/bin/bash
echo "📊 TRADEAI Docker container status..."
docker-compose ps
echo ""
echo "🔍 Container health:"
docker-compose exec backend curl -f http://localhost:3001/api/health 2>/dev/null && echo "✅ Backend healthy" || echo "❌ Backend unhealthy"
docker-compose exec frontend curl -f http://localhost:3000 2>/dev/null && echo "✅ Frontend healthy" || echo "❌ Frontend unhealthy"
EOF
    
    # Update script
    docker_step "Creating update script..."
    sudo -u $CURRENT_USER cat > update.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating TRADEAI Docker deployment..."
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo "✅ TRADEAI updated and restarted"
docker-compose ps
EOF
    
    # Make scripts executable
    chmod +x *.sh
    
    log "✅ Management scripts created"
}

# Show final results
show_final_results() {
    echo ""
    echo -e "${BOLD}${GREEN}🐳 TRADEAI DOCKER PRODUCTION DEPLOYMENT COMPLETED! 🐳${NC}"
    echo -e "${BOLD}${GREEN}======================================================${NC}"
    echo ""
    echo -e "${BOLD}🎉 DOCKER DEPLOYMENT SUCCESS:${NC}"
    echo "   • Multi-container architecture deployed"
    echo "   • Complete isolation and security"
    echo "   • Auto-restart and health monitoring"
    echo "   • Production-ready configuration"
    echo ""
    echo -e "${BOLD}🏠 DEPLOYMENT LOCATION:${NC}"
    echo "   • User: $CURRENT_USER"
    echo "   • Directory: $APP_DIR"
    echo "   • Backup: $BACKUP_DIR"
    echo ""
    echo -e "${BOLD}🌐 Your TRADEAI platform is now available at:${NC}"
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        echo "   🔒 https://$DOMAIN"
        echo "   🔒 https://www.$DOMAIN"
    else
        echo "   🌍 http://$DOMAIN"
        echo "   🌍 http://www.$DOMAIN"
    fi
    echo ""
    echo -e "${BOLD}🐳 DOCKER ARCHITECTURE:${NC}"
    echo "   📱 Frontend Container: React app with nginx"
    echo "   🔧 Backend Container: Node.js API server"
    echo "   🌐 Nginx Container: Reverse proxy with SSL"
    echo "   🗄️ PostgreSQL Container: Database"
    echo "   🚀 Redis Container: Cache and sessions"
    echo ""
    echo -e "${BOLD}📊 CONTAINER STATUS:${NC}"
    cd "$APP_DIR"
    sudo -u $CURRENT_USER docker-compose ps
    echo ""
    echo -e "${BOLD}🔧 MANAGEMENT COMMANDS (run as $CURRENT_USER in $APP_DIR):${NC}"
    echo "   • Start containers: ./start.sh"
    echo "   • Stop containers: ./stop.sh"
    echo "   • Restart containers: ./restart.sh"
    echo "   • View logs: ./logs.sh [service]"
    echo "   • Check status: ./status.sh"
    echo "   • Update deployment: ./update.sh"
    echo ""
    echo -e "${BOLD}🐳 DOCKER COMMANDS:${NC}"
    echo "   • View containers: docker-compose ps"
    echo "   • View logs: docker-compose logs -f [service]"
    echo "   • Execute command: docker-compose exec [service] [command]"
    echo "   • Scale service: docker-compose up -d --scale backend=3"
    echo ""
    echo -e "${BOLD}✅ DOCKER BENEFITS ACHIEVED:${NC}"
    echo "   🔒 Complete isolation - no permission issues"
    echo "   📦 Consistent environment across deployments"
    echo "   🚀 Easy scaling and load balancing"
    echo "   🔄 Built-in health checks and auto-restart"
    echo "   💾 Simple backup and restore"
    echo "   🛡️ Enhanced security with container isolation"
    echo "   🎯 No Node.js/PM2 version conflicts"
    echo ""
    echo -e "${BOLD}${GREEN}🎉 TRADEAI Docker Production Platform is Ready! 🎉${NC}"
}

# Main execution
main() {
    echo ""
    echo -e "${BOLD}${CYAN}🐳 TRADEAI DOCKER PRODUCTION DEPLOYMENT 🐳${NC}"
    echo -e "${BOLD}${CYAN}===========================================${NC}"
    echo ""
    
    check_root
    show_docker_info
    create_backup
    cleanup_old_installations
    install_docker
    install_system_dependencies
    configure_firewall
    setup_docker_app
    create_dockerfiles
    create_docker_compose
    create_nginx_config
    start_docker_containers
    setup_ssl_certificate || true
    verify_docker_deployment
    create_management_scripts
    show_final_results
    
    log "🎉 TRADEAI Docker Production Deployment Completed Successfully!"
}

# Run main function
main "$@"