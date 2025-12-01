import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Chip, alpha } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon 
} from '@mui/icons-material';

const PageHeader = ({ 
  title, 
  breadcrumbs = [], 
  action, 
  subtitle,
  badge,
  badgeColor = 'primary',
  icon,
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';
  
  return (
    <Box sx={{ mb: isCompact ? 3 : 4 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={
            <NavigateNextIcon 
              fontSize="small" 
              sx={{ color: 'text.disabled', fontSize: '1rem' }} 
            />
          } 
          aria-label="breadcrumb"
          sx={{ 
            mb: 2,
            '& .MuiBreadcrumbs-li': {
              display: 'flex',
              alignItems: 'center',
            }
          }}
        >
          <Link 
            component={RouterLink} 
            to="/dashboard" 
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'color 0.15s ease',
              '&:hover': {
                color: 'primary.main',
              }
            }}
          >
            <HomeIcon sx={{ fontSize: '1rem' }} />
            Home
          </Link>
          
          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography 
                key={index}
                sx={{ 
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {breadcrumb.text}
              </Typography>
            ) : (
              <Link
                component={RouterLink}
                to={breadcrumb.link}
                key={index}
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'color 0.15s ease',
                  '&:hover': {
                    color: 'primary.main',
                  }
                }}
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
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: subtitle ? 0.5 : 0 }}>
              <Typography 
                variant={isCompact ? 'h5' : 'h4'} 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  color: 'text.primary',
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Typography>
              {badge && (
                <Chip
                  label={badge}
                  size="small"
                  color={badgeColor}
                  sx={{
                    height: 24,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              )}
            </Box>
            
            {subtitle && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  mt: 0.5,
                  maxWidth: 600,
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        
        {action && (
          <Box sx={{ flexShrink: 0 }}>
            {action}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
