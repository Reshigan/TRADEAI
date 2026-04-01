import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Chip, 
  Typography, 
  LinearProgress, 
  useTheme,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon
} from '@mui/icons-material';
import { AIEnhancedPage, SmartDataGrid, PageHeader } from '../common';
import { budgetService } from '../../services/api';
import { formatLabel, formatCurrencyCompact } from '../../utils/formatters';
import { useToast } from '../common/ToastNotification';

// Hermes-style recommendation engine
const budgetAdvisor = (budgets) => {
  if (!budgets || budgets.length === 0) {
    return {
      insights: [],
      recommendations: [],
      risks: [],
      opportunities: []
    };
  }

  const advisorData = {
    insights: [],
    recommendations: [],
    risks: [],
    opportunities: []
  };

  // Calculate key metrics for analysis
  const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.utilized || b.spent || 0), 0);
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // High-level insights
  advisorData.insights.push({
    id: 'overall-utilization',
    title: 'Overall Budget Utilization',
    message: `Currently utilizing ${utilizationRate.toFixed(1)}% of allocated budget`,
    type: utilizationRate > 90 ? 'risk' : 
           utilizationRate > 70 ? 'info' : 
           utilizationRate > 30 ? 'success' : 'warning',
    confidence: 0.95,
    priority: 'high'
  });

  // Risk identification
  budgets.forEach(budget => {
    const spent = budget.utilized || budget.spent || 0;
    const amount = budget.amount || 1;
    const utilization = (spent / amount) * 100;
    
    if (utilization > 95) {
      advisorData.risks.push({
        id: `risk-${budget.id}`,
        title: `Budget Depletion Risk`,
        message: `${formatLabel(budget.name || budget.customerName || 'Unnamed Budget')} is ${utilization.toFixed(0)}% spent`,
        type: 'critical',
        confidence: 0.92,
        budgetId: budget.id,
        action: `/budgets/${budget.id}`
      });
    }
    
    if (utilization < 30 && budget.status === 'active') {
      advisorData.opportunities.push({
        id: `opportunity-${budget.id}`,
        title: `Reallocate Underutilized Budget`,
        message: `${formatLabel(budget.name || budget.customerName || 'Unnamed Budget')} has ${100 - utilization.toFixed(0)}% unspent budget`,
        type: 'info',
        confidence: 0.85,
        budgetId: budget.id,
        action: `/budgets/${budget.id}/reallocate`
      });
    }
  });

  // Strategic recommendations
  if (utilizationRate > 90) {
    advisorData.recommendations.push({
      id: 'realloc-recommend',
      title: `Strategic Reallocation Recommended`,
      message: `Consider moving funds to underperforming areas for balanced spend`,
      type: 'strategy',
      confidence: 0.88,
      action: '/scenarios'
    });
  }

  advisorData.recommendations.push({
    id: 'forecast-recommend',
    title: `Forecast Next Quarter Needs`,
    message: `Use predictive analytics to plan upcoming budget requirements`,
    type: 'strategy',
    confidence: 0.81,
    action: '/forecasting'
  });

  return advisorData;
};

const BudgetListEnhanced = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const theme = useTheme();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [advisor, setAdvisor] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      setError(null);
      
      const response = await budgetService.getAll();
      const budgetData = response.data || response || [];
      setBudgets(budgetData);
      
      // Generate advisor insights
      const advisorInsights = budgetAdvisor(budgetData);
      setAdvisor(advisorInsights);
    } catch (error) {
      console.error("BudgetListEnhanced: Error fetching budgets:", error);
      setError(error.message || "Failed to load budgets. Please try again.");
      setSnackbar({
        open: true,
        message: `Error loading budgets: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
      toast.error('Error fetching budgets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchBudgets(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleAdvisorAction = (action) => {
    if (action) {
      navigate(action);
    }
  };

  const generateAIInsights = () => {
    if (!advisor) return [];
    
    // Convert advisor insights to format expected by AIEnhancedPage
    const insights = [];
    
    // Add overall insights
    advisor.insights.forEach(insight => {
      insights.push({
        title: insight.title,
        description: insight.message,
        confidence: insight.confidence || 0.8
      });
    });
    
    // Add risks
    advisor.risks.forEach(risk => {
      insights.push({
        title: risk.title,
        description: risk.message,
        confidence: risk.confidence || 0.9
      });
    });
    
    // Add recommendations
    advisor.recommendations.forEach(rec => {
      insights.push({
        title: rec.title,
        description: rec.message,
        confidence: rec.confidence || 0.8
      });
    });
    
    return insights;
  };

  const getQuickActions = () => [
    {
      icon: '',
      label: 'Allocate Budget',
      description: 'Create new budget allocation with AI recommendations',
      action: () => navigate('/budgets/new')
    },
    {
      icon: '',
      label: 'Budget Analytics',
      description: 'View spend analysis and utilization trends',
      action: () => navigate('/reports/budget')
    },
    {
      icon: '',
      label: 'Rebalance Budgets',
      description: 'AI-powered budget reallocation optimizer',
      action: () => navigate('/scenarios')
    },
    {
      icon: '',
      label: 'Forecast Spend',
      description: 'Predict budget needs for upcoming period',
      action: () => navigate('/forecasting')
    }
  ];

  const getTips = () => [
    'Tip: Budgets with <50% utilization may benefit from reallocation',
    'Tip: Use the AI optimizer to balance spend across categories',
    'Tip: Track ROI per budget category for data-driven decisions',
    'Tip: Schedule regular budget reviews to stay on target'
  ];

  const generateRowInsights = () => {
    const insights = {};
    
    if (!budgets || !advisor) return insights;
    
    // Map advisor insights to specific rows
    advisor.risks.forEach(risk => {
      if (risk.budgetId) {
        insights[risk.budgetId] = {
          type: 'risk',
          message: risk.message
        };
      }
    });
    
    advisor.opportunities.forEach(opportunity => {
      if (opportunity.budgetId) {
        insights[opportunity.budgetId] = {
          type: 'opportunity',
          message: opportunity.message
        };
      }
    });
    
    return insights;
  };

  const columns = [
    {
      id: 'name',
      label: 'Budget Name',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600">{value}</Typography>
      )
    },
    {
      id: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <Chip label={value} size="small" color="secondary" variant="outlined" />
      )
    },
    {
      id: 'amount',
      label: 'Allocated',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600">
          R{(value || 0).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'spent',
      label: 'Spent',
      sortable: true,
      render: (value, row) => (
        <Typography variant="body2">
          R{((row?.utilized || row?.spent || value || 0)).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'utilization',
      label: 'Utilization',
      sortable: true,
      render: (value, row) => {
        const spent = row?.utilized || row?.spent || 0;
        const amount = row?.amount || 1;
        const percent = (spent / amount) * 100;
        return (
          <Box sx={{ width: 120 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">{percent.toFixed(0)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(percent, 100)}
              color={percent > 90 ? 'error' : percent > 70 ? 'warning' : 'success'}
            />
          </Box>
        );
      }
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Chip
          label={formatLabel(value)}
          size="small"
          color={value === 'active' ? 'success' : 'default'}
        />
      )
    },
    {
      id: 'period',
      label: 'Period',
      render: (value) => value || 'Annual'
    }
  ];

  // Compute budget statistics
  const budgetStats = useMemo(() => {
    if (!budgets) return { total: 0, allocated: 0, spent: 0, utilization: 0 };
    
    const totalAmount = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.utilized || b.spent || 0), 0);
    const utilization = totalAmount > 0 ? (totalSpent / totalAmount) * 100 : 0;
    
    return {
      total: budgets.length,
      allocated: totalAmount,
      spent: totalSpent,
      utilization: utilization
    };
  }, [budgets]);

  return (
    <AIEnhancedPage
      pageContext="budgets"
      contextData={{ total: budgetStats.total, allocated: budgetStats.allocated }}
      aiInsights={generateAIInsights()}
      quickActions={getQuickActions()}
      tips={getTips()}
    >
      <Box>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? 'Retrying...' : 'Retry'}
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        <PageHeader
          title="Budget Management"
          subtitle={`Managing ${budgets.length} budget allocations (${formatCurrencyCompact(budgetStats.allocated)} total)`}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/budgets/new')}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              Create Budget
            </Button>
          }
        />

        <Box sx={{ mt: 3 }}>
          <SmartDataGrid
            title={`Budgets (${budgets.length})`}
            data={budgets}
            columns={columns}
            onRowClick={(budget) => navigate(`/budgets/${budget.id || budget._id}`)}
            aiInsights={generateRowInsights()}
            enableAI={true}
            enableExport={true}
            emptyMessage={loading ? "Loading budgets..." : "No budgets found"}
          />
        </Box>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AIEnhancedPage>
  );
};

export default BudgetListEnhanced;
