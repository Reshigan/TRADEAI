# 🚀 TRADEAI Quick Installation Guide

## One-Command Installation

For **ARM64** (AWS Graviton) or **AMD64** systems:

```bash
sudo bash <(curl -fsSL https://raw.githubusercontent.com/Reshigan/TRADEAI/main/deploy-aws.sh)
```

## Manual Installation Steps

If you prefer manual installation:

### 1. Download and Run Installer
```bash
cd /opt
sudo curl -fsSL https://raw.githubusercontent.com/Reshigan/TRADEAI/main/deploy-aws.sh -o deploy-aws.sh
sudo chmod +x deploy-aws.sh
sudo ./deploy-aws.sh
```

### 2. Alternative: Clone and Deploy
```bash
cd /opt
sudo git clone https://github.com/Reshigan/TRADEAI.git tradeai
cd tradeai
sudo chmod +x deploy-aws.sh
sudo ./deploy-aws.sh
```

## System Requirements

- **OS**: Ubuntu 20.04+ or Amazon Linux 2
- **Architecture**: ARM64 (aarch64) or AMD64 (x86_64)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB free space
- **Network**: Ports 80, 443, 22 accessible

## What the Installer Does

1. **🔍 System Detection**: Automatically detects ARM64/AMD64 architecture
2. **📦 Dependencies**: Installs Docker, Docker Compose, and system packages
3. **🔥 Firewall**: Configures UFW firewall with necessary ports
4. **📁 Project Setup**: Clones repository and sets up directory structure
5. **⚙️ Configuration**: Creates optimized environment configuration
6. **🐳 Deployment**: Builds and starts all Docker containers
7. **✅ Verification**: Tests all services and endpoints

## Architecture-Specific Optimizations

### ARM64 (AWS Graviton)
- Uses `mongo:6.0` for better ARM64 compatibility
- Optimized Docker platform specifications
- Extended health check timeouts for ARM64 performance

### AMD64 (Intel/AMD)
- Uses standard Docker configurations
- Optimized for x86_64 performance

## Post-Installation

### Access Your Application
- **Main App**: http://tradeai.gonxt.tech or http://13.247.139.75
- **API**: http://tradeai.gonxt.tech/api/v1
- **AI Services**: http://tradeai.gonxt.tech:8000
- **Monitoring**: http://tradeai.gonxt.tech:8080

### Management Commands
```bash
cd /opt/tradeai

# View logs
sudo docker compose logs -f

# Restart services
sudo docker compose restart

# Stop services
sudo docker compose down

# Start services
sudo docker compose up -d

# Check status
sudo docker compose ps
```

### Default Credentials
- **MongoDB**: `admin` / `TradeAI_Mongo_2024!`
- **Redis**: `TradeAI_Redis_2024!`

⚠️ **Change these passwords in production!**

## Troubleshooting

### MongoDB Issues on ARM64
If MongoDB fails to start:
```bash
cd /opt/tradeai
sudo docker compose down -v
sudo sed -i 's/mongo:6.0/mongo:5.0/g' docker-compose.yml
sudo docker compose up -d
```

### Port Conflicts
```bash
# Check what's using port 80
sudo netstat -tulpn | grep :80

# Kill process using port 80
sudo fuser -k 80/tcp
```

### View Detailed Logs
```bash
# Deployment log
sudo tail -f /var/log/tradeai-deploy.log

# Service logs
cd /opt/tradeai
sudo docker compose logs mongodb
sudo docker compose logs backend
sudo docker compose logs frontend
```

### Reset Installation
```bash
cd /opt/tradeai
sudo docker compose down -v
sudo docker system prune -f
sudo ./deploy-aws.sh
```

## Support

- **Documentation**: `/opt/tradeai/docs/`
- **GitHub**: https://github.com/Reshigan/TRADEAI
- **Issues**: Create an issue on GitHub

---

**🎉 Your TRADEAI installation should be ready in 5-10 minutes!**