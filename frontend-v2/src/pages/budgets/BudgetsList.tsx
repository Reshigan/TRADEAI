import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { budgetService } from '../../api/services/budgets';
import { DataTable } from '../../components/DataTable/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const BudgetsList: React.FC = () => {
  const navigate = useNavigate();
  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetService.getAll,
  });

  const statusColors: Record<string, any> = {
    active: 'success',
    inactive: 'default',
    completed: 'info',
  };

  const columns = [
    { key: 'name', label: 'Budget Name', sortable: true },
    {
      key: 'totalAmount',
      label: 'Total Budget',
      sortable: true,
      render: (value: number) => formatCurrency(value || 0),
    },
    {
      key: 'allocated',
      label: 'Allocated',
      sortable: true,
      render: (value: number) => formatCurrency(value || 0),
    },
    {
      key: 'spent',
      label: 'Spent',
      sortable: true,
      render: (value: number) => formatCurrency(value || 0),
    },
    {
      key: 'remaining',
      label: 'Remaining',
      sortable: true,
      render: (value: number) => (
        <span className={value < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
          {formatCurrency(value || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => <Badge variant={statusColors[value]}>{value}</Badge>,
    },
    {
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'endDate',
      label: 'End Date',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
  ];

  // Calculate summary stats
  const totalBudget = budgets?.reduce((sum, b) => sum + (b.totalAmount || 0), 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + (b.spent || 0), 0) || 0;
  const totalRemaining = budgets?.reduce((sum, b) => sum + (b.remaining || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600 mt-1">Track and manage promotional budgets</p>
        </div>
        <Button onClick={() => navigate('/budgets/create')}>
          <Plus size={20} className="mr-2" />
          Create Budget
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalSpent)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : '0%'} of budget
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className={`text-2xl font-bold mt-1 ${totalRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(totalRemaining)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalBudget > 0 ? `${((totalRemaining / totalBudget) * 100).toFixed(1)}%` : '0%'} available
                </p>
              </div>
              <div className={`p-3 rounded-full ${totalRemaining < 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <DollarSign className={totalRemaining < 0 ? 'text-red-600' : 'text-green-600'} size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budgets Table */}
      <DataTable
        data={budgets || []}
        columns={columns}
        onRowClick={(budget) => navigate(`/budgets/${budget._id}`)}
        isLoading={isLoading}
      />
    </div>
  );
};
