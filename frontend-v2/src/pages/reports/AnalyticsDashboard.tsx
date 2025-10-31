import { TrendingUp, TrendingDown, DollarSign, Users, Package, Download } from 'lucide-react';
import { AdvancedLineChart } from '../../components/charts/AdvancedLineChart';
import { InteractiveBarChart } from '../../components/charts/InteractiveBarChart';
import { PieChartDrilldown } from '../../components/charts/PieChartDrilldown';

export default function AnalyticsDashboard() {
  // Mock data - will be replaced with real API calls
  const revenueData = [
    { month: 'Jan', revenue: 45000, target: 50000 },
    { month: 'Feb', revenue: 52000, target: 50000 },
    { month: 'Mar', revenue: 48000, target: 50000 },
    { month: 'Apr', revenue: 61000, target: 55000 },
    { month: 'May', revenue: 58000, target: 55000 },
    { month: 'Jun', revenue: 67000, target: 60000 },
  ];

  const categoryData = [
    { category: 'Electronics', revenue: 125000, percent: 35 },
    { category: 'Clothing', revenue: 95000, percent: 27 },
    { category: 'Food', revenue: 75000, percent: 21 },
    { category: 'Other', revenue: 60000, percent: 17 },
  ];

  const kpis = [
    { name: 'Total Revenue', value: 355000, target: 400000, unit: '$', trend: 'up', change: 12.5 },
    { name: 'Active Customers', value: 1254, target: 1500, unit: '', trend: 'up', change: 8.3 },
    { name: 'Avg Order Value', value: 283, target: 300, unit: '$', trend: 'up', change: 5.2 },
    { name: 'Conversion Rate', value: 3.8, target: 4.5, unit: '%', trend: 'down', change: -2.1 },
  ];

  const handleExport = (format: string) => {
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Advanced analytics and reporting</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{kpi.name}</p>
              {kpi.trend === 'up' ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {kpi.unit === '$' && '$'}
              {kpi.value.toLocaleString()}
              {kpi.unit === '%' && '%'}
            </p>
            <div className="mt-2 flex items-center">
              <span
                className={`text-sm font-medium ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {kpi.change > 0 ? '+' : ''}
                {kpi.change}%
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last period</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  kpi.value >= kpi.target ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Target: {kpi.unit === '$' && '$'}
              {kpi.target.toLocaleString()}
              {kpi.unit === '%' && '%'}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend</h2>
        <AdvancedLineChart data={revenueData} xKey="month" yKey="revenue" />
      </div>

      {/* Category Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue by Category</h2>
          <PieChartDrilldown data={categoryData} nameKey="category" valueKey="revenue" />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Category Comparison</h2>
          <InteractiveBarChart
            data={categoryData}
            xKey="category"
            yKey="revenue"
            colors={['#4F46E5', '#06B6D4', '#10B981', '#F59E0B']}
          />
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performing Products</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { name: 'Product A', units: 1250, revenue: 125000, growth: 15.3 },
                { name: 'Product B', units: 980, revenue: 98000, growth: 8.7 },
                { name: 'Product C', units: 875, revenue: 87500, growth: 12.1 },
                { name: 'Product D', units: 750, revenue: 75000, growth: -3.2 },
                { name: 'Product E', units: 620, revenue: 62000, growth: 5.8 },
              ].map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {product.units.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    ${product.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-medium ${
                        product.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {product.growth > 0 ? '+' : ''}
                      {product.growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
