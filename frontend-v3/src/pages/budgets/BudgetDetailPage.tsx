import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Download } from 'lucide-react'
import { budgetsApi } from '../../api/budgets'

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['budget', id],
    queryFn: async () => {
      const response = await budgetsApi.getById(id!)
      return response.data.data
    },
    enabled: !!id,
  })

  const { data: linesData } = useQuery({
    queryKey: ['budget-lines', id],
    queryFn: async () => {
      const response = await budgetsApi.getLines(id!)
      return response.data.data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading budget...</div>
  }

  const budget = budgetData?.budget
  const lines = linesData?.lines || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link to="/budgets" className="mr-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{budget?.name}</h1>
            <p className="text-gray-500">{budget?.year}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Download size={20} className="mr-2" />
            Export
          </button>
          <Link
            to={`/budgets/${id}/edit`}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit size={20} className="mr-2" />
            Edit
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Budget</h3>
          <p className="text-2xl font-bold text-gray-900">
            ${((budget?.totalAmount || 0) / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Allocated</h3>
          <p className="text-2xl font-bold text-blue-600">
            ${((budget?.allocatedAmount || 0) / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Spent</h3>
          <p className="text-2xl font-bold text-orange-600">
            ${((budget?.spentAmount || 0) / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Remaining</h3>
          <p className="text-2xl font-bold text-green-600">
            ${((budget?.remainingAmount || 0) / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>

      {/* Budget Lines */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Budget Lines</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lines.map((line: any) => (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {line.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    ${(line.allocatedAmount / 1000).toFixed(0)}K
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    ${(line.spentAmount / 1000).toFixed(0)}K
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    ${(line.remainingAmount / 1000).toFixed(0)}K
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min((line.spentAmount / line.allocatedAmount) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-600">
                        {Math.round((line.spentAmount / line.allocatedAmount) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
