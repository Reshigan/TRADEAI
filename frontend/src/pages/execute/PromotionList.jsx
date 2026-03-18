import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress, IconButton, MenuItem } from '@mui/material';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { promotionService } from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };
const statusColor = (s) => ({ draft: '#94A3B8', pending_approval: '#F59E0B', approved: '#2563EB', active: '#059669', completed: '#6B7280', cancelled: '#DC2626', rejected: '#DC2626' }[s] || '#94A3B8');

export default function PromotionList() {
  const navigate = useNavigate();
  const { t, tPlural } = useTerminology();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await promotionService.getAll(params);
      setPromos(res.data || res || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = promos.filter(p => (p.name || p.promotion_name || '').toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promotion?')) return;
    try { await promotionService.delete(id); load(); } catch (e) { console.error(e); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">{tPlural('promotion')}</Typography><Typography variant="body2" color="text.secondary">Manage {tPlural('promotion').toLowerCase()}</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => navigate('/execute/promotions/new')}>New {t('promotion')}</Button>
      </Box>

      <Card>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField placeholder="Search promotions..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ flex: 1, minWidth: 200, maxWidth: 360 }} />
            <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending_approval">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Box>
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Customer</TableCell><TableCell>Status</TableCell><TableCell align="right">Budget</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No promotions found</Typography></TableCell></TableRow>
                  ) : filtered.map(p => (
                    <TableRow key={p.id} onClick={() => navigate(`/execute/promotions/${p.id}`)} sx={{ cursor: 'pointer' }}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{p.name || p.promotion_name}</Typography></TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(p.type || p.promotion_type || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell>{p.customer_name || '-'}</TableCell>
                      <TableCell><Chip label={(p.status || 'draft').replace(/_/g, ' ')} size="small" sx={{ bgcolor: `${statusColor(p.status)}15`, color: statusColor(p.status), fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                      <TableCell align="right">{fmt(p.planned_spend || p.budget)}</TableCell>
                      <TableCell>{p.start_date ? new Date(p.start_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{p.end_date ? new Date(p.end_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small" onClick={() => navigate(`/execute/promotions/${p.id}`)}><Eye size={16} /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></IconButton>
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
