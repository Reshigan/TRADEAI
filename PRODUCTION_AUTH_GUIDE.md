# TRADEAI Production Authentication Guide

## Overview

This document describes the enhanced authentication system implemented for production use.

## Authentication Architecture

### Backend Components

#### 1. Enhanced Auth Service (`backend/src/services/enhanced-auth.service.js`)

Features:
- **JWT Token Management**: Access tokens (24h) and refresh tokens (7d)
- **Token Blacklisting**: Prevents use of invalidated tokens
- **Session Management**: In-memory session store (use Redis in production)
- **Password Security**: bcrypt hashing with salt rounds
- **Account Management**: Login, registration, password changes
- **Token Refresh**: Automatic token rotation

Key Methods:
```javascript
- login(email, password, options)
- register(userData)
- refreshToken(refreshToken)
- logout(userId, token)
- verifyToken(token)
- changePassword(userId, oldPassword, newPassword)
```

#### 2. Enhanced Auth Routes (`backend/src/routes/auth-enhanced.js`)

Endpoints:
- `POST /api/auth-enhanced/login` - User login
- `POST /api/auth-enhanced/register` - User registration
- `POST /api/auth-enhanced/refresh` - Refresh access token
- `POST /api/auth-enhanced/logout` - User logout
- `GET /api/auth-enhanced/verify` - Verify token validity
- `POST /api/auth-enhanced/change-password` - Change password
- `GET /api/auth-enhanced/me` - Get current user profile

#### 3. Activities API (`backend/src/routes/activities.js`)

New routes for activity management:
- `GET /api/activities` - List all activities (with filters)
- `GET /api/activities/metrics` - Activity dashboard metrics
- `GET /api/activities/count` - Count activities
- `GET /api/activities/:id` - Get single activity
- `POST /api/activities` - Create activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Frontend Components

#### 1. Production App (`frontend/src/App.production.jsx`)

Features:
- **Protected Routes**: Route-level authentication
- **Token Management**: Automatic token injection
- **Auth Verification**: Startup auth check
- **401 Handling**: Auto-redirect on auth failure

Routes:
```
/login - Login page
/register - Registration page
/dashboard - Executive dashboard
/activities - Activity management
/trading-terms - Trading terms
/sales-analytics - Sales analytics
/budgets - Budget management
/admin/* - Admin tools
```

#### 2. Login Component (`frontend/src/pages/auth/Login.jsx`)

Features:
- Email/password authentication
- Error handling
- Loading states
- Token storage
- Redirect to dashboard

#### 3. Register Component (`frontend/src/pages/auth/Register.jsx`)

Features:
- Multi-field registration
- Password confirmation
- Company/tenant association
- Validation
- Auto-login after registration

## Security Features

### 1. Token Security
- **JWT Signing**: HS256 algorithm with secret key
- **Token Expiration**: 24h access, 7d refresh
- **Token Blacklisting**: Invalidated tokens tracked
- **Secure Storage**: HttpOnly cookies recommended for production

### 2. Password Security
- **bcrypt Hashing**: Industry-standard password hashing
- **Salt Rounds**: 10 rounds (configurable)
- **Password Requirements**: Minimum 8 characters
- **Password Change**: Old password verification required

### 3. Tenant Isolation
- **Multi-tenancy**: Data isolated by tenantId
- **Company Association**: Users linked to companies
- **Access Control**: Tenant-scoped queries

### 4. Session Management
- **Session Tracking**: Active sessions monitored
- **IP Logging**: Request IP addresses logged
- **User Agent Tracking**: Device/browser tracking
- **Session Cleanup**: Expired sessions removed

## API Usage Examples

### Login
```javascript
POST /api/auth-enhanced/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "User",
    "companyId": "...",
    "tenantId": "..."
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Verify Token
```javascript
GET /api/auth-enhanced/verify
Authorization: Bearer eyJ...

Response:
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "user@example.com",
    ...
  }
}
```

### Refresh Token
```javascript
POST /api/auth-enhanced/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}

Response:
{
  "success": true,
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

## Environment Variables

Required:
```bash
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRES_IN=24h
NODE_ENV=production
```

## Production Recommendations

### 1. Use Redis for Session Storage
Replace in-memory session store with Redis:
```javascript
const redis = require('redis');
const client = redis.createClient();

// Store session in Redis with TTL
await client.setex(`session:${userId}`, 86400, JSON.stringify(sessionData));
```

### 2. Use HttpOnly Cookies
Store tokens in HttpOnly cookies instead of localStorage:
```javascript
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000
});
```

### 3. Implement Rate Limiting
Add rate limiting to auth endpoints:
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 requests per window
});

app.use('/api/auth-enhanced/login', authLimiter);
```

### 4. Enable HTTPS
Always use HTTPS in production:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(443);
```

### 5. Implement CSRF Protection
Add CSRF tokens for state-changing operations:
```javascript
const csrf = require('csurf');
app.use(csrf({ cookie: true }));
```

### 6. Add Security Headers
Use helmet for security headers:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

## Migration from Mock Data

If you're migrating from mock data:

1. **Update API Calls**: Change from mock endpoints to `/api/auth-enhanced/*`
2. **Add Authentication**: Wrap components with `ProtectedRoute`
3. **Update State Management**: Use real user data from tokens
4. **Remove Mock Data**: Delete mock user objects and data generators
5. **Update Tests**: Mock axios calls instead of data

## Testing

### Backend Tests
```bash
cd backend
npm test -- --grep "auth"
```

### Frontend Tests
```bash
cd frontend
npm test -- Login
npm test -- Register
```

### Manual Testing
1. Open `/register` and create an account
2. Login at `/login`
3. Verify redirect to `/dashboard`
4. Test protected routes (should require auth)
5. Logout and verify redirect to `/login`

## Troubleshooting

### Issue: "Token is blacklisted"
**Solution**: User logged out or password changed. Re-login required.

### Issue: "Invalid credentials"
**Solution**: Check email/password. Verify user exists and is active.

### Issue: "Token expired"
**Solution**: Use refresh token endpoint or re-login.

### Issue: "User not found or inactive"
**Solution**: Check user account status in database.

## Support

For issues or questions:
1. Check logs: `backend/logs/combined.log`
2. Verify environment variables
3. Check database connections
4. Review token expiration settings

## Changelog

### Version 1.0.0 (2025-10-27)
- ✅ Enhanced authentication service
- ✅ JWT token management
- ✅ Login/Register components
- ✅ Protected routes
- ✅ Token refresh mechanism
- ✅ Session management
- ✅ Activities API integration
- ✅ Security monitoring
- ✅ Performance metrics

---

**Production Status**: ✅ Ready for deployment
**Last Updated**: 2025-10-27
**Maintainer**: TRADEAI Team
