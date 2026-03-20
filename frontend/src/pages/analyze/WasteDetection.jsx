import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, LinearProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert } from '@mui/material';
import { AlertTriangle, RefreshCw, TrendingDown, DollarSign } from 'lucide-react';
import api from '../../services/api';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function WasteDetection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  const load = async () => {
    try {
      const res = await api.get('/ai/waste-detection');
      setData(res.data?.data || res.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/waste-detection/analyze');
      setData(res.data?.data || res.data || {});
      const pCount = (res.data?.data?.patterns || res.data?.data?.waste_patterns || []).length;
      setFeedback({ open: true, message: pCount > 0 ? `Analysis complete: ${pCount} waste pattern${pCount !== 1 ? 's' : ''} detected` : 'Analysis complete: no waste patterns detected', severity: 'success' });
    } catch (e) {
      console.error(e);
      setFeedback({ open: true, message: 'Analysis failed: ' + (e.response?.data?.message || e.message), severity: 'error' });
    }
    setLoading(false);
  };

  const patterns = data?.patterns || data?.waste_patterns || [];
  const totalWaste = data?.total_waste || patterns.reduce((sum, p) => sum + Number(p.waste_amount || 0), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Waste Detection</Typography><Typography variant="body2" color="text.secondary">AI-powered identification of money-losing promotion patterns</Typography></Box>
        <Button variant="contained" startIcon={<RefreshCw size={16} />} onClick={runAnalysis} disabled={loading}>Run Analysis</Button>
      </Box>

      {loading ? <LinearProgress sx={{ mb: 2 }} /> : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Total Waste Identified</Typography>
                  <DollarSign size={18} color="#DC2626" />
                </Box>
                <Typography variant="h2" sx={{ color: '#DC2626' }}>{fmt(totalWaste)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Patterns Found</Typography>
                  <AlertTriangle size={18} color="#F59E0B" />
                </Box>
                <Typography variant="h2">{patterns.length}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Potential Savings</Typography>
                  <TrendingDown size={18} color="#059669" />
                </Box>
                <Typography variant="h2" sx={{ color: '#059669' }}>{fmt(data?.potential_savings || totalWaste * 0.6)}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>Waste Patterns</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Pattern</TableCell><TableCell>Severity</TableCell><TableCell align="right">Waste Amount</TableCell><TableCell>Recommendation</TableCell></TableRow></TableHead>
                  <TableBody>
                    {patterns.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No waste patterns detected. Run analysis to scan promotions.</Typography></TableCell></TableRow>
                    ) : patterns.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell><Typography variant="body2" fontWeight={500}>{p.pattern_name || p.description}</Typography></TableCell>
                        <TableCell><Chip label={p.severity || 'medium'} size="small" color={p.severity === 'high' ? 'error' : p.severity === 'medium' ? 'warning' : 'info'} /></TableCell>
                        <TableCell align="right">{fmt(p.waste_amount)}</TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{p.recommendation || '-'}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
      <Snackbar open={feedback.open} autoHideDuration={5000} onClose={() => setFeedback(f => ({ ...f, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setFeedback(f => ({ ...f, open: false }))} severity={feedback.severity} variant="filled">{feedback.message}</Alert>
      </Snackbar>
    </Box>
  );
}
