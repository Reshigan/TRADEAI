// Missing Routes Fix - Add aliases and missing endpoints
const express = require('express');
const router = express.Router();
const ForecastingService = require('../services/forecastingService');

// Initialize forecasting service
const forecastingService = new ForecastingService();

// ============================================================================
// DASHBOARD ROUTES (aliases for /api/dashboards)
// ============================================================================

// Main dashboard endpoint
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard endpoint',
    redirect: '/api/dashboards'
  });
});

router.get('/dashboard/overview', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard overview',
    data: {
      totalUsers: 0,
      totalTransactions: 0,
      revenue: 0
    }
  });
});

router.get('/dashboard/statistics', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard statistics',
    stats: {}
  });
});

// ============================================================================
// METRICS ENDPOINT
// ============================================================================

router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  });
});

// ============================================================================
// INSIGHTS ENDPOINTS
// ============================================================================

router.get('/insights', (req, res) => {
  res.json({
    success: true,
    insights: [],
    message: 'Business insights'
  });
});

router.get('/insights/generate', (req, res) => {
  res.json({
    success: true,
    message: 'Insights generation triggered',
    status: 'processing'
  });
});

// ============================================================================
// FORECASTING ENDPOINTS
// ============================================================================

router.get('/forecasting', (req, res) => {
  res.json({
    success: true,
    message: 'Forecasting dashboard',
    forecasts: []
  });
});

router.post('/forecasting/generate', async (req, res) => {
  try {
    const { productId, customerId, horizon = 12, algorithm = 'ensemble' } = req.body;
    const tenantId = req.user?.tenantId || 'default';

    // Generate the forecast using the real service
    const forecast = await forecastingService.generateSalesForecast(tenantId, {
      productId,
      customerId,
      horizon,
      algorithm
    });

    res.json({
      success: true,
      message: 'Forecast generated successfully',
      data: forecast,
      jobId: `forecast_${Date.now()}`
    });
  } catch (error) {
    console.error('Forecast generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate forecast',
      error: error.message
    });
  }
});

router.get('/forecasting/results/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    // For now, return a success status since we generate forecasts synchronously
    res.json({
      success: true,
      jobId,
      status: 'completed',
      message: 'Forecast completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get forecast results',
      error: error.message
    });
  }
});

router.get('/forecasting/sales', (req, res) => {
  res.json({
    success: true,
    forecast: 'sales',
    data: []
  });
});

router.get('/forecasting/by-period', (req, res) => {
  res.json({
    success: true,
    forecast: 'by-period',
    data: []
  });
});

router.get('/forecasting/by-channel', (req, res) => {
  res.json({
    success: true,
    forecast: 'by-channel',
    data: []
  });
});

// Demand forecast endpoint
router.post('/forecasting/demand', (req, res) => {
  try {
    // Mock demand forecast for now
    const { productIds = [], customerIds = [], horizon = 12 } = req.body;

    const mockDemandForecast = {
      productIds,
      customerIds,
      horizon,
      scenarios: {
        optimistic: { demand: 1200, confidence: 0.8 },
        realistic: { demand: 1000, confidence: 0.9 },
        pessimistic: { demand: 800, confidence: 0.7 }
      },
      riskAnalysis: {
        riskLevel: 'medium',
        factors: ['seasonality', 'market_trends']
      },
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Demand forecast generated successfully',
      data: mockDemandForecast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate demand forecast',
      error: error.message
    });
  }
});

// Budget forecast endpoint
router.post('/forecasting/budget', (req, res) => {
  try {
    // Mock budget forecast for now
    const { horizon = 12, includeInflation = true } = req.body;

    const mockBudgetForecast = {
      horizon,
      includeInflation,
      finalForecast: Array.from({ length: horizon }, (_, i) => ({
        period: i + 1,
        value: 50000 + (i * 2000) + (Math.random() * 5000)
      })),
      budgetRisk: {
        level: 'low',
        factors: ['inflation', 'market_volatility']
      },
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Budget forecast generated successfully',
      data: mockBudgetForecast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate budget forecast',
      error: error.message
    });
  }
});

// Export forecast endpoint
router.post('/forecasting/export/:type', (req, res) => {
  try {
    const { type } = req.params;

    // Mock Excel export - in reality this would generate an actual Excel file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_forecast_${new Date().toISOString().split('T')[0]}.xlsx`);

    // Send mock Excel data
    const mockExcelData = Buffer.from(`Mock Excel Data for ${type} forecast`);
    res.send(mockExcelData);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export forecast',
      error: error.message
    });
  }
});

// ============================================================================
// INTEGRATIONS ENDPOINT (alias)
// ============================================================================

router.get('/integrations', (req, res) => {
  res.json({
    success: true,
    message: 'Integrations list',
    integrations: [],
    redirect: '/api/integration'
  });
});

module.exports = router;
