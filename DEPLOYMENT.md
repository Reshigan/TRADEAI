# 🚀 TRADEAI Production Deployment Guide

## ⚠️ CRITICAL INFORMATION

**PRODUCTION BACKEND**: `server-production.js` (ALWAYS USE THIS FILE)

**DO NOT USE**:
- ❌ `simple-backend.js` - Mock data only, no real authentication
- ❌ `src/server.js` - Has dependencies issues, crashes on startup
- ❌ Any other backend files

---

## 📋 Quick Deployment Checklist

### Prerequisites
- ✅ Access to production server (3.10.212.143)
- ✅ SSH key (Vantax-2.pem)
- ✅ Git repository access (github.com/Reshigan/TRADEAI)

### Deploy Steps

```bash
# 1. Pull latest code from Git
cd /var/www/tradeai
git pull origin main

# 2. Install dependencies (if package.json changed)
cd backend && npm install
cd ../frontend && npm install

# 3. Build frontend (if React code changed)
cd /var/www/tradeai/frontend
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/

# 4. Restart backend with PM2
cd /var/www/tradeai/backend
pm2 restart tradeai-backend

# 5. Verify health
curl http://localhost:5000/api/health
```

---

## 🔧 PM2 Configuration

**Current Process**:
```bash
pm2 start server-production.js --name tradeai-backend
```

**Common Commands**:
```bash
pm2 status                    # Check status
pm2 restart tradeai-backend   # Restart backend
pm2 logs tradeai-backend      # View logs
pm2 stop tradeai-backend      # Stop backend
pm2 delete tradeai-backend    # Remove process
```

---

## 📁 File Structure

```
/var/www/tradeai/
├── backend/
│   ├── server-production.js  ✅ USE THIS (Production Backend)
│   ├── simple-backend.js     ❌ DO NOT USE (Mock data)
│   ├── src/
│   │   ├── server.js         ❌ DO NOT USE (Dependency issues)
│   │   ├── app.js            
│   │   ├── models/           ✅ Database models
│   │   │   ├── Customer.js
│   │   │   ├── Product.js
│   │   │   ├── Promotion.js
│   │   │   └── SalesTransaction.js  ⚠️  MUST exist in src/models/
│   │   └── routes/
│   ├── models/               ✅ Backup models location
│   │   └── SalesTransaction.js      ⚠️  MUST exist here too
│   └── package.json
└── frontend/
    ├── src/
    ├── build/                ✅ Production build output
    └── package.json
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module SalesTransaction"
**Cause**: SalesTransaction.js missing in src/models/
**Solution**:
```bash
cp /var/www/tradeai/backend/models/SalesTransaction.js /var/www/tradeai/backend/src/models/
```

### Issue 2: "404 Not Found" on API endpoints
**Cause**: Wrong backend running (simple-backend.js instead of server-production.js)
**Solution**:
```bash
pm2 stop tradeai-backend
pm2 delete tradeai-backend
cd /var/www/tradeai/backend
pm2 start server-production.js --name tradeai-backend
```

### Issue 3: "Mock data" showing in frontend
**Cause**: simple-backend.js is running
**Solution**: Same as Issue 2

### Issue 4: Backend crash-looping
**Cause**: Usually src/server.js was started instead of server-production.js
**Check**:
```bash
pm2 logs tradeai-backend --lines 50
```
**Solution**:
```bash
pm2 stop tradeai-backend && pm2 delete tradeai-backend
pm2 start server-production.js --name tradeai-backend
```

---

## 🎯 API Endpoints in server-production.js

### Authentication (✅ Working)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/verify` - Verify token
- `GET /api/auth/me` - Get current user

### Dashboard (✅ Working)
- `GET /api/health` - Health check
- `GET /api/analytics/dashboard` - Dashboard data

### Currency (✅ Working)
- `GET /api/analytics/currencies` - List currencies
- `GET /api/currencies` - Alternative currency list
- `GET /api/currencies/convert` - Convert currencies

### Customers (✅ Working)
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Promotions (✅ Working)
- `GET /api/promotions` - List all promotions
- `GET /api/promotions/:id` - Get single promotion
- `POST /api/promotions` - Create promotion
- `PUT /api/promotions/:id` - Update promotion
- `DELETE /api/promotions/:id` - Delete promotion

### Products (✅ Working)
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Admin (✅ Working)
- `GET /api/admin/users` - List all users (admin only)

---

## 📊 System Health Checks

### Backend Health
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"healthy","version":"2.1.3",...}
```

### Frontend Health
```bash
curl https://tradeai.gonxt.tech
# Should return HTML (200 OK)
```

### Authentication Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trade-ai.com","password":"Admin@123456"}' \
  | jq -r '.token'
# Should return JWT token (not "demo-token-...")
```

### CRUD Endpoints Test
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trade-ai.com","password":"Admin@123456"}' | jq -r '.token')

# Test customers
curl -s http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN" | jq -r '.success'
# Should return: true

# Test promotions
curl -s http://localhost:5000/api/promotions \
  -H "Authorization: Bearer $TOKEN" | jq -r '.success'
# Should return: true

# Test products  
curl -s http://localhost:5000/api/products \
  -H "Authorization: Bearer $TOKEN" | jq -r '.success'
# Should return: true
```

---

## 🔒 Security Notes

- ✅ HTTPS enabled with Let's Encrypt
- ✅ JWT authentication required for all protected endpoints
- ✅ MongoDB database connection with authentication
- ✅ Rate limiting enabled
- ✅ CORS configured
- ✅ Helmet security headers

---

## 📝 Environment Variables

Located in: `/var/www/tradeai/backend/.env`

**Required variables**:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

---

## 🔄 Git Workflow

### Committing Changes
```bash
cd /workspace/project/TRADEAI
git add .
git commit -m "Description of changes"
git push origin main
```

### Pulling Latest Code on Server
```bash
ssh -i Vantax-2.pem ubuntu@3.10.212.143
cd /var/www/tradeai
git pull origin main
```

---

## 📞 Support

**If deployment fails**:
1. Check PM2 logs: `pm2 logs tradeai-backend --lines 100`
2. Verify backend file: `pm2 describe tradeai-backend | grep script`
3. Check health endpoint: `curl http://localhost:5000/api/health`
4. Review this document: `/workspace/project/TRADEAI/DEPLOYMENT.md`

**Common root causes (10+ occurrences)**:
- Wrong backend file running
- Missing SalesTransaction.js in src/models/
- Dependency issues with modular backend
- Git repository not updated before deploy

---

**Last Updated**: 2025-10-29  
**Version**: 2.1.3  
**Status**: ✅ Production Ready
