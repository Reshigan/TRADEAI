import React from 'react';
import { Box, Breadcrumbs, Chip, Typography, Tooltip } from '@mui/material';
import { NavigateNext, Business, Store, Category, Inventory, AccountTree, Home } from '@mui/icons-material';

const CUSTOMER_LEVEL_LABELS = {
  national: 'National',
  chain: 'Chain',
  region: 'Region',
  district: 'District',
  store: 'Store'
};

const PRODUCT_LEVEL_LABELS = {
  division: 'Division',
  category: 'Category',
  subcategory: 'Subcategory',
  brand: 'Brand',
  sub_brand: 'Sub-brand',
  sku: 'SKU'
};

const CUSTOMER_ICONS = {
  national: <Home fontSize="small" />,
  chain: <Business fontSize="small" />,
  region: <AccountTree fontSize="small" />,
  district: <AccountTree fontSize="small" />,
  store: <Store fontSize="small" />
};

const PRODUCT_ICONS = {
  division: <Home fontSize="small" />,
  category: <Category fontSize="small" />,
  subcategory: <Category fontSize="small" />,
  brand: <Inventory fontSize="small" />,
  sub_brand: <Inventory fontSize="small" />,
  sku: <Inventory fontSize="small" />
};

const HierarchyBreadcrumb = ({
  type = 'customer',
  path = [],
  currentLevel,
  currentName,
  onNavigate,
  compact = false
}) => {
  const levelLabels = type === 'customer' ? CUSTOMER_LEVEL_LABELS : PRODUCT_LEVEL_LABELS;
  const levelIcons = type === 'customer' ? CUSTOMER_ICONS : PRODUCT_ICONS;

  if (!path || path.length === 0) {
    if (!currentLevel || !currentName) return null;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {levelIcons[currentLevel] || <AccountTree fontSize="small" />}
        <Typography variant="body2" color="text.secondary">
          {levelLabels[currentLevel] || currentLevel}: <strong>{currentName}</strong>
        </Typography>
      </Box>
    );
  }

  return (
    <Breadcrumbs
      separator={<NavigateNext fontSize="small" />}
      sx={{ '& .MuiBreadcrumbs-separator': { mx: 0.5 } }}
    >
      {path.map((node, index) => {
        const isLast = index === path.length - 1;
        const label = compact ? node.name : `${levelLabels[node.level] || node.level}: ${node.name}`;

        if (isLast) {
          return (
            <Chip
              key={node.id || index}
              icon={levelIcons[node.level]}
              label={label}
              size="small"
              color="primary"
              variant="filled"
            />
          );
        }

        return (
          <Tooltip key={node.id || index} title={`${levelLabels[node.level] || node.level}: ${node.name}`}>
            <Chip
              icon={levelIcons[node.level]}
              label={compact ? node.name : label}
              size="small"
              variant="outlined"
              onClick={onNavigate ? () => onNavigate(node) : undefined}
              sx={{ cursor: onNavigate ? 'pointer' : 'default' }}
            />
          </Tooltip>
        );
      })}
    </Breadcrumbs>
  );
};

export default HierarchyBreadcrumb;
