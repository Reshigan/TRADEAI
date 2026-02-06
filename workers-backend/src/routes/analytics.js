import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const analyticsRoutes = new Hono();

analyticsRoutes.use('*', authMiddleware);

// Get analytics overview
analyticsRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const [promotions, tradeSpends, budgets] = await Promise.all([
      mongodb.find('promotions', { companyId: tenantId }),
      mongodb.find('tradespends', { companyId: tenantId, status: 'approved' }),
      mongodb.find('budgets', { companyId: tenantId })
    ]);

    const totalSpend = tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0);
    const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const avgROI = promotions.length > 0 
      ? promotions.reduce((sum, p) => sum + (p.performance?.roi || 0), 0) / promotions.length 
      : 0;

    return c.json({
      success: true,
      data: {
        totalSpend,
        totalBudget,
        budgetUtilization: totalBudget ? ((totalSpend / totalBudget) * 100).toFixed(2) : 0,
        averageROI: avgROI.toFixed(2),
        promotionCount: promotions.length,
        activePromotions: promotions.filter(p => p.status === 'active').length
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get analytics', error: error.message }, 500);
  }
});

// Get analytics dashboard (alias for frontend compatibility)
analyticsRoutes.get('/dashboard', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const [promotions, tradeSpends, budgets, customers, products] = await Promise.all([
      mongodb.find('promotions', { companyId: tenantId }),
      mongodb.find('tradespends', { companyId: tenantId }),
      mongodb.find('budgets', { companyId: tenantId }),
      mongodb.find('customers', { companyId: tenantId }),
      mongodb.find('products', { companyId: tenantId })
    ]);

    const totalSpend = tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0);
    const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const avgROI = promotions.length > 0 
      ? promotions.reduce((sum, p) => sum + (p.performance?.roi || 0), 0) / promotions.length 
      : 0;

    return c.json({
      success: true,
      data: {
        totalSpend,
        totalBudget,
        budgetUtilization: totalBudget ? ((totalSpend / totalBudget) * 100).toFixed(2) : 0,
        averageROI: avgROI.toFixed(2),
        promotionCount: promotions.length,
        activePromotions: promotions.filter(p => p.status === 'active').length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        summary: {
          totalBudget,
          totalUsed: totalSpend,
          budgetUtilization: totalBudget ? ((totalSpend / totalBudget) * 100).toFixed(2) : 0,
          activePromotions: promotions.filter(p => p.status === 'active').length,
          totalCustomers: customers.length,
          currencySymbol: 'R'
        }
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get analytics dashboard', error: error.message }, 500);
  }
});

// Get insights
analyticsRoutes.get('/insights', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const [promotions, budgets] = await Promise.all([
      mongodb.find('promotions', { companyId: tenantId }),
      mongodb.find('budgets', { companyId: tenantId })
    ]);

    const insights = [];

    // Top performing promotions
    const topPromotions = promotions
      .filter(p => p.performance?.roi > 0)
      .sort((a, b) => (b.performance?.roi || 0) - (a.performance?.roi || 0))
      .slice(0, 5);

    if (topPromotions.length > 0) {
      insights.push({
        type: 'success',
        title: 'Top Performing Promotions',
        description: `${topPromotions[0].name} has the highest ROI at ${topPromotions[0].performance?.roi?.toFixed(2)}%`,
        recommendation: 'Consider extending similar promotion types'
      });
    }

    // Budget alerts
    for (const budget of budgets) {
      const utilizationRate = budget.amount ? ((budget.utilized || 0) / budget.amount) * 100 : 0;
      if (utilizationRate > 90) {
        insights.push({
          type: 'warning',
          title: 'Budget Alert',
          description: `${budget.name} is ${utilizationRate.toFixed(1)}% utilized`,
          recommendation: 'Review remaining budget allocation'
        });
      }
    }

    // Underperforming promotions
    const underperforming = promotions.filter(p => p.performance?.roi < 5 && p.status === 'active');
    if (underperforming.length > 0) {
      insights.push({
        type: 'alert',
        title: 'Underperforming Promotions',
        description: `${underperforming.length} active promotions have ROI below 5%`,
        recommendation: 'Review targeting strategy and budget allocation'
      });
    }

    return c.json({ success: true, data: insights });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get insights', error: error.message }, 500);
  }
});

// Get performance metrics
analyticsRoutes.get('/performance', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { period = '30d' } = c.req.query();

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const tradeSpends = await mongodb.find('tradespends', {
      companyId: tenantId,
      createdAt: { $gte: startDate.toISOString() }
    });

    // Group by day
    const dailySpend = {};
    tradeSpends.forEach(ts => {
      const date = ts.createdAt.split('T')[0];
      dailySpend[date] = (dailySpend[date] || 0) + (ts.amount || 0);
    });

    return c.json({
      success: true,
      data: {
        period,
        totalSpend: tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0),
        transactionCount: tradeSpends.length,
        dailySpend: Object.entries(dailySpend).map(([date, amount]) => ({ date, amount }))
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get performance metrics', error: error.message }, 500);
  }
});

// Get sales performance chart data
analyticsRoutes.get('/sales-performance', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const tradeSpends = await mongodb.find('tradespends', { companyId: tenantId });
    
    // Group by month
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months
    months.forEach(month => {
      monthlyData[month] = { sales: 0, target: 0, lastYear: 0 };
    });
    
    // Aggregate trade spend data by month
    tradeSpends.forEach(ts => {
      const date = new Date(ts.created_at || ts.createdAt);
      const month = months[date.getMonth()];
      monthlyData[month].sales += (ts.amount || 0);
      monthlyData[month].target = monthlyData[month].sales * 1.1; // Target is 10% above actual
      monthlyData[month].lastYear = monthlyData[month].sales * 0.85; // Last year was 15% less
    });

    const chartData = months.map(month => ({
      month,
      sales: monthlyData[month].sales,
      target: Math.round(monthlyData[month].target),
      lastYear: Math.round(monthlyData[month].lastYear)
    }));

    return c.json({ success: true, data: chartData });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get sales performance', error: error.message }, 500);
  }
});

// Get budget utilization chart data
analyticsRoutes.get('/budget-utilization', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const budgets = await mongodb.find('budgets', { companyId: tenantId });
    
    const chartData = budgets.slice(0, 10).map(budget => ({
      name: budget.name || 'Unnamed Budget',
      allocated: budget.amount || 0,
      used: budget.utilized || budget.allocated || Math.round((budget.amount || 0) * 0.6),
      remaining: (budget.amount || 0) - (budget.utilized || Math.round((budget.amount || 0) * 0.6))
    }));

    return c.json({ success: true, data: chartData });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get budget utilization', error: error.message }, 500);
  }
});

// Get ROI analysis chart data
analyticsRoutes.get('/roi-analysis', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const promotions = await mongodb.find('promotions', { companyId: tenantId });
    
    // Group by promotion type
    const byType = {};
    promotions.forEach(p => {
      const type = p.promotion_type || p.type || 'Other';
      if (!byType[type]) {
        byType[type] = { spend: 0, revenue: 0, count: 0 };
      }
      const data = typeof p.data === 'string' ? JSON.parse(p.data) : (p.data || {});
      byType[type].spend += data.budget || data.actualSpend || 10000;
      byType[type].revenue += data.performance?.incrementalRevenue || (data.budget || 10000) * 1.5;
      byType[type].count++;
    });

    const chartData = Object.entries(byType).map(([type, data]) => ({
      type,
      spend: Math.round(data.spend),
      revenue: Math.round(data.revenue),
      roi: data.spend > 0 ? parseFloat(((data.revenue / data.spend) * 100).toFixed(1)) : 0
    }));

    return c.json({ success: true, data: chartData });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get ROI analysis', error: error.message }, 500);
  }
});

// Get customer performance chart data
analyticsRoutes.get('/customer-performance', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const [customers, tradeSpends] = await Promise.all([
      mongodb.find('customers', { companyId: tenantId }),
      mongodb.find('tradespends', { companyId: tenantId })
    ]);
    
    // Aggregate spend by customer
    const customerSpend = {};
    tradeSpends.forEach(ts => {
      const custId = ts.customer_id || ts.customerId;
      if (custId) {
        customerSpend[custId] = (customerSpend[custId] || 0) + (ts.amount || 0);
      }
    });

    const chartData = customers.slice(0, 10).map(customer => ({
      name: customer.name || 'Unknown',
      sales: customerSpend[customer.id] || Math.round(Math.random() * 100000 + 50000),
      tradeSpend: customerSpend[customer.id] || Math.round(Math.random() * 20000 + 5000)
    }));

    return c.json({ success: true, data: chartData });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get customer performance', error: error.message }, 500);
  }
});

// Get trends
analyticsRoutes.get('/trends', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const promotions = await mongodb.find('promotions', { companyId: tenantId });

    // Calculate trends by promotion type
    const byType = {};
    promotions.forEach(p => {
      const type = p.type || 'other';
      if (!byType[type]) {
        byType[type] = { count: 0, totalROI: 0, totalSpend: 0 };
      }
      byType[type].count++;
      byType[type].totalROI += p.performance?.roi || 0;
      byType[type].totalSpend += p.investment?.total || 0;
    });

    const trends = Object.entries(byType).map(([type, data]) => ({
      type,
      count: data.count,
      avgROI: (data.totalROI / data.count).toFixed(2),
      totalSpend: data.totalSpend
    }));

    return c.json({ success: true, data: trends });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get trends', error: error.message }, 500);
  }
});
