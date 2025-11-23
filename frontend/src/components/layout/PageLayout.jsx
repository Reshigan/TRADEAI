import React from 'react';
import { Box, Container, Typography, Breadcrumbs as MuiBreadcrumbs, Link, Paper } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * PageLayout - Canonical page layout component for consistent structure across all modules
 * 
 * Provides standard slots for:
 * - Title: Page heading
 * - Breadcrumbs: Navigation breadcrumbs (auto-generated from route if not provided)
 * - Tabs: Tab navigation for multi-section pages
 * - Toolbar: Action buttons and filters
 * - FilterBar: Advanced filtering UI
 * - Content: Main page content
 * - Footer: Optional footer content
 * 
 * Usage:
 * <PageLayout
 *   title="Products"
 *   breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Products' }]}
 *   toolbar={<Button>Add Product</Button>}
 * >
 *   <YourContent />
 * </PageLayout>
 */
const PageLayout = ({
  children,
  
  title,
  subtitle,
  titleAction,
  
  breadcrumbs,
  showBreadcrumbs = true,
  
  // Layout
  tabs,
  toolbar,
  filterBar,
  footer,
  
  maxWidth = 'xl',
  disableGutters = false,
  
  sx = {},
  contentSx = {},
  
  background = 'default', // 'default' | 'paper'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getBreadcrumbs = () => {
    if (breadcrumbs) return breadcrumbs;
    if (!showBreadcrumbs) return [];
    
    const paths = location.pathname.split('/').filter(Boolean);
    const crumbs = [{ label: 'Home', path: '/dashboard' }];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      crumbs.push({
        label,
        path: index === paths.length - 1 ? null : currentPath
      });
    });
    
    return crumbs;
  };
  
  const breadcrumbItems = getBreadcrumbs();
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: background === 'paper' ? 'background.paper' : 'background.default',
        ...sx
      }}
    >
      <Container
        maxWidth={maxWidth}
        disableGutters={disableGutters}
        sx={{ py: 3 }}
      >
        {/* Breadcrumbs */}
        {showBreadcrumbs && breadcrumbItems.length > 0 && (
          <MuiBreadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 2 }}
          >
            {breadcrumbItems.map((crumb, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              
              if (isLast || !crumb.path) {
                return (
                  <Typography
                    key={index}
                    color="text.primary"
                    sx={{ fontWeight: 600 }}
                  >
                    {crumb.label}
                  </Typography>
                );
              }
              
              return (
                <Link
                  key={index}
                  component="button"
                  variant="body2"
                  onClick={() => navigate(crumb.path)}
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {crumb.label}
                </Link>
              );
            })}
          </MuiBreadcrumbs>
        )}
        
        {/* Page Header */}
        {(title || subtitle || titleAction) && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: subtitle ? 1 : 0
              }}
            >
              {title && (
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {title}
                </Typography>
              )}
              {titleAction && (
                <Box sx={{ ml: 2 }}>{titleAction}</Box>
              )}
            </Box>
            {subtitle && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
        
        {/* Tabs */}
        {tabs && (
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >
            {tabs}
          </Paper>
        )}
        
        {/* Toolbar */}
        {toolbar && (
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center'
            }}
          >
            {toolbar}
          </Box>
        )}
        
        {/* Filter Bar */}
        {filterBar && (
          <Box sx={{ mb: 3 }}>
            {filterBar}
          </Box>
        )}
        
        {/* Main Content */}
        <Box
          sx={{
            ...contentSx
          }}
        >
          {children}
        </Box>
        
        {/* Footer */}
        {footer && (
          <Box sx={{ mt: 4 }}>
            {footer}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default PageLayout;
