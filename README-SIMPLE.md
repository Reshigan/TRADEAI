# 🚀 TRADEAI - Premium Corporate FMCG Trading Platform

A sophisticated, enterprise-grade Fast-Moving Consumer Goods (FMCG) trading platform designed for corporate environments. Built with modern web technologies and featuring a premium glassmorphism UI design.

## ⚡ **SUPER SIMPLE DEPLOYMENT** 

### 🎯 **One-Line Installation**
```bash
curl -fsSL https://raw.githubusercontent.com/Reshigan/TRADEAI/main/install.sh | bash
```

### 🎯 **Three-Step Manual Installation**
```bash
git clone https://github.com/Reshigan/TRADEAI.git
cd TRADEAI
./deploy.sh
```

**That's it!** Your platform will be ready at **http://localhost:3000** in under 5 minutes! 🎉

## 🔐 **Default Login**
- **Email:** `admin@tradeai.com`
- **Password:** `admin123`

## 🌟 **Features**

✅ **Premium Corporate UI** with glassmorphism design  
✅ **Complete FMCG Trading Platform** with all modules  
✅ **Real-time Dashboard** with analytics  
✅ **User Management** with role-based access  
✅ **Product Catalog** management  
✅ **Promotion Engine** for campaigns  
✅ **Budget Planning** and tracking  
✅ **Responsive Design** for all devices  
✅ **Production Ready** with Docker deployment  

## 📋 **System Requirements**

- **Linux/macOS/Windows with WSL2**
- **8GB RAM minimum** (16GB recommended)
- **10GB free disk space**
- **Docker** (auto-installed if missing)

## 🛠️ **Management Commands**

```bash
# View all logs
docker-compose -f docker-compose.simple.yml logs -f

# Stop platform
docker-compose -f docker-compose.simple.yml down

# Restart platform  
docker-compose -f docker-compose.simple.yml restart

# Check status
docker-compose -f docker-compose.simple.yml ps
```

## 🌐 **Services & Ports**

| Service | Port | URL |
|---------|------|-----|
| **Frontend** | 3000 | http://localhost:3000 |
| **Backend API** | 5000 | http://localhost:5000 |
| **API Docs** | 5000 | http://localhost:5000/api/docs |
| **MongoDB** | 27017 | Internal |
| **Redis** | 6379 | Internal |

## 🔧 **Troubleshooting**

### Quick Fixes
```bash
# Reset everything (WARNING: Deletes all data)
docker-compose -f docker-compose.simple.yml down -v
./deploy.sh

# View specific service logs
docker logs tradeai_backend
docker logs tradeai_frontend
docker logs tradeai_mongodb
docker logs tradeai_redis
```

### Common Issues
- **Port conflicts:** Change ports in `docker-compose.simple.yml`
- **Memory issues:** Ensure 8GB+ RAM available
- **Permission errors:** Don't run as root user

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   React.js      │◄──►│   Node.js       │◄──►│   MongoDB       │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Cache         │
                       │   Redis         │
                       │   Port: 6379    │
                       └─────────────────┘
```

## 📚 **Documentation**

- **[DEPLOY.md](DEPLOY.md)** - Detailed deployment guide
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API reference
- **[FEATURES.md](FEATURES.md)** - Feature overview
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## 🚀 **Production Deployment**

For production use:

1. **Change default passwords** in `docker-compose.simple.yml`
2. **Set up SSL/HTTPS** with nginx reverse proxy
3. **Configure firewall** rules
4. **Set up automated backups**
5. **Monitor system resources**

## 🤝 **Support**

- **GitHub Issues:** [Report bugs](https://github.com/Reshigan/TRADEAI/issues)
- **Documentation:** Check `.md` files in repository
- **Logs:** Always check service logs for troubleshooting

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

**🎯 Deploy your premium corporate FMCG trading platform in under 5 minutes!**