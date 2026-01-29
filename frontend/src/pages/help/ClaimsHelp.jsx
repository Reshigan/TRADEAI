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
  Lightbulb as TipIcon,
  ArrowBack as BackIcon,
  Receipt as ClaimsIcon,
  CompareArrows as MatchIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ClaimsHelp = () => {
  const navigate = useNavigate();

  const claimStatuses = ['Pending', 'Under Review', 'Approved', 'Partially Approved', 'Rejected', 'Settled'];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Claims</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#d32f2f', borderRadius: 2, p: 1.5, mr: 2 }}>
          <ClaimsIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Claims Help</Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to manage customer claims and deduction matching
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              Claims represent requests from customers for payment related to promotional activities, 
              rebates, or other trade agreements. TRADEAI provides a comprehensive claims management 
              system that tracks claims from submission through settlement, with automatic matching 
              to deductions and supporting documentation management.
            </Typography>
            <Typography variant="body1">
              The system supports various claim types including promotion claims, rebate claims, 
              damage claims, and pricing discrepancy claims. Each claim goes through a review 
              and approval workflow before settlement.
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Claim Lifecycle</Typography>
            <Stepper activeStep={-1} alternativeLabel sx={{ mt: 2 }}>
              {claimStatuses.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Claim Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Promotion Claim"
                    secondary="Customer claims for promotional allowances based on executed promotions. Requires proof of performance."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Rebate Claim"
                    secondary="Claims for rebate payments based on volume or value thresholds achieved during the rebate period."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Damage Claim"
                    secondary="Claims for damaged goods received. Requires documentation of damage and return authorization."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Pricing Discrepancy"
                    secondary="Claims for price differences between agreed pricing and invoiced amounts."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Shortage Claim"
                    secondary="Claims for products not received or short-shipped. Requires delivery documentation."
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Creating a Claim</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 1: Select Claim Type"
                    secondary="Choose the appropriate claim type based on the nature of the request"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 2: Select Customer"
                    secondary="Choose the customer submitting the claim"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 3: Link to Source"
                    secondary="Link to the related promotion, rebate, or invoice as applicable"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 4: Enter Claim Amount"
                    secondary="Specify the amount being claimed by the customer"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 5: Add Supporting Documents"
                    secondary="Upload proof of performance, invoices, or other supporting documentation"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 6: Submit for Review"
                    secondary="Submit the claim for review and approval"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Claim Review Process</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                The review process ensures claims are validated before payment:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Documentation Review"
                    secondary="Verify all required supporting documents are attached and valid"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Amount Validation"
                    secondary="Verify claimed amount matches agreement terms and calculations"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Compliance Check"
                    secondary="Ensure customer met all requirements (e.g., promotional compliance)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Approval Decision"
                    secondary="Approve full amount, approve partial amount, or reject with reason"
                  />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Partial approvals are common when documentation supports only a portion of the claimed amount.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Deduction Matching</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                TRADEAI can automatically match claims to customer deductions:
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <MatchIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">Auto-Match Feature</Typography>
                      </Box>
                      <Typography variant="body2">
                        The system automatically matches claims to open deductions based on customer, 
                        amount, and date criteria. This reduces manual reconciliation effort and 
                        speeds up the settlement process.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Exact Match"
                    secondary="Claim and deduction amounts match exactly"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Partial Match"
                    secondary="Claim covers part of a deduction or vice versa"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Multiple Match"
                    secondary="One claim matches multiple deductions or vice versa"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Settlement</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Once approved, claims proceed to settlement:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Credit Note"
                    secondary="Issue credit note to customer account"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Direct Payment"
                    secondary="Process payment directly to customer"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Offset Against Invoice"
                    secondary="Apply as credit against outstanding invoices"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#ffebee' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TipIcon sx={{ color: '#d32f2f', mr: 1 }} />
              <Typography variant="h6">Pro Tips</Typography>
            </Box>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Require documentation"
                  secondary="Always require proof of performance for promotion claims"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Set SLAs"
                  secondary="Define review SLAs to ensure timely processing"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Use auto-match"
                  secondary="Run auto-match regularly to reduce manual work"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Track aging"
                  secondary="Monitor claim aging to avoid customer disputes"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/claims')}>
                <ListItemText primary="View All Claims" />
              </ListItem>
              <ListItem button onClick={() => navigate('/claims/new')}>
                <ListItemText primary="Create New Claim" />
              </ListItem>
              <ListItem button onClick={() => navigate('/deductions')}>
                <ListItemText primary="Deductions" />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="warning" icon={<WarningIcon />}>
            <Typography variant="subtitle2">Aging Claims</Typography>
            <Typography variant="body2">
              Claims older than 30 days should be escalated to prevent customer relationship issues.
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

export default ClaimsHelp;
