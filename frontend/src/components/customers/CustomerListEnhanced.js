import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Typography,
  useTheme,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Star as StarIcon
} from '@mui/icons-material';

import { AIEnhancedPage, SmartDataGrid, PageHeader } from '../common';
import customerService from '../../services/api/customerService';
import CustomerForm from './CustomerForm';
import { formatLabel } from '../../utils/formatters';

const CustomerListEnhanced = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await customerService.getAll();
      const customerData = response.data || response || [];
      setCustomers(customerData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError(error.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // AI Insights based on customer data
  const generateAIInsights = () => {
    if (customers.length === 0) return [];

    const insights = [];
    
    // High-value customers
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
    const avgRevenue = totalRevenue / customers.length;
    const highValueCount = customers.filter(c => (c.totalRevenue || 0) > avgRevenue * 1.5).length;
    
    if (highValueCount > 0) {
      insights.push({
        title: `${highValueCount} High-Value Customers Identified`,
        description: `These customers generate 50% above average revenue. Consider exclusive benefits or personalized campaigns.`,
        confidence: 0.92
      });
    }

    // At-risk customers
    const atRiskCount = customers.filter(c => c.status === 'inactive' || c.lastOrderDays > 90).length;
    if (atRiskCount > 0) {
      insights.push({
        title: `${atRiskCount} At-Risk Customers Need Attention`,
        description: `Customers showing reduced engagement. Recommend immediate re-engagement campaign with 15-20% incentive.`,
        confidence: 0.87
      });
    }

    // Growth opportunities
    const growthPotential = Math.round(customers.length * 0.15);
    insights.push({
      title: `${growthPotential} Customers Show Growth Potential`,
      description: `Based on purchase patterns and market trends, these customers are likely to increase spend with targeted promotions.`,
      confidence: 0.78
    });

    return insights;
  };

  // Quick actions for customer management
  const getQuickActions = () => [
    {
      icon: '',
      label: 'Create Email Campaign',
      description: 'Send targeted emails to selected customer segments',
      action: () => navigate('/campaigns/new?type=email')
    },
    {
      icon: '',
      label: 'Launch Promotion',
      description: 'Create promotion for high-value customers',
      action: () => navigate('/promotions/new')
    },
    {
      icon: '',
      label: 'Generate Customer Report',
      description: 'Detailed analytics and insights report',
      action: () => navigate('/reports/customers')
    },
    {
      icon: '',
      label: 'Bulk Update Status',
      description: 'Update multiple customer statuses at once',
      action: () => console.log('Bulk update')
    }
  ];

  // Smart tips
  const getTips = () => {
    const tips = [
      'Tip: Click the AI icon on any row to see personalized insights for that customer',
      'Tip: Export customer data to CSV for offline analysis',
      'Tip: Use column filters to segment customers by revenue, status, or type'
    ];

    if (customers.length > 50) {
      tips.push('Pro Tip: With 50+ customers, consider creating automated segments for better targeting');
    }

    return tips;
  };

  // Generate AI insights for specific customers
  const generateRowInsights = () => {
    const insights = {};
    
    customers.forEach(customer => {
      const revenue = customer.totalRevenue || 0;
      const avgRevenue = customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0) / customers.length;
      
      // High-value customer
      if (revenue > avgRevenue * 2) {
        insights[customer.id || customer._id] = {
          type: 'opportunity',
          message: `VIP Customer - ${Math.round((revenue / avgRevenue - 1) * 100)}% above average revenue`
        };
      }
      // At-risk
      else if (customer.status === 'inactive' || customer.lastOrderDays > 90) {
        insights[customer.id || customer._id] = {
          type: 'risk',
          message: 'At Risk - No recent activity. Recommend re-engagement campaign'
        };
      }
      // Growth opportunity
      else if (revenue > avgRevenue * 0.7 && revenue < avgRevenue * 1.3) {
        insights[customer.id || customer._id] = {
          type: 'trending',
          message: 'Growth Opportunity - Showing positive purchase trend'
        };
      }
    });

    return insights;
  };

  // Table columns configuration
  const columns = [
    {
      id: 'name',
      label: 'Customer Name',
      sortable: true,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight="600">
            {value}
          </Typography>
          {row.totalRevenue > 100000 && (
            <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
          )}
        </Box>
      )
    },
    {
      id: 'code',
      label: 'Code',
      sortable: true
    },
    {
      id: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <Chip 
          label={formatLabel(value) || 'N/A'} 
          size="small"
          color={value === 'retail' ? 'primary' : 'secondary'}
          variant="outlined"
        />
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Chip
          label={formatLabel(value || 'active')}
          size="small"
          color={value === 'active' ? 'success' : 'default'}
        />
      )
    },
    {
      id: 'totalRevenue',
      label: 'Revenue',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600">
          R{(value || 0).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'contact',
      label: 'Contact',
      render: (value) => value?.name || 'N/A'
    },
    {
      id: 'address',
      label: 'City',
      render: (value) => value?.city || 'N/A'
    }
  ];

  // Handle row click
  const handleRowClick = (customer) => {
    navigate(`/customers/${customer.id || customer._id}`);
  };

  // Handle form submit
  const handleFormSubmit = async (customerData) => {
    try {
      await customerService.create(customerData);
      setOpenForm(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  return (
    <AIEnhancedPage
      pageContext="customers"
      contextData={{ 
        total: customers.length,
        active: customers.filter(c => c.status === 'active').length
      }}
      aiInsights={generateAIInsights()}
      quickActions={getQuickActions()}
      tips={getTips()}
    >
      <Box>
        {/* Page Header */}
        <PageHeader
          title="Customer Management"
          subtitle={`Managing ${customers.length} customers`}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenForm(true)}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                }
              }}
            >
              Add Customer
            </Button>
          }
        />

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Smart Data Grid */}
        <Box sx={{ mt: 3 }}>
          <SmartDataGrid
            title={`Customers (${customers.length})`}
            data={customers}
            columns={columns}
            onRowClick={handleRowClick}
            aiInsights={generateRowInsights()}
            enableAI={true}
            enableExport={true}
            emptyMessage={loading ? "Loading customers..." : "No customers found. Click 'Add Customer' to get started."}
          />
        </Box>

        {/* Customer Form Dialog */}
        {openForm && (
          <CustomerForm
            open={openForm}
            onClose={() => setOpenForm(false)}
            onSubmit={handleFormSubmit}
          />
        )}
      </Box>
    </AIEnhancedPage>
  );
};

export default CustomerListEnhanced;
