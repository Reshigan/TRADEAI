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
  Info as InfoIcon,
  Lightbulb as TipIcon,
  ArrowBack as BackIcon,
  Inventory as ProductsIcon,
  AccountTree as HierarchyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ProductsHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Products</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#0288d1', borderRadius: 2, p: 1.5, mr: 2 }}>
          <ProductsIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Products Help</Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to manage your product catalog and hierarchies
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              Products in TRADEAI represent your SKUs and product lines. The system supports 
              hierarchical product structures, enabling you to plan and track promotions at 
              any level from individual SKUs to entire categories.
            </Typography>
            <Typography variant="body1">
              Product data includes pricing, costs, and categorization that drive margin 
              calculations and promotion profitability analysis.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Product Hierarchies</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HierarchyIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1">Typical Hierarchy Structure</Typography>
              </Box>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Level 1: Category"
                    secondary="Broad product grouping (e.g., Beverages, Snacks, Dairy)"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Level 2: Subcategory"
                    secondary="More specific grouping (e.g., Carbonated Drinks, Juices)"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Level 3: Brand"
                    secondary="Brand within subcategory (e.g., Coca-Cola, Fanta)"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Level 4: SKU"
                    secondary="Individual product (e.g., Coca-Cola 500ml, Coca-Cola 2L)"
                  />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Promotions can target any level of the hierarchy. Selecting a category includes all products within it.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Product Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Identification</Typography>
                      <Typography variant="body2">
                        Name, SKU code, barcode/EAN, SAP material number
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Classification</Typography>
                      <Typography variant="body2">
                        Category, subcategory, brand, product line
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Pricing</Typography>
                      <Typography variant="body2">
                        List price, cost price, margin percentage
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Status</Typography>
                      <Typography variant="body2">
                        Active, discontinued, seasonal, new
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Creating a Product</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 1: Basic Information"
                    secondary="Enter product name, SKU, and barcode"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 2: Classification"
                    secondary="Select category, subcategory, and brand"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 3: Pricing"
                    secondary="Enter list price and cost price"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 4: Additional Details"
                    secondary="Add pack size, unit of measure, and other attributes"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Pricing and Margins</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Accurate pricing data is essential for promotion profitability analysis:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="List Price"
                    secondary="Standard selling price before any discounts"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Cost Price"
                    secondary="Your cost to produce or acquire the product"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Gross Margin"
                    secondary="Calculated as (List Price - Cost Price) / List Price"
                  />
                </ListItem>
              </List>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Keep pricing updated. Outdated prices lead to inaccurate ROI calculations.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Products in Promotions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                When creating promotions, you can select products in several ways:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Individual SKUs"
                    secondary="Select specific products one by one"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="By Category"
                    secondary="Select entire category - all products included"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="By Brand"
                    secondary="Select all products under a specific brand"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Exclusions"
                    secondary="Select category but exclude specific SKUs"
                  />
                </ListItem>
              </List>
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
                  primary="Use consistent SKU codes"
                  secondary="Match your ERP system for easy integration"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Update prices quarterly"
                  secondary="Schedule regular price reviews"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Mark discontinued products"
                  secondary="Don't delete - mark as discontinued for history"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Use hierarchy for planning"
                  secondary="Plan at category level, track at SKU level"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/products')}>
                <ListItemText primary="View All Products" />
              </ListItem>
              <ListItem button onClick={() => navigate('/products/new')}>
                <ListItemText primary="Add New Product" />
              </ListItem>
              <ListItem button onClick={() => navigate('/hierarchy/products')}>
                <ListItemText primary="Product Hierarchy" />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="info">
            <Typography variant="subtitle2">Bulk Import</Typography>
            <Typography variant="body2">
              Import products via CSV. Include SKU, name, category, and pricing columns.
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

export default ProductsHelp;
