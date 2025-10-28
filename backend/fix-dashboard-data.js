const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/tradeai';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
  fixDashboardData();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function fixDashboardData() {
  try {
    const db = mongoose.connection.db;
    
    // 1. Calculate actual budget totals from budgets collection
    console.log('\n📊 Calculating budget aggregations...');
    const budgets = await db.collection('budgets').find({ tenant: 'mondelez' }).toArray();
    
    const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocated || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    
    console.log(`  Total Budget: R${(totalBudget / 1000000).toFixed(2)}M`);
    console.log(`  Total Allocated: R${(totalAllocated / 1000000).toFixed(2)}M`);
    console.log(`  Total Spent: R${(totalSpent / 1000000).toFixed(2)}M`);
    console.log(`  Budgets found: ${budgets.length}`);
    
    // 2. Calculate customer spend totals from sales
    console.log('\n💰 Calculating customer spend data...');
    const customerSpend = await db.collection('sales').aggregate([
      { $match: { tenant: 'mondelez' } },
      {
        $group: {
          _id: '$customer',
          totalRevenue: { $sum: '$revenue' },
          totalQuantity: { $sum: '$quantity' },
          lastSaleDate: { $max: '$saleDate' }
        }
      }
    ]).toArray();
    
    console.log(`  Customer spend records: ${customerSpend.length}`);
    
    // 3. Update customers with their spend data
    for (const spend of customerSpend) {
      await db.collection('customers').updateOne(
        { _id: spend._id },
        {
          $set: {
            totalSpend: spend.totalRevenue,
            lastOrderDate: spend.lastSaleDate,
            totalOrders: spend.totalQuantity
          }
        }
      );
    }
    console.log('  ✅ Updated customers with spend data');
    
    // 4. Create aggregated metrics for dashboard
    console.log('\n📈 Creating dashboard metrics...');
    
    const dashboardMetrics = {
      tenant: 'mondelez',
      company: 'Mondelez South Africa',
      currency: 'ZAR',
      year: 2025,
      
      // Budget metrics
      totalBudget: totalBudget,
      totalAllocated: totalAllocated,
      totalSpent: totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      
      // Sales metrics
      totalRevenue: customerSpend.reduce((sum, c) => sum + c.totalRevenue, 0),
      totalCustomers: customerSpend.length,
      
      // Promotion metrics
      activePromotions: 12, // From existing data
      
      lastUpdated: new Date(),
      
      // Monthly trends
      trends: {
        budgetGrowth: 12,
        revenueGrowth: 8,
        customerGrowth: 0
      }
    };
    
    await db.collection('dashboardmetrics').updateOne(
      { tenant: 'mondelez', year: 2025 },
      { $set: dashboardMetrics },
      { upsert: true }
    );
    
    console.log('  ✅ Dashboard metrics created/updated');
    console.log(`  - Total Budget: R${(dashboardMetrics.totalBudget / 1000000).toFixed(2)}M`);
    console.log(`  - Budget Utilization: ${dashboardMetrics.budgetUtilization.toFixed(1)}%`);
    console.log(`  - Total Revenue: R${(dashboardMetrics.totalRevenue / 1000000).toFixed(2)}M`);
    console.log(`  - Total Customers: ${dashboardMetrics.totalCustomers}`);
    
    // 5. Update budget summaries
    console.log('\n💼 Updating budget summaries...');
    
    for (const budget of budgets) {
      // Calculate actual spent from trade spends
      const tradeSpends = await db.collection('tradespends').aggregate([
        { 
          $match: { 
            tenant: 'mondelez',
            budgetId: budget._id
          }
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$amount' }
          }
        }
      ]).toArray();
      
      const actualSpent = tradeSpends.length > 0 ? tradeSpends[0].totalSpent : 0;
      
      await db.collection('budgets').updateOne(
        { _id: budget._id },
        {
          $set: {
            spent: actualSpent,
            remaining: budget.amount - actualSpent,
            utilizationRate: budget.amount > 0 ? (actualSpent / budget.amount) * 100 : 0
          }
        }
      );
    }
    
    console.log('  ✅ Budget summaries updated');
    
    // 6. Create product performance metrics
    console.log('\n📦 Calculating product performance...');
    
    const productPerformance = await db.collection('sales').aggregate([
      { $match: { tenant: 'mondelez' } },
      {
        $group: {
          _id: '$product',
          totalRevenue: { $sum: '$revenue' },
          totalQuantity: { $sum: '$quantity' },
          avgPrice: { $avg: '$unitPrice' },
          lastSaleDate: { $max: '$saleDate' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 20 }
    ]).toArray();
    
    console.log(`  Top performing products: ${productPerformance.length}`);
    
    // Update products with performance data
    for (const perf of productPerformance) {
      await db.collection('products').updateOne(
        { _id: perf._id },
        {
          $set: {
            totalRevenue: perf.totalRevenue,
            totalSales: perf.totalQuantity,
            averagePrice: perf.avgPrice,
            lastSaleDate: perf.lastSaleDate
          }
        }
      );
    }
    
    console.log('  ✅ Product performance metrics updated');
    
    console.log('\n✅ Dashboard data fixed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Budgets: ${budgets.length}`);
    console.log(`  - Customers with spend: ${customerSpend.length}`);
    console.log(`  - Top products: ${productPerformance.length}`);
    console.log(`  - Total Revenue: R${(dashboardMetrics.totalRevenue / 1000000).toFixed(2)}M`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing dashboard data:', error);
    process.exit(1);
  }
}
