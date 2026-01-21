import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Paper,
  Tab,
  Tabs,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Campaign as PromotionsIcon,
  AccountBalance as BudgetsIcon,
  Receipt as TradeSpendIcon,
  People as CustomersIcon,
  Inventory as ProductsIcon,
  Analytics as AnalyticsIcon,
  Science as SimulationIcon,
  Approval as ApprovalsIcon,
  PlayCircle as VideoIcon,
  MenuBook as GuideIcon,
  School as TrainingIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const helpSections = [
  {
    id: 'promotions',
    title: 'Promotions',
    icon: PromotionsIcon,
    color: '#1976d2',
    description: 'Create, manage, and track trade promotions',
    path: '/help/promotions',
    topics: ['Creating promotions', 'Promotion types', 'Approval workflow', 'Performance tracking'],
  },
  {
    id: 'budgets',
    title: 'Budgets',
    icon: BudgetsIcon,
    color: '#2e7d32',
    description: 'Plan and manage trade spend budgets',
    path: '/help/budgets',
    topics: ['Budget planning', 'Allocation', 'Utilization tracking', 'Forecasting'],
  },
  {
    id: 'trade-spends',
    title: 'Trade Spends',
    icon: TradeSpendIcon,
    color: '#ed6c02',
    description: 'Track and reconcile trade spend activities',
    path: '/help/trade-spends',
    topics: ['Creating trade spends', 'Approval process', 'Accruals', 'Reconciliation'],
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: CustomersIcon,
    color: '#9c27b0',
    description: 'Manage customer relationships and hierarchies',
    path: '/help/customers',
    topics: ['Customer setup', 'Hierarchies', 'Tiers', 'Customer 360'],
  },
  {
    id: 'products',
    title: 'Products',
    icon: ProductsIcon,
    color: '#0288d1',
    description: 'Manage product catalog and hierarchies',
    path: '/help/products',
    topics: ['Product setup', 'Categories', 'Pricing', 'Hierarchies'],
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    icon: AnalyticsIcon,
    color: '#d32f2f',
    description: 'Analyze performance and gain insights',
    path: '/help/analytics',
    topics: ['Dashboards', 'Reports', 'KPIs', 'Trends'],
  },
  {
    id: 'simulations',
    title: 'Simulations',
    icon: SimulationIcon,
    color: '#7b1fa2',
    description: 'Run what-if scenarios and optimize promotions',
    path: '/help/simulations',
    topics: ['Scenario planning', 'ROI optimization', 'Constraints', 'Recommendations'],
  },
  {
    id: 'approvals',
    title: 'Approvals',
    icon: ApprovalsIcon,
    color: '#388e3c',
    description: 'Manage approval workflows',
    path: '/help/approvals',
    topics: ['Approval queues', 'Delegation', 'Escalation', 'Audit trail'],
  },
];

const quickStartGuides = [
  {
    title: 'Getting Started with TRADEAI',
    duration: '5 min',
    description: 'Learn the basics of navigating and using the platform',
    type: 'guide',
  },
  {
    title: 'Creating Your First Promotion',
    duration: '10 min',
    description: 'Step-by-step guide to creating and submitting a promotion',
    type: 'guide',
  },
  {
    title: 'Understanding Budget Allocation',
    duration: '8 min',
    description: 'Learn how budgets flow through the system',
    type: 'guide',
  },
  {
    title: 'Running a Simulation',
    duration: '7 min',
    description: 'Use simulations to optimize your promotions',
    type: 'video',
  },
];

const faqs = [
  {
    question: 'How do I create a new promotion?',
    answer: 'Navigate to Promotions > Create New. Fill in the promotion details including name, type, dates, products, and customers. Submit for approval when ready.',
  },
  {
    question: 'What is the difference between trade spend types?',
    answer: 'Cash Co-op is direct payment to retailers, Off-Invoice is a discount on invoices, Scan Rebate is based on POS data, and Volume Rebate is based on purchase volumes.',
  },
  {
    question: 'How do I track budget utilization?',
    answer: 'Go to Budgets and select a budget to view its utilization. The dashboard shows allocated, spent, and remaining amounts with visual indicators.',
  },
  {
    question: 'Can I clone an existing promotion?',
    answer: 'Yes! Open the promotion you want to clone and click the Clone button. You can optionally shift dates and modify details before saving.',
  },
  {
    question: 'How do I export data to CSV?',
    answer: 'Most list views have an Export button in the toolbar. Click it to download the current filtered data as a CSV file.',
  },
  {
    question: 'What do the different approval statuses mean?',
    answer: 'Draft: Not yet submitted. Pending: Awaiting approval. Approved: Ready to execute. Rejected: Needs revision. Active: Currently running. Completed: Finished.',
  },
];

const HelpCenter = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const filteredSections = helpSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.topics.some((topic) => topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
          Help & Training Center
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Learn how to get the most out of TRADEAI
        </Typography>
        <TextField
          fullWidth
          placeholder="Search for help topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 600 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        centered
        sx={{ mb: 4 }}
      >
        <Tab icon={<GuideIcon />} label="Topics" />
        <Tab icon={<TrainingIcon />} label="Quick Start" />
        <Tab icon={<HelpIcon />} label="FAQs" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {filteredSections.map((section) => (
            <Grid item xs={12} sm={6} md={4} key={section.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(section.path)}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  <CardContent sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          bgcolor: section.color,
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                          display: 'flex',
                        }}
                      >
                        <section.icon sx={{ color: 'white' }} />
                      </Box>
                      <Typography variant="h6">{section.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {section.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {section.topics.slice(0, 3).map((topic) => (
                        <Chip key={topic} label={topic} size="small" variant="outlined" />
                      ))}
                      {section.topics.length > 3 && (
                        <Chip label={`+${section.topics.length - 3} more`} size="small" />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {quickStartGuides.map((guide, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      bgcolor: guide.type === 'video' ? '#d32f2f' : '#1976d2',
                      borderRadius: 2,
                      p: 1,
                      mr: 2,
                    }}
                  >
                    {guide.type === 'video' ? (
                      <VideoIcon sx={{ color: 'white' }} />
                    ) : (
                      <GuideIcon sx={{ color: 'white' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{guide.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {guide.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip
                        label={guide.duration}
                        size="small"
                        color={guide.type === 'video' ? 'error' : 'primary'}
                        variant="outlined"
                      />
                      <Button size="small" color="primary">
                        {guide.type === 'video' ? 'Watch' : 'Read'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Box>
          {faqs.map((faq, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 4 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Need more help?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Contact support or browse our documentation
        </Typography>
        <Button variant="outlined" sx={{ mr: 2 }}>
          Contact Support
        </Button>
        <Button variant="contained">
          View Documentation
        </Button>
      </Box>
    </Container>
  );
};

export default HelpCenter;
