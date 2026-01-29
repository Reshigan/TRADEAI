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
  Percent as RebatesIcon,
  Calculate as CalculateIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const RebatesHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Rebates</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#7b1fa2', borderRadius: 2, p: 1.5, mr: 2 }}>
          <RebatesIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Rebates Help</Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to create, calculate, and manage rebate programs
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              Rebates are post-sale allowances paid to customers based on achieving specific volume or value 
              thresholds. TRADEAI supports various rebate types including volume rebates, value rebates, 
              growth rebates, and tiered rebate structures. The system automatically calculates accruals 
              and tracks settlements throughout the rebate period.
            </Typography>
            <Typography variant="body1">
              Each rebate agreement goes through a lifecycle: Draft, Pending Approval, Approved, Active, 
              Calculating, and Settled. The system maintains a complete audit trail of all calculations 
              and adjustments.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Rebate Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Volume Rebate"
                    secondary="Rebate calculated based on units purchased. Common for driving volume growth with retailers."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Value Rebate"
                    secondary="Rebate calculated based on purchase value (revenue). Used when value matters more than units."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Growth Rebate"
                    secondary="Rebate paid for achieving year-over-year growth targets. Incentivizes incremental business."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Tiered Rebate"
                    secondary="Multiple rebate tiers with increasing rates as thresholds are met. Encourages higher performance."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Conditional Rebate"
                    secondary="Rebate contingent on meeting specific conditions (e.g., promotional compliance, display execution)."
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Creating a Rebate Agreement</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 1: Basic Information"
                    secondary="Enter rebate name, description, and select the rebate type"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 2: Select Customer"
                    secondary="Choose the customer or customer group for this rebate agreement"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 3: Define Period"
                    secondary="Set the start and end dates for the rebate calculation period"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 4: Set Rate and Thresholds"
                    secondary="Define the rebate rate (percentage or fixed), calculation basis, and any thresholds"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 5: Configure Settlement"
                    secondary="Set settlement frequency (monthly, quarterly, annually) and payment terms"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 6: Link to Trading Terms"
                    secondary="Optionally link to a trading terms agreement for integrated management"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 7: Submit for Approval"
                    secondary="Review all details and submit for approval"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Calculation Methods</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                TRADEAI supports multiple calculation methods:
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Method</strong></TableCell>
                    <TableCell><strong>Formula</strong></TableCell>
                    <TableCell><strong>Use Case</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Percentage</TableCell>
                    <TableCell>Base Value x Rate%</TableCell>
                    <TableCell>Most common, scales with volume</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Fixed Amount</TableCell>
                    <TableCell>Fixed Rate per Period</TableCell>
                    <TableCell>Guaranteed payments</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Per Unit</TableCell>
                    <TableCell>Units x Rate per Unit</TableCell>
                    <TableCell>Volume-based incentives</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tiered</TableCell>
                    <TableCell>Different rates per tier</TableCell>
                    <TableCell>Progressive incentives</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Alert severity="info" sx={{ mt: 2 }}>
                Caps can be set to limit maximum rebate payout regardless of calculation method.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Accrual Management</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Accruals represent the estimated rebate liability based on current performance:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CalculateIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Automatic Calculation"
                    secondary="System calculates accruals based on sales data and rebate terms"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TimelineIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Period Tracking"
                    secondary="Accruals tracked by period (monthly, quarterly) for financial reporting"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Settlement Reconciliation"
                    secondary="Compare accrued amounts to actual settlements and track variances"
                  />
                </ListItem>
              </List>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Accrued</Typography>
                      <Typography variant="body2">Estimated liability based on current sales</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="success.main">Settled</Typography>
                      <Typography variant="body2">Amount actually paid to customer</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="warning.main">Outstanding</Typography>
                      <Typography variant="body2">Accrued minus settled amount</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Settlement Process</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                The settlement process converts accrued rebates into actual payments:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Review Accruals"
                    secondary="Verify calculated accruals against sales data"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Generate Settlement"
                    secondary="Create settlement document with final amounts"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Approval"
                    secondary="Settlement goes through approval workflow"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Payment"
                    secondary="Approved settlement triggers payment or credit note"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#f3e5f5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TipIcon sx={{ color: '#7b1fa2', mr: 1 }} />
              <Typography variant="h6">Pro Tips</Typography>
            </Box>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Set realistic thresholds"
                  secondary="Base thresholds on historical performance data"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Use caps wisely"
                  secondary="Caps protect against unexpected high payouts"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Review accruals monthly"
                  secondary="Catch calculation issues early"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Document agreements"
                  secondary="Attach signed contracts for audit trail"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/rebates')}>
                <ListItemText primary="View All Rebates" />
              </ListItem>
              <ListItem button onClick={() => navigate('/rebates/new')}>
                <ListItemText primary="Create New Rebate" />
              </ListItem>
              <ListItem button onClick={() => navigate('/trading-terms')}>
                <ListItemText primary="Trading Terms" />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="info">
            <Typography variant="subtitle2">Integration</Typography>
            <Typography variant="body2">
              Rebate settlements can be automatically posted to SAP for financial reconciliation.
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

export default RebatesHelp;
