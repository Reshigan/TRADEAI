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
