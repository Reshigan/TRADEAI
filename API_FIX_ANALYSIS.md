# 🔧 API Error Root Cause Analysis & Fix

## 🚨 Problem Identified

**Date:** October 4, 2025  
**Issue:** Recurring API errors (500 status) preventing user login  
**Occurrences:** 9th time reported  
**Root Causes:** Multiple architectural inconsistencies

---

## 🔍 Root Cause Analysis

### Issue #1: CORS Configuration Missing ⚠️ **PRIMARY ISSUE**

**Problem:**
- Backend CORS_ORIGINS environment variable not set
- Frontend (https://tradeai.gonxt.tech) not whitelisted
- All requests from production domain blocked

**Evidence from Logs:**
```
❌ CORS blocked request from origin: https://tradeai.gonxt.tech
Origin https://tradeai.gonxt.tech not allowed by CORS policy
```

**Backend Code (app.js):**
```javascript
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];  // ❌ Missing production URL!
```

**Fix Applied:**
```bash
# Added to /opt/tradeai/backend/.env
CORS_ORIGINS=https://tradeai.gonxt.tech,http://localhost:3000,http://localhost:3001
```

**Status:** ✅ FIXED (backend restarted with new config)

---

### Issue #2: Token Key Mismatch ⚠️ **SECONDARY ISSUE**

**Problem:**
- authService.js stores token as `authToken`
- apiClient.js looks for token as `token`
- Authentication fails because wrong key used

**Code Analysis:**

**File:** `frontend/src/services/api/authService.js` (line 16)
```javascript
// authService.js stores as 'authToken'
localStorage.setItem('authToken', response.data.token);  // ❌ Wrong key!
```

**File:** `frontend/src/services/api/apiClient.js` (line 22)
```javascript
// apiClient.js looks for 'token'
const token = localStorage.getItem('token');  // ❌ Wrong key!
```

**Impact:**
- User logs in successfully
- Token stored in localStorage as 'authToken'
- All subsequent API calls fail because auth header not attached
- User sees "unauthorized" errors

**Fix Required:**
Standardize on ONE token key across all files.

**Recommendation:** Use `'token'` (simpler, more standard)

---

### Issue #3: Multiple API Service Instances 🔄 **ARCHITECTURAL ISSUE**

**Problem:**
- THREE different API clients with different configurations:
  1. `api.js` - Base API (baseURL: `/api`)
  2. `enterpriseApi.js` - Enterprise features (baseURL: `http://localhost:5000/api`)
  3. `apiClient.js` - Used by authService (baseURL: `/api`)

**Configuration Conflicts:**

**File:** `frontend/src/services/api.js`
```javascript
baseURL: process.env.REACT_APP_API_URL || '/api'
token: localStorage.getItem('token')  // ✅ Correct key
```

**File:** `frontend/src/services/enterpriseApi.js`
```javascript
baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'  // ❌ Hardcoded!
token: localStorage.getItem('token')  // ✅ Correct key
```

**File:** `frontend/src/services/api/apiClient.js`
```javascript
baseURL: process.env.REACT_APP_API_URL || '/api'
token: localStorage.getItem('token')  // ✅ Correct key (but authService stores as 'authToken'!)
```

**Impact:**
- Inconsistent API URLs (relative vs absolute)
- Different auth token keys
- Hard to debug which client is failing
- Maintenance nightmare

**Fix Required:**
1. Single API client for all services
2. Consistent token key
3. Single source of truth for base URL

---

### Issue #4: Frontend Environment Variable Not Set 📝

**Problem:**
- `REACT_APP_API_URL` not configured in production build
- Frontend falls back to various defaults
- Some use `/api` (relative), some use `http://localhost:5000/api` (absolute)

**Impact:**
- In production, relative `/api` might work if proxied correctly
- Hardcoded `http://localhost:5000/api` will NEVER work in production
- Mixed behavior across different API clients

**Fix Required:**
Set `REACT_APP_API_URL` in production `.env` file or build process

---

## 🎯 Comprehensive Fix Plan

### Phase 1: Immediate Fixes (CRITICAL) 🔥

#### 1.1 Standardize Token Key
**Files to Update:**
- `frontend/src/services/api/authService.js`
- `frontend/src/services/api/apiClient.js`
- `frontend/src/services/api.js`
- `frontend/src/services/enterpriseApi.js`
- `frontend/src/App.js`

**Change:**
```javascript
// OLD (inconsistent)
localStorage.setItem('authToken', token);
localStorage.getItem('authToken');

// NEW (consistent)
localStorage.setItem('token', token);
localStorage.getItem('token');
```

#### 1.2 Fix Base URL in enterpriseApi.js
**File:** `frontend/src/services/enterpriseApi.js`

**Change:**
```javascript
// OLD
baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

// NEW
baseURL: process.env.REACT_APP_API_URL || '/api'
```

#### 1.3 Set Production Environment Variable
**File:** Production server `.env` or build config

**Add:**
```bash
REACT_APP_API_URL=/api
```

Or if backend is on different domain:
```bash
REACT_APP_API_URL=https://tradeai.gonxt.tech/api
```

---

### Phase 2: Architectural Improvements (RECOMMENDED) 🏗️

#### 2.1 Consolidate API Clients

**Create:** Single unified API client

**File:** `frontend/src/services/api/apiClient.js`
```javascript
import axios from 'axios';

// Single source of truth for API configuration
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

const apiClient = axios.create(API_CONFIG);

// Single interceptor for auth
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');  // Single key!
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 2.2 Refactor Service Files

**Update all service files to use single apiClient:**

```javascript
// OLD
import axios from 'axios';
const api = axios.create({ baseURL: '...' });

// NEW
import apiClient from './apiClient';
// Use apiClient directly
```

---

### Phase 3: Testing & Verification ✅

#### 3.1 Test Login Flow
```
1. Clear localStorage
2. Navigate to https://tradeai.gonxt.tech
3. Login with admin@mondelez.co.za / Admin@123456
4. Verify:
   - ✅ No CORS errors
   - ✅ Token stored as 'token'
   - ✅ Redirects to /dashboard
   - ✅ Dashboard loads data
```

#### 3.2 Test Protected Routes
```
1. Navigate to /simulations
2. Verify:
   - ✅ Authorization header attached
   - ✅ API calls succeed
   - ✅ Data loads correctly
```

#### 3.3 Test Logout
```
1. Click logout
2. Verify:
   - ✅ localStorage cleared
   - ✅ Redirects to login
   - ✅ Cannot access protected routes
```

---

## 🔧 Implementation Steps

### Step 1: Fix Token Key (5 minutes)

```bash
# Update authService.js
sed -i "s/localStorage.setItem('authToken'/localStorage.setItem('token'/g" \
  frontend/src/services/api/authService.js

sed -i "s/localStorage.getItem('authToken'/localStorage.getItem('token'/g" \
  frontend/src/services/api/authService.js

sed -i "s/localStorage.removeItem('authToken'/localStorage.removeItem('token'/g" \
  frontend/src/services/api/authService.js

# Commit
git add frontend/src/services/api/authService.js
git commit -m "fix: Standardize token key to 'token' across all services"
```

### Step 2: Fix enterpriseApi.js Base URL (2 minutes)

```bash
# Update enterpriseApi.js
sed -i "s|http://localhost:5000/api|/api|g" \
  frontend/src/services/enterpriseApi.js

# Commit
git add frontend/src/services/enterpriseApi.js
git commit -m "fix: Use relative API URL in enterpriseApi"
```

### Step 3: Rebuild Frontend (10 minutes)

```bash
# SSH to server
ssh -i TPMServer.pem ubuntu@ec2-13-247-215-88.af-south-1.compute.amazonaws.com

# Navigate to frontend
cd /opt/tradeai/frontend

# Pull latest code
git pull origin main

# Install dependencies (if needed)
npm install

# Build
npm run build

# Restart nginx (if needed)
sudo systemctl restart nginx
```

### Step 4: Verify (5 minutes)

```bash
# Test login from command line
curl -X POST https://tradeai.gonxt.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mondelez.co.za","password":"Admin@123456"}'

# Should return 200 with token
```

---

## 📊 Impact Analysis

### Before Fixes
- ❌ CORS blocks all production requests
- ❌ Token key mismatch breaks auth
- ❌ Hardcoded URLs fail in production
- ❌ Multiple API clients cause confusion
- ❌ Users cannot login

### After Fixes
- ✅ CORS allows production domain
- ✅ Consistent token key across all services
- ✅ Relative URLs work in all environments
- ✅ Single API client = single source of truth
- ✅ Users can login and use application

---

## 🎓 Lessons Learned

### 1. Environment Configuration is Critical
- Always set production environment variables
- Don't rely on default fallbacks for production
- Document required environment variables

### 2. Consistency is Key
- Use same token key everywhere
- Use same API client everywhere
- Use same base URL everywhere

### 3. Test in Production Environment
- Development works ≠ Production works
- Always test CORS in production
- Always test with production URLs

### 4. Avoid Hardcoded Values
- Never hardcode `localhost` URLs
- Never hardcode port numbers
- Always use environment variables

### 5. Single Source of Truth
- One API client, not three
- One configuration, not multiple
- One way to do things, not many

---

## ✅ Verification Checklist

### Backend
- [✅] CORS_ORIGINS set in .env
- [✅] Backend restarted
- [✅] Login endpoint returns 200
- [✅] Token included in response

### Frontend
- [ ] Token key standardized to 'token'
- [ ] enterpriseApi.js uses relative URL
- [ ] apiClient.js looks for 'token' key
- [ ] authService.js stores as 'token'
- [ ] Code committed to Git
- [ ] Production build completed
- [ ] Application deployed

### End-to-End
- [ ] Login succeeds
- [ ] Token stored in localStorage
- [ ] Dashboard loads
- [ ] Protected routes accessible
- [ ] API calls include auth header
- [ ] No CORS errors in console

---

## 🚀 Deployment Commands

### Full Deployment Script
```bash
#!/bin/bash

# 1. SSH to server
ssh -i TPMServer.pem ubuntu@ec2-13-247-215-88.af-south-1.compute.amazonaws.com << 'ENDSSH'

# 2. Navigate to app
cd /opt/tradeai

# 3. Pull latest code
git pull origin enterprise-features-complete

# 4. Build frontend
cd frontend
npm install
npm run build

# 5. Restart nginx
sudo systemctl restart nginx

# 6. Verify backend
pm2 list

# 7. Check logs
pm2 logs tradeai-backend --lines 10 --nostream

echo "✅ Deployment complete!"

ENDSSH
```

---

## 📝 Summary

**Primary Issue:** CORS configuration missing  
**Secondary Issue:** Token key mismatch  
**Tertiary Issue:** Inconsistent API clients

**Fixes Applied:**
1. ✅ Added CORS_ORIGINS to backend .env
2. ✅ Restarted backend
3. ⏳ Token key standardization (pending)
4. ⏳ Base URL fixes (pending)
5. ⏳ Frontend rebuild (pending)

**Status:** 40% Complete  
**Next Steps:** Apply frontend fixes and rebuild

---

**Last Updated:** October 4, 2025  
**Analyst:** OpenHands AI Agent  
**Confidence:** ⭐⭐⭐⭐⭐ Very High
