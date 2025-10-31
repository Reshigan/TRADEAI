import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboards/executive')
      return response.data.data
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Executive Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Trade Spend</h3>
          <p className="text-3xl font-bold text-gray-900">$45.2M</p>
          <p className="text-sm text-green-600 mt-2">+12% YoY</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Budget Utilization</h3>
          <p className="text-3xl font-bold text-gray-900">78%</p>
          <p className="text-sm text-blue-600 mt-2">On Track</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Average ROI</h3>
          <p className="text-3xl font-bold text-gray-900">3.2x</p>
          <p className="text-sm text-green-600 mt-2">+0.5x vs Target</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Sales Lift</h3>
          <p className="text-3xl font-bold text-gray-900">+12.5%</p>
          <p className="text-sm text-green-600 mt-2">Above Average</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Promotions</h3>
          <p className="text-gray-600">Promotion list will appear here...</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
          <p className="text-gray-600">Customer list will appear here...</p>
        </div>
      </div>
    </div>
  )
}
