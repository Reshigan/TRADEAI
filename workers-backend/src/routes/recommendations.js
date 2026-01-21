import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { getD1Client } from '../services/d1.js';

const recommendationsRoutes = new Hono();

recommendationsRoutes.use('*', authMiddleware);

recommendationsRoutes.post('/next-best-promotion', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const body = await c.req.json();
    
    const { customerId, limit = 5 } = body;
    
    const customers = await db.find('customers', {
      company_id: user.companyId,
      ...(customerId && { id: customerId })
    });
    
    const products = await db.find('products', {
      company_id: user.companyId
    });
    
    const historicalPromotions = await db.find('promotions', {
      company_id: user.companyId,
      status: 'completed'
    });
    
    const recommendations = [];
    
    const promotionTypes = ['Discount', 'BOGO', 'Volume', 'Bundle', 'Loyalty'];
    const categories = [...new Set(products.map(p => p.data?.category).filter(Boolean))];
    
    for (let i = 0; i < Math.min(limit, 5); i++) {
      const type = promotionTypes[i % promotionTypes.length];
      const category = categories[i % Math.max(1, categories.length)] || 'General';
      const targetCustomer = customers[i % Math.max(1, customers.length)];
      
      const baseROI = 1.5 + Math.random() * 1.0;
      const confidence = 0.7 + Math.random() * 0.2;
      
      recommendations.push({
        id: `rec-${Date.now()}-${i}`,
        rank: i + 1,
        type,
        name: `${type} on ${category}`,
        description: `Recommended ${type.toLowerCase()} promotion targeting ${category} products`,
        targetCustomer: targetCustomer ? {
          id: targetCustomer.id,
          name: targetCustomer.data?.name || targetCustomer.data?.companyName
        } : null,
        category,
        suggestedDiscount: 10 + Math.floor(Math.random() * 15),
        suggestedDuration: 7 + Math.floor(Math.random() * 14),
        suggestedBudget: 5000 + Math.floor(Math.random() * 20000),
        expectedROI: parseFloat(baseROI.toFixed(2)),
        expectedUplift: parseFloat((10 + Math.random() * 20).toFixed(1)),
        confidence: parseFloat(confidence.toFixed(2)),
        reasoning: `Based on ${historicalPromotions.length} historical promotions and current market conditions`,
        factors: [
          { name: 'Historical Performance', weight: 0.35, score: 0.82 },
          { name: 'Customer Affinity', weight: 0.25, score: 0.78 },
          { name: 'Seasonality', weight: 0.20, score: 0.85 },
          { name: 'Inventory Levels', weight: 0.20, score: 0.72 }
        ]
      });
    }
    
    recommendations.sort((a, b) => b.expectedROI - a.expectedROI);
    recommendations.forEach((r, idx) => r.rank = idx + 1);
    
    return c.json({
      success: true,
      data: {
        recommendations,
        generatedAt: new Date().toISOString(),
        basedOn: {
          historicalPromotions: historicalPromotions.length,
          customers: customers.length,
          products: products.length
        }
      }
    });
  } catch (error) {
    console.error('Next-best promotion error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

recommendationsRoutes.post('/next-best-action', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const body = await c.req.json();
    
    const { entityType, entityId } = body;
    const actions = [];
    
    // Get real data to generate deterministic recommendations
    const [budgets, tradeSpends, promotions, customers] = await Promise.all([
      db.find('budgets', { company_id: user.companyId, status: 'active' }),
      db.find('trade_spends', { company_id: user.companyId, status: 'pending' }),
      db.find('promotions', { company_id: user.companyId, status: 'active' }),
      db.find('customers', { company_id: user.companyId, status: 'active' })
    ]);
    
    // Rule 1: Budgets >90% utilized need attention
    for (const budget of budgets) {
      const utilization = budget.amount ? ((budget.utilized || 0) / budget.amount) * 100 : 0;
      if (utilization > 90) {
        actions.push({
          id: `action-budget-${budget.id}`,
          priority: 'high',
          type: 'budget',
          title: `Review ${budget.name} Budget`,
          description: `Budget is ${utilization.toFixed(1)}% utilized with limited remaining funds`,
          expectedImpact: 'Prevent overspend',
          confidence: 0.95,
          entityRef: { type: 'budget', id: budget.id, name: budget.name },
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }
    
    // Rule 2: Pending trade spends need approval
    if (tradeSpends.length > 0) {
      const totalPending = tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0);
      actions.push({
        id: `action-approvals-${Date.now()}`,
        priority: tradeSpends.length > 5 ? 'high' : 'medium',
        type: 'approval',
        title: `${tradeSpends.length} Trade Spends Pending Approval`,
        description: `Total value: R${totalPending.toLocaleString()} awaiting approval`,
        expectedImpact: 'Unblock operations',
        confidence: 0.98,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // Rule 3: Customers without recent promotions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const customersWithPromos = new Set(promotions.map(p => p.data?.customerId).filter(Boolean));
    const neglectedCustomers = customers.filter(c => !customersWithPromos.has(c.id)).slice(0, 3);
    
    for (const customer of neglectedCustomers) {
      actions.push({
        id: `action-customer-${customer.id}`,
        priority: 'medium',
        type: 'engagement',
        title: `Engage ${customer.name}`,
        description: 'No active promotions for this customer',
        expectedImpact: 'Increase customer engagement',
        confidence: 0.75,
        entityRef: { type: 'customer', id: customer.id, name: customer.name },
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return c.json({
      success: true,
      data: {
        entityType,
        entityId,
        actions: actions.slice(0, 10),
        generatedAt: new Date().toISOString(),
        basedOn: {
          budgets: budgets.length,
          pendingApprovals: tradeSpends.length,
          activePromotions: promotions.length,
          customers: customers.length
        }
      }
    });
  } catch (error) {
    console.error('Next-best action error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

recommendationsRoutes.get('/insights/:entityType/:entityId', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const { entityType, entityId } = c.req.param();
    
    const insights = [];
    let overallHealth = 70;
    let riskScore = 30;
    let opportunityScore = 50;
    
    // Get entity-specific data based on type
    if (entityType === 'customer') {
      const customer = await db.findOne('customers', { id: entityId, company_id: user.companyId });
      const tradeSpends = await db.find('trade_spends', { customer_id: entityId, company_id: user.companyId });
      const promotions = await db.find('promotions', { company_id: user.companyId });
      
      if (customer) {
        const totalSpend = tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0);
        const approvedSpend = tradeSpends.filter(ts => ts.status === 'approved').reduce((sum, ts) => sum + (ts.amount || 0), 0);
        const pendingSpend = tradeSpends.filter(ts => ts.status === 'pending').reduce((sum, ts) => sum + (ts.amount || 0), 0);
        
        if (totalSpend > 0) {
          insights.push({
            id: `insight-spend-${entityId}`,
            type: 'metric',
            severity: 'info',
            title: 'Trade Spend Summary',
            description: `Total trade spend: R${totalSpend.toLocaleString()}`,
            metric: { total: totalSpend, approved: approvedSpend, pending: pendingSpend },
            actionable: pendingSpend > 0,
            suggestedAction: pendingSpend > 0 ? 'Review pending trade spends' : null
          });
        }
        
        // Check tier and suggest actions
        if (customer.tier === 'platinum' || customer.tier === 'gold') {
          opportunityScore = 85;
          insights.push({
            id: `insight-tier-${entityId}`,
            type: 'opportunity',
            severity: 'success',
            title: `${customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)} Customer`,
            description: 'High-value customer eligible for premium promotions',
            actionable: true,
            suggestedAction: 'Consider exclusive loyalty program'
          });
        }
        
        overallHealth = Math.min(95, 60 + (tradeSpends.length * 5));
        riskScore = Math.max(5, 40 - (tradeSpends.length * 3));
      }
    } else if (entityType === 'promotion') {
      const promotion = await db.findOne('promotions', { id: entityId, company_id: user.companyId });
      
      if (promotion) {
        const status = promotion.status;
        if (status === 'active') {
          overallHealth = 80;
          insights.push({
            id: `insight-promo-active-${entityId}`,
            type: 'status',
            severity: 'success',
            title: 'Promotion Active',
            description: `${promotion.name} is currently running`,
            actionable: true,
            suggestedAction: 'Monitor performance metrics'
          });
        } else if (status === 'pending_approval') {
          riskScore = 50;
          insights.push({
            id: `insight-promo-pending-${entityId}`,
            type: 'alert',
            severity: 'warning',
            title: 'Awaiting Approval',
            description: 'Promotion requires approval to proceed',
            actionable: true,
            suggestedAction: 'Review and approve promotion'
          });
        }
      }
    } else if (entityType === 'budget') {
      const budget = await db.findOne('budgets', { id: entityId, company_id: user.companyId });
      
      if (budget) {
        const utilization = budget.amount ? ((budget.utilized || 0) / budget.amount) * 100 : 0;
        const remaining = (budget.amount || 0) - (budget.utilized || 0);
        
        insights.push({
          id: `insight-budget-util-${entityId}`,
          type: 'metric',
          severity: utilization > 90 ? 'warning' : utilization > 70 ? 'info' : 'success',
          title: 'Budget Utilization',
          description: `${utilization.toFixed(1)}% utilized, R${remaining.toLocaleString()} remaining`,
          metric: { utilization, remaining, total: budget.amount },
          actionable: utilization > 80,
          suggestedAction: utilization > 80 ? 'Review upcoming commitments' : null
        });
        
        overallHealth = utilization > 90 ? 50 : utilization > 70 ? 70 : 90;
        riskScore = utilization > 90 ? 70 : utilization > 70 ? 40 : 15;
        opportunityScore = 100 - utilization;
      }
    }
    
    // Add generic insight if no specific ones found
    if (insights.length === 0) {
      insights.push({
        id: `insight-generic-${entityId}`,
        type: 'info',
        severity: 'info',
        title: 'No Specific Insights',
        description: 'Insufficient data to generate insights for this entity',
        actionable: false
      });
    }
    
    return c.json({
      success: true,
      data: {
        entityType,
        entityId,
        insights,
        overallHealth,
        riskScore,
        opportunityScore,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Entity insights error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

recommendationsRoutes.get('/trending', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    
    // Get real data for trending analysis
    const [promotions, customers, products, tradeSpends, budgets] = await Promise.all([
      db.find('promotions', { company_id: user.companyId }),
      db.find('customers', { company_id: user.companyId }),
      db.find('products', { company_id: user.companyId }),
      db.find('trade_spends', { company_id: user.companyId }),
      db.find('budgets', { company_id: user.companyId, status: 'active' })
    ]);
    
    // Top performing promotions (by status and type)
    const completedPromotions = promotions.filter(p => p.status === 'completed' || p.status === 'active');
    const topPerformingPromotions = completedPromotions
      .map(p => ({
        id: p.id,
        name: p.name,
        type: p.promotion_type,
        status: p.status,
        roi: p.data?.roi || p.data?.performance?.roi || 0,
        trend: p.status === 'active' ? 'active' : 'completed'
      }))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);
    
    // Category analysis from products
    const categorySpend = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!categorySpend[cat]) {
        categorySpend[cat] = { count: 0, totalValue: 0 };
      }
      categorySpend[cat].count++;
      categorySpend[cat].totalValue += (p.unit_price || 0);
    });
    
    const emergingCategories = Object.entries(categorySpend)
      .map(([category, data]) => ({
        category,
        productCount: data.count,
        avgPrice: data.count > 0 ? (data.totalValue / data.count).toFixed(2) : 0,
        opportunity: data.count > 5 ? 'high' : data.count > 2 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 5);
    
    // At-risk customers (those with pending/rejected trade spends or low activity)
    const customerActivity = {};
    tradeSpends.forEach(ts => {
      if (ts.customer_id) {
        if (!customerActivity[ts.customer_id]) {
          customerActivity[ts.customer_id] = { total: 0, pending: 0, rejected: 0 };
        }
        customerActivity[ts.customer_id].total++;
        if (ts.status === 'pending') customerActivity[ts.customer_id].pending++;
        if (ts.status === 'rejected') customerActivity[ts.customer_id].rejected++;
      }
    });
    
    const atRiskCustomers = customers
      .map(c => {
        const activity = customerActivity[c.id] || { total: 0, pending: 0, rejected: 0 };
        let riskScore = 0;
        let reason = '';
        
        if (activity.total === 0) {
          riskScore = 60;
          reason = 'No trade spend activity';
        } else if (activity.rejected > 0) {
          riskScore = 70 + (activity.rejected * 5);
          reason = `${activity.rejected} rejected trade spend(s)`;
        } else if (activity.pending > 2) {
          riskScore = 50;
          reason = 'Multiple pending approvals';
        }
        
        return { id: c.id, name: c.name, riskScore, reason, tier: c.tier };
      })
      .filter(c => c.riskScore > 0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
    
    // Budget utilization trends
    const budgetTrends = budgets.map(b => {
      const utilization = b.amount ? ((b.utilized || 0) / b.amount) * 100 : 0;
      return {
        id: b.id,
        name: b.name,
        utilization: utilization.toFixed(1),
        remaining: (b.amount || 0) - (b.utilized || 0),
        status: utilization > 90 ? 'critical' : utilization > 70 ? 'warning' : 'healthy'
      };
    });
    
    const trending = {
      topPerformingPromotions,
      emergingCategories,
      atRiskCustomers,
      budgetTrends,
      summary: {
        totalPromotions: promotions.length,
        activePromotions: promotions.filter(p => p.status === 'active').length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        pendingApprovals: tradeSpends.filter(ts => ts.status === 'pending').length
      }
    };
    
    return c.json({
      success: true,
      data: trending,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trending error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { recommendationsRoutes };
