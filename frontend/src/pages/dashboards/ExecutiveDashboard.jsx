import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  Grid,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';
import api from '../../services/api';
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
      const response = await api.get(`/dashboards/executive?year=${selectedYear}`);
      
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
      
      const response = await api.get(
        `/dashboards/executive/export/${format}?year=${selectedYear}`,
        { responseType: 'blob'
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
    if (growth > 0) return 'success';
    if (growth < 0) return 'error';
    return 'default';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <TrendingUpIcon fontSize="small" />;
    if (growth < 0) return <TrendingDownIcon fontSize="small" />;
    return <TrendingFlatIcon fontSize="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" mb={2}>
          Failed to load dashboard data
        </Typography>
        <Button variant="contained" onClick={fetchDashboard}>
          Retry
        </Button>
      </Box>
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
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Executive Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Year-to-Date Performance Overview
            </Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                sx={{ borderRadius: 2 }}
              >
                {[2024, 2023, 2022, 2021, 2020].map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={() => exportDashboard('excel')}
              disabled={exporting}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Export Excel
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DownloadIcon />}
              onClick={() => exportDashboard('pdf')}
              disabled={exporting}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Export PDF
            </Button>
          </Box>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
              color: 'white',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Revenue (YTD)
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 1.5 }}>
              {formatCurrency(kpis.revenue.ytd)}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {getGrowthIcon(kpis.revenue.growth)}
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {kpis.revenue.growth.toFixed(1)}% vs last year
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: 'white',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Volume (YTD)
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 1.5 }}>
              {formatNumber(kpis.volume.ytd)} units
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {getGrowthIcon(kpis.volume.growth)}
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {kpis.volume.growth.toFixed(1)}% vs last year
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              color: 'white',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Gross Margin
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 1.5 }}>
              {formatCurrency(kpis.margin.amount)}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Margin: {kpis.margin.percentage.toFixed(1)}%
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Trade Spend
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 1.5 }}>
              {formatCurrency(kpis.tradeSpend.total)}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Utilization: {kpis.tradeSpend.utilization.toFixed(1)}% | ROI: {kpis.tradeSpend.roi.toFixed(1)}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Box sx={{ height: 350 }}>
              <Line data={monthlyChartData} options={monthlyChartOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Box sx={{ height: 350 }}>
              <Bar data={tradeSpendChartData} options={tradeSpendChartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Performers */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Top Customers
            </Typography>
            {topPerformers.customers.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {topPerformers.customers.slice(0, 5).map((customer, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {customer.name}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {formatCurrency(customer.revenue)}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No customer data available
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Top Products
            </Typography>
            {topPerformers.products.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {topPerformers.products.slice(0, 5).map((product, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="error.main">
                      {formatCurrency(product.revenue)}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No product data available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Active Promotions Indicator */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'warning.lighter',
          border: '1px solid',
          borderColor: 'warning.main'
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body1" fontWeight={600}>
            Active Promotions:
          </Typography>
          <Chip
            label={activePromotions}
            color="warning"
            sx={{ fontWeight: 700 }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default ExecutiveDashboard;
