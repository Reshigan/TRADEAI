# Quick Start: Fix Authentication Issues in Production

## Problem Summary

Your production system was configured with `DATABASE_MODE=mock` and `MOCK_DATA_ENABLED=true`, causing authentication to fail and showing mock data screens instead of real data.

## ✅ What Was Fixed

1. **Database Configuration** - Changed from mock mode to real database
2. **Environment Variables** - Created proper production configuration
3. **JWT Token Management** - Improved token refresh and session management
4. **Frontend Authentication** - Enhanced error handling and token persistence
5. **User Seeding Script** - Created tool to initialize production users
6. **Documentation** - Comprehensive guides for deployment and troubleshooting

## 🚀 Quick Fix Steps

### Step 1: Update Backend Environment (CRITICAL)

Edit your production `backend/.env` file:

```bash
# OLD (BROKEN) - DO NOT USE
DATABASE_MODE=mock
MOCK_DATA_ENABLED=true

# NEW (FIXED) - USE THIS
DATABASE_MODE=real
MOCK_DATA_ENABLED=false
MONGODB_URI=mongodb://admin:admin123@localhost:27017/tradeai?authSource=admin
```

### Step 2: Ensure Database is Running

```bash
# Start MongoDB (if using Docker)
docker compose up -d mongodb redis

# OR start MongoDB standalone
mongod --auth --bind_ip_all
```

### Step 3: Seed Initial Users

```bash
cd /path/to/TRADEAI

# Set admin password (optional)
export ADMIN_PASSWORD="YourSecurePassword123!"

# Run the seeding script
node scripts/seed-production-users.js
```

This creates these default users:
- **admin@tradeai.com** - Admin (password: Admin@123 or your ADMIN_PASSWORD)
- **director@tradeai.com** - Director (password: Director@123)
- **manager@tradeai.com** - Manager (password: Manager@123)
- **kam@tradeai.com** - KAM (password: KAM@123)

### Step 4: Restart Backend

```bash
# If using Docker
docker compose restart backend

# OR if running directly
cd backend
npm start
```

### Step 5: Test Login

```bash
# Test the login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tradeai.com",
    "password": "Admin@123"
  }' | jq
```

You should see:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### Step 6: Test in Browser

1. Open: http://localhost:3000 (or your frontend URL)
2. Login with: `admin@tradeai.com` / `Admin@123`
3. You should see real data, not mock data screens!

## 📋 Files Changed/Created

### Modified Files:
- `backend/.env` - Fixed database mode and connection
- `frontend/src/services/api/authService.js` - Improved token management
- `frontend/src/services/api/apiClient.js` - Added token refresh logic

### New Files:
- `.env.production` - Production environment template
- `scripts/seed-production-users.js` - User seeding script
- `docker-compose.local-prod.yml` - Local production testing setup
- `docs/AUTHENTICATION_SETUP_GUIDE.md` - Comprehensive auth guide

## 🔒 Security Reminders

### CRITICAL: Before Going to Production

1. **Change JWT Secrets**:
   ```bash
   # Generate new secrets
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   
   Update in `.env`:
   ```env
   JWT_SECRET=<your-generated-secret>
   JWT_REFRESH_SECRET=<another-generated-secret>
   ```

2. **Change Default Passwords**:
   - Login to each user account
   - Change password immediately
   - Never use default passwords in production!

3. **Set Strong Database Passwords**:
   ```env
   MONGODB_URI=mongodb://admin:STRONG_PASSWORD@host:27017/tradeai
   REDIS_PASSWORD=STRONG_REDIS_PASSWORD
   ```

4. **Enable HTTPS**:
   ```env
   SSL_ENABLED=true
   FORCE_HTTPS=true
   ```

## 🧪 Testing Checklist

- [ ] MongoDB is running and accessible
- [ ] Redis is running and accessible
- [ ] Backend `.env` has `DATABASE_MODE=real`
- [ ] Backend `.env` has `MOCK_DATA_ENABLED=false`
- [ ] Users seeded successfully
- [ ] Can login via API (curl test passes)
- [ ] Can login via frontend
- [ ] Token refresh works (test by waiting 24h or forcing expiry)
- [ ] Logout clears session properly
- [ ] Different user roles work correctly

## 🐛 Troubleshooting

### "Invalid credentials" error

**Check database mode**:
```bash
cat backend/.env | grep DATABASE_MODE
# Should show: DATABASE_MODE=real
```

**Check if user exists**:
```bash
mongosh "mongodb://admin:admin123@localhost:27017/tradeai?authSource=admin"
> use tradeai
> db.users.findOne({email: "admin@tradeai.com"})
```

### "Token expired" immediately

**Check JWT configuration**:
```bash
cat backend/.env | grep JWT_EXPIRE
# Should show: JWT_EXPIRE=24h
```

**Verify server time**:
```bash
date
# Make sure system time is correct
```

### "Cannot connect to MongoDB"

**Check MongoDB is running**:
```bash
docker ps | grep mongodb
# OR
ps aux | grep mongod
```

**Test connection**:
```bash
mongosh "mongodb://admin:admin123@localhost:27017/?authSource=admin"
```

### Frontend shows "Network Error"

**Check CORS settings in backend `.env`**:
```env
CORS_ORIGIN=http://localhost:3000,https://your-domain.com
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

**Check backend is running**:
```bash
curl http://localhost:5000/health
```

## 📚 Additional Documentation

For more detailed information, see:

- **[Authentication Setup Guide](docs/AUTHENTICATION_SETUP_GUIDE.md)** - Complete authentication documentation
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Full deployment instructions
- **[API Documentation](docs/API_DOCUMENTATION.md)** - API endpoints and usage

## 🆘 Still Having Issues?

1. **Check logs**:
   ```bash
   # Docker logs
   docker compose logs -f backend
   
   # File logs
   tail -f backend/logs/app.log
   ```

2. **Enable debug mode**:
   ```env
   LOG_LEVEL=debug
   NODE_ENV=development
   ```

3. **Verify all services**:
   ```bash
   # Check MongoDB
   mongosh "mongodb://admin:admin123@localhost:27017/?authSource=admin" --eval "db.adminCommand('ping')"
   
   # Check Redis
   redis-cli -a redis123 ping
   
   # Check Backend
   curl http://localhost:5000/health
   ```

4. **Review configuration**:
   ```bash
   # Verify critical settings
   cat backend/.env | grep -E "DATABASE_MODE|MOCK_DATA|MONGODB_URI|JWT_SECRET"
   ```

## 🎯 Success Criteria

Authentication is working correctly when:

✅ Login API returns a valid JWT token  
✅ Token contains user information  
✅ Authenticated requests work with token  
✅ Token refresh works when token expires  
✅ Frontend stores and uses tokens correctly  
✅ Logout clears all authentication data  
✅ Real data displays (not mock data)  
✅ Different user roles have appropriate permissions  

## 🚀 Production Deployment

When ready to deploy to production:

1. Copy `.env.production` to your production server
2. Update all `CHANGE_THIS` values with real secrets
3. Use the `docker-compose.production.yml` file
4. Follow the [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
5. Run security audit before going live
6. Monitor logs for authentication issues

---

**Need Help?** See [Authentication Setup Guide](docs/AUTHENTICATION_SETUP_GUIDE.md) for comprehensive troubleshooting.
