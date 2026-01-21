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
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Lightbulb as TipIcon,
  ArrowBack as BackIcon,
  Approval as ApprovalsIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ApprovalsHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Approvals</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#388e3c', borderRadius: 2, p: 1.5, mr: 2 }}>
          <ApprovalsIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Approvals Help</Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to manage approval workflows and queues
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              The approval system ensures proper governance and control over trade promotion activities. 
              Promotions, trade spends, and budgets require approval before execution, with routing 
              based on amount, type, and organizational rules.
            </Typography>
            <Typography variant="body1">
              Approvers receive notifications and can approve, reject, or request changes directly 
              from the approval queue or via email.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Approval Statuses</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <Chip label="Draft" color="default" sx={{ mb: 1 }} />
                    <Typography variant="body2">Not yet submitted for approval</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <Chip label="Pending" color="warning" sx={{ mb: 1 }} />
                    <Typography variant="body2">Awaiting approver action</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <Chip label="Approved" color="success" sx={{ mb: 1 }} />
                    <Typography variant="body2">Approved and ready to execute</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <Chip label="Rejected" color="error" sx={{ mb: 1 }} />
                    <Typography variant="body2">Rejected, needs revision</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <Chip label="Changes Requested" color="info" sx={{ mb: 1 }} />
                    <Typography variant="body2">Approver requested modifications</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <Chip label="Escalated" color="secondary" sx={{ mb: 1 }} />
                    <Typography variant="body2">Escalated to higher authority</Typography>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Approval Routing</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Items are routed to approvers based on configurable rules:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Amount-Based Routing"
                    secondary="Higher amounts require higher-level approval (e.g., >R100K needs Director)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Type-Based Routing"
                    secondary="Different item types route to different approvers (e.g., Rebates to Finance)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Customer-Based Routing"
                    secondary="Key accounts may require executive approval"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Multi-Level Approval"
                    secondary="Sequential approval through multiple levels"
                  />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Approval rules are configured by administrators in System Settings.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Approving Items</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 1: Access Approval Queue"
                    secondary="Go to Approvals to see items pending your approval"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 2: Review Details"
                    secondary="Click an item to see full details, documents, and history"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 3: Check Budget Impact"
                    secondary="Verify budget availability and utilization impact"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 4: Take Action"
                    secondary="Approve, Reject, or Request Changes with comments"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Delegation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Delegate your approval authority when you're unavailable:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Temporary Delegation"
                    secondary="Delegate to a colleague for a specific date range"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Partial Delegation"
                    secondary="Delegate only certain types or amounts"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Audit Trail"
                    secondary="All delegated approvals are logged with delegate info"
                  />
                </ListItem>
              </List>
              <Alert severity="warning" sx={{ mt: 2 }}>
                You remain accountable for delegated approvals. Choose delegates carefully.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Escalation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="subtitle1">Automatic Escalation</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Items are automatically escalated when:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Time Threshold Exceeded"
                    secondary="Pending more than 7 days (configurable)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Approver Unavailable"
                    secondary="Approver marked as out of office with no delegate"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Urgent Flag"
                    secondary="Submitter marked item as urgent"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Approval History</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Complete audit trail of all approval actions:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Action Log"
                    secondary="Who approved/rejected and when"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Comments"
                    secondary="All comments and feedback preserved"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Version History"
                    secondary="Track changes made between submissions"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#e8f5e9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TipIcon sx={{ color: '#388e3c', mr: 1 }} />
              <Typography variant="h6">Pro Tips</Typography>
            </Box>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Check queue daily"
                  secondary="Don't let items age - it blocks operations"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Add clear comments"
                  secondary="Explain rejections to help submitters fix issues"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Set up delegation"
                  secondary="Always have a delegate when traveling"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Use mobile app"
                  secondary="Approve on the go via mobile notifications"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/approvals')}>
                <ListItemText primary="Approval Queue" />
              </ListItem>
              <ListItem button onClick={() => navigate('/approvals/history')}>
                <ListItemText primary="Approval History" />
              </ListItem>
              <ListItem button onClick={() => navigate('/admin/workflows')}>
                <ListItemText primary="Workflow Settings" />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="warning" icon={<WarningIcon />}>
            <Typography variant="subtitle2">SLA Reminder</Typography>
            <Typography variant="body2">
              Target approval SLA is 48 hours. Items pending longer appear in escalation reports.
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

export default ApprovalsHelp;
