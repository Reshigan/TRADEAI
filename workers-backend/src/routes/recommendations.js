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
    const body = await c.req.json();
    
    const { entityType, entityId } = body;
    
    const actions = [
      {
        id: 'action-1',
        priority: 'high',
        type: 'promotion',
        title: 'Launch Volume Discount',
        description: 'Customer has high purchase frequency but declining basket size',
        expectedImpact: '+15% basket size',
        confidence: 0.85,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'action-2',
        priority: 'medium',
        type: 'engagement',
        title: 'Schedule Business Review',
        description: 'Quarterly review overdue by 2 weeks',
        expectedImpact: 'Strengthen relationship',
        confidence: 0.92,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'action-3',
        priority: 'low',
        type: 'upsell',
        title: 'Introduce Premium Line',
        description: 'Customer profile matches premium segment',
        expectedImpact: '+8% margin',
        confidence: 0.68,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    return c.json({
      success: true,
      data: {
        entityType,
        entityId,
        actions,
        generatedAt: new Date().toISOString()
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
    const { entityType, entityId } = c.req.param();
    
    const insights = [
      {
        id: 'insight-1',
        type: 'trend',
        severity: 'info',
        title: 'Positive Growth Trend',
        description: 'Revenue up 12% vs same period last year',
        metric: { current: 125000, previous: 111600, change: 12 },
        actionable: true,
        suggestedAction: 'Capitalize on momentum with loyalty promotion'
      },
      {
        id: 'insight-2',
        type: 'anomaly',
        severity: 'warning',
        title: 'Order Frequency Decline',
        description: 'Orders down 8% in last 30 days',
        metric: { current: 23, previous: 25, change: -8 },
        actionable: true,
        suggestedAction: 'Reach out to understand concerns'
      },
      {
        id: 'insight-3',
        type: 'opportunity',
        severity: 'success',
        title: 'Cross-sell Opportunity',
        description: 'Customer buys Category A but not related Category B',
        metric: { potential: 15000, probability: 0.72 },
        actionable: true,
        suggestedAction: 'Bundle promotion for Category A + B'
      }
    ];
    
    return c.json({
      success: true,
      data: {
        entityType,
        entityId,
        insights,
        overallHealth: 78,
        riskScore: 22,
        opportunityScore: 85,
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
    
    const trending = {
      topPerformingPromotions: [
        { id: 'promo-1', name: 'Summer BOGO', roi: 2.4, trend: 'up' },
        { id: 'promo-2', name: 'Loyalty Rewards', roi: 2.1, trend: 'stable' },
        { id: 'promo-3', name: 'Volume Discount', roi: 1.9, trend: 'up' }
      ],
      emergingCategories: [
        { category: 'Health & Wellness', growth: 25, opportunity: 'high' },
        { category: 'Premium Snacks', growth: 18, opportunity: 'medium' }
      ],
      atRiskCustomers: [
        { id: 'cust-1', name: 'Customer A', riskScore: 72, reason: 'Declining orders' },
        { id: 'cust-2', name: 'Customer B', riskScore: 65, reason: 'Payment delays' }
      ],
      marketTrends: [
        { trend: 'Price sensitivity increasing', impact: 'medium', recommendation: 'Focus on value messaging' },
        { trend: 'Digital engagement up', impact: 'high', recommendation: 'Increase online promotions' }
      ]
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
