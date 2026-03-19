import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert, Button,
  Divider
} from '@mui/material';
import {
  CompareArrows, TrendingUp, TrendingDown, Remove,
  AccountTree, Category
} from '@mui/icons-material';
import { baselineEngineService, hierarchyService } from '../../services/api';

const CUSTOMER_LEVELS = ['national', 'chain', 'region', 'district', 'store'];
const PRODUCT_LEVELS = ['division', 'category', 'subcategory', 'brand', 'sub_brand', 'sku'];

const HierarchyComparison = () => {
  const [hierarchyType, setHierarchyType] = useState('customer');
  const [levelA, setLevelA] = useState('');
  const [levelB, setLevelB] = useState('');
  const [nodeA, setNodeA] = useState('');
  const [nodeB, setNodeB] = useState('');
  const [nodesA, setNodesA] = useState([]);
  const [nodesB, setNodesB] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [error, setError] = useState(null);

  const levels = hierarchyType === 'customer' ? CUSTOMER_LEVELS : PRODUCT_LEVELS;

  useEffect(() => {
    loadTree();
  }, [hierarchyType]);

  useEffect(() => {
    if (levelA && treeData.length > 0) {
      setNodesA(treeData.filter(n => n.level === levelA));
      setNodeA('');
    }
  }, [levelA, treeData]);

  useEffect(() => {
    if (levelB && treeData.length > 0) {
      setNodesB(treeData.filter(n => n.level === levelB));
      setNodeB('');
    }
  }, [levelB, treeData]);

  const loadTree = async () => {
    try {
      const res = hierarchyType === 'customer'
        ? await hierarchyService.getCustomerTree()
        : await hierarchyService.getProductTree();
      setTreeData(res.data || []);
    } catch (e) {
      setTreeData([]);
    }
  };

  const handleCompare = async () => {
    if (!nodeA || !nodeB) return;
    setLoading(true);
    setError(null);
    try {
      const [resA, resB] = await Promise.all([
        baselineEngineService.resolve({
          [hierarchyType === 'customer' ? 'customerHierarchyId' : 'productHierarchyId']: nodeA
        }),
        baselineEngineService.resolve({
          [hierarchyType === 'customer' ? 'customerHierarchyId' : 'productHierarchyId']: nodeB
        })
      ]);

      const bA = resA.data?.baseline || {};
      const bB = resB.data?.baseline || {};

      const metrics = [
        { label: 'Total Base Volume', key: 'total_base_volume', format: 'number' },
        { label: 'Total Base Revenue', key: 'total_base_revenue', format: 'currency' },
        { label: 'Avg Weekly Volume', key: 'avg_weekly_volume', format: 'number' },
        { label: 'Avg Weekly Revenue', key: 'avg_weekly_revenue', format: 'currency' },
        { label: 'Seasonality Index', key: 'seasonality_index', format: 'decimal' },
        { label: 'Trend Coefficient', key: 'trend_coefficient', format: 'decimal' },
        { label: 'R-Squared', key: 'r_squared', format: 'decimal' },
        { label: 'MAPE', key: 'mape', format: 'percent' },
        { label: 'Confidence Level', key: 'confidence_level', format: 'percent' }
      ];

      setComparison({
        nodeA: { id: nodeA, name: nodesA.find(n => n.id === nodeA)?.name || nodeA, baseline: bA, source: resA.data?.source },
        nodeB: { id: nodeB, name: nodesB.find(n => n.id === nodeB)?.name || nodeB, baseline: bB, source: resB.data?.source },
        metrics
      });
    } catch (e) {
      setError('Failed to resolve baselines for comparison. Make sure baseline data exists.');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (val, format) => {
    if (val == null || val === undefined) return 'N/A';
    switch (format) {
      case 'currency': return `R ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      case 'percent': return `${(Number(val) * 100).toFixed(1)}%`;
      case 'decimal': return Number(val).toFixed(4);
      default: return Number(val).toLocaleString();
    }
  };

  const getVariance = (a, b) => {
    if (a == null || b == null || a === 0) return null;
    return ((b - a) / Math.abs(a)) * 100;
  };

  const VarianceChip = ({ variance }) => {
    if (variance == null) return <Chip label="N/A" size="small" />;
    const color = variance > 0 ? 'success' : variance < 0 ? 'error' : 'default';
    const icon = variance > 0 ? <TrendingUp fontSize="small" /> : variance < 0 ? <TrendingDown fontSize="small" /> : <Remove fontSize="small" />;
    return <Chip icon={icon} label={`${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`} color={color} size="small" variant="outlined" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CompareArrows /> Hierarchy Comparison
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={hierarchyType} onChange={(e) => { setHierarchyType(e.target.value); setLevelA(''); setLevelB(''); setComparison(null); }} label="Type">
                  <MenuItem value="customer"><AccountTree fontSize="small" sx={{ mr: 1 }} /> Customer</MenuItem>
                  <MenuItem value="product"><Category fontSize="small" sx={{ mr: 1 }} /> Product</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Level A</InputLabel>
                <Select value={levelA} onChange={(e) => setLevelA(e.target.value)} label="Level A">
                  {levels.map(l => <MenuItem key={l} value={l}>{l.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small" disabled={!levelA || nodesA.length === 0}>
                <InputLabel>Node A</InputLabel>
                <Select value={nodeA} onChange={(e) => setNodeA(e.target.value)} label="Node A">
                  {nodesA.map(n => <MenuItem key={n.id} value={n.id}>{n.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Level B</InputLabel>
                <Select value={levelB} onChange={(e) => setLevelB(e.target.value)} label="Level B">
                  {levels.map(l => <MenuItem key={l} value={l}>{l.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small" disabled={!levelB || nodesB.length === 0}>
                <InputLabel>Node B</InputLabel>
                <Select value={nodeB} onChange={(e) => setNodeB(e.target.value)} label="Node B">
                  {nodesB.map(n => <MenuItem key={n.id} value={n.id}>{n.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<CompareArrows />} onClick={handleCompare}
              disabled={!nodeA || !nodeB || loading}>
              {loading ? <CircularProgress size={20} /> : 'Compare Baselines'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {comparison && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {comparison.nodeA.name} vs {comparison.nodeB.name}
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <Chip label={`A: ${comparison.nodeA.source || 'none'}`} size="small" color="primary" variant="outlined" />
              <Chip label={`B: ${comparison.nodeB.source || 'none'}`} size="small" color="secondary" variant="outlined" />
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Metric</strong></TableCell>
                    <TableCell align="right"><strong>{comparison.nodeA.name}</strong></TableCell>
                    <TableCell align="right"><strong>{comparison.nodeB.name}</strong></TableCell>
                    <TableCell align="center"><strong>Variance</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparison.metrics.map(m => {
                    const valA = comparison.nodeA.baseline?.[m.key];
                    const valB = comparison.nodeB.baseline?.[m.key];
                    const variance = getVariance(valA, valB);
                    return (
                      <TableRow key={m.key}>
                        <TableCell>{m.label}</TableCell>
                        <TableCell align="right">{formatValue(valA, m.format)}</TableCell>
                        <TableCell align="right">{formatValue(valB, m.format)}</TableCell>
                        <TableCell align="center"><VarianceChip variance={variance} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default HierarchyComparison;
