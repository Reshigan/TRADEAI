# 🚀 TRADEAI AWS Deployment Guide

Complete guide for deploying TRADEAI on AWS EC2 instance.

## 📋 Server Information

- **Server IP**: 13.247.139.75
- **Domain**: tradeai.gonxt.tech
- **OS**: Ubuntu/Debian (recommended)
- **Minimum Requirements**: 4GB RAM, 20GB Storage, 2 vCPUs

## 🎯 Quick Deployment (Recommended)

### One-Command Installation

```bash
# SSH into your AWS server
ssh ubuntu@13.247.139.75

# Run the automated deployment script
curl -fsSL https://raw.githubusercontent.com/Reshigan/TRADEAI/main/deploy-aws.sh -o deploy-aws.sh
chmod +x deploy-aws.sh
sudo ./deploy-aws.sh
```

This script will:
- ✅ Install Docker and Docker Compose
- ✅ Configure firewall (UFW)
- ✅ Clone the TRADEAI repository
- ✅ Set up environment configuration
- ✅ Build and deploy all services
- ✅ Configure automatic maintenance tasks
- ✅ Set up monitoring and health checks

## 🔧 Manual Deployment

If you prefer manual control or need to customize the deployment:

### Step 1: Prepare the Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip software-properties-common
```

### Step 2: Install Docker

```bash
# Remove old Docker installations
sudo apt-get remove -y docker docker-engine docker.io containerd runc

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

### Step 3: Configure Firewall

```bash
# Install and configure UFW
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### Step 4: Clone and Deploy

```bash
# Create project directory
sudo mkdir -p /opt/tradeai
cd /opt/tradeai

# Clone repository
sudo git clone https://github.com/Reshigan/TRADEAI.git .

# Set up environment
sudo cp .env.example .env

# Edit environment file (optional)
sudo nano .env

# Deploy services
sudo docker compose up -d --build
```

## 🔐 Environment Configuration

The `.env` file contains all configuration options. Key settings:

```bash
# Server Configuration
DOMAIN=tradeai.gonxt.tech
SERVER_IP=13.247.139.75

# Database Credentials
MONGO_USERNAME=admin
MONGO_PASSWORD=TradeAI_Mongo_2024!
REDIS_PASSWORD=TradeAI_Redis_2024!

# Security Keys (CHANGE IN PRODUCTION!)
JWT_SECRET=TradeAI_JWT_Super_Secret_Key_2024_Change_This_In_Production
JWT_REFRESH_SECRET=TradeAI_JWT_Refresh_Super_Secret_Key_2024_Change_This_Too
```

## 🏗️ Architecture Overview

TRADEAI consists of 6 main services:

1. **MongoDB** (Port 27017) - Database
2. **Redis** (Port 6379) - Cache & Sessions
3. **Backend** (Port 5000) - Node.js API
4. **Frontend** (Port 80) - React Application
5. **AI Services** (Port 8000) - Python ML/AI
6. **Monitoring** (Port 8080) - System Monitoring
7. **Nginx** (Port 80/443) - Reverse Proxy

## 🌐 Access Points

After deployment, access the application at:

- **Main Application**: http://tradeai.gonxt.tech
- **Direct IP**: http://13.247.139.75
- **API Documentation**: http://tradeai.gonxt.tech/api/docs
- **Monitoring Dashboard**: http://tradeai.gonxt.tech/monitoring
- **AI Services**: http://tradeai.gonxt.tech/ai

## 👥 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tradeai.com | password123 |
| Manager | manager@tradeai.com | password123 |
| KAM | kam@tradeai.com | password123 |

**⚠️ Important**: Change these credentials after first login!

## 🔧 Management Commands

### Service Management

```bash
# View all services status
sudo docker compose ps

# View logs
sudo docker compose logs -f

# Restart all services
sudo docker compose restart

# Stop all services
sudo docker compose down

# Update and redeploy
cd /opt/tradeai
sudo git pull
sudo docker compose up -d --build
```

### Individual Service Management

```bash
# Restart specific service
sudo docker compose restart backend
sudo docker compose restart frontend
sudo docker compose restart nginx

# View specific service logs
sudo docker compose logs -f backend
sudo docker compose logs -f frontend
```

### Database Management

```bash
# Access MongoDB shell
sudo docker compose exec mongodb mongosh -u admin -p TradeAI_Mongo_2024! --authenticationDatabase admin

# Backup database
sudo docker compose exec mongodb mongodump --out /tmp/backup
sudo docker compose cp mongodb:/tmp/backup ./backups/$(date +%Y%m%d_%H%M%S)

# Access Redis CLI
sudo docker compose exec redis redis-cli -a TradeAI_Redis_2024!
```

## 🔒 SSL/HTTPS Setup (Optional)

To enable HTTPS with SSL certificates:

### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot

# Stop nginx temporarily
sudo docker compose stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d tradeai.gonxt.tech

# Copy certificates
sudo mkdir -p /opt/tradeai/ssl
sudo cp /etc/letsencrypt/live/tradeai.gonxt.tech/fullchain.pem /opt/tradeai/ssl/
sudo cp /etc/letsencrypt/live/tradeai.gonxt.tech/privkey.pem /opt/tradeai/ssl/

# Update nginx configuration
sudo cp /opt/tradeai/nginx.conf /opt/tradeai/nginx-simple.conf
# Edit nginx.conf to enable SSL sections

# Restart nginx
sudo docker compose up -d nginx
```

### Option 2: Custom SSL Certificates

```bash
# Place your certificates in the ssl directory
sudo mkdir -p /opt/tradeai/ssl
sudo cp your-cert.pem /opt/tradeai/ssl/cert.pem
sudo cp your-key.pem /opt/tradeai/ssl/key.pem

# Update nginx configuration and restart
sudo docker compose restart nginx
```

## 📊 Monitoring & Maintenance

### Automated Maintenance

The deployment script sets up automatic maintenance tasks:

- **Weekly Docker cleanup**: Sundays at 2 AM
- **Daily database backup**: Every day at 3 AM

### Manual Maintenance

```bash
# Clean up Docker resources
sudo docker system prune -f
sudo docker image prune -f

# View system resources
sudo docker stats

# Check disk usage
df -h
du -sh /opt/tradeai

# View system logs
sudo journalctl -u docker -f
```

### Health Checks

```bash
# Check all services health
curl http://localhost/health

# Check individual services
curl http://localhost:5000/health    # Backend
curl http://localhost:8000/health    # AI Services
curl http://localhost:8080/health    # Monitoring
```

## 🚨 Troubleshooting

### Common Issues

#### Services won't start
```bash
# Check logs
sudo docker compose logs

# Check system resources
free -h
df -h

# Restart Docker daemon
sudo systemctl restart docker
```

#### Port conflicts
```bash
# Check what's using ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Kill conflicting processes
sudo fuser -k 80/tcp
sudo fuser -k 443/tcp
```

#### Database connection issues
```bash
# Check MongoDB status
sudo docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Reset database (WARNING: This deletes all data)
sudo docker compose down
sudo docker volume rm tradeai_mongodb_data
sudo docker compose up -d
```

#### Frontend not loading
```bash
# Rebuild frontend
sudo docker compose build --no-cache frontend
sudo docker compose up -d frontend

# Check nginx configuration
sudo docker compose exec nginx nginx -t
```

### Performance Optimization

#### For production environments:

```bash
# Increase Docker resources (if needed)
# Edit /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker
sudo systemctl restart docker
```

## 📞 Support

For issues or questions:

1. Check the logs: `sudo docker compose logs -f`
2. Review this guide
3. Check GitHub issues: https://github.com/Reshigan/TRADEAI/issues
4. Contact support with detailed error messages and logs

## 🔄 Updates

To update TRADEAI to the latest version:

```bash
cd /opt/tradeai
sudo git pull
sudo docker compose down
sudo docker compose up -d --build
```

## 🎯 Next Steps

After successful deployment:

1. **Change default passwords**
2. **Configure SSL certificates** (recommended)
3. **Set up regular backups**
4. **Configure monitoring alerts**
5. **Customize branding and settings**
6. **Import your data**
7. **Train your team**

---

**🎉 Congratulations!** Your TRADEAI platform is now ready for production use.

Access your platform at: **http://tradeai.gonxt.tech**