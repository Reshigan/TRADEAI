# 🔐 Backend CORS Configuration Guide

## 📋 Overview

This guide will help you configure CORS (Cross-Origin Resource Sharing) on your backend server to allow your frontend production domain to make API requests.

**Backend Server**: https://tradeai.gonxt.tech/api  
**SSH Key**: `/workspace/project/Vantax-2.pem`

---

## 🚀 Quick Start

### Step 1: Connect to Backend Server

```bash
# Set correct permissions for SSH key
chmod 600 /workspace/project/Vantax-2.pem

# Connect to server (replace with actual details)
ssh -i /workspace/project/Vantax-2.pem ubuntu@tradeai.gonxt.tech
# OR
ssh -i /workspace/project/Vantax-2.pem ec2-user@your-ip-address
```

### Step 2: Locate Backend Application

```bash
# Once connected, find the backend code
cd /var/www/tradeai-backend
# OR
cd /home/ubuntu/tradeai-backend
# OR
cd /opt/tradeai-backend

# Check if it's a Node.js app
ls -la
# Look for: package.json, server.js, app.js, index.js
```

### Step 3: Find CORS Configuration

```bash
# Common locations for CORS config in Node.js/Express
grep -r "cors" . --include="*.js" | head -20

# Look for files like:
# - server.js
# - app.js
# - index.js
# - config/cors.js
# - middleware/cors.js
```

---

## 🛠️ CORS Configuration Examples

### For Express.js (Most Common)

#### Option 1: Using `cors` Package (Recommended)

**File**: `server.js` or `app.js`

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// ===== ADD/UPDATE THIS SECTION =====
const corsOptions = {
  origin: [
    'https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev',
    'https://your-custom-domain.com',
    'https://your-app.vercel.app',
    'https://your-app.netlify.app',
    'http://localhost:5173', // Development
    'http://localhost:12000', // Production server local
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
// ===== END CORS CONFIGURATION =====

// ... rest of your code
```

#### Option 2: Manual CORS Middleware

```javascript
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev',
    'https://your-custom-domain.com',
    'https://your-app.vercel.app',
    'http://localhost:5173',
    'http://localhost:12000',
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});
```

#### Option 3: Dynamic CORS (Allow All - Development Only)

```javascript
// ⚠️ WARNING: Use only for development/testing
// NOT recommended for production

app.use(cors({
  origin: true, // Reflects the requesting origin
  credentials: true,
}));
```

---

### For Fastify

```javascript
const fastify = require('fastify')();

await fastify.register(require('@fastify/cors'), {
  origin: [
    'https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev',
    'https://your-custom-domain.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});
```

---

### For NestJS

**File**: `main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: [
      'https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev',
      'https://your-custom-domain.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  await app.listen(3000);
}
bootstrap();
```

---

### For Python/Flask

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev",
            "https://your-custom-domain.com",
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 86400,
    }
})

# ... rest of your code
```

---

### For Django

**File**: `settings.py`

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ... other middleware
]

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev",
    "https://your-custom-domain.com",
    "http://localhost:5173",
    "http://localhost:12000",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

---

## 🔄 Apply Changes

### For Node.js Applications

```bash
# If using PM2
pm2 restart tradeai-backend

# If using systemd
sudo systemctl restart tradeai-backend

# If using node directly
pkill -f "node.*server.js"
node server.js &

# Check if it's running
pm2 status
# OR
sudo systemctl status tradeai-backend
# OR
ps aux | grep node
```

### For Python Applications

```bash
# If using gunicorn
sudo systemctl restart tradeai-backend

# If using supervisor
sudo supervisorctl restart tradeai-backend

# If running directly
pkill -f "python.*app.py"
python app.py &
```

---

## 🧪 Test CORS Configuration

### Test 1: Simple Request from Browser Console

Visit your frontend at: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev

Open browser console and run:

```javascript
fetch('https://tradeai.gonxt.tech/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Expected**: Response data (no CORS error)  
**If error**: CORS not configured properly

### Test 2: Authenticated Request

```javascript
fetch('https://tradeai.gonxt.tech/api/dashboard/executive', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Test 3: Using cURL

```bash
# Test preflight (OPTIONS) request
curl -i -X OPTIONS https://tradeai.gonxt.tech/api/health \
  -H "Origin: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type"

# Should see headers:
# Access-Control-Allow-Origin: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

### Test 4: Check Response Headers

```bash
curl -i https://tradeai.gonxt.tech/api/health \
  -H "Origin: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev"

# Look for:
# Access-Control-Allow-Origin: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev
# Access-Control-Allow-Credentials: true
```

---

## 📋 Complete Setup Checklist

### Before Making Changes

- [ ] SSH into backend server
- [ ] Locate backend application directory
- [ ] Backup current configuration
  ```bash
  cp server.js server.js.backup
  ```
- [ ] Identify backend framework (Express/Fastify/Flask/Django)

### Making Changes

- [ ] Add frontend domain to CORS whitelist
- [ ] Enable credentials if needed
- [ ] Set appropriate methods (GET, POST, PUT, DELETE, etc.)
- [ ] Set appropriate headers (Authorization, Content-Type)
- [ ] Test configuration locally first (if possible)

### After Changes

- [ ] Restart backend application
- [ ] Verify application is running
- [ ] Test CORS from frontend
- [ ] Test authentication flow
- [ ] Monitor logs for errors
- [ ] Document changes made

---

## 🚨 Troubleshooting

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause**: Origin not in whitelist or CORS not configured  
**Solution**: Add your frontend domain to allowed origins

### Issue: "CORS policy: Response to preflight request doesn't pass"

**Cause**: OPTIONS request not handled properly  
**Solution**: Ensure OPTIONS method is allowed and returns 204

```javascript
if (req.method === 'OPTIONS') {
  res.sendStatus(204);
  return;
}
```

### Issue: Credentials not included in CORS request

**Cause**: `credentials: true` not set  
**Solution**: Set in both backend CORS config and frontend fetch options

```javascript
// Backend
cors({ credentials: true })

// Frontend
fetch(url, { credentials: 'include' })
```

### Issue: CORS works on some routes but not others

**Cause**: CORS middleware not applied globally  
**Solution**: Apply CORS before route handlers

```javascript
app.use(cors(corsOptions)); // Must come before routes
app.use('/api', routes);
```

---

## 🔐 Security Best Practices

### 1. Never Use Wildcard in Production

```javascript
// ❌ BAD - Don't do this in production
app.use(cors({ origin: '*' }));

// ✅ GOOD - Whitelist specific domains
app.use(cors({ origin: ['https://your-domain.com'] }));
```

### 2. Always Validate Origins

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
```

### 3. Use Environment Variables

```javascript
// .env
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com

// server.js
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
```

### 4. Enable Credentials Only When Needed

```javascript
// Only if you're using cookies or HTTP authentication
cors({ credentials: true })
```

---

## 📊 CORS Headers Reference

| Header | Purpose | Example Value |
|--------|---------|---------------|
| `Access-Control-Allow-Origin` | Allowed origins | `https://your-domain.com` |
| `Access-Control-Allow-Methods` | Allowed HTTP methods | `GET, POST, PUT, DELETE` |
| `Access-Control-Allow-Headers` | Allowed request headers | `Content-Type, Authorization` |
| `Access-Control-Allow-Credentials` | Allow cookies/auth | `true` |
| `Access-Control-Max-Age` | Preflight cache duration | `86400` (24 hours) |
| `Access-Control-Expose-Headers` | Headers exposed to frontend | `Content-Range, X-Total-Count` |

---

## 🔧 Environment-Specific Configuration

### Development

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-production-domain.com']
    : true, // Allow all origins in development
  credentials: true,
};
```

### Staging

```javascript
const corsOptions = {
  origin: [
    'https://staging.your-domain.com',
    'https://preview.your-domain.com',
  ],
  credentials: true,
};
```

### Production

```javascript
const corsOptions = {
  origin: [
    'https://your-domain.com',
    'https://www.your-domain.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
};
```

---

## 📝 Example Full Configuration

**File**: `server.js` (Express.js)

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ===== CORS CONFIGURATION =====
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev',
      'https://your-custom-domain.com',
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS: Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ===== END CORS CONFIGURATION =====

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', require('./routes'));

// Error handling
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      error: {
        message: 'CORS policy violation',
        code: 'CORS_ERROR',
      },
    });
  } else {
    next(err);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
});
```

**File**: `.env`

```bash
PORT=3000
ALLOWED_ORIGINS=https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev,https://your-custom-domain.com
NODE_ENV=production
```

---

## ✅ Verification Steps

After configuration:

1. **Restart backend server**
   ```bash
   pm2 restart tradeai-backend
   ```

2. **Visit frontend**: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev

3. **Try Quick Login** (no credentials needed)

4. **Check browser console** - No CORS errors

5. **Monitor backend logs**
   ```bash
   pm2 logs tradeai-backend
   # OR
   tail -f /var/log/tradeai-backend/error.log
   ```

---

## 📞 Need Help?

If you encounter issues:

1. **Check backend logs** for CORS errors
2. **Use browser DevTools** Network tab to see request/response headers
3. **Test with cURL** to isolate the issue
4. **Verify origin matches exactly** (https vs http, trailing slash, etc.)

---

## 🎉 Summary

Your frontend domains to whitelist:
- ✅ `https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev` (current)
- ✅ `http://localhost:5173` (development)
- ✅ `http://localhost:12000` (production server local)
- ✅ Your custom domain (when deployed)

**After applying CORS configuration:**
- ✅ Frontend can make API requests
- ✅ Authentication will work
- ✅ No more CORS errors
- ✅ Production ready!

---

**Last Updated**: 2025-10-31  
**Backend**: https://tradeai.gonxt.tech/api  
**SSH Key**: /workspace/project/Vantax-2.pem
