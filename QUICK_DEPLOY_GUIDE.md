# 🚀 Quick Deployment Guide - AI Flow System

**Target**: Production Server (tradeai.gonxt.tech)  
**Time Required**: 10-15 minutes  
**Downtime**: None (zero-downtime deployment)

---

## 📋 Pre-Deployment Checklist

- [x] All code committed to GitHub
- [x] Frontend builds successfully locally
- [x] Routes configured in App.js
- [x] API fallbacks implemented
- [ ] Production server accessible via SSH
- [ ] PM2 running on server
- [ ] Nginx configured (if used)

---

## 🛠️ Deployment Steps

### **Step 1: SSH into Production Server**
```bash
ssh ubuntu@tradeai.gonxt.tech
# Or use your configured SSH alias
```

### **Step 2: Navigate to Repository**
```bash
cd /home/ubuntu/tradeai-repo
# Or wherever your repo is located
```

### **Step 3: Pull Latest Code**
```bash
git pull origin main
```

**Expected Output**:
```
Updating 6240363f..a10e4010
Fast-forward
 frontend/src/App.js                           |   48 ++
 frontend/src/components/flows/UniversalFlowLayout.jsx | 345 ++++++++++
 frontend/src/pages/flows/BudgetPlanningFlow.jsx       | 520 ++++++++++++++
 frontend/src/pages/flows/CustomerEntryFlow.jsx        | 650 ++++++++++++++++++
 frontend/src/pages/flows/ProductEntryFlow.jsx         | 620 +++++++++++++++++
 frontend/src/pages/flows/PromotionEntryFlow.jsx       | 580 ++++++++++++++++
 frontend/src/pages/flows/TradeSpendEntryFlow.jsx      | 450 +++++++++++++
 frontend/src/utils/apiHealth.js                       | 250 +++++++
 8 files changed, 3463 insertions(+)
```

### **Step 4: Install Dependencies**
```bash
cd frontend
npm install
```

**Note**: This may take 2-3 minutes. Watch for any errors.

### **Step 5: Build Frontend**
```bash
npm run build
```

**Expected Output**:
```
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:
  500 KB  build/static/js/main.abc123.js
  50 KB   build/static/css/main.xyz789.css

The build folder is ready to be deployed.
```

**⚠️ Watch For**:
- ❌ Build errors (fix before proceeding)
- ⚠️ Build warnings (acceptable if minor)
- ✅ "Compiled successfully" message

### **Step 6: Restart Frontend Service**

**If using PM2**:
```bash
pm2 restart tradeai-frontend
pm2 status
```

**If using standalone serve**:
```bash
pm2 restart frontend-serve
```

**If using Nginx** (no restart needed, just refresh browser):
- Nginx serves static files from `build/` directory
- Changes take effect immediately

### **Step 7: Verify Backend is Running**
```bash
pm2 status
```

**Expected Output**:
```
┌─────┬────────────────────┬─────────┬─────────┬─────────┐
│ id  │ name               │ mode    │ status  │ cpu     │
├─────┼────────────────────┼─────────┼─────────┼─────────┤
│ 0   │ tradeai-backend    │ fork    │ online  │ 0%      │
│ 1   │ tradeai-frontend   │ fork    │ online  │ 0%      │
└─────┴────────────────────┴─────────┴─────────┴─────────┘
```

**If backend is not running**:
```bash
cd /home/ubuntu/tradeai-repo/backend
pm2 start server.js --name tradeai-backend
```

### **Step 8: Health Check**
```bash
curl http://localhost:5000/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "2.3.0"
}
```

---

## 🧪 Testing New Routes

### **Browser Testing**

**Open each new route**:
1. https://tradeai.gonxt.tech/promotions/new-flow
2. https://tradeai.gonxt.tech/customers/new-flow
3. https://tradeai.gonxt.tech/products/new-flow
4. https://tradeai.gonxt.tech/trade-spends/new-flow
5. https://tradeai.gonxt.tech/budgets/new-flow

**For each route, verify**:
- ✅ Page loads (no 404 error)
- ✅ Login redirect works if not authenticated
- ✅ Layout displays correctly (70/30 split)
- ✅ AI panel is visible on right side
- ✅ Form fields are interactive
- ✅ No console errors (press F12 → Console tab)

### **Functional Testing**

**Test Promotion Flow**:
```
1. Navigate to /promotions/new-flow
2. Login if prompted
3. Enter promotion name: "Test Promo"
4. Select type: "Discount"
5. Enter discount: 15%
6. Enter budget: R50000
7. Watch AI panel update (within 2 seconds)
8. Verify:
   - ML calculation appears
   - ROI displayed
   - Revenue forecast shown
   - Success rate visible
9. Click "Create Promotion"
10. Check for success message
```

**Expected Behavior**:
- AI panel updates as you type (debounced 1-2s)
- Calculations appear even if backend ML API doesn't exist (fallback)
- Form validates before submission
- Success message appears on save
- Redirects to list page after save

---

## 🔍 Troubleshooting

### **Problem**: Page shows 404
**Solution**:
```bash
# Check if build files exist
ls -la frontend/build/

# If missing, rebuild
cd frontend
npm run build

# Restart frontend
pm2 restart tradeai-frontend
```

### **Problem**: AI Panel Not Showing
**Solution**:
- Check browser console for errors (F12)
- Verify UniversalFlowLayout component imported
- Check responsive layout (try desktop view)

### **Problem**: API Calls Failing
**Solution**:
```bash
# Check backend status
pm2 status tradeai-backend

# Check backend logs
pm2 logs tradeai-backend --lines 50

# Restart if needed
pm2 restart tradeai-backend
```

### **Problem**: Build Errors
**Common Issues**:
```bash
# Missing dependencies
npm install

# Cache issues
rm -rf node_modules package-lock.json
npm install

# Out of memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### **Problem**: Changes Not Reflecting
**Solution**:
```bash
# Hard refresh browser
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)

# Clear browser cache
# Or use incognito mode
```

---

## 📊 Post-Deployment Verification

### **Smoke Tests** (5 minutes)

| Test | URL | Expected Result | Status |
|------|-----|-----------------|--------|
| Homepage | https://tradeai.gonxt.tech | Dashboard loads | ⏳ |
| Login | /login | Can authenticate | ⏳ |
| Promo Flow | /promotions/new-flow | Page loads | ⏳ |
| Customer Flow | /customers/new-flow | Page loads | ⏳ |
| Product Flow | /products/new-flow | Page loads | ⏳ |
| Trade Flow | /trade-spends/new-flow | Page loads | ⏳ |
| Budget Flow | /budgets/new-flow | Page loads | ⏳ |
| Old CRUD | /promotions | Still works | ⏳ |

### **Performance Checks**

```bash
# Check page load time
curl -o /dev/null -s -w 'Total: %{time_total}s\n' \
  https://tradeai.gonxt.tech/promotions/new-flow
```

**Target**: < 2 seconds

### **API Health Monitoring**

```bash
# Continuous monitoring (10 checks)
for i in {1..10}; do
  echo "Check $i:"
  curl -s https://tradeai.gonxt.tech/api/health | jq .
  sleep 5
done
```

**Expected**: All checks return `"status": "healthy"`

---

## 🎯 Success Criteria

**Deployment is successful if**:
- ✅ All 5 flow routes accessible (no 404s)
- ✅ Login/authentication working
- ✅ AI panels visible and updating
- ✅ Forms submit successfully
- ✅ API health check passes
- ✅ No critical console errors
- ✅ Old CRUD interfaces still work
- ✅ Backend services running stable

---

## 🔄 Rollback Plan (If Needed)

**If deployment fails**:

### **Option 1: Git Rollback**
```bash
cd /home/ubuntu/tradeai-repo
git log --oneline -5
git checkout <previous-commit-hash>
cd frontend
npm run build
pm2 restart tradeai-frontend
```

### **Option 2: Backup Restoration**
```bash
# If you created backup
cd /home/ubuntu
rm -rf tradeai-repo
cp -r tradeai-repo.backup tradeai-repo
cd tradeai-repo/frontend
pm2 restart tradeai-frontend
```

### **Option 3: Keep Old Routes**
- New flow routes are **additive**
- Old CRUD routes still exist: `/promotions`, `/customers`, etc.
- If new routes fail, users can still use old interface
- **Zero user impact** during deployment

---

## 📈 Monitoring First 24 Hours

### **Metrics to Watch**

1. **Error Rate**
   ```bash
   pm2 logs tradeai-backend --lines 100 | grep ERROR | wc -l
   ```
   **Target**: < 10 errors per hour

2. **Response Time**
   ```bash
   # Average API response time
   curl -s https://tradeai.gonxt.tech/api/health | jq .latency
   ```
   **Target**: < 200ms

3. **Memory Usage**
   ```bash
   pm2 status
   ```
   **Target**: Backend < 500MB, Frontend < 200MB

4. **User Activity**
   - Check analytics for new route visits
   - Monitor AI panel interaction rate
   - Track form submission success rate

### **Daily Health Check**
```bash
# Run this script daily
#!/bin/bash
echo "=== TradeAI Health Check ==="
echo "Date: $(date)"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "API Health:"
curl -s https://tradeai.gonxt.tech/api/health | jq .
echo ""
echo "Disk Space:"
df -h | grep /dev/root
echo ""
echo "Memory:"
free -h
echo "=== End Check ==="
```

---

## 📞 Support Contacts

**If deployment issues occur**:
- **Technical Lead**: Check GitHub issues
- **DevOps**: SSH access required
- **Backend Team**: API endpoint support
- **Frontend Team**: UI/UX issues

---

## ✅ Deployment Checklist

- [ ] SSH access confirmed
- [ ] Code pulled from GitHub
- [ ] Dependencies installed
- [ ] Frontend built successfully
- [ ] PM2 services restarted
- [ ] Health check passed
- [ ] All 5 routes tested
- [ ] No console errors
- [ ] Old routes still work
- [ ] Monitoring enabled
- [ ] Team notified

---

## 🎉 Post-Deployment

**Once deployed**:
1. ✅ Announce to team: "New AI Flow system is LIVE!"
2. ✅ Share documentation links
3. ✅ Schedule demo/training session
4. ✅ Collect user feedback
5. ✅ Monitor adoption metrics
6. ✅ Plan iteration based on feedback

---

**Estimated Total Time**: 10-15 minutes  
**Risk Level**: Low (additive changes, no breaking changes)  
**Rollback Time**: < 5 minutes if needed

**Good luck! 🚀**
