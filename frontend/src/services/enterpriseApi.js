import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

/**
 * Enterprise Budget API
 */
export const enterpriseBudgetApi = {
  // Get dashboard data
  getDashboard: (filters) => {
    return apiClient.get('/enterprise/budget/dashboard', { params: filters });
  },

  // Create scenario
  createScenario: (data) => {
    return apiClient.post('/enterprise/budget/scenarios', data);
  },

  // Compare scenarios
  compareScenarios: (scenarioIds) => {
    return apiClient.post('/enterprise/budget/scenarios/compare', { scenarioIds });
  },

  // Analyze variance
  analyzeVariance: (budgetId, data) => {
    return apiClient.post(`/enterprise/budget/${budgetId}/variance`, data);
  },

  // Create multi-year plan
  createMultiYearPlan: (data) => {
    return apiClient.post('/enterprise/budget/multi-year-plan', data);
  },

  // Optimize allocation
  optimizeAllocation: (data) => {
    return apiClient.post('/enterprise/budget/optimize', data);
  },

  // Process workflow
  processWorkflow: (budgetId, data) => {
    return apiClient.post(`/enterprise/budget/${budgetId}/workflow`, data);
  },

  // Consolidate budgets
  consolidateBudgets: (data) => {
    return apiClient.post('/enterprise/budget/consolidate', data);
  },

  // Run simulation
  runSimulation: (data) => {
    return apiClient.post('/enterprise/budget/simulate', data);
  },

  // Bulk operations
  bulkCreate: (budgets) => {
    return apiClient.post('/enterprise/budget/bulk/create', { budgets });
  },

  bulkUpdate: (updates) => {
    return apiClient.put('/enterprise/budget/bulk/update', { updates });
  },

  bulkDelete: (budgetIds) => {
    return apiClient.delete('/enterprise/budget/bulk/delete', { data: { budgetIds } });
  },

  // Export/Import
  export: (filters, format = 'json') => {
    return apiClient.get('/enterprise/budget/export', {
      params: { ...filters, format },
      responseType: format === 'json' ? 'json' : 'blob'
    });
  },

  import: (data, format) => {
    return apiClient.post('/enterprise/budget/import', { data, format });
  }
};

/**
 * Trade Spend API
 */
export const tradeSpendApi = {
  // Get real-time dashboard
  getDashboard: (filters) => {
    return apiClient.get('/trade-spend/dashboard', { params: filters });
  },

  // Process transaction
  processTransaction: (data) => {
    return apiClient.post('/trade-spend/transaction', data);
  },

  // Analyze variance
  analyzeVariance: (filters) => {
    return apiClient.post('/trade-spend/variance', filters);
  },

  // Optimize allocation
  optimize: (params) => {
    return apiClient.post('/trade-spend/optimize', params);
  },

  // Reconcile spend
  reconcile: (params) => {
    return apiClient.post('/trade-spend/reconcile', params);
  },

  // Forecast
  forecast: (params) => {
    return apiClient.post('/trade-spend/forecast', params);
  }
};

/**
 * Promotion Simulation API
 */
export const promotionSimulationApi = {
  // Run what-if simulation
  runSimulation: (promotionData, scenarios) => {
    return apiClient.post('/promotions/simulate', { promotionData, scenarios });
  },

  // Optimize promotion
  optimize: (baseParams, constraints, objectives) => {
    return apiClient.post('/promotions/optimize', { baseParams, constraints, objectives });
  },

  // Simulate ROI
  simulateROI: (params) => {
    return apiClient.post('/promotions/simulate-roi', params);
  },

  // Analyze effectiveness
  analyzeEffectiveness: (promotionId) => {
    return apiClient.get(`/promotions/${promotionId}/effectiveness`);
  },

  // Optimize portfolio
  optimizePortfolio: (params) => {
    return apiClient.post('/promotions/optimize-portfolio', params);
  },

  // Analyze cannibalization
  analyzeCannibalization: (promotionId) => {
    return apiClient.get(`/promotions/${promotionId}/cannibalization`);
  },

  // Analyze lift
  analyzeLift: (promotionId) => {
    return apiClient.get(`/promotions/${promotionId}/lift`);
  }
};

/**
 * Master Data API
 */
export const masterDataApi = {
  // Product hierarchy
  manageProductHierarchy: (action, data) => {
    return apiClient.post('/master-data/hierarchy/product', { action, data });
  },

  getProductHierarchyTree: (companyId) => {
    return apiClient.get('/master-data/hierarchy/product/tree', { params: { companyId } });
  },

  // Customer hierarchy
  manageCustomerHierarchy: (action, data) => {
    return apiClient.post('/master-data/hierarchy/customer', { action, data });
  },

  getCustomerHierarchyTree: (companyId) => {
    return apiClient.get('/master-data/hierarchy/customer/tree', { params: { companyId } });
  },

  // Data quality
  checkDataQuality: (entityType, options) => {
    return apiClient.post('/master-data/quality/check', { entityType, options });
  },

  // Versioning
  getVersions: (entityType, entityId) => {
    return apiClient.get('/master-data/versions', {
      params: { entityType, entityId }
    });
  },

  restoreVersion: (entityType, entityId, versionId) => {
    return apiClient.post('/master-data/versions/restore', {
      entityType,
      entityId,
      versionId
    });
  },

  // Validation
  validate: (entityType, data) => {
    return apiClient.post('/master-data/validate', { entityType, data });
  },

  // Enrichment
  enrich: (entityType, entityId, sources) => {
    return apiClient.post('/master-data/enrich', { entityType, entityId, sources });
  },

  // Deduplication
  deduplicate: (entityType, options) => {
    return apiClient.post('/master-data/deduplicate', { entityType, options });
  }
};

/**
 * Super Admin API
 */
export const superAdminApi = {
  // Tenant management
  createTenant: (tenantData, adminData, licenseType) => {
    return apiClient.post('/super-admin/tenants', { tenantData, adminData, licenseType });
  },

  getAllTenants: (filters, pagination) => {
    return apiClient.get('/super-admin/tenants', { params: { ...filters, ...pagination } });
  },

  getTenant: (tenantId) => {
    return apiClient.get(`/super-admin/tenants/${tenantId}`);
  },

  updateTenantStatus: (tenantId, status, reason) => {
    return apiClient.patch(`/super-admin/tenants/${tenantId}/status`, { status, reason });
  },

  deleteTenant: (tenantId, reason) => {
    return apiClient.delete(`/super-admin/tenants/${tenantId}`, { data: { reason } });
  },

  bulkTenantOperation: (tenantIds, operation, data) => {
    return apiClient.post('/super-admin/tenants/bulk', { tenantIds, operation, data });
  },

  // License management
  manageLicense: (tenantId, action, data) => {
    return apiClient.post(`/super-admin/tenants/${tenantId}/license`, { action, data });
  },

  getLicenseUsage: (tenantId) => {
    return apiClient.get(`/super-admin/tenants/${tenantId}/license/usage`);
  },

  getLicensePlans: () => {
    return apiClient.get('/super-admin/license-plans');
  },

  // System statistics
  getSystemStatistics: () => {
    return apiClient.get('/super-admin/statistics');
  },

  getSystemHealth: () => {
    return apiClient.get('/super-admin/health');
  }
};

/**
 * Enterprise Simulations API
 */
export const simulationsApi = {
  // Promotion Impact
  promotionImpact: (data) => {
    return apiClient.post('/enterprise/simulations/promotion-impact', data);
  },

  // Budget Allocation
  budgetAllocation: (data) => {
    return apiClient.post('/enterprise/simulations/budget-allocation', data);
  },

  // Pricing Strategy
  pricingStrategy: (data) => {
    return apiClient.post('/enterprise/simulations/pricing-strategy', data);
  },

  // Volume Projection
  volumeProjection: (data) => {
    return apiClient.post('/enterprise/simulations/volume-projection', data);
  },

  // Market Share
  marketShare: (data) => {
    return apiClient.post('/enterprise/simulations/market-share', data);
  },

  // ROI Optimization
  roiOptimization: (data) => {
    return apiClient.post('/enterprise/simulations/roi-optimization', data);
  },

  // What-If Analysis
  whatIfAnalysis: (data) => {
    return apiClient.post('/enterprise/simulations/what-if', data);
  }
};

/**
 * Enterprise Dashboards API
 */
export const dashboardsApi = {
  // Executive Dashboard
  executive: (filters) => {
    return apiClient.get('/enterprise/dashboards/executive', { params: filters });
  },

  // Real-time KPIs
  realtimeKPIs: () => {
    return apiClient.get('/enterprise/dashboards/kpis/realtime');
  },

  // Sales Performance
  salesPerformance: (filters) => {
    return apiClient.get('/enterprise/dashboards/sales-performance', { params: filters });
  },

  // Budget Dashboard
  budget: (filters) => {
    return apiClient.get('/enterprise/dashboards/budget', { params: filters });
  },

  // Trade Spend Dashboard
  tradeSpend: (filters) => {
    return apiClient.get('/enterprise/dashboards/trade-spend', { params: filters });
  }
};

export default {
  enterpriseBudget: enterpriseBudgetApi,
  tradeSpend: tradeSpendApi,
  promotionSimulation: promotionSimulationApi,
  masterData: masterDataApi,
  superAdmin: superAdminApi,
  simulations: simulationsApi,
  dashboards: dashboardsApi
};
