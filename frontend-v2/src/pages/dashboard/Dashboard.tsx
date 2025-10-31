import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../api/services/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { TrendingUp, Package, Users, DollarSign, Activity } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  // Fetch real dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  // Fetch recent activity
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardService.getRecentActivity(5),
  });

  // Fetch chart data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard-revenue-chart'],
    queryFn: () => dashboardService.getChartData('revenue'),
  });

  const isLoading = statsLoading || activitiesLoading || revenueLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Build KPI cards from real data
  const kpis = [
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      change: stats?.revenueChange ? `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}%` : '0%',
      color: stats?.revenueChange >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      icon: TrendingUp,
      label: 'Active Promotions',
      value: stats?.activePromotions?.toString() || '0',
      change: stats?.promotionsChange ? `${stats.promotionsChange > 0 ? '+' : ''}${stats.promotionsChange.toFixed(1)}%` : '0%',
      color: stats?.promotionsChange >= 0 ? 'text-blue-600' : 'text-red-600',
    },
    {
      icon: Users,
      label: 'Customers',
      value: stats?.totalCustomers?.toString() || '0',
      change: stats?.customersChange ? `${stats.customersChange > 0 ? '+' : ''}${stats.customersChange.toFixed(1)}%` : '0%',
      color: stats?.customersChange >= 0 ? 'text-purple-600' : 'text-red-600',
    },
    {
      icon: Package,
      label: 'Products',
      value: stats?.totalProducts?.toString() || '0',
      change: stats?.productsChange ? `${stats.productsChange > 0 ? '+' : ''}${stats.productsChange.toFixed(1)}%` : '0%',
      color: stats?.productsChange >= 0 ? 'text-orange-600' : 'text-red-600',
    },
  ];

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
            <div className="h-64">
              {revenueData && revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No revenue data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities && activities.length > 0 ? (
                activities.map((activity: any) => (
                  <div key={activity._id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Activity size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
