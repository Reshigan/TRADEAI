# 🚀 TRADEAI Simple Deployment Guide

Deploy your premium corporate FMCG trading platform in 3 simple steps!

## 📋 Prerequisites

- **Linux/macOS/Windows with WSL2**
- **Docker** (will be installed automatically if missing)
- **Docker Compose** (will be installed automatically if missing)
- **8GB RAM minimum** (16GB recommended)
- **10GB free disk space**

## 🚀 Quick Deployment (3 Steps)

### Step 1: Clone the Repository
```bash
git clone https://github.com/Reshigan/TRADEAI.git
cd TRADEAI
```

### Step 2: Run the Deployment Script
```bash
./deploy.sh
```

### Step 3: Access Your Platform
Open your browser and go to: **http://localhost:3000**

**That's it!** 🎉

## 🔐 Default Login

- **Email:** `admin@tradeai.com`
- **Password:** `admin123`

## 📊 What Gets Deployed

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 3000 | React web application |
| **Backend** | 5000 | Node.js API server |
| **MongoDB** | 27017 | Database |
| **Redis** | 6379 | Cache |

## 📋 Management Commands

```bash
# View all service logs
docker-compose -f docker-compose.simple.yml logs -f

# View specific service logs
docker logs tradeai_backend
docker logs tradeai_frontend
docker logs tradeai_mongodb
docker logs tradeai_redis

# Stop all services
docker-compose -f docker-compose.simple.yml down

# Restart all services
docker-compose -f docker-compose.simple.yml restart

# Check service status
docker-compose -f docker-compose.simple.yml ps
```

## 🔧 Troubleshooting

### Backend Not Starting?
```bash
# Check backend logs
docker logs tradeai_backend

# Restart backend only
docker-compose -f docker-compose.simple.yml restart backend
```

### Frontend Not Loading?
```bash
# Check frontend logs
docker logs tradeai_frontend

# Restart frontend only
docker-compose -f docker-compose.simple.yml restart frontend
```

### Database Issues?
```bash
# Check MongoDB logs
docker logs tradeai_mongodb

# Reset database (WARNING: This deletes all data)
docker-compose -f docker-compose.simple.yml down -v
./deploy.sh
```

### Complete Reset
```bash
# Stop everything and remove all data
docker-compose -f docker-compose.simple.yml down -v
docker system prune -f

# Redeploy
./deploy.sh
```

## 🌐 Production Deployment

For production deployment:

1. **Change default passwords** in `docker-compose.simple.yml`
2. **Set up SSL/HTTPS** with a reverse proxy (nginx)
3. **Configure firewall** to allow only necessary ports
4. **Set up backups** for MongoDB data
5. **Monitor logs** and set up log rotation

### Quick Production Setup
```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Edit docker-compose.simple.yml and replace the default secrets
# Then deploy normally
./deploy.sh
```

## 📈 Performance Tips

- **Minimum 8GB RAM** for smooth operation
- **SSD storage** recommended for database performance
- **Monitor disk space** - MongoDB can grow large with data
- **Regular backups** of MongoDB data volume

## 🆘 Support

- **GitHub Issues:** https://github.com/Reshigan/TRADEAI/issues
- **Documentation:** Check other `.md` files in this repository
- **Logs:** Always check service logs first for troubleshooting

## 🎯 Features Included

✅ **Premium Corporate UI** with glassmorphism design  
✅ **Complete FMCG Trading Platform** with all modules  
✅ **Real-time Dashboard** with analytics  
✅ **User Management** with role-based access  
✅ **Product Catalog** management  
✅ **Promotion Engine** for campaigns  
✅ **Budget Planning** and tracking  
✅ **Responsive Design** for all devices  
✅ **Production Ready** with Docker deployment  

---

**🚀 Your premium corporate FMCG trading platform is ready in under 5 minutes!**