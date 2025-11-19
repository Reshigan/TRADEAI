# SAP Import Templates for TRADEAI

## Overview
This package contains 23 comprehensive CSV templates for importing SAP data into TRADEAI's world-class Trade Promotions Management platform. Templates are organized by category and include both friendly field names and SAP technical field names for easy mapping.

## Template Categories

### 1. Master Data (6 templates)
- **customers.csv** - Customer master data (SAP KNA1/KNVV)
- **customer_hierarchy.csv** - Customer hierarchy relationships (SAP KNVH)
- **partner_functions.csv** - Partner functions: sold-to, ship-to, bill-to, payer (SAP KNVP)
- **products.csv** - Material master data (SAP MARA/MAKT)
- **product_hierarchy.csv** - Product hierarchy structure (SAP T179)
- **product_sales_data.csv** - Product sales org data (SAP MVKE)

### 2. Transactional Data (5 templates)
- **sales_actuals.csv** - Billing documents (SAP VBRK/VBRP)
- **pricing_conditions.csv** - Pricing condition records (SAP KONH/KONP)
- **ar_deductions.csv** - AR deductions and short payments (SAP BSID/BSAD)
- **deductions.csv** - Deductions requiring research (SAP BSID/BSAD)
- **claims.csv** - Customer claims for promotions and rebates

### 3. Planning Data (7 templates)
- **budgets.csv** - Trade marketing and promotional budgets
- **trading_terms.csv** - Trading term agreements and rebates
- **tradespends.csv** - Trade spend agreements and accruals
- **kam_wallets.csv** - Key Account Manager discretionary spend wallets
- **promotions.csv** - Promotional programs
- **campaigns.csv** - Marketing campaigns
- **activity_grid.csv** - Marketing calendar activities

### 4. Reference Data (5 templates)
- **org_sales.csv** - Sales organization master data (SAP TVKO)
- **company_codes.csv** - Company code master data (SAP T001)
- **plants.csv** - Plant and distribution center data (SAP T001W)
- **exchange_rates.csv** - Currency exchange rates (SAP TCURR)
- **uom.csv** - Unit of measure conversions (SAP T006)

## Quick Start

1. **Download templates** - Download the appropriate template(s) from the Import Center
2. **Extract SAP data** - Use SAP transaction codes (SE16, SE11, or custom extractors) to export data
3. **Map fields** - Map SAP field names to template column headers (both friendly and SAP names provided)
4. **Fill in data** - Populate the CSV with your SAP data
5. **Upload** - Upload via TRADEAI Import Center with drag-and-drop
6. **Validate** - Review validation results and fix any errors
7. **Import** - Confirm import and track progress in real-time

## Import Order

For best results, import templates in this order:

1. Reference Data (company codes, sales orgs, plants, exchange rates, UoM)
2. Master Data (customers, products, hierarchies)
3. Planning Data (budgets, terms, promotions, campaigns)
4. Transactional Data (sales actuals, pricing, AR, claims)

## Field Naming Convention

All templates use a dual naming convention:
- **Friendly names**: Human-readable column headers (e.g., "Customer Code")
- **SAP field names**: Technical SAP field names in parentheses (e.g., "kunnr")

Example: `kunnr` = Customer Number (SAP field KUNNR from table KNA1)

## Validation Rules

Each template includes built-in validation:
- **Required fields**: Must be populated for successful import
- **Data types**: Numeric, date, text validation
- **Format validation**: Date formats (YYYY-MM-DD), currency codes (ISO 4217)
- **Reference validation**: Foreign key checks against existing master data
- **Business rules**: Custom validation rules per template

## Sample Data

All templates include 5-10 rows of sample data based on South African chocolate market scenarios (Abie's Chocolates). Use these as reference for data structure and formatting.

## Documentation

See `docs/` folder for detailed guides:
- **SAP_IMPORT_GUIDE.md** - Complete field definitions and validation rules
- **SAP_TABLE_MAPPING.md** - SAP table to template mapping reference
- **TROUBLESHOOTING.md** - Common issues and solutions

## Power BI Integration

These templates are compatible with Power BI for reporting and analytics. Export data from TRADEAI in the same format for seamless integration with your existing BI infrastructure.

## Multi-Company Type Support

Templates support all three company types:
- **Manufacturer**: Full planning and execution capabilities
- **Distributor**: Pass-through funding and allocation
- **Retailer**: Receive offers and submit claims

## Support

For questions or assistance:
- Email: support@tradeai.com
- Documentation: https://docs.tradeai.com
- In-app help: Click the Help icon in Import Center

## Version

Current version: 1.0.0
Last updated: 2025-11-18
