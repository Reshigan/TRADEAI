# TRADEAI - Post-UAT Action Checklist

**Date**: 2025-10-03  
**Priority**: CRITICAL  
**Deadline**: Complete security fixes within 24-48 hours  

---

## 🔴 CRITICAL - IMMEDIATE ACTIONS (DO FIRST)

### 1. Review Documentation
- [ ] Read `UAT_EXECUTIVE_SUMMARY.md` - High-level findings
- [ ] Read `SECURITY_CRITICAL_FIXES.md` - Detailed security remediation
- [ ] Read `CHANGES_MADE.md` - All changes made during UAT
- [ ] Read `comprehensive_uat_analysis.md` - Complete technical findings

**Estimated Time**: 30-45 minutes  
**Owner**: Technical Lead / Security Team

---

### 2. Remove Sensitive Files from Git History

⚠️ **WARNING**: This requires force pushing and all team members must re-clone!

**Files to Remove**:
- `.env.production` (contains production credentials)
- `TPMServer.pem` (AWS SSH private key)
- Any other sensitive files not in `.gitignore`

**Steps**:

```bash
# 1. Install BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# 2. Create backup of repository (just in case)
cd /path/to/TRADEAI
cd ..
tar -czf TRADEAI-backup-$(date +%Y%m%d).tar.gz TRADEAI/

# 3. Clone fresh copy for cleaning
git clone --mirror https://github.com/Reshigan/TRADEAI.git TRADEAI-clean.git
cd TRADEAI-clean.git

# 4. Remove sensitive files from history
java -jar /path/to/bfg-1.14.0.jar --delete-files .env.production
java -jar /path/to/bfg-1.14.0.jar --delete-files TPMServer.pem

# 5. Clean up the repository
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. Push cleaned repository (THIS WILL REWRITE HISTORY!)
git push --force

# 7. Notify ALL team members to re-clone
# Send email/Slack message with instructions
```

**Checklist**:
- [ ] Download BFG Repo-Cleaner
- [ ] Create backup of repository
- [ ] Clone mirror copy
- [ ] Remove `.env.production` from history
- [ ] Remove `TPMServer.pem` from history
- [ ] Clean up repository
- [ ] Force push to remote
- [ ] Notify all team members to re-clone
- [ ] Verify sensitive files are gone: `git log --all --full-history -- .env.production`

**Estimated Time**: 30 minutes  
**Owner**: DevOps / Senior Developer  
**Risk Level**: HIGH (requires coordination)

---

### 3. Rotate Production Credentials

⚠️ **DO THIS IMMEDIATELY AFTER CLEANING GIT HISTORY**

#### 3.1 Rotate MongoDB Password

```bash
# 1. Connect to production MongoDB
mongosh "mongodb://admin:OLD_PASSWORD@your-server:27017/admin"

# 2. Change admin password
use admin
db.changeUserPassword("admin", "NEW_STRONG_PASSWORD_HERE")

# 3. Update .env on production server
ssh your-server
cd /path/to/tradeai
nano .env

# Update this line:
# MONGO_PASSWORD=NEW_STRONG_PASSWORD_HERE

# 4. Restart backend service
docker-compose restart backend
```

**Checklist**:
- [ ] Generate strong password (use password manager)
- [ ] Change MongoDB password on server
- [ ] Update .env on production server
- [ ] Restart backend service
- [ ] Verify application still works
- [ ] Store password in team password manager

**Estimated Time**: 15 minutes  
**Owner**: Database Administrator / DevOps

---

#### 3.2 Rotate Redis Password

```bash
# 1. Connect to Redis
redis-cli -h your-server -a OLD_PASSWORD

# 2. Set new password in Redis
CONFIG SET requirepass "NEW_STRONG_REDIS_PASSWORD"
CONFIG REWRITE

# 3. Update .env on production server
nano .env

# Update this line:
# REDIS_PASSWORD=NEW_STRONG_REDIS_PASSWORD

# 4. Restart services
docker-compose restart backend
```

**Checklist**:
- [ ] Generate strong password
- [ ] Change Redis password
- [ ] Update .env on production
- [ ] Restart services
- [ ] Verify caching works
- [ ] Store password in password manager

**Estimated Time**: 15 minutes  
**Owner**: DevOps

---

#### 3.3 Rotate JWT Secrets

```bash
# 1. Generate new secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# 2. Update .env on production server
nano .env

# Update these lines:
# JWT_SECRET=<new-64-char-hex-string>
# JWT_REFRESH_SECRET=<different-64-char-hex-string>

# 3. Restart backend
docker-compose restart backend

# 4. IMPORTANT: All users will be logged out and must re-login
```

**Checklist**:
- [ ] Generate new JWT_SECRET (64 bytes)
- [ ] Generate new JWT_REFRESH_SECRET (64 bytes)
- [ ] Update .env on production
- [ ] Restart backend service
- [ ] Notify users they must re-login
- [ ] Store secrets in password manager
- [ ] Verify login works with new secrets

**Estimated Time**: 10 minutes  
**Owner**: Backend Developer / DevOps  
**Impact**: All users logged out

---

#### 3.4 Rotate AWS SSH Keys

```bash
# 1. Generate new SSH key pair
ssh-keygen -t rsa -b 4096 -C "tradeai-production" -f ~/.ssh/tradeai-new

# 2. Add new public key to AWS EC2 instance
# Method A: Through AWS Console
# - Go to EC2 > Key Pairs
# - Import new public key
# - Update EC2 instance to use new key

# Method B: Manually add to authorized_keys
ssh -i TPMServer.pem ec2-user@your-server
echo "NEW_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys

# 3. Test new key works
ssh -i ~/.ssh/tradeai-new ec2-user@your-server

# 4. Remove old key from authorized_keys
# Edit ~/.ssh/authorized_keys and remove old key

# 5. Revoke old key in AWS Console

# 6. Update deployment scripts with new key path
```

**Checklist**:
- [ ] Generate new SSH key pair
- [ ] Add new public key to AWS
- [ ] Test new key works
- [ ] Remove old key from server
- [ ] Revoke old key in AWS Console
- [ ] Update deployment scripts
- [ ] Store private key securely
- [ ] Delete old `TPMServer.pem` file

**Estimated Time**: 20 minutes  
**Owner**: DevOps / Infrastructure Team

---

#### 3.5 Change Default User Passwords

```bash
# 1. Connect to production database
mongosh "mongodb://admin:PASSWORD@your-server:27017/tradeai"

# 2. Generate strong passwords for each user
# Use password manager to generate

# 3. Update user passwords (they're hashed with bcrypt)
# Option A: Through application admin panel
# - Login as admin
# - Go to User Management
# - Reset password for each demo user

# Option B: Through backend API
curl -X POST https://your-domain.com/api/users/reset-password \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "newPassword": "STRONG_PASSWORD"}'

# 4. Notify users of password change
```

**Default Users to Update**:
- [ ] admin@tradeai.com (currently: admin123)
- [ ] manager@tradeai.com (currently: admin123)
- [ ] kam@tradeai.com (currently: admin123)
- [ ] Any other demo/test users

**Checklist**:
- [ ] Generate strong passwords for all default users
- [ ] Change admin password
- [ ] Change manager password
- [ ] Change KAM password
- [ ] Store new passwords in password manager
- [ ] Notify users of password change
- [ ] Test login with new passwords

**Estimated Time**: 15 minutes  
**Owner**: Application Administrator

---

## 🟠 HIGH PRIORITY - WITHIN 48 HOURS

### 4. Implement Frontend Improvements

#### 4.1 Add ErrorBoundary to App

```javascript
// File: frontend/src/App.js

import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* Your existing app content */}
    </ErrorBoundary>
  );
}
```

**Checklist**:
- [ ] Import ErrorBoundary component
- [ ] Wrap entire app with ErrorBoundary
- [ ] Test error handling (throw error in component)
- [ ] Verify user-friendly error message shows
- [ ] Deploy to production

**Estimated Time**: 15 minutes  
**Owner**: Frontend Developer

---

#### 4.2 Add Validation to Critical Forms

Update forms to use new validation utilities:

**Forms to Update**:
- [ ] Login form (`components/Login.js`)
- [ ] User creation/edit form
- [ ] Budget creation/edit form
- [ ] Promotion creation form

**Example Implementation**:

```javascript
// File: frontend/src/components/Login.js

import { validateEmail, validatePassword, validateForm } from '../utils/validation';

const handleSubmit = (e) => {
  e.preventDefault();
  
  // Validate form
  const { isValid, errors } = validateForm(credentials, {
    email: [validateEmail],
    password: [validatePassword]
  });
  
  if (!isValid) {
    setErrors(errors);
    return;
  }
  
  // Proceed with login
  // ...
};
```

**Checklist**:
- [ ] Update Login.js with email validation
- [ ] Update User form with validation
- [ ] Update Budget form with number validation
- [ ] Update Promotion form with date validation
- [ ] Test all forms with invalid data
- [ ] Test all forms with valid data
- [ ] Deploy to production

**Estimated Time**: 2 hours  
**Owner**: Frontend Developer

---

### 5. Set Up Monitoring

#### 5.1 Error Tracking (Sentry)

```bash
# 1. Create Sentry account (if not exists)
# 2. Create new project for TRADEAI

# 3. Install Sentry SDK
cd backend
npm install @sentry/node @sentry/tracing

cd ../frontend
npm install @sentry/react @sentry/tracing

# 4. Initialize Sentry in backend
# File: backend/src/app.js
const Sentry = require("@sentry/node");
Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

# 5. Initialize Sentry in frontend
# File: frontend/src/index.js
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

**Checklist**:
- [ ] Create Sentry account
- [ ] Create backend project in Sentry
- [ ] Create frontend project in Sentry
- [ ] Install Sentry SDK (backend)
- [ ] Install Sentry SDK (frontend)
- [ ] Configure Sentry in backend
- [ ] Configure Sentry in frontend
- [ ] Test error reporting
- [ ] Set up alert rules
- [ ] Add team members to Sentry

**Estimated Time**: 1 hour  
**Owner**: DevOps / Backend Developer

---

#### 5.2 Application Monitoring

```bash
# Set up basic monitoring
# Option A: Prometheus + Grafana
# Option B: New Relic / Datadog (easier)

# For basic monitoring, add health check endpoints
# Already exist in backend:
# - GET /health - Basic health check
# - GET /api/health/db - Database connectivity
# - GET /api/health/cache - Redis connectivity

# Set up uptime monitoring (free options)
# - UptimeRobot (https://uptimerobot.com)
# - Pingdom
# - StatusCake
```

**Checklist**:
- [ ] Choose monitoring solution
- [ ] Set up health check monitoring
- [ ] Configure alerts (email/Slack)
- [ ] Monitor key metrics (CPU, memory, disk)
- [ ] Set up log aggregation
- [ ] Create monitoring dashboard
- [ ] Test alert notifications

**Estimated Time**: 2 hours  
**Owner**: DevOps

---

### 6. Set Up Automated Backups

```bash
# Create backup script
# File: scripts/backup/backup-production.sh

#!/bin/bash

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups/tradeai/$DATE"
S3_BUCKET="s3://your-backup-bucket/tradeai"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/db"

# Backup uploaded files
tar -czf $BACKUP_DIR/files.tar.gz /path/to/uploads

# Upload to S3
aws s3 sync $BACKUP_DIR $S3_BUCKET/$DATE

# Clean up old backups (keep last 30 days)
find /backups/tradeai/* -mtime +30 -exec rm -rf {} \;

# Set up cron job
# crontab -e
# 0 2 * * * /path/to/scripts/backup/backup-production.sh
```

**Checklist**:
- [ ] Create backup script
- [ ] Test backup script manually
- [ ] Set up S3 bucket for backups
- [ ] Configure AWS credentials
- [ ] Set up cron job for daily backups
- [ ] Test backup restoration
- [ ] Document restoration process
- [ ] Set up backup monitoring/alerts

**Estimated Time**: 2 hours  
**Owner**: DevOps

---

## 🟡 MEDIUM PRIORITY - WITHIN 1 WEEK

### 7. Consolidate Deployment Scripts

```bash
# 1. Run consolidation helper
./consolidate-scripts.sh

# 2. Review output and suggested organization

# 3. Manually move scripts
mv deploy-*.sh scripts/deploy/
mv backup-*.sh scripts/backup/
# etc.

# 4. Update CI/CD pipelines with new paths

# 5. Test unified deployment script
./scripts/deploy/production.sh --dry-run

# 6. Delete obsolete scripts
```

**Checklist**:
- [ ] Run `consolidate-scripts.sh`
- [ ] Review suggested organization
- [ ] Create script directories
- [ ] Move scripts to appropriate folders
- [ ] Update CI/CD pipeline
- [ ] Test deployment scripts
- [ ] Delete obsolete scripts
- [ ] Update documentation

**Estimated Time**: 3 hours  
**Owner**: DevOps Team

---

### 8. Improve Test Coverage

```bash
# 1. Set up testing framework (already exists)

# 2. Add unit tests for critical services
cd backend/tests
# Create test files for:
# - Authentication service
# - Budget service
# - User service
# - Promotion service

# 3. Add integration tests
# Test API endpoints

# 4. Add E2E tests
cd frontend
npm install --save-dev cypress
npx cypress open

# 5. Set up CI/CD testing
# Add to .github/workflows/test.yml or similar
```

**Checklist**:
- [ ] Audit current test coverage
- [ ] Prioritize critical paths to test
- [ ] Write unit tests (target 60%+ coverage)
- [ ] Write integration tests
- [ ] Set up E2E testing framework
- [ ] Write E2E tests for critical flows
- [ ] Configure CI/CD to run tests
- [ ] Set up coverage reporting

**Estimated Time**: 2-3 days  
**Owner**: Development Team

---

### 9. Enable 2FA for Admin Accounts

```bash
# 1. Install 2FA library
cd backend
npm install speakeasy qrcode

# 2. Implement 2FA endpoints
# - POST /api/auth/2fa/setup
# - POST /api/auth/2fa/verify
# - POST /api/auth/2fa/disable

# 3. Update frontend
# Add 2FA setup in user profile
# Add 2FA input on login

# 4. Enforce 2FA for admin role
# Middleware to check 2FA status
```

**Checklist**:
- [ ] Install 2FA dependencies
- [ ] Implement 2FA setup endpoint
- [ ] Implement 2FA verification
- [ ] Add 2FA to user model
- [ ] Create 2FA setup UI
- [ ] Update login flow
- [ ] Test 2FA setup and login
- [ ] Enforce 2FA for admins
- [ ] Document 2FA process

**Estimated Time**: 1-2 days  
**Owner**: Backend + Frontend Developer

---

## 📊 VERIFICATION & TESTING

### 10. Production Smoke Tests

After all changes are deployed, run these tests:

- [ ] **Authentication**
  - [ ] Login with admin account (new password)
  - [ ] Login with manager account (new password)
  - [ ] Login with KAM account (new password)
  - [ ] Logout functionality
  - [ ] Token refresh works

- [ ] **Core Functionality**
  - [ ] View dashboard
  - [ ] Create budget
  - [ ] Create promotion
  - [ ] View reports
  - [ ] Export data

- [ ] **System Health**
  - [ ] Check /health endpoint
  - [ ] Check /api/health/db endpoint
  - [ ] Check /api/health/cache endpoint
  - [ ] Review error logs
  - [ ] Check performance metrics

- [ ] **Security**
  - [ ] Verify sensitive files not in repo
  - [ ] Verify new credentials work
  - [ ] Check audit logs
  - [ ] Test rate limiting
  - [ ] Verify HTTPS enabled

**Estimated Time**: 1 hour  
**Owner**: QA Team / Technical Lead

---

## 📝 DOCUMENTATION

### 11. Update Team Documentation

- [ ] Update team wiki with new passwords (in password manager)
- [ ] Document credential rotation process
- [ ] Update deployment procedures
- [ ] Share UAT findings with team
- [ ] Schedule security training
- [ ] Update runbooks

**Estimated Time**: 2 hours  
**Owner**: Technical Lead

---

## ✅ COMPLETION CHECKLIST

### Critical Items (Must Complete)
- [ ] All documentation reviewed
- [ ] Sensitive files removed from git history
- [ ] All production credentials rotated
- [ ] Team notified to re-clone repository
- [ ] ErrorBoundary implemented
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Production smoke tests passed

### High Priority Items (Should Complete)
- [ ] Form validation added
- [ ] Error tracking (Sentry) configured
- [ ] 2FA enabled for admins
- [ ] Test coverage improved

### Medium Priority Items (Nice to Have)
- [ ] Deployment scripts consolidated
- [ ] Comprehensive test suite
- [ ] Performance monitoring

---

## 📞 CONTACTS & ESCALATION

**Technical Lead**: [Name] - [Contact]  
**Security Team**: [Name] - [Contact]  
**DevOps Lead**: [Name] - [Contact]  
**Product Owner**: [Name] - [Contact]

**Emergency Contact**: [24/7 Contact Info]

---

## 📅 TIMELINE

| Task | Priority | Owner | Deadline | Status |
|------|----------|-------|----------|--------|
| Review Documentation | 🔴 Critical | Tech Lead | Day 1 | ⬜ |
| Clean Git History | 🔴 Critical | DevOps | Day 1 | ⬜ |
| Rotate MongoDB Password | 🔴 Critical | DevOps | Day 1 | ⬜ |
| Rotate Redis Password | 🔴 Critical | DevOps | Day 1 | ⬜ |
| Rotate JWT Secrets | 🔴 Critical | Backend Dev | Day 1 | ⬜ |
| Rotate AWS Keys | 🔴 Critical | DevOps | Day 1 | ⬜ |
| Change Default Passwords | 🔴 Critical | Admin | Day 1 | ⬜ |
| Add ErrorBoundary | 🟠 High | Frontend Dev | Day 2 | ⬜ |
| Add Form Validation | 🟠 High | Frontend Dev | Day 2 | ⬜ |
| Set Up Monitoring | 🟠 High | DevOps | Day 2 | ⬜ |
| Configure Backups | 🟠 High | DevOps | Day 3 | ⬜ |
| Consolidate Scripts | 🟡 Medium | DevOps | Week 1 | ⬜ |
| Improve Tests | 🟡 Medium | Dev Team | Week 1 | ⬜ |
| Enable 2FA | 🟡 Medium | Dev Team | Week 1 | ⬜ |

---

**Document Created**: 2025-10-03  
**Last Updated**: 2025-10-03  
**Version**: 1.0  

---

**⚠️ IMPORTANT**: Do not deploy to production until all CRITICAL items are completed!

