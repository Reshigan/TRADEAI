# TRADEAI - FRONTEND UAT TESTING GUIDE

**Version:** 1.0  
**Last Updated:** October 3, 2025  
**Purpose:** Manual User Acceptance Testing for Frontend Application  

---

## OVERVIEW

This guide provides comprehensive manual testing procedures for the TradeAI frontend application. The backend has been fully tested and verified. This guide focuses on UI/UX, user workflows, and frontend-backend integration.

**Backend Status:** ✅ Fully tested and verified (23/23 tests passing)  
**Frontend Status:** ⚠️ Pending UAT

---

## PREREQUISITES

### Before Starting Frontend UAT

1. **Backend Running**
   ```bash
   # Verify backend is running
   curl http://localhost:5002/api/health
   # Should return: {"status":"ok",...}
   ```

2. **Frontend Running**
   ```bash
   # Start frontend application
   cd frontend
   npm start
   # Should be accessible at http://localhost:3000
   ```

3. **Test Data Available**
   - Backend seeded with test data
   - Admin user credentials available
   - Multiple tenants configured
   - Sample customers and products available

4. **Test Environment**
   - Modern web browser (Chrome, Firefox, Safari, Edge)
   - Browser console open for debugging
   - Network tab ready for monitoring
   - Responsive design testing tools available

---

## TEST EXECUTION TRACKING

Use this table to track test execution:

| Test ID | Test Name | Status | Tester | Date | Notes |
|---------|-----------|--------|--------|------|-------|
| FE-01 | User Registration | ⬜ | | | |
| FE-02 | User Login | ⬜ | | | |
| FE-03 | Password Reset | ⬜ | | | |
| FE-04 | Dashboard Overview | ⬜ | | | |
| FE-05 | Navigation Menu | ⬜ | | | |
| FE-06 | User Profile | ⬜ | | | |
| FE-07 | User Management (Admin) | ⬜ | | | |
| FE-08 | Customer List | ⬜ | | | |
| FE-09 | Customer Creation | ⬜ | | | |
| FE-10 | Customer Edit | ⬜ | | | |
| FE-11 | Customer Search/Filter | ⬜ | | | |
| FE-12 | Product Management | ⬜ | | | |
| FE-13 | Promotion Management | ⬜ | | | |
| FE-14 | Sales Entry | ⬜ | | | |
| FE-15 | Reports Generation | ⬜ | | | |
| FE-16 | Budget Management | ⬜ | | | |
| FE-17 | Form Validation | ⬜ | | | |
| FE-18 | Error Handling | ⬜ | | | |
| FE-19 | Loading States | ⬜ | | | |
| FE-20 | Responsive Design | ⬜ | | | |
| FE-21 | Browser Compatibility | ⬜ | | | |
| FE-22 | Performance | ⬜ | | | |
| FE-23 | Accessibility | ⬜ | | | |

**Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed | ⚠️ Partial

---

## DETAILED TEST SCENARIOS

### 1. AUTHENTICATION & AUTHORIZATION TESTS

#### FE-01: User Registration
**Objective:** Verify user can register for a new account

**Prerequisites:** None

**Steps:**
1. Navigate to registration page
2. Fill in all required fields:
   - Email: `testuser@example.com`
   - Password: `TestPass123!`
   - Confirm Password: `TestPass123!`
   - Name: `Test User`
   - Company: `Test Company`
3. Click "Register" button

**Expected Results:**
- ✓ Form validation works (errors shown for invalid input)
- ✓ Password strength indicator appears
- ✓ Success message appears after registration
- ✓ User redirected to login or dashboard
- ✓ No console errors

**Test Data:**
```
Valid Email: testuser1@example.com
Strong Password: TestPass123!@#
Weak Password: test (should be rejected)
Invalid Email: notanemail (should be rejected)
```

---

#### FE-02: User Login
**Objective:** Verify user can log in successfully

**Prerequisites:** User account exists (from FE-01 or test data)

**Steps:**
1. Navigate to login page
2. Enter credentials:
   - Email: `admin@acme.com`
   - Password: `Admin123!@#`
3. Click "Login" button

**Expected Results:**
- ✓ Login successful
- ✓ JWT token stored (check localStorage/sessionStorage)
- ✓ User redirected to dashboard
- ✓ User's name/avatar appears in header
- ✓ Appropriate menu items visible based on role
- ✓ No console errors

**Test Invalid Login:**
1. Try with wrong password → Should show error
2. Try with non-existent email → Should show error
3. Try with empty fields → Should show validation errors

---

#### FE-03: Password Reset
**Objective:** Verify password reset workflow

**Prerequisites:** User account exists

**Steps:**
1. Click "Forgot Password" on login page
2. Enter email address
3. Submit form
4. (If email is configured) Check for reset email
5. Follow reset link (if available)
6. Enter new password
7. Submit

**Expected Results:**
- ✓ Form validates email format
- ✓ Success message shown
- ✓ Email sent (if email service configured)
- ✓ Reset link works (if implemented)
- ✓ Password updated successfully
- ✓ Can login with new password

---

### 2. NAVIGATION & LAYOUT TESTS

#### FE-04: Dashboard Overview
**Objective:** Verify dashboard displays correctly

**Prerequisites:** User logged in

**Steps:**
1. Login as admin user
2. View dashboard page

**Expected Results:**
- ✓ Dashboard loads within 2 seconds
- ✓ All widgets/cards display correctly
- ✓ Summary statistics show (if available):
  - Total customers
  - Total sales
  - Active promotions
  - Budget utilization
- ✓ Charts/graphs render (if available)
- ✓ Data is current and accurate
- ✓ No layout issues
- ✓ No console errors

**Visual Checks:**
- Layout is clean and organized
- Colors and fonts consistent
- Icons display correctly
- Spacing appropriate

---

#### FE-05: Navigation Menu
**Objective:** Verify navigation works correctly

**Prerequisites:** User logged in

**Steps:**
1. Test each menu item:
   - Dashboard
   - Users (if admin)
   - Customers
   - Products
   - Promotions
   - Sales
   - Reports
   - Budget
   - Settings
2. Click each menu item
3. Verify page loads

**Expected Results:**
- ✓ All menu items clickable
- ✓ Active menu item highlighted
- ✓ Pages load correctly
- ✓ URLs update correctly
- ✓ Browser back button works
- ✓ Menu collapses/expands on mobile
- ✓ Breadcrumbs work (if available)

**Role-Based Testing:**
- Admin should see all menu items
- Regular user should see limited items
- Test with different user roles

---

#### FE-06: User Profile
**Objective:** Verify user can view and edit profile

**Prerequisites:** User logged in

**Steps:**
1. Click on user avatar/name
2. Select "Profile" or similar
3. View profile information
4. Click "Edit" button
5. Update name or other fields
6. Save changes
7. Verify changes persisted

**Expected Results:**
- ✓ Profile page displays user information
- ✓ Edit mode activates correctly
- ✓ Form fields populated with current data
- ✓ Validation works on save
- ✓ Success message shown
- ✓ Changes visible immediately
- ✓ Changes persist after page refresh

---

### 3. USER MANAGEMENT TESTS (Admin Only)

#### FE-07: User Management
**Objective:** Verify admin can manage users

**Prerequisites:** Logged in as admin

**Steps:**
1. Navigate to Users page
2. View list of users
3. Click "Add User" button
4. Fill in user details:
   - Email: `newuser@example.com`
   - Name: `New User`
   - Role: `user`
5. Save new user
6. Verify user appears in list
7. Click on user to edit
8. Change role to `admin`
9. Save changes
10. Test user deletion (if implemented)

**Expected Results:**
- ✓ User list displays with pagination
- ✓ Search/filter works
- ✓ Add user form validates correctly
- ✓ New user created successfully
- ✓ User appears in list immediately
- ✓ Edit user works
- ✓ Role changes save correctly
- ✓ Delete confirmation appears (if delete available)
- ✓ Proper permissions enforced

**Test as Non-Admin:**
- Regular user should NOT see Users menu
- Direct URL access should be blocked

---

### 4. CUSTOMER MANAGEMENT TESTS

#### FE-08: Customer List
**Objective:** Verify customer list displays correctly

**Prerequisites:** User logged in, test customers exist

**Steps:**
1. Navigate to Customers page
2. View list of customers

**Expected Results:**
- ✓ Customer list loads within 2 seconds
- ✓ All customers display correctly
- ✓ Only current tenant's customers shown
- ✓ Pagination works (if >10 customers)
- ✓ Columns display:
  - Name
  - Email
  - Company
  - Status
  - Actions
- ✓ Sort functionality works
- ✓ No console errors

---

#### FE-09: Customer Creation
**Objective:** Verify new customer can be created

**Prerequisites:** User logged in with customer creation permission

**Steps:**
1. Navigate to Customers page
2. Click "Add Customer" or "+ New Customer"
3. Fill in form:
   - Name: `Test Customer`
   - Email: `testcustomer@example.com`
   - Company: `Test Corp`
   - Phone: `555-0123`
   - Address: `123 Test St`
   - City: `Testville`
   - State: `TX`
   - Zip: `12345`
4. Click "Save" or "Create"

**Expected Results:**
- ✓ Form opens correctly
- ✓ All fields accessible
- ✓ Validation works (required fields marked)
- ✓ Email validation works
- ✓ Phone number formatting (if implemented)
- ✓ Success message appears
- ✓ Customer appears in list
- ✓ Correct tenantId assigned (backend verified)
- ✓ Form resets or closes

**Test Validation:**
- Try submitting empty form → Errors shown
- Try invalid email → Error shown
- Try duplicate email → Error shown

---

#### FE-10: Customer Edit
**Objective:** Verify customer information can be edited

**Prerequisites:** Customer exists

**Steps:**
1. Navigate to Customers page
2. Click on a customer or click Edit icon
3. Modify fields:
   - Update name
   - Update phone
4. Save changes
5. Verify changes in list

**Expected Results:**
- ✓ Edit form opens with current data
- ✓ Fields editable
- ✓ Save button works
- ✓ Validation enforced
- ✓ Success message appears
- ✓ Changes visible in list immediately
- ✓ Changes persist after page refresh
- ✓ Cancel button discards changes

---

#### FE-11: Customer Search/Filter
**Objective:** Verify customer search and filtering works

**Prerequisites:** Multiple customers exist

**Steps:**
1. Navigate to Customers page
2. Use search box:
   - Search by name
   - Search by email
   - Search by company
3. Use filters:
   - Filter by status (Active/Inactive)
   - Filter by date range
4. Clear filters

**Expected Results:**
- ✓ Search returns relevant results
- ✓ Search is case-insensitive
- ✓ Filters work correctly
- ✓ Multiple filters can be combined
- ✓ Clear filters button resets view
- ✓ No results message shown when appropriate
- ✓ Search/filter performs well (<1 second)

---

### 5. PRODUCT MANAGEMENT TESTS

#### FE-12: Product Management
**Objective:** Verify product CRUD operations

**Prerequisites:** User logged in

**Test Scenarios:**
1. **View Products**
   - Navigate to Products page
   - Verify list displays correctly
   - Check product details visible

2. **Create Product**
   - Click "Add Product"
   - Fill in product details:
     - Name: `Test Product`
     - SKU: `TEST-SKU-001`
     - Category: `Electronics`
     - Price: `99.99`
     - Description: `Test description`
   - Save product

3. **Edit Product**
   - Select product
   - Modify details
   - Save changes

4. **Delete Product** (if implemented)
   - Select product
   - Click delete
   - Confirm deletion

**Expected Results:**
- ✓ Product list displays correctly
- ✓ Create product works
- ✓ SKU uniqueness enforced
- ✓ Price validation works
- ✓ Edit product works
- ✓ Delete product works (if implemented)
- ✓ Product images upload/display (if implemented)
- ✓ Proper tenant isolation

---

### 6. PROMOTION MANAGEMENT TESTS

#### FE-13: Promotion Management
**Objective:** Verify promotion workflows

**Prerequisites:** User logged in, customers and products exist

**Test Scenarios:**
1. **Create Promotion**
   - Navigate to Promotions
   - Click "Create Promotion"
   - Fill in details:
     - Name: `Test Promotion`
     - Type: `Discount`
     - Customer: Select from dropdown
     - Products: Select products
     - Start Date: Today
     - End Date: +30 days
     - Discount: `10%`
   - Save promotion

2. **View Active Promotions**
   - Filter by status: Active
   - Verify only active promotions shown

3. **Edit Promotion**
   - Select promotion
   - Modify details
   - Save changes

**Expected Results:**
- ✓ Promotion form works correctly
- ✓ Customer dropdown populated
- ✓ Product selection works
- ✓ Date picker works
- ✓ Validation enforced (start < end date)
- ✓ Status filters work
- ✓ Edit saves correctly
- ✓ Promotion details display correctly

---

### 7. SALES MANAGEMENT TESTS

#### FE-14: Sales Entry
**Objective:** Verify sales can be recorded

**Prerequisites:** User logged in, customers and products exist

**Steps:**
1. Navigate to Sales page
2. Click "Record Sale" or "+ New Sale"
3. Fill in sale details:
   - Customer: Select from dropdown
   - Products: Add multiple products
   - Quantities: Enter quantities
   - Date: Select date
   - Invoice #: `INV-001`
4. System calculates total
5. Save sale

**Expected Results:**
- ✓ Sale form opens correctly
- ✓ Customer dropdown works
- ✓ Product selection works
- ✓ Multiple products can be added
- ✓ Quantity validation works (> 0)
- ✓ Total calculated automatically
- ✓ Date picker works
- ✓ Save creates sale record
- ✓ Sale appears in list

**Test Calculations:**
- Product A: $10 x 2 = $20
- Product B: $15 x 3 = $45
- Total should = $65

---

### 8. REPORTS TESTS

#### FE-15: Reports Generation
**Objective:** Verify reports can be generated and viewed

**Prerequisites:** User logged in, data exists

**Test Scenarios:**
1. **Customer Performance Report**
   - Navigate to Reports
   - Select "Customer Performance"
   - Choose date range
   - Select customer (or all)
   - Generate report
   - Verify report displays
   - Test export (PDF/Excel if available)

2. **Sales Report**
   - Select "Sales Report"
   - Choose filters
   - Generate report
   - Verify data accuracy

3. **Promotion Effectiveness**
   - Select "Promotion Report"
   - Choose promotion
   - Generate report
   - Review metrics

**Expected Results:**
- ✓ Report selection works
- ✓ Filters work correctly
- ✓ Report generates within 5 seconds
- ✓ Data displays in table/chart format
- ✓ Data is accurate
- ✓ Export works (if implemented)
- ✓ Print preview works
- ✓ Large datasets handled well

---

### 9. BUDGET MANAGEMENT TESTS

#### FE-16: Budget Management
**Objective:** Verify budget tracking and management

**Prerequisites:** User logged in, budget data exists

**Test Scenarios:**
1. **View Budget Overview**
   - Navigate to Budget page
   - View overall budget summary
   - Check allocation vs spent

2. **Create Budget Allocation**
   - Click "Create Allocation"
   - Select category
   - Enter amount
   - Set date range
   - Save

3. **Track Spending**
   - View spending against budget
   - Check visual indicators (progress bars)
   - Verify calculations correct

**Expected Results:**
- ✓ Budget overview displays correctly
- ✓ Charts/visualizations work
- ✓ Create allocation works
- ✓ Budget vs actual calculated correctly
- ✓ Alerts shown for over-budget (if implemented)
- ✓ Historical data viewable

---

### 10. FORM VALIDATION TESTS

#### FE-17: Form Validation
**Objective:** Verify all forms have proper validation

**Test All Forms For:**
1. **Required Fields**
   - Leave field empty
   - Try to submit
   - Error message should appear

2. **Email Validation**
   - Enter invalid email: `notanemail`
   - Error should appear
   - Valid email: `test@example.com` accepted

3. **Number Validation**
   - Enter text in number field
   - Negative numbers (where not allowed)
   - Decimal places (where applicable)

4. **Date Validation**
   - Future dates (where not allowed)
   - Past dates (where not allowed)
   - Invalid formats

5. **Password Validation**
   - Too short
   - No special characters
   - No numbers
   - No uppercase

**Expected Results:**
- ✓ All required fields marked with *
- ✓ Validation errors shown clearly
- ✓ Error messages specific and helpful
- ✓ Validation runs on blur and submit
- ✓ Form submit disabled until valid
- ✓ Success states shown when valid

---

### 11. ERROR HANDLING TESTS

#### FE-18: Error Handling
**Objective:** Verify application handles errors gracefully

**Test Scenarios:**
1. **Network Errors**
   - Stop backend server
   - Try to perform action
   - Check error message

2. **404 Errors**
   - Navigate to non-existent page
   - Verify 404 page displays

3. **500 Server Errors**
   - Trigger server error (invalid data)
   - Check error handling

4. **Timeout Errors**
   - Simulate slow network
   - Verify timeout handling

5. **Validation Errors**
   - Submit invalid data
   - Check error messages

**Expected Results:**
- ✓ User-friendly error messages
- ✓ No technical jargon exposed
- ✓ Option to retry
- ✓ No application crashes
- ✓ Error logged to console (for debugging)
- ✓ User guided on next steps
- ✓ 404 page helpful and branded

---

### 12. LOADING STATES TESTS

#### FE-19: Loading States
**Objective:** Verify loading indicators work correctly

**Test All Async Operations:**
1. Login
2. Data fetching (lists)
3. Form submissions
4. Report generation
5. File uploads (if applicable)

**Expected Results:**
- ✓ Loading spinner/indicator appears
- ✓ Buttons disabled during loading
- ✓ Loading text descriptive ("Loading...", "Saving...")
- ✓ Loading state clears after completion
- ✓ No double-submit possible
- ✓ Skeleton screens used (if implemented)
- ✓ Progressive loading for large datasets

---

### 13. RESPONSIVE DESIGN TESTS

#### FE-20: Responsive Design
**Objective:** Verify application works on all screen sizes

**Test Devices/Sizes:**
1. **Desktop** (1920x1080)
2. **Laptop** (1366x768)
3. **Tablet** (768x1024)
4. **Mobile** (375x667)

**For Each Size Test:**
- Navigation menu (hamburger on mobile?)
- Tables (horizontal scroll or stack?)
- Forms (full width or adjusted?)
- Buttons (touch-friendly on mobile?)
- Images (scaled properly?)
- Text (readable at all sizes?)

**Expected Results:**
- ✓ Layout adapts to screen size
- ✓ No horizontal scrolling (except tables)
- ✓ Touch targets ≥ 44x44px on mobile
- ✓ Text readable without zooming
- ✓ Images scale appropriately
- ✓ Navigation usable on all devices
- ✓ Forms usable on mobile

**Tools:**
- Chrome DevTools Device Mode
- Real devices (if available)
- BrowserStack (if available)

---

### 14. BROWSER COMPATIBILITY TESTS

#### FE-21: Browser Compatibility
**Objective:** Verify application works in all major browsers

**Test Browsers:**
1. **Chrome** (latest version)
2. **Firefox** (latest version)
3. **Safari** (latest version - Mac/iOS)
4. **Edge** (latest version)
5. **Mobile Safari** (iOS)
6. **Chrome Mobile** (Android)

**For Each Browser:**
- Login
- Navigate pages
- Create/edit data
- Visual inspection
- Console errors check

**Expected Results:**
- ✓ Application loads in all browsers
- ✓ All functionality works
- ✓ Layout consistent
- ✓ No console errors
- ✓ Performance acceptable
- ✓ No browser-specific bugs

---

### 15. PERFORMANCE TESTS

#### FE-22: Performance
**Objective:** Verify application performs well

**Metrics to Check:**
1. **Page Load Time**
   - First Contentful Paint (FCP)
   - Time to Interactive (TTI)
   - Target: < 2 seconds

2. **API Response Time**
   - Network tab in DevTools
   - Target: < 200ms for most requests

3. **Bundle Size**
   - Check JavaScript bundle size
   - Target: < 1MB initial load

4. **Memory Usage**
   - Check for memory leaks
   - Use Chrome Performance Monitor

**Testing:**
- Use Chrome DevTools Lighthouse
- Run performance audit
- Check Network tab for slow requests
- Monitor memory usage during extended use

**Expected Results:**
- ✓ Lighthouse score > 80
- ✓ Page loads < 3 seconds
- ✓ API calls < 500ms
- ✓ No memory leaks
- ✓ Smooth animations
- ✓ No janky scrolling

---

### 16. ACCESSIBILITY TESTS

#### FE-23: Accessibility
**Objective:** Verify application is accessible to all users

**Tests:**
1. **Keyboard Navigation**
   - Tab through entire application
   - All interactive elements reachable
   - Logical tab order
   - Visible focus indicators

2. **Screen Reader**
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - All content readable
   - Alt text on images
   - Form labels present

3. **Color Contrast**
   - Use Chrome DevTools contrast checker
   - Text contrast ≥ 4.5:1
   - Interactive elements contrast ≥ 3:1

4. **ARIA Labels**
   - Check for proper ARIA attributes
   - Semantic HTML used

**Expected Results:**
- ✓ All pages keyboard navigable
- ✓ Focus visible at all times
- ✓ Screen reader compatible
- ✓ Color contrast meets WCAG AA
- ✓ No ARIA errors
- ✓ Forms properly labeled
- ✓ Images have alt text

**Tools:**
- Chrome DevTools Lighthouse (Accessibility)
- WAVE browser extension
- axe DevTools

---

## BUG REPORTING TEMPLATE

When you find a bug, report it using this template:

```markdown
### Bug Report

**Test ID:** FE-XX
**Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
**Found By:** [Your Name]
**Date:** YYYY-MM-DD

**Title:** Short description of the bug

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Screenshots:**
[Attach screenshots if applicable]

**Browser:** Chrome 115 / Firefox 116 / etc.
**Device:** Desktop / Mobile / Tablet
**Screen Size:** 1920x1080 / etc.

**Console Errors:**
```
[Any console errors]
```

**Additional Notes:**
Any other relevant information
```

---

## SUCCESS CRITERIA

Frontend UAT is considered successful when:

- [ ] All test cases executed (23 tests)
- [ ] Pass rate ≥ 95% (22/23 tests passing)
- [ ] All critical bugs fixed
- [ ] No high-severity bugs
- [ ] Performance targets met
- [ ] Accessibility requirements met
- [ ] Responsive design works on all devices
- [ ] Browser compatibility verified

---

## TEST SUMMARY REPORT

After completing all tests, fill out this summary:

### Test Execution Summary

**Test Period:** [Start Date] to [End Date]  
**Total Tests:** 23  
**Tests Passed:** ___  
**Tests Failed:** ___  
**Tests Blocked:** ___  
**Pass Rate:** ___%  

### Severity Breakdown

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | ___ | |
| 🟠 High | ___ | |
| 🟡 Medium | ___ | |
| 🟢 Low | ___ | |

### Overall Assessment

**Production Ready:** ✅ Yes / ⚠️ With Conditions / ❌ No

**Comments:**
[Overall assessment of frontend readiness]

### Outstanding Issues

1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

### Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

---

## NEXT STEPS

After Frontend UAT:

1. **Fix Critical Bugs** - Address all critical issues immediately
2. **Retest** - Verify fixes work as expected
3. **Update Documentation** - Document any changes or findings
4. **Final Sign-Off** - Get stakeholder approval
5. **Production Deployment** - Follow production deployment checklist

---

**Document Version:** 1.0  
**Last Updated:** October 3, 2025  
**Next Review:** After frontend UAT completion  

---

*This guide should be used in conjunction with the backend UAT report and production deployment checklist.*
