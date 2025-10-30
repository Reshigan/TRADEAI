# 🍫 Mondelez South Africa - Seed Data Guide

## Overview

This document provides comprehensive information about the Mondelez South Africa seed data created for TRADEAI system testing, development, and demonstration purposes.

---

## 🎯 Purpose

The Mondelez SA seed data provides:
1. **Realistic test data** for development and QA
2. **Demo system** for client presentations
3. **Training data** for user onboarding
4. **Complete system showcase** with real-world scenarios

---

## 📊 Data Included

### 1. **Users (6 users)**

Complete Mondelez SA team with realistic roles:

| Name | Email | Role | Department |
|------|-------|------|------------|
| Thabo Mokoena | thabo.mokoena@mondelez.com | Admin | IT |
| Sarah van der Merwe | sarah.vandermerwe@mondelez.com | Director | Sales |
| Sipho Dlamini | sipho.dlamini@mondelez.com | KAM | Sales (Pick n Pay) |
| Nomvula Zulu | nomvula.zulu@mondelez.com | KAM | Sales (Shoprite) |
| Michael Johnson | michael.johnson@mondelez.com | Manager | Trade Marketing |
| Lerato Nkosi | lerato.nkosi@mondelez.com | Analyst | Analytics |

**Password for all users:** `Mondelez@2024`

### 2. **Products (8 products)**

Authentic Mondelez portfolio for South Africa:

| Product | SKU | Brand | Category | Price (ZAR) |
|---------|-----|-------|----------|-------------|
| Cadbury Dairy Milk 150g | CDM-150 | Cadbury | Chocolate | R24.99 |
| Cadbury Dairy Milk 80g | CDM-80 | Cadbury | Chocolate | R14.99 |
| Oreo Original 133g | OREO-133 | Oreo | Biscuits | R19.99 |
| Cadbury Lunch Bar 48g | LB-48 | Cadbury | Countlines | R9.99 |
| Cadbury PS 52g | PS-52 | Cadbury | Countlines | R10.99 |
| Bakers Romany Creams 200g | BRC-200 | Bakers | Biscuits | R22.99 |
| Stimorol Original 14g | STIM-14 | Stimorol | Gum | R7.99 |
| Cadbury Top Deck 80g | TD-80 | Cadbury | Chocolate | R15.99 |

### 3. **Customers (6 retailers)**

Major South African retail chains:

| Retailer | Code | Type | Tier | Credit Limit |
|----------|------|------|------|--------------|
| Pick n Pay | PNP | Modern Trade | A | R10,000,000 |
| Shoprite | SHP | Modern Trade | A | R12,000,000 |
| Checkers | CHK | Modern Trade | A | R8,000,000 |
| Woolworths | WW | Modern Trade | A | R6,000,000 |
| Spar | SPAR | Modern Trade | B | R5,000,000 |
| Makro | MAK | Wholesale | A | R7,000,000 |

### 4. **Sales History (240 records)**

- **12 months** of historical data
- **Top 5 products** × **Top 4 customers**
- **Seasonal patterns** included
- **Realistic volumes** and revenue
- **Monthly trends** from Oct 2023 to Oct 2024

### 5. **Budget (1 annual budget)**

**Mondelez SA 2024 Annual Budget:**
- Total Sales Target: **R150,000,000**
- Trade Spend Budget: **R18,000,000** (12%)
- Net Sales: **R132,000,000**
- Gross Margin: **R45,000,000** (30%)
- Growth Target: **8.5%**

Quarterly breakdown included with detailed spend allocation.

### 6. **Promotions (3 promotions)**

**Active and Historical Promotions:**

1. **Pick n Pay Easter Chocolate Promotion** (COMPLETED)
   - Period: March 15 - April 5, 2024
   - Type: 20% discount
   - Products: Cadbury Dairy Milk range
   - Investment: R250,000
   - ROI: 2.1x (35% volume lift)

2. **Shoprite Back to School Snack Attack** (ACTIVE)
   - Period: October 15 - November 15, 2024
   - Type: 15% discount on 3+ units
   - Products: Oreo, Lunch Bar
   - Investment: R180,000
   - Status: Currently running

3. **Checkers Summer Treats** (SCHEDULED)
   - Period: December 1-31, 2024
   - Type: Buy 3 Get 1 Free
   - Products: Top Deck
   - Investment: R120,000
   - Status: Upcoming

### 7. **Campaigns (2 campaigns)**

**Marketing Campaigns:**

1. **Cadbury Chocolate Love Campaign** (ACTIVE)
   - National brand awareness
   - Budget: R2,500,000
   - Channels: Social Media, TV, In-store, Digital
   - Reach: 5M people, 15M impressions
   - Period: Oct 1 - Dec 31, 2024

2. **Oreo Twist Lick Dunk** (ACTIVE)
   - Interactive product campaign
   - Budget: R1,200,000
   - Channels: Social Media, Digital, In-store
   - Reach: 3M people, 9M impressions
   - Period: Sep 1 - Nov 30, 2024

### 8. **Trade Spend (3 records)**

**Trade Investment Records:**
- Q4 Listing Fee - Pick n Pay: R500,000
- Easter Promotion Discount: R180,000
- Marketing Support - Shoprite: R750,000

Total: **R1,430,000** in tracked spend

### 9. **Activity Grid (3 activities)**

**Calendar Activities:**
- Shoprite Promotion Launch (Nov 1, 2024)
- Checkers Summer Campaign Launch (Dec 1, 2024)
- Q4 Performance Review (Nov 15, 2024)

---

## 🚀 Installation & Usage

### Prerequisites

Ensure you have:
- MongoDB running (local or Atlas)
- Node.js installed
- Environment variables configured

### Installation

```bash
# 1. Navigate to backend directory
cd backend

# 2. Ensure .env is configured with MongoDB connection
# MONGODB_URI=mongodb://localhost:27017/tradeai
# or
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tradeai

# 3. Install dependencies (if not already done)
npm install
```

### Running the Seeder

```bash
# Run Mondelez seed script
npm run seed:mondelez
```

### Expected Output

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        🍫 MONDELEZ SOUTH AFRICA SEED DATA 🍫           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

✅ MongoDB Connected

🗑️  Clearing existing Mondelez data...
✅ Cleared existing data

📝 Creating Mondelez SA Users...
✅ Created 6 users

📦 Creating Mondelez Products...
✅ Created 8 products

🏢 Creating South African Retailers...
✅ Created 6 customers

📊 Creating Historical Sales Data...
✅ Created 240 sales history records

💰 Creating Annual Budget...
✅ Created annual budget

🎯 Creating Promotions...
✅ Created 3 promotions

📢 Creating Marketing Campaigns...
✅ Created 2 campaigns

💸 Creating Trade Spend Records...
✅ Created 3 trade spend records

📅 Creating Activity Grid...
✅ Created 3 activities

╔══════════════════════════════════════════════════════════╗
║                                                          ║
║              ✅ SEED DATA COMPLETE! ✅                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

📊 Summary:
   Users:          6
   Products:       8
   Customers:      6
   Sales Records:  240
   Budgets:        1
   Promotions:     3
   Campaigns:      2
   Trade Spend:    3
   Activities:     3

🔐 Login Credentials:
   Email:    thabo.mokoena@mondelez.com
   Password: Mondelez@2024
   Role:     Admin

   Email:    sipho.dlamini@mondelez.com
   Password: Mondelez@2024
   Role:     KAM (Pick n Pay)

✅ MongoDB Disconnected
```

---

## 🔐 Login Credentials

All users share the same password for demo purposes: **`Mondelez@2024`**

### Recommended Test Users:

1. **Admin User** (Full System Access)
   ```
   Email: thabo.mokoena@mondelez.com
   Password: Mondelez@2024
   ```

2. **KAM User** (Account Management)
   ```
   Email: sipho.dlamini@mondelez.com
   Password: Mondelez@2024
   ```

3. **Analyst User** (Analytics & Reporting)
   ```
   Email: lerato.nkosi@mondelez.com
   Password: Mondelez@2024
   ```

---

## 🎨 Use Cases

### 1. Development Testing
- Test all CRUD operations with realistic data
- Validate calculations with real numbers
- Test permissions across different roles
- Debug issues with actual product/customer data

### 2. Demo System
- Showcase system to potential clients
- Present real-world scenarios
- Demonstrate South African market relevance
- Show authentic brand and retailer names

### 3. User Training
- Onboard new users with familiar brands
- Practice workflows with actual products
- Learn system with realistic scenarios
- Train on SA retail landscape

### 4. QA Testing
- Test end-to-end flows
- Validate dashboards with meaningful data
- Test reporting with actual metrics
- Verify forecasting with historical trends

---

## 📈 Data Characteristics

### Realistic Patterns:
- **Seasonal Variations:** Sales fluctuate realistically across months
- **Product Mix:** Mix of high and low volume products
- **Customer Tiers:** Different credit limits and payment terms
- **Price Points:** Actual market prices (2024)
- **ROI Data:** Realistic promotion performance metrics

### South African Context:
- **Currency:** ZAR (South African Rand)
- **Major Retailers:** Actual SA retail chains
- **Local Brands:** Cadbury, Bakers specific to SA market
- **Contact Details:** SA phone numbers and addresses
- **Regional Data:** Gauteng, Western Cape provinces

---

## 🔄 Re-running the Seeder

The seeder is **idempotent** - it will:
1. Delete all existing Mondelez data
2. Create fresh data
3. Safe to run multiple times

```bash
# Run as many times as needed
npm run seed:mondelez
```

**⚠️ Warning:** This will delete ALL Mondelez tenant data including:
- Users
- Products
- Customers
- Sales history
- Budgets
- Promotions
- Campaigns
- Trade spend
- Activities

---

## 🔍 Verifying the Data

### Check in MongoDB:

```javascript
// Connect to your MongoDB
use tradeai

// Verify users
db.users.find({ "email": /mondelez/ }).count()
// Expected: 6

// Verify products
db.products.find({ "brand": { $in: ["Cadbury", "Oreo", "Bakers", "Stimorol"] } }).count()
// Expected: 8

// Verify customers
db.customers.find({ "code": { $in: ["PNP", "SHP", "CHK", "WW", "SPAR", "MAK"] } }).count()
// Expected: 6

// Verify sales history
db.saleshistories.find().count()
// Expected: 240

// Verify promotions
db.promotions.find({ "promotionId": /PROMO-2024/ }).count()
// Expected: 3
```

### Check in Application:

1. Login as: `thabo.mokoena@mondelez.com`
2. Navigate to:
   - Products → Should see 8 Mondelez products
   - Customers → Should see 6 SA retailers
   - Promotions → Should see 3 promotions
   - Dashboard → Should see metrics and charts

---

## 🎯 Testing Scenarios

### Scenario 1: View Dashboard
```
User: thabo.mokoena@mondelez.com
Action: Login → Go to Executive Dashboard
Expected: See sales data, charts with 12 months history
```

### Scenario 2: Create Promotion
```
User: sipho.dlamini@mondelez.com
Action: Login → Promotions → Create New
Expected: Can select from 8 products, 6 customers
```

### Scenario 3: View Sales History
```
User: lerato.nkosi@mondelez.com
Action: Login → Analytics → Sales History
Expected: 240 records spanning 12 months
```

### Scenario 4: Budget Review
```
User: sarah.vandermerwe@mondelez.com
Action: Login → Budgets → View 2024 Budget
Expected: R150M sales, R18M trade spend
```

---

## 🛠️ Customization

### Modify the Seed Data:

Edit `backend/src/seeders/mondelez-sa-seed.js`:

```javascript
// Add more products
const products = [
  ...existingProducts,
  {
    name: 'New Product Name',
    sku: 'NEW-SKU',
    // ... other fields
  }
];

// Add more customers
const customers = [
  ...existingCustomers,
  {
    name: 'New Retailer',
    code: 'NR',
    // ... other fields
  }
];

// Adjust sales volumes
const baseVolume = Math.floor(Math.random() * 2000) + 1000; // Increased
```

### Change Password:

```javascript
const hashedPassword = await bcrypt.hash('YourNewPassword', 10);
```

---

## 📞 Troubleshooting

### Issue: "MongoDB Connection Error"
**Solution:**
1. Verify MongoDB is running
2. Check MONGODB_URI in .env
3. Ensure network connectivity
4. Check MongoDB user permissions

### Issue: "Collection not found"
**Solution:**
- MongoDB will auto-create collections
- Ensure models are properly defined
- Check model imports in seeder

### Issue: "Duplicate key error"
**Solution:**
- Seeder clears data first
- If error persists, manually drop collections:
  ```javascript
  db.users.drop()
  db.products.drop()
  // etc.
  ```

### Issue: "Validation error"
**Solution:**
- Check model schemas
- Ensure all required fields are provided
- Verify data types match schema

---

## 🎉 Benefits

### For Development:
- ✅ No need to manually create test data
- ✅ Consistent data across team
- ✅ Quick reset to known state
- ✅ Realistic scenarios

### For Demo:
- ✅ Professional presentation
- ✅ Recognizable brands
- ✅ South African market relevance
- ✅ Complete data set

### For Testing:
- ✅ Repeatable test conditions
- ✅ Known expected values
- ✅ Edge cases covered
- ✅ Performance testing data

---

## 📊 Data Statistics

- **Total Records:** ~500 database documents
- **Time Period:** 12 months (Oct 2023 - Oct 2024)
- **Data Size:** ~2-3 MB
- **Execution Time:** ~5-10 seconds
- **Coverage:** All major features

---

## 🔒 Security Note

**⚠️ Important:** This seed data is for **development and demo purposes only**.

- Never use in production
- All users have the same password
- Data is fictional (names, numbers realistic but not real)
- No real customer/financial data
- Safe to share within development team

---

## 📝 Changelog

### Version 1.0 (October 27, 2024)
- Initial release
- 6 users, 8 products, 6 customers
- 12 months sales history
- 3 promotions, 2 campaigns
- Complete budget data

---

## 🚀 Next Steps

1. **Run the seeder:** `npm run seed:mondelez`
2. **Login to system:** Use provided credentials
3. **Explore the data:** Navigate through different modules
4. **Test workflows:** Create promotions, view dashboards
5. **Customize if needed:** Modify seeder for your needs

---

## 🤝 Support

For issues or questions:
1. Check this guide first
2. Review seeder code for details
3. Check console output for errors
4. Consult development team

---

**Created:** October 27, 2024  
**Author:** TRADEAI Development Team  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
