import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, Alert} from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { baselineService } from '../../services/api';
import { useToast } from '../../components/common/ToastNotification';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function BaselineList() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const load = async () => {
    try { const res = await baselineService.getAll(); setItems(res.data || res || []); } catch (e) { console.error(e); toast.error('An error occurred'); setFetchError(e.message || 'Failed to load data'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const recalculate = async () => {
    setLoading(true);
    try { await baselineService.calculate(); load(); } catch (e) { console.error(e); setLoading(false); }
  };

  return (
    <Box>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { setFetchError(null); load(); }}>Retry</Button>}>
          {fetchError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Baselines</Typography><Typography variant="body2" color="text.secondary">Sales baseline calculations for promotion lift analysis</Typography></Box>
        <Button variant="contained" startIcon={<RefreshCw size={16} />} onClick={recalculate} disabled={loading}>Recalculate</Button>
      </Box>
      <Card>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Product</TableCell><TableCell>Customer</TableCell><TableCell align="right">Baseline Volume</TableCell><TableCell align="right">Baseline Revenue</TableCell><TableCell>Period</TableCell></TableRow></TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No baselines calculated yet</Typography></TableCell></TableRow>
                  ) : items.map(i => (
                    <TableRow key={i.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{i.product_name || i.productName || i.product_id || 'All'}</Typography></TableCell>
                      <TableCell>{i.customer_name || i.customerName || i.customer_id || 'All'}</TableCell>
                      <TableCell align="right">{Number(i.baseline_volume || i.total_base_volume || i.totalBaseVolume || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">{fmt(i.baseline_revenue || i.total_base_revenue || i.totalBaseRevenue)}</TableCell>
                      <TableCell>{i.period || i.granularity || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
