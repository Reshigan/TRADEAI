import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, MenuItem, Grid, Paper, Chip,
  CircularProgress, InputAdornment, alpha,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Campaign as CampaignIcon,
  PlayCircle as ActiveIcon, AttachMoney as BudgetIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { formatLabel } from '../../utils/formatters';

const CampaignList = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  useEffect(() => { fetchCampaigns(); }, [filters]);

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      const response = await api.get(`/campaigns?${params}`);
      if (response.data.success) setCampaigns(response.data.data);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  const formatDate = (date) => new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  const getStatusColor = (status) => ({ active: 'success', planned: 'primary', completed: 'default', paused: 'warning', draft: 'default', approved: 'info', cancelled: 'error' })[status] || 'default';

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((s, c) => s + (c.budgetAmount || c.budget || 0), 0),
  }), [campaigns]);

  const summaryCards = [
    { label: 'Total Campaigns', value: stats.total, icon: <CampaignIcon />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'Active', value: stats.active, icon: <ActiveIcon />, color: '#059669', bg: alpha('#059669', 0.08) },
    { label: 'Total Budget', value: formatCurrency(stats.totalBudget), icon: <BudgetIcon />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
  ];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress sx={{ color: '#7C3AED' }} /></Box>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Campaigns</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/campaigns/new')}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3, py: 1.2, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
          New Campaign
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
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

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField fullWidth placeholder="Search campaigns..." value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }} />
        <TextField select label="Status" value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }}>
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="planned">Planned</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="paused">Paused</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </TextField>
      </Paper>

      {campaigns.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, borderRadius: '16px', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <CampaignIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" mb={2}>No campaigns found</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/campaigns/new')}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Create Campaign
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {campaigns.map(campaign => (
            <Grid item xs={12} sm={6} lg={4} key={campaign.id || campaign._id}>
              <Paper elevation={0}
                sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                  transition: 'all 0.2s', height: '100%', display: 'flex', flexDirection: 'column',
                  '&:hover': { boxShadow: '0 4px 20px rgba(124,58,237,0.12)', borderColor: '#7C3AED', transform: 'translateY(-2px)' } }}
                onClick={() => navigate(`/campaigns/${campaign.id || campaign._id}`)}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1.5} sx={{ flex: 1, mr: 1 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha('#D97706', 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CampaignIcon sx={{ color: '#D97706', fontSize: 20 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700}>{campaign.name}</Typography>
                  </Box>
                  <Chip label={formatLabel(campaign.status)} color={getStatusColor(campaign.status)} size="small" sx={{ fontWeight: 600, borderRadius: '6px', height: 24 }} />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2} sx={{ flex: 1 }}>{campaign.description}</Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">Objective</Typography>
                    <Typography variant="caption" fontWeight={600}>{campaign.campaignType ? formatLabel(campaign.campaignType) : '-'}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">Budget</Typography>
                    <Typography variant="caption" fontWeight={600}>{formatCurrency(campaign.budgetAmount || campaign.budget)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="caption" color="text.secondary">Duration</Typography>
                    <Typography variant="caption" fontWeight={600}>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</Typography>
                  </Box>
                  {campaign.promotions && campaign.promotions.length > 0 && (
                    <Box sx={{ p: 1.5, bgcolor: alpha('#7C3AED', 0.06), borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" fontWeight={600} color="#7C3AED">Promotions</Typography>
                      <Chip label={campaign.promotions.length} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: alpha('#7C3AED', 0.12), color: '#7C3AED' }} />
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default CampaignList;
