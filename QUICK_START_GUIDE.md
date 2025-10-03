# TRADEAI - Quick Start Guide 🚀

This guide provides clear, step-by-step instructions for setting up and running TRADEAI.

## Prerequisites

- **Node.js**: v18.20.8 or higher
- **MongoDB**: v7.0 or higher
- **Redis**: v7.2 or higher
- **Docker & Docker Compose**: (Recommended) Latest version
- **Git**: For cloning the repository

## Setup Options

### Option 1: Docker Compose (Recommended) ⭐

This is the easiest way to get started.

```bash
# 1. Clone the repository
git clone https://github.com/Reshigan/TRADEAI.git
cd TRADEAI

# 2. Create environment file
cp .env.example .env

# 3. Edit .env and set your configurations
# IMPORTANT: Change all passwords and secrets!
nano .env

# 4. Start all services
docker-compose up -d

# 5. Check logs
docker-compose logs -f

# 6. Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:5000
# API Docs: http://localhost:5000/api/docs
```

### Option 2: Manual Setup (Development)

If you prefer to run services manually:

#### Step 1: Install MongoDB

```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
mongo --eval "db.serverStatus()"
```

#### Step 2: Install Redis

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
```

#### Step 3: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp ../.env.example .env

# Edit environment variables
nano .env

# Run database migrations (if any)
npm run migrate

# Seed initial data
npm run seed

# Start backend server
npm run dev
```

#### Step 4: Setup Frontend

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000" > .env

# Start frontend server
npm start
```

#### Step 5: Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs

## Default Credentials

⚠️ **SECURITY WARNING**: Change these immediately in production!

```
Super Admin:
  Email: admin@tradeai.com
  Password: admin123

Trade Marketing Manager:
  Email: manager@tradeai.com
  Password: admin123

Key Account Manager (KAM):
  Email: kam@tradeai.com
  Password: admin123
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with these settings:

```bash
# Application
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/tradeai
REDIS_URL=redis://localhost:6379

# Security (Generate strong secrets!)
JWT_SECRET=your-strong-jwt-secret-here
JWT_REFRESH_SECRET=your-strong-refresh-secret-here

# CORS
CORS_ORIGIN=http://localhost:3001
```

### Generate Strong Secrets

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## Common Issues & Solutions

### Issue: Port Already in Use

```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

### Issue: MongoDB Connection Failed

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

### Issue: Redis Connection Failed

```bash
# Check if Redis is running
sudo systemctl status redis-server

# Restart Redis
sudo systemctl restart redis-server
```

### Issue: npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## Production Deployment

### Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Enable rate limiting
- [ ] Configure monitoring (Prometheus/Grafana)
- [ ] Set up error tracking (Sentry)
- [ ] Review and update CORS settings
- [ ] Enable audit logging
- [ ] Set up automated security updates

### Production Environment Variables

```bash
NODE_ENV=production
LOG_LEVEL=info
ENABLE_SWAGGER=false  # Disable API docs in production

# Use strong, unique passwords
MONGODB_URI=mongodb://user:STRONG_PASSWORD@host:27017/tradeai?authSource=admin
REDIS_URL=redis://:STRONG_PASSWORD@host:6379

# Generate new secrets
JWT_SECRET=<64-char-secret>
JWT_REFRESH_SECRET=<64-char-secret>

# Production domain
CORS_ORIGIN=https://your-domain.com
```

### Docker Production Deployment

```bash
# Use production docker-compose file
docker-compose -f docker-compose.production.yml up -d

# Monitor logs
docker-compose -f docker-compose.production.yml logs -f

# Scale backend services
docker-compose -f docker-compose.production.yml up -d --scale backend=3
```

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Database connectivity
curl http://localhost:5000/api/health/db

# Redis connectivity
curl http://localhost:5000/api/health/cache
```

### Logs

```bash
# Backend logs
tail -f backend/logs/combined.log

# Error logs
tail -f backend/logs/error.log

# Access logs
tail -f backend/logs/access.log
```

## Useful Commands

```bash
# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# View resource usage
docker stats

# Update Docker images
docker-compose pull
docker-compose up -d

# Database backup
mongodump --uri="mongodb://localhost:27017/tradeai" --out=./backups/$(date +%Y%m%d)

# Database restore
mongorestore --uri="mongodb://localhost:27017/tradeai" ./backups/20251003
```

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:5000/api/docs
- **API Reference**: http://localhost:5000/api/docs/json

## Support & Resources

- **Documentation**: [README.md](./README.md)
- **API Guide**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Security Guide**: [SECURITY_CRITICAL_FIXES.md](./SECURITY_CRITICAL_FIXES.md)
- **Architecture**: [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)

## Getting Help

If you encounter issues:

1. Check the logs (see Monitoring section above)
2. Review Common Issues section
3. Search existing GitHub issues
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)
   - Relevant log files

## Next Steps

After successful setup:

1. 📚 Read the [User Manual](./docs/USER_MANUAL.md)
2. 🔧 Configure integrations (SAP, AI services)
3. 👥 Create users and companies
4. 📊 Import sample data
5. 🎨 Customize branding and themes
6. 📈 Set up monitoring dashboards

---

**Need Help?** Create an issue on GitHub or contact the development team.

**License**: MIT (See LICENSE file for details)
