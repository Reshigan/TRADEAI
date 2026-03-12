import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Tabs, Tab, LinearProgress, List, ListItemButton, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import { ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import api from '../../services/api';

function HierarchyTree({ items, level = 0 }) {
  const [expanded, setExpanded] = useState({});
  if (!items || items.length === 0) return <Typography variant="body2" color="text.secondary" sx={{ py: 2, pl: level * 3 }}>No items</Typography>;
  return (
    <List disablePadding>
      {items.map(item => (
        <Box key={item.id || item.name}>
          <ListItemButton sx={{ pl: 2 + level * 3, py: 0.5 }} onClick={() => setExpanded(prev => ({ ...prev, [item.id || item.name]: !prev[item.id || item.name] }))}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              {item.children?.length > 0 ? (expanded[item.id || item.name] ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <Box sx={{ width: 16 }} />}
            </ListItemIcon>
            <ListItemText primary={item.name || item.label} primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} secondary={item.code || item.type} />
          </ListItemButton>
          {item.children?.length > 0 && (
            <Collapse in={expanded[item.id || item.name]}>
              <HierarchyTree items={item.children} level={level + 1} />
            </Collapse>
          )}
        </Box>
      ))}
    </List>
  );
}

export default function HierarchyManager() {
  const [tab, setTab] = useState(0);
  const [customerHierarchy, setCustomerHierarchy] = useState([]);
  const [productHierarchy, setProductHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ch, ph] = await Promise.allSettled([
          api.get('/hierarchy/customer'),
          api.get('/hierarchy/product'),
        ]);
        if (ch.status === 'fulfilled') setCustomerHierarchy(ch.value.data?.data || ch.value.data || []);
        if (ph.status === 'fulfilled') setProductHierarchy(ph.value.data?.data || ph.value.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1">Hierarchy Manager</Typography>
        <Typography variant="body2" color="text.secondary">Manage customer and product hierarchies for budget scoping</Typography>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid #E2E8F0' }}>
          <Tab label="Customer Hierarchy" /><Tab label="Product Hierarchy" />
        </Tabs>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <>
              {tab === 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    National &rarr; Region &rarr; District &rarr; Store &rarr; Customer
                  </Typography>
                  {customerHierarchy.length > 0 ? (
                    <HierarchyTree items={customerHierarchy} />
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <FolderTree size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
                      <Typography variant="body2" color="text.secondary">No customer hierarchy defined yet</Typography>
                    </Box>
                  )}
                </Box>
              )}
              {tab === 1 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    All &rarr; Category &rarr; Subcategory &rarr; Brand &rarr; SKU
                  </Typography>
                  {productHierarchy.length > 0 ? (
                    <HierarchyTree items={productHierarchy} />
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <FolderTree size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
                      <Typography variant="body2" color="text.secondary">No product hierarchy defined yet</Typography>
                    </Box>
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
