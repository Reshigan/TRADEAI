import React, { useState } from 'react';
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
  Alert,
  Button,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  ArrowBack as BackIcon,
  Business as BusinessIcon,
  AccountTree as WorkflowIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Speed as PerformanceIcon,
  IntegrationInstructions as IntegrationIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BusinessProcessGuide = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Business Process Guide</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#1565c0', borderRadius: 2, p: 1.5, mr: 2 }}>
          <BusinessIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Business Process Guide</Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive guide to TRADEAI business processes and workflows
          </Typography>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<WorkflowIcon />} label="Core Workflows" />
        <Tab icon={<TimelineIcon />} label="End-to-End Processes" />
        <Tab icon={<IntegrationIcon />} label="System Integration" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>Trade Promotion Management Overview</Typography>
              <Typography variant="body1" paragraph>
                TRADEAI is a comprehensive Trade Promotion Management (TPM) system designed for FMCG companies 
                to plan, execute, and analyze trade spend activities. The system supports the complete lifecycle 
                of trade promotions from budget planning through settlement and reconciliation.
              </Typography>
              <Typography variant="body1">
                The platform integrates with enterprise systems like SAP ERP and Salesforce CRM to provide 
                a unified view of trade activities, customer relationships, and financial performance.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Annual Planning Cycle</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stepper orientation="vertical">
                  <Step active>
                    <StepLabel>Budget Planning (Q4 Prior Year)</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Finance and Trade Marketing collaborate to set annual trade spend budgets. 
                        Budgets are allocated by customer tier, product category, and channel.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>Customer Negotiations (Q4-Q1)</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Key Account Managers negotiate trading terms and rebate agreements with 
                        major retail customers. Agreements are documented and approved.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>Promotion Calendar (Ongoing)</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Marketing and Sales teams plan promotional activities throughout the year, 
                        aligned with budget allocations and customer agreements.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>Execution and Tracking (Ongoing)</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Field teams execute promotions while the system tracks performance, 
                        spend, and ROI in real-time.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>Settlement and Reconciliation (Monthly/Quarterly)</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Finance processes claims, matches deductions, and settles rebate accruals 
                        with customers.
                      </Typography>
                    </StepContent>
                  </Step>
                </Stepper>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Approval Workflow</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" paragraph>
                  All financial commitments require approval based on amount thresholds:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="Auto-Approval (Below R10,000)"
                      secondary="Small activities auto-approved if within budget"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Manager Approval (R10,000 - R100,000)"
                      secondary="Requires direct manager approval"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="warning" /></ListItemIcon>
                    <ListItemText 
                      primary="Director Approval (R100,000 - R500,000)"
                      secondary="Requires director-level approval"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="error" /></ListItemIcon>
                    <ListItemText 
                      primary="Executive Approval (Above R500,000)"
                      secondary="Requires executive committee approval"
                    />
                  </ListItem>
                </List>
                <Alert severity="info" sx={{ mt: 2 }}>
                  SLA tracking ensures approvals are processed within defined timeframes. 
                  Overdue approvals are automatically escalated.
                </Alert>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">User Roles and Responsibilities</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Key Account Manager (KAM)
                        </Typography>
                        <List dense>
                          <ListItem><ListItemText primary="Manage customer relationships" /></ListItem>
                          <ListItem><ListItemText primary="Create and submit promotions" /></ListItem>
                          <ListItem><ListItemText primary="Negotiate trading terms" /></ListItem>
                          <ListItem><ListItemText primary="Track customer performance" /></ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Trade Marketing Manager
                        </Typography>
                        <List dense>
                          <ListItem><ListItemText primary="Plan promotional calendar" /></ListItem>
                          <ListItem><ListItemText primary="Approve promotions" /></ListItem>
                          <ListItem><ListItemText primary="Analyze ROI and performance" /></ListItem>
                          <ListItem><ListItemText primary="Manage budget allocation" /></ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Finance Analyst
                        </Typography>
                        <List dense>
                          <ListItem><ListItemText primary="Process claims and deductions" /></ListItem>
                          <ListItem><ListItemText primary="Manage rebate accruals" /></ListItem>
                          <ListItem><ListItemText primary="Reconcile settlements" /></ListItem>
                          <ListItem><ListItemText primary="Generate financial reports" /></ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Promotion Lifecycle</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" paragraph>
                  A promotion moves through the following stages from creation to completion:
                </Typography>
                <Stepper orientation="vertical">
                  <Step active>
                    <StepLabel>1. Planning and Simulation</StepLabel>
                    <StepContent>
                      <Typography variant="body2" paragraph>
                        Before creating a promotion, use the Simulation Studio to model different scenarios. 
                        Compare ROI projections, uplift estimates, and budget requirements across multiple 
                        configurations to identify the optimal approach.
                      </Typography>
                      <Alert severity="success" sx={{ mb: 1 }}>
                        Best Practice: Always run a simulation before committing budget to a promotion.
                      </Alert>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>2. Promotion Creation</StepLabel>
                    <StepContent>
                      <Typography variant="body2" paragraph>
                        Create the promotion with all required details: name, type, dates, products, 
                        customers, mechanics, and budget allocation. The system validates that sufficient 
                        budget is available before allowing submission.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>3. Approval Process</StepLabel>
                    <StepContent>
                      <Typography variant="body2" paragraph>
                        Submit the promotion for approval. Approvers receive notifications and can 
                        approve, reject, or request changes. The system tracks SLA compliance and 
                        escalates overdue approvals.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>4. Execution</StepLabel>
                    <StepContent>
                      <Typography variant="body2" paragraph>
                        Once approved, the promotion becomes active during its scheduled dates. 
                        Field teams execute the promotion while the system tracks performance 
                        metrics in real-time.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>5. Performance Tracking</StepLabel>
                    <StepContent>
                      <Typography variant="body2" paragraph>
                        Monitor key metrics: actual vs planned spend, sales uplift, ROI, and 
                        redemption rates. The system compares actual performance to simulation 
                        predictions for continuous improvement.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>6. Settlement</StepLabel>
                    <StepContent>
                      <Typography variant="body2" paragraph>
                        After the promotion ends, process any customer claims, reconcile deductions, 
                        and finalize the actual spend. Close the promotion and archive for reporting.
                      </Typography>
                    </StepContent>
                  </Step>
                </Stepper>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Rebate Management Process</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" paragraph>
                  Rebate agreements follow a structured process from negotiation to settlement:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Agreement Setup
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Negotiate terms with customer" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Define calculation method and rates" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Set thresholds and caps" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Configure settlement frequency" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Submit for approval" />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Accrual and Settlement
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="System calculates accruals automatically" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Review accruals monthly" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Generate settlement at period end" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Approve settlement amount" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Process payment or credit note" />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Claims and Deductions Reconciliation</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" paragraph>
                  The claims and deductions process ensures accurate reconciliation of customer payments:
                </Typography>
                <Stepper orientation="vertical">
                  <Step active>
                    <StepLabel>Receive Customer Claim or Deduction</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Claims are submitted by customers requesting payment. Deductions are amounts 
                        withheld from invoice payments. Both are recorded in the system with supporting 
                        documentation.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>Auto-Match Process</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        The system automatically attempts to match claims to deductions and both to 
                        their source (promotion, rebate, etc.) based on customer, amount, and date.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>Manual Investigation</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Unmatched items require manual investigation. Analysts review documentation, 
                        verify amounts, and determine validity.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>Approval or Dispute</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Valid claims/deductions are approved for settlement. Invalid items are disputed 
                        with the customer, with all communications tracked in the system.
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step active>
                    <StepLabel>Settlement</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Approved items are settled via credit note, direct payment, or offset against 
                        outstanding invoices. The system updates all related records.
                      </Typography>
                    </StepContent>
                  </Step>
                </Stepper>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>System Integration Architecture</Typography>
              <Typography variant="body1" paragraph>
                TRADEAI integrates with enterprise systems to provide a unified view of trade activities 
                and ensure data consistency across the organization.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">SAP ERP Integration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" paragraph>
                  Bidirectional integration with SAP for master data and financial transactions:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><IntegrationIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Customer Master Data"
                      secondary="Sync customer records (KUNNR) including credit limits and payment terms"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><IntegrationIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Product Master Data"
                      secondary="Sync material records (MATNR) including pricing and hierarchy"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><IntegrationIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Sales Documents"
                      secondary="Import sales orders and invoices for performance tracking"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><IntegrationIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Financial Postings"
                      secondary="Post trade spend accruals and settlements to FI/CO"
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">AI/ML Capabilities</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" paragraph>
                  TRADEAI leverages AI and machine learning for intelligent insights:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><PerformanceIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Demand Forecasting"
                      secondary="Predict product demand using historical data and market trends"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PerformanceIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="ROI Prediction"
                      secondary="Estimate promotion ROI before execution using ML models"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PerformanceIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Customer Segmentation"
                      secondary="Automatically segment customers based on behavior patterns"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PerformanceIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Anomaly Detection"
                      secondary="Identify unusual patterns in claims and deductions"
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Data Security and Compliance</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <SecurityIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="subtitle1">Authentication</Typography>
                        </Box>
                        <List dense>
                          <ListItem><ListItemText primary="JWT-based authentication" /></ListItem>
                          <ListItem><ListItemText primary="Multi-factor authentication" /></ListItem>
                          <ListItem><ListItemText primary="Session management" /></ListItem>
                          <ListItem><ListItemText primary="Account lockout protection" /></ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <SecurityIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="subtitle1">Data Isolation</Typography>
                        </Box>
                        <List dense>
                          <ListItem><ListItemText primary="Multi-tenant architecture" /></ListItem>
                          <ListItem><ListItemText primary="Company-level data isolation" /></ListItem>
                          <ListItem><ListItemText primary="Role-based access control" /></ListItem>
                          <ListItem><ListItemText primary="Field-level permissions" /></ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <SecurityIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="subtitle1">Audit Trail</Typography>
                        </Box>
                        <List dense>
                          <ListItem><ListItemText primary="Complete activity logging" /></ListItem>
                          <ListItem><ListItemText primary="Change history tracking" /></ListItem>
                          <ListItem><ListItemText primary="Approval audit trail" /></ListItem>
                          <ListItem><ListItemText primary="Data export for compliance" /></ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="subtitle2">Need Technical Support?</Typography>
              <Typography variant="body2">
                For integration issues or technical questions, contact your system administrator 
                or reach out to TRADEAI support.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 4 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/help')}>
          Back to Help Center
        </Button>
      </Box>
    </Container>
  );
};

export default BusinessProcessGuide;
