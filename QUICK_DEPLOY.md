# 🚀 TRADEAI Enterprise Edition - Quick Deploy Guide

## Ultra-Quick Deployment (5 Minutes)

### Prerequisites Check
```bash
# Check Node.js
node --version  # Should be 18+

# Check MongoDB
mongosh --version  # Should be 7.0+

# Check Redis
redis-cli ping  # Should return PONG
```

### One-Command Deploy
```bash
sudo ./deploy-enterprise.sh
```

**That's it!** The script handles everything.

---

## What Gets Deployed

✅ **Backend API** - Port 5000  
✅ **Frontend** - Built and ready  
✅ **AI Services** - Port 8000  
✅ **Super Admin** - Created automatically  
✅ **Monitoring** - Health checks enabled  

---

## Default Credentials

**Super Admin:**
- Email: `superadmin@tradeai.com`
- Password: `SuperAdmin123!`

⚠️ **CHANGE IMMEDIATELY AFTER LOGIN!**

---

## Quick Verification

```bash
# 1. Check services
pm2 status

# 2. Check backend health
curl http://localhost:5000/api/health

# 3. View logs
pm2 logs
```

---

## Access Points

| Service | URL |
|---------|-----|
| Backend API | http://localhost:5000/api |
| Super Admin | http://localhost:3000/superadmin |
| Health Check | http://localhost:5000/api/health |
| Monitoring | http://localhost:8080 |

---

## Common Commands

```bash
# View all services
pm2 status

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# View logs
pm2 logs

# Monitor performance
pm2 monit
```

---

## Create First Tenant

1. Login as super admin
2. Click "Create Tenant"
3. Fill in company details
4. Set admin credentials
5. Select license type
6. Click "Create"

Done! Your first tenant is ready.

---

## Troubleshooting

### Services Won't Start
```bash
# Check MongoDB
sudo systemctl status mongod

# Check Redis
sudo systemctl status redis

# Restart everything
pm2 restart all
```

### Can't Login
```bash
# Recreate super admin
node scripts/create-superadmin.js
```

### Need Help?
- Check `/GO_LIVE_READINESS.md`
- Run UAT tests: `node tests/enterprise-uat.js`
- View logs: `pm2 logs`

---

## Next Steps

1. ✅ Change super admin password
2. ✅ Create your first tenant
3. ✅ Configure license plans
4. ✅ Setup monitoring alerts
5. ✅ Run UAT tests

---

**Version:** 2.1.3 Enterprise Edition  
**Status:** Production Ready ✅  
**Support:** support@tradeai.com
