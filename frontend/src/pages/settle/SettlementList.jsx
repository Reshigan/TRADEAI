import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress, IconButton, Tooltip } from '@mui/material';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { settlementService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function SettlementList() {
  const { t, tPlural } = useTerminology();
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
        <Box><Typography variant="h1">{tPlural('settlement')}</Typography><Typography variant="body2" color="text.secondary">Generate and track {t('settlement').toLowerCase()} documents</Typography></Box>
        <Button variant="contained" startIcon={<RefreshCw size={16} />} onClick={generate} disabled={loading}>Generate {tPlural('settlement')}</Button>
      </Box>
      <Card>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>{t('settlement')} #</TableCell><TableCell>{t('customer')}</TableCell><TableCell align="right">Amount</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {settlements.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No {tPlural('settlement').toLowerCase()} generated yet</Typography></TableCell></TableRow>
                  ) : settlements.map(s => (
                    <TableRow key={s.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{s.settlement_number || s.id}</Typography></TableCell>
                      <TableCell>{s.customer_name || '-'}</TableCell>
                      <TableCell align="right">{fmt(s.net_amount || s.amount)}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(s.settlement_type || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell><Chip label={s.status || 'pending'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                      <TableCell>{s.created_at ? new Date(s.created_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell align="right" onClick={e => e.stopPropagation()}>
                        {(s.status === 'pending' || s.status === 'pending_approval') && (
                          <>
                            <Tooltip title="Approve"><IconButton size="small" color="success" onClick={async () => { try { await settlementService.approve(s.id); load(); } catch(e) { console.error(e); } }}><CheckCircle size={16} /></IconButton></Tooltip>
                            <Tooltip title="Reject"><IconButton size="small" color="error" onClick={async () => { try { await settlementService.reject(s.id); load(); } catch(e) { console.error(e); } }}><XCircle size={16} /></IconButton></Tooltip>
                          </>
                        )}
                      </TableCell>
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
