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
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Lightbulb as TipIcon,
  ArrowBack as BackIcon,
  People as CustomersIcon,
  Star as StarIcon,
  AccountTree as HierarchyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CustomersHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Customers</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#9c27b0', borderRadius: 2, p: 1.5, mr: 2 }}>
          <CustomersIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Customers Help</Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to manage customer relationships and hierarchies
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              Customers in TRADEAI represent your retail and distribution partners. The system supports 
              complex customer hierarchies, tiering, and segmentation to enable targeted trade promotion 
              strategies and accurate performance tracking.
            </Typography>
            <Typography variant="body1">
              Customer 360 provides a complete view of each customer including promotions, trade spends, 
              performance metrics, and relationship history.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Customer Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Chain Retailers"
                    secondary="Large retail chains with multiple stores (e.g., Pick n Pay, Shoprite, Checkers)"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Independent Retailers"
                    secondary="Single-store or small group retailers with local presence"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Wholesalers"
                    secondary="Bulk buyers who distribute to smaller retailers"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Distributors"
                    secondary="Partners who handle logistics and distribution in specific regions"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Customer Tiers</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Customers are classified into tiers based on strategic importance and volume:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <StarIcon sx={{ color: '#ffd700', fontSize: 32 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Platinum</Typography>
                    <Typography variant="body2" color="text.secondary">Top strategic accounts</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <StarIcon sx={{ color: '#ffc107', fontSize: 32 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Gold</Typography>
                    <Typography variant="body2" color="text.secondary">High-value partners</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <StarIcon sx={{ color: '#9e9e9e', fontSize: 32 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Silver</Typography>
                    <Typography variant="body2" color="text.secondary">Growing accounts</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <StarIcon sx={{ color: '#cd7f32', fontSize: 32 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Bronze</Typography>
                    <Typography variant="body2" color="text.secondary">Standard accounts</Typography>
                  </Card>
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 2 }}>
                Tier determines default approval thresholds, budget allocation, and promotion eligibility.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Customer Hierarchies</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HierarchyIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1">Hierarchical Structure</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Customers can be organized in hierarchies for aggregated reporting and budget allocation:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Parent-Child Relationships"
                    secondary="Link stores to banners, banners to chains"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Regional Groupings"
                    secondary="Group customers by geographic region"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Channel Classification"
                    secondary="Modern Trade, Traditional Trade, Wholesale, etc."
                  />
                </ListItem>
              </List>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Hierarchies enable roll-up reporting and proportional budget allocation based on volume or revenue.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Customer 360 View</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                The Customer 360 dashboard provides a complete view of each customer:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Profile</Typography>
                      <Typography variant="body2">Contact info, addresses, payment terms</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Promotions</Typography>
                      <Typography variant="body2">Active, planned, and historical promotions</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Trade Spends</Typography>
                      <Typography variant="body2">All trade spend activities and status</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Performance</Typography>
                      <Typography variant="body2">Sales trends, ROI, and KPIs</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Creating a Customer</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 1: Basic Information"
                    secondary="Enter customer name, code, and SAP customer ID"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 2: Classification"
                    secondary="Select customer type, channel, and tier"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 3: Contact Details"
                    secondary="Add primary contact name, email, and phone"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 4: Location"
                    secondary="Enter region, city, and address details"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 5: Hierarchy"
                    secondary="Link to parent customer if applicable"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#f3e5f5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TipIcon sx={{ color: '#9c27b0', mr: 1 }} />
              <Typography variant="h6">Pro Tips</Typography>
            </Box>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Keep codes consistent"
                  secondary="Use SAP customer IDs for easy integration"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Update contacts regularly"
                  secondary="Stale contact info causes communication issues"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Use Customer 360"
                  secondary="Review full history before planning promotions"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Segment strategically"
                  secondary="Tier and channel drive budget allocation"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/customers')}>
                <ListItemText primary="View All Customers" />
              </ListItem>
              <ListItem button onClick={() => navigate('/customers/new')}>
                <ListItemText primary="Add New Customer" />
              </ListItem>
              <ListItem button onClick={() => navigate('/customer-360')}>
                <ListItemText primary="Customer 360" />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="info">
            <Typography variant="subtitle2">Data Import</Typography>
            <Typography variant="body2">
              Bulk import customers via CSV. Go to Data > Import to upload.
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

export default CustomersHelp;
