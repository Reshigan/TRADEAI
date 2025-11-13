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
