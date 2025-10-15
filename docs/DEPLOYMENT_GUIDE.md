# TradeAI Platform - Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Production Deployment](#production-deployment)
4. [Development Setup](#development-setup)
5. [Docker Deployment](#docker-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Database Setup](#database-setup)
8. [SSL Configuration](#ssl-configuration)
9. [Monitoring Setup](#monitoring-setup)
10. [Troubleshooting](#troubleshooting)

## Overview

This guide provides comprehensive instructions for deploying the TradeAI platform in various environments, from development to production.

### Deployment Architecture

```
Internet
    │
    ▼
┌─────────────────┐
│   Load Balancer │ (Optional)
│   (Nginx/HAProxy)│
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Web Server    │
│   Nginx         │
│   Port 80/443   │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Application   │
│   Node.js       │
│   Port 5000     │
└─────────────────┘
    │
    ▼
┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Cache         │
│   MongoDB       │    │   Redis         │
│   Port 27017    │    │   Port 6379     │
└─────────────────┘    └─────────────────┘
```

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 50GB SSD
- OS: Ubuntu 18.04+ / CentOS 7+ / RHEL 7+

**Recommended Requirements:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB SSD
- OS: Ubuntu 20.04 LTS

### Software Dependencies

**Required Software:**
- Node.js 16.x or higher
- MongoDB 4.4 or higher
- Redis 6.0 or higher
- Nginx 1.18 or higher
- PM2 (Process Manager)
- Git

**Optional Software:**
- Docker & Docker Compose
- SSL Certificate (Let's Encrypt)
- Monitoring tools (Prometheus, Grafana)

## Production Deployment

### Step 1: Server Preparation

**Update System:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git build-essential -y
```

**Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs -y
node --version  # Verify installation
```

**Install MongoDB:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt update
sudo apt install mongodb-org -y
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Install Redis:**
```bash
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis
```

**Install Nginx:**
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Install PM2:**
```bash
sudo npm install -g pm2
```

### Step 2: Application Deployment

**Clone Repository:**
```bash
cd /var/www
sudo git clone https://github.com/Reshigan/TRADEAI.git tradeai
sudo chown -R $USER:$USER /var/www/tradeai
cd /var/www/tradeai
```

**Backend Setup:**
```bash
cd backend
npm install --production
cp .env.example .env
# Edit .env with production values
nano .env
```

**Frontend Build:**
```bash
cd ../frontend
npm install
npm run build
```

### Step 3: Environment Configuration

**Backend Environment (.env):**
```bash
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/tradeai_prod
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# External APIs (Optional)
OPENAI_API_KEY=your_openai_api_key
ANALYTICS_API_KEY=your_analytics_key

# Security
CORS_ORIGIN=https://tradeai.gonxt.tech
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

**Frontend Environment (.env.production):**
```bash
REACT_APP_API_URL=https://tradeai.gonxt.tech/api
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=2.1.3
GENERATE_SOURCEMAP=false
```

### Step 4: Database Initialization

**MongoDB Setup:**
```bash
cd /var/www/tradeai
mongo < init-mongo.js
```

**Create Database User:**
```javascript
// Connect to MongoDB
mongo

// Create admin user
use admin
db.createUser({
  user: "tradeai_admin",
  pwd: "secure_password_here",
  roles: ["readWriteAnyDatabase", "dbAdminAnyDatabase"]
})

// Create application database
use tradeai_prod
db.createUser({
  user: "tradeai_app",
  pwd: "app_password_here",
  roles: ["readWrite"]
})
```

**Seed Initial Data:**
```bash
cd backend
node scripts/seedDatabase.js
```

### Step 5: Process Management

**PM2 Configuration (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [{
    name: 'tradeai-backend',
    script: './src/server.js',
    cwd: '/var/www/tradeai/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
```

**Start Application:**
```bash
cd /var/www/tradeai
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Step 6: Nginx Configuration

**Create Nginx Configuration:**
```bash
sudo nano /etc/nginx/sites-available/tradeai
```

**Nginx Configuration File:**
```nginx
server {
    listen 80;
    server_name tradeai.gonxt.tech www.tradeai.gonxt.tech;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Frontend static files
    location / {
        root /var/www/tradeai/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log)$ {
        deny all;
    }
}
```

**Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/tradeai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: SSL Configuration (Optional but Recommended)

**Install Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

**Obtain SSL Certificate:**
```bash
sudo certbot --nginx -d tradeai.gonxt.tech -d www.tradeai.gonxt.tech
```

**Auto-renewal Setup:**
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Development Setup

### Local Development Environment

**Prerequisites:**
- Node.js 16+
- MongoDB (local or Docker)
- Redis (local or Docker)
- Git

**Setup Steps:**

1. **Clone Repository:**
```bash
git clone https://github.com/Reshigan/TRADEAI.git
cd TRADEAI
```

2. **Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with development values
npm run dev
```

3. **Frontend Setup:**
```bash
cd ../frontend
npm install
npm start
```

4. **Database Setup:**
```bash
# Start MongoDB and Redis
sudo systemctl start mongod redis

# Seed development data
cd backend
npm run seed:dev
```

### Development Environment Variables

**Backend (.env):**
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tradeai_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_jwt_secret
JWT_REFRESH_SECRET=dev_refresh_secret
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

**Frontend (.env.development):**
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

## Docker Deployment

### Docker Compose Setup

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:4.4
    container_name: tradeai-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: tradeai
    volumes:
      - mongodb_data:/data/db
      - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    ports:
      - "27017:27017"
    networks:
      - tradeai-network

  redis:
    image: redis:6-alpine
    container_name: tradeai-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - tradeai-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: tradeai-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password@mongodb:27017/tradeai?authSource=admin
      REDIS_URL: redis://redis:6379
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
      - redis
    networks:
      - tradeai-network
    volumes:
      - ./backend/logs:/app/logs

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.production
    container_name: tradeai-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - tradeai-network
    volumes:
      - ./ssl:/etc/nginx/ssl:ro

volumes:
  mongodb_data:

networks:
  tradeai-network:
    driver: bridge
```

**Backend Dockerfile:**
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p logs

EXPOSE 5000

USER node

CMD ["node", "src/server.js"]
```

**Frontend Dockerfile.production:**
```dockerfile
FROM node:16-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

**Deploy with Docker:**
```bash
docker-compose up -d
```

## Environment Configuration

### Production Environment Checklist

- [ ] Secure JWT secrets generated
- [ ] Database credentials configured
- [ ] CORS origins set correctly
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Monitoring enabled
- [ ] Backup strategy implemented
- [ ] Log rotation configured

### Security Configuration

**Firewall Setup (UFW):**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 27017  # MongoDB (internal only)
sudo ufw deny 6379   # Redis (internal only)
```

**MongoDB Security:**
```bash
# Enable authentication
sudo nano /etc/mongod.conf

# Add:
security:
  authorization: enabled

sudo systemctl restart mongod
```

**Redis Security:**
```bash
# Configure Redis
sudo nano /etc/redis/redis.conf

# Add:
requirepass your_redis_password
bind 127.0.0.1

sudo systemctl restart redis
```

## Database Setup

### MongoDB Configuration

**Production MongoDB Configuration:**
```yaml
# /etc/mongod.conf
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

security:
  authorization: enabled

replication:
  replSetName: "rs0"  # For replica set (optional)
```

**Database Indexes:**
```javascript
// Create performance indexes
db.users.createIndex({ "email": 1, "tenantId": 1 }, { unique: true })
db.budgets.createIndex({ "tenantId": 1, "status": 1 })
db.tradeSpends.createIndex({ "tenantId": 1, "customerId": 1 })
db.promotions.createIndex({ "tenantId": 1, "status": 1, "startDate": 1 })
db.customers.createIndex({ "tenantId": 1, "status": 1 })
db.products.createIndex({ "tenantId": 1, "isActive": 1 })

// Text search indexes
db.customers.createIndex({ "name": "text", "code": "text" })
db.products.createIndex({ "name": "text", "sku": "text" })
```

### Backup Strategy

**MongoDB Backup Script:**
```bash
#!/bin/bash
# backup-mongodb.sh

BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="tradeai_backup_$DATE"

mkdir -p $BACKUP_DIR

mongodump --db tradeai_prod --out $BACKUP_DIR/$BACKUP_NAME

# Compress backup
tar -czf $BACKUP_DIR/$BACKUP_NAME.tar.gz -C $BACKUP_DIR $BACKUP_NAME
rm -rf $BACKUP_DIR/$BACKUP_NAME

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_NAME.tar.gz"
```

**Automated Backup Cron:**
```bash
# Add to crontab
0 2 * * * /path/to/backup-mongodb.sh
```

## SSL Configuration

### Let's Encrypt SSL

**Install Certbot:**
```bash
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

**Obtain Certificate:**
```bash
sudo certbot --nginx -d tradeai.gonxt.tech
```

**Nginx SSL Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name tradeai.gonxt.tech;
    
    ssl_certificate /etc/letsencrypt/live/tradeai.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tradeai.gonxt.tech/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    # Rest of configuration...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name tradeai.gonxt.tech;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring Setup

### Application Monitoring

**PM2 Monitoring:**
```bash
# Install PM2 monitoring
pm2 install pm2-server-monit

# View monitoring dashboard
pm2 monit
```

**Health Check Endpoint:**
```javascript
// Add to Express app
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    env: process.env.NODE_ENV,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };
  
  res.status(200).json(healthcheck);
});
```

### Log Management

**Log Rotation Configuration:**
```bash
sudo nano /etc/logrotate.d/tradeai
```

```
/var/www/tradeai/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### System Monitoring

**Install System Monitoring Tools:**
```bash
sudo apt install htop iotop nethogs -y
```

**Basic Monitoring Script:**
```bash
#!/bin/bash
# monitor.sh

echo "=== System Status ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo "Disk Usage: $(df -h / | tail -1 | awk '{print $5}')"
echo "Memory Usage: $(free -m | grep Mem | awk '{printf "%.2f%%", $3/$2 * 100.0}')"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)"

echo -e "\n=== Application Status ==="
pm2 status

echo -e "\n=== Database Status ==="
systemctl is-active mongod
systemctl is-active redis

echo -e "\n=== Web Server Status ==="
systemctl is-active nginx
```

## Troubleshooting

### Common Issues

**1. Application Won't Start:**
```bash
# Check PM2 logs
pm2 logs

# Check system logs
sudo journalctl -u mongod
sudo journalctl -u redis
sudo journalctl -u nginx

# Check port availability
sudo netstat -tlnp | grep :5000
```

**2. Database Connection Issues:**
```bash
# Test MongoDB connection
mongo --eval "db.adminCommand('ismaster')"

# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

**3. Frontend Not Loading:**
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify build files
ls -la /var/www/tradeai/frontend/build/
```

**4. SSL Certificate Issues:**
```bash
# Check certificate status
sudo certbot certificates

# Test SSL configuration
openssl s_client -connect tradeai.gonxt.tech:443

# Renew certificate manually
sudo certbot renew --dry-run
```

### Performance Optimization

**1. Database Optimization:**
```javascript
// Add database indexes
db.collection.createIndex({ field: 1 })

// Monitor slow queries
db.setProfilingLevel(2, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(5)
```

**2. Application Optimization:**
```bash
# Increase PM2 instances
pm2 scale tradeai-backend +2

# Monitor memory usage
pm2 monit
```

**3. Nginx Optimization:**
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;
```

### Backup and Recovery

**1. Database Backup:**
```bash
# Create backup
mongodump --db tradeai_prod --out /backup/$(date +%Y%m%d)

# Restore backup
mongorestore --db tradeai_prod /backup/20251015/tradeai_prod
```

**2. Application Backup:**
```bash
# Backup application files
tar -czf tradeai_backup_$(date +%Y%m%d).tar.gz /var/www/tradeai

# Backup configuration
cp /etc/nginx/sites-available/tradeai /backup/nginx_config_$(date +%Y%m%d)
```

**3. Recovery Procedures:**
```bash
# Stop services
pm2 stop all
sudo systemctl stop nginx

# Restore files
tar -xzf tradeai_backup_20251015.tar.gz -C /

# Restart services
sudo systemctl start nginx
pm2 start all
```

---

*Last Updated: October 15, 2025*
*Version: 2.1.3*
*Deployment Guide Maintainer: TradeAI DevOps Team*