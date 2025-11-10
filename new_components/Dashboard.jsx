import React, { useEffect, useState } from 'react';
import { Box, Grid, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/KPICard';
import ChartWidget from '../components/ChartWidget';
import ActivityFeed from '../components/ActivityFeed';
import QuickActions from '../components/QuickActions';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CampaignIcon from '@mui/icons-material/Campaign';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';

const Dashboard = () => {
  const navigate = useNavigate();
  const [kpiData, setKpiData] = useState({
    totalBudget: { value: 'R 2.5M', trend: 'up', percentage: 15 },
    activePromotions: { value: '12', trend: 'up', percentage: 3 },
    tradeSpendMTD: { value: 'R 450K', trend: 'down', percentage: 8 },
    pendingRebates: { value: '8', trend: 'neutral', percentage: 0 }
  });

  const [budgetData, setBudgetData] = useState({
    labels: ['Marketing', 'Trade', 'Rebates', 'Other'],
    datasets: [{
      data: [40, 35, 20, 5],
      backgroundColor: ['#1976D2', '#388E3C', '#FF9800', '#607D8B']
    }]
  });

  const [promotionData, setPromotionData] = useState({
    labels: ['Summer Sale', 'BOGO', 'Clearance', 'Black Friday', 'Holiday'],
    datasets: [{
      label: 'ROI %',
      data: [85, 78, 72, 65, 60],
      backgroundColor: '#1976D2'
    }]
  });

  const [trendData, setTrendData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Trade Spend',
      data: [420, 510, 480, 560, 490, 450],
      borderColor: '#1976D2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      tension: 0.4
    }]
  });

  const [recentActivities, setRecentActivities] = useState([
    {
      type: 'budget',
      description: 'Q2 Marketing Budget approved',
      status: 'completed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      type: 'promotion',
      description: 'Summer Sale promotion launched',
      status: 'active',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      type: 'spend',
      description: 'Trade spend logged - R 25,000',
      status: 'completed',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Budget"
            value={kpiData.totalBudget.value}
            trend={kpiData.totalBudget.trend}
            trendPercentage={kpiData.totalBudget.percentage}
            icon={AccountBalanceIcon}
            color="primary"
            onClick={() => navigate('/budgets')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Promotions"
            value={kpiData.activePromotions.value}
            trend={kpiData.activePromotions.trend}
            trendPercentage={kpiData.activePromotions.percentage}
            icon={CampaignIcon}
            color="secondary"
            onClick={() => navigate('/promotions')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Trade Spend MTD"
            value={kpiData.tradeSpendMTD.value}
            trend={kpiData.tradeSpendMTD.trend}
            trendPercentage={kpiData.tradeSpendMTD.percentage}
            icon={ShoppingCartIcon}
            color="success"
            onClick={() => navigate('/trade-spends')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pending Rebates"
            value={kpiData.pendingRebates.value}
            trend={kpiData.pendingRebates.trend}
            trendPercentage={kpiData.pendingRebates.percentage}
            icon={ReceiptIcon}
            color="info"
            onClick={() => navigate('/rebates')}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Budget Overview */}
        <Grid item xs={12} md={4}>
          <ChartWidget
            title="Budget Allocation"
            type="doughnut"
            data={budgetData}
            height={300}
          />
        </Grid>

        {/* Promotion Performance */}
        <Grid item xs={12} md={4}>
          <ChartWidget
            title="Top Promotions by ROI"
            type="bar"
            data={promotionData}
            height={300}
          />
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <ActivityFeed activities={recentActivities} limit={10} />
        </Grid>

        {/* Spend Trend */}
        <Grid item xs={12} md={8}>
          <ChartWidget
            title="Trade Spend Trend (6 Months)"
            type="line"
            data={trendData}
            height={300}
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <QuickActions />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
