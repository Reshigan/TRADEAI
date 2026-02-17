import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, MenuItem, Grid, Paper, Chip,
  CircularProgress, InputAdornment, LinearProgress, alpha, Tabs, Tab,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, TrendingUp as TrendingUpIcon,
  Campaign as CampaignIcon, CheckCircle as ActiveIcon, Schedule as PlannedIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { formatLabel } from '../../utils/formatters';

const PromotionList = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: 'all', type: 'all' });
  const [statusTab, setStatusTab] = useState(0);

  useEffect(() => { fetchPromotions(); }, [filters]);

  const fetchPromotions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.type !== 'all') params.append('promotionType', filters.type);
      if (filters.search) params.append('search', filters.search);
      const response = await api.get(`/promotions?${params}`);
      if (response.data.success) setPromotions(response.data.data);
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  const formatDate = (date) => new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  const getStatusColor = (status) => ({ 'Active': 'success', 'Planned': 'primary', 'Completed': 'default', 'Cancelled': 'error' })[status] || 'default';

  const stats = useMemo(() => ({
    active: promotions.filter(p => p.status === 'Active').length,
    planned: promotions.filter(p => p.status === 'Planned').length,
    totalBudget: promotions.reduce((sum, p) => sum + (p.budget || 0), 0),
  }), [promotions]);

  const statusTabs = ['All', 'Active', 'Planned', 'Completed', 'Cancelled'];
  const filteredByTab = useMemo(() => {
    if (statusTab === 0) return promotions;
    return promotions.filter(p => p.status === statusTabs[statusTab]);
  }, [promotions, statusTab]);

  if (loading) {
    return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress sx={{ color: '#7C3AED' }} /></Box>);
  }

  const statCards = [
    { label: 'Total Promotions', value: promotions.length, icon: <CampaignIcon />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'Active', value: stats.active, icon: <ActiveIcon />, color: '#059669', bg: alpha('#059669', 0.08) },
    { label: 'Planned', value: stats.planned, icon: <PlannedIcon />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
    { label: 'Total Budget', value: formatCurrency(stats.totalBudget), icon: <TrendingUpIcon />, color: '#D97706', bg: alpha('#D97706', 0.08) },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Promotions</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {promotions.length} promotion{promotions.length !== 1 ? 's' : ''} across all channels
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/promotions/new')}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3, py: 1.2, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
          New Promotion
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: 22 } })}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs value={statusTab} onChange={(_, v) => setStatusTab(v)}
            sx={{ px: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48, fontSize: '0.875rem' }, '& .Mui-selected': { color: '#7C3AED' }, '& .MuiTabs-indicator': { bgcolor: '#7C3AED' } }}>
            {statusTabs.map((t) => <Tab key={t} label={t} />)}
          </Tabs>
        </Box>
        <Box sx={{ p: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField placeholder="Search promotions..." value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }} />
          <TextField select value={filters.type} onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))} size="small"
            sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }}>
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="Trade Promotion">Trade Promotion</MenuItem>
            <MenuItem value="Consumer Promotion">Consumer Promotion</MenuItem>
            <MenuItem value="Volume Discount">Volume Discount</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {filteredByTab.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, borderRadius: '16px', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <CampaignIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>No promotions found</Typography>
          <Typography variant="body2" color="text.disabled" mb={3}>Try adjusting your filters or create a new promotion.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/promotions/new')}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Create Promotion
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredByTab.map(promo => {
            const spent = promo.actualSpend || promo.spentAmount || 0;
            const budget = promo.budget || 0;
            const utilPct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            return (
              <Grid item xs={12} sm={6} lg={4} key={promo.id || promo._id}>
                <Paper elevation={0}
                  sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                    transition: 'all 0.2s ease', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    '&:hover': { boxShadow: '0 4px 20px rgba(124,58,237,0.12)', borderColor: '#7C3AED', transform: 'translateY(-2px)' } }}
                  onClick={() => navigate(`/promotions/${promo.id || promo._id}`)}>
                  <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1.5}>
                      <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ flex: 1, mr: 1, lineHeight: 1.3 }}>{promo.promotionName}</Typography>
                      <Chip label={formatLabel(promo.status)} color={getStatusColor(promo.status)} size="small" sx={{ fontWeight: 600, borderRadius: '8px', height: 26 }} />
                    </Box>
                    {promo.description && (
                      <Typography variant="body2" color="text.secondary" mb={2}
                        sx={{ flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{promo.description}</Typography>
                    )}
                    <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Type</Typography>
                        <Chip label={formatLabel(promo.promotionType)} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', borderRadius: '6px' }} />
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Budget</Typography>
                        <Typography variant="caption" fontWeight={700}>{formatCurrency(promo.budget)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Duration</Typography>
                        <Typography variant="caption" fontWeight={500}>{formatDate(promo.startDate)} - {formatDate(promo.endDate)}</Typography>
                      </Box>
                      {budget > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" color="text.secondary">Spend</Typography>
                            <Typography variant="caption" fontWeight={600}>{utilPct.toFixed(0)}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={utilPct}
                            sx={{ height: 6, borderRadius: 3, bgcolor: alpha('#7C3AED', 0.08),
                              '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: utilPct > 90 ? '#DC2626' : utilPct > 70 ? '#D97706' : '#7C3AED' } }} />
                        </Box>
                      )}
                    </Box>
                  </Box>
                  {promo.expectedROI && (
                    <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha('#059669', 0.06), borderTop: '1px solid', borderColor: alpha('#059669', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <TrendingUpIcon sx={{ fontSize: 16, color: '#059669' }} />
                        <Typography variant="caption" fontWeight={600} color="#059669">Expected ROI</Typography>
                      </Box>
                      <Typography variant="caption" fontWeight={700} color="#059669">{promo.expectedROI}x</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default PromotionList;
