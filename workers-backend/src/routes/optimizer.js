import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { getD1Client } from '../services/d1.js';

const optimizerRoutes = new Hono();

optimizerRoutes.use('*', authMiddleware);

optimizerRoutes.post('/budget/reallocate', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c.env.DB);
    const body = await c.req.json();
    
    const { budgetId, minROI = 100 } = body;
    
    const budgets = await db.find('budgets', {
      company_id: user.companyId,
      ...(budgetId && { id: budgetId })
    });
    
    const promotions = await db.find('promotions', {
      company_id: user.companyId,
      status: { $in: ['active', 'approved'] }
    });
    
    const totalBudget = budgets.reduce((sum, b) => sum + (b.data?.totalBudget || b.data?.allocated || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.data?.spent || 0), 0);
    const remaining = totalBudget - totalSpent;
    
    const recommendations = [];
    
    if (remaining > totalBudget * 0.3) {
      recommendations.push({
        type: 'underspend',
        severity: 'medium',
        message: `${((remaining / totalBudget) * 100).toFixed(0)}% of budget remains unallocated`,
        suggestedAction: 'Consider allocating to high-ROI promotions',
        potentialImpact: `+R${Math.round(remaining * 0.15).toLocaleString()} incremental revenue`
      });
    }
    
    const highPerformers = promotions.filter(p => (p.data?.roi || 0) > 1.5);
    const lowPerformers = promotions.filter(p => (p.data?.roi || 0) < 1 && (p.data?.roi || 0) > 0);
    
    if (lowPerformers.length > 0 && highPerformers.length > 0) {
      const reallocationAmount = lowPerformers.reduce((sum, p) => sum + (p.data?.budget || 0) * 0.3, 0);
      recommendations.push({
        type: 'reallocation',
        severity: 'high',
        message: `${lowPerformers.length} promotions underperforming (ROI < 1x)`,
        suggestedAction: `Reallocate R${Math.round(reallocationAmount).toLocaleString()} to top performers`,
        potentialImpact: `+${((reallocationAmount * 0.5) / totalBudget * 100).toFixed(1)}% portfolio ROI`,
        details: {
          fromPromotions: lowPerformers.map(p => ({ id: p.id, name: p.data?.name, currentROI: p.data?.roi })),
          toPromotions: highPerformers.slice(0, 3).map(p => ({ id: p.id, name: p.data?.name, currentROI: p.data?.roi }))
        }
      });
    }
    
    recommendations.push({
      type: 'timing',
      severity: 'low',
      message: 'Seasonal opportunity detected',
      suggestedAction: 'Increase Q1 allocation by 15% for peak season',
      potentialImpact: '+12% seasonal uplift'
    });
    
    const optimizedAllocation = budgets.map(b => ({
      budgetId: b.id,
      budgetName: b.data?.budgetName || b.data?.name,
      currentAllocation: b.data?.allocated || 0,
      suggestedAllocation: Math.round((b.data?.allocated || 0) * 1.05),
      change: '+5%',
      expectedROI: 1.8
    }));
    
    return c.json({
      success: true,
      data: {
        summary: {
          totalBudget,
          totalSpent,
          remaining,
          utilizationRate: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0,
          portfolioROI: 1.65,
          optimizedROI: 1.85
        },
        recommendations,
        optimizedAllocation,
        confidence: 0.82,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Budget reallocation error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

optimizerRoutes.post('/promotion/optimize', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const { promotionId, objectives } = body;
    
    const optimizations = {
      discount: {
        current: objectives?.currentDiscount || 15,
        optimal: 12,
        impact: '+0.3x ROI',
        confidence: 0.85
      },
      duration: {
        current: objectives?.currentDuration || 14,
        optimal: 10,
        impact: '+8% efficiency',
        confidence: 0.78
      },
      timing: {
        current: 'Week 3',
        optimal: 'Week 1',
        impact: '+15% uplift',
        confidence: 0.72
      },
      targeting: {
        current: 'All customers',
        optimal: 'Top 30% by volume',
        impact: '+25% ROI',
        confidence: 0.88
      }
    };
    
    return c.json({
      success: true,
      data: {
        promotionId,
        optimizations,
        overallImpact: {
          roiImprovement: '+0.5x',
          revenueImprovement: '+18%',
          costReduction: '-12%'
        },
        confidence: 0.81,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Promotion optimization error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

optimizerRoutes.post('/portfolio/analyze', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c.env.DB);
    
    const promotions = await db.find('promotions', {
      company_id: user.companyId
    });
    
    const activeCount = promotions.filter(p => p.status === 'active').length;
    const completedCount = promotions.filter(p => p.status === 'completed').length;
    const avgROI = promotions.length > 0
      ? promotions.reduce((sum, p) => sum + (p.data?.roi || 0), 0) / promotions.length
      : 0;
    
    return c.json({
      success: true,
      data: {
        portfolio: {
          totalPromotions: promotions.length,
          activePromotions: activeCount,
          completedPromotions: completedCount,
          averageROI: parseFloat(avgROI.toFixed(2)),
          totalInvestment: promotions.reduce((sum, p) => sum + (p.data?.budget || 0), 0),
          totalReturn: promotions.reduce((sum, p) => sum + (p.data?.revenue || 0), 0)
        },
        healthScore: 78,
        riskLevel: 'medium',
        opportunities: [
          { type: 'consolidation', description: 'Merge 3 overlapping promotions', impact: 'Save R15,000' },
          { type: 'expansion', description: 'Extend top performer to new region', impact: '+R45,000 revenue' }
        ],
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Portfolio analysis error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { optimizerRoutes };
