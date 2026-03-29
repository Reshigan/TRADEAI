import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, TextField, MenuItem, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Tabs, Tab } from '@mui/material';
import { Users, TrendingUp, DollarSign, BarChart } from 'lucide-react';
import { customerService } from '../../services/api';
import api from '../../services/api';
import { useToast } from '../../components/common/ToastNotification';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function Customer360() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const load = async () => {
      try { const res = await customerService.getAll(); setCustomers(res.data || res || []); } catch (e) { console.error('Failed to load customers:', e); toast.error('Failed to load customers'); }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/customer-360/profiles/${selected}`);
        const profileData = res.data?.data || res.data || {};
        // Also fetch promotions for this customer
        let promos = [];
        try {
          const promoRes = await api.get('/promotions', { params: { customer_id: selected } });
          promos = promoRes.data?.data || [];
        } catch (promoErr) { console.error('Failed to load promotions:', promoErr); toast.error('Failed to load promotions'); }
        // Also fetch trade spends for this customer
        let spends = [];
        try {
          const spendRes = await api.get('/trade-spends', { params: { customer_id: selected } });
          spends = spendRes.data?.data || [];
        } catch (spendErr) { console.error('Failed to load trade spends:', spendErr); toast.error('Failed to load trade spends'); }
        const totalSpend = spends.reduce((s, ts) => s + (Number(ts.amount) || 0), 0);
        setProfile({
          ...profileData,
          total_revenue: profileData.total_revenue || profileData.totalRevenue || 0,
          total_trade_spend: profileData.total_spend || profileData.totalSpend || totalSpend,
          avg_roi: profileData.avg_roi || profileData.avgRoi || 0,
          promotion_count: profileData.active_promotions || profileData.activePromotions || promos.length,
          promotions: promos.map(p => ({
            name: p.name || p.promotion_name,
            type: p.type || p.promotion_type,
            status: p.status,
            spend: p.planned_spend || p.actual_spend || 0,
            roi: p.roi || 0
          }))
        });
      } catch (e) { console.error(e); toast.error('An error occurred'); }
      setLoading(false);
    };
    load();
  }, [selected]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1">Customer 360</Typography>
        <Typography variant="body2" color="text.secondary">Complete customer trade promotion view</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField select fullWidth size="small" value={selected} onChange={(e) => setSelected(e.target.value)} label="Select Customer">
            <MenuItem value="">Select a customer</MenuItem>
            {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name || c.customer_name}</MenuItem>)}
          </TextField>
        </CardContent>
      </Card>

      {loading && selected && <LinearProgress sx={{ mb: 2 }} />}

      {profile && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}><Card><CardContent><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Total Revenue</Typography><DollarSign size={18} color="#2563EB" /></Box><Typography variant="h2">{fmt(profile.total_revenue)}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={3}><Card><CardContent><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Trade Spend</Typography><DollarSign size={18} color="#DC2626" /></Box><Typography variant="h2">{fmt(profile.total_trade_spend)}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={3}><Card><CardContent><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Avg ROI</Typography><TrendingUp size={18} color="#059669" /></Box><Typography variant="h2">{profile.avg_roi ? `${Number(profile.avg_roi).toFixed(1)}x` : '-'}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={3}><Card><CardContent><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Promotions</Typography><BarChart size={18} color="#7C3AED" /></Box><Typography variant="h2">{profile.promotion_count || 0}</Typography></CardContent></Card></Grid>
          </Grid>

          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
              <Tab label="Promotions" /><Tab label="Trade Spend" /><Tab label="Performance" />
            </Tabs>
            <CardContent>
              {tab === 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Promotion</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell align="right">Spend</TableCell><TableCell align="right">ROI</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(profile.promotions || []).length === 0 ? (
                        <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No promotions for this customer</Typography></TableCell></TableRow>
                      ) : profile.promotions.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{p.name || p.promotion_name}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{(p.type || '').replace(/_/g, ' ')}</TableCell>
                          <TableCell><Chip label={p.status || 'draft'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                          <TableCell align="right">{fmt(p.spend || p.planned_spend)}</TableCell>
                          <TableCell align="right">{p.roi ? `${Number(p.roi).toFixed(1)}x` : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {tab === 1 && <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>Trade spend breakdown by category and period</Typography>}
              {tab === 2 && <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>Historical promotion performance trends</Typography>}
            </CardContent>
          </Card>
        </>
      )}

      {!selected && !loading && (
        <Card><CardContent sx={{ py: 6, textAlign: 'center' }}>
          <Users size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
          <Typography variant="h3" sx={{ mb: 1 }}>Select a Customer</Typography>
          <Typography variant="body2" color="text.secondary">Choose a customer to view their complete 360-degree trade profile</Typography>
        </CardContent></Card>
      )}
    </Box>
  );
}
