import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Plus } from 'lucide-react';
import { scenarioService } from '../../services/api';

export default function Scenarios() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', base_promotion_id: '', discount_change: 0, duration_change: 0 });

  useEffect(() => {
    const load = async () => {
      try { const res = await scenarioService.getAll(); setScenarios(res.data || res || []); } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const handleCreate = async () => {
    try { await scenarioService.create(form); setShowCreate(false);
      const res = await scenarioService.getAll(); setScenarios(res.data || res || []);
    } catch (e) { console.error(e); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Scenario Planning</Typography><Typography variant="body2" color="text.secondary">What-if analysis for trade promotion strategies</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Scenario</Button>
      </Box>
      <Card>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Scenario</TableCell><TableCell>Description</TableCell><TableCell>Status</TableCell><TableCell align="right">Predicted ROI</TableCell><TableCell align="right">Predicted Lift</TableCell></TableRow></TableHead>
                <TableBody>
                  {scenarios.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No scenarios created yet</Typography></TableCell></TableRow>
                  ) : scenarios.map(s => (
                    <TableRow key={s.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{s.name}</Typography></TableCell>
                      <TableCell>{s.description || '-'}</TableCell>
                      <TableCell><Chip label={s.status || 'draft'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                      <TableCell align="right">{s.predicted_roi ? `${Number(s.predicted_roi).toFixed(1)}x` : '-'}</TableCell>
                      <TableCell align="right">{s.predicted_lift ? `${Number(s.predicted_lift).toFixed(1)}%` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Scenario</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Scenario Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Discount Change %" type="number" value={form.discount_change} onChange={(e) => setForm({ ...form, discount_change: Number(e.target.value) })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Duration Change (days)" type="number" value={form.duration_change} onChange={(e) => setForm({ ...form, duration_change: Number(e.target.value) })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowCreate(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate}>Create</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
