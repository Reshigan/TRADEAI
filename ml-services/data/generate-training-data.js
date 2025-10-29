#!/usr/bin/env node

/**
 * Standalone Training Data Generator
 * Generates JSON files for ML training without requiring MongoDB
 */

const fs = require('fs');
const path = require('path');

console.log(`\n🤖 TRADEAI AI TRAINING DATA GENERATOR`);
console.log(`================================================`);
console.log(`Generating 24 months of synthetic training data...`);

// Helper functions
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => Math.random() * (max - min) + min;

// Date helpers
const getDateString = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Seasonality factors
const getSeasonalityFactor = (date) => {
  const d = new Date(date);
  const month = d.getMonth();
  const dayOfWeek = d.getDay();
  
  // Monthly seasonality (South African retail patterns)
  const monthlyFactors = {
    0: 0.85,  // Jan (post-holiday dip)
    1: 0.90,  // Feb
    2: 0.95,  // Mar
    3: 0.95,  // Apr
    4: 1.00,  // May
    5: 0.95,  // Jun
    6: 0.95,  // Jul
    7: 1.05,  // Aug (back to school)
    8: 1.00,  // Sep
    9: 1.05,  // Oct
    10: 1.15, // Nov (festive prep)
    11: 1.30  // Dec (festive peak)
  };
  
  // Weekly seasonality
  const weeklyFactors = {
    0: 0.85,  // Sunday
    1: 0.95,  // Monday
    2: 0.95,  // Tuesday
    3: 1.00,  // Wednesday
    4: 1.05,  // Thursday
    5: 1.20,  // Friday (payday shopping)
    6: 1.10   // Saturday
  };
  
  return monthlyFactors[month] * weeklyFactors[dayOfWeek];
};

// Products
const products = [
  { id: 'prod-001', name: 'Cadbury Dairy Milk 150g', basePrice: 15.99, baseDemand: 1200 },
  { id: 'prod-002', name: 'Oreo Original 154g', basePrice: 12.99, baseDemand: 1000 },
  { id: 'prod-003', name: 'Cadbury Lunch Bar 48g', basePrice: 9.99, baseDemand: 800 },
  { id: 'prod-004', name: 'Halls Mentho-Lyptus', basePrice: 8.99, baseDemand: 600 },
  { id: 'prod-005', name: 'Cadbury PS Chocolate 80g', basePrice: 11.99, baseDemand: 900 },
  { id: 'prod-006', name: 'Bournvita 500g', basePrice: 45.99, baseDemand: 500 },
  { id: 'prod-007', name: 'Maynards Wine Gums 125g', basePrice: 13.99, baseDemand: 700 },
  { id: 'prod-008', name: 'Stimorol Gum', basePrice: 7.99, baseDemand: 550 },
  { id: 'prod-009', name: 'Cadbury Top Deck 80g', basePrice: 11.99, baseDemand: 850 },
  { id: 'prod-010', name: 'Cadbury Whispers 135g', basePrice: 19.99, baseDemand: 650 }
];

// Customers
const customers = [
  { id: 'cust-001', name: 'Shoprite Checkers', size: 'large' },
  { id: 'cust-002', name: 'Pick n Pay', size: 'large' },
  { id: 'cust-003', name: 'Woolworths', size: 'medium' },
  { id: 'cust-004', name: 'Spar', size: 'medium' },
  { id: 'cust-005', name: 'Boxer', size: 'small' }
];

// Promotions
const promotions = [
  { id: 'promo-2023-q1', name: 'Easter Chocolate', startDay: 670, endDay: 655, discount: 0.20 },
  { id: 'promo-2023-q2', name: 'Mothers Day', startDay: 610, endDay: 596, discount: 0.15 },
  { id: 'promo-2023-q3', name: 'Back to School', startDay: 550, endDay: 520, discount: 0.10 },
  { id: 'promo-2023-q4', name: 'Festive Season', startDay: 405, endDay: 360, discount: 0.25 },
  { id: 'promo-2024-q1', name: 'Easter Chocolate', startDay: 305, endDay: 290, discount: 0.20 },
  { id: 'promo-2024-q2', name: 'Mothers Day', startDay: 245, endDay: 231, discount: 0.15 },
  { id: 'promo-2024-q3', name: 'Back to School', startDay: 185, endDay: 155, discount: 0.10 },
  { id: 'promo-2024-q4', name: 'Festive Season', startDay: 40, endDay: 1, discount: 0.25 }
];

// Check if day is in promotion
const getActivePromotion = (daysAgo) => {
  return promotions.find(p => daysAgo <= p.startDay && daysAgo >= p.endDay);
};

console.log(`\n📊 Generating sales history...`);

// Generate sales history
const salesHistory = [];
let totalRevenue = 0;
let transactionCount = 0;

for (let daysAgo = 730; daysAgo >= 0; daysAgo--) {
  const date = getDateString(daysAgo);
  const seasonality = getSeasonalityFactor(date);
  const promo = getActivePromotion(daysAgo);
  
  products.forEach(product => {
    customers.forEach(customer => {
      // Base demand adjusted by seasonality
      let demand = product.baseDemand * seasonality;
      
      // Customer size factor
      const sizeFactor = customer.size === 'large' ? 1.5 : customer.size === 'medium' ? 1.0 : 0.6;
      demand *= sizeFactor;
      
      // Price (with random variations)
      let price = product.basePrice * (0.95 + Math.random() * 0.10);
      
      // Promotion effect
      if (promo) {
        price *= (1 - promo.discount);
        demand *= (1 + promo.discount * 1.5); // 50% elasticity to promotion
      }
      
      // Add random noise
      demand *= (0.85 + Math.random() * 0.30);
      
      // Round values
      demand = Math.round(demand);
      price = Math.round(price * 100) / 100;
      
      if (demand > 0) {
        salesHistory.push({
          _id: {
            date: date,
            product: product.id,
            customer: customer.id
          },
          product_name: product.name,
          customer_name: customer.name,
          quantity: demand,
          avg_price: price,
          revenue: Math.round(demand * price * 100) / 100,
          has_promotion: !!promo,
          promotion_id: promo ? promo.id : null
        });
        
        totalRevenue += demand * price;
        transactionCount++;
      }
    });
  });
}

console.log(`✅ Generated ${salesHistory.length} sales records`);
console.log(`   Total Revenue: R${Math.round(totalRevenue).toLocaleString()}`);

// Generate price elasticity data
console.log(`\n💰 Generating price elasticity data...`);

const priceElasticity = [];

products.forEach(product => {
  // Simulate different price points
  for (let priceMultiplier = 0.8; priceMultiplier <= 1.2; priceMultiplier += 0.05) {
    const price = product.basePrice * priceMultiplier;
    
    // Demand follows elasticity of -1.5 (typical for FMCG)
    const elasticity = -1.5;
    const demandMultiplier = Math.pow(priceMultiplier, elasticity);
    const demand = product.baseDemand * demandMultiplier;
    
    priceElasticity.push({
      _id: {
        product: product.id,
        price_point: Math.round(price * 100) / 100
      },
      product_name: product.name,
      avg_price: Math.round(price * 100) / 100,
      avg_quantity: Math.round(demand),
      revenue: Math.round(price * demand * 100) / 100,
      observations: getRandomInt(50, 200)
    });
  }
});

console.log(`✅ Generated ${priceElasticity.length} price-demand observations`);

// Generate promotion results
console.log(`\n🎯 Generating promotion results...`);

const promotionResults = promotions.map(promo => {
  const baseRevenue = getRandomFloat(50000, 200000);
  const lift = 0.15 + Math.random() * 0.15; // 15-30% lift
  const incrementalRevenue = baseRevenue * lift;
  const promoCost = baseRevenue * promo.discount * 0.3; // ~30% of discount value as cost
  const roi = (incrementalRevenue - promoCost) / promoCost;
  
  return {
    promotion_id: promo.id,
    promotion_name: promo.name,
    start_date: getDateString(promo.startDay),
    end_date: getDateString(promo.endDay),
    discount_percentage: promo.discount * 100,
    baseline_revenue: Math.round(baseRevenue),
    actual_revenue: Math.round(baseRevenue * (1 + lift)),
    incremental_lift: Math.round(lift * 100) / 100,
    promotion_cost: Math.round(promoCost),
    incremental_profit: Math.round(incrementalRevenue - promoCost),
    roi: Math.round(roi * 100) / 100,
    statistical_significance: true,
    p_value: 0.001
  };
});

console.log(`✅ Generated ${promotionResults.length} promotion analyses`);

// Generate customer interactions (for recommendations)
console.log(`\n🎁 Generating customer interactions...`);

const customerInteractions = [];

customers.forEach(customer => {
  products.forEach(product => {
    // Not every customer buys every product
    if (Math.random() > 0.3) {
      customerInteractions.push({
        user_id: customer.id,
        customer_name: customer.name,
        item_id: product.id,
        product_name: product.name,
        rating: 3 + Math.random() * 2, // 3-5 star rating
        interactions: getRandomInt(5, 50),
        last_purchase: getDateString(getRandomInt(1, 180)),
        affinity_score: Math.random()
      });
    }
  });
});

console.log(`✅ Generated ${customerInteractions.length} customer-product interactions`);

// Save all data to JSON files
console.log(`\n💾 Saving training data files...`);

const dataDir = __dirname;

fs.writeFileSync(
  path.join(dataDir, 'sales_history.json'),
  JSON.stringify(salesHistory, null, 2)
);
console.log(`✅ Saved sales_history.json (${(JSON.stringify(salesHistory).length / 1024 / 1024).toFixed(2)} MB)`);

fs.writeFileSync(
  path.join(dataDir, 'price_elasticity.json'),
  JSON.stringify(priceElasticity, null, 2)
);
console.log(`✅ Saved price_elasticity.json`);

fs.writeFileSync(
  path.join(dataDir, 'promotion_results.json'),
  JSON.stringify(promotionResults, null, 2)
);
console.log(`✅ Saved promotion_results.json`);

fs.writeFileSync(
  path.join(dataDir, 'customer_interactions.json'),
  JSON.stringify(customerInteractions, null, 2)
);
console.log(`✅ Saved customer_interactions.json`);

// Summary
console.log(`\n🎉 TRAINING DATA GENERATION COMPLETE`);
console.log(`================================================`);
console.log(`Files created:`);
console.log(`  1. sales_history.json - ${salesHistory.length} records`);
console.log(`  2. price_elasticity.json - ${priceElasticity.length} price points`);
console.log(`  3. promotion_results.json - ${promotionResults.length} promotions`);
console.log(`  4. customer_interactions.json - ${customerInteractions.length} interactions`);
console.log(``);
console.log(`Total Revenue: R${Math.round(totalRevenue).toLocaleString()}`);
console.log(`Total Transactions: ${transactionCount.toLocaleString()}`);
console.log(``);
console.log(`✅ Ready for ML model training!`);
console.log(`   Next step: cd ../training && python train_all_models.py`);
console.log(``);
