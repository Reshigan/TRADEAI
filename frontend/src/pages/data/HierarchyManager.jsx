import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Tabs, Tab, LinearProgress, Button,
  List, ListItemButton, ListItemIcon, ListItemText, Collapse, Chip,
  TextField, InputAdornment, IconButton, Grid, Paper, Alert} from '@mui/material';
import {
  ChevronDown, ChevronRight, FolderTree, Search, X, RefreshCw,
  Building2, Store, MapPin, Globe, Tag, Package, Layers
} from 'lucide-react';
import { baselineEngineService } from '../../services/api';
import HierarchyBreadcrumb from '../../components/hierarchy/HierarchyBreadcrumb';
import { useToast } from '../../components/common/ToastNotification';

const CUSTOMER_LEVEL_ICONS = {
  national: <Globe size={16} />, chain: <Building2 size={16} />,
  region: <MapPin size={16} />, district: <MapPin size={16} />, store: <Store size={16} />
};
const PRODUCT_LEVEL_ICONS = {
  division: <Layers size={16} />, category: <Tag size={16} />,
  subcategory: <Tag size={16} />, brand: <Package size={16} />,
  sub_brand: <Package size={16} />, sku: <Package size={16} />
};

function HierarchyTree({ items, level = 0, type = 'customer', searchQuery = '', onNodeClick }) {
  const [expanded, setExpanded] = useState({});
  if (!items || items.length === 0) return <Typography variant="body2" color="text.secondary" sx={{ py: 2, pl: level * 3 }}>No items at this level</Typography>;
  const icons = type === 'customer' ? CUSTOMER_LEVEL_ICONS : PRODUCT_LEVEL_ICONS;
  const filteredItems = searchQuery
    ? items.filter(item => {
        const nameMatch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const codeMatch = (item.code || '').toLowerCase().includes(searchQuery.toLowerCase());
        const childMatch = item.children && item.children.some(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
        return nameMatch || codeMatch || childMatch;
      })
    : items;

  return (
    <List disablePadding>
      {filteredItems.map(item => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expanded[item.id || item.name] || !!searchQuery;
        const nodeLevel = item.level || (type === 'customer'
          ? ['national', 'chain', 'region', 'district', 'store'][level]
          : ['division', 'category', 'subcategory', 'brand', 'sub_brand', 'sku'][level]);
        return (
          <Box key={item.id || item.name}>
            <ListItemButton sx={{ pl: 2 + level * 3, py: 0.5 }} onClick={() => {
              if (hasChildren) setExpanded(prev => ({ ...prev, [item.id || item.name]: !prev[item.id || item.name] }));
              if (onNodeClick) onNodeClick(item);
            }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <Box sx={{ width: 16 }} />}
              </ListItemIcon>
              <ListItemIcon sx={{ minWidth: 28 }}>{icons[nodeLevel] || <FolderTree size={16} />}</ListItemIcon>
              <ListItemText
                primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography variant="body2" fontWeight={500}>{item.name || item.label}</Typography>{item.code && <Chip label={item.code} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />}</Box>}
                secondary={<Typography variant="caption" color="text.secondary">{nodeLevel}{item.child_count > 0 ? ` • ${item.child_count} children` : ''}</Typography>}
              />
              {item.status && <Chip label={item.status} size="small" color={item.status === 'active' ? 'success' : 'default'} sx={{ height: 20, fontSize: 11 }} />}
            </ListItemButton>
            {hasChildren && (
              <Collapse in={isExpanded}>
                <HierarchyTree items={item.children} level={level + 1} type={type} searchQuery={searchQuery} onNodeClick={onNodeClick} />
              </Collapse>
            )}
          </Box>
        );
      })}
    </List>
  );
}

const countNodes = (nodes) => {
  let count = 0;
  const traverse = (items) => { items.forEach(item => { count++; if (item.children) traverse(item.children); }); };
  traverse(nodes || []);
  return count;
};

export default function HierarchyManager() {
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [customerHierarchy, setCustomerHierarchy] = useState([]);
  const [productHierarchy, setProductHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [stats, setStats] = useState({ customer: {}, product: {} });

  const loadHierarchy = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [custRes, prodRes] = await Promise.allSettled([
        baselineEngineService.getHierarchyTree('customer'),
        baselineEngineService.getHierarchyTree('product'),
      ]);
      if (custRes.status === 'fulfilled') {
        const tree = custRes.value?.data?.tree || custRes.value?.data || [];
        const arr = Array.isArray(tree) ? tree : [tree];
        setCustomerHierarchy(arr);
        setStats(prev => ({ ...prev, customer: { totalNodes: countNodes(arr) } }));
      }
      if (prodRes.status === 'fulfilled') {
        const tree = prodRes.value?.data?.tree || prodRes.value?.data || [];
        const arr = Array.isArray(tree) ? tree : [tree];
        setProductHierarchy(arr);
        setStats(prev => ({ ...prev, product: { totalNodes: countNodes(arr) } }));
      }
    } catch (e) { console.error('Failed to load hierarchy:', e); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadHierarchy(); }, [loadHierarchy]);

  return (
    <Box>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); loadHierarchy(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1">Hierarchy Manager</Typography>
          <Typography variant="body2" color="text.secondary">Manage customer and product hierarchies with materialized paths for baseline scoping</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={loadHierarchy} disabled={loading}>Refresh</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}><Paper sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Customer Nodes</Typography><Typography variant="h5" fontWeight={700}>{stats.customer.totalNodes || 0}</Typography><Typography variant="caption" color="text.secondary">5 levels: National → Chain → Region → District → Store</Typography></Paper></Grid>
        <Grid item xs={12} md={3}><Paper sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Product Nodes</Typography><Typography variant="h5" fontWeight={700}>{stats.product.totalNodes || 0}</Typography><Typography variant="caption" color="text.secondary">6 levels: Division → Category → Subcategory → Brand → Sub-brand → SKU</Typography></Paper></Grid>
        <Grid item xs={12} md={3}><Paper sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Materialized Paths</Typography><Typography variant="h5" fontWeight={700}>Enabled</Typography><Typography variant="caption" color="text.secondary">Efficient ancestor/descendant queries</Typography></Paper></Grid>
        <Grid item xs={12} md={3}><Paper sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Baseline Scoping</Typography><Typography variant="h5" fontWeight={700}>Any Level</Typography><Typography variant="caption" color="text.secondary">Create baselines at any hierarchy intersection</Typography></Paper></Grid>
      </Grid>

      {selectedNode && (
        <Box sx={{ mb: 2 }}>
          <HierarchyBreadcrumb type={tab === 0 ? 'customer' : 'product'} currentLevel={selectedNode.level} currentName={selectedNode.name} />
        </Box>
      )}

      <Card>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, pt: 1 }}>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearchQuery(''); setSelectedNode(null); }}>
            <Tab label="Customer Hierarchy" /><Tab label="Product Hierarchy" />
          </Tabs>
          <Box sx={{ flex: 1 }} />
          <TextField size="small" placeholder="Search nodes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment>,
              endAdornment: searchQuery && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery('')}><X size={14} /></IconButton></InputAdornment>
            }} sx={{ width: 250 }} />
        </Box>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <>
              {tab === 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>National → Chain → Region → District → Store</Typography>
                  {customerHierarchy.length > 0 ? (
                    <HierarchyTree items={customerHierarchy} type="customer" searchQuery={searchQuery} onNodeClick={setSelectedNode} />
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}><FolderTree size={48} color="#94A3B8" style={{ marginBottom: 16 }} /><Typography variant="body2" color="text.secondary">No customer hierarchy defined yet. Import customers with hierarchy data to populate this tree.</Typography></Box>
                  )}
                </Box>
              )}
              {tab === 1 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Division → Category → Subcategory → Brand → Sub-brand → SKU</Typography>
                  {productHierarchy.length > 0 ? (
                    <HierarchyTree items={productHierarchy} type="product" searchQuery={searchQuery} onNodeClick={setSelectedNode} />
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}><FolderTree size={48} color="#94A3B8" style={{ marginBottom: 16 }} /><Typography variant="body2" color="text.secondary">No product hierarchy defined yet. Import products with hierarchy data to populate this tree.</Typography></Box>
                  )}
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
