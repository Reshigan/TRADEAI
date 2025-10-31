import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me');
      return response.data;
    },
  });

  const kpis = [
    { icon: DollarSign, label: 'Total Revenue', value: 'R 2.4M', change: '+12.5%', color: 'text-green-600' },
    { icon: TrendingUp, label: 'Active Promotions', value: '24', change: '+8%', color: 'text-blue-600' },
    { icon: Users, label: 'Customers', value: '156', change: '+5%', color: 'text-purple-600' },
    { icon: Package, label: 'Products', value: '487', change: '+15%', color: 'text-orange-600' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                    <p className={`text-sm mt-1 ${kpi.color}`}>{kpi.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${kpi.color} bg-opacity-10`}>
                    <Icon className={kpi.color} size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart placeholder - Recharts to be integrated
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart placeholder - Recharts to be integrated
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
