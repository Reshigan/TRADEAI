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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Lightbulb as TipIcon,
  ArrowBack as BackIcon,
  Receipt as TradeSpendIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const TradeSpendsHelp = () => {
  const navigate = useNavigate();

  const workflowSteps = ['Create', 'Submit', 'Approve', 'Accrue', 'Settle', 'Reconcile'];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Trade Spends</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#ed6c02', borderRadius: 2, p: 1.5, mr: 2 }}>
          <TradeSpendIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Trade Spends Help</Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to track, approve, and reconcile trade spend activities
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              Trade Spends represent the actual financial transactions for trade promotion activities. 
              They track money flowing from your company to retailers/distributors for promotional 
              support, rebates, listing fees, and other trade investments.
            </Typography>
            <Typography variant="body1">
              Each trade spend goes through a complete lifecycle from creation to reconciliation, 
              with full audit trail and financial controls.
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Trade Spend Lifecycle</Typography>
            <Stepper activeStep={-1} alternativeLabel sx={{ mt: 2 }}>
              {workflowSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Trade Spend Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Cash Co-op"
                    secondary="Direct cash payment to retailer for promotional support. Requires invoice and proof of performance."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Off-Invoice"
                    secondary="Discount applied directly on the invoice. Reduces accounts receivable automatically."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Scan Rebate"
                    secondary="Rebate based on POS scan data. Paid after promotion period based on actual sales."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Volume Rebate"
                    secondary="Rebate paid when customer reaches volume thresholds. Calculated periodically."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Listing Fee"
                    secondary="One-time payment for new product placement. Often tied to specific shelf locations."
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Creating a Trade Spend</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 1: Select Type"
                    secondary="Choose the trade spend type (Cash Co-op, Off-Invoice, Scan Rebate, etc.)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 2: Link to Promotion/Budget"
                    secondary="Associate with a promotion and select the funding budget"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 3: Select Customer"
                    secondary="Choose the retailer/distributor receiving the trade spend"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 4: Enter Amount"
                    secondary="Specify the requested amount and any supporting calculations"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 5: Attach Documents"
                    secondary="Upload supporting documents (agreements, invoices, proof of performance)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 6: Submit for Approval"
                    secondary="Route to appropriate approver based on amount and type"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Approval Process</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Trade spends require approval before payment. Approval routing is based on:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Amount Thresholds</Typography>
                      <Typography variant="body2">
                        Higher amounts require higher-level approval
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Spend Type</Typography>
                      <Typography variant="body2">
                        Different types may have different approvers
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Customer Tier</Typography>
                      <Typography variant="body2">
                        Key accounts may require executive approval
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Budget Status</Typography>
                      <Typography variant="body2">
                        Over-budget requests need special approval
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Accruals</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Accruals represent the financial liability for approved trade spends:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Automatic Accrual"
                    secondary="System creates accrual entry when trade spend is approved"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Period Allocation"
                    secondary="Accruals can be spread across multiple periods"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Reversal"
                    secondary="Accruals are reversed when trade spend is settled or cancelled"
                  />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Accrual reports are available in the Finance section for period-end close.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Reconciliation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Reconciliation matches trade spends with actual payments and deductions:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Match with Claims"
                    secondary="Link trade spends to customer claims/deductions"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Variance Analysis"
                    secondary="Identify and explain differences between planned and actual"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Settlement"
                    secondary="Mark trade spend as settled when payment is confirmed"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#fff3e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TipIcon sx={{ color: '#ed6c02', mr: 1 }} />
              <Typography variant="h6">Pro Tips</Typography>
            </Box>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Attach proof early"
                  secondary="Upload supporting docs before submitting to speed approval"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Check budget first"
                  secondary="Verify budget availability before creating trade spend"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Use clone for recurring"
                  secondary="Clone previous trade spends for recurring activities"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Reconcile promptly"
                  secondary="Match claims within 30 days to avoid aging issues"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/trade-spends')}>
                <ListItemText primary="View All Trade Spends" />
              </ListItem>
              <ListItem button onClick={() => navigate('/trade-spends/new')}>
                <ListItemText primary="Create Trade Spend" />
              </ListItem>
              <ListItem button onClick={() => navigate('/deductions')}>
                <ListItemText primary="Reconciliation Dashboard" />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="warning" icon={<WarningIcon />}>
            <Typography variant="subtitle2">Approval Deadlines</Typography>
            <Typography variant="body2">
              Trade spends pending approval for more than 7 days are escalated automatically.
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

export default TradeSpendsHelp;
