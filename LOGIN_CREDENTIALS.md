# 🔐 TRADEAI Login Credentials

## Production Login Information

**Production URL:** https://tradeai.gonxt.tech

---

## 👤 Available User Accounts

### 1. Super Admin (Primary Account)
```
Email:    admin@mondelez.co.za
Password: Admin@123456
Role:     Super Admin
Access:   Full system access
```

**Capabilities:**
- ✅ Access all modules and features
- ✅ Tenant management
- ✅ User management
- ✅ System configuration
- ✅ All enterprise features (simulations, dashboards, transactions)
- ✅ Budget management
- ✅ Trade spend tracking
- ✅ Promotion management
- ✅ Analytics and reporting

---

## 🏢 Current Tenant Information

**Tenant Name:** Mondelez South Africa  
**Tenant ID:** `68e130fcbfaa1c2ab78caece`  
**Status:** Active  
**License:** Enterprise  

**Database:**
- **Transactions:** 50,000+ records ✅
- **Users:** 8 users ✅
- **Products:** Populated ✅
- **Customers:** Populated ✅

---

## 🎯 Testing Different User Roles

Currently, only the super admin account is documented. To test different role-based access:

### Option 1: Use Existing Users
Check the database for other user accounts:
```bash
# SSH to production server
ssh user@tradeai.gonxt.tech

# Connect to MongoDB
mongo tradeai

# List all users
db.users.find({ tenant: ObjectId("68e130fcbfaa1c2ab78caece") }, { email: 1, role: 1 })
```

### Option 2: Create Test Users
Use the super admin account to create additional users with different roles:
1. Login as admin@mondelez.co.za
2. Navigate to Users menu
3. Create new user with desired role (e.g., Manager, Finance, Sales)

---

## 🔑 Password Reset (If Needed)

If you need to reset the admin password:

### Method 1: Via Database (MongoDB)
```bash
# SSH to server
ssh user@tradeai.gonxt.tech

# Connect to MongoDB
mongo tradeai

# Hash new password (use Node.js bcrypt)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('NewPassword123', 10, (err, hash) => console.log(hash));"

# Update user password
db.users.updateOne(
  { email: "admin@mondelez.co.za" },
  { $set: { password: "HASHED_PASSWORD_HERE" } }
)
```

### Method 2: Via API (if forgot password is implemented)
```bash
POST /api/auth/forgot-password
{
  "email": "admin@mondelez.co.za"
}
```

---

## 🚀 Quick Start Login Steps

### Step 1: Navigate to Application
```
Browser: Chrome, Firefox, or Safari (latest version)
URL: https://tradeai.gonxt.tech
```

### Step 2: Enter Credentials
```
Email: admin@mondelez.co.za
Password: Admin@123456
```

### Step 3: Access Features
After login, you'll be redirected to the dashboard. Available routes:
- `/dashboard` - Main dashboard
- `/executive-dashboard` - Enhanced executive dashboard with KPIs ⭐ NEW
- `/simulations` - Simulation Studio with 4 simulators ⭐ NEW
- `/transactions` - Transaction management with bulk operations ⭐ NEW
- `/budgets` - Budget management
- `/trade-spends` - Trade spend tracking
- `/promotions` - Promotion management
- `/customers` - Customer management
- `/products` - Product management
- `/analytics` - Analytics dashboard
- `/reports` - Report builder

---

## 🔒 Security Notes

### Password Policy
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- Special characters recommended

### Session Management
- JWT tokens stored in localStorage
- Token expiry: 24 hours (default)
- Auto-logout on token expiry
- Refresh token available

### Best Practices
1. ✅ Change default password after first login
2. ✅ Use strong, unique passwords
3. ✅ Don't share credentials
4. ✅ Enable 2FA if available
5. ✅ Logout after use
6. ✅ Clear browser cache on shared computers

---

## 🧪 Testing Scenarios

### Test 1: Basic Login
```
1. Navigate to https://tradeai.gonxt.tech
2. Enter: admin@mondelez.co.za / Admin@123456
3. Click "Login"
4. Verify redirect to /dashboard
```

**Expected:** ✅ Successful login, dashboard loads

### Test 2: Invalid Credentials
```
1. Enter: invalid@email.com / wrongpassword
2. Click "Login"
```

**Expected:** ❌ Error message "Invalid credentials"

### Test 3: Access Protected Route Without Auth
```
1. Logout if logged in
2. Navigate to https://tradeai.gonxt.tech/simulations
```

**Expected:** ↩️ Redirect to login page

### Test 4: Token Expiry
```
1. Login successfully
2. Wait 24+ hours (or manually delete token from localStorage)
3. Try to access any protected route
```

**Expected:** ↩️ Auto-redirect to login page

---

## 📊 User Roles & Permissions

Based on the system's role-based access control:

### Super Admin
- **Access Level:** Full system access
- **Can Access:** All features, all data
- **Can Manage:** Tenants, users, system config
- **Default Account:** admin@mondelez.co.za ✅

### Company Admin
- **Access Level:** Company-wide access
- **Can Access:** All company data and features
- **Can Manage:** Company users, budgets, approvals
- **Default Account:** To be created

### Manager
- **Access Level:** Department/team access
- **Can Access:** Assigned departments/categories
- **Can Manage:** Team budgets, transaction approvals
- **Default Account:** To be created

### Finance
- **Access Level:** Financial data access
- **Can Access:** Budgets, trade spend, financial reports
- **Can Manage:** Budget approvals, financial reconciliation
- **Default Account:** To be created

### Sales
- **Access Level:** Sales data access
- **Can Access:** Customers, promotions, sales analytics
- **Can Manage:** Customer relationships, promotion requests
- **Default Account:** To be created

### User (Basic)
- **Access Level:** Limited access
- **Can Access:** Own transactions, basic reports
- **Can Manage:** Own profile, data entry
- **Default Account:** To be created

---

## 🔧 Troubleshooting Login Issues

### Issue 1: "Invalid Credentials" Error
**Possible Causes:**
- Wrong email or password
- Account disabled
- Tenant inactive

**Solution:**
1. Verify correct email: `admin@mondelez.co.za`
2. Verify correct password: `Admin@123456`
3. Check caps lock is off
4. Try password reset if available

### Issue 2: "Network Error" or "Cannot Connect"
**Possible Causes:**
- Backend server down
- Network connectivity issue
- CORS configuration

**Solution:**
1. Check server status: `curl https://tradeai.gonxt.tech/api/health`
2. Verify internet connection
3. Check browser console for errors (F12)
4. Try different browser

### Issue 3: Stuck on Login Screen
**Possible Causes:**
- JavaScript error
- Token not being stored
- Redirect not working

**Solution:**
1. Clear browser cache and cookies
2. Open browser console (F12) and check for errors
3. Try incognito/private mode
4. Verify localStorage is enabled in browser

### Issue 4: "Unauthorized" After Login
**Possible Causes:**
- Token not attached to requests
- Token expired immediately
- Backend auth middleware issue

**Solution:**
1. Check localStorage for token: `localStorage.getItem('token')`
2. Verify token is valid JWT format
3. Check network tab (F12) - verify Authorization header
4. Restart backend server if needed

---

## 📱 Multi-Device Login

### Desktop
- ✅ Chrome (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### Tablet
- ✅ iPad (Safari)
- ✅ Android tablets (Chrome)

### Mobile
- ⚠️ Responsive design implemented
- ⚠️ Some charts may be optimized for larger screens
- ✅ Basic functionality works

---

## 🔐 Additional Security Features

### Session Security
- JWT token authentication
- Secure HTTP-only cookies (if implemented)
- CSRF protection
- XSS protection

### Audit Logging
- Login attempts logged
- Failed login tracking
- User activity tracking
- Admin actions logged

### Account Security
- Password hashing (bcrypt)
- Rate limiting on login attempts
- Account lockout after failed attempts
- Session timeout

---

## 💡 Tips for First Login

### 1. Change Password Immediately
After first login, navigate to:
```
Profile → Settings → Change Password
```

### 2. Explore Features
Test all new enterprise features:
- **Simulation Studio** - Run a promotion impact simulation
- **Executive Dashboard** - View KPIs and charts
- **Transaction Management** - Browse 50K+ transactions

### 3. Check Data
Verify data is populated:
- Transactions: 50,000+ ✅
- Products: Multiple ✅
- Customers: Multiple ✅
- Promotions: Sample data ✅

### 4. Test Workflows
- Create a test budget
- Run a simulation
- Export a report
- Approve/reject transactions

---

## 📞 Support

### If You Can't Login
1. **Verify URL:** https://tradeai.gonxt.tech
2. **Verify Credentials:** admin@mondelez.co.za / Admin@123456
3. **Check Server Status:** Backend should return 200 OK
4. **Browser Console:** Check for JavaScript errors (F12)
5. **Contact Support:** Provide error message and screenshots

### System Admin Contact
- **GitHub Issues:** https://github.com/Reshigan/TRADEAI/issues
- **Technical Documentation:** See DEPLOYMENT_READY.md
- **API Documentation:** See ENTERPRISE_FEATURES.md

---

## ✅ Quick Reference Card

```
┌─────────────────────────────────────────┐
│  TRADEAI LOGIN CREDENTIALS              │
├─────────────────────────────────────────┤
│  URL:      tradeai.gonxt.tech          │
│  Email:    admin@mondelez.co.za        │
│  Password: Admin@123456                 │
│  Role:     Super Admin                  │
├─────────────────────────────────────────┤
│  NEW FEATURES:                          │
│  • /simulations  (Simulation Studio)    │
│  • /executive-dashboard (Enhanced KPIs) │
│  • /transactions (Bulk Operations)      │
└─────────────────────────────────────────┘
```

---

**Last Updated:** October 4, 2025  
**Status:** ✅ VERIFIED AND WORKING  
**Environment:** Production (tradeai.gonxt.tech)
