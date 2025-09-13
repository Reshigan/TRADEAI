# TRADEAI Clean Install Kit

## 🚀 Quick Start Guide

This guide provides complete instructions for a clean deployment of TRADEAI with proper server cleanup before installation.

## 📋 Prerequisites

- Ubuntu/Debian server (18.04+ recommended)
- Root or sudo access
- At least 4GB RAM and 20GB disk space
- Internet connection

## 🧹 Server Cleanup Script

### Step 1: Create Cleanup Script

```bash
# Create cleanup script
cat > cleanup-server.sh << 'EOF'
#!/bin/bash

echo "🧹 Starting TRADEAI Server Cleanup..."

# Stop all running containers
echo "Stopping Docker containers..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Remove Docker images
echo "Removing Docker images..."
docker rmi $(docker images -q) 2>/dev/null || true

# Clean Docker system
echo "Cleaning Docker system..."
docker system prune -af --volumes 2>/dev/null || true

# Stop services
echo "Stopping services..."
sudo systemctl stop mongod 2>/dev/null || true
sudo systemctl stop redis-server 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Remove old installations
echo "Removing old installations..."
sudo rm -rf /opt/tradeai
sudo rm -rf /var/lib/mongodb/*
sudo rm -rf /var/log/mongodb/*
sudo rm -rf /tmp/tradeai*

# Clean package cache
echo "Cleaning package cache..."
sudo apt-get clean
sudo apt-get autoremove -y

# Remove old Node.js versions
echo "Cleaning Node.js..."
sudo rm -rf /usr/local/lib/node_modules
sudo rm -rf ~/.npm

echo "✅ Server cleanup completed!"
EOF

chmod +x cleanup-server.sh
```

### Step 2: Run Cleanup

```bash
./cleanup-server.sh
```

## 🔧 Fresh Installation

### Step 1: System Updates

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install essential packages
sudo apt-get install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### Step 2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Clone and Setup TRADEAI

```bash
# Clone repository
git clone https://github.com/Reshigan/TRADEAI.git
cd TRADEAI

# Make scripts executable
chmod +x *.sh

# Create environment file
cp backend/.env.example backend/.env
```

### Step 5: Configure Environment

Edit the environment file:

```bash
nano backend/.env
```

**Required Configuration:**

```env
# Environment
NODE_ENV=production
PORT=5002

# Database
MONGODB_URI=mongodb://admin:password123@mongodb:27017/trade-ai?authSource=admin
USE_MOCK_DB=false

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# JWT (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-now
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-now
JWT_REFRESH_EXPIRES_IN=30d

# Client URL
CLIENT_URL=http://your-domain.com:3001
```

### Step 6: Deploy with Docker

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 7: Initialize Database

```bash
# Wait for MongoDB to be ready (about 30 seconds)
sleep 30

# Run production seed
docker-compose exec backend npm run seed:production
```

## 🔍 Verification Steps

### Check Services

```bash
# Check all containers are running
docker-compose ps

# Check MongoDB
docker-compose exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin --eval "db.runCommand('ping')"

# Check Redis
docker-compose exec redis redis-cli -a redis_password ping

# Check backend health
curl http://localhost:5001/health

# Check frontend
curl http://localhost:3001
```

### Access the Application

- **Frontend**: http://your-server-ip:3001
- **Backend API**: http://your-server-ip:5001
- **AI Services**: http://your-server-ip:8000
- **Monitoring**: http://your-server-ip:8081

### Default Login Credentials

**GONXT Admin:**
- Email: `admin@gonxt.tech`
- Password: `GonxtAdmin2024!`

**Test Company Admin:**
- Email: `admin@test.demo`
- Password: `TestAdmin2024!`

## 🛠️ Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using ports
   sudo netstat -tulpn | grep :3001
   sudo netstat -tulpn | grep :5001
   
   # Kill processes if needed
   sudo fuser -k 3001/tcp
   sudo fuser -k 5001/tcp
   ```

2. **MongoDB connection issues:**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Restart MongoDB
   docker-compose restart mongodb
   ```

3. **Permission issues:**
   ```bash
   # Fix permissions
   sudo chown -R $USER:$USER .
   chmod +x *.sh
   ```

### Service Management

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: This deletes data!)
docker-compose down -v

# Restart specific service
docker-compose restart backend

# View service logs
docker-compose logs -f backend
```

## 🔒 Security Hardening

### Step 1: Firewall Setup

```bash
# Install UFW
sudo apt-get install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 5001/tcp

# Enable firewall
sudo ufw enable
```

### Step 2: SSL/TLS Setup (Optional)

```bash
# Install Certbot
sudo apt-get install -y certbot

# Get SSL certificate (replace with your domain)
sudo certbot certonly --standalone -d your-domain.com

# Update nginx configuration to use SSL
# (Modify nginx.conf accordingly)
```

### Step 3: Environment Security

```bash
# Secure environment file
chmod 600 backend/.env

# Change default passwords in .env file
nano backend/.env
```

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "🔍 TRADEAI Health Check"
echo "======================="

# Check Docker containers
echo "Docker Containers:"
docker-compose ps

# Check disk space
echo -e "\nDisk Usage:"
df -h

# Check memory usage
echo -e "\nMemory Usage:"
free -h

# Check service endpoints
echo -e "\nService Health:"
curl -s http://localhost:5001/health && echo " ✅ Backend OK" || echo " ❌ Backend Failed"
curl -s http://localhost:3001 > /dev/null && echo " ✅ Frontend OK" || echo " ❌ Frontend Failed"
curl -s http://localhost:8000/health > /dev/null && echo " ✅ AI Services OK" || echo " ❌ AI Services Failed"
EOF

chmod +x health-check.sh
```

### Backup Script

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/tradeai-backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose exec -T mongodb mongodump --username admin --password password123 --authenticationDatabase admin --archive | gzip > $BACKUP_DIR/mongodb_$DATE.gz

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz --exclude=node_modules --exclude=.git .

echo "✅ Backup completed: $BACKUP_DIR"
EOF

chmod +x backup.sh
```

## 🚀 Production Deployment Checklist

- [ ] Server cleanup completed
- [ ] Docker and Docker Compose installed
- [ ] Node.js 18.x installed
- [ ] Repository cloned and configured
- [ ] Environment variables set (especially JWT secrets)
- [ ] All services started with `docker-compose up -d`
- [ ] Database seeded with production data
- [ ] Health checks passing
- [ ] Firewall configured
- [ ] SSL certificates installed (if applicable)
- [ ] Backup script configured
- [ ] Monitoring setup verified

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs: `docker-compose logs -f [service-name]`
3. Verify all prerequisites are met
4. Ensure all ports are available and not blocked by firewall

## 🔄 Updates and Maintenance

### Updating TRADEAI

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run any new migrations if needed
docker-compose exec backend npm run migrate
```

### Regular Maintenance

```bash
# Weekly cleanup
docker system prune -f

# Monthly backup
./backup.sh

# Check for updates
git fetch origin
git status
```

---

**🎉 Congratulations! Your TRADEAI installation is now complete and ready for production use.**