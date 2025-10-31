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
