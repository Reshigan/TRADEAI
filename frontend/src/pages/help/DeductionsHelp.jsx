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
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Lightbulb as TipIcon,
  ArrowBack as BackIcon,
  RemoveCircle as DeductionsIcon,
  Search as SearchIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DeductionsHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Deductions</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#f57c00', borderRadius: 2, p: 1.5, mr: 2 }}>
          <DeductionsIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Deductions Help</Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to track, investigate, and resolve customer deductions
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              Deductions are amounts withheld by customers from invoice payments. They can be legitimate 
              (related to valid promotions, rebates, or damages) or unauthorized. TRADEAI helps you 
              track all deductions, investigate their validity, match them to claims or promotions, 
              and resolve them efficiently.
            </Typography>
            <Typography variant="body1">
              Effective deduction management is critical for maintaining accurate accounts receivable 
              and preventing revenue leakage from invalid deductions.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Deduction Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Promotional Deduction"
                    secondary="Customer deducts promotional allowances from payment. Should match approved promotions."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Rebate Deduction"
                    secondary="Customer deducts earned rebates. Should match rebate agreement calculations."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Damage/Return Deduction"
                    secondary="Customer deducts for damaged or returned goods. Requires return authorization."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Pricing Deduction"
                    secondary="Customer deducts for price discrepancies. Requires price verification."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Shortage Deduction"
                    secondary="Customer deducts for short shipments. Requires delivery verification."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Unauthorized Deduction"
                    secondary="Deduction without valid reason. May require dispute resolution."
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Deduction Statuses</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Chip label="Open" color="warning" size="small" sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        New deduction awaiting investigation
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Chip label="Under Review" color="info" size="small" sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        Being investigated for validity
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Chip label="Matched" color="primary" size="small" sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        Linked to valid claim or promotion
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Chip label="Approved" color="success" size="small" sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        Validated and approved for write-off
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Chip label="Disputed" color="error" size="small" sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        Invalid deduction being disputed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Chip label="Resolved" size="small" sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        Fully resolved and closed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Investigation Process</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Follow these steps to investigate deductions:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><SearchIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 1: Identify Source"
                    secondary="Determine what the deduction is for based on customer reference or reason code"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><LinkIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 2: Find Related Records"
                    secondary="Search for matching promotions, rebates, claims, or invoices"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 3: Validate Amount"
                    secondary="Verify the deducted amount matches the agreement or claim"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 4: Check Documentation"
                    secondary="Ensure required proof of performance or documentation exists"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 5: Make Decision"
                    secondary="Approve valid deductions or dispute invalid ones"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Auto-Matching</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                TRADEAI can automatically match deductions to their sources:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Promotion Matching"
                    secondary="Matches deductions to approved promotions based on customer, date, and amount"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Claim Matching"
                    secondary="Matches deductions to submitted claims based on customer and amount"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Rebate Matching"
                    secondary="Matches deductions to rebate accruals based on customer and period"
                  />
                </ListItem>
              </List>
              <Alert severity="success" sx={{ mt: 2 }}>
                Auto-matching can resolve up to 70% of deductions automatically, significantly reducing manual effort.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Dispute Resolution</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                For invalid deductions, follow the dispute process:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Document the Issue"
                    secondary="Record why the deduction is invalid with supporting evidence"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Contact Customer"
                    secondary="Reach out to customer with dispute details and request repayment"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Track Response"
                    secondary="Log all communications and customer responses"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Escalate if Needed"
                    secondary="Escalate unresolved disputes to management or collections"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#fff3e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TipIcon sx={{ color: '#f57c00', mr: 1 }} />
              <Typography variant="h6">Pro Tips</Typography>
            </Box>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Process quickly"
                  secondary="Investigate deductions within 30 days for best recovery rates"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Use reason codes"
                  secondary="Require customers to provide reason codes for faster matching"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Track patterns"
                  secondary="Monitor for customers with high unauthorized deduction rates"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Set thresholds"
                  secondary="Auto-approve small deductions below a threshold to save time"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/deductions')}>
                <ListItemText primary="View All Deductions" />
              </ListItem>
              <ListItem button onClick={() => navigate('/deductions/open')}>
                <ListItemText primary="Open Deductions" />
              </ListItem>
              <ListItem button onClick={() => navigate('/claims')}>
                <ListItemText primary="Claims" />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Key Metrics</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Resolution Rate"
                  secondary="% of deductions resolved within SLA"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Recovery Rate"
                  secondary="% of disputed deductions recovered"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Auto-Match Rate"
                  secondary="% of deductions matched automatically"
                />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="info">
            <Typography variant="subtitle2">Aging Report</Typography>
            <Typography variant="body2">
              Review the deduction aging report weekly to prioritize older items.
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

export default DeductionsHelp;
