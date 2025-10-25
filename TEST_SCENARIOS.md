# 🧪 Complete E2E Test Scenarios
## TRADEAI Transaction-Level TPM Platform

**Total Scenarios:** 50+ test scenarios across all features  
**Coverage:** Frontend → Backend → Database → API

---

## 📋 Test Scenario Index

1. [Authentication & Authorization](#1-authentication--authorization) (7 scenarios)
2. [POS Data Import](#2-pos-data-import) (10 scenarios)
3. [Transaction Management](#3-transaction-management) (8 scenarios)
4. [Baseline Calculation](#4-baseline-calculation) (6 scenarios)
5. [Cannibalization Detection](#5-cannibalization-detection) (7 scenarios)
6. [Forward Buy Detection](#6-forward-buy-detection) (6 scenarios)
7. [Store Hierarchy](#7-store-hierarchy) (5 scenarios)
8. [Analytics Dashboards](#8-analytics-dashboards) (5 scenarios)
9. [Security & Performance](#9-security--performance) (6 scenarios)

---

## 1. Authentication & Authorization

### Scenario 1.1: User Registration
**Flow:** New user registers → Email verification → Login

**Steps:**
1. User navigates to `/register`
2. User fills registration form:
   - Name: "John Doe"
   - Email: "john.doe@example.com"
   - Password: "SecurePass123!@#"
   - Role: "User"
3. User submits form
4. System creates user account
5. System sends verification email
6. User verifies email
7. User can now login

**Expected Results:**
- ✅ User account created in database
- ✅ JWT token generated
- ✅ User redirected to dashboard
- ✅ Welcome message displayed

**API Calls:**
- `POST /api/auth/register`
- `GET /api/auth/verify-email/:token`

**Test File:** `backend/tests/e2e/auth.e2e.test.js`

---

### Scenario 1.2: User Login
**Flow:** User logs in → Receives token → Accesses dashboard

**Steps:**
1. User navigates to `/login`
2. User enters credentials:
   - Email: "john.doe@example.com"
   - Password: "SecurePass123!@#"
3. User clicks "Login"
4. System validates credentials
5. System returns JWT token
6. Frontend stores token in localStorage
7. User redirected to dashboard

**Expected Results:**
- ✅ Token stored in localStorage
- ✅ User redirected to `/dashboard`
- ✅ User name displayed in header
- ✅ Navigation menu accessible

**API Calls:**
- `POST /api/auth/login`

**Test File:** `frontend/cypress/e2e/auth.cy.js`

---

### Scenario 1.3: Invalid Login Attempts
**Flow:** User attempts login with wrong credentials

**Test Cases:**
- ❌ Wrong email → Error: "Invalid credentials"
- ❌ Wrong password → Error: "Invalid credentials"
- ❌ Empty fields → Error: "Email and password required"
- ❌ Malformed email → Error: "Invalid email format"
- ❌ Too many attempts → Error: "Account locked"

**Expected Results:**
- ✅ Clear error messages
- ✅ No token generated
- ✅ User remains on login page
- ✅ Rate limiting after 5 failed attempts

---

### Scenario 1.4: Role-Based Access Control
**Flow:** Test different user roles and permissions

**Test Cases:**
- **Admin:** Can access all features
- **Manager:** Can approve transactions
- **User:** Can create but not approve
- **Guest:** Read-only access

**Expected Results:**
- ✅ Admin sees all menu items
- ✅ Manager sees approve buttons
- ✅ User cannot approve transactions
- ✅ Guest sees view-only interface

---

### Scenario 1.5: Session Management
**Flow:** Test token expiration and refresh

**Steps:**
1. User logs in
2. Token expires after 24 hours
3. User makes API call
4. System returns 401 Unauthorized
5. Frontend redirects to login
6. User logs in again

**Expected Results:**
- ✅ Token expires correctly
- ✅ Refresh token works
- ✅ User redirected to login
- ✅ Previous page remembered

---

### Scenario 1.6: Logout
**Flow:** User logs out → Token cleared

**Steps:**
1. User clicks "Logout" button
2. Frontend clears localStorage
3. Frontend redirects to login
4. API calls fail with 401

**Expected Results:**
- ✅ Token removed from localStorage
- ✅ User redirected to `/login`
- ✅ Protected routes inaccessible
- ✅ Dashboard not reachable

---

### Scenario 1.7: Multi-Tenant Isolation
**Flow:** Verify tenants can only see their own data

**Steps:**
1. Create Tenant A user
2. Create Tenant B user
3. Tenant A creates transaction
4. Tenant B logs in
5. Tenant B tries to view Tenant A's transaction

**Expected Results:**
- ✅ Tenant B cannot see Tenant A's data
- ✅ API returns 403 Forbidden
- ✅ Database queries filtered by tenantId
- ✅ No data leakage

---

## 2. POS Data Import

### Scenario 2.1: Complete POS Import Flow
**Flow:** User uploads CSV → Validates → Confirms → Data imported

**Steps:**
1. User logs in
2. User navigates to "POS Import"
3. User clicks "Upload File"
4. User selects CSV file (100 rows)
5. System parses file
6. System shows preview (first 10 rows)
7. User reviews preview
8. User clicks "Validate"
9. System validates products & customers
10. System shows validation results
11. User clicks "Confirm Import"
12. System imports data in batches
13. Success message appears
14. Data visible in analytics

**Sample CSV:**
```csv
date,storeCode,productSKU,quantity,revenue,cost
2025-10-01,ST001,COLA-PRE-2L,150,2250,1350
2025-10-01,ST001,COLA-PRE-1.5L,100,1400,840
2025-10-02,ST001,COLA-PRE-2L,165,2475,1485
```

**Expected Results:**
- ✅ 100 rows parsed
- ✅ All products validated
- ✅ All customers validated
- ✅ Data inserted into SalesHistory
- ✅ Import history recorded
- ✅ Success message: "100 records imported"

**API Calls:**
1. `POST /api/pos-import/upload` (file upload)
2. `GET /api/pos-import/preview/:uploadId`
3. `POST /api/pos-import/validate/:uploadId`
4. `POST /api/pos-import/confirm/:uploadId`
5. `GET /api/pos-import/history`

**Database Changes:**
- ✅ 100 new documents in `SalesHistory` collection
- ✅ 1 new document in `ImportHistory` collection

**Test Files:**
- `frontend/cypress/e2e/pos-import.cy.js`
- `backend/tests/e2e/pos-import.e2e.test.js`

---

### Scenario 2.2: Upload Excel File
**Flow:** User uploads .xlsx file

**Steps:**
1. User selects .xlsx file
2. System parses Excel
3. System converts to JSON
4. Rest of flow same as CSV

**Expected Results:**
- ✅ Excel parsed correctly
- ✅ Multiple sheets supported
- ✅ Date formatting handled

---

### Scenario 2.3: Invalid File Format
**Flow:** User uploads unsupported file

**Test Cases:**
- ❌ Upload .txt file → Error: "Invalid file format"
- ❌ Upload .pdf → Error: "Only CSV/Excel supported"
- ❌ Upload .jpg → Error: "Invalid file"

**Expected Results:**
- ✅ Clear error message
- ✅ File rejected
- ✅ Upload dialog remains open

---

### Scenario 2.4: Missing Required Fields
**Flow:** CSV missing productSKU column

**Steps:**
1. Upload CSV without "productSKU" column
2. System detects missing field
3. Error displayed

**Expected Results:**
- ✅ Error: "Missing required field: productSKU"
- ✅ Helpful message about required fields
- ✅ Upload cancelled

---

### Scenario 2.5: Invalid Data Values
**Flow:** CSV contains negative quantities

**Test Cases:**
- ❌ Negative quantity → Error: "Quantity must be positive"
- ❌ Invalid date → Error: "Invalid date format"
- ❌ Missing SKU → Error: "Product not found"
- ❌ Zero revenue → Warning: "Revenue is zero"

**Expected Results:**
- ✅ Each error listed with row number
- ✅ User can fix and re-upload
- ✅ Partial import not allowed

---

### Scenario 2.6: Duplicate Detection
**Flow:** Import same data twice

**Steps:**
1. Import 100 rows successfully
2. Try to import same 100 rows again
3. System detects duplicates

**Expected Results:**
- ✅ Warning: "50 duplicate records found"
- ✅ Option to skip duplicates
- ✅ Option to overwrite
- ✅ Option to cancel

---

### Scenario 2.7: Large File Import
**Flow:** Import 10,000 rows

**Steps:**
1. Upload CSV with 10,000 rows
2. System processes in batches (1000/batch)
3. Progress bar shows completion
4. Import completes successfully

**Expected Results:**
- ✅ All 10,000 rows imported
- ✅ Progress bar accurate
- ✅ Import time < 60 seconds
- ✅ No memory issues

**Performance Target:**
- Import rate: 200+ rows/second
- Memory usage: < 500MB

---

### Scenario 2.8: Product Validation
**Flow:** Validate product SKUs exist

**Steps:**
1. Upload CSV with 5 valid SKUs, 2 invalid
2. System queries Product collection
3. System finds 5 matches, 2 mismatches
4. Validation report shows errors

**Expected Results:**
- ✅ Valid products: 5
- ✅ Invalid products: 2
- ✅ Error rows highlighted
- ✅ Suggested matches shown

---

### Scenario 2.9: Customer Validation
**Flow:** Validate customer codes exist

**Steps:**
1. Upload CSV with store codes
2. System validates against Customer collection
3. Unknown stores flagged

**Expected Results:**
- ✅ Valid customers identified
- ✅ Invalid customers listed
- ✅ Option to auto-create customers
- ✅ Option to map to existing

---

### Scenario 2.10: Import History
**Flow:** View past imports

**Steps:**
1. User navigates to "Import History"
2. System shows list of past imports
3. User clicks on import
4. Details displayed

**Expected Results:**
- ✅ List of all imports
- ✅ Date, user, row count
- ✅ Status (success/failed)
- ✅ Download original file
- ✅ View import errors

---

## 3. Transaction Management

### Scenario 3.1: Create Transaction
**Flow:** User creates new accrual transaction

**Steps:**
1. User navigates to "Transactions"
2. User clicks "Create Transaction"
3. User fills form:
   - Type: "Accrual"
   - Amount: $50,000
   - Customer: "Walmart"
   - Product: "Premium Cola 2L"
   - Promotion: "Q4 Volume Rebate"
   - Description: "Volume rebate for Q4 sales"
4. User clicks "Save as Draft"
5. Transaction created with status "draft"

**Expected Results:**
- ✅ Transaction created in database
- ✅ Status = "draft"
- ✅ Transaction ID generated
- ✅ Success message displayed
- ✅ Transaction appears in list

**API Call:**
```javascript
POST /api/transactions
{
  "type": "accrual",
  "amount": 50000,
  "customerId": "64f...",
  "productId": "64f...",
  "promotionId": "64f...",
  "description": "Volume rebate for Q4 sales"
}
```

**Database:**
```javascript
{
  _id: ObjectId("..."),
  type: "accrual",
  amount: 50000,
  status: "draft",
  createdBy: ObjectId("..."),
  tenantId: ObjectId("..."),
  createdAt: ISODate("2025-10-25...")
}
```

---

### Scenario 3.2: Approve Transaction
**Flow:** Manager approves transaction

**Steps:**
1. Manager logs in
2. Manager navigates to "Pending Approvals"
3. Manager sees transaction (status: "pending")
4. Manager reviews details
5. Manager clicks "Approve"
6. Transaction status → "approved"

**Expected Results:**
- ✅ Status changes to "approved"
- ✅ approvedBy field set
- ✅ approvedAt timestamp set
- ✅ Notification sent to creator
- ✅ Transaction ready for settlement

**API Call:**
```javascript
POST /api/transactions/:id/approve
```

---

### Scenario 3.3: Reject Transaction
**Flow:** Manager rejects transaction

**Steps:**
1. Manager clicks "Reject"
2. Manager enters reason
3. Status → "rejected"

**Expected Results:**
- ✅ Status = "rejected"
- ✅ Rejection reason saved
- ✅ Notification sent
- ✅ Transaction cannot be settled

---

### Scenario 3.4: Settle Transaction
**Flow:** Finance settles approved transaction

**Steps:**
1. Finance user logs in
2. Finance navigates to "Approved Transactions"
3. Finance selects transaction
4. Finance clicks "Settle"
5. Settlement details entered
6. Status → "settled"

**Expected Results:**
- ✅ Status = "settled"
- ✅ Settlement date recorded
- ✅ Payment reference saved
- ✅ Audit log updated

---

### Scenario 3.5: Edit Draft Transaction
**Flow:** User edits transaction before submission

**Steps:**
1. User opens draft transaction
2. User changes amount from $50K to $55K
3. User saves changes
4. Transaction updated

**Expected Results:**
- ✅ Amount updated to $55,000
- ✅ Edit history recorded
- ✅ Status remains "draft"

---

### Scenario 3.6: Delete Transaction
**Flow:** User deletes draft transaction

**Steps:**
1. User selects draft transaction
2. User clicks "Delete"
3. Confirmation dialog appears
4. User confirms
5. Transaction deleted

**Expected Results:**
- ✅ Transaction removed from database
- ✅ Confirmation message shown
- ✅ Only drafts can be deleted
- ✅ Approved transactions cannot be deleted

---

### Scenario 3.7: Search Transactions
**Flow:** User searches for specific transactions

**Test Cases:**
- Search by customer name
- Search by amount range
- Search by date range
- Search by status
- Search by product

**Expected Results:**
- ✅ Relevant results returned
- ✅ Filters work correctly
- ✅ Results paginated
- ✅ Export to Excel available

---

### Scenario 3.8: Transaction Workflow
**Flow:** Complete lifecycle

**Steps:**
1. User creates → Status: "draft"
2. User submits → Status: "pending"
3. Manager approves → Status: "approved"
4. Finance settles → Status: "settled"

**Expected Results:**
- ✅ Each status transition valid
- ✅ Audit trail complete
- ✅ Notifications sent at each step
- ✅ Cannot skip steps

---

## 4. Baseline Calculation

### Scenario 4.1: Calculate Pre-Period Baseline
**Flow:** Calculate baseline using pre-promotion period

**Steps:**
1. User navigates to "Analytics"
2. User selects "Calculate Baseline"
3. User inputs:
   - Product: "Premium Cola 2L"
   - Customer: "Walmart"
   - Promotion Date: Oct 1 - Oct 14, 2025
   - Method: "Pre-Period"
4. User clicks "Calculate"
5. System fetches sales data from Sep 1 - Sep 30
6. System calculates average daily sales
7. System projects baseline for Oct 1-14
8. Results displayed

**Sample Data:**
```
Pre-period (Sep 1-30): Average 120 units/day
Promotion period (Oct 1-14): Actual 215 units/day
Baseline projection: 120 units/day
Incremental: 95 units/day (215 - 120)
Lift: 79.2%
```

**Expected Results:**
- ✅ Baseline chart displayed
- ✅ Actual vs. Baseline comparison
- ✅ Incremental volume calculated
- ✅ Lift percentage shown
- ✅ Revenue impact calculated

**API Call:**
```javascript
POST /api/baseline/calculate
{
  "productId": "64f...",
  "customerId": "64f...",
  "promotionStartDate": "2025-10-01",
  "promotionEndDate": "2025-10-14",
  "method": "pre_period"
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "method": "pre_period",
    "baseline": [
      {
        "date": "2025-10-01",
        "baselineQuantity": 120,
        "actualQuantity": 215,
        "incrementalQuantity": 95,
        "lift": 79.2
      }
      // ... more days
    ],
    "summary": {
      "totalBaseline": 1680,
      "totalActual": 3010,
      "totalIncremental": 1330,
      "averageLift": 79.2,
      "totalIncrementalRevenue": 199500
    }
  }
}
```

---

### Scenario 4.2: Calculate Control Store Baseline
**Flow:** Use control store for baseline

**Steps:**
1. User selects "Control Store" method
2. User selects control store (non-promoted)
3. System compares promoted vs. control
4. Results show difference

**Expected Results:**
- ✅ Control store data fetched
- ✅ Comparison chart shown
- ✅ True incremental calculated
- ✅ Market effects removed

---

### Scenario 4.3: Calculate Moving Average Baseline
**Flow:** 4-week moving average

**Steps:**
1. User selects "Moving Average"
2. System calculates 4-week average
3. Baseline smoothed
4. Results displayed

**Expected Results:**
- ✅ Smooth baseline curve
- ✅ Seasonality handled
- ✅ Outliers removed

---

### Scenario 4.4: Calculate Exponential Smoothing Baseline
**Flow:** Time-series forecasting

**Steps:**
1. User selects "Exponential Smoothing"
2. System applies time-series model
3. Forecast generated
4. Results displayed

**Expected Results:**
- ✅ Trend captured
- ✅ Seasonality included
- ✅ Accurate forecast

---

### Scenario 4.5: Auto-Select Best Method
**Flow:** AI chooses best baseline method

**Steps:**
1. User selects "Auto"
2. System analyzes data patterns
3. System scores each method
4. Best method selected automatically

**Expected Results:**
- ✅ Best method chosen
- ✅ Reasoning explained
- ✅ Confidence score shown

---

### Scenario 4.6: Export Baseline Results
**Flow:** Download baseline calculation

**Steps:**
1. User clicks "Export"
2. System generates Excel file
3. File downloaded

**Expected Results:**
- ✅ Excel file with all data
- ✅ Charts included
- ✅ Summary statistics
- ✅ Methodology explained

---

## 5. Cannibalization Detection

### Scenario 5.1: Detect Product Cannibalization
**Flow:** Analyze if promotion cannibalized other products

**Steps:**
1. User navigates to "Cannibalization Analysis"
2. User selects promotion
3. User clicks "Analyze"
4. System:
   - Identifies related products (same category)
   - Compares sales during promotion vs. baseline
   - Detects volume decline in related products
   - Calculates cannibalization rate
5. Results displayed

**Sample Scenario:**
```
Promoted Product: Premium Cola 2L
Promotion: 25% off, Oct 1-14

Related Products Analysis:
- Premium Cola 1.5L: -280 units (-21%)
- Premium Cola 1L: -120 units (-12%)
- Regular Cola 2L: -80 units (-8%)

Total Cannibalized: 480 units
Gross Incremental: 1330 units
Net Incremental: 850 units (1330 - 480)
Cannibalization Rate: 36%
```

**Expected Results:**
- ✅ Cannibalized products identified
- ✅ Volume impact quantified
- ✅ Net incremental calculated
- ✅ Severity classification (none/low/moderate/high)
- ✅ Recommendations provided

**API Call:**
```javascript
POST /api/cannibalization/analyze-promotion
{
  "promotionId": "64f...",
  "productId": "64f...",
  "customerId": "64f...",
  "promotionStartDate": "2025-10-01",
  "promotionEndDate": "2025-10-14"
}
```

---

### Scenario 5.2: Substitution Matrix
**Flow:** See which products substitute for each other

**Steps:**
1. User clicks "Substitution Matrix"
2. System shows product relationships
3. Substitution rates displayed

**Expected Results:**
- ✅ Matrix showing all products
- ✅ Substitution percentages
- ✅ Heatmap visualization
- ✅ Strongest relationships highlighted

---

### Scenario 5.3: Category-Level Cannibalization
**Flow:** Analyze entire category

**Steps:**
1. User selects "Category Analysis"
2. User chooses "Soft Drinks"
3. System analyzes all products
4. Net category impact shown

**Expected Results:**
- ✅ Total category sales
- ✅ Shift within category
- ✅ Net new category sales
- ✅ Category growth rate

---

### Scenario 5.4: Net Incremental Calculation
**Flow:** Calculate true net impact

**Formula:**
```
Net Incremental = Gross Incremental - Cannibalized Volume

Example:
Gross Incremental: 1330 units
Cannibalized: 480 units
Net Incremental: 850 units (64% of gross)
```

**Expected Results:**
- ✅ Correct calculation
- ✅ Visual breakdown
- ✅ Revenue impact
- ✅ Margin impact

---

### Scenario 5.5: Predict Cannibalization Risk
**Flow:** Predict risk for planned promotion

**Steps:**
1. User creates new promotion
2. User clicks "Predict Risk"
3. System analyzes historical patterns
4. Risk score generated

**Expected Results:**
- ✅ Risk level (low/medium/high)
- ✅ Expected cannibalization %
- ✅ Affected products listed
- ✅ Recommendations provided

---

### Scenario 5.6: Zero Cannibalization
**Flow:** Promotion with no cannibalization

**Steps:**
1. Promote unique product
2. Run analysis
3. No cannibalization detected

**Expected Results:**
- ✅ "No cannibalization detected"
- ✅ Gross = Net incremental
- ✅ Green indicator
- ✅ "All lift is incremental"

---

### Scenario 5.7: Severe Cannibalization
**Flow:** Promotion with high cannibalization

**Sample:**
```
Gross Incremental: 1000 units
Cannibalized: 900 units (90%)
Net Incremental: 100 units (10%)

Severity: SEVERE
Recommendation: Reconsider this promotion
```

**Expected Results:**
- ✅ Red warning indicator
- ✅ Detailed breakdown
- ✅ Alternative suggestions
- ✅ ROI calculation shows loss

---

## 6. Forward Buy Detection

### Scenario 6.1: Detect Forward Buying
**Flow:** Analyze post-promotion period for pantry loading

**Steps:**
1. User selects completed promotion
2. User clicks "Analyze Forward Buy"
3. System analyzes 4 weeks post-promotion
4. System compares to baseline
5. Dip detected

**Sample Scenario:**
```
Promotion: Oct 1-14, 2025
Post-Promotion: Oct 15 - Nov 11 (4 weeks)

Analysis:
Week 1 post: 80 units/day (vs. 120 baseline) = -33%
Week 2 post: 90 units/day (vs. 120 baseline) = -25%
Week 3 post: 110 units/day (vs. 120 baseline) = -8%
Week 4 post: 120 units/day (vs. 120 baseline) = 0%

Total Dip: 420 units
Dip Rate: 25%
Recovery: Week 4
Severity: MODERATE
```

**Expected Results:**
- ✅ Dip percentage calculated
- ✅ Recovery timeline shown
- ✅ Severity classified
- ✅ Chart visualization
- ✅ Recommendations provided

**API Call:**
```javascript
POST /api/forward-buy/detect
{
  "promotionId": "64f...",
  "productId": "64f...",
  "customerId": "64f...",
  "promotionStartDate": "2025-10-01",
  "promotionEndDate": "2025-10-14",
  "postPromoPeriodWeeks": 4
}
```

---

### Scenario 6.2: Calculate Net Impact
**Flow:** Calculate true net after forward buy

**Formula:**
```
Net Impact = Gross Incremental - Forward Buy Volume

Example:
Gross Incremental: 1330 units
Forward Buy: 420 units (32%)
Net Impact: 910 units (68% of gross)

Revenue:
Gross Revenue: $199,500
Forward Buy Lost: $63,000
Net Revenue: $136,500
```

**Expected Results:**
- ✅ Net volume calculated
- ✅ Net revenue calculated
- ✅ Margin impact shown
- ✅ True ROI calculated

---

### Scenario 6.3: Predict Forward Buy Risk
**Flow:** Predict risk for planned promotion

**Steps:**
1. User creates new promotion
2. User clicks "Predict Forward Buy Risk"
3. System analyzes:
   - Historical forward buy patterns
   - Discount depth
   - Product characteristics
   - Customer behavior
4. Risk score generated

**Expected Results:**
- ✅ Risk level (low/medium/high)
- ✅ Expected dip percentage
- ✅ Historical examples shown
- ✅ Mitigation strategies suggested

---

### Scenario 6.4: No Forward Buying
**Flow:** Promotion with quick recovery

**Sample:**
```
Post-Promotion Analysis:
Week 1: 115 units/day (vs. 120 baseline) = -4%
Week 2: 120 units/day (vs. 120 baseline) = 0%

Verdict: No significant forward buying detected
Recovery: Week 2
```

**Expected Results:**
- ✅ "No forward buying detected"
- ✅ Green indicator
- ✅ Quick recovery noted

---

### Scenario 6.5: Severe Forward Buying
**Flow:** Heavy pantry loading

**Sample:**
```
Post-Promotion Analysis:
Week 1-2: 50 units/day (vs. 120 baseline) = -58%
Week 3-4: 80 units/day (vs. 120 baseline) = -33%
Week 5-6: 100 units/day (vs. 120 baseline) = -17%
Week 7-8: 120 units/day (vs. 120 baseline) = 0%

Total Dip: 840 units (63% of gross incremental)
Recovery: Week 8
Severity: SEVERE
```

**Expected Results:**
- ✅ Red warning indicator
- ✅ Long recovery period noted
- ✅ "Avoid similar promotions"
- ✅ Detailed impact analysis

---

### Scenario 6.6: Category-Level Forward Buy
**Flow:** Analyze forward buying across category

**Steps:**
1. User selects "Category Analysis"
2. System analyzes all products
3. Category-level patterns shown

**Expected Results:**
- ✅ Total category dip
- ✅ Products most affected
- ✅ Category recovery time

---

## 7. Store Hierarchy

### Scenario 7.1: View Region Performance
**Flow:** Rollup analytics at region level

**Steps:**
1. User navigates to "Store Analytics"
2. User selects "North Region"
3. System aggregates:
   - 50 stores in region
   - Total sales: $5.2M
   - Total transactions: 125,000
   - Top products
   - Best performing districts

**Expected Results:**
- ✅ Region-level metrics
- ✅ District comparison
- ✅ Store rankings
- ✅ Trend charts

---

### Scenario 7.2: Drill Down to District
**Flow:** View district performance

**Steps:**
1. From region view, user clicks district
2. System shows district details:
   - 10 stores in district
   - Total sales: $1.1M
   - Store comparisons

**Expected Results:**
- ✅ District metrics
- ✅ Store-by-store breakdown
- ✅ Performance rankings

---

### Scenario 7.3: View Store Performance
**Flow:** Individual store metrics

**Steps:**
1. User selects specific store
2. System shows:
   - Store details
   - Daily sales trends
   - Category breakdown
   - Promotion performance
   - Comparison vs. district avg
   - Comparison vs. region avg

**Expected Results:**
- ✅ Store-level detail
- ✅ Comparison context
- ✅ Actionable insights

---

### Scenario 7.4: Compare Stores
**Flow:** Side-by-side comparison

**Steps:**
1. User selects 3 stores
2. User clicks "Compare"
3. System shows side-by-side metrics

**Expected Results:**
- ✅ Key metrics compared
- ✅ Visual charts
- ✅ Best practices identified

---

### Scenario 7.5: Promotion Performance by Geography
**Flow:** See how promotion performed by location

**Steps:**
1. User selects promotion
2. User clicks "Geographic Performance"
3. Map visualization shows results by region/district/store

**Expected Results:**
- ✅ Heat map visualization
- ✅ Top performing locations
- ✅ Underperforming locations
- ✅ Insights by geography

---

## 8. Analytics Dashboards

### Scenario 8.1: Main Dashboard
**Flow:** Overview of key metrics

**Widgets:**
- Total transactions this month
- Total trade spend
- Active promotions
- Pending approvals
- Recent POS imports
- Top products
- Top customers

**Expected Results:**
- ✅ All widgets load
- ✅ Real-time data
- ✅ Quick actions available
- ✅ Responsive design

---

### Scenario 8.2: Promotion Performance Dashboard
**Flow:** Deep dive into promotion results

**Metrics:**
- Gross incremental volume
- Cannibalization impact
- Forward buy impact
- Net incremental volume
- ROI
- Lift percentage
- Revenue impact

**Expected Results:**
- ✅ Comprehensive metrics
- ✅ Visual charts
- ✅ Export capability

---

### Scenario 8.3: Net Impact Dashboard
**Flow:** See true promotion impact

**Calculation:**
```
1. Baseline: 1680 units
2. Actual: 3010 units
3. Gross Incremental: 1330 units

4. Cannibalization: -480 units
5. After Cann: 850 units

6. Forward Buy: -420 units
7. Net Incremental: 430 units

Net = Gross - Cann - Forward Buy
Net = 1330 - 480 - 420 = 430 units (32% of gross)
```

**Expected Results:**
- ✅ Waterfall chart showing breakdown
- ✅ Each component explained
- ✅ Net impact highlighted
- ✅ True ROI calculated

---

### Scenario 8.4: Trend Analysis
**Flow:** Historical trends

**Steps:**
1. User selects date range (12 months)
2. System shows trends:
   - Sales trends
   - Promotion frequency
   - ROI trends
   - Cannibalization trends
   - Forward buy trends

**Expected Results:**
- ✅ Line charts for trends
- ✅ Year-over-year comparison
- ✅ Insights highlighted

---

### Scenario 8.5: Custom Reports
**Flow:** Build custom report

**Steps:**
1. User clicks "Create Report"
2. User selects:
   - Metrics (sales, lift, ROI)
   - Dimensions (product, customer, time)
   - Filters (date range, category)
3. Report generated

**Expected Results:**
- ✅ Custom report created
- ✅ Can save report template
- ✅ Can schedule email
- ✅ Export to Excel/PDF

---

## 9. Security & Performance

### Scenario 9.1: SQL Injection Prevention
**Flow:** Attempt SQL injection

**Test Cases:**
- Input: `admin' OR '1'='1`
- Input: `'; DROP TABLE users;--`

**Expected Results:**
- ✅ Input sanitized
- ✅ Query blocked
- ✅ Error logged
- ✅ No damage done

---

### Scenario 9.2: XSS Prevention
**Flow:** Attempt cross-site scripting

**Test Cases:**
- Input: `<script>alert('XSS')</script>`
- Input: `<img src=x onerror=alert('XSS')>`

**Expected Results:**
- ✅ Script tags escaped
- ✅ No execution
- ✅ Safe display

---

### Scenario 9.3: Rate Limiting
**Flow:** Prevent API abuse

**Test:**
1. Make 100 requests in 1 minute
2. System blocks after 50 requests

**Expected Results:**
- ✅ Rate limit enforced
- ✅ 429 Too Many Requests
- ✅ Retry-After header
- ✅ Normal access resumes after cooldown

---

### Scenario 9.4: Performance - Large Dataset
**Flow:** Handle 1M sales records

**Test:**
1. Import 1M POS records
2. Run baseline calculation
3. Measure response time

**Performance Targets:**
- ✅ Import time: < 5 minutes
- ✅ Baseline calc: < 2 seconds
- ✅ Dashboard load: < 1 second
- ✅ API response: < 500ms

---

### Scenario 9.5: Concurrent Users
**Flow:** 100 simultaneous users

**Test:**
1. Simulate 100 users
2. Each performs typical tasks
3. Measure system performance

**Performance Targets:**
- ✅ No timeouts
- ✅ Response time < 2s
- ✅ No errors
- ✅ Database handles load

---

### Scenario 9.6: Data Encryption
**Flow:** Verify data security

**Tests:**
- ✅ Passwords hashed (bcrypt)
- ✅ JWT tokens signed
- ✅ HTTPS enforced
- ✅ Sensitive data encrypted at rest
- ✅ No plain text passwords in logs

---

## 📊 Test Coverage Summary

| Category | Scenarios | Status |
|----------|-----------|--------|
| **Authentication** | 7 | ✅ Defined |
| **POS Import** | 10 | ✅ Defined |
| **Transactions** | 8 | ✅ Defined |
| **Baseline** | 6 | ✅ Defined |
| **Cannibalization** | 7 | ✅ Defined |
| **Forward Buy** | 6 | ✅ Defined |
| **Store Hierarchy** | 5 | ✅ Defined |
| **Analytics** | 5 | ✅ Defined |
| **Security** | 6 | ✅ Defined |
| **TOTAL** | **60** | **✅ Complete** |

---

## 🚀 Running the Tests

### All Tests
```bash
./scripts/test-all.sh
```

### Backend Only
```bash
cd backend
npm test
```

### Frontend Only
```bash
cd frontend
npx cypress run
```

### Specific Scenario
```bash
# Backend
cd backend
npm test -- pos-import.e2e.test.js

# Frontend
cd frontend
npx cypress run --spec "cypress/e2e/pos-import.cy.js"
```

---

## 📝 Test Results

After running tests, results will be in:
- Backend: `backend/test-results/`
- Frontend: `frontend/cypress/screenshots/` and `frontend/cypress/videos/`
- Coverage: `backend/coverage/index.html`

---

**Last Updated:** 2025-10-25  
**Status:** Ready for Implementation  
**Total Scenarios:** 60 comprehensive E2E test scenarios
