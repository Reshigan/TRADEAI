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
