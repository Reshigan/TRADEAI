import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const ExecutiveDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [selectedYear]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const response = await axios.get(`${API_BASE_URL}/dashboards/executive?year=${selectedYear}`, { headers });
      
      if (response?.data?.success) {
        setDashboardData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportDashboard = async (format) => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_BASE_URL}/dashboards/executive/export/${format}?year=${selectedYear}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `executive-dashboard-${selectedYear}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { 
    style: 'currency', 
    currency: 'ZAR', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);

  const formatNumber = (num) => new Intl.NumberFormat('en-ZA').format(num || 0);

  const getGrowthColor = (growth) => {
    if (growth > 0) return '#10b981';
    if (growth < 0) return '#ef4444';
    return '#6b7280';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return '📈';
    if (growth < 0) return '📉';
    return '➡️';
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
        <div>Loading Executive Dashboard...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
        <div>Failed to load dashboard data</div>
      </div>
    );
  }

  const { kpis, monthlyTrend, topPerformers, activePromotions, tradeSpendBreakdown } = dashboardData;

  // Prepare monthly trend chart data
  const monthlyChartData = {
    labels: monthlyTrend.map(m => m.month),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyTrend.map(m => m.revenue),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Volume',
        data: monthlyTrend.map(m => m.volume),
        borderColor: 'rgb(67, 233, 123)',
        backgroundColor: 'rgba(67, 233, 123, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Revenue & Volume Trend'
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: (value) => formatNumber(value)
        }
      },
    }
  };

  // Prepare trade spend breakdown chart
  const tradeSpendChartData = {
    labels: tradeSpendBreakdown.map(t => t.type),
    datasets: [
      {
        label: 'Trade Spend by Type',
        data: tradeSpendBreakdown.map(t => t.amount),
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(240, 147, 251, 0.8)',
          'rgba(79, 172, 254, 0.8)',
          'rgba(67, 233, 123, 0.8)',
          'rgba(245, 87, 108, 0.8)',
        ],
      }
    ]
  };

  const tradeSpendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Trade Spend Breakdown'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0 }}>📊 Executive Dashboard</h1>
          <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>Year-to-Date Performance Overview</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {[2024, 2023, 2022, 2021, 2020].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={() => exportDashboard('excel')}
            disabled={exporting}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: exporting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: exporting ? 0.6 : 1
            }}
          >
            📊 Export Excel
          </button>
          <button
            onClick={() => exportDashboard('pdf')}
            disabled={exporting}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: exporting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: exporting ? 0.6 : 1
            }}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '25px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Revenue (YTD)</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{formatCurrency(kpis.revenue.ytd)}</div>
          <div style={{ fontSize: '14px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>{getGrowthIcon(kpis.revenue.growth)}</span>
            <span style={{ color: kpis.revenue.growth >= 0 ? '#d1fae5' : '#fecaca' }}>
              {kpis.revenue.growth.toFixed(1)}% vs last year
            </span>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', padding: '25px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Volume (YTD)</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{formatNumber(kpis.volume.ytd)} units</div>
          <div style={{ fontSize: '14px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>{getGrowthIcon(kpis.volume.growth)}</span>
            <span style={{ color: kpis.volume.growth >= 0 ? '#d1fae5' : '#fecaca' }}>
              {kpis.volume.growth.toFixed(1)}% vs last year
            </span>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px', padding: '25px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Gross Margin</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{formatCurrency(kpis.margin.amount)}</div>
          <div style={{ fontSize: '14px', marginTop: '10px' }}>
            Margin: {kpis.margin.percentage.toFixed(1)}%
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '12px', padding: '25px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Trade Spend</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>{formatCurrency(kpis.tradeSpend.total)}</div>
          <div style={{ fontSize: '14px', marginTop: '10px' }}>
            Utilization: {kpis.tradeSpend.utilization.toFixed(1)}% | ROI: {kpis.tradeSpend.roi.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ height: '300px' }}>
            <Line data={monthlyChartData} options={monthlyChartOptions} />
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ height: '300px' }}>
            <Bar data={tradeSpendChartData} options={tradeSpendChartOptions} />
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>🏆 Top Customers</h3>
          {topPerformers.customers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topPerformers.customers.slice(0, 5).map((customer, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                  <span style={{ fontWeight: '500' }}>{customer.name}</span>
                  <span style={{ color: '#667eea', fontWeight: 'bold' }}>{formatCurrency(customer.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af' }}>No customer data available</p>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>🎯 Top Products</h3>
          {topPerformers.products.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topPerformers.products.slice(0, 5).map((product, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                  <span style={{ fontWeight: '500' }}>{product.name}</span>
                  <span style={{ color: '#f5576c', fontWeight: 'bold' }}>{formatCurrency(product.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af' }}>No product data available</p>
          )}
        </div>
      </div>

      {/* Active Promotions Indicator */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d' }}>
        <span style={{ fontSize: '16px', fontWeight: '500' }}>
          🎉 Active Promotions: <strong>{activePromotions}</strong>
        </span>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
