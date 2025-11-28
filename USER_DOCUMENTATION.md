# TradeAI TPM Platform - User Documentation

## Table of Contents
1. [Getting Started](#getting-started)
2. [Admin User Guide](#admin-user-guide)
3. [Manager User Guide](#manager-user-guide)
4. [KAM User Guide](#kam-user-guide)
5. [Common Workflows](#common-workflows)
6. [FAQ](#faq)

---

## Getting Started

### Logging In
1. Navigate to https://tradeai.gonxt.tech
2. Enter your email and password
3. Click "Sign In"

### First-Time Setup
- **Admin**: Set up company profile, create users, assign roles
- **Manager**: Review budget allocations, set approval thresholds
- **KAM**: Review assigned customers, familiarize yourself with wallet balance

---

## Admin User Guide

### Role Overview
As an Admin, you have full system access and are responsible for:
- User management and role assignment
- System configuration and data quality
- Customer assignment to KAMs
- Overall system health monitoring

### Admin Dashboard
Access: **Dashboard > Admin Dashboard**

The Admin Dashboard provides:
- **System Health**: Total users, active users, customers, promotions
- **User Activity**: Login activity over the last 30 days
- **Data Quality Metrics**: Sales coverage, promotional effectiveness
- **Budget Overview**: Total allocated vs. spent across all categories

### Key Tasks

#### 1. User Management
**Create New User:**
1. Navigate to **Users > Create User**
2. Fill in user details (name, email, role, department)
3. Assign role (Admin, Manager, KAM)
4. Click "Create User"
5. User will receive email with login credentials

**Assign Customers to KAM:**
1. Navigate to **Customer Assignment**
2. Select a KAM user from the list
3. Click "Assign Customers"
4. Select customers from the available list
5. Click "Save Assignment"

#### 2. System Monitoring
**View Alerts:**
1. Navigate to **Alerts** (bell icon in top navigation)
2. Review critical alerts (red), warnings (yellow), and info (blue)
3. Click on alert for details and recommended actions

**Data Quality Checks:**
- Monitor promotional coverage (should be >20%)
- Review budget utilization rates
- Check for underperforming promotions

#### 3. Customer Assignment
**Best Practices:**
- Assign 5-10 customers per KAM for optimal coverage
- Balance customer tiers across KAMs
- Review assignments quarterly

---

## Manager User Guide

### Role Overview
As a Manager, you are responsible for:
- Approving trade spends and promotions
- Budget management and monitoring
- Performance analysis and reporting
- Team oversight

### Manager Dashboard
Access: **Dashboard > Manager Dashboard**

The Manager Dashboard provides:
- **Pending Approvals**: Trade spends and promotions awaiting approval
- **Budget Utilization**: By category with utilization rates
- **Performance Metrics**: Revenue, volume, gross profit, margin
- **Top Promotions**: Best performing promotions by revenue

### Key Tasks

#### 1. Approval Workflow
**Approve Trade Spend:**
1. Navigate to **Approvals > Pending**
2. Click on trade spend to review details
3. Review amount, customer, promotion, and justification
4. Click "Approve" or "Reject"
5. Add comments (required for rejection)

**Bulk Approval:**
1. Navigate to **Approvals > Pending**
2. Select multiple items using checkboxes
3. Click "Bulk Approve"
4. Confirm action

**Best Practices:**
- Review approvals daily to avoid bottlenecks
- Check budget availability before approving
- Require detailed justification for high-value spends

#### 2. Budget Management
**Monitor Budget Utilization:**
1. Navigate to **Budgets > Overview**
2. Review utilization by category
3. Identify categories approaching limits (>90%)
4. Take action on exceeded budgets

**Budget Alerts:**
- **Warning** (90-100%): Review upcoming spends
- **Exceeded** (>100%): Immediate action required

#### 3. Performance Analysis
**View Promotion Performance:**
1. Navigate to **Analytics > Promotions**
2. Filter by date range, type, or customer
3. Review key metrics: lift, ROI, revenue impact
4. Identify underperforming promotions

**Generate Reports:**
1. Navigate to **Reports**
2. Select report type (Budget, Promotion, Customer)
3. Set filters and date range
4. Click "Generate Report"
5. Export to Excel or PDF

---

## KAM User Guide

### Role Overview
As a Key Account Manager (KAM), you are responsible for:
- Managing assigned customer relationships
- Creating and tracking promotions
- Managing deductions and claims
- Monitoring wallet balance

### KAM Dashboard
Access: **Dashboard > KAM Dashboard**

The KAM Dashboard provides:
- **My Customers**: Performance metrics for assigned customers
- **My Deductions**: Pending, submitted, and approved deductions
- **My Wallet**: Allocated budget, spent, and available balance
- **Quick Actions**: Create promotion, submit deduction, view customers

### Key Tasks

#### 1. Customer Management
**View Customer Performance:**
1. Navigate to **My Customers**
2. Click on customer name to view details
3. Review sales history, active promotions, and deductions
4. Identify opportunities for growth

**Create Promotion:**
1. Navigate to **Promotions > Create**
2. Select customer(s) and product(s)
3. Set promotion type, discount, and duration
4. Enter expected volume lift and budget
5. Click "Submit for Approval"

#### 2. Deduction Management
**Submit Deduction:**
1. Navigate to **Deductions > Create**
2. Select customer and deduction type
3. Enter amount and upload supporting documents
4. Add description and justification
5. Click "Submit"

**Track Deduction Status:**
- **Pending**: Awaiting your submission
- **Submitted**: Awaiting manager approval
- **Approved**: Deduction processed
- **Rejected**: Review rejection comments and resubmit

#### 3. Wallet Management
**Monitor Wallet Balance:**
1. Navigate to **My Wallet**
2. View allocated budget for your customers
3. Track spent amount and available balance
4. Review utilization rate

**Best Practices:**
- Keep utilization between 80-95%
- Plan promotions to avoid budget overruns
- Request additional budget 30 days in advance

#### 4. Promotion Tracking
**Monitor Active Promotions:**
1. Navigate to **Promotions > My Promotions**
2. Review status (Pending, Active, Completed)
3. Track performance metrics (sales, lift, ROI)
4. Take action on underperforming promotions

---

## Common Workflows

### Workflow 1: Create and Approve Promotion
**KAM:**
1. Create promotion with customer, products, and terms
2. Submit for approval

**Manager:**
1. Review promotion details and budget impact
2. Approve or reject with comments

**System:**
1. Activate promotion on start date
2. Track sales and calculate lift
3. Generate performance reports

### Workflow 2: Submit and Process Deduction
**KAM:**
1. Identify deduction from customer
2. Create deduction with supporting documents
3. Submit for approval

**Manager:**
1. Review deduction and documents
2. Verify against promotion terms
3. Approve or reject

**System:**
1. Process approved deduction
2. Update customer balance
3. Generate audit trail

### Workflow 3: Budget Monitoring and Alerts
**System:**
1. Calculate budget utilization daily
2. Generate alerts for thresholds (90%, 100%)
3. Notify managers and admins

**Manager:**
1. Review budget alerts
2. Analyze spending patterns
3. Adjust allocations or restrict spending

---

## FAQ

### General Questions

**Q: How do I reset my password?**
A: Click "Forgot Password" on the login page and follow the email instructions.

**Q: Who do I contact for support?**
A: Contact your system administrator or email support@tradeai.com

**Q: Can I access TradeAI on mobile?**
A: Yes, the platform is mobile-responsive. Use your mobile browser to access the same URL.

### Admin Questions

**Q: How do I deactivate a user?**
A: Navigate to Users > Select User > Click "Deactivate". The user will lose access immediately.

**Q: Can I reassign customers from one KAM to another?**
A: Yes, use the Customer Assignment page to unassign from one KAM and assign to another.

### Manager Questions

**Q: What happens if I reject a trade spend?**
A: The KAM will be notified and can revise and resubmit. Rejection comments are required.

**Q: How do I export data?**
A: Navigate to Reports, select the report type, and click "Export to Excel" or "Export to PDF".

**Q: Can I approve my own submissions?**
A: No, the system prevents self-approval to maintain proper controls.

### KAM Questions

**Q: How many customers can I manage?**
A: Typically 5-10 customers, but this varies by organization. Contact your manager if you need adjustments.

**Q: What if my wallet balance is insufficient?**
A: Contact your manager to request additional budget allocation. Provide justification and expected ROI.

**Q: Can I edit a promotion after submission?**
A: No, once submitted, promotions cannot be edited. If rejected, you can create a new promotion with corrections.

**Q: How do I track promotion performance?**
A: Navigate to Promotions > My Promotions > Click on promotion name to view detailed performance metrics.

---

## Support and Training

### Training Resources
- **Video Tutorials**: Available in the Help Center
- **Live Training Sessions**: Scheduled monthly (check calendar)
- **User Community**: Join the TradeAI user forum

### Getting Help
- **In-App Help**: Click the "?" icon in the top navigation
- **Email Support**: support@tradeai.com
- **Phone Support**: +27 11 123 4567 (Business hours: 8am-5pm SAST)

### System Updates
- **Release Notes**: Published monthly in the Help Center
- **Maintenance Windows**: Saturdays 2am-4am SAST
- **Notifications**: Subscribe to system updates in your profile settings

---

*Last Updated: November 2025*
*Version: 2.2.0*
