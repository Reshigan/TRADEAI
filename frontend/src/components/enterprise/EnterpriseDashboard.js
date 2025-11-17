import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tab,
  Tabs,
  Paper,
  Chip,
  MenuItem,
  TextField,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
  Divider,
  Snackbar
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Refresh,
  AccountBalance,
  AttachMoney,
  ShowChart,
  BarChart,
  CompareArrows,
  Psychology,
  Speed
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart as RechartsBar,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import enterpriseApi from '../../services/enterpriseApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`enterprise-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await enterpriseApi.enterpriseBudget.getDashboard({});
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const _showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && !dashboardData) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2 }}>
          Loading Enterprise Dashboard...
        </Typography>
      </Box>
    );
  }

  if (error && !dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadDashboardData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Enterprise Command Center
        </Typography>
        <Button startIcon={<Refresh />}>
          Refresh
        </Button>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Budget"
            value="$12.5M"
            change="+12.5%"
            trend="up"
            icon={<AccountBalance />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="ROI"
            value="245%"
            change="+8.3%"
            trend="up"
            icon={<TrendingUp />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Budget Utilization"
            value="78.5%"
            change="+2.1%"
            trend="up"
            icon={<Speed />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Scenarios"
            value="12"
            change="+3"
            trend="up"
            icon={<CompareArrows />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Budget Intelligence" icon={<Assessment />} iconPosition="start" />
          <Tab label="Trade Spend Analytics" icon={<AttachMoney />} iconPosition="start" />
          <Tab label="Promotion Simulator" icon={<Psychology />} iconPosition="start" />
          <Tab label="What-If Scenarios" icon={<CompareArrows />} iconPosition="start" />
          <Tab label="Profitability Analysis" icon={<ShowChart />} iconPosition="start" />
          <Tab label="Master Data" icon={<BarChart />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <BudgetIntelligencePanel />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <TradeSpendAnalyticsPanel />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <PromotionSimulatorPanel />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <WhatIfScenariosPanel />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <ProfitabilityAnalysisPanel />
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        <MasterDataPanel />
      </TabPanel>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Metric Card Component
function MetricCard({ title, value, change, trend, icon, color }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              bgcolor: `${color}20`,
              color: color,
              p: 1,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {icon}
          </Box>
          <Chip
            size="small"
            label={change}
            color={trend === 'up' ? 'success' : 'error'}
            icon={trend === 'up' ? <TrendingUp /> : <TrendingDown />}
          />
        </Box>
        <Typography variant="h4" gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
}

// Budget Intelligence Panel
function BudgetIntelligencePanel() {
  const budgetData = {
    monthly: [
      { month: 'Jan', planned: 1000000, actual: 950000, forecast: 980000 },
      { month: 'Feb', planned: 1100000, actual: 1050000, forecast: 1080000 },
      { month: 'Mar', planned: 1200000, actual: 1180000, forecast: 1190000 },
      { month: 'Apr', planned: 1150000, actual: 1120000, forecast: 1140000 },
      { month: 'May', planned: 1300000, actual: null, forecast: 1280000 },
      { month: 'Jun', planned: 1250000, actual: null, forecast: 1230000 }
    ],
    variance: [
      { category: 'Marketing', budgeted: 500000, actual: 480000, variance: -4 },
      { category: 'Promotions', budgeted: 600000, actual: 630000, variance: 5 },
      { category: 'Trading Terms', budgeted: 400000, actual: 390000, variance: -2.5 },
      { category: 'Cash Coop', budgeted: 300000, actual: 310000, variance: 3.3 }
    ]
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Budget Performance Trend
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={budgetData.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="planned" stroke="#8884d8" name="Planned" />
                <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Actual" />
                <Line type="monotone" dataKey="forecast" stroke="#ffc658" strokeDasharray="5 5" name="Forecast" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="contained" startIcon={<CompareArrows />} fullWidth>
                Create Scenario
              </Button>
              <Button variant="outlined" startIcon={<Psychology />} fullWidth>
                Run Simulation
              </Button>
              <Button variant="outlined" startIcon={<Assessment />} fullWidth>
                Variance Analysis
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Category Variance Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBar data={budgetData.variance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="budgeted" fill="#8884d8" name="Budgeted" />
                <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
              </RechartsBar>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Alerts
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Alert severity="warning">
                Promotions category 5% over budget this quarter
              </Alert>
              <Alert severity="info">
                Marketing underspend detected - consider reallocation
              </Alert>
              <Alert severity="success">
                Q1 ROI exceeded target by 15%
              </Alert>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AI Recommendations
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Optimize Budget Allocation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reallocate 10% from low-ROI categories to high performers for 15% improvement
                </Typography>
                <Chip label="High Priority" size="small" color="error" sx={{ mt: 1 }} />
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Streamline Approvals
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reduce approval cycle time by 30% with workflow optimization
                </Typography>
                <Chip label="Medium Priority" size="small" color="warning" sx={{ mt: 1 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// Trade Spend Analytics Panel
function TradeSpendAnalyticsPanel() {
  const spendData = [
    { category: 'Marketing', value: 3500000, roi: 250 },
    { category: 'Promotions', value: 4200000, roi: 180 },
    { category: 'Trading Terms', value: 2800000, roi: 220 },
    { category: 'Cash Coop', value: 2000000, roi: 200 }
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Spend Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie data={spendData}>
                <Pie
                  data={spendData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) =>
                    `${category}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {spendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ROI by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBar data={spendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="roi" fill="#82ca9d" />
              </RechartsBar>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Real-Time Spend Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Monitor trade spend transactions in real-time with automated reconciliation
            </Typography>
            <Button variant="contained" startIcon={<Refresh />}>
              View Live Transactions
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// Promotion Simulator Panel
function PromotionSimulatorPanel() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Promotion Simulation Engine
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Test different promotion scenarios before execution
            </Typography>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Discount %" type="number" defaultValue={15} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Duration (days)" type="number" defaultValue={14} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Investment" type="number" defaultValue={50000} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Promotion Type</InputLabel>
                  <Select defaultValue="discount">
                    <MenuItem value="discount">Discount</MenuItem>
                    <MenuItem value="bogo">BOGO</MenuItem>
                    <MenuItem value="bundle">Bundle</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" fullWidth size="large" startIcon={<Psychology />}>
                  Run Simulation
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Expected ROI</Typography>
            <Typography variant="h3" color="success.main">245%</Typography>
            <Typography variant="body2" color="text.secondary">Confidence: 85%</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Volume Uplift</Typography>
            <Typography variant="h3" color="primary.main">+35%</Typography>
            <Typography variant="body2" color="text.secondary">vs Baseline</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Breakeven</Typography>
            <Typography variant="h3" color="warning.main">7 days</Typography>
            <Typography variant="body2" color="text.secondary">Payback Period</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// What-If Scenarios Panel
function WhatIfScenariosPanel() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scenario Comparison
            </Typography>
            <Button variant="contained" startIcon={<CompareArrows />} sx={{ mb: 2 }}>
              Create New Scenario
            </Button>
            <Typography variant="body2" color="text.secondary">
              Compare multiple budget scenarios side-by-side
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// Profitability Analysis Panel
function ProfitabilityAnalysisPanel() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              P&L Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive profitability analysis with margin tracking
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// Master Data Panel
function MasterDataPanel() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Master Data Management
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Manage product and customer hierarchies, data quality, and versioning
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined">Product Hierarchy</Button>
              <Button variant="outlined">Customer Hierarchy</Button>
              <Button variant="outlined">Data Quality</Button>
              <Button variant="outlined">Deduplication</Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
