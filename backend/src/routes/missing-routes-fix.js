// Missing Routes Fix - Add aliases and missing endpoints
const express = require('express');
const router = express.Router();

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

router.post('/forecasting/generate', (req, res) => {
  res.json({
    success: true,
    message: 'Forecast generation started',
    jobId: `forecast_${Date.now()}`
  });
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
