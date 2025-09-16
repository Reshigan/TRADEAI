# 🚀 TRADEAI Production Deployment - Complete Guide

**Date**: September 16, 2025  
**Version**: v2.1.3  
**Status**: ✅ Production Ready  

## 📋 Server Information

- **Production Server**: 13.247.139.75
- **User**: ubuntu
- **Domain**: tradeai.gonxt.tech
- **SSH Key**: TPMServer.pem (included in repository)
- **OS**: Ubuntu Server
- **Requirements**: 4GB RAM, 20GB Storage, 2 vCPUs

## 🔐 SSH Access Setup

The TPMServer.pem key has been added to the repository for production access:

```bash
# Set proper permissions for the PEM key
chmod 600 TPMServer.pem

# SSH into production server
ssh -i TPMServer.pem ubuntu@13.247.139.75
```

## 🎯 Complete Deployment Process

### 1. Repository Status
- ✅ All changes committed to main branch
- ✅ Pull request #10 merged successfully
- ✅ TPMServer.pem added for production access
- ✅ Latest code available on GitHub

### 2. One-Command Deployment

SSH into the production server and run:

```bash
# SSH to production server
ssh -i TPMServer.pem ubuntu@13.247.139.75

# Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/Reshigan/TRADEAI/main/deploy-aws.sh -o deploy-aws.sh
chmod +x deploy-aws.sh
sudo ./deploy-aws.sh
```

### 3. Alternative Deployment Scripts

Multiple deployment options are available:

```bash
# Clean production deployment (recommended for updates)
sudo ./CLEAN_PRODUCTION_DEPLOY.sh

# Nuclear clean install (for fresh installations)
sudo ./NUCLEAR_CLEAN_INSTALL.sh

# Docker production deployment
sudo ./DOCKER_PRODUCTION_DEPLOY_FINAL.sh

# Quick deployment fix (for minor updates)
sudo ./QUICK_DEPLOYMENT_FIX.sh
```

## 🌐 Application Access

After successful deployment:

- **Main Application**: http://tradeai.gonxt.tech
- **Direct IP Access**: http://13.247.139.75
- **API Endpoint**: http://tradeai.gonxt.tech/api
- **Monitoring Dashboard**: http://tradeai.gonxt.tech/monitoring

## 👥 Test Accounts

Pre-configured test accounts for immediate access:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@testcompany.demo | admin123 |
| Manager | manager@testcompany.demo | manager123 |
| KAM | kam@testcompany.demo | kam123 |
| Sales | sales@testcompany.demo | sales123 |

## 🔍 Deployment Verification

Run the comprehensive test suite to verify deployment:

```bash
# On the production server
cd TRADEAI
./test-deployment.sh
```

Or run the full system test:

```bash
python3 tests/full_system_test.py
```

## 📊 Services Overview

The deployment includes:

- **Frontend**: React 18+ with premium glass morphism UI
- **Backend**: Node.js API server with Express
- **Database**: MongoDB with Redis caching
- **AI Services**: Python-based analytics engine
- **Monitoring**: Real-time system monitoring
- **Nginx**: Reverse proxy and load balancer

## 🛠️ Maintenance Commands

Common maintenance tasks:

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
git pull origin main
docker-compose up -d --build

# Backup database
./scripts/backup-mongodb.sh
```

## 🔧 Troubleshooting

If deployment issues occur:

1. **Check Docker status**: `sudo systemctl status docker`
2. **Verify ports**: `sudo netstat -tlnp | grep :80`
3. **Check logs**: `docker-compose logs`
4. **Run diagnostics**: `./diagnose-deployment.sh`

## 📈 Performance Monitoring

Monitor system performance:

- **CPU/Memory**: `htop` or `docker stats`
- **Disk Usage**: `df -h`
- **Network**: `netstat -i`
- **Application Logs**: `docker-compose logs -f backend`

## 🔄 Update Process

To update the production deployment:

1. **Pull latest changes**: `git pull origin main`
2. **Rebuild containers**: `docker-compose up -d --build`
3. **Verify deployment**: `./test-deployment.sh`
4. **Monitor logs**: `docker-compose logs -f`

## 📞 Support Information

For deployment support or issues:

- **Repository**: https://github.com/Reshigan/TRADEAI
- **Documentation**: `/docs` directory
- **Issue Tracker**: GitHub Issues
- **Latest Release**: v2.1.3

---

**✅ Deployment Status**: Ready for production deployment  
**🔐 SSH Access**: Configured with TPMServer.pem  
**🚀 Next Step**: SSH to server and run deployment script