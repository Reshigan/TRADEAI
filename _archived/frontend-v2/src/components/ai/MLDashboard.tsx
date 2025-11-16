import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mlService } from '../../api/services/ml';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Brain, TrendingUp, Users, DollarSign, Package, Activity } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const MLDashboard: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('sales-forecast');

  // Fetch revenue forecast
  const { data: revenueforecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['ml-forecast-revenue'],
    queryFn: () => mlService.forecastRevenue(30),
  });

  const models = [
    { id: 'sales-forecast', name: 'Sales Forecast', icon: TrendingUp },
    { id: 'churn-prediction', name: 'Churn Prediction', icon: Users },
    { id: 'revenue-forecast', name: 'Revenue Forecast', icon: DollarSign },
    { id: 'product-recommend', name: 'Product Recommendations', icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Brain className="text-purple-600" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ML Dashboard</h1>
            <p className="text-gray-600 mt-1">Machine learning predictions and insights</p>
          </div>
        </div>
        <Badge variant="success" className="flex items-center gap-2">
          <Activity size={16} />
          All Models Active
        </Badge>
      </div>

      {/* Model Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {models.map((model) => {
          const Icon = model.icon;
          const isSelected = selectedModel === model.id;
          return (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  <Icon className={isSelected ? 'text-purple-600' : 'text-gray-600'} size={24} />
                </div>
                <div className="text-left">
                  <p className={`font-semibold ${isSelected ? 'text-purple-600' : 'text-gray-900'}`}>
                    {model.name}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Revenue Forecast Chart */}
      {selectedModel === 'revenue-forecast' && (
        <Card>
          <CardHeader>
            <CardTitle>30-Day Revenue Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            {forecastLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : revenueforecast && revenueforecast.forecasts ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueforecast.forecasts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      name="Predicted"
                      dot={{ fill: '#7c3aed' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="lower"
                      stroke="#c4b5fd"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="Lower Bound"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="upper"
                      stroke="#c4b5fd"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="Upper Bound"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Model Accuracy</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {revenueforecast.accuracy ? (revenueforecast.accuracy * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Model Type</p>
                      <p className="text-lg font-semibold text-gray-900">{revenueforecast.model}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                No forecast data available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sales Forecast */}
      {selectedModel === 'sales-forecast' && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Forecast by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-400 py-20">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a product to view sales forecast</p>
              <Button className="mt-4">Select Product</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Churn Prediction */}
      {selectedModel === 'churn-prediction' && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Churn Risk Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-400 py-20">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Loading churn predictions...</p>
              <Button className="mt-4">View At-Risk Customers</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Recommendations */}
      {selectedModel === 'product-recommend' && (
        <Card>
          <CardHeader>
            <CardTitle>AI Product Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-400 py-20">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a customer to view product recommendations</p>
              <Button className="mt-4">Select Customer</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
