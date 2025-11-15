import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Star,
  AttachMoney,
  ShoppingCart,
  Timeline as TimelineIcon,
  Lightbulb,
  PlayArrow,
  Add,
  Refresh
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import DecisionCard from '../../components/decision/DecisionCard';
import simulationService from '../../services/simulation/simulationService';

const Customer360 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    loadCustomerData();
    loadRecommendations();
  }, [id]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const mockCustomer = {
        id: id,
        name: 'National Retail Chain',
        type: 'National Chain',
        status: 'active',
        tier: 'platinum',
        aiInsights: {
          ltv: 2500000,
          churnRisk: 0.15,
          churnReason: 'Declining purchase frequency',
          segment: 'High-Value Strategic',
          nextBestAction: 'Offer volume discount to increase order size',
          priceSensitivity: 0.65,
          preferredChannels: ['In-store', 'Online'],
          seasonalPatterns: {
            peak: 'Q4',
            low: 'Q2'
          }
        },
        hierarchy: {
          level: 1,
          children: [
            {
              id: 'reg-1',
              name: 'Northeast Region',
              level: 2,
              revenue: 1200000,
              growth: 0.15,
              children: [
                { id: 'store-1', name: 'Store #101 - Boston', level: 3, revenue: 500000, growth: 0.20 },
                { id: 'store-2', name: 'Store #102 - New York', level: 3, revenue: 700000, growth: 0.12 }
              ]
            },
            {
              id: 'reg-2',
              name: 'Southeast Region',
              level: 2,
              revenue: 800000,
              growth: -0.05,
              children: [
                { id: 'store-3', name: 'Store #201 - Atlanta', level: 3, revenue: 450000, growth: -0.08 },
                { id: 'store-4', name: 'Store #202 - Miami', level: 3, revenue: 350000, growth: -0.02 }
              ]
            }
          ]
        },
        performance: {
          totalRevenue: 2000000,
          revenueGrowth: 0.08,
          avgOrderValue: 15000,
          orderFrequency: 24,
          lastOrderDate: '2025-11-10',
          topProducts: [
            { name: 'Premium Brand A', revenue: 800000, share: 0.40 },
            { name: 'Value Brand B', revenue: 600000, share: 0.30 },
            { name: 'Premium Snacks', revenue: 600000, share: 0.30 }
          ]
        }
      };

      setCustomer(mockCustomer);
      setHierarchyData(mockCustomer.hierarchy);
      setPerformanceData(mockCustomer.performance);
    } catch (error) {
      console.error('Failed to load customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await simulationService.getNextBestPromotion({
        customerId: id,
        limit: 3
      });

      setRecommendations(response.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleSimulateRecommendation = (recommendation) => {
    navigate('/simulations', {
      state: {
        prefill: {
          customerId: id,
          recommendation
        }
      }
    });
  };

  const handleCreatePromotion = (recommendation) => {
    navigate('/promotions/new-flow', {
      state: {
        prefill: {
          customerId: id,
          ...recommendation.config
        }
      }
    });
  };

  const renderHierarchyNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const growthColor = node.growth >= 0 ? 'success.main' : 'error.main';

    return (
      <Box key={node.id}>
        <Paper 
          sx={{ 
            p: 2, 
            mb: 1, 
            ml: depth * 3,
            borderLeft: 3,
            borderColor: node.growth >= 0 ? 'success.main' : 'error.main'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {node.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Level {node.level}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ${(node.revenue || 0).toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                {node.growth >= 0 ? <TrendingUp fontSize="small" color="success" /> : <TrendingDown fontSize="small" color="error" />}
                <Typography variant="caption" sx={{ color: growthColor, ml: 0.5 }}>
                  {(node.growth * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
        {hasChildren && node.children.map(child => renderHierarchyNode(child, depth + 1))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Customer not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <div>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              {customer.name}
            </Typography>
            <Chip 
              label={customer.tier} 
              color={customer.tier === 'platinum' ? 'primary' : 'default'}
              icon={<Star />}
            />
            <Chip 
              label={customer.status} 
              color={customer.status === 'active' ? 'success' : 'default'}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {customer.type} • Customer 360 View
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadCustomerData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/promotions/new-flow', { state: { customerId: id } })}
          >
            Create Promotion
          </Button>
        </Box>
      </Box>

      {/* AI Insights Banner */}
      {customer.aiInsights && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Lifetime Value
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  ${(customer.aiInsights.ltv / 1000).toFixed(0)}K
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Warning color={customer.aiInsights.churnRisk > 0.3 ? 'error' : 'warning'} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Churn Risk
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: customer.aiInsights.churnRisk > 0.3 ? 'error.main' : 'warning.main' }}>
                  {(customer.aiInsights.churnRisk * 100).toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {customer.aiInsights.churnReason}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Star color="info" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Segment
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {customer.aiInsights.segment}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Price Sensitivity: {(customer.aiInsights.priceSensitivity * 100).toFixed(0)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Lightbulb color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Next Best Action
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {customer.aiInsights.nextBestAction}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Lightbulb sx={{ mr: 1 }} color="primary" />
            AI-Recommended Promotions
          </Typography>
          <Grid container spacing={2}>
            {recommendations.map((rec, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <DecisionCard
                  title={rec.name || `Recommendation ${idx + 1}`}
                  impact={{
                    label: 'Expected Net Revenue',
                    value: rec.expectedNetRevenue || 0,
                    delta: rec.expectedUplift || 0,
                    unit: '$'
                  }}
                  confidence={rec.confidence || 0.75}
                  hierarchyChips={rec.hierarchyBreakdown?.slice(0, 3) || []}
                  onSimulate={() => handleSimulateRecommendation(rec)}
                  onApply={() => handleCreatePromotion(rec)}
                  explanation={rec.rationale || 'AI-generated recommendation based on customer behavior and market trends'}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Hierarchy & Performance" />
          <Tab label="Historical Promotions" />
          <Tab label="Product Mix" />
          <Tab label="Insights & Analytics" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Customer Hierarchy
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {hierarchyData && renderHierarchyNode(hierarchyData)}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Total Revenue"
                      secondary={`$${performanceData.totalRevenue.toLocaleString()}`}
                    />
                    <Chip
                      label={`${(performanceData.revenueGrowth * 100).toFixed(1)}%`}
                      color={performanceData.revenueGrowth >= 0 ? 'success' : 'error'}
                      size="small"
                      icon={performanceData.revenueGrowth >= 0 ? <TrendingUp /> : <TrendingDown />}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Avg Order Value"
                      secondary={`$${performanceData.avgOrderValue.toLocaleString()}`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Order Frequency"
                      secondary={`${performanceData.orderFrequency} orders/year`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Last Order"
                      secondary={new Date(performanceData.lastOrderDate).toLocaleDateString()}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Products
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {performanceData.topProducts.map((product, idx) => (
                  <Box key={idx} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{product.name}</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ${product.revenue.toLocaleString()} ({(product.share * 100).toFixed(0)}%)
                      </Typography>
                    </Box>
                    <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                      <Box
                        sx={{
                          height: '100%',
                          bgcolor: 'primary.main',
                          width: `${product.share * 100}%`
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Alert severity="info">
          Historical promotions data will be displayed here
        </Alert>
      )}

      {activeTab === 2 && (
        <Alert severity="info">
          Product mix analysis will be displayed here
        </Alert>
      )}

      {activeTab === 3 && (
        <Alert severity="info">
          Advanced insights and analytics will be displayed here
        </Alert>
      )}
    </Box>
  );
};

export default Customer360;
