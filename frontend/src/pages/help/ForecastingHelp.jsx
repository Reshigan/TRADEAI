import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Button,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Lightbulb as TipIcon,
  ArrowBack as BackIcon,
  TrendingUp as ForecastingIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ForecastingHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Forecasting</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#0288d1', borderRadius: 2, p: 1.5, mr: 2 }}>
          <ForecastingIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Forecasting Help</Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to create, manage, and analyze forecasts
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              TRADEAI's forecasting module helps you predict future performance based on historical data 
              and business intelligence. Create forecasts for budgets, demand, revenue, and volume to 
              support planning decisions. The system supports multiple forecasting methods from simple 
              historical averages to AI-powered predictions.
            </Typography>
            <Typography variant="body1">
              Forecasts can be compared against actuals to track variance and improve future predictions. 
              The system maintains a history of all forecasts for trend analysis and accuracy tracking.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Forecast Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><AssessmentIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Budget Forecast"
                    secondary="Predict trade spend budget requirements based on historical spending patterns and planned activities."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon><TimelineIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Demand Forecast"
                    secondary="Predict product demand to support inventory planning and promotion timing decisions."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon><ForecastingIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Revenue Forecast"
                    secondary="Predict revenue based on historical sales, planned promotions, and market trends."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon><AssessmentIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Volume Forecast"
                    secondary="Predict unit volumes for production planning and supply chain optimization."
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Forecasting Methods</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Method</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Best For</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Historical Average</TableCell>
                    <TableCell>Uses average of past periods</TableCell>
                    <TableCell>Stable, predictable categories</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Growth Rate</TableCell>
                    <TableCell>Applies growth % to base year</TableCell>
                    <TableCell>Growing or declining trends</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Weighted Moving Average</TableCell>
                    <TableCell>Weights recent periods more heavily</TableCell>
                    <TableCell>Seasonal patterns</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>ML Predicted</TableCell>
                    <TableCell>AI/ML model predictions</TableCell>
                    <TableCell>Complex patterns, large datasets</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Manual Entry</TableCell>
                    <TableCell>User-defined values</TableCell>
                    <TableCell>New products, special situations</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Alert severity="info" sx={{ mt: 2 }}>
                ML predictions require sufficient historical data (minimum 12 months recommended).
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Creating a Forecast</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 1: Select Forecast Type"
                    secondary="Choose budget, demand, revenue, or volume forecast"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 2: Define Period"
                    secondary="Set the forecast year and period type (monthly, quarterly, annually)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 3: Select Base Year"
                    secondary="Choose the historical year to use as the basis for calculations"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 4: Choose Method"
                    secondary="Select the forecasting method appropriate for your data"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 5: Set Parameters"
                    secondary="Configure method-specific parameters (e.g., growth rate, weights)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 6: Generate Forecast"
                    secondary="Run the calculation and review results"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 7: Activate"
                    secondary="Activate the forecast to make it the official plan"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Variance Analysis</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Track forecast accuracy by comparing predictions to actuals:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="success.main">On Track</Typography>
                      <Typography variant="body2">Variance within +/- 10%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="warning.main">Under Budget</Typography>
                      <Typography variant="body2">Actual below forecast by 10%+</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="error.main">Over Budget</Typography>
                      <Typography variant="body2">Actual above forecast by 10%+</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="info.main">Pending</Typography>
                      <Typography variant="body2">Actuals not yet available</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Typography variant="body1" sx={{ mt: 2 }}>
                The system calculates variance as: (Actual - Forecast) / Forecast x 100%
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Forecast Comparison</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Compare multiple forecasts to understand trends and improve accuracy:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Year-over-Year Comparison"
                    secondary="Compare forecasts across multiple years to identify trends"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Method Comparison"
                    secondary="Compare results from different forecasting methods"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Scenario Comparison"
                    secondary="Compare optimistic, pessimistic, and baseline scenarios"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Confidence Levels</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Each forecast includes a confidence level indicating prediction reliability:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="High Confidence (80%+)"
                    secondary="Strong historical patterns, stable market conditions, sufficient data"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Medium Confidence (60-80%)"
                    secondary="Some variability in historical data, moderate market changes"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Low Confidence (below 60%)"
                    secondary="Limited historical data, significant market disruptions, new products"
                  />
                </ListItem>
              </List>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Low confidence forecasts should be reviewed and adjusted based on business knowledge.
              </Alert>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#e1f5fe' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TipIcon sx={{ color: '#0288d1', mr: 1 }} />
              <Typography variant="h6">Pro Tips</Typography>
            </Box>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Use multiple methods"
                  secondary="Compare different methods to find the best fit for your data"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Update regularly"
                  secondary="Refresh forecasts monthly with latest actuals"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Document assumptions"
                  secondary="Record the assumptions behind your forecast parameters"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Track accuracy"
                  secondary="Monitor forecast accuracy to improve future predictions"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/forecasting')}>
                <ListItemText primary="View All Forecasts" />
              </ListItem>
              <ListItem button onClick={() => navigate('/forecasting/new')}>
                <ListItemText primary="Create New Forecast" />
              </ListItem>
              <ListItem button onClick={() => navigate('/forecasting/dashboard')}>
                <ListItemText primary="Forecasting Dashboard" />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>AI-Powered Forecasting</Typography>
            <Typography variant="body2" paragraph>
              TRADEAI uses machine learning models trained on your historical data to generate 
              more accurate predictions. The ML models consider:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Seasonality patterns" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Promotion impact" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Market trends" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Customer behavior" />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="info">
            <Typography variant="subtitle2">Best Practice</Typography>
            <Typography variant="body2">
              Create forecasts at least 3 months before the forecast period for adequate planning time.
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/help')}>
          Back to Help Center
        </Button>
      </Box>
    </Container>
  );
};

export default ForecastingHelp;
