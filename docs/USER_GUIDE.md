# TRADEAI User Guide

**Version**: 2.0  
**Last Updated**: 2025-10-27

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Managing Promotions](#managing-promotions)
5. [Managing Campaigns](#managing-campaigns)
6. [Managing Customers](#managing-customers)
7. [Managing Products](#managing-products)
8. [Managing Vendors](#managing-vendors)
9. [User Management](#user-management)
10. [Search & Filters](#search--filters)
11. [Bulk Operations](#bulk-operations)
12. [Security Features](#security-features)
13. [Reports & Analytics](#reports--analytics)
14. [Troubleshooting](#troubleshooting)

---

## Introduction

TRADEAI is a comprehensive Trade Promotion Management system designed to help businesses manage promotions, campaigns, customers, products, and vendors efficiently.

### Key Features
- ✅ Complete CRUD operations for all entities
- ✅ Advanced search and filtering
- ✅ Bulk import/export (CSV)
- ✅ Two-factor authentication
- ✅ Audit logging and compliance
- ✅ Real-time analytics
- ✅ Responsive design

---

## Getting Started

### First Login

1. Navigate to the TRADEAI login page
2. Enter your email and password
3. Click "Login"
4. If 2FA is enabled, enter your 6-digit code

### Setting Up Your Profile

1. Click your profile icon (top right)
2. Select "Profile Settings"
3. Update your information:
   - Name
   - Email
   - Phone
   - Organization
4. Click "Save Changes"

### Enabling Two-Factor Authentication (Recommended)

1. Go to Profile Settings
2. Click "Security" tab
3. Click "Enable 2FA"
4. Follow the setup wizard:
   - Download an authenticator app
   - Scan the QR code
   - Enter verification code
   - Save backup codes

⚠️ **Important**: Store your backup codes in a safe place!

---

## Dashboard Overview

The dashboard provides a quick overview of your system:

### Widgets
- **Active Promotions**: Current running promotions
- **Campaign Performance**: Top performing campaigns
- **Customer Stats**: Customer tier distribution
- **Product Inventory**: Low stock alerts
- **Recent Activity**: Latest system actions

### Quick Actions
- Create new promotion
- Launch new campaign
- Add customer
- Generate report

---

## Managing Promotions

### Creating a Promotion

1. Navigate to "Promotions" from the main menu
2. Click "Add New Promotion"
3. Fill in the details:
   - **Name**: Promotion name (required)
   - **Type**: Select type (percentage, fixed, bogo)
   - **Discount**: Discount value
   - **Start Date**: When promotion begins
   - **End Date**: When promotion ends
   - **Status**: Active, Planned, or Expired
4. Click "Create Promotion"

### Viewing Promotion Details

1. Go to Promotions list
2. Click on any promotion
3. View complete information:
   - Basic details
   - Timeline
   - Performance metrics
   - Associated products
   - History

### Editing a Promotion

1. Open promotion details
2. Click "Edit" button
3. Modify fields as needed
4. Click "Update Promotion"

### Deleting a Promotion

1. Open promotion details
2. Click "Delete" button
3. Confirm deletion

⚠️ **Warning**: Deleted promotions cannot be recovered!

---

## Managing Campaigns

### Creating a Campaign

1. Navigate to "Campaigns"
2. Click "Add New Campaign"
3. Fill in:
   - Name
   - Type (awareness, conversion, retention, seasonal)
   - Budget
   - Timeline
   - Description
4. Click "Create Campaign"

### Campaign Types

- **Awareness**: Build brand awareness
- **Conversion**: Drive sales
- **Retention**: Keep existing customers
- **Seasonal**: Time-limited campaigns

### Tracking Campaign Performance

1. Open campaign details
2. View metrics:
   - Budget vs. Actual spend
   - Duration
   - Associated promotions
   - ROI

---

## Managing Customers

### Adding a Customer

1. Navigate to "Customers"
2. Click "Add New Customer"
3. Enter information:
   - Name (required)
   - Email (required)
   - Phone
   - Company
   - Tier (Bronze, Silver, Gold, Platinum)
   - Address
4. Click "Create Customer"

### Customer Tiers

- **Bronze**: Entry level
- **Silver**: Regular customers
- **Gold**: Valued customers
- **Platinum**: VIP customers

### Customer Actions

- View purchase history
- Track promotions used
- Update tier
- Deactivate/Reactivate

---

## Managing Products

### Adding a Product

1. Navigate to "Products"
2. Click "Add New Product"
3. Fill in:
   - Name (required)
   - SKU (required)
   - Category
   - Price (required)
   - Cost
   - Stock quantity
   - Description
4. Click "Create Product"

### Product Categories

- Beverages
- Snacks
- Dairy
- Bakery
- Frozen
- Other

### Inventory Management

- Track stock levels
- Set low stock alerts
- Update pricing
- Manage product lifecycle

---

## Managing Vendors

### Adding a Vendor

1. Navigate to "Vendors"
2. Click "Add New Vendor"
3. Enter:
   - Name (required)
   - Contact person
   - Email (required)
   - Phone
   - Rating (1-5 stars)
   - Address
4. Click "Create Vendor"

### Vendor Rating System

- ⭐ (1) - Poor
- ⭐⭐ (2) - Fair
- ⭐⭐⭐ (3) - Good
- ⭐⭐⭐⭐ (4) - Very Good
- ⭐⭐⭐⭐⭐ (5) - Excellent

---

## User Management

### Adding a New User (Admin Only)

1. Navigate to "Admin" → "Users"
2. Click "Add New User"
3. Enter:
   - First name
   - Last name
   - Email
   - Role (Admin, Manager, User)
   - Organization
4. User receives email with setup link

### User Roles

- **Admin**: Full system access
- **Manager**: Manage entities, view reports
- **User**: View and edit assigned items

### Deactivating a User

1. Go to User List
2. Find the user
3. Toggle status to "Inactive"

---

## Search & Filters

### Global Search

1. Use the search bar at the top
2. Type your query (minimum 2 characters)
3. Results show across all entities:
   - Promotions
   - Campaigns
   - Customers
   - Products
   - Vendors

### Advanced Filtering

Each list page has filters:

**Promotions**:
- Type
- Status
- Date range

**Campaigns**:
- Type
- Status
- Budget range

**Customers**:
- Tier
- Status
- Company

**Products**:
- Category
- Status
- Price range

**Vendors**:
- Rating
- Status

---

## Bulk Operations

### Importing Data (CSV)

1. Navigate to entity list (e.g., Products)
2. Click "Import"
3. Download template
4. Fill in your data
5. Upload CSV file
6. Review import results

### Exporting Data

1. Navigate to entity list
2. Apply filters (optional)
3. Click "Export to CSV"
4. File downloads automatically

### CSV Templates

Templates include:
- Required fields marked with *
- Sample data for reference
- Format guidelines

---

## Security Features

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

### Two-Factor Authentication

- TOTP-based (Google Authenticator, Authy)
- 6-digit codes
- 10 backup codes provided
- Codes refresh every 30 seconds

### Session Management

- Auto-logout after 30 minutes inactive
- Active session tracking
- Multi-device support

### Audit Logs

All actions are logged:
- User logins/logouts
- Data changes
- Permission changes
- Exports/imports

Admins can view audit logs in Admin → Audit Logs.

---

## Reports & Analytics

### Available Reports

1. **Promotion Performance**
   - Total promotions
   - Active vs. completed
   - ROI analysis

2. **Campaign Analytics**
   - Budget utilization
   - Campaign duration
   - Success metrics

3. **Customer Insights**
   - Tier distribution
   - Active customers
   - Purchase patterns

4. **Product Reports**
   - Inventory levels
   - Best sellers
   - Low stock alerts

5. **Vendor Performance**
   - Rating distribution
   - Active vendors
   - Delivery metrics

### Generating a Report

1. Navigate to "Reports"
2. Select report type
3. Choose date range
4. Apply filters
5. Click "Generate Report"
6. Download or print

---

## Troubleshooting

### Cannot Login

**Problem**: Invalid credentials  
**Solution**: 
- Check email and password
- Use "Forgot Password" if needed
- Contact admin if account is locked

### 2FA Code Not Working

**Problem**: Code rejected  
**Solution**:
- Ensure time on device is correct
- Try next code (codes refresh every 30 seconds)
- Use backup code if needed

### CSV Import Fails

**Problem**: Import errors  
**Solution**:
- Download and use the template
- Check required fields
- Ensure correct data format
- Remove special characters

### Slow Performance

**Problem**: Pages load slowly  
**Solution**:
- Clear browser cache
- Check internet connection
- Use filters to reduce data load
- Contact support if persistent

### Data Not Saving

**Problem**: Changes not persisted  
**Solution**:
- Check required fields
- Ensure valid data formats
- Check for error messages
- Refresh page and try again

---

## Support

### Getting Help

- **Email**: support@tradeai.com
- **Phone**: +27 123 456 7890
- **Chat**: Available 9 AM - 5 PM SAST

### FAQ

**Q: Can I undo a deletion?**  
A: No, deletions are permanent. Be careful when deleting data.

**Q: How often should I change my password?**  
A: We recommend changing your password every 90 days.

**Q: Can I access TRADEAI on mobile?**  
A: Yes, the web interface is mobile-responsive. A native app is coming soon.

**Q: How long are audit logs kept?**  
A: Audit logs are retained for 1 year minimum, longer for compliance.

**Q: Can I export all my data?**  
A: Yes, admins can export all data via the Admin panel.

---

## Tips & Best Practices

### Performance Tips
- Use filters to narrow results
- Export data for offline analysis
- Schedule reports during off-peak hours
- Clear old data regularly

### Security Tips
- Enable 2FA
- Use strong, unique passwords
- Log out when not in use
- Don't share credentials
- Report suspicious activity

### Data Management Tips
- Regularly backup data
- Keep product information current
- Update customer information
- Review inactive records
- Use bulk operations for efficiency

---

## Glossary

- **2FA**: Two-Factor Authentication
- **CRUD**: Create, Read, Update, Delete
- **CSV**: Comma-Separated Values
- **ROI**: Return on Investment
- **SKU**: Stock Keeping Unit
- **TOTP**: Time-based One-Time Password

---

## Appendix

### Keyboard Shortcuts

- `Ctrl + K`: Open global search
- `Ctrl + N`: Create new (contextual)
- `Ctrl + S`: Save changes
- `Esc`: Close dialogs

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

**End of User Guide**

For more information, visit our documentation portal or contact support.
