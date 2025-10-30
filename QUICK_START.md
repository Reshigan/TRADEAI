# ⚡ TRADEAI Quick Start Guide

## 🎯 Get Running in 2 Minutes!

### Method 1: Automated Start (Recommended)

```bash
cd TRADEAI
./START_PRODUCTION.sh
```

This will:
- ✅ Check system requirements
- ✅ Install dependencies (if needed)
- ✅ Start backend on port 5000
- ✅ Start frontend on port 12000
- ✅ Display access URLs

---

### Method 2: Manual Start

#### Backend (Terminal 1)
```bash
cd TRADEAI/backend
npm install
npm start
```

#### Frontend (Terminal 2)
```bash
cd TRADEAI/frontend
npm install
npm run dev -- --host 0.0.0.0 --port 12000
```

---

## 🌐 Access Points

### Frontend
**URL**: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev

### Backend API
**URL**: http://localhost:5000/api

### Health Check
```bash
curl http://localhost:5000/health
```

---

## 👤 First Time User?

### Create Your Account

1. Go to: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev/register
2. Fill in:
   - First Name
   - Last Name
   - Email
   - Password (min 8 characters)
   - Organization
3. Click "Create Account"
4. You'll be auto-logged in!

### Test Login

**Option 1**: Use your registered account

**Option 2**: Create a test account
```
Email: admin@tradeai.com
Password: SecurePassword123!
```

---

## 📱 What Can You Do?

### Explore Pages

After login, you can:

1. **Dashboard** (`/dashboard`)
   - Executive overview
   - Sales metrics
   - Promotion tracking

2. **Promotions** (`/promotions`)
   - View all promotions
   - Filter by status
   - Create new promotions

3. **Campaigns** (`/campaigns`)
   - Campaign management
   - Budget tracking
   - Performance metrics

4. **Customers** (`/customers`)
   - Customer database
   - Search & filter
   - Customer analytics

5. **Products** (`/products`)
   - Product catalog
   - Category management
   - Pricing info

6. **Reports** (`/reports`)
   - Generate reports
   - Export to PDF/Excel/CSV
   - Custom date ranges

7. **Admin Tools** (`/admin`)
   - Cache management
   - Security monitoring
   - Performance metrics

---

## 🔧 Troubleshooting

### Backend Not Starting?

**Check MongoDB:**
```bash
# Ensure MongoDB is in .env
cat backend/.env | grep MONGODB_URI
```

**Check Port 5000:**
```bash
lsof -i :5000
# Kill if something is running:
kill -9 <PID>
```

### Frontend Not Loading?

**Check Port 12000:**
```bash
lsof -i :12000
# Kill if needed:
kill -9 <PID>
```

**Rebuild:**
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Authentication Issues?

**Clear Browser Data:**
1. Open DevTools (F12)
2. Application > Local Storage
3. Clear All
4. Refresh page

**Check Backend Logs:**
```bash
cd backend
npm start
# Watch for errors
```

---

## 🚀 API Testing

### Register User
```bash
curl -X POST http://localhost:5000/api/auth-enhanced/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User",
    "organization": "TestOrg"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth-enhanced/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### Get Promotions (with token)
```bash
TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/promotions \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 System Requirements

### Minimum
- Node.js 18+
- 2 GB RAM
- 1 GB disk space

### Recommended
- Node.js 20+
- 4 GB RAM
- 5 GB disk space
- MongoDB 5.0+

---

## 🎯 Next Steps

1. **Explore the UI** - Click around and familiarize yourself
2. **Create Test Data** - Add promotions, campaigns, customers
3. **Generate Reports** - Try the report builder
4. **Check Analytics** - View dashboards and metrics
5. **Test Security** - Try logout/login flow

---

## 📚 Additional Resources

- **Full Deployment Guide**: See `DEPLOYMENT_READY.md`
- **Authentication Guide**: See `PRODUCTION_AUTH_GUIDE.md`
- **API Documentation**: http://localhost:5000/api/docs
- **Repository**: https://github.com/Reshigan/TRADEAI

---

## ✅ Quick Health Check

Run this to ensure everything is working:

```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend (should return HTML)
curl http://localhost:12000

# Check authentication
curl http://localhost:5000/api/auth-enhanced/status
```

**Expected**: All return 200 status codes

---

## 🆘 Need Help?

### Common Issues

**"Cannot find module"**: Run `npm install` in backend/frontend

**"Port already in use"**: Kill the process or change port

**"MongoDB connection failed"**: Check MONGODB_URI in `.env`

**"Token invalid"**: Clear localStorage and login again

**"CORS error"**: Backend CORS is configured for all origins

---

## 🎉 You're Ready!

TRADEAI is now running and ready for testing.

**Happy Trading! 🚀**

---

*Last Updated: 2025-10-27*
*Version: 1.0.0*
