# 🐳 TRADEAI Docker Production Deployment

This document explains how to deploy TRADEAI using Docker for production environments.

## 🚀 Quick Start

```bash
# Download and run the Docker deployment script
wget https://raw.githubusercontent.com/Reshigan/TRADEAI/main/DOCKER_PRODUCTION_DEPLOY.sh
chmod +x DOCKER_PRODUCTION_DEPLOY.sh
sudo ./DOCKER_PRODUCTION_DEPLOY.sh
```

## 🏗️ Architecture

TRADEAI uses a multi-container Docker architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Frontend      │    │   Backend       │
│   (Port 80/443) │────│   (Port 3000)   │────│   (Port 3001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         │              ┌─────────────────┐            │
         └──────────────│   PostgreSQL    │────────────┘
                        │   (Port 5432)   │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │     Redis       │
                        │   (Port 6379)   │
                        └─────────────────┘
```

## 📦 Containers

### Frontend Container
- **Base Image**: `nginx:alpine`
- **Purpose**: Serves React application
- **Port**: 3000 (internal)
- **Features**: 
  - Multi-stage build (Node.js build → Nginx serve)
  - Gzip compression
  - Security headers
  - Health checks

### Backend Container
- **Base Image**: `node:20-alpine`
- **Purpose**: Node.js API server
- **Port**: 3001 (internal)
- **Features**:
  - Production dependencies only
  - Non-root user execution
  - Health checks
  - Auto-restart on failure

### Nginx Proxy Container
- **Base Image**: `nginx:alpine`
- **Purpose**: Reverse proxy and SSL termination
- **Ports**: 80, 443 (external)
- **Features**:
  - SSL/TLS termination
  - Load balancing
  - Security headers
  - Gzip compression

### PostgreSQL Container
- **Base Image**: `postgres:15-alpine`
- **Purpose**: Primary database
- **Port**: 5432 (internal)
- **Features**:
  - Persistent data storage
  - Health checks
  - Automatic backups

### Redis Container
- **Base Image**: `redis:7-alpine`
- **Purpose**: Cache and session storage
- **Port**: 6379 (internal)
- **Features**:
  - Persistent data storage
  - AOF persistence
  - Health checks

## 🔧 Management Commands

After deployment, use these commands in the application directory:

### Basic Operations
```bash
# Start all containers
./start.sh

# Stop all containers
./stop.sh

# Restart all containers
./restart.sh

# View container status
./status.sh

# View logs (all containers)
./logs.sh

# View logs (specific container)
./logs.sh backend
./logs.sh frontend
./logs.sh nginx
```

### Docker Compose Commands
```bash
# View container status
docker-compose ps

# View logs
docker-compose logs -f [service]

# Execute command in container
docker-compose exec backend bash
docker-compose exec frontend sh

# Scale services
docker-compose up -d --scale backend=3

# Update and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Update Deployment
```bash
# Update from Git and rebuild
./update.sh
```

## 📁 Directory Structure

```
tradeai-docker/
├── backend/
│   ├── Dockerfile
│   ├── src/
│   └── package.json
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   └── package.json
├── docker/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── sites/
│   │       └── tradeai.conf
│   ├── ssl/
│   └── logs/
├── data/
│   ├── postgres/
│   └── redis/
├── docker-compose.yml
├── start.sh
├── stop.sh
├── restart.sh
├── logs.sh
├── status.sh
└── update.sh
```

## 🔒 Security Features

### Container Security
- **Non-root users** in all containers
- **Read-only filesystems** where possible
- **Resource limits** to prevent abuse
- **Health checks** for automatic recovery
- **Network isolation** between containers

### SSL/TLS
- **Automatic SSL certificate** generation with Let's Encrypt
- **HTTPS redirect** for all HTTP traffic
- **Strong cipher suites** and protocols
- **HSTS headers** for enhanced security

### Network Security
- **Internal Docker network** for container communication
- **Firewall rules** allowing only necessary ports
- **Proxy headers** for real IP tracking
- **Rate limiting** (configurable)

## 🔍 Monitoring and Logging

### Health Checks
All containers include health checks:
- **Frontend**: HTTP GET to `/`
- **Backend**: HTTP GET to `/api/health`
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command

### Logging
- **Centralized logging** in `docker/logs/`
- **Log rotation** to prevent disk space issues
- **Structured logging** with timestamps
- **Container-specific logs** for debugging

### Monitoring Commands
```bash
# Check container health
docker-compose ps

# View resource usage
docker stats

# Check logs for errors
docker-compose logs --tail=100 | grep ERROR

# Monitor in real-time
docker-compose logs -f
```

## 🚀 Scaling and Performance

### Horizontal Scaling
```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Scale with load balancer
docker-compose up -d --scale backend=5 --scale frontend=2
```

### Performance Optimization
- **Multi-stage builds** reduce image size
- **Alpine Linux** base images for minimal footprint
- **Nginx caching** for static assets
- **Gzip compression** for reduced bandwidth
- **Connection pooling** for database connections

## 🔧 Troubleshooting

### Common Issues

#### Containers not starting
```bash
# Check container logs
docker-compose logs [service]

# Check container status
docker-compose ps

# Rebuild containers
docker-compose build --no-cache
```

#### SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Restart nginx after certificate renewal
docker-compose restart nginx
```

#### Database connection issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U tradeai -d tradeai

# Check database connectivity from backend
docker-compose exec backend curl -f http://localhost:3001/api/health
```

#### Performance issues
```bash
# Check resource usage
docker stats

# Check container health
docker-compose exec backend curl -f http://localhost:3001/api/health
docker-compose exec frontend curl -f http://localhost:3000

# Scale services if needed
docker-compose up -d --scale backend=3
```

## 🔄 Backup and Recovery

### Database Backup
```bash
# Create database backup
docker-compose exec postgres pg_dump -U tradeai tradeai > backup.sql

# Restore database backup
docker-compose exec -T postgres psql -U tradeai tradeai < backup.sql
```

### Full System Backup
```bash
# Backup entire application
tar -czf tradeai-backup-$(date +%Y%m%d).tar.gz tradeai-docker/

# Backup data volumes
docker run --rm -v tradeai-docker_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data.tar.gz /data
```

## 🌐 Environment Variables

### Production Environment
```bash
# Backend environment
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://tradeai:password@postgres:5432/tradeai
REDIS_URL=redis://redis:6379

# Frontend environment
NODE_ENV=production
REACT_APP_API_URL=/api
```

### Development Override
Use `docker-compose.override.yml` for development settings:
- Hot reloading
- Development databases
- Debug logging
- Exposed ports for direct access

## 📞 Support

For issues with the Docker deployment:

1. **Check logs**: `./logs.sh` or `docker-compose logs`
2. **Verify health**: `./status.sh` or `docker-compose ps`
3. **Restart services**: `./restart.sh`
4. **Update deployment**: `./update.sh`

## ✅ Benefits of Docker Deployment

- **🔒 Complete Isolation**: No permission or dependency conflicts
- **📦 Consistent Environment**: Same setup across all deployments
- **🚀 Easy Scaling**: Scale individual services as needed
- **🔄 Simple Updates**: Update with single command
- **💾 Easy Backup**: Backup entire application with data
- **🛡️ Enhanced Security**: Container isolation and security
- **🎯 No Version Conflicts**: Each service has its own environment
- **⚡ Fast Deployment**: Deploy entire stack in minutes
- **🔧 Simple Management**: Easy start/stop/restart operations