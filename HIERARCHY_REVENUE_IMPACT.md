# Hierarchy-Based Revenue Impact System

## Overview

The TRADEAI platform uses a sophisticated hierarchy-based revenue impact calculation system that leverages customer and product hierarchies with proportional spend allocation to determine net revenue impact. This approach provides business-driven insights rather than relying solely on generic ML predictions.

## Architecture

### Core Components

1. **revenueImpactService** (`backend/src/services/revenueImpactService.js`)
   - Main service for hierarchy-based revenue calculations
   - Handles customer and product hierarchy expansion
   - Implements proportional spend allocation
   - Calculates net revenue impact with confidence intervals

2. **hierarchyManager** (`backend/src/utils/hierarchyManager.js`)
   - Utility for managing tree structures using materialized path pattern
   - Provides methods for hierarchy traversal, validation, and repair
   - Supports customer and product hierarchies

3. **AI Orchestrator** (`backend/src/services/aiOrchestratorService.js`)
   - Routes AI requests to appropriate tools
   - Uses Ollama (phi3:mini) for intelligent tool selection
   - Generates natural language explanations for results

## Hierarchy Models

### Customer Hierarchy

Customers are organized in a tree structure using the materialized path pattern:

```javascript
{
  _id: ObjectId,
  name: "Customer Name",
  parentId: ObjectId,           // Reference to parent customer
  level: Number,                 // Depth in hierarchy (0 = root)
  path: String,                  // Materialized path (e.g., "/root_id/parent_id/this_id/")
  hasChildren: Boolean,          // Whether this node has children
  childrenCount: Number,         // Direct children count
  descendantsCount: Number       // Total descendants count
}
```

**Example Hierarchy:**
```
National Account (Level 0)
├── Regional Office East (Level 1)
│   ├── Store NYC-001 (Level 2)
│   └── Store NYC-002 (Level 2)
└── Regional Office West (Level 1)
    ├── Store LA-001 (Level 2)
    └── Store LA-002 (Level 2)
```

### Product Hierarchy

Products follow the same materialized path pattern:

```javascript
{
  _id: ObjectId,
  name: "Product Name",
  sku: "SKU-001",
  parentId: ObjectId,
  level: Number,
  path: String,
  hasChildren: Boolean
}
```

**Example Hierarchy:**
```
Beverages (Level 0)
├── Soft Drinks (Level 1)
│   ├── Cola 500ml (Level 2)
│   └── Cola 1L (Level 2)
└── Juices (Level 1)
    ├── Orange Juice 1L (Level 2)
    └── Apple Juice 1L (Level 2)
```

## Revenue Impact Calculation

### Step 1: Hierarchy Expansion

When calculating promotion impact, the system expands selected customers and products to include all descendants:

```javascript
// Input: [National Account]
// Output: [National Account, Regional East, Regional West, Store NYC-001, Store NYC-002, Store LA-001, Store LA-002]
```

This ensures that promotions targeting parent nodes automatically apply to all child nodes.

### Step 2: Baseline Revenue Calculation

For each customer-product combination, calculate baseline revenue:

```javascript
baselineRevenue = weeklyRevenue × periodWeeks
```

Where `weeklyRevenue` is estimated from:
- Historical sales data (if available)
- Customer performance metrics
- Product pricing and volume data

### Step 3: Proportional Spend Allocation

Allocate promotional spend proportionally based on baseline revenue:

```javascript
spend[customer][product] = baselineRevenue[customer][product] × (discountPercentage / 100)
```

This ensures that:
- Larger customers/products receive proportionally more promotional investment
- Spend allocation reflects actual business relationships
- Budget is distributed efficiently across the hierarchy

### Step 4: Uplift Factor Calculation

Calculate expected uplift based on:
- Historical promotion performance (similar promotions)
- Discount depth (higher discount = higher uplift)
- Customer responsiveness scores
- Product margin factors

```javascript
upliftFactor = baseUplift × discountFactor × customerResponsiveness × productMargin
```

### Step 5: Net Revenue Impact

Calculate final revenue impact:

```javascript
promotionalRevenue = baselineRevenue × upliftFactor
incrementalRevenue = promotionalRevenue - baselineRevenue
netRevenue = incrementalRevenue - totalSpend
roi = (netRevenue / totalSpend) × 100
```

## Example Calculation

### Input
```javascript
{
  customers: [ObjectId("national_account")],
  products: [ObjectId("beverages_category")],
  discountPercentage: 15,
  startDate: "2025-01-01",
  endDate: "2025-01-31",
  promotionType: "price_discount"
}
```

### Hierarchy Expansion
```
Customers: National Account → [Regional East, Regional West, Store NYC-001, Store NYC-002, Store LA-001, Store LA-002]
Products: Beverages → [Soft Drinks, Juices, Cola 500ml, Cola 1L, Orange Juice 1L, Apple Juice 1L]
```

### Baseline Revenue (Example)
```
Store NYC-001 × Cola 500ml: $5,000
Store NYC-001 × Cola 1L: $3,000
Store NYC-002 × Cola 500ml: $4,500
...
Total Baseline: $150,000
```

### Spend Allocation
```
Total Spend = $150,000 × 0.15 = $22,500
Store NYC-001 × Cola 500ml: $750 (5,000 × 0.15)
Store NYC-001 × Cola 1L: $450 (3,000 × 0.15)
...
```

### Uplift Calculation
```
Average Uplift Factor: 1.35 (35% increase)
Store NYC-001 × Cola 500ml: $5,000 × 1.35 = $6,750
Incremental: $1,750
...
Total Incremental: $52,500
```

### Net Impact
```
Total Promotional Revenue: $202,500
Total Incremental Revenue: $52,500
Total Spend: $22,500
Net Revenue: $30,000
ROI: 133%
```

## Segmentation Methods

### RFM Segmentation
Segments customers based on:
- **Recency**: How recently they purchased
- **Frequency**: How often they purchase
- **Monetary**: How much they spend

Segments: Champions, Loyal, Potential Loyalists, At Risk, Need Attention, Lost, New

### Hierarchy Segmentation
Groups customers by their level in the hierarchy:
- Level 0: National/Corporate accounts
- Level 1: Regional offices
- Level 2: Individual stores

### Value Segmentation (ABC Analysis)
Segments by revenue contribution:
- **A Customers**: Top 20% contributing 80% of revenue
- **B Customers**: Next 30% contributing 15% of revenue
- **C Customers**: Remaining 50% contributing 5% of revenue

## Product Recommendations

Recommendations are scored based on:
1. **Customer Tier Alignment** (30 points): Match product price point to customer tier
2. **Channel Alignment** (25 points): Match product type to customer channel
3. **Performance Metrics** (20 points): Product's historical performance
4. **Margin Potential** (15 points): Product's profit margin
5. **Promotion Responsiveness** (10 points): Customer's responsiveness to promotions

## API Usage

### Calculate Promotion Impact
```javascript
POST /api/ai-orchestrator/orchestrate
{
  "userIntent": "Calculate promotion impact for 15% discount on beverages for national account",
  "context": {
    "tenantId": "tenant_123",
    "promotionData": {
      "customers": ["customer_id"],
      "products": ["product_id"],
      "discountPercentage": 15,
      "startDate": "2025-01-01",
      "endDate": "2025-01-31",
      "promotionType": "price_discount"
    }
  }
}
```

### Segment Customers
```javascript
POST /api/ai-orchestrator/orchestrate
{
  "userIntent": "Segment customers using RFM analysis",
  "context": {
    "tenantId": "tenant_123"
  }
}
```

### Recommend Products
```javascript
POST /api/ai-orchestrator/orchestrate
{
  "userIntent": "Recommend products for customer XYZ",
  "context": {
    "tenantId": "tenant_123",
    "customerId": "customer_id"
  }
}
```

## Confidence Levels

The system provides confidence scores based on:
- **Data Quality**: Amount and recency of historical data
- **Sample Size**: Number of similar historical promotions
- **Variance**: Consistency of historical results

Confidence ranges:
- **High (>85%)**: Strong historical data, low variance
- **Medium (70-85%)**: Moderate historical data, some variance
- **Low (<70%)**: Limited historical data, high variance

## Assumptions and Limitations

### Assumptions
1. Historical performance is indicative of future results
2. Customer hierarchies are properly configured and maintained
3. Product hierarchies reflect actual business relationships
4. Baseline revenue estimates are reasonably accurate
5. Uplift factors are based on similar historical promotions

### Limitations
1. Does not account for external market factors (seasonality, competition, economic conditions)
2. Assumes linear relationship between discount and uplift
3. Does not model cannibalization between products
4. Requires sufficient historical data for accurate predictions
5. Hierarchy changes require recalculation of all dependent metrics

## Best Practices

1. **Maintain Clean Hierarchies**: Regularly validate and repair customer/product hierarchies
2. **Update Historical Data**: Keep promotion performance data current
3. **Review Confidence Scores**: Pay attention to low-confidence predictions
4. **Test Assumptions**: Validate uplift factors against actual results
5. **Monitor ROI**: Track actual vs. predicted ROI to improve future predictions
6. **Use Appropriate Granularity**: Select hierarchy level that matches promotion scope
7. **Consider Seasonality**: Adjust baseline revenue for seasonal patterns
8. **Validate Inputs**: Ensure discount percentages and date ranges are reasonable

## Troubleshooting

### Low Confidence Scores
- **Cause**: Insufficient historical data
- **Solution**: Gather more historical promotion data or use conservative estimates

### Unexpected ROI Predictions
- **Cause**: Incorrect baseline revenue or uplift factors
- **Solution**: Verify historical data accuracy and review uplift factor calculations

### Missing Hierarchy Nodes
- **Cause**: Incomplete hierarchy configuration
- **Solution**: Use hierarchyManager.validateHierarchy() and repairHierarchy()

### Slow Calculations
- **Cause**: Large hierarchies with many descendants
- **Solution**: Use caching, limit hierarchy depth, or optimize queries

## Future Enhancements

1. **Cannibalization Modeling**: Account for sales transfer between products
2. **Seasonality Adjustment**: Incorporate seasonal patterns into baseline calculations
3. **Competitive Response**: Model competitor reactions to promotions
4. **Multi-Period Optimization**: Optimize promotion timing across multiple periods
5. **Budget Constraints**: Add budget optimization with constraints
6. **A/B Testing**: Support for promotion experiments and control groups
7. **Real-Time Updates**: Stream actual results and update predictions dynamically
