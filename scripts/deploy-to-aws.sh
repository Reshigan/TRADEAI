#!/bin/bash

# TRADEAI AWS EC2 Deployment Script
# Comprehensive deployment for production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="tradeai.gonxt.tech"
SERVER_IP="13.247.215.88"
APP_DIR="/opt/tradeai"
BACKUP_DIR="/opt/backups"
LOG_DIR="/var/log/tradeai"

echo -e "${BLUE}🚀 TRADEAI Production Deployment Script${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "Domain: ${DOMAIN}"
echo -e "Server: ${SERVER_IP}"
echo -e "App Directory: ${APP_DIR}"
echo ""

# Function to log messages
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Update system packages
log "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
log "Installing required packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    htop \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker
log "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
    sudo systemctl enable docker
    sudo systemctl start docker
    log "Docker installed successfully"
else
    log "Docker already installed"
fi

# Install Docker Compose (standalone)
log "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log "Docker Compose installed successfully"
else
    log "Docker Compose already installed"
fi

# Install Node.js
log "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    log "Node.js installed successfully"
else
    log "Node.js already installed"
fi

# Create application directories
log "Creating application directories..."
sudo mkdir -p ${APP_DIR}
sudo mkdir -p ${BACKUP_DIR}
sudo mkdir -p ${LOG_DIR}
sudo chown -R $USER:$USER ${APP_DIR}
sudo chown -R $USER:$USER ${LOG_DIR}

# Clone or update TRADEAI repository
log "Setting up TRADEAI application..."
if [ -d "${APP_DIR}/.git" ]; then
    log "Updating existing repository..."
    cd ${APP_DIR}
    git pull origin main
else
    log "Cloning TRADEAI repository..."
    git clone https://github.com/Reshigan/TRADEAI.git ${APP_DIR}
    cd ${APP_DIR}
fi

# Create environment file
log "Creating environment configuration..."
cat > ${APP_DIR}/.env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3000
FRONTEND_PORT=3001

# Database Configuration
DATABASE_URL=postgresql://tradeai:tradeai_secure_password_2024@localhost:5432/tradeai
POSTGRES_DB=tradeai
POSTGRES_USER=tradeai
POSTGRES_PASSWORD=tradeai_secure_password_2024

# Redis Configuration
REDIS_URL=redis://:redis_secure_password_2024@localhost:6379
REDIS_PASSWORD=redis_secure_password_2024

# JWT Configuration
JWT_SECRET=tradeai_super_secret_jwt_key_production_2024_change_this
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=tradeai_refresh_secret_production_2024
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
CORS_ORIGIN=https://${DOMAIN}
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Email Configuration (Update with your SMTP settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Monitoring Configuration
GRAFANA_USER=admin
GRAFANA_PASSWORD=grafana_admin_password_2024
PROMETHEUS_RETENTION=15d

# Message Queue Configuration
RABBITMQ_USER=tradeai
RABBITMQ_PASSWORD=rabbitmq_secure_password_2024

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,csv,xlsx

# External API Keys (Update with your actual keys)
OPENAI_API_KEY=your_openai_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Domain Configuration
DOMAIN=${DOMAIN}
SERVER_IP=${SERVER_IP}
EOF

# Set proper permissions for environment file
chmod 600 ${APP_DIR}/.env

# Create production Docker Compose file
log "Creating production Docker Compose configuration..."
cat > ${APP_DIR}/docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: tradeai-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/prod.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - tradeai-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: tradeai-backend
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs/backend:/app/logs
      - ./uploads:/app/uploads
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - tradeai-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: tradeai-frontend
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=https://tradeai.gonxt.tech/api
    ports:
      - "3001:80"
    restart: unless-stopped
    networks:
      - tradeai-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    container_name: tradeai-postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
      - ./logs/postgres:/var/log/postgresql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - tradeai-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: tradeai-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
      - ./logs/redis:/var/log/redis
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - tradeai-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  prometheus:
    image: prom/prometheus:latest
    container_name: tradeai-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-lifecycle'
    restart: unless-stopped
    networks:
      - tradeai-network

  grafana:
    image: grafana/grafana:latest
    container_name: tradeai-grafana
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_USER}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    restart: unless-stopped
    networks:
      - tradeai-network

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: tradeai-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped
    networks:
      - tradeai-network

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
  rabbitmq_data:

networks:
  tradeai-network:
    driver: bridge
EOF

# Create Nginx production configuration
log "Creating Nginx production configuration..."
mkdir -p ${APP_DIR}/nginx
cat > ${APP_DIR}/nginx/prod.conf << EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;

    # Upstream servers
    upstream backend {
        server backend:3000;
    }

    upstream frontend {
        server frontend:80;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name ${DOMAIN} www.${DOMAIN};
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name ${DOMAIN} www.${DOMAIN};

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin";
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;";

        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Login endpoint with stricter rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # WebSocket routes
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Health check endpoints
        location /health {
            proxy_pass http://backend;
            access_log off;
        }

        # Static files with caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options nosniff;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Handle client-side routing
            try_files \$uri \$uri/ @fallback;
        }

        # Fallback for client-side routing
        location @fallback {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Monitoring endpoints (restrict access)
        location /grafana/ {
            proxy_pass http://grafana:3000/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Basic auth or IP restriction recommended
            # auth_basic "Monitoring Access";
            # auth_basic_user_file /etc/nginx/.htpasswd;
        }

        location /prometheus/ {
            proxy_pass http://prometheus:9090/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Basic auth or IP restriction recommended
            # auth_basic "Monitoring Access";
            # auth_basic_user_file /etc/nginx/.htpasswd;
        }
    }
}
EOF

# Create monitoring configuration
log "Creating monitoring configuration..."
mkdir -p ${APP_DIR}/monitoring/prometheus
mkdir -p ${APP_DIR}/monitoring/grafana

cat > ${APP_DIR}/monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'tradeai-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'tradeai-frontend'
    static_configs:
      - targets: ['frontend:80']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
EOF

# Create database initialization script
log "Creating database initialization..."
mkdir -p ${APP_DIR}/database/init
cat > ${APP_DIR}/database/init/01-init.sql << 'EOF'
-- TRADEAI Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create initial tables (basic structure)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);

-- Insert default tenant
INSERT INTO tenants (name, domain, settings) 
VALUES ('Default Tenant', 'tradeai.gonxt.tech', '{"theme": "default", "features": ["analytics", "reporting", "integrations"]}')
ON CONFLICT (domain) DO NOTHING;

-- Insert default admin user (password: Admin123!)
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active, email_verified)
SELECT 
    t.id,
    'admin@tradeai.com',
    crypt('Admin123!', gen_salt('bf')),
    'Admin',
    'User',
    'admin',
    true,
    true
FROM tenants t 
WHERE t.domain = 'tradeai.gonxt.tech'
ON CONFLICT (email) DO NOTHING;
EOF

# Create log directories
log "Creating log directories..."
mkdir -p ${APP_DIR}/logs/{nginx,backend,frontend,postgres,redis}

# Configure firewall
log "Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3002/tcp  # Grafana
sudo ufw --force enable

# Build and start the application
log "Building and starting TRADEAI application..."
cd ${APP_DIR}

# Build Docker images
docker-compose -f docker-compose.prod.yml build --no-cache

# Start the application
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
log "Waiting for services to start..."
sleep 30

# Check service health
log "Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Setup SSL certificate
log "Setting up SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    # Stop nginx temporarily for certificate generation
    docker-compose -f docker-compose.prod.yml stop nginx
    
    # Generate SSL certificate
    sudo certbot certonly --standalone -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
    
    # Start nginx again
    docker-compose -f docker-compose.prod.yml start nginx
else
    log "SSL certificate already exists"
fi

# Setup SSL certificate renewal
log "Setting up SSL certificate auto-renewal..."
echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f ${APP_DIR}/docker-compose.prod.yml restart nginx" | sudo crontab -

# Create backup script
log "Creating backup script..."
cat > ${APP_DIR}/scripts/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/tradeai"

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup database
docker exec tradeai-postgres pg_dump -U tradeai tradeai > ${BACKUP_DIR}/database_${DATE}.sql

# Backup application files
tar -czf ${BACKUP_DIR}/app_${DATE}.tar.gz -C ${APP_DIR} --exclude=node_modules --exclude=.git .

# Backup Docker volumes
docker run --rm -v tradeai_postgres_data:/data -v ${BACKUP_DIR}:/backup alpine tar czf /backup/postgres_volume_${DATE}.tar.gz -C /data .
docker run --rm -v tradeai_redis_data:/data -v ${BACKUP_DIR}:/backup alpine tar czf /backup/redis_volume_${DATE}.tar.gz -C /data .

# Keep only last 7 days of backups
find ${BACKUP_DIR} -name "*.sql" -mtime +7 -delete
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: ${DATE}"
EOF

chmod +x ${APP_DIR}/scripts/backup.sh

# Setup daily backups
echo "0 2 * * * ${APP_DIR}/scripts/backup.sh >> ${LOG_DIR}/backup.log 2>&1" | crontab -

# Create monitoring script
log "Creating monitoring script..."
cat > ${APP_DIR}/scripts/monitor.sh << 'EOF'
#!/bin/bash

APP_DIR="/opt/tradeai"
LOG_FILE="/var/log/tradeai/monitor.log"

cd ${APP_DIR}

# Check if all services are running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "$(date): Some services are down, restarting..." >> ${LOG_FILE}
    docker-compose -f docker-compose.prod.yml up -d
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ ${DISK_USAGE} -gt 80 ]; then
    echo "$(date): Disk usage is ${DISK_USAGE}%" >> ${LOG_FILE}
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
if (( $(echo "${MEMORY_USAGE} > 80" | bc -l) )); then
    echo "$(date): Memory usage is ${MEMORY_USAGE}%" >> ${LOG_FILE}
fi
EOF

chmod +x ${APP_DIR}/scripts/monitor.sh

# Setup monitoring cron job
echo "*/5 * * * * ${APP_DIR}/scripts/monitor.sh" | crontab -

# Final health check
log "Performing final health check..."
sleep 10

# Check if services are responding
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log "✅ Backend service is healthy"
else
    error "❌ Backend service is not responding"
fi

if curl -f http://localhost:3001 > /dev/null 2>&1; then
    log "✅ Frontend service is healthy"
else
    error "❌ Frontend service is not responding"
fi

# Display deployment summary
echo ""
echo -e "${GREEN}🎉 TRADEAI Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "🌐 Application URL: https://${DOMAIN}"
echo -e "📊 Grafana Dashboard: https://${DOMAIN}/grafana/"
echo -e "📈 Prometheus Metrics: https://${DOMAIN}/prometheus/"
echo -e "🐰 RabbitMQ Management: http://${SERVER_IP}:15672"
echo ""
echo -e "📁 Application Directory: ${APP_DIR}"
echo -e "📋 Logs Directory: ${LOG_DIR}"
echo -e "💾 Backups Directory: ${BACKUP_DIR}"
echo ""
echo -e "🔐 Default Admin Credentials:"
echo -e "   Email: admin@tradeai.com"
echo -e "   Password: Admin123!"
echo ""
echo -e "📊 Monitoring Credentials:"
echo -e "   Grafana: admin / grafana_admin_password_2024"
echo -e "   RabbitMQ: tradeai / rabbitmq_secure_password_2024"
echo ""
echo -e "${YELLOW}⚠️  Important Next Steps:${NC}"
echo -e "1. Update email SMTP settings in .env file"
echo -e "2. Add your actual API keys (OpenAI, Stripe, etc.)"
echo -e "3. Configure monitoring alerts"
echo -e "4. Test all functionality thoroughly"
echo -e "5. Setup regular backups verification"
echo ""
echo -e "${GREEN}🚀 TRADEAI is now live and ready for production use!${NC}"
EOF

chmod +x /workspace/project/TRADEAI/scripts/deploy-to-aws.sh