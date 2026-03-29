import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button } from '@mui/material';
import { Wallet, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { kamWalletService } from '../../services/api';
import { useToast } from '../../components/common/ToastNotification';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function KAMWallet() {
  const toast = useToast();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllocate, setShowAllocate] = useState(false);
  const [form, setForm] = useState({ user_id: '', allocated_amount: '', period: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await kamWalletService.getAll();
        setWallets(res.data || res || []);
      } catch (e) { console.error(e); toast.error('An error occurred'); }
      setLoading(false);
    };
    load();
  }, []);

  const totalAllocated = wallets.reduce((sum, w) => sum + Number(w.allocated_amount || 0), 0);
  const totalSpent = wallets.reduce((sum, w) => sum + Number(w.spent_amount || 0), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">KAM Wallet</Typography><Typography variant="body2" color="text.secondary">Key Account Manager spend allocation and tracking</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowAllocate(true)}>Allocate Funds</Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Total Allocated</Typography>
              <Wallet size={18} color="#6366F1" />
            </Box>
            <Typography variant="h2">{fmt(totalAllocated)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Total Spent</Typography>
              <TrendingUp size={18} color="#059669" />
            </Box>
            <Typography variant="h2">{fmt(totalSpent)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Available</Typography>
              <AlertTriangle size={18} color="#F59E0B" />
            </Box>
            <Typography variant="h2">{fmt(totalAllocated - totalSpent)}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Wallet Allocations</Typography>
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>KAM</TableCell><TableCell>Period</TableCell><TableCell align="right">Allocated</TableCell><TableCell align="right">Spent</TableCell><TableCell>Utilization</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                <TableBody>
                  {wallets.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No wallets allocated</Typography></TableCell></TableRow>
                  ) : wallets.map(w => {
                    const util = Number(w.allocated_amount) > 0 ? (Number(w.spent_amount || 0) / Number(w.allocated_amount)) * 100 : 0;
                    return (
                      <TableRow key={w.id}>
                        <TableCell><Typography variant="body2" fontWeight={500}>{w.user_name || w.user_id}</Typography></TableCell>
                        <TableCell>{w.period || '-'}</TableCell>
                        <TableCell align="right">{fmt(w.allocated_amount)}</TableCell>
                        <TableCell align="right">{fmt(w.spent_amount)}</TableCell>
                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={Math.min(util, 100)} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: util > 90 ? '#DC2626' : '#6366F1' } }} />
                          <Typography variant="caption">{util.toFixed(0)}%</Typography>
                        </Box></TableCell>
                        <TableCell><Chip label={w.status || 'active'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
