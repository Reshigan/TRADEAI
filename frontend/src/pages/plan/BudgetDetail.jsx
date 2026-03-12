import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, Button, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { budgetService, promotionService } from '../../services/api';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function BudgetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);
  const [promos, setPromos] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [b, p] = await Promise.allSettled([budgetService.getById(id), promotionService.getAll({ budget_id: id })]);
        if (b.status === 'fulfilled') setBudget(b.value.data || b.value);
        if (p.status === 'fulfilled') setPromos(p.value.data || p.value || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <Box sx={{ py: 4 }}><LinearProgress /></Box>;
  if (!budget) return <Box sx={{ py: 4 }}><Typography>Budget not found</Typography><Button onClick={() => navigate('/plan/budgets')}>Back</Button></Box>;

  const spent = Number(budget.spent_amount || budget.committed_amount || 0);
  const total = Number(budget.total_amount || 0);
  const util = total > 0 ? (spent / total) * 100 : 0;
  const available = total - spent;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/plan/budgets')} sx={{ color: 'text.secondary' }}>Back</Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1">{budget.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip label={budget.status || 'draft'} size="small" sx={{ textTransform: 'capitalize' }} />
            <Chip label={`FY ${budget.fiscal_year}`} size="small" variant="outlined" />
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Total Budget</Typography>
            <Typography variant="h2">{fmt(total)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Spent / Committed</Typography>
            <Typography variant="h2" sx={{ color: '#DC2626' }}>{fmt(spent)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Available</Typography>
            <Typography variant="h2" sx={{ color: '#059669' }}>{fmt(available)}</Typography>
            <LinearProgress variant="determinate" value={Math.min(util, 100)} sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: '#F1F5F9' }} />
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
          <Tab label="Linked Promotions" /><Tab label="Allocations" /><Tab label="History" />
        </Tabs>
        <CardContent>
          {tab === 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Promotion</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell align="right">Amount</TableCell><TableCell>Period</TableCell></TableRow></TableHead>
                <TableBody>
                  {promos.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No promotions linked</Typography></TableCell></TableRow>
                  ) : promos.map(p => (
                    <TableRow key={p.id} onClick={() => navigate(`/execute/promotions/${p.id}`)} sx={{ cursor: 'pointer' }}>
                      <TableCell>{p.name || p.promotion_name}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(p.type || p.promotion_type || '').replace('_', ' ')}</TableCell>
                      <TableCell><Chip label={p.status || 'draft'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                      <TableCell align="right">{fmt(p.planned_spend || p.budget)}</TableCell>
                      <TableCell>{p.start_date ? new Date(p.start_date).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {tab === 1 && <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>Budget allocation breakdown coming from backend allocations API</Typography>}
          {tab === 2 && <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>Budget history and audit trail</Typography>}
        </CardContent>
      </Card>
    </Box>
  );
}
