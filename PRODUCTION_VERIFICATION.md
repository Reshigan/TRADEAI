# PRODUCTION VERIFICATION & DEPLOYMENT GUIDE
## TRADEAI Frontend-v2 - Phase 2

**Date**: October 27, 2025  
**Phase**: Production Deployment & Authentication Testing  
**Status**: Ready for Deployment

---

## 🎯 PHASE 2 OBJECTIVES

The development phase (Weeks 1-3) is complete. Phase 2 focuses on:

1. ✅ **Build Production Bundle**
2. ✅ **Test Authentication Flow**
3. ✅ **Deploy to Production**
4. ✅ **Verify All Features**
5. ✅ **Setup Monitoring**
6. ✅ **Fix Production Issues**

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] npm/yarn installed
- [ ] Git repository cloned
- [ ] Environment variables configured
- [ ] Backend API accessible
- [ ] SSL certificates ready

### Environment Variables Required
```bash
# .env.production
VITE_API_URL=https://tradeai.gonxt.tech/api
VITE_WS_URL=wss://tradeai.gonxt.tech/ws
VITE_APP_NAME=TRADEAI
VITE_APP_VERSION=2.0.0
```

### Backend API Endpoints Verified
- [ ] `POST /api/auth/login` - Login
- [ ] `POST /api/auth/refresh` - Token refresh
- [ ] `POST /api/auth/logout` - Logout
- [ ] `GET /api/auth/me` - Current user
- [ ] All CRUD endpoints operational

---

## 🔨 STEP 1: BUILD PRODUCTION BUNDLE

### Commands
```bash
cd frontend-v2

# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build production bundle
npm run build

# Preview production build
npm run preview
```

### Expected Output
```
✓ built in 45.67s
✓ 150 modules transformed
dist/index.html                   0.50 kB
dist/assets/index-abc123.css    125.45 kB │ gzip: 18.23 kB
dist/assets/index-def456.js     765.34 kB │ gzip: 231.12 kB
```

### Build Verification
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Bundle size < 1MB gzipped
- [ ] All assets generated
- [ ] Source maps created

---

## 🔐 STEP 2: AUTHENTICATION TESTING

### 2.1 Test Authentication Flow

#### Test Case 1: Successful Login
```bash
# Test login endpoint
curl -X POST https://tradeai.gonxt.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "test@example.com",
      "name": "Test User",
      "role": "admin"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Verification:**
- [ ] 200 status code returned
- [ ] Access token received
- [ ] Refresh token received
- [ ] User data complete
- [ ] Token format valid (JWT)

#### Test Case 2: Invalid Credentials
```bash
curl -X POST https://tradeai.gonxt.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**Verification:**
- [ ] 401 status code returned
- [ ] Error message clear
- [ ] No sensitive data leaked

#### Test Case 3: Token Refresh
```bash
curl -X POST https://tradeai.gonxt.tech/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <refresh_token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Verification:**
- [ ] 200 status code returned
- [ ] New access token received
- [ ] New refresh token received
- [ ] Old tokens invalidated

#### Test Case 4: Protected Route Access
```bash
# Without token
curl -X GET https://tradeai.gonxt.tech/api/customers

# With token
curl -X GET https://tradeai.gonxt.tech/api/customers \
  -H "Authorization: Bearer <access_token>"
```

**Verification:**
- [ ] Without token: 401 Unauthorized
- [ ] With valid token: 200 OK with data
- [ ] With expired token: 401 with refresh prompt
- [ ] With invalid token: 401 Unauthorized

---

### 2.2 Frontend Authentication Testing

#### Manual Test Scenarios

**Scenario 1: Login Flow**
1. [ ] Open https://your-domain.com
2. [ ] Verify redirect to /login
3. [ ] Enter valid credentials
4. [ ] Click "Login" button
5. [ ] Verify redirect to /dashboard
6. [ ] Verify user data displayed
7. [ ] Verify navigation menu available

**Scenario 2: Token Expiry & Refresh**
1. [ ] Login successfully
2. [ ] Wait for token expiry (or manually expire)
3. [ ] Make an API call
4. [ ] Verify automatic token refresh
5. [ ] Verify API call succeeds
6. [ ] Verify no visible interruption to user

**Scenario 3: Logout Flow**
1. [ ] Login successfully
2. [ ] Navigate to /dashboard
3. [ ] Click logout button
4. [ ] Verify redirect to /login
5. [ ] Verify tokens cleared from localStorage
6. [ ] Verify cannot access protected routes
7. [ ] Verify back button doesn't bypass auth

**Scenario 4: Session Persistence**
1. [ ] Login successfully
2. [ ] Refresh the page
3. [ ] Verify still authenticated
4. [ ] Verify user data persists
5. [ ] Navigate to different routes
6. [ ] Verify auth state maintained

**Scenario 5: Protected Routes**
1. [ ] Without login, try to access:
   - [ ] /dashboard
   - [ ] /customers
   - [ ] /products
   - [ ] /admin
2. [ ] Verify redirect to /login for all
3. [ ] Login successfully
4. [ ] Verify can access all routes
5. [ ] Logout
6. [ ] Verify redirected again

---

## 🚀 STEP 3: PRODUCTION DEPLOYMENT

### 3.1 Server Deployment (Option A: Static Hosting)

#### Using Nginx
```nginx
# /etc/nginx/sites-available/tradeai

server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/tradeai/dist;
    index index.html;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass https://tradeai.gonxt.tech/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket proxy
    location /ws/ {
        proxy_pass wss://tradeai.gonxt.tech/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
}
```

**Deploy Commands:**
```bash
# Build production bundle
npm run build

# Copy to server
rsync -avz --delete dist/ user@server:/var/www/tradeai/

# Restart nginx
sudo systemctl restart nginx

# Verify
curl -I https://your-domain.com
```

### 3.2 Deployment Verification
- [ ] HTTPS enabled
- [ ] SSL certificate valid
- [ ] index.html accessible
- [ ] Assets loading (CSS, JS)
- [ ] API proxy working
- [ ] WebSocket proxy working
- [ ] Gzip compression enabled
- [ ] Cache headers set
- [ ] Security headers present

---

### 3.3 Server Deployment (Option B: Docker)

**Dockerfile:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Deploy Commands:**
```bash
# Build image
docker build -t tradeai-frontend:latest .

# Run container
docker run -d \
  --name tradeai-frontend \
  -p 80:80 \
  -p 443:443 \
  -e VITE_API_URL=https://tradeai.gonxt.tech/api \
  tradeai-frontend:latest

# Verify
docker ps
docker logs tradeai-frontend
curl http://localhost
```

---

### 3.4 Cloud Deployment (Option C: Vercel/Netlify)

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_API_URL
vercel env add VITE_WS_URL
```

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables
netlify env:set VITE_API_URL https://tradeai.gonxt.tech/api
netlify env:set VITE_WS_URL wss://tradeai.gonxt.tech/ws
```

---

## ✅ STEP 4: FEATURE VERIFICATION

### 4.1 Core Features Test

#### Authentication & Authorization
- [ ] Login works
- [ ] Logout works
- [ ] Token refresh automatic
- [ ] Protected routes secured
- [ ] Role-based access working
- [ ] Session persistence works

#### Dashboard
- [ ] Loads without errors
- [ ] Charts render correctly
- [ ] KPIs display data
- [ ] Real-time updates work
- [ ] Navigation functional

#### Customer Management
- [ ] List customers
- [ ] Create customer
- [ ] Edit customer
- [ ] Delete customer
- [ ] Search/filter works
- [ ] Pagination works

#### Product Management
- [ ] List products
- [ ] Create product
- [ ] Edit product
- [ ] Delete product
- [ ] Inventory tracking works

#### Budget Management
- [ ] List budgets
- [ ] Create budget
- [ ] Edit budget
- [ ] Approve/reject budget
- [ ] Status tracking works

#### Rebates Module
- [ ] List rebates
- [ ] Calculate rebate
- [ ] Process payment
- [ ] View analytics
- [ ] Filter by status/type

#### Admin Module
- [ ] System health dashboard
- [ ] User management CRUD
- [ ] Role management
- [ ] System settings
- [ ] Audit logs display

#### Analytics & Reports
- [ ] Analytics dashboard loads
- [ ] Charts render
- [ ] KPIs accurate
- [ ] Export CSV works
- [ ] Export PDF works
- [ ] Scheduled reports work

#### Real-time Features
- [ ] WebSocket connects
- [ ] Real-time updates received
- [ ] Auto-reconnect works
- [ ] Collaboration features work

#### Notifications
- [ ] Notification bell shows count
- [ ] Dropdown displays notifications
- [ ] Mark as read works
- [ ] Delete notification works
- [ ] Preferences save

---

### 4.2 Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### 4.3 Performance Testing

#### Load Time Metrics
- [ ] Initial load < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] First contentful paint < 1.5 seconds
- [ ] Largest contentful paint < 2.5 seconds

#### Runtime Performance
- [ ] No memory leaks
- [ ] Smooth scrolling (60 fps)
- [ ] Quick navigation (<100ms)
- [ ] API responses < 200ms

Use tools:
- Chrome DevTools Lighthouse
- WebPageTest
- GTmetrix

---

## 📊 STEP 5: MONITORING SETUP

### 5.1 Error Tracking

#### Sentry Integration
```typescript
// Add to main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 5.2 Analytics

#### Google Analytics
```typescript
// Add to index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 5.3 Application Monitoring

**Key Metrics to Track:**
- User login/logout events
- Page views and navigation
- API error rates
- WebSocket connection status
- Form submission success rates
- Export/download actions
- Feature usage statistics

---

## 🔧 STEP 6: COMMON ISSUES & SOLUTIONS

### Issue 1: "Mock data screens in production"

**Problem**: Frontend showing mock data instead of real API data

**Root Causes:**
1. Backend API not accessible
2. CORS issues blocking requests
3. Wrong API URL in environment variables
4. Authentication failing silently
5. Token not being sent with requests

**Solutions:**
```typescript
// 1. Verify API URL in .env
console.log('API URL:', import.meta.env.VITE_API_URL);

// 2. Check CORS headers in backend
// Backend should send:
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization

// 3. Verify token is sent
// In axios.ts interceptor:
config.headers.Authorization = `Bearer ${token}`;

// 4. Add error logging
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data);
    return Promise.reject(error);
  }
);
```

### Issue 2: "Token refresh loop"

**Problem**: Constant token refresh requests

**Solution:**
```typescript
// In axios.ts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// In refresh logic
if (!isRefreshing) {
  isRefreshing = true;
  // Refresh token
  isRefreshing = false;
}
```

### Issue 3: "WebSocket not connecting"

**Problem**: Real-time features not working

**Solutions:**
1. Check WebSocket URL format: `wss://` not `https://`
2. Verify WebSocket proxy in nginx
3. Check firewall rules
4. Test WebSocket endpoint separately

### Issue 4: "Slow page loads"

**Solutions:**
1. Enable code splitting
2. Implement lazy loading
3. Enable gzip compression
4. Add caching headers
5. Use CDN for static assets
6. Optimize images

---

## 📋 POST-DEPLOYMENT CHECKLIST

### Day 1: Immediate Verification
- [ ] Site accessible via HTTPS
- [ ] Login functionality working
- [ ] All routes accessible
- [ ] API calls successful
- [ ] No console errors
- [ ] Monitoring active

### Week 1: Continuous Monitoring
- [ ] Error rate < 1%
- [ ] Average load time < 3s
- [ ] User feedback collected
- [ ] No critical bugs
- [ ] Performance stable

### Month 1: Long-term Health
- [ ] Uptime > 99.9%
- [ ] User adoption growing
- [ ] Feature usage tracked
- [ ] Performance optimized
- [ ] Security audit passed

---

## 🎯 SUCCESS CRITERIA

### Technical
- ✅ Build completes successfully
- ✅ Zero production errors
- ✅ Authentication working 100%
- ✅ All features functional
- ✅ Performance benchmarks met
- ✅ Security best practices followed

### Business
- ✅ Users can login and access system
- ✅ Real data (not mock) displayed
- ✅ All CRUD operations work
- ✅ Reports generate correctly
- ✅ Real-time updates functional
- ✅ System stable and reliable

---

## 📞 SUPPORT & ESCALATION

### Issue Severity Levels

**P0 - Critical** (Fix immediately)
- Site down
- Cannot login
- Data loss
- Security breach

**P1 - High** (Fix within 24h)
- Feature broken
- Performance degraded
- Intermittent errors

**P2 - Medium** (Fix within 1 week)
- UI issues
- Minor bugs
- Enhancement requests

**P3 - Low** (Fix as capacity allows)
- Visual improvements
- Documentation updates
- Nice-to-have features

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- Production Deployment Guide: `/PRODUCTION_DEPLOYMENT.md`
- Authentication Guide: `/frontend-v2/AUTHENTICATION.md`
- Week 2-3 Summary: `/WEEK_2_3_COMPLETE.md`

### Tools
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint`
- Type Check: `npm run type-check`

### Monitoring URLs
- Application: https://your-domain.com
- Backend API: https://tradeai.gonxt.tech/api
- Health Check: https://tradeai.gonxt.tech/api/health
- Sentry: https://sentry.io/your-project
- Analytics: https://analytics.google.com

---

## ✅ SIGN-OFF

### Development Complete
- [x] All Week 1-3 modules delivered
- [x] Code review passed
- [x] Documentation complete
- [x] Unit tests passed
- [x] Integration tests passed

### Ready for Production
- [ ] Production build successful
- [ ] Authentication tested
- [ ] Deployment complete
- [ ] Monitoring active
- [ ] Team trained

**Sign-off Required From:**
- [ ] Technical Lead
- [ ] Product Owner
- [ ] QA Team
- [ ] Security Team
- [ ] DevOps Team

---

**Document Version**: 1.0  
**Last Updated**: October 27, 2025  
**Status**: 📋 Ready for Production Deployment  
**Next Action**: Execute deployment steps
