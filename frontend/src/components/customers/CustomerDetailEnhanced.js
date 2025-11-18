import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Grid, Typography,
  Tabs, Tab, Chip, LinearProgress, Alert
} from '@mui/material';
import {
  Edit as EditIcon, ArrowBack as ArrowBackIcon,
  TrendingUp, TrendingDown, Business as BusinessIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { AIEnhancedPage, PageHeader, AIChatbotFAB } from '../common';
import { customerService, budgetService, promotionService, tradeSpendService } from '../../services/api';
import { ollamaService } from '../../services/ollama/ollamaService';

const CustomerDetailEnhanced = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [relatedData, setRelatedData] = useState({ budgets: [], promotions: [], tradeSpends: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [aiInsights, setAiInsights] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customerRes, budgetsRes, promotionsRes, tradeSpendsRes] = await Promise.all([
        customerService.getById(id),
        budgetService.getAll().catch(() => ({ data: [] })),
        promotionService.getAll().catch(() => ({ data: [] })),
        tradeSpendService.getAll().catch(() => ({ data: [] }))
      ]);

      const customerData = customerRes.data || customerRes;
      setCustomer(customerData);

      // Filter related data
      setRelatedData({
        budgets: (budgetsRes.data || []).filter(b => b.customerId === id),
        promotions: (promotionsRes.data || []).filter(p => p.customerId === id),
        tradeSpends: (tradeSpendsRes.data || []).filter(ts => ts.customerId === id)
      });

      // Generate AI insights
      generateInsights(customerData, relatedData);
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async (customerData, related) => {
    const insights = [];

    // Revenue insights
    if (customerData.totalRevenue > 500000) {
      insights.push({
        title: 'VIP Customer - High Value Account',
        description: `Total revenue: $${(customerData.totalRevenue || 0).toLocaleString()}. Maintain premium service level.`,
        confidence: 0.96,
        icon: '⭐'
      });
    }

    // Growth insights
    if (customerData.salesGrowth > 20) {
      insights.push({
        title: `Strong Growth: ${customerData.salesGrowth}%`,
        description: 'Customer showing rapid growth. Consider expanding product offerings and exclusive deals.',
        confidence: 0.91,
        icon: '📈'
      });
    } else if (customerData.salesGrowth < -10) {
      insights.push({
        title: `Declining Sales: ${customerData.salesGrowth}%`,
        description: 'Revenue declining. Schedule review meeting and assess needs. Consider retention campaign.',
        confidence: 0.88,
        icon: '⚠️'
      });
    }

    // AI-powered deep insights
    try {
      const aiResult = await ollamaService.getInsights('customer', customerData);
      if (aiResult.success && aiResult.response) {
        insights.push({
          title: 'AI Deep Analysis',
          description: aiResult.response,
          confidence: 0.85,
          icon: '🤖'
        });
      }
    } catch (error) {
      console.log('AI insights unavailable');
    }

    setAiInsights(insights);
  };

  const getQuickActions = () => [
    {
      icon: '✉️',
      label: 'Send Campaign',
      description: 'Launch targeted marketing campaign',
      action: () => navigate(`/campaigns/new?customerId=${id}`)
    },
    {
      icon: '🎯',
      label: 'Create Promotion',
      description: 'Build custom promotion for this customer',
      action: () => navigate(`/promotions/new?customerId=${id}`)
    },
    {
      icon: '💰',
      label: 'Allocate Budget',
      description: 'Set up trade spend budget',
      action: () => navigate(`/budgets/new?customerId=${id}`)
    },
    {
      icon: '📊',
      label: 'View Analytics',
      description: 'Detailed customer performance reports',
      action: () => navigate(`/reports/customer/${id}`)
    }
  ];

  if (loading) {
    return <Box sx={{ p: 3 }}><LinearProgress /></Box>;
  }

  if (!customer) {
    return <Alert severity="error">Customer not found</Alert>;
  }

  return (
    <AIEnhancedPage
      pageContext="customer-detail"
      contextData={customer}
      aiInsights={aiInsights}
      quickActions={getQuickActions()}
      tips={[
        'Use AI Assistant to analyze customer trends',
        'Track engagement metrics for personalization',
        'Schedule regular business reviews for VIP accounts'
      ]}
    >
      <Box>
        <PageHeader
          title={customer.name}
          subtitle={`Customer ID: ${customer.id || customer._id}`}
          icon={<BusinessIcon />}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/customers')}
              >
                Back
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/customers/${id}/edit`)}
              >
                Edit
              </Button>
            </Box>
          }
        />

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Key Metrics */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                  ${(customer.totalRevenue || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Revenue
                </Typography>
                {customer.salesGrowth && (
                  <Chip
                    icon={customer.salesGrowth > 0 ? <TrendingUp /> : <TrendingDown />}
                    label={`${customer.salesGrowth > 0 ? '+' : ''}${customer.salesGrowth}%`}
                    color={customer.salesGrowth > 0 ? 'success' : 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>
                  {customer.orderCount || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Orders
                </Typography>
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                  Avg: ${((customer.totalRevenue || 0) / (customer.orderCount || 1)).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {customer.activePromotions || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Promotions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {customer.tier === 'VIP' && <StarIcon color="warning" />}
                  <Chip
                    label={customer.status || 'Active'}
                    color={customer.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Account Status
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Details Section */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                  <Tab label="Overview" />
                  <Tab label={`Budgets (${relatedData.budgets.length})`} />
                  <Tab label={`Promotions (${relatedData.promotions.length})`} />
                  <Tab label={`Trade Spends (${relatedData.tradeSpends.length})`} />
                </Tabs>

                <Box sx={{ mt: 3 }}>
                  {activeTab === 0 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Contact</Typography>
                        <Typography variant="body1">{customer.email || 'N/A'}</Typography>
                        <Typography variant="body1">{customer.phone || 'N/A'}</Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {customer.address && typeof customer.address === 'object' 
                            ? `${customer.address.street || ''}, ${customer.address.city || ''}, ${customer.address.state || ''} ${customer.address.postalCode || ''}, ${customer.address.country || ''}`.replace(/,\s*,/g, ',').trim()
                            : customer.address || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Business Info</Typography>
                        <Typography variant="body1">Industry: {customer.industry || 'N/A'}</Typography>
                        <Typography variant="body1">Segment: {customer.segment || 'N/A'}</Typography>
                        <Typography variant="body1">Tier: {customer.tier || 'Standard'}</Typography>
                      </Grid>
                    </Grid>
                  )}

                  {activeTab === 1 && (
                    <Box>
                      {relatedData.budgets.length === 0 ? (
                        <Alert severity="info">No budgets found</Alert>
                      ) : (
                        relatedData.budgets.map(budget => (
                          <Card key={budget.id} sx={{ mb: 2 }}>
                            <CardContent>
                              <Typography variant="h6">{budget.name}</Typography>
                              <Typography variant="body2">
                                Amount: ${budget.amount?.toLocaleString()} | 
                                Spent: ${budget.spent?.toLocaleString()} | 
                                Remaining: ${(budget.amount - budget.spent)?.toLocaleString()}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </Box>
                  )}

                  {activeTab === 2 && (
                    <Box>
                      {relatedData.promotions.length === 0 ? (
                        <Alert severity="info">No promotions found</Alert>
                      ) : (
                        relatedData.promotions.map(promo => (
                          <Card key={promo.id} sx={{ mb: 2 }}>
                            <CardContent>
                              <Typography variant="h6">{promo.name}</Typography>
                              <Chip label={promo.status} size="small" />
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </Box>
                  )}

                  {activeTab === 3 && (
                    <Box>
                      {relatedData.tradeSpends.length === 0 ? (
                        <Alert severity="info">No trade spends found</Alert>
                      ) : (
                        relatedData.tradeSpends.map(ts => (
                          <Card key={ts.id} sx={{ mb: 2 }}>
                            <CardContent>
                              <Typography variant="h6">{ts.description}</Typography>
                              <Typography variant="body2">
                                Amount: ${ts.amount?.toLocaleString()} | ROI: {ts.roi}%
                              </Typography>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* AI Chatbot */}
      <AIChatbotFAB pageContext="customer-detail" contextData={customer} />
    </AIEnhancedPage>
  );
};

export default CustomerDetailEnhanced;
