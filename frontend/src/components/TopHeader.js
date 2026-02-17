import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  InputBase,
  IconButton,
  Badge,
  Button,
  Menu,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  CalendarMonth as CalendarIcon,
  FileDownload as ExportIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your trade spend performance' },
  '/promotions': { title: 'Promotions', subtitle: 'Manage and track promotional activities' },
  '/budgets': { title: 'Budgets', subtitle: 'Budget planning and allocation management' },
  '/trade-spends': { title: 'Trade Spends', subtitle: 'Manage marketing, cash co-op, and promotional spend' },
  '/analytics': { title: 'Analytics', subtitle: 'AI-powered insights and performance metrics' },
  '/approvals': { title: 'Approvals', subtitle: 'Review and manage approval workflows' },
  '/claims': { title: 'Claims', subtitle: 'Manage customer claims and deductions' },
  '/deductions': { title: 'Deductions', subtitle: 'Track and reconcile deductions' },
  '/rebates': { title: 'Rebates', subtitle: 'Manage rebate programs and accruals' },
  '/simulation-studio': { title: 'Simulation Studio', subtitle: 'What-if scenario analysis and planning' },
  '/forecasting': { title: 'Forecasting', subtitle: 'AI-powered predictive analytics' },
  '/customers': { title: 'Customers', subtitle: 'Customer master data management' },
  '/products': { title: 'Products', subtitle: 'Product master data management' },
  '/vendors': { title: 'Vendors', subtitle: 'Vendor management and tracking' },
  '/trading-terms': { title: 'Trading Terms', subtitle: 'Configure trading terms and conditions' },
  '/settings': { title: 'Settings', subtitle: 'Manage your account and preferences' },
  '/reports': { title: 'Reports', subtitle: 'Comprehensive reporting and exports' },
  '/campaigns': { title: 'Campaigns', subtitle: 'Campaign management and tracking' },
  '/help': { title: 'Help Center', subtitle: 'Documentation and training resources' },
  '/users': { title: 'Users', subtitle: 'User management and roles' },
};

const getPageInfo = (pathname) => {
  for (const [path, info] of Object.entries(pageTitles)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return info;
    }
  }
  return { title: 'TRADEAI', subtitle: 'Trade Spend Management Platform' };
};

const TopHeader = ({ onMenuClick }) => {
  const location = useLocation();
  const [dateAnchor, setDateAnchor] = useState(null);
  const [selectedRange, setSelectedRange] = useState('This Month');

  const pageInfo = getPageInfo(location.pathname);

  const dateRanges = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Last 30 Days', 'Last 90 Days'];

  const handleDateSelect = (range) => {
    setSelectedRange(range);
    setDateAnchor(null);
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 3 },
        py: 2,
        minHeight: 72,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        <IconButton
          onClick={onMenuClick}
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            bgcolor: '#F3F4F6',
            borderRadius: '12px',
            width: 40,
            height: 40,
            mt: 0.25,
            '&:hover': { bgcolor: '#E5E7EB' },
          }}
        >
          <MenuIcon sx={{ fontSize: 20, color: '#6B7280' }} />
        </IconButton>

        <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#111827',
            fontSize: '1.5rem',
            lineHeight: 1.3,
          }}
        >
          {pageInfo.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#6B7280',
            fontSize: '0.85rem',
            mt: 0.25,
          }}
        >
          {pageInfo.subtitle}
        </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#F3F4F6',
            borderRadius: '12px',
            px: 2,
            py: 0.75,
            minWidth: 240,
            transition: 'all 0.2s ease',
            '&:focus-within': {
              bgcolor: '#fff',
              boxShadow: '0 0 0 2px rgba(124, 58, 237, 0.2)',
            },
          }}
        >
          <SearchIcon sx={{ color: '#9CA3AF', fontSize: 20, mr: 1 }} />
          <InputBase
            placeholder="Search everything..."
            sx={{
              fontSize: '0.875rem',
              color: '#374151',
              flex: 1,
              '& input::placeholder': {
                color: '#9CA3AF',
                opacity: 1,
              },
            }}
          />
        </Box>

        <IconButton
          sx={{
            bgcolor: '#F3F4F6',
            borderRadius: '12px',
            width: 40,
            height: 40,
            '&:hover': { bgcolor: '#E5E7EB' },
          }}
        >
          <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 18, height: 18 } }}>
            <NotificationsIcon sx={{ fontSize: 20, color: '#6B7280' }} />
          </Badge>
        </IconButton>

        <Button
          onClick={(e) => setDateAnchor(e.currentTarget)}
          startIcon={<CalendarIcon sx={{ fontSize: 18 }} />}
          endIcon={<ArrowDownIcon />}
          sx={{
            bgcolor: '#F3F4F6',
            borderRadius: '12px',
            color: '#374151',
            fontWeight: 500,
            fontSize: '0.85rem',
            px: 2,
            py: 0.75,
            textTransform: 'none',
            '&:hover': { bgcolor: '#E5E7EB' },
          }}
        >
          {formattedDate}
        </Button>
        <Menu
          anchorEl={dateAnchor}
          open={Boolean(dateAnchor)}
          onClose={() => setDateAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              mt: 1,
              minWidth: 180,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            },
          }}
        >
          {dateRanges.map((range) => (
            <MenuItem
              key={range}
              selected={range === selectedRange}
              onClick={() => handleDateSelect(range)}
              sx={{
                fontSize: '0.85rem',
                py: 1,
                borderRadius: '8px',
                mx: 0.5,
                '&.Mui-selected': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  color: '#7C3AED',
                },
              }}
            >
              {range}
            </MenuItem>
          ))}
        </Menu>

        <Button
          variant="contained"
          startIcon={<ExportIcon sx={{ fontSize: 18 }} />}
          sx={{
            bgcolor: '#7C3AED',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.85rem',
            px: 2.5,
            py: 0.85,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#6D28D9',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            },
          }}
        >
          Export
        </Button>
      </Box>
    </Box>
  );
};

export default TopHeader;
