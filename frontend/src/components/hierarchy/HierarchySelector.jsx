import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Collapse,
  Checkbox,
  Button,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Search,
  Clear,
  Lock,
  LockOpen,
  AccountTree,
  Business,
  Store,
  Category,
  Inventory
} from '@mui/icons-material';

const HierarchySelector = ({ 
  type = 'customer', // 'customer' or 'product'
  selected = [],
  onSelectionChange,
  showAllocation = true,
  lockRatios = false,
  onLockRatiosChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [hierarchyData, setHierarchyData] = useState([]);
  const [allocation, setAllocation] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHierarchyData();
  }, [type]);

  useEffect(() => {
    if (showAllocation && selected.length > 0) {
      calculateProportionalAllocation();
    }
  }, [selected, lockRatios]);

  const loadHierarchyData = async () => {
    setLoading(true);
    try {
      const mockData = type === 'customer' ? [
        {
          id: 'nat-1',
          name: 'National Chains',
          level: 1,
          type: 'customer',
          children: [
            {
              id: 'reg-1',
              name: 'Northeast Region',
              level: 2,
              type: 'customer',
              children: [
                { id: 'store-1', name: 'Store #101 - Boston', level: 3, type: 'customer', revenue: 500000 },
                { id: 'store-2', name: 'Store #102 - New York', level: 3, type: 'customer', revenue: 750000 },
                { id: 'store-3', name: 'Store #103 - Philadelphia', level: 3, type: 'customer', revenue: 450000 }
              ]
            },
            {
              id: 'reg-2',
              name: 'Southeast Region',
              level: 2,
              type: 'customer',
              children: [
                { id: 'store-4', name: 'Store #201 - Atlanta', level: 3, type: 'customer', revenue: 600000 },
                { id: 'store-5', name: 'Store #202 - Miami', level: 3, type: 'customer', revenue: 550000 }
              ]
            }
          ]
        },
        {
          id: 'ind-1',
          name: 'Independent Retailers',
          level: 1,
          type: 'customer',
          children: [
            { id: 'ind-store-1', name: 'Corner Market', level: 2, type: 'customer', revenue: 150000 },
            { id: 'ind-store-2', name: 'Main Street Grocery', level: 2, type: 'customer', revenue: 200000 }
          ]
        }
      ] : [
        {
          id: 'cat-1',
          name: 'Beverages',
          level: 1,
          type: 'product',
          children: [
            {
              id: 'brand-1',
              name: 'Premium Brand A',
              level: 2,
              type: 'product',
              children: [
                { id: 'sku-1', name: 'SKU-001 - 12oz Can', level: 3, type: 'product', volume: 10000 },
                { id: 'sku-2', name: 'SKU-002 - 20oz Bottle', level: 3, type: 'product', volume: 8000 }
              ]
            },
            {
              id: 'brand-2',
              name: 'Value Brand B',
              level: 2,
              type: 'product',
              children: [
                { id: 'sku-3', name: 'SKU-101 - 12oz Can', level: 3, type: 'product', volume: 15000 }
              ]
            }
          ]
        },
        {
          id: 'cat-2',
          name: 'Snacks',
          level: 1,
          type: 'product',
          children: [
            {
              id: 'brand-3',
              name: 'Premium Snacks',
              level: 2,
              type: 'product',
              children: [
                { id: 'sku-4', name: 'SKU-201 - Chips 8oz', level: 3, type: 'product', volume: 12000 }
              ]
            }
          ]
        }
      ];

      setHierarchyData(mockData);
    } catch (error) {
      console.error('Failed to load hierarchy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProportionalAllocation = () => {
    const newAllocation = {};
    const selectedIds = new Set(selected.map(s => s.id));
    
    let total = 0;
    const calculateTotal = (nodes) => {
      nodes.forEach(node => {
        if (selectedIds.has(node.id)) {
          total += node.revenue || node.volume || 1;
        }
        if (node.children) {
          calculateTotal(node.children);
        }
      });
    };
    calculateTotal(hierarchyData);

    const calculateAllocation = (nodes) => {
      nodes.forEach(node => {
        if (selectedIds.has(node.id)) {
          const value = node.revenue || node.volume || 1;
          newAllocation[node.id] = total > 0 ? (value / total) * 100 : 0;
        }
        if (node.children) {
          calculateAllocation(node.children);
        }
      });
    };
    calculateAllocation(hierarchyData);

    setAllocation(newAllocation);
  };

  const toggleExpand = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelect = (node) => {
    const isSelected = selected.some(s => s.id === node.id);
    let newSelected;
    
    if (isSelected) {
      newSelected = selected.filter(s => s.id !== node.id);
    } else {
      newSelected = [...selected, node];
    }
    
    onSelectionChange(newSelected);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
    setAllocation({});
  };

  const getIcon = (node) => {
    if (type === 'customer') {
      if (node.level === 1) return <Business />;
      if (node.level === 2) return <AccountTree />;
      return <Store />;
    } else {
      if (node.level === 1) return <Category />;
      if (node.level === 2) return <AccountTree />;
      return <Inventory />;
    }
  };

  const renderNode = (node, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selected.some(s => s.id === node.id);
    const hasChildren = node.children && node.children.length > 0;
    const matchesSearch = searchQuery === '' || 
      node.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch && !hasChildren) return null;

    return (
      <React.Fragment key={node.id}>
        <ListItem
          disablePadding
          sx={{ 
            pl: depth * 2,
            bgcolor: isSelected ? 'action.selected' : 'transparent'
          }}
        >
          <ListItemButton onClick={() => handleSelect(node)} dense>
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={isSelected}
                tabIndex={-1}
                disableRipple
              />
            </ListItemIcon>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {getIcon(node)}
            </ListItemIcon>
            <ListItemText 
              primary={node.name}
              secondary={`Level ${node.level} • ${type === 'customer' 
                ? `$${(node.revenue || 0).toLocaleString()}` 
                : `${(node.volume || 0).toLocaleString()} units`}`}
            />
            {hasChildren && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {node.children.map(child => renderNode(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {type === 'customer' ? 'Customer Hierarchy' : 'Product Hierarchy'}
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder={`Search ${type}s...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: searchQuery && (
              <IconButton size="small" onClick={() => setSearchQuery('')}>
                <Clear />
              </IconButton>
            )
          }}
        />
      </Box>

      {selected.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Selected ({selected.length})
            </Typography>
            <Button size="small" onClick={handleClearAll} startIcon={<Clear />}>
              Clear All
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map(item => (
              <Chip
                key={item.id}
                label={item.name}
                size="small"
                onDelete={() => handleSelect(item)}
              />
            ))}
          </Box>
        </Box>
      )}

      <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">Loading hierarchy...</Typography>
          </Box>
        ) : hierarchyData.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No data available</Typography>
          </Box>
        ) : (
          <List>
            {hierarchyData.map(node => renderNode(node))}
          </List>
        )}
      </Paper>

      {showAllocation && selected.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">
              Proportional Allocation Preview
            </Typography>
            {onLockRatiosChange && (
              <FormControlLabel
                control={
                  <Switch
                    checked={lockRatios}
                    onChange={(e) => onLockRatiosChange(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {lockRatios ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                    <Typography variant="caption">Lock Ratios</Typography>
                  </Box>
                }
              />
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          {selected.map(item => (
            <Box key={item.id} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{item.name}</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {(allocation[item.id] || 0).toFixed(1)}%
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  height: 8, 
                  bgcolor: 'action.hover', 
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    height: '100%', 
                    bgcolor: 'primary.main',
                    width: `${allocation[item.id] || 0}%`,
                    transition: 'width 0.3s'
                  }} 
                />
              </Box>
            </Box>
          ))}
          {lockRatios && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                Ratios are locked. Budget changes will maintain these proportions.
              </Typography>
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default HierarchySelector;
