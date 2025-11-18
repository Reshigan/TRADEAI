import React from 'react';
import {Box, Typography, Breadcrumbs, Link, Divider} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

/**
 * PageHeader component for consistent page headers across the application
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Page title
 * @param {Array} props.breadcrumbs - Array of breadcrumb objects with text and link properties
 * @param {React.ReactNode} props.action - Action button or component to display in the header
 * @param {string} props.subtitle - Optional subtitle text
 */
const PageHeader = ({ title, breadcrumbs = [], action, subtitle }) => {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          <Link 
            component={RouterLink} 
            to="/dashboard" 
            color="inherit"
            underline="hover"
          >
            Dashboard
          </Link>
          
          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography color="text.primary" key={index}>
                {breadcrumb.text}
              </Typography>
            ) : (
              <Link
                component={RouterLink}
                to={breadcrumb.link}
                color="inherit"
                underline="hover"
                key={index}
              >
                {breadcrumb.text}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom={!!subtitle}>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="subtitle1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {action && (
          <Box>
            {action}
          </Box>
        )}
      </Box>
      
      <Divider sx={{ mt: 2, mb: 3 }} />
    </Box>
  );
};

export default PageHeader;