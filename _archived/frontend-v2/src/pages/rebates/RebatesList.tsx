import { useState } from 'react';
import { Plus, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useRebates, useRebateAnalytics, useDeleteRebate } from '../../hooks/useRebates';
import { DataTable } from '../../components/DataTable/DataTable';
import { Rebate } from '../../api/services/rebates';
import { useNavigate } from 'react-router-dom';

export default function RebatesList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{
    status?: string;
    type?: string;
  }>({});

  const { data: rebatesData, isLoading, error } = useRebates(filters);
  const { data: analyticsData } = useRebateAnalytics();
  const deleteRebate = useDeleteRebate();

  const rebates = rebatesData?.data || [];
  const analytics = analyticsData?.data;

  const columns = [
    {
      header: 'Rebate Name',
      accessorKey: 'name',
      cell: (row: Rebate) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.customerName || 'All Customers'}</div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (row: Rebate) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.type.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: Rebate) => {
        const statusColors = {
          draft: 'bg-gray-100 text-gray-800',
          active: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          expired: 'bg-red-100 text-red-800',
          cancelled: 'bg-gray-100 text-gray-800',
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              statusColors[row.status]
            }`}
          >
            {row.status.toUpperCase()}
          </span>
        );
      },
    },
    {
      header: 'Period',
      accessorKey: 'startDate',
      cell: (row: Rebate) => (
        <div className="text-sm">
          <div>{new Date(row.startDate).toLocaleDateString()}</div>
          <div className="text-gray-500">to {new Date(row.endDate).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      header: 'Current Amount',
      accessorKey: 'currentAmount',
      cell: (row: Rebate) => (
        <div className="text-sm font-medium">
          ${row.currentAmount.toLocaleString()}
        </div>
      ),
    },
    {
      header: 'Projected',
      accessorKey: 'projectedAmount',
      cell: (row: Rebate) => (
        <div className="text-sm">
          ${row.projectedAmount.toLocaleString()}
        </div>
      ),
    },
    {
      header: 'Paid',
      accessorKey: 'paidAmount',
      cell: (row: Rebate) => (
        <div className="text-sm text-green-600 font-medium">
          ${row.paidAmount.toLocaleString()}
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this rebate?')) {
      await deleteRebate.mutateAsync(id);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/rebates/${id}/edit`);
  };

  const handleView = (id: string) => {
    navigate(`/rebates/${id}`);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading rebates. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rebates Management</h1>
          <p className="text-gray-500 mt-1">Manage and track customer rebates</p>
        </div>
        <button
          onClick={() => navigate('/rebates/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Rebate
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rebates</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalRebates}</p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ${analytics.totalPaid.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Projected</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${analytics.totalProjected.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${analytics.totalPending.toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="volume">Volume</option>
              <option value="growth">Growth</option>
              <option value="promotional">Promotional</option>
              <option value="early_payment">Early Payment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={rebates}
          columns={columns}
          loading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
