import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tab,
  Tabs,
  IconButton
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BudgetIcon,
  ShoppingCart as TradeSpendIcon,
  People as CustomersIcon,
  Inventory as ProductsIcon,
  Campaign as PromotionsIcon,
  Gavel as TradingTermsIcon,
  Analytics as AnalyticsIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ReportList = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);

  const moduleReports = [
    {
      id: 'budget',
      name: 'Marketing Budget Reports',
      icon: <BudgetIcon />,
      color: '#1976d2',
      description: 'Budget allocation, utilization, and performance analysis',
      reports: [
        { name: 'Budget Performance Dashboard', type: 'dashboard', status: 'active' },
        { name: 'Budget Allocation Analysis', type: 'report', status: 'active' },
        { name: 'Spend Tracking Report', type: 'report', status: 'active' }
      ],
      route: '/reports/budget'
    },
    {
      id: 'tradespend',
      name: 'Trade Spend Reports',
      icon: <TradeSpendIcon />,
      color: '#388e3c',
      description: 'Trade spend analysis, ROI tracking, and customer performance',
      reports: [
        { name: 'Trade Spend Dashboard', type: 'dashboard', status: 'active' },
        { name: 'ROI Analysis Report', type: 'report', status: 'active' },
        { name: 'Customer Spend Performance', type: 'report', status: 'active' }
      ],
      route: '/reports/tradespend'
    },
    {
      id: 'customers',
      name: 'Customer Reports',
      icon: <CustomersIcon />,
      color: '#f57c00',
      description: 'Customer analytics, performance metrics, and relationship insights',
      reports: [
        { name: 'Customer Analytics Dashboard', type: 'dashboard', status: 'active' },
        { name: 'Customer Performance Report', type: 'report', status: 'active' },
        { name: 'Relationship Analysis Report', type: 'report', status: 'active' }
      ],
      route: '/reports/customers'
    },
    {
      id: 'products',
      name: 'Product Reports',
      icon: <ProductsIcon />,
      color: '#7b1fa2',
      description: 'Product performance, sales analytics, and inventory insights',
      reports: [
        { name: 'Product Performance Dashboard', type: 'dashboard', status: 'active' },
        { name: 'Sales Analytics Report', type: 'report', status: 'active' },
        { name: 'Inventory Analysis Report', type: 'report', status: 'active' }
      ],
      route: '/reports/products'
    },
    {
      id: 'promotions',
      name: 'Promotion Reports',
      icon: <PromotionsIcon />,
      color: '#d32f2f',
      description: 'Campaign performance, effectiveness analysis, and ROI tracking',
      reports: [
        { name: 'Promotion Dashboard', type: 'dashboard', status: 'active' },
        { name: 'Campaign Performance Report', type: 'report', status: 'active' },
        { name: 'Promotion ROI Analysis', type: 'report', status: 'active' }
      ],
      route: '/reports/promotions'
    },
    {
      id: 'tradingterms',
      name: 'Trading Terms Reports',
      icon: <TradingTermsIcon />,
      color: '#455a64',
      description: 'Terms analysis, compliance tracking, and performance metrics',
      reports: [
        { name: 'Trading Terms Dashboard', type: 'dashboard', status: 'active' },
        { name: 'Compliance Report', type: 'report', status: 'active' },
        { name: 'Terms Performance Analysis', type: 'report', status: 'active' }
      ],
      route: '/reports/tradingterms'
    }
  ];

  const recentReports = [
    { name: 'Monthly Budget Performance', module: 'Budget', date: '2025-10-14', type: 'dashboard' },
    { name: 'Q3 Trade Spend Analysis', module: 'Trade Spend', date: '2025-10-13', type: 'report' },
    { name: 'Customer Performance Review', module: 'Customers', date: '2025-10-12', type: 'report' },
    { name: 'Product Sales Analytics', module: 'Products', date: '2025-10-11', type: 'dashboard' }
  ];

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleModuleClick = (route) => {
    navigate(route);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          Reports & Analytics Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive reporting and analytics for all modules with dashboards and detailed reports
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Module Reports" />
          <Tab label="Recent Reports" />
          <Tab label="Scheduled Reports" />
        </Tabs>
      </Paper>

      {/* Module Reports Tab */}
      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={3}>
          {moduleReports.map((module) => (
            <Grid item xs={12} md={6} lg={4} key={module.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleModuleClick(module.route)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: module.color, mr: 2 }}>
                      {module.icon}
                    </Avatar>
                    <Typography variant="h6" component="h2">
                      {module.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {module.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Available Reports:
                    </Typography>
                    {module.reports.map((report, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Chip
                          size="small"
                          label={report.type}
                          color={report.type === 'dashboard' ? 'primary' : 'secondary'}
                          sx={{ mr: 1, minWidth: 80 }}
                        />
                        <Typography variant="body2">
                          {report.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
                
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<ViewIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModuleClick(module.route);
                    }}
                  >
                    View Reports
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<AnalyticsIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModuleClick(module.route + '/dashboard');
                    }}
                  >
                    Dashboard
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Recent Reports Tab */}
      <TabPanel value={selectedTab} index={1}>
        <Paper>
          <List>
            {recentReports.map((report, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    {report.type === 'dashboard' ? <AnalyticsIcon /> : <AssessmentIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={report.name}
                    secondary={`${report.module} • ${report.date}`}
                  />
                  <Box>
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small">
                      <DownloadIcon />
                    </IconButton>
                  </Box>
                </ListItem>
                {index < recentReports.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </TabPanel>

      {/* Scheduled Reports Tab */}
      <TabPanel value={selectedTab} index={2}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Scheduled Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set up automated report generation and delivery schedules
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<DateRangeIcon />}
            onClick={() => navigate('/reports/schedule')}
          >
            Create Schedule
          </Button>
        </Paper>
      </TabPanel>

      {/* Quick Stats */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Statistics
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {moduleReports.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Report Modules
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {moduleReports.reduce((acc, module) => acc + module.reports.length, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Reports
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {recentReports.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recent Reports
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                6
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Dashboards
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ReportList;