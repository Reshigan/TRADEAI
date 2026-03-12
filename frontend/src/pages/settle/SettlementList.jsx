import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress } from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { settlementService } from '../../services/api';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function SettlementList() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const res = await settlementService.getAll(); setSettlements(res.data || res || []); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setLoading(true);
    try { await settlementService.generate(); load(); } catch (e) { console.error(e); setLoading(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Settlements</Typography><Typography variant="body2" color="text.secondary">Generate and track settlement documents</Typography></Box>
        <Button variant="contained" startIcon={<RefreshCw size={16} />} onClick={generate} disabled={loading}>Generate Settlements</Button>
      </Box>
      <Card>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Settlement #</TableCell><TableCell>Customer</TableCell><TableCell align="right">Amount</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
                <TableBody>
                  {settlements.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No settlements generated yet</Typography></TableCell></TableRow>
                  ) : settlements.map(s => (
                    <TableRow key={s.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{s.settlement_number || s.id}</Typography></TableCell>
                      <TableCell>{s.customer_name || '-'}</TableCell>
                      <TableCell align="right">{fmt(s.net_amount || s.amount)}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(s.settlement_type || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell><Chip label={s.status || 'pending'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                      <TableCell>{s.created_at ? new Date(s.created_at).toLocaleDateString() : '-'}</TableCell>
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
