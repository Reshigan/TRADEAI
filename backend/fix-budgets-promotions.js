const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/tradeai', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
  fixBudgetsAndPromotions();
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

async function fixBudgetsAndPromotions() {
  try {
    const db = mongoose.connection.db;
    
    // 1. Fix budgets - copy allocated to amount if amount is missing/0
    console.log('\n💰 Fixing Budgets...');
    
    const budgets = await db.collection('budgets').find({ tenant: 'mondelez' }).toArray();
    let fixedCount = 0;
    
    for (const budget of budgets) {
      if (!budget.amount || budget.amount === 0) {
        const amount = budget.allocated || 2500000; // Use allocated or default to 2.5M
        await db.collection('budgets').updateOne(
          { _id: budget._id },
          { 
            $set: { 
              amount: amount,
              remaining: amount - (budget.spent || 0),
              utilizationRate: amount > 0 ? ((budget.spent || 0) / amount) * 100 : 0
            } 
          }
        );
        fixedCount++;
      }
    }
    
    console.log(`  ✅ Fixed ${fixedCount} budgets`);
    
    // Verify
    const sampleBudgets = await db.collection('budgets').find({ tenant: 'mondelez' }).limit(3).toArray();
    console.log('  Sample budgets:');
    sampleBudgets.forEach(b => {
      console.log(`    - ${b.name}: R${((b.amount || 0) / 1000000).toFixed(2)}M`);
    });
    
    // Calculate total
    const totalResult = await db.collection('budgets').aggregate([
      { $match: { tenant: 'mondelez' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    const totalBudget = totalResult[0]?.total || 0;
    console.log(`  Total Budget: R${(totalBudget / 1000000).toFixed(2)}M`);
    
    // 2. Create active promotions
    console.log('\n🎉 Creating Active Promotions...');
    
    const products = await db.collection('products').find({ tenant: 'mondelez' }).limit(6).toArray();
    const promotions = [];
    
    const promoTypes = ['BOGO', 'Discount', 'Bundle', 'Free Gift', 'Volume Discount'];
    const today = new Date();
    const endDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
    
    for (let i = 0; i < Math.min(5, products.length); i++) {
      const promo = {
        tenant: 'mondelez',
        promotionId: `PROMO-SA-${Date.now()}-${i}`,
        name: `${products[i].name} ${promoTypes[i]}`,
        description: `Special ${promoTypes[i]} promotion for ${products[i].name}`,
        type: promoTypes[i],
        status: 'active',
        startDate: today,
        endDate: endDate,
        productIds: [products[i]._id],
        discount: (i + 1) * 5,
        currency: 'ZAR',
        targetCustomers: 'all',
        budget: 500000,
        spent: (i + 1) * 25000,
        createdAt: today,
        updatedAt: today
      };
      
      await db.collection('promotions').insertOne(promo);
      promotions.push(promo);
    }
    
    console.log(`  ✅ Created ${promotions.length} active promotions`);
    promotions.forEach((p, idx) => {
      console.log(`    ${idx + 1}. ${p.name} - ${p.discount}% off (R${(p.budget / 1000).toFixed(0)}K budget)`);
    });
    
    // 3. Update dashboard metrics
    console.log('\n📊 Updating Dashboard Metrics...');
    await db.collection('dashboardmetrics').updateOne(
      { tenant: 'mondelez', year: 2025 },
      { 
        $set: { 
          totalBudget: totalBudget,
          activePromotions: promotions.length,
          lastUpdated: new Date()
        } 
      }
    );
    console.log(`  ✅ Dashboard updated`);
    
    console.log('\n✅ ALL FIXED!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}
