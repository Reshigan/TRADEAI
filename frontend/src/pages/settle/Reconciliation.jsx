import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, LinearProgress } from '@mui/material';
import { Scale, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import api from '../../services/api';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function Reconciliation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/settlements/reconciliation');
        setData(res.data?.data || res.data || {});
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const runMatch = async () => {
    setLoading(true);
    try {
      await api.post('/deductions/auto-match');
      const res = await api.get('/settlements/reconciliation');
      setData(res.data?.data || res.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Reconciliation</Typography><Typography variant="body2" color="text.secondary">Match deductions to claims and settle accounts</Typography></Box>
        <Button variant="contained" onClick={runMatch} disabled={loading}>Run Auto-Match</Button>
      </Box>

      {loading ? <LinearProgress sx={{ mb: 2 }} /> : (
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card><CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Total Claims</Typography><DollarSign size={18} color="#2563EB" /></Box>
              <Typography variant="h2">{fmt(data?.total_claims)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card><CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Total Deductions</Typography><Scale size={18} color="#7C3AED" /></Box>
              <Typography variant="h2">{fmt(data?.total_deductions)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card><CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Matched</Typography><CheckCircle size={18} color="#059669" /></Box>
              <Typography variant="h2">{fmt(data?.matched_amount)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card><CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Unmatched</Typography><AlertTriangle size={18} color="#F59E0B" /></Box>
              <Typography variant="h2">{fmt(data?.unmatched_amount)}</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Reconciliation Summary</Typography>
          <Typography variant="body2" color="text.secondary">
            {data?.match_rate ? `Match rate: ${Number(data.match_rate).toFixed(1)}%` : 'Run auto-match to see reconciliation results'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
