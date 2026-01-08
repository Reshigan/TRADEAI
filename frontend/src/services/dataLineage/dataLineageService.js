import api from '../api';

/**
 * Data Lineage Service
 * Provides API calls for data lineage, baseline configuration, variance analysis, and reconciliation
 */
const dataLineageService = {
  // Data Lineage endpoints
  getLineageForEntity: async (entityType, entityId) => {
    const response = await api.get(`/data-lineage/entity/${entityType}/${entityId}`);
    return response.data;
  },

  getCalculationSummary: async (entityType, entityId) => {
    const response = await api.get(`/data-lineage/calculation-summary/${entityType}/${entityId}`);
    return response.data;
  },

  getOverriddenCalculations: async (params = {}) => {
    const response = await api.get('/data-lineage/overridden', { params });
    return response.data;
  },

  overrideCalculation: async (data) => {
    const response = await api.post('/data-lineage/override', data);
    return response.data;
  },

  // Baseline Configuration endpoints
  getBaselineConfigs: async () => {
    const response = await api.get('/data-lineage/baseline-configs');
    return response.data;
  },

  getDefaultBaselineConfig: async () => {
    const response = await api.get('/data-lineage/baseline-configs/default');
    return response.data;
  },

  createBaselineConfig: async (config) => {
    const response = await api.post('/data-lineage/baseline-configs', config);
    return response.data;
  },

  updateBaselineConfig: async (id, config) => {
    const response = await api.put(`/data-lineage/baseline-configs/${id}`, config);
    return response.data;
  },

  setDefaultBaselineConfig: async (id) => {
    const response = await api.post(`/data-lineage/baseline-configs/${id}/set-default`);
    return response.data;
  },

  // Variance Reason Codes endpoints
  getVarianceReasonCodes: async (params = {}) => {
    const response = await api.get('/data-lineage/variance-reason-codes', { params });
    return response.data;
  },

  createVarianceReasonCode: async (code) => {
    const response = await api.post('/data-lineage/variance-reason-codes', code);
    return response.data;
  },

  seedDefaultReasonCodes: async () => {
    const response = await api.post('/data-lineage/variance-reason-codes/seed-defaults');
    return response.data;
  },

  // Import Batch endpoints
  getImportBatches: async (params = {}) => {
    const response = await api.get('/data-lineage/import-batches', { params });
    return response.data;
  },

  getImportBatch: async (id) => {
    const response = await api.get(`/data-lineage/import-batches/${id}`);
    return response.data;
  },

  // Baseline Calculation endpoints
  calculateBaseline: async (promotionId, baselineConfigId = null) => {
    const response = await api.post(`/data-lineage/calculate-baseline/${promotionId}`, {
      baselineConfigId
    });
    return response.data;
  },

  calculateUplift: async (promotionId) => {
    const response = await api.post(`/data-lineage/calculate-uplift/${promotionId}`);
    return response.data;
  },

  calculateROI: async (promotionId, costs, revenue) => {
    const response = await api.post(`/data-lineage/calculate-roi/${promotionId}`, {
      costs,
      revenue
    });
    return response.data;
  },

  // Variance Analysis endpoints
  analyzePromotionVariance: async (promotionId) => {
    const response = await api.post(`/data-lineage/analyze-variance/promotion/${promotionId}`);
    return response.data;
  },

  analyzeBudgetVariance: async (budgetId) => {
    const response = await api.post(`/data-lineage/analyze-variance/budget/${budgetId}`);
    return response.data;
  },

  analyzeTradeSpendVariance: async (tradeSpendId) => {
    const response = await api.post(`/data-lineage/analyze-variance/trade-spend/${tradeSpendId}`);
    return response.data;
  },

  tagVariance: async (data) => {
    const response = await api.post('/data-lineage/tag-variance', data);
    return response.data;
  },

  getVarianceReport: async (params) => {
    const response = await api.get('/data-lineage/variance-report', { params });
    return response.data;
  },

  // Reconciliation endpoints
  getReconciliationDashboard: async (params = {}) => {
    const response = await api.get('/data-lineage/reconciliation/dashboard', { params });
    return response.data;
  },

  matchDeductionToClaim: async (deductionId, claimId, matchedAmount) => {
    const response = await api.post('/data-lineage/reconciliation/match-deduction', {
      deductionId,
      claimId,
      matchedAmount
    });
    return response.data;
  },

  autoMatchDeductions: async (options = {}) => {
    const response = await api.post('/data-lineage/reconciliation/auto-match', options);
    return response.data;
  },

  createSettlement: async (customerId, periodStart, periodEnd) => {
    const response = await api.post('/data-lineage/reconciliation/create-settlement', {
      customerId,
      periodStart,
      periodEnd
    });
    return response.data;
  },

  exportReconciliationReport: async (startDate, endDate, format = 'csv') => {
    const response = await api.get('/data-lineage/reconciliation/export', {
      params: { startDate, endDate, format },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  }
};

export default dataLineageService;
