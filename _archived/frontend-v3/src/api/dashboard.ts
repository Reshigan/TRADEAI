import apiClient from './client'

export interface DashboardKPI {
  label: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface DashboardWidget {
  id: string
  title: string
  type: 'chart' | 'table' | 'kpi' | 'list'
  data: any
}

export const dashboardApi = {
  getExecutiveDashboard: () =>
    apiClient.get('/dashboards/executive'),

  getCategoryManagerDashboard: () =>
    apiClient.get('/dashboards/category-manager'),

  getSalesDashboard: () =>
    apiClient.get('/dashboards/sales'),

  getFinanceDashboard: () =>
    apiClient.get('/dashboards/finance'),

  getCustomDashboard: (id: string) =>
    apiClient.get(`/dashboards/custom/${id}`),

  getKPIs: (period: string) =>
    apiClient.get(`/dashboards/kpis?period=${period}`),

  getPerformanceTrends: () =>
    apiClient.get('/dashboards/performance-trends'),

  getTopPromotions: (limit: number = 10) =>
    apiClient.get(`/dashboards/top-promotions?limit=${limit}`),

  getTopCustomers: (limit: number = 10) =>
    apiClient.get(`/dashboards/top-customers?limit=${limit}`),

  getBudgetUtilization: () =>
    apiClient.get('/dashboards/budget-utilization'),

  getAlerts: () =>
    apiClient.get('/dashboards/alerts'),
}
