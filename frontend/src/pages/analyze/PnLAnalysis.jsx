import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, TextField, MenuItem, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { PieChart, Download, RefreshCw } from 'lucide-react';
import { pnlService } from '../../services/api';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function PnLAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [groupBy, setGroupBy] = useState('customer');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await pnlService.calculate({ period, group_by: groupBy });
        setData(res.data || res);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [period, groupBy]);

  const summary = data?.summary || data || {};
  const items = data?.items || data?.breakdown || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">P&L Analysis</Typography><Typography variant="body2" color="text.secondary">Profit & Loss by customer, promotion, and product</Typography></Box>
        <Button variant="outlined" startIcon={<Download size={16} />}>Export</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField select size="small" value={period} onChange={(e) => setPeriod(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="monthly">Monthly</MenuItem><MenuItem value="quarterly">Quarterly</MenuItem><MenuItem value="annual">Annual</MenuItem>
        </TextField>
        <TextField select size="small" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="customer">By Customer</MenuItem><MenuItem value="promotion">By Promotion</MenuItem><MenuItem value="product">By Product</MenuItem>
        </TextField>
      </Box>

      {loading ? <LinearProgress sx={{ mb: 2 }} /> : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Gross Revenue</Typography><Typography variant="h2">{fmt(summary.gross_revenue || summary.total_revenue)}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Trade Spend</Typography><Typography variant="h2" sx={{ color: '#DC2626' }}>{fmt(summary.total_trade_spend || summary.trade_spend)}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Net Revenue</Typography><Typography variant="h2" sx={{ color: '#059669' }}>{fmt(summary.net_revenue)}</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Trade Spend %</Typography><Typography variant="h2">{summary.trade_spend_percentage ? `${Number(summary.trade_spend_percentage).toFixed(1)}%` : '-'}</Typography></CardContent></Card></Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>Breakdown by {groupBy}</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Name</TableCell><TableCell align="right">Revenue</TableCell><TableCell align="right">Trade Spend</TableCell><TableCell align="right">Net Revenue</TableCell><TableCell align="right">Margin %</TableCell></TableRow></TableHead>
                  <TableBody>
                    {(Array.isArray(items) ? items : []).length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No P&L data available</Typography></TableCell></TableRow>
                    ) : items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell><Typography variant="body2" fontWeight={500}>{item.name || item.customer_name || item.promotion_name || '-'}</Typography></TableCell>
                        <TableCell align="right">{fmt(item.revenue || item.gross_revenue)}</TableCell>
                        <TableCell align="right">{fmt(item.trade_spend)}</TableCell>
                        <TableCell align="right">{fmt(item.net_revenue)}</TableCell>
                        <TableCell align="right"><Chip label={`${Number(item.margin || item.margin_percentage || 0).toFixed(1)}%`} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
