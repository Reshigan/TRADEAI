import { Hono } from 'hono';
import { getD1Client } from '../services/d1.js';

const seedRoutes = new Hono();

// Comprehensive seed data for ML testing
seedRoutes.post('/ml-data', async (c) => {
  try {
    const db = getD1Client(c);
    const companyId = 'comp-metro-001';
    const now = new Date();
    
    // Generate dates for historical data
    const getDate = (daysAgo) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString();
    };
    
    const getDateStr = (daysAgo) => getDate(daysAgo).split('T')[0];
    
    // Seed 50+ promotions with varied outcomes
    const promotionTypes = ['Discount', 'BOGO', 'Bundle', 'Rebate', 'Display', 'Sampling'];
    const promotionStatuses = ['completed', 'completed', 'completed', 'active', 'draft'];
    const customers = ['cust-001', 'cust-002', 'cust-003', 'cust-004', 'cust-005'];
    const products = ['prod-001', 'prod-002', 'prod-003', 'prod-004', 'prod-005'];
    
    const promotions = [];
    for (let i = 1; i <= 60; i++) {
      const daysAgo = Math.floor(Math.random() * 365);
      const duration = Math.floor(Math.random() * 30) + 7;
      const discount = Math.floor(Math.random() * 25) + 5;
      const budget = Math.floor(Math.random() * 50000) + 10000;
      const roi = (Math.random() * 3 + 0.5).toFixed(2);
      const uplift = (Math.random() * 30 + 5).toFixed(1);
      const status = promotionStatuses[Math.floor(Math.random() * promotionStatuses.length)];
      
      promotions.push({
        company_id: companyId,
        name: `Promotion ${i} - ${promotionTypes[i % promotionTypes.length]}`,
        description: `Historical promotion for ML training data`,
        promotion_type: promotionTypes[i % promotionTypes.length],
        status: status,
        start_date: getDateStr(daysAgo),
        end_date: getDateStr(daysAgo - duration),
        data: JSON.stringify({
          discount: discount,
          budget: budget,
          actualSpend: budget * (0.8 + Math.random() * 0.3),
          customerId: customers[i % customers.length],
          productId: products[i % products.length],
          performance: {
            roi: parseFloat(roi),
            uplift: parseFloat(uplift),
            incrementalRevenue: budget * parseFloat(roi),
            baselineRevenue: budget * 2,
            cannibalization: Math.floor(Math.random() * 10),
            haloEffect: Math.floor(Math.random() * 15)
          },
          mechanics: {
            type: promotionTypes[i % promotionTypes.length],
            discountPercent: discount,
            minPurchase: Math.floor(Math.random() * 500) + 100
          }
        })
      });
    }
    
    // Insert promotions
    for (const promo of promotions) {
      await db.insertOne('promotions', promo);
    }
    
    // Seed 30+ budgets across different years and categories
    const budgetCategories = ['Trade Promotions', 'Customer Rebates', 'Marketing Events', 'Product Launch', 'Contingency'];
    const years = [2024, 2025, 2026];
    
    const budgets = [];
    for (let i = 1; i <= 36; i++) {
      const year = years[i % years.length];
      const category = budgetCategories[i % budgetCategories.length];
      const amount = Math.floor(Math.random() * 500000) + 100000;
      const utilized = amount * (0.3 + Math.random() * 0.6);
      
      budgets.push({
        company_id: companyId,
        name: `${year} ${category} Budget`,
        year: year,
        amount: amount,
        utilized: utilized,
        budget_type: category,
        status: year < 2026 ? 'completed' : 'active',
        data: JSON.stringify({
          category: category,
          allocations: {
            q1: amount * 0.25,
            q2: amount * 0.25,
            q3: amount * 0.25,
            q4: amount * 0.25
          },
          performance: {
            roi: (1.5 + Math.random() * 2).toFixed(2),
            efficiency: (70 + Math.random() * 25).toFixed(1)
          }
        })
      });
    }
    
    for (const budget of budgets) {
      await db.insertOne('budgets', budget);
    }
    
    // Seed 100+ trade spends with different types and results
    const spendTypes = ['Display', 'Co-op Advertising', 'Slotting Fee', 'Volume Rebate', 'Promotion Support', 'Sampling', 'Demo'];
    const spendStatuses = ['approved', 'approved', 'approved', 'pending', 'completed'];
    
    const tradeSpends = [];
    for (let i = 1; i <= 120; i++) {
      const daysAgo = Math.floor(Math.random() * 180);
      const amount = Math.floor(Math.random() * 30000) + 5000;
      const spendType = spendTypes[i % spendTypes.length];
      const status = spendStatuses[Math.floor(Math.random() * spendStatuses.length)];
      
      tradeSpends.push({
        company_id: companyId,
        customer_id: customers[i % customers.length],
        amount: amount,
        spend_type: spendType,
        status: status,
        description: `Trade spend for ${spendType}`,
        data: JSON.stringify({
          productId: products[i % products.length],
          startDate: getDateStr(daysAgo),
          endDate: getDateStr(daysAgo - 30),
          actualROI: (1.5 + Math.random() * 2.5).toFixed(2),
          expectedROI: (2 + Math.random() * 1.5).toFixed(2),
          performance: {
            incrementalSales: amount * (1.5 + Math.random() * 2),
            compliance: (80 + Math.random() * 20).toFixed(1)
          }
        })
      });
    }
    
    for (const spend of tradeSpends) {
      await db.insertOne('trade_spends', spend);
    }
    
    // Seed 40+ claims with different statuses
    const claimStatuses = ['submitted', 'approved', 'rejected', 'paid', 'pending'];
    const claimTypes = ['Promotion Claim', 'Rebate Claim', 'Damage Claim', 'Shortage Claim'];
    
    for (let i = 1; i <= 45; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const amount = Math.floor(Math.random() * 15000) + 2000;
      const status = claimStatuses[Math.floor(Math.random() * claimStatuses.length)];
      
      await db.rawExecute(`
        INSERT INTO claims (id, company_id, customer_id, claim_number, claim_type, amount, status, submitted_date, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        companyId,
        customers[i % customers.length],
        `CLM-2026-${String(i).padStart(4, '0')}`,
        claimTypes[i % claimTypes.length],
        amount,
        status,
        getDateStr(daysAgo),
        JSON.stringify({
          description: `Claim for ${claimTypes[i % claimTypes.length]}`,
          supportingDocs: ['invoice.pdf', 'proof.jpg'],
          processingTime: Math.floor(Math.random() * 14) + 1
        }),
        getDate(daysAgo),
        now.toISOString()
      ]);
    }
    
    // Seed 40+ deductions with aging data
    const deductionStatuses = ['open', 'matched', 'disputed', 'written_off', 'resolved'];
    const deductionReasons = ['Pricing Discrepancy', 'Shortage', 'Damage', 'Promotion Deduction', 'Unauthorized Deduction'];
    
    for (let i = 1; i <= 45; i++) {
      const daysAgo = Math.floor(Math.random() * 120);
      const amount = Math.floor(Math.random() * 8000) + 1000;
      const status = deductionStatuses[Math.floor(Math.random() * deductionStatuses.length)];
      
      await db.rawExecute(`
        INSERT INTO deductions (id, company_id, customer_id, deduction_number, reason, amount, status, deduction_date, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        companyId,
        customers[i % customers.length],
        `DED-2026-${String(i).padStart(4, '0')}`,
        deductionReasons[i % deductionReasons.length],
        amount,
        status,
        getDateStr(daysAgo),
        JSON.stringify({
          invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
          agingBucket: daysAgo <= 30 ? '0-30' : daysAgo <= 60 ? '31-60' : daysAgo <= 90 ? '61-90' : '90+',
          matchedClaimId: status === 'matched' ? `CLM-2026-${String(Math.floor(Math.random() * 45) + 1).padStart(4, '0')}` : null
        }),
        getDate(daysAgo),
        now.toISOString()
      ]);
    }
    
    // Seed 25+ rebates with calculations
    const rebateTypes = ['Volume', 'Growth', 'Loyalty', 'Promotional', 'Tiered'];
    const rebateStatuses = ['active', 'pending', 'calculated', 'paid'];
    
    for (let i = 1; i <= 28; i++) {
      const amount = Math.floor(Math.random() * 25000) + 5000;
      const rate = (Math.random() * 5 + 1).toFixed(2);
      const status = rebateStatuses[Math.floor(Math.random() * rebateStatuses.length)];
      
      await db.rawExecute(`
        INSERT INTO rebates (id, company_id, customer_id, rebate_number, rebate_type, rate, amount, status, start_date, end_date, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        companyId,
        customers[i % customers.length],
        `REB-2026-${String(i).padStart(4, '0')}`,
        rebateTypes[i % rebateTypes.length],
        parseFloat(rate),
        amount,
        status,
        getDateStr(90),
        getDateStr(0),
        JSON.stringify({
          targetVolume: Math.floor(Math.random() * 100000) + 50000,
          actualVolume: Math.floor(Math.random() * 120000) + 40000,
          tiers: [
            { threshold: 50000, rate: 1 },
            { threshold: 75000, rate: 2 },
            { threshold: 100000, rate: 3 }
          ],
          calculatedAmount: amount * (0.8 + Math.random() * 0.4)
        }),
        getDate(90),
        now.toISOString()
      ]);
    }
    
    return c.json({
      success: true,
      message: 'ML training data seeded successfully',
      counts: {
        promotions: promotions.length,
        budgets: budgets.length,
        tradeSpends: tradeSpends.length,
        claims: 45,
        deductions: 45,
        rebates: 28
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get ML statistics from seeded data
seedRoutes.get('/ml-stats', async (c) => {
  try {
    const db = getD1Client(c);
    const companyId = 'comp-metro-001';
    
    // Get promotion statistics
    const promotions = await db.find('promotions', { company_id: companyId });
    const completedPromos = promotions.filter(p => p.status === 'completed');
    
    // Calculate average ROI by promotion type
    const roiByType = {};
    const upliftByType = {};
    const countByType = {};
    
    completedPromos.forEach(p => {
      const type = p.promotion_type || 'Other';
      const perf = p.performance || {};
      
      if (!roiByType[type]) {
        roiByType[type] = 0;
        upliftByType[type] = 0;
        countByType[type] = 0;
      }
      
      roiByType[type] += perf.roi || 0;
      upliftByType[type] += perf.uplift || 0;
      countByType[type]++;
    });
    
    const avgRoiByType = {};
    const avgUpliftByType = {};
    Object.keys(roiByType).forEach(type => {
      avgRoiByType[type] = (roiByType[type] / countByType[type]).toFixed(2);
      avgUpliftByType[type] = (upliftByType[type] / countByType[type]).toFixed(1);
    });
    
    // Get budget statistics
    const budgets = await db.find('budgets', { company_id: companyId });
    const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalUtilized = budgets.reduce((sum, b) => sum + (b.utilized || 0), 0);
    
    // Get trade spend statistics
    const tradeSpends = await db.find('trade_spends', { company_id: companyId });
    const totalSpend = tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0);
    const avgSpendROI = tradeSpends.reduce((sum, ts) => sum + (parseFloat(ts.actualROI) || 0), 0) / tradeSpends.length;
    
    return c.json({
      success: true,
      stats: {
        promotions: {
          total: promotions.length,
          completed: completedPromos.length,
          avgRoiByType,
          avgUpliftByType,
          overallAvgROI: (completedPromos.reduce((sum, p) => sum + (p.performance?.roi || 0), 0) / completedPromos.length).toFixed(2)
        },
        budgets: {
          total: budgets.length,
          totalAmount: totalBudget,
          totalUtilized: totalUtilized,
          utilizationRate: ((totalUtilized / totalBudget) * 100).toFixed(1)
        },
        tradeSpends: {
          total: tradeSpends.length,
          totalAmount: totalSpend,
          avgROI: avgSpendROI.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { seedRoutes };
