# Authentication Setup Guide for TRADEAI

## Table of Contents
1. [Overview](#overview)
2. [Security Architecture](#security-architecture)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [User Management](#user-management)
6. [Testing Authentication](#testing-authentication)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## Overview

TRADEAI uses a robust JWT-based authentication system with the following features:

- **JWT Access Tokens**: Short-lived tokens (24 hours) for API authentication
- **Refresh Tokens**: Long-lived tokens (30 days) for obtaining new access tokens
- **Password Hashing**: bcrypt with 12 rounds for secure password storage
- **Session Management**: Automatic token refresh and session expiry
- **Role-Based Access Control**: Fine-grained permissions based on user roles
- **Security Audit Logging**: Comprehensive logging of all authentication events

## Security Architecture

### Token Flow

```
1. User Login
   ├─> Validate credentials
   ├─> Generate access token (24h)
   ├─> Generate refresh token (30d)
   └─> Return both tokens to client

2. API Request
   ├─> Send access token in Authorization header
   ├─> Verify token signature and expiry
   ├─> Load user from database
   └─> Process request

3. Token Refresh (when access token expires)
   ├─> Send refresh token to /auth/refresh-token
   ├─> Verify refresh token
   ├─> Generate new access token
   ├─> Generate new refresh token (optional)
   └─> Return new tokens
```

### Security Features

- **Password Requirements**:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character

- **Rate Limiting**: Prevents brute force attacks
- **Session Timeout**: Automatic logout after 24 hours of inactivity
- **IP-based Security**: Optional IP whitelist/blacklist
- **2FA Support**: Two-factor authentication available for admin users
- **Audit Logging**: All authentication events logged for security review

## Environment Configuration

### Critical Configuration (NEVER use default values in production!)

1. **Generate Secure JWT Secrets**:
   ```bash
   # Generate a strong JWT secret (64+ characters)
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Create Production Environment File**:
   ```bash
   cp .env.production /path/to/production/.env
   ```

3. **Update Required Values**:
   ```env
   # CRITICAL: Change these values!
   JWT_SECRET=YOUR_SECURE_RANDOM_STRING_HERE
   JWT_REFRESH_SECRET=YOUR_SECURE_REFRESH_TOKEN_SECRET_HERE
   MONGODB_URI=mongodb://username:password@host:27017/database
   REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD
   ```

### Complete Environment Variables

See `.env.production` file for all available configuration options.

Key authentication-related variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_MODE` | Set to 'real' for production | mock | ✅ |
| `MOCK_DATA_ENABLED` | MUST be false in production | true | ✅ |
| `MONGODB_URI` | MongoDB connection string | - | ✅ |
| `JWT_SECRET` | Secret for signing access tokens | - | ✅ |
| `JWT_EXPIRE` | Access token expiry time | 24h | ✅ |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | - | ✅ |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 30d | ✅ |
| `REDIS_HOST` | Redis server host | localhost | ✅ |
| `REDIS_PASSWORD` | Redis password | - | ✅ |
| `BCRYPT_ROUNDS` | Password hashing strength | 12 | ❌ |
| `SESSION_TIMEOUT_MINUTES` | Session timeout | 60 | ❌ |

## Database Setup

### 1. Start MongoDB

**Using Docker Compose**:
```bash
docker-compose -f docker-compose.local-prod.yml up -d mongodb
```

**Standalone MongoDB**:
```bash
mongod --auth --bind_ip_all --port 27017
```

### 2. Verify Connection

```bash
# Test MongoDB connection
mongosh "mongodb://admin:admin123@localhost:27017/tradeai?authSource=admin"
```

### 3. Check Database Mode

**CRITICAL**: Ensure these settings in your `.env`:
```env
DATABASE_MODE=real
MOCK_DATA_ENABLED=false
```

⚠️ **WARNING**: If `DATABASE_MODE=mock` or `MOCK_DATA_ENABLED=true`, the system will use mock data and authentication will NOT persist!

## User Management

### Creating Initial Users

#### Method 1: Using Seed Script (Recommended)

```bash
cd /path/to/TRADEAI

# Set admin password (optional, defaults will be used if not set)
export ADMIN_PASSWORD="SecurePassword123!"

# Run the seeding script
node scripts/seed-production-users.js
```

This will create default users:
- **admin@tradeai.com** (Admin)
- **director@tradeai.com** (Director)
- **manager@tradeai.com** (Manager)
- **kam@tradeai.com** (Key Account Manager)

#### Method 2: Manual User Creation

```bash
# Connect to MongoDB
mongosh "mongodb://admin:admin123@localhost:27017/tradeai?authSource=admin"
```

```javascript
// Switch to database
use tradeai;

// Create user
db.users.insertOne({
  email: "user@example.com",
  password: "$2a$12$hashedPasswordHere", // Use bcrypt to hash
  firstName: "John",
  lastName: "Doe",
  role: "admin",
  department: "IT",
  employeeId: "ADM001",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

#### Method 3: Using API Endpoint (if available)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "manager",
    "department": "Sales"
  }'
```

### User Roles

The system supports the following roles (in order of privilege):

1. **admin**: Full system access
2. **board**: Board-level access, high approval limits
3. **director**: Department-level management
4. **manager**: Team management, medium approval limits
5. **kam**: Key Account Manager, customer-specific access
6. **sales_rep**: Sales representative, basic access
7. **analyst**: Data analysis and reporting

### Default Passwords

⚠️ **IMPORTANT**: The seed script uses default passwords. **Change them immediately after first login!**

Default passwords:
- Admin: `Admin@123`
- Director: `Director@123`
- Manager: `Manager@123`
- KAM: `KAM@123`

## Testing Authentication

### 1. Start the Application

**Using Docker Compose (Recommended)**:
```bash
# Start all services
docker-compose -f docker-compose.local-prod.yml up -d

# View logs
docker-compose -f docker-compose.local-prod.yml logs -f backend

# Check service status
docker-compose -f docker-compose.local-prod.yml ps
```

**Manual Start**:
```bash
# Terminal 1: Start MongoDB
docker-compose -f docker-compose.local-prod.yml up mongodb

# Terminal 2: Start Redis
docker-compose -f docker-compose.local-prod.yml up redis

# Terminal 3: Start Backend
cd backend
npm install
npm start

# Terminal 4: Start Frontend
cd frontend
npm install
npm start
```

### 2. Test Login API

```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tradeai.com",
    "password": "Admin@123"
  }' | jq
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@tradeai.com",
      "firstName": "System",
      "lastName": "Administrator",
      "role": "admin"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### 3. Test Authenticated Request

```bash
# Save token from login response
TOKEN="your_access_token_here"

# Make authenticated request
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 4. Test Token Refresh

```bash
# Use refresh token from login
REFRESH_TOKEN="your_refresh_token_here"

curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | jq
```

### 5. Frontend Login Test

1. Open browser: http://localhost:3000 (or http://localhost:12000 for the dev server)
2. Enter credentials:
   - Email: `admin@tradeai.com`
   - Password: `Admin@123`
3. Click "Login"
4. Verify you're redirected to the dashboard
5. Check browser localStorage for tokens

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] JWT secrets generated (64+ characters)
- [ ] MongoDB connection tested
- [ ] Redis connection tested
- [ ] Default passwords changed
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Audit logging enabled

### Deployment Steps

1. **Prepare Environment**:
   ```bash
   # Create production directory
   mkdir -p /opt/tradeai
   cd /opt/tradeai
   
   # Clone or copy application
   git clone <repository-url> .
   
   # Copy and configure environment
   cp .env.production .env
   nano .env  # Edit with production values
   ```

2. **Start Services**:
   ```bash
   # Start with docker-compose
   docker-compose -f docker-compose.production.yml up -d
   
   # Check logs
   docker-compose -f docker-compose.production.yml logs -f
   ```

3. **Seed Initial Users**:
   ```bash
   # Set admin password
   export ADMIN_PASSWORD="YourSecureAdminPassword"
   export MONGODB_URI="mongodb://admin:password@mongodb:27017/tradeai?authSource=admin"
   
   # Run seed script
   docker-compose exec backend node scripts/seed-production-users.js
   ```

4. **Verify Deployment**:
   ```bash
   # Check service health
   curl https://your-domain.com/health
   
   # Test login
   curl -X POST https://your-domain.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@tradeai.com","password":"YourSecureAdminPassword"}'
   ```

5. **Configure SSL/HTTPS** (if not using a reverse proxy):
   - Ensure SSL certificates are in place
   - Configure nginx or your web server for HTTPS
   - Force HTTPS redirect
   - Test SSL configuration: https://www.ssllabs.com/ssltest/

### Post-Deployment

1. **Change Default Passwords**:
   - Login to each default account
   - Go to Profile > Change Password
   - Set strong, unique passwords

2. **Enable 2FA for Admin Users**:
   - Login as admin
   - Go to Security Settings
   - Enable Two-Factor Authentication
   - Scan QR code with authenticator app

3. **Configure Monitoring**:
   - Set up alerts for failed login attempts
   - Monitor authentication logs
   - Configure uptime monitoring

4. **Test All User Roles**:
   - Login with each role
   - Verify permissions
   - Test key workflows

## Troubleshooting

### Issue: "Invalid credentials" even with correct password

**Symptoms**:
- Login always fails
- Mock data screens appear
- Users can't authenticate

**Solutions**:
1. Check database mode:
   ```bash
   # In .env file, ensure:
   DATABASE_MODE=real
   MOCK_DATA_ENABLED=false
   ```

2. Verify MongoDB connection:
   ```bash
   # Check if MongoDB is running
   docker-compose ps mongodb
   
   # Test connection
   mongosh "$MONGODB_URI"
   ```

3. Check if user exists:
   ```javascript
   use tradeai;
   db.users.findOne({email: "admin@tradeai.com"});
   ```

4. Verify password hash:
   ```javascript
   // Password should be a bcrypt hash starting with $2a$ or $2b$
   db.users.findOne({email: "admin@tradeai.com"}, {password: 1});
   ```

### Issue: Token expired immediately

**Symptoms**:
- Login successful but immediate logout
- "Token expired" errors

**Solutions**:
1. Check JWT configuration:
   ```env
   JWT_EXPIRE=24h
   JWT_EXPIRES_IN=24h
   ```

2. Verify server time:
   ```bash
   docker-compose exec backend date
   ```

3. Check token generation in logs:
   ```bash
   docker-compose logs backend | grep -i "token"
   ```

### Issue: CORS errors on login

**Symptoms**:
- Network errors in browser console
- "CORS policy" errors

**Solutions**:
1. Check CORS configuration:
   ```env
   CORS_ORIGIN=http://localhost:3000,https://your-domain.com
   CORS_ORIGINS=http://localhost:3000,https://your-domain.com
   ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
   ```

2. Verify frontend URL matches CORS settings

3. Check backend logs for CORS errors:
   ```bash
   docker-compose logs backend | grep -i "cors"
   ```

### Issue: Redis connection failed

**Symptoms**:
- "Redis connection refused"
- Slow response times
- Session data not persisting

**Solutions**:
1. Check Redis status:
   ```bash
   docker-compose ps redis
   ```

2. Test Redis connection:
   ```bash
   docker-compose exec redis redis-cli -a redis123 ping
   ```

3. Verify Redis configuration:
   ```env
   REDIS_HOST=redis
   REDIS_PORT=6379
   REDIS_PASSWORD=redis123
   REDIS_ENABLED=true
   ```

### Issue: "No token in response" error

**Symptoms**:
- Login request succeeds but no token returned
- Frontend shows "No authentication token received"

**Solutions**:
1. Check backend response format:
   ```bash
   # Test login and inspect response
   curl -v -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@tradeai.com","password":"Admin@123"}'
   ```

2. Verify authController.js generates tokens correctly

3. Check for errors in backend logs:
   ```bash
   docker-compose logs backend | grep -i "error"
   ```

### Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Invalid credentials" | Wrong password or user not found | Check user exists, verify password |
| "Token expired" | Access token older than JWT_EXPIRE | Use refresh token to get new access token |
| "Invalid token" | Token signature invalid | Check JWT_SECRET matches between sign/verify |
| "User not found" | User deleted or ID mismatch | Re-create user account |
| "Account is deactivated" | User's isActive = false | Set user.isActive = true in database |
| "Database connection failed" | MongoDB not accessible | Check MONGODB_URI and MongoDB status |

### Debug Mode

Enable verbose logging for troubleshooting:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

View detailed authentication logs:
```bash
docker-compose logs -f backend | grep -i "auth"
```

### Getting Help

If issues persist:

1. Check application logs: `/var/log/tradeai/app.log`
2. Review security audit logs: `/var/log/tradeai/security/`
3. Check MongoDB logs: `docker-compose logs mongodb`
4. Check Redis logs: `docker-compose logs redis`
5. Review nginx/proxy logs if using reverse proxy

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use environment-specific configurations**
3. **Rotate JWT secrets periodically** (every 90 days)
4. **Monitor failed login attempts**
5. **Enable 2FA for all admin accounts**
6. **Use strong, unique passwords**
7. **Implement IP whitelisting for admin access**
8. **Regular security audits**
9. **Keep dependencies updated**
10. **Use HTTPS only in production**

## Additional Resources

- [JWT.io](https://jwt.io/) - JWT token inspector
- [bcrypt calculator](https://bcrypt-generator.com/) - Generate bcrypt hashes
- [Security Audit Documentation](./SECURITY_AUDIT.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Last Updated**: 2024-10-27  
**Version**: 2.1.3
