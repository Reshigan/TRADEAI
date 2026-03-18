import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress } from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { accrualService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function AccrualList() {
  const { t, tPlural } = useTerminology();
  const [accruals, setAccruals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await accrualService.getAll();
      setAccruals(res.data || res || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runCalculation = async () => {
    setLoading(true);
    try { await accrualService.calculate(); load(); } catch (e) { console.error(e); setLoading(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">{tPlural('accrual')}</Typography><Typography variant="body2" color="text.secondary">{t('promotion')} {t('accrual').toLowerCase()} calculations and tracking</Typography></Box>
        <Button variant="contained" startIcon={<RefreshCw size={16} />} onClick={runCalculation} disabled={loading}>Recalculate</Button>
      </Box>
      <Card>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Promotion</TableCell><TableCell>Period</TableCell><TableCell align="right">Accrued Amount</TableCell><TableCell align="right">Actual Spend</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                <TableBody>
                  {accruals.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No accruals calculated yet</Typography></TableCell></TableRow>
                  ) : accruals.map(a => (
                    <TableRow key={a.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{a.promotion_name || a.promotion_id}</Typography></TableCell>
                      <TableCell>{a.period || a.accrual_date || '-'}</TableCell>
                      <TableCell align="right">{fmt(a.accrued_amount || a.amount)}</TableCell>
                      <TableCell align="right">{fmt(a.actual_amount)}</TableCell>
                      <TableCell><Chip label={a.status || 'calculated'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
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
