# Trade AI Frontend V2 - Production Deployment Guide

**Version**: 2.0.0  
**Last Updated**: October 31, 2025  
**Production URL**: https://tradeai.gonxt.tech

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Build Process](#build-process)
5. [Deployment](#deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedure](#rollback-procedure)

---

## 🎯 Overview

Trade AI Frontend V2 is an enterprise-grade React application built with modern web technologies for managing trade promotions, customers, products, and analytics.

### Technology Stack

- **Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 6.0
- **Styling**: TailwindCSS 3.4 (Note: v4 causes conflicts, use v3 only)
- **State Management**: Zustand 5.0
- **Data Fetching**: TanStack Query (React Query) 5.64
- **Routing**: React Router v7.1
- **Form Handling**: React Hook Form 7.54 + Zod 3.24
- **HTTP Client**: Axios 1.7
- **Icons**: Lucide React

### Key Features

- ✅ Multi-step promotion creation with stepper component
- ✅ JWT-based authentication with token refresh
- ✅ Responsive design with dark sidebar navigation
- ✅ Data tables with sorting, filtering, and pagination
- ✅ Real-time form validation
- ✅ Optimized bundle splitting for fast loading
- ✅ Enterprise-grade error handling

---

## 🏗️ Architecture

### Build Output Structure

```
build/
├── index.html                    # Entry point
├── assets/
│   ├── index-[hash].css         # Main stylesheet (~25KB, includes all Tailwind classes)
│   ├── vendor-[hash].js         # React core libraries (~175KB)
│   ├── query-[hash].js          # React Query + Axios (~41KB)
│   ├── ui-[hash].js             # UI utilities (Lucide, clsx, etc.)
│   ├── forms-[hash].js          # Form handling (React Hook Form, Zod)
│   ├── state-[hash].js          # Zustand state management
│   └── index-[hash].js          # Application code (~93KB)
└── images/
    └── [assets]
```

### Production Optimizations

1. **Code Splitting**: Separate chunks for vendor, query, UI, forms, and state
2. **Tree Shaking**: Unused code automatically removed
3. **Minification**: ES build for fast, efficient minification
4. **Asset Optimization**: Images and assets optimized and cached
5. **Modern ES2020**: Targeting modern browsers for smaller bundles

---

## ✅ Prerequisites

### Required Software

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ or **pnpm** v8+
- **SSH Access**: To production server (3.10.212.143)
- **SSH Key**: `Vantax-2.pem` (for deployment)

### Environment Variables

Create `.env.production`:

```bash
VITE_API_BASE_URL=https://tradeai.gonxt.tech/api
VITE_APP_NAME=Trade AI Platform
VITE_APP_VERSION=2.0.0
```

---

## 🔨 Build Process

### Development Build

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Access at http://localhost:5173
```

### Production Build

```bash
# Clean previous builds
npm run clean

# Run type checking
npm run type-check

# Build for production
npm run build:prod

# Preview production build locally
npm run preview
```

### Build Validation

After building, verify:

1. ✅ `build/` directory exists
2. ✅ `build/index.html` references hashed assets
3. ✅ CSS file is ~25KB (includes all Tailwind classes)
4. ✅ No TypeScript errors
5. ✅ All chunks under 1MB

---

## 🚀 Deployment

### Automated Deployment (Recommended)

Use the enterprise deployment script:

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

**Features:**
- ✅ Automated build validation
- ✅ Zero-downtime deployment
- ✅ Automatic backup creation
- ✅ Health checks after deployment
- ✅ Automatic rollback on failure
- ✅ Nginx reload

### Manual Deployment

If automated deployment fails:

```bash
# 1. Build locally
npm run build:prod

# 2. Create archive
tar -czf build.tar.gz -C build .

# 3. Upload to server
scp -i /path/to/Vantax-2.pem build.tar.gz ubuntu@3.10.212.143:/tmp/

# 4. Deploy on server
ssh -i /path/to/Vantax-2.pem ubuntu@3.10.212.143
sudo mkdir -p /tmp/frontend-v2-new
sudo tar -xzf /tmp/build.tar.gz -C /tmp/frontend-v2-new

# 5. Backup current deployment
sudo cp -r /var/www/tradeai/frontend-v2 /var/www/tradeai/backups/frontend-v2-$(date +%Y%m%d-%H%M%S)

# 6. Atomic swap
sudo rm -rf /var/www/tradeai/frontend-v2
sudo mv /tmp/frontend-v2-new /var/www/tradeai/frontend-v2

# 7. Set permissions
sudo chown -R www-data:www-data /var/www/tradeai/frontend-v2
sudo chmod -R 755 /var/www/tradeai/frontend-v2

# 8. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Server Configuration

**Nginx Configuration** (`/etc/nginx/sites-available/tradeai`):

```nginx
server {
    listen 443 ssl http2;
    server_name tradeai.gonxt.tech;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/tradeai.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tradeai.gonxt.tech/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend - React SPA
    location / {
        root /var/www/tradeai/frontend-v2;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # No cache for HTML
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # API Backend Proxy
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        
        # Handle preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name tradeai.gonxt.tech;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 Monitoring & Maintenance

### Health Checks

**Manual Health Check:**
```bash
curl -I https://tradeai.gonxt.tech
# Should return: HTTP/2 200
```

**Automated Monitoring:**
- Setup: Use UptimeRobot or similar for 24/7 monitoring
- Check interval: Every 5 minutes
- Alert on: HTTP errors, high response time (>2s)

### Log Monitoring

**Nginx Access Logs:**
```bash
tail -f /var/log/nginx/access.log | grep tradeai
```

**Nginx Error Logs:**
```bash
tail -f /var/log/nginx/error.log
```

### Performance Monitoring

**Key Metrics:**
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

**Tools:**
- Google Lighthouse
- WebPageTest
- Chrome DevTools Performance tab

### SSL Certificate Renewal

```bash
# Check certificate expiry
sudo certbot certificates

# Renew (automatic with certbot)
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **CSS Not Loading / Unstyled Page**

**Symptoms:** Page loads but has no styling, looks like plain HTML

**Cause:** Tailwind v3/v4 conflict or CSS not generated properly

**Solution:**
```bash
# Check package.json - remove @tailwindcss/postcss
npm uninstall @tailwindcss/postcss

# Ensure postcss.config.js uses tailwindcss (not @tailwindcss/postcss)
# Content should be:
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

# Rebuild
npm run build:prod
```

#### 2. **Login Redirects But Doesn't Work**

**Symptoms:** Login API returns 200 but redirect fails

**Cause:** Auth response structure mismatch

**Solution:** Ensure `src/types/api.ts` has correct AuthResponse:
```typescript
export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      // ...
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}
```

#### 3. **502 Bad Gateway**

**Symptoms:** API requests fail with 502

**Cause:** Backend not running or Nginx proxy misconfigured

**Solution:**
```bash
# Check backend status
ssh ubuntu@3.10.212.143
pm2 list

# Check backend port
sudo lsof -i :8080

# Verify Nginx proxy
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. **Build Failures**

**Symptoms:** `npm run build` fails with TypeScript errors

**Solution:**
```bash
# Clear cache
npm run clean
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Check types
npm run type-check

# Fix TypeScript errors, then rebuild
npm run build:prod
```

---

## ⏮️ Rollback Procedure

### Automatic Rollback

The deployment script automatically rolls back on health check failure.

### Manual Rollback

If deployment script isn't used:

```bash
# 1. SSH to server
ssh -i /path/to/Vantax-2.pem ubuntu@3.10.212.143

# 2. List backups
ls -lah /var/www/tradeai/backups/

# 3. Restore from backup
BACKUP_DATE="20251031-020000"  # Replace with actual backup timestamp
sudo rm -rf /var/www/tradeai/frontend-v2
sudo cp -r /var/www/tradeai/backups/frontend-v2-$BACKUP_DATE /var/www/tradeai/frontend-v2

# 4. Set permissions
sudo chown -R www-data:www-data /var/www/tradeai/frontend-v2

# 5. Reload Nginx
sudo systemctl reload nginx

# 6. Verify
curl -I https://tradeai.gonxt.tech
```

---

## 📝 Deployment Checklist

Before every production deployment:

- [ ] All tests pass locally
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Production build succeeds (`npm run build:prod`)
- [ ] .env.production has correct API URL
- [ ] package.json has no @tailwindcss/postcss (v4 conflict)
- [ ] postcss.config.js uses tailwindcss (not @tailwindcss/postcss)
- [ ] CSS file size is ~25KB (not 6KB)
- [ ] All critical user flows tested:
  - [ ] Login/logout
  - [ ] Dashboard loads
  - [ ] Promotions list loads
  - [ ] Create promotion (multi-step stepper)
  - [ ] Navigation between pages
- [ ] Backup created before deployment
- [ ] Rollback plan in place
- [ ] Stakeholders notified of deployment window

---

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env.production` with sensitive data
2. **API Keys**: Use environment variables, not hardcoded values
3. **HTTPS Only**: All traffic via SSL/TLS
4. **CSP Headers**: Consider adding Content Security Policy headers
5. **Authentication**: JWT tokens with expiration
6. **Input Validation**: All forms validated with Zod schemas
7. **XSS Protection**: React's built-in escaping + security headers
8. **CORS**: Properly configured for API endpoints only

---

## 📞 Support & Contact

**Production Server:**
- Host: `3.10.212.143`
- User: `ubuntu`
- Key: `Vantax-2.pem`

**Deployment Locations:**
- Frontend: `/var/www/tradeai/frontend-v2/`
- Backend: `/var/www/tradeai/backend/`
- Backups: `/var/www/tradeai/backups/`
- Nginx Config: `/etc/nginx/sites-available/tradeai`

**URLs:**
- Production: https://tradeai.gonxt.tech
- API: https://tradeai.gonxt.tech/api

---

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Last Updated**: October 31, 2025  
**Version**: 2.0.0  
**Status**: ✅ Production Ready
