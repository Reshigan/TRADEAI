import React from 'react';
import { Box, Typography, Stack, Breadcrumbs, Link } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * PageHeader — Consistent page header with title, subtitle, breadcrumbs, and actions.
 */
const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  sx = {},
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 3, ...sx }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<ChevronRight size={14} />}
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return isLast ? (
              <Typography key={idx} variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={idx}
                variant="body2"
                color="text.secondary"
                sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => crumb.path && navigate(crumb.path)}
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            {actions}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
