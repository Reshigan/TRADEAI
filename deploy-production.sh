#!/bin/bash

# TRADEAI Production Deployment Script
# Server: 13.247.139.75 (tradeai.gonxt.tech)
# Email: reshigan@gonxt.tech

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="tradeai.gonxt.tech"
SERVER_IP="13.247.139.75"
SSL_EMAIL="reshigan@gonxt.tech"
APP_DIR="/opt/tradeai"
LOG_DIR="/var/log/tradeai"
BACKUP_DIR="/opt/tradeai-backups"
SERVICE_USER="tradeai"
GIT_REPO="https://github.com/Reshigan/TRADEAI.git"
NODE_VERSION="18"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
    fi
}

# System update and cleanup
system_update() {
    header "System Update and Cleanup"
    
    log "Updating system packages..."
    apt-get update -y
    apt-get upgrade -y
    
    log "Installing essential packages..."
    apt-get install -y curl wget git unzip software-properties-common \
        apt-transport-https ca-certificates gnupg lsb-release \
        build-essential python3-pip nginx certbot python3-certbot-nginx \
        ufw fail2ban logrotate cron supervisor htop
    
    log "Cleaning up old packages..."
    apt-get autoremove -y
    apt-get autoclean
    
    success "System updated successfully"
}

# Install Node.js
install_nodejs() {
    header "Installing Node.js ${NODE_VERSION}"
    
    # Remove old Node.js installations
    log "Removing old Node.js installations..."
    apt-get remove -y nodejs npm || true
    rm -rf /usr/local/bin/node /usr/local/bin/npm /usr/local/lib/node_modules || true
    
    # Install Node.js via NodeSource
    log "Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    # Install global packages
    log "Installing global npm packages..."
    npm install -g pm2 yarn
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    log "Node.js version: ${node_version}"
    log "NPM version: ${npm_version}"
    
    success "Node.js installed successfully"
}

# Install MongoDB
install_mongodb() {
    header "Installing MongoDB"
    
    log "Adding MongoDB repository..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    
    apt-get update -y
    apt-get install -y mongodb-org
    
    log "Configuring MongoDB..."
    systemctl start mongod
    systemctl enable mongod
    
    # Create MongoDB configuration
    cat > /etc/mongod.conf << 'EOF'
# mongod.conf
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: enabled
EOF
    
    systemctl restart mongod
    
    success "MongoDB installed successfully"
}

# Install Redis
install_redis() {
    header "Installing Redis"
    
    log "Installing Redis..."
    apt-get install -y redis-server
    
    log "Configuring Redis..."
    sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
    sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
    sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
    
    systemctl restart redis-server
    systemctl enable redis-server
    
    success "Redis installed successfully"
}

# Create application user
create_app_user() {
    header "Creating Application User"
    
    if id "$SERVICE_USER" &>/dev/null; then
        log "User $SERVICE_USER already exists"
    else
        log "Creating user $SERVICE_USER..."
        useradd -r -s /bin/bash -d $APP_DIR -m $SERVICE_USER
        usermod -aG sudo $SERVICE_USER
    fi
    
    success "Application user created"
}

# Setup directories
setup_directories() {
    header "Setting Up Directories"
    
    log "Creating application directories..."
    mkdir -p $APP_DIR
    mkdir -p $LOG_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p $APP_DIR/uploads
    mkdir -p $APP_DIR/logs
    mkdir -p $APP_DIR/backups
    
    log "Setting permissions..."
    chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
    chown -R $SERVICE_USER:$SERVICE_USER $LOG_DIR
    chown -R $SERVICE_USER:$SERVICE_USER $BACKUP_DIR
    
    chmod -R 755 $APP_DIR
    chmod -R 755 $LOG_DIR
    chmod -R 755 $BACKUP_DIR
    
    success "Directories created successfully"
}

# Clone repository
clone_repository() {
    header "Cloning Repository"
    
    log "Removing old installation..."
    rm -rf $APP_DIR/TRADEAI || true
    
    log "Cloning repository..."
    cd $APP_DIR
    sudo -u $SERVICE_USER git clone $GIT_REPO TRADEAI
    cd $APP_DIR/TRADEAI
    
    log "Setting up git configuration..."
    sudo -u $SERVICE_USER git config user.name "TradeAI Production"
    sudo -u $SERVICE_USER git config user.email "production@tradeai.gonxt.tech"
    
    success "Repository cloned successfully"
}

# Setup MongoDB database and users
setup_mongodb() {
    header "Setting Up MongoDB Database"
    
    log "Creating MongoDB admin user..."
    mongosh --eval "
    use admin;
    db.createUser({
        user: 'admin',
        pwd: 'TradeAI_Admin_2025_Secure_Password',
        roles: ['root']
    });
    "
    
    log "Creating application database and user..."
    mongosh -u admin -p 'TradeAI_Admin_2025_Secure_Password' --authenticationDatabase admin --eval "
    use tradeai_production;
    db.createUser({
        user: 'tradeai_user',
        pwd: 'TradeAI_User_2025_Secure_Password',
        roles: [
            { role: 'readWrite', db: 'tradeai_production' },
            { role: 'dbAdmin', db: 'tradeai_production' }
        ]
    });
    "
    
    success "MongoDB database configured"
}

# Install application dependencies
install_dependencies() {
    header "Installing Application Dependencies"
    
    cd $APP_DIR/TRADEAI
    
    log "Installing backend dependencies..."
    cd backend
    sudo -u $SERVICE_USER npm install --production
    
    log "Installing frontend dependencies..."
    cd ../frontend
    sudo -u $SERVICE_USER npm install
    
    log "Building frontend for production..."
    sudo -u $SERVICE_USER npm run build
    
    success "Dependencies installed successfully"
}

# Setup environment configuration
setup_environment() {
    header "Setting Up Environment Configuration"
    
    cd $APP_DIR/TRADEAI
    
    log "Creating production environment file..."
    sudo -u $SERVICE_USER cp .env.production .env
    
    # Update MongoDB URI in .env
    sudo -u $SERVICE_USER sed -i "s|MONGODB_URI=.*|MONGODB_URI=mongodb://tradeai_user:TradeAI_User_2025_Secure_Password@localhost:27017/tradeai_production?authSource=tradeai_production|g" .env
    
    success "Environment configured"
}

# Configure Nginx
configure_nginx() {
    header "Configuring Nginx"
    
    log "Creating Nginx configuration..."
    cat > /etc/nginx/sites-available/tradeai << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN $SERVER_IP;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Client max body size
    client_max_body_size 10M;
    
    # Root directory for static files
    root $APP_DIR/TRADEAI/frontend/build;
    index index.html;
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files with caching
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri \$uri/ =404;
    }
    
    # Handle React Router
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache control for HTML files
        location ~* \.html\$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
    
    # Security: Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|conf)\$ {
        deny all;
    }
}
EOF
    
    log "Enabling Nginx site..."
    ln -sf /etc/nginx/sites-available/tradeai /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    log "Testing Nginx configuration..."
    nginx -t
    
    systemctl restart nginx
    systemctl enable nginx
    
    success "Nginx configured successfully"
}

# Setup SSL certificate
setup_ssl() {
    header "Setting Up SSL Certificate"
    
    log "Obtaining SSL certificate from Let's Encrypt..."
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $SSL_EMAIL --agree-tos --non-interactive --redirect
    
    log "Setting up automatic renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    success "SSL certificate configured"
}

# Setup PM2 process manager
setup_pm2() {
    header "Setting Up PM2 Process Manager"
    
    cd $APP_DIR/TRADEAI
    
    log "Creating PM2 ecosystem file..."
    sudo -u $SERVICE_USER cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tradeai-backend',
    script: './backend/server.js',
    cwd: '/opt/tradeai/TRADEAI',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/tradeai/backend-error.log',
    out_file: '/var/log/tradeai/backend-out.log',
    log_file: '/var/log/tradeai/backend-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
    
    log "Starting application with PM2..."
    sudo -u $SERVICE_USER pm2 start ecosystem.config.js
    sudo -u $SERVICE_USER pm2 save
    
    log "Setting up PM2 startup script..."
    pm2 startup systemd -u $SERVICE_USER --hp $APP_DIR
    
    success "PM2 configured successfully"
}

# Setup firewall
setup_firewall() {
    header "Setting Up Firewall"
    
    log "Configuring UFW firewall..."
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow MongoDB (local only)
    ufw allow from 127.0.0.1 to any port 27017
    
    # Allow Redis (local only)
    ufw allow from 127.0.0.1 to any port 6379
    
    ufw --force enable
    
    success "Firewall configured"
}

# Setup monitoring and logging
setup_monitoring() {
    header "Setting Up Monitoring and Logging"
    
    log "Configuring logrotate..."
    cat > /etc/logrotate.d/tradeai << 'EOF'
/var/log/tradeai/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 tradeai tradeai
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    log "Setting up system monitoring script..."
    cat > /opt/tradeai/monitor.sh << 'EOF'
#!/bin/bash
# System monitoring script

LOG_FILE="/var/log/tradeai/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Memory usage is ${MEM_USAGE}%" >> $LOG_FILE
fi

# Check if services are running
if ! systemctl is-active --quiet mongod; then
    echo "[$DATE] ERROR: MongoDB is not running" >> $LOG_FILE
    systemctl restart mongod
fi

if ! systemctl is-active --quiet redis-server; then
    echo "[$DATE] ERROR: Redis is not running" >> $LOG_FILE
    systemctl restart redis-server
fi

if ! systemctl is-active --quiet nginx; then
    echo "[$DATE] ERROR: Nginx is not running" >> $LOG_FILE
    systemctl restart nginx
fi

# Check PM2 processes
PM2_STATUS=$(sudo -u tradeai pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null || echo "error")
if [ "$PM2_STATUS" != "online" ]; then
    echo "[$DATE] ERROR: PM2 process is not online" >> $LOG_FILE
    sudo -u tradeai pm2 restart all
fi
EOF
    
    chmod +x /opt/tradeai/monitor.sh
    
    log "Setting up monitoring cron job..."
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/tradeai/monitor.sh") | crontab -
    
    success "Monitoring configured"
}

# Setup auto-update system
setup_auto_update() {
    header "Setting Up Auto-Update System"
    
    log "Creating auto-update script..."
    cat > /opt/tradeai/auto-update.sh << 'EOF'
#!/bin/bash
# Auto-update script for TRADEAI

APP_DIR="/opt/tradeai/TRADEAI"
LOG_FILE="/var/log/tradeai/auto-update.log"
SERVICE_USER="tradeai"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

cd $APP_DIR

# Check for updates
log "Checking for updates..."
sudo -u $SERVICE_USER git fetch origin

LOCAL=$(sudo -u $SERVICE_USER git rev-parse HEAD)
REMOTE=$(sudo -u $SERVICE_USER git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    log "Updates found. Starting deployment..."
    
    # Create backup
    log "Creating backup..."
    tar -czf /opt/tradeai-backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /opt/tradeai TRADEAI
    
    # Pull updates
    log "Pulling updates..."
    sudo -u $SERVICE_USER git pull origin main
    
    # Install dependencies
    log "Installing backend dependencies..."
    cd backend
    sudo -u $SERVICE_USER npm install --production
    
    log "Building frontend..."
    cd ../frontend
    sudo -u $SERVICE_USER npm install
    sudo -u $SERVICE_USER npm run build
    
    # Restart services
    log "Restarting services..."
    sudo -u $SERVICE_USER pm2 restart all
    systemctl reload nginx
    
    log "Update completed successfully"
else
    log "No updates available"
fi
EOF
    
    chmod +x /opt/tradeai/auto-update.sh
    
    log "Setting up auto-update cron job..."
    (crontab -l 2>/dev/null; echo "0 3 * * * /opt/tradeai/auto-update.sh") | crontab -
    
    success "Auto-update system configured"
}

# Seed database with test data
seed_database() {
    header "Seeding Database with Test Data"
    
    cd $APP_DIR/TRADEAI/backend
    
    log "Creating database seed script..."
    sudo -u $SERVICE_USER cat > seed-production.js << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Company = require('./models/Company');
const TradingTerm = require('./models/TradingTerm');

async function seedDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Company.deleteMany({});
        await TradingTerm.deleteMany({});
        
        console.log('Creating test company...');
        const company = await Company.create({
            name: 'GONXT Technologies',
            domain: 'gonxt.tech',
            currency: 'ZAR',
            timezone: 'Africa/Johannesburg',
            dateFormat: 'DD/MM/YYYY',
            address: {
                street: '123 Business District',
                city: 'Cape Town',
                state: 'Western Cape',
                zipCode: '8001',
                country: 'South Africa'
            },
            settings: {
                multiTenant: true,
                features: {
                    analytics: true,
                    aiChatbot: true,
                    sapIntegration: true,
                    realTimeUpdates: true
                }
            }
        });
        
        console.log('Creating super admin user...');
        const hashedPassword = await bcrypt.hash('TradeAI2025!', 12);
        
        await User.create({
            username: 'admin',
            email: 'reshigan@gonxt.tech',
            password: hashedPassword,
            firstName: 'System',
            lastName: 'Administrator',
            role: 'super_admin',
            companyId: company._id,
            isActive: true,
            preferences: {
                currency: 'ZAR',
                timezone: 'Africa/Johannesburg',
                dateFormat: 'DD/MM/YYYY',
                language: 'en'
            }
        });
        
        console.log('Creating company admin user...');
        await User.create({
            username: 'company_admin',
            email: 'admin@gonxt.tech',
            password: hashedPassword,
            firstName: 'Company',
            lastName: 'Admin',
            role: 'company_admin',
            companyId: company._id,
            isActive: true,
            preferences: {
                currency: 'ZAR',
                timezone: 'Africa/Johannesburg',
                dateFormat: 'DD/MM/YYYY',
                language: 'en'
            }
        });
        
        console.log('Creating regular user...');
        await User.create({
            username: 'user',
            email: 'user@gonxt.tech',
            password: hashedPassword,
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
            companyId: company._id,
            isActive: true,
            preferences: {
                currency: 'ZAR',
                timezone: 'Africa/Johannesburg',
                dateFormat: 'DD/MM/YYYY',
                language: 'en'
            }
        });
        
        console.log('Creating sample trading terms...');
        await TradingTerm.create([
            {
                name: 'Standard Payment Terms',
                description: 'Standard 30-day payment terms for regular customers',
                paymentDays: 30,
                discountPercentage: 2,
                discountDays: 10,
                isActive: true,
                companyId: company._id
            },
            {
                name: 'Premium Customer Terms',
                description: 'Extended payment terms for premium customers',
                paymentDays: 45,
                discountPercentage: 3,
                discountDays: 15,
                isActive: true,
                companyId: company._id
            },
            {
                name: 'Cash on Delivery',
                description: 'Immediate payment required on delivery',
                paymentDays: 0,
                discountPercentage: 5,
                discountDays: 0,
                isActive: true,
                companyId: company._id
            }
        ]);
        
        console.log('Database seeded successfully!');
        console.log('Login credentials:');
        console.log('Super Admin: admin / TradeAI2025!');
        console.log('Company Admin: company_admin / TradeAI2025!');
        console.log('User: user / TradeAI2025!');
        
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedDatabase();
EOF
    
    log "Running database seed..."
    sudo -u $SERVICE_USER node seed-production.js
    
    success "Database seeded successfully"
}

# Setup backup system
setup_backup() {
    header "Setting Up Backup System"
    
    log "Creating backup script..."
    cat > /opt/tradeai/backup.sh << 'EOF'
#!/bin/bash
# Database backup script

BACKUP_DIR="/opt/tradeai-backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/tradeai/backup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

log "Starting backup process..."

# Create MongoDB backup
log "Creating MongoDB backup..."
mongodump --uri="mongodb://tradeai_user:TradeAI_User_2025_Secure_Password@localhost:27017/tradeai_production" --out="$BACKUP_DIR/mongodb_$DATE"

# Create application backup
log "Creating application backup..."
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" -C /opt/tradeai TRADEAI --exclude=node_modules --exclude=build

# Clean old backups (keep 30 days)
log "Cleaning old backups..."
find $BACKUP_DIR -name "mongodb_*" -mtime +30 -exec rm -rf {} \;
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +30 -delete

log "Backup completed successfully"
EOF
    
    chmod +x /opt/tradeai/backup.sh
    
    log "Setting up backup cron job..."
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/tradeai/backup.sh") | crontab -
    
    success "Backup system configured"
}

# Final system verification
verify_installation() {
    header "Verifying Installation"
    
    log "Checking services status..."
    
    # Check MongoDB
    if systemctl is-active --quiet mongod; then
        success "MongoDB is running"
    else
        error "MongoDB is not running"
    fi
    
    # Check Redis
    if systemctl is-active --quiet redis-server; then
        success "Redis is running"
    else
        error "Redis is not running"
    fi
    
    # Check Nginx
    if systemctl is-active --quiet nginx; then
        success "Nginx is running"
    else
        error "Nginx is not running"
    fi
    
    # Check PM2
    if sudo -u $SERVICE_USER pm2 list | grep -q "online"; then
        success "PM2 processes are running"
    else
        error "PM2 processes are not running"
    fi
    
    # Check SSL certificate
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        success "SSL certificate is installed"
    else
        warn "SSL certificate not found"
    fi
    
    log "Testing application endpoints..."
    
    # Test backend health
    if curl -f -s http://localhost:3000/health > /dev/null; then
        success "Backend health check passed"
    else
        warn "Backend health check failed"
    fi
    
    # Test frontend
    if curl -f -s http://localhost:80 > /dev/null; then
        success "Frontend is accessible"
    else
        warn "Frontend accessibility test failed"
    fi
    
    success "Installation verification completed"
}

# Main installation function
main() {
    header "TRADEAI Production Deployment"
    
    log "Starting deployment process..."
    log "Domain: $DOMAIN"
    log "Server IP: $SERVER_IP"
    log "SSL Email: $SSL_EMAIL"
    
    check_root
    system_update
    install_nodejs
    install_mongodb
    install_redis
    create_app_user
    setup_directories
    clone_repository
    setup_mongodb
    install_dependencies
    setup_environment
    configure_nginx
    setup_ssl
    setup_pm2
    setup_firewall
    setup_monitoring
    setup_auto_update
    seed_database
    setup_backup
    verify_installation
    
    header "Deployment Complete!"
    
    echo -e "${GREEN}🎉 TRADEAI has been successfully deployed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Deployment Summary:${NC}"
    echo -e "   🌐 Website: ${YELLOW}https://$DOMAIN${NC}"
    echo -e "   🔒 SSL Certificate: ${GREEN}Enabled${NC}"
    echo -e "   📊 MongoDB: ${GREEN}Running${NC}"
    echo -e "   🚀 Application: ${GREEN}Running${NC}"
    echo ""
    echo -e "${BLUE}🔑 Login Credentials:${NC}"
    echo -e "   Super Admin: ${YELLOW}admin / TradeAI2025!${NC}"
    echo -e "   Company Admin: ${YELLOW}company_admin / TradeAI2025!${NC}"
    echo -e "   User: ${YELLOW}user / TradeAI2025!${NC}"
    echo ""
    echo -e "${BLUE}📁 Important Paths:${NC}"
    echo -e "   Application: ${YELLOW}$APP_DIR/TRADEAI${NC}"
    echo -e "   Logs: ${YELLOW}$LOG_DIR${NC}"
    echo -e "   Backups: ${YELLOW}$BACKUP_DIR${NC}"
    echo ""
    echo -e "${BLUE}🛠️ Management Commands:${NC}"
    echo -e "   View logs: ${YELLOW}pm2 logs${NC}"
    echo -e "   Restart app: ${YELLOW}pm2 restart all${NC}"
    echo -e "   Check status: ${YELLOW}pm2 status${NC}"
    echo -e "   Manual update: ${YELLOW}/opt/tradeai/auto-update.sh${NC}"
    echo ""
    echo -e "${GREEN}✅ Auto-update is enabled and will check for updates daily at 3 AM${NC}"
    echo -e "${GREEN}✅ Backups are scheduled daily at 2 AM${NC}"
    echo -e "${GREEN}✅ System monitoring is active${NC}"
    
    log "Deployment completed successfully!"
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"