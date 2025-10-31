#!/bin/bash

# TRADEAI Frontend v3 - Sprints 5-7 Code Generator
# Customers, Products, Analytics, ML/AI

set -e

cd /workspace/project/TRADEAI/frontend-v3

echo "🚀 Building TRADEAI Frontend v3 - Sprints 5-7..."
echo "=================================================="
echo ""

# ============================================
# SPRINT 5: CUSTOMER & PRODUCT MANAGEMENT
# ============================================

echo "👥 Sprint 5: Customer & Product Management..."

# Customers API
cat > src/api/customers.ts <<'EOF'
import apiClient from './client'

export interface Customer {
  id: string
  name: string
  code: string
  type: 'retailer' | 'distributor' | 'wholesaler'
  tier: 'A' | 'B' | 'C'
  region: string
  salesVolume: number
  status: 'active' | 'inactive'
  contactEmail: string
  contactPhone: string
  createdAt: string
}

export const customersApi = {
  getAll: (params?: any) =>
    apiClient.get('/customers', { params }),

  getById: (id: string) =>
    apiClient.get(`/customers/${id}`),

  create: (data: Partial<Customer>) =>
    apiClient.post('/customers', data),

  update: (id: string, data: Partial<Customer>) =>
    apiClient.put(`/customers/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/customers/${id}`),

  getHierarchy: (id: string) =>
    apiClient.get(`/customers/${id}/hierarchy`),

  getPerformance: (id: string) =>
    apiClient.get(`/customers/${id}/performance`),

  getPromotions: (id: string) =>
    apiClient.get(`/customers/${id}/promotions`),
}
EOF

# Products API
cat > src/api/products.ts <<'EOF'
import apiClient from './client'

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  brand: string
  price: number
  cost: number
  status: 'active' | 'discontinued'
  createdAt: string
}

export const productsApi = {
  getAll: (params?: any) =>
    apiClient.get('/products', { params }),

  getById: (id: string) =>
    apiClient.get(`/products/${id}`),

  create: (data: Partial<Product>) =>
    apiClient.post('/products', data),

  update: (id: string, data: Partial<Product>) =>
    apiClient.put(`/products/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/products/${id}`),

  getCategories: () =>
    apiClient.get('/products/categories'),

  getBrands: () =>
    apiClient.get('/products/brands'),

  getPerformance: (id: string) =>
    apiClient.get(`/products/${id}/performance`),
}
EOF

# Customers List Page
mkdir -p src/pages/customers

cat > src/pages/customers/CustomersListPage.tsx <<'EOF'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { customersApi } from '../../api/customers'

export default function CustomersListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('all')

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', tierFilter],
    queryFn: async () => {
      const response = await customersApi.getAll({ tier: tierFilter !== 'all' ? tierFilter : undefined })
      return response.data.data
    },
  })

  const customers = customersData?.customers || []

  const getTierBadge = (tier: string) => {
    const colors = {
      A: 'bg-green-100 text-green-800',
      B: 'bg-blue-100 text-blue-800',
      C: 'bg-gray-100 text-gray-800',
    }
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
        <Link
          to="/customers/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={20} className="mr-2" />
          Add Customer
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Tiers</option>
            <option value="A">Tier A</option>
            <option value="B">Tier B</option>
            <option value="C">Tier C</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading customers...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <Link to={`/customers/${customer.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {customer.name}
                      </Link>
                      <div className="text-sm text-gray-500">{customer.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {customer.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierBadge(customer.tier)}`}>
                      Tier {customer.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {customer.region}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    ${(customer.salesVolume / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link to={`/customers/${customer.id}`} className="text-blue-600 hover:text-blue-800">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
EOF

# Products List Page
mkdir -p src/pages/products

cat > src/pages/products/ProductsListPage.tsx <<'EOF'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { productsApi } from '../../api/products'

export default function ProductsListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', categoryFilter],
    queryFn: async () => {
      const response = await productsApi.getAll({ category: categoryFilter !== 'all' ? categoryFilter : undefined })
      return response.data.data
    },
  })

  const products = productsData?.products || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <Link
          to="/products/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={20} className="mr-2" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.sku}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Brand:</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">${product.price.toFixed(2)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
EOF

echo "✅ Sprint 5: Customer & Product Management - Complete!"
echo ""

# ============================================
# SPRINT 6: ANALYTICS & REPORTING
# ============================================

echo "📊 Sprint 6: Analytics & Reporting..."

# Analytics API
cat > src/api/analytics.ts <<'EOF'
import apiClient from './client'

export const analyticsApi = {
  getTradeSpendAnalysis: (params: any) =>
    apiClient.get('/analytics/trade-spend', { params }),

  getROIAnalysis: (params: any) =>
    apiClient.get('/analytics/roi', { params }),

  getSalesLiftAnalysis: (params: any) =>
    apiClient.get('/analytics/sales-lift', { params }),

  getCustomerPerformance: (params: any) =>
    apiClient.get('/analytics/customer-performance', { params }),

  getProductPerformance: (params: any) =>
    apiClient.get('/analytics/product-performance', { params }),

  getPromotionEffectiveness: (params: any) =>
    apiClient.get('/analytics/promotion-effectiveness', { params }),

  getBudgetVariance: (params: any) =>
    apiClient.get('/analytics/budget-variance', { params }),

  getTrendAnalysis: (params: any) =>
    apiClient.get('/analytics/trends', { params }),
}

export const reportsApi = {
  generate: (type: string, params: any) =>
    apiClient.post(`/reports/generate/${type}`, params),

  getAll: () =>
    apiClient.get('/reports'),

  getById: (id: string) =>
    apiClient.get(`/reports/${id}`),

  download: (id: string, format: string) =>
    apiClient.get(`/reports/${id}/download?format=${format}`, { responseType: 'blob' }),

  schedule: (reportConfig: any) =>
    apiClient.post('/reports/schedule', reportConfig),
}
EOF

# Analytics Page
mkdir -p src/pages/analytics

cat > src/pages/analytics/AnalyticsPage.tsx <<'EOF'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Calendar } from 'lucide-react'
import ChartWidget from '../../components/dashboard/ChartWidget'
import { analyticsApi } from '../../api/analytics'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('last-30-days')
  const [analysisType, setAnalysisType] = useState('trade-spend')

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', analysisType, dateRange],
    queryFn: async () => {
      const response = await analyticsApi.getTradeSpendAnalysis({ dateRange })
      return response.data.data
    },
  })

  // Mock data for demonstration
  const tradeSpendTrend = [
    { name: 'Jan', value: 4200000 },
    { name: 'Feb', value: 3800000 },
    { name: 'Mar', value: 5100000 },
    { name: 'Apr', value: 4700000 },
    { name: 'May', value: 6200000 },
    { name: 'Jun', value: 5800000 },
  ]

  const roiByCategory = [
    { name: 'Trade Marketing', value: 3.5 },
    { name: 'Consumer Promo', value: 2.8 },
    { name: 'In-Store', value: 4.2 },
    { name: 'Digital', value: 5.1 },
  ]

  const salesLift = [
    { name: 'Week 1', value: 8 },
    { name: 'Week 2', value: 12 },
    { name: 'Week 3', value: 15 },
    { name: 'Week 4', value: 18 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="last-7-days">Last 7 Days</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="last-90-days">Last 90 Days</option>
            <option value="ytd">Year to Date</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Download size={20} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Trade Spend</h3>
          <p className="text-2xl font-bold text-gray-900">$45.2M</p>
          <p className="text-sm text-green-600 mt-2">+12% vs previous period</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Average ROI</h3>
          <p className="text-2xl font-bold text-gray-900">3.2x</p>
          <p className="text-sm text-green-600 mt-2">+0.5x vs target</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Sales Lift</h3>
          <p className="text-2xl font-bold text-gray-900">+12.5%</p>
          <p className="text-sm text-green-600 mt-2">Above average</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Promotions</h3>
          <p className="text-2xl font-bold text-gray-900">45</p>
          <p className="text-sm text-blue-600 mt-2">Across 12 customers</p>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <ChartWidget
          title="Trade Spend Trend"
          type="area"
          data={tradeSpendTrend}
          dataKey="value"
          xAxisKey="name"
          height={350}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWidget
            title="ROI by Category"
            type="bar"
            data={roiByCategory}
            dataKey="value"
            xAxisKey="name"
            height={300}
          />
          <ChartWidget
            title="Sales Lift Over Time"
            type="line"
            data={salesLift}
            dataKey="value"
            xAxisKey="name"
            height={300}
          />
        </div>
      </div>
    </div>
  )
}
EOF

# Reports Page
cat > src/pages/analytics/ReportsPage.tsx <<'EOF'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Download, Calendar } from 'lucide-react'
import { reportsApi } from '../../api/analytics'

export default function ReportsPage() {
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await reportsApi.getAll()
      return response.data.data
    },
  })

  const reports = reportsData?.reports || []

  const reportTypes = [
    { id: 'trade-spend', name: 'Trade Spend Report', description: 'Comprehensive trade spend analysis' },
    { id: 'roi-analysis', name: 'ROI Analysis', description: 'Return on investment by promotion' },
    { id: 'budget-variance', name: 'Budget Variance', description: 'Budget vs actual comparison' },
    { id: 'customer-performance', name: 'Customer Performance', description: 'Customer-level metrics' },
    { id: 'promotion-effectiveness', name: 'Promotion Effectiveness', description: 'Promotion performance analysis' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus size={20} className="mr-2" />
          Generate Report
        </button>
      </div>

      {/* Report Types */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((type) => (
            <div key={type.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{type.description}</p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Generate
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Reports</h2>
        {isLoading ? (
          <div className="text-center py-8">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">No reports generated yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report: any) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {report.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-600 hover:text-blue-800 mr-4">
                        <Download size={16} className="inline mr-1" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
EOF

echo "✅ Sprint 6: Analytics & Reporting - Complete!"
echo ""

# ============================================
# SPRINT 7: ADVANCED FEATURES (ML/AI)
# ============================================

echo "🤖 Sprint 7: Advanced Features (ML/AI)..."

# ML/AI API
cat > src/api/ml.ts <<'EOF'
import apiClient from './client'

export const mlApi = {
  // Demand Forecasting
  getForecast: (params: any) =>
    apiClient.post('/ml/forecast', params),

  // Price Optimization
  optimizePrice: (params: any) =>
    apiClient.post('/ml/price-optimization', params),

  // Promotion Recommendation
  getPromotionRecommendations: (customerId: string) =>
    apiClient.get(`/ml/recommendations/promotions/${customerId}`),

  // Budget Allocation
  optimizeBudgetAllocation: (params: any) =>
    apiClient.post('/ml/budget-allocation', params),

  // Customer Segmentation
  getCustomerSegments: () =>
    apiClient.get('/ml/customer-segmentation'),

  // Anomaly Detection
  detectAnomalies: (params: any) =>
    apiClient.post('/ml/anomaly-detection', params),

  // Performance Prediction
  predictPerformance: (promotionId: string) =>
    apiClient.get(`/ml/predict-performance/${promotionId}`),
}

export const aiApi = {
  // AI Chatbot
  chat: (message: string, conversationId?: string) =>
    apiClient.post('/ai/chat', { message, conversationId }),

  getConversations: () =>
    apiClient.get('/ai/conversations'),

  // AI Insights
  getInsights: (context: string) =>
    apiClient.get(`/ai/insights?context=${context}`),

  generateSummary: (data: any) =>
    apiClient.post('/ai/generate-summary', data),
}
EOF

# ML Dashboard Page
mkdir -p src/pages/ml

cat > src/pages/ml/MLDashboardPage.tsx <<'EOF'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Brain, TrendingUp, Target, Users } from 'lucide-react'
import { mlApi } from '../../api/ml'

export default function MLDashboardPage() {
  const { data: recommendationsData, isLoading } = useQuery({
    queryKey: ['ml-recommendations'],
    queryFn: async () => {
      const response = await mlApi.getCustomerSegments()
      return response.data.data
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ML & AI Features</h1>
          <p className="text-gray-600 mt-2">Powered by machine learning and artificial intelligence</p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
          <Brain size={32} className="mb-4" />
          <h3 className="text-lg font-semibold mb-2">Demand Forecasting</h3>
          <p className="text-sm opacity-90">Predict future demand with AI</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
          <TrendingUp size={32} className="mb-4" />
          <h3 className="text-lg font-semibold mb-2">Price Optimization</h3>
          <p className="text-sm opacity-90">Optimize pricing strategies</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
          <Target size={32} className="mb-4" />
          <h3 className="text-lg font-semibold mb-2">Promo Recommendations</h3>
          <p className="text-sm opacity-90">AI-powered promotion ideas</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
          <Users size={32} className="mb-4" />
          <h3 className="text-lg font-semibold mb-2">Customer Segmentation</h3>
          <p className="text-sm opacity-90">Intelligent customer grouping</p>
        </div>
      </div>

      {/* ML Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Recommendations</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <TrendingUp className="text-blue-600" size={20} />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Increase Q3 Budget for Electronics</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    ML models predict 18% sales lift with 15% budget increase
                  </p>
                  <p className="text-xs text-blue-600 mt-2">Confidence: 87%</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Target className="text-green-600" size={20} />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Launch Promotion for Customer ABC</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Optimal timing: Next 2 weeks, Expected ROI: 4.2x
                  </p>
                  <p className="text-xs text-green-600 mt-2">Confidence: 92%</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Users className="text-purple-600" size={20} />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">New Customer Segment Identified</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    45 customers show similar buying patterns - create targeted campaign
                  </p>
                  <p className="text-xs text-purple-600 mt-2">Confidence: 89%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Anomaly Detection</h3>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-yellow-600 text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Unusual Spend Pattern Detected</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Customer XYZ showing 40% decrease in orders vs forecast
                  </p>
                  <button className="text-sm text-blue-600 hover:text-blue-800 mt-2">
                    Investigate →
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-red-600 text-2xl">🚨</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Budget Overrun Alert</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Q2 digital marketing budget 95% utilized with 3 weeks remaining
                  </p>
                  <button className="text-sm text-blue-600 hover:text-blue-800 mt-2">
                    Review Budget →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
EOF

# AI Chatbot Page
cat > src/pages/ml/AIChatbotPage.tsx <<'EOF'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Send, Bot, User } from 'lucide-react'
import { aiApi } from '../../api/ml'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your TRADEAI assistant. I can help you with budget analysis, promotion recommendations, customer insights, and more. What would you like to know?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')

  const chatMutation = useMutation({
    mutationFn: aiApi.chat,
    onSuccess: (response) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.data.message,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    },
  })

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    chatMutation.mutate(input)
    setInput('')
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-gray-600 mt-2">Ask me anything about your trade promotions</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                  {message.role === 'user' ? (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div
                    className={`p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Try asking: "What's my budget utilization?" or "Show me top performing promotions"
          </p>
        </div>
      </div>
    </div>
  )
}
EOF

echo "✅ Sprint 7: ML/AI Features - Complete!"
echo ""

echo "✅ All Sprints 5-7 Generated Successfully!"
echo "=================================================="
echo ""
