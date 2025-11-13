import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingUp, Target, Users } from 'lucide-react'
import KPICard from '../components/dashboard/KPICard'
import ChartWidget from '../components/dashboard/ChartWidget'
import AlertsWidget from '../components/dashboard/AlertsWidget'
import { dashboardApi } from '../api/dashboard'

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getExecutiveDashboard()
      return response.data.data
    },
  })

  // Mock data for charts (will be replaced with real API data)
  const performanceData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 4500 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 5500 },
  ]

  const budgetData = [
    { name: 'Trade Marketing', value: 45 },
    { name: 'Consumer Promo', value: 30 },
    { name: 'In-Store', value: 15 },
    { name: 'Digital', value: 10 },
  ]

  const alerts = [
    {
      id: '1',
      type: 'warning' as const,
      title: 'Budget Alert',
      message: 'Q2 budget is 85% utilized with 2 weeks remaining',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'New Promotion',
      message: 'Summer Sale campaign starts next week',
      timestamp: '5 hours ago',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Executive Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Trade Spend"
          value="$45.2M"
          change={12}
          trend="up"
          icon={<DollarSign size={24} />}
        />
        <KPICard
          title="Budget Utilization"
          value="78%"
          change={5}
          trend="up"
          icon={<Target size={24} />}
        />
        <KPICard
          title="Average ROI"
          value="3.2x"
          change={8}
          trend="up"
          icon={<TrendingUp size={24} />}
        />
        <KPICard
          title="Active Customers"
          value="1,245"
          change={15}
          trend="up"
          icon={<Users size={24} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartWidget
          title="Trade Spend Trend"
          type="area"
          data={performanceData}
          dataKey="value"
          xAxisKey="name"
        />
        <ChartWidget
          title="Budget Distribution"
          type="pie"
          data={budgetData}
          dataKey="value"
          xAxisKey="name"
        />
      </div>

      {/* Additional Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartWidget
            title="Performance by Category"
            type="bar"
            data={performanceData}
            dataKey="value"
            xAxisKey="name"
            height={250}
          />
        </div>
        <AlertsWidget alerts={alerts} />
      </div>
    </div>
  )
}
