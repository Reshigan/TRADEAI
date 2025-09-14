import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MobileStepper,
  Paper,
  Typography,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  LightbulbOutlined as TipIcon
} from '@mui/icons-material';

/**
 * Walkthrough component for user training
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the walkthrough is open
 * @param {Function} props.onClose - Function to call when walkthrough is closed
 * @param {string} props.feature - Feature name for which to show walkthrough
 * @param {boolean} props.showTips - Whether to show tips (default: true)
 */
const Walkthrough = ({ open, onClose, feature, showTips = true }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState([]);

  // Load walkthrough steps based on feature
  useEffect(() => {
    if (!feature) return;
    
    // Get steps for the specified feature
    const featureSteps = getWalkthroughSteps(feature);
    setSteps(featureSteps);
    setActiveStep(0);
  }, [feature]);

  // Handle next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Handle previous step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle close
  const handleClose = () => {
    // Save to localStorage that user has seen this walkthrough
    localStorage.setItem(`walkthrough_${feature}`, 'completed');
    onClose();
  };

  // If no steps or not open, don't render
  if (!open || steps.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className="walkthrough-dialog"
      BackdropProps={{
        className: 'walkthrough-overlay'
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {steps[activeStep]?.title || 'Walkthrough'}
        </Typography>
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {steps[activeStep]?.image && (
            <Box 
              sx={{ 
                width: '100%', 
                height: 250, 
                backgroundColor: 'grey.100', 
                borderRadius: 1,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img 
                src={`/images/walkthrough/${steps[activeStep].image}`} 
                alt={steps[activeStep].title}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
          
          <Typography variant="body1" paragraph>
            {steps[activeStep]?.description}
          </Typography>
          
          {showTips && steps[activeStep]?.tip && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mt: 2, 
                backgroundColor: 'primary.50',
                display: 'flex',
                alignItems: 'flex-start'
              }}
            >
              <TipIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Tip:</strong> {steps[activeStep].tip}
              </Typography>
            </Paper>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <MobileStepper
          variant="dots"
          steps={steps.length}
          position="static"
          activeStep={activeStep}
          sx={{ 
            flexGrow: 1, 
            backgroundColor: 'transparent',
            '& .MuiMobileStepper-dot': {
              backgroundColor: theme.palette.grey[300]
            },
            '& .MuiMobileStepper-dotActive': {
              backgroundColor: theme.palette.primary.main
            }
          }}
          nextButton={
            activeStep === steps.length - 1 ? (
              <Button size="small" onClick={handleClose} variant="contained">
                Finish
              </Button>
            ) : (
              <Button size="small" onClick={handleNext}>
                Next
                <KeyboardArrowRight />
              </Button>
            )
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
              <KeyboardArrowLeft />
              Back
            </Button>
          }
        />
      </DialogActions>
    </Dialog>
  );
};

/**
 * Get walkthrough steps for a specific feature
 * 
 * @param {string} feature - Feature name
 * @returns {Array} Array of step objects
 */
const getWalkthroughSteps = (feature) => {
  const walkthroughSteps = {
    dashboard: [
      {
        title: 'Welcome to the Dashboard',
        description: 'The dashboard provides an overview of your trade spend activities, budgets, and key performance indicators. You can quickly see how your promotions are performing and identify areas that need attention.',
        image: 'dashboard-overview.png',
        tip: 'You can customize which KPIs appear on your dashboard by clicking the settings icon in the top-right corner.'
      },
      {
        title: 'Performance Metrics',
        description: 'These cards show your key performance metrics at a glance. Monitor your total trade spend, active promotions, ROI, and more.',
        image: 'dashboard-metrics.png',
        tip: 'Click on any metric card to see more detailed information and historical trends.'
      },
      {
        title: 'Recent Activity',
        description: 'This section shows your most recent activities, including newly created promotions, budget changes, and important notifications.',
        image: 'dashboard-activity.png',
        tip: 'You can filter the activity feed by type using the dropdown menu.'
      },
      {
        title: 'Quick Actions',
        description: 'Use these buttons to quickly create new promotions, add budgets, or generate reports without navigating to different sections.',
        image: 'dashboard-actions.png',
        tip: 'Hover over each action button to see a description of what it does.'
      }
    ],
    customers: [
      {
        title: 'Customer Management',
        description: 'The Customers page allows you to manage all your retail partners and distributors. You can view customer details, track performance, and manage associated promotions and budgets.',
        image: 'customers-overview.png',
        tip: 'Use the search and filter options to quickly find specific customers.'
      },
      {
        title: 'Customer Details',
        description: 'Click on any customer to view detailed information, including contact details, address, and performance metrics.',
        image: 'customer-details.png',
        tip: 'You can edit customer information by clicking the Edit button in the top-right corner.'
      },
      {
        title: 'Customer Performance',
        description: 'This tab shows performance metrics for the selected customer, including sales trends, promotion effectiveness, and ROI.',
        image: 'customer-performance.png',
        tip: 'Adjust the date range to view performance over different time periods.'
      },
      {
        title: 'Customer Promotions',
        description: 'View all promotions associated with this customer, including active, planned, and completed promotions.',
        image: 'customer-promotions.png',
        tip: 'Click the "Create Promotion" button to quickly set up a new promotion for this customer.'
      }
    ],
    products: [
      {
        title: 'Product Management',
        description: 'The Products page allows you to manage your product catalog. You can view product details, track performance, and manage associated promotions.',
        image: 'products-overview.png',
        tip: 'Use the category filter to quickly find products by type.'
      },
      {
        title: 'Product Details',
        description: 'Click on any product to view detailed information, including pricing, inventory, and specifications.',
        image: 'product-details.png',
        tip: 'You can edit product information by clicking the Edit button in the top-right corner.'
      },
      {
        title: 'Product Performance',
        description: 'This tab shows performance metrics for the selected product, including sales trends, promotion effectiveness, and profitability.',
        image: 'product-performance.png',
        tip: 'Compare performance across different customers to identify opportunities for growth.'
      },
      {
        title: 'Product Promotions',
        description: 'View all promotions that include this product, including active, planned, and completed promotions.',
        image: 'product-promotions.png',
        tip: 'Click the "Create Promotion" button to quickly set up a new promotion for this product.'
      }
    ],
    budgets: [
      {
        title: 'Budget Management',
        description: 'The Budgets page allows you to manage your trade spend budgets. You can create, edit, and track budgets by year, customer, or category.',
        image: 'budgets-overview.png',
        tip: 'Use the year filter to view budgets for different fiscal periods.'
      },
      {
        title: 'Budget Details',
        description: 'Click on any budget to view detailed information, including allocated amounts, remaining funds, and associated promotions.',
        image: 'budget-details.png',
        tip: 'You can adjust budget allocations by clicking the Edit button in the top-right corner.'
      },
      {
        title: 'Budget Allocation',
        description: 'This tab shows how your budget is allocated across different customers, products, or promotion types.',
        image: 'budget-allocation.png',
        tip: 'Use the pie chart to quickly identify where your budget is being spent.'
      },
      {
        title: 'Budget Timeline',
        description: 'View your budget usage over time to identify spending patterns and forecast future needs.',
        image: 'budget-timeline.png',
        tip: 'Hover over data points to see detailed spending information for specific periods.'
      }
    ],
    promotions: [
      {
        title: 'Promotion Management',
        description: 'The Promotions page allows you to manage all your trade promotions. You can create, edit, and track promotions across different customers and products.',
        image: 'promotions-overview.png',
        tip: 'Use the status filter to quickly find active, planned, or completed promotions.'
      },
      {
        title: 'Promotion Details',
        description: 'Click on any promotion to view detailed information, including budget, timeline, and performance metrics.',
        image: 'promotion-details.png',
        tip: 'You can edit promotion details by clicking the Edit button in the top-right corner.'
      },
      {
        title: 'Promotion Performance',
        description: 'This tab shows performance metrics for the selected promotion, including sales lift, ROI, and incremental volume.',
        image: 'promotion-performance.png',
        tip: 'Compare actual performance against forecasted results to evaluate promotion effectiveness.'
      },
      {
        title: 'Promotion Calendar',
        description: 'View all your promotions on a calendar to identify overlaps, gaps, and opportunities for optimization.',
        image: 'promotion-calendar.png',
        tip: 'Drag and drop promotions to adjust dates and avoid conflicts.'
      }
    ],
    analytics: [
      {
        title: 'Analytics Dashboard',
        description: 'The Analytics page provides advanced insights into your trade spend performance. You can analyze trends, compare scenarios, and identify optimization opportunities.',
        image: 'analytics-overview.png',
        tip: 'Save your favorite reports for quick access in the future.'
      },
      {
        title: 'Performance Analysis',
        description: 'This section allows you to analyze performance across different dimensions, including customers, products, promotion types, and time periods.',
        image: 'analytics-performance.png',
        tip: 'Use the comparison feature to benchmark performance against previous periods or targets.'
      },
      {
        title: 'ROI Analysis',
        description: 'Evaluate the return on investment for your trade spend activities. Identify which promotions, customers, or products deliver the best results.',
        image: 'analytics-roi.png',
        tip: 'Sort by ROI to quickly identify your most and least effective investments.'
      },
      {
        title: 'AI Recommendations',
        description: 'Our AI engine analyzes your data to provide personalized recommendations for optimizing your trade spend strategy.',
        image: 'analytics-ai.png',
        tip: 'Click on any recommendation to see detailed reasoning and implementation steps.'
      }
    ],
    settings: [
      {
        title: 'System Settings',
        description: 'The Settings page allows you to configure your Trade AI Platform. You can manage users, customize preferences, and configure integrations.',
        image: 'settings-overview.png',
        tip: 'Most settings take effect immediately without requiring a system restart.'
      },
      {
        title: 'User Management',
        description: 'Add, edit, or remove users from your organization. Assign roles and permissions to control access to different features and data.',
        image: 'settings-users.png',
        tip: 'Use role templates to quickly assign common permission sets to new users.'
      },
      {
        title: 'Notification Settings',
        description: 'Configure when and how you receive notifications about important events, such as budget approvals, promotion status changes, or system alerts.',
        image: 'settings-notifications.png',
        tip: 'You can set up different notification preferences for different types of events.'
      },
      {
        title: 'Data Integration',
        description: 'Configure connections to external systems, such as ERP, CRM, or data warehouses. Import and export data to keep your systems in sync.',
        image: 'settings-integration.png',
        tip: 'Use the test connection feature to verify your integration settings before saving.'
      }
    ],
    'activity-grid': [
      {
        title: 'Activity Grid',
        description: 'The Activity Grid provides a comprehensive view of all your marketing and trade activities in one place. You can visualize promotions, trade spends, campaigns, events, and training sessions in a calendar format.',
        image: 'activity-grid-overview.svg',
        tip: 'Use the different view options (Month, Week, Day, List, Heat Map) to visualize your activities in the most useful way.'
      },
      {
        title: 'Adding Activities',
        description: 'You can add new activities directly from the Activity Grid. Click the "Add Activity" button to create promotions, events, campaigns, or other activities.',
        image: 'activity-grid-overview.svg',
        tip: 'Activities created here will automatically sync with the corresponding modules (Promotions, Trade Spends, etc.).'
      },
      {
        title: 'Conflict Detection',
        description: 'The Activity Grid automatically detects conflicts between different activities, such as overlapping promotions for the same customer or product.',
        image: 'activity-grid-overview.svg',
        tip: 'Look for warning icons that indicate potential conflicts, and click on them to see details and resolve issues.'
      },
      {
        title: 'Heat Map View',
        description: 'The Heat Map view shows activity intensity across customers, products, or vendors. This helps you identify periods of high activity or gaps that need attention.',
        image: 'activity-grid-overview.svg',
        tip: 'Use the Heat Map to ensure balanced activity distribution and avoid overwhelming specific customers with too many simultaneous promotions.'
      }
    ],
    chatbot: [
      {
        title: 'AI Assistant',
        description: 'The AI Assistant helps you navigate the platform, find information, and complete tasks more efficiently. You can ask questions, request data, or get recommendations.',
        image: 'chatbot-overview.png',
        tip: 'Click the chat icon in the bottom-right corner to open the assistant at any time.'
      },
      {
        title: 'Asking Questions',
        description: 'You can ask the assistant questions about your data, such as "How is my Q3 budget performing?" or "Show me top-performing promotions for Biltong."',
        image: 'chatbot-questions.png',
        tip: 'Be specific in your questions to get more accurate and helpful responses.'
      },
      {
        title: 'Getting Recommendations',
        description: 'The assistant can provide personalized recommendations based on your data, such as "Recommend promotion types for Rooibos Tea" or "How can I improve ROI for Shoprite?"',
        image: 'chatbot-recommendations.png',
        tip: 'Ask "Why" after receiving a recommendation to understand the reasoning behind it.'
      },
      {
        title: 'Completing Tasks',
        description: 'You can ask the assistant to help you complete tasks, such as "Create a new promotion for Pick n Pay" or "Update budget allocation for Q4."',
        image: 'chatbot-tasks.png',
        tip: 'The assistant will guide you through complex tasks step by step, ensuring you provide all necessary information.'
      }
    ]
  };
  
  return walkthroughSteps[feature] || [];
};

export default Walkthrough;