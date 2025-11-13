import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { budgetsApi } from '../../api/budgets'

export default function BudgetsListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: budgetsData, isLoading } = useQuery({
    queryKey: ['budgets', statusFilter],
    queryFn: async () => {
      const response = await budgetsApi.getAll({ status: statusFilter !== 'all' ? statusFilter : undefined })
      return response.data.data
    },
  })

  const budgets = budgetsData?.budgets || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'closed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
        <Link
          to="/budgets/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={20} className="mr-2" />
          Create Budget
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
                placeholder="Search budgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Budget List */}
      {isLoading ? (
        <div className="text-center py-8">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">No budgets found</p>
          <Link
            to="/budgets/new"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Your First Budget
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget: any) => (
            <Link
              key={budget.id}
              to={`/budgets/${budget.id}`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                  <p className="text-sm text-gray-500">{budget.year}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(budget.status)}`}>
                  {budget.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">${(budget.totalAmount / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-medium">${(budget.spentAmount / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-medium text-green-600">${(budget.remainingAmount / 1000000).toFixed(1)}M</span>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Utilization</span>
                    <span>{Math.round((budget.spentAmount / budget.totalAmount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((budget.spentAmount / budget.totalAmount) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
