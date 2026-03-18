import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, LinearProgress } from '@mui/material';
import { Plus, Search } from 'lucide-react';
import api from '../../services/api';
import { useTerminology } from '../../contexts/TerminologyContext';

export default function CampaignList() {
  const { t, tPlural } = useTerminology();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try { const res = await api.get('/campaigns'); setCampaigns(res.data?.data || res.data || []); } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = campaigns.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">{tPlural('campaign')}</Typography><Typography variant="body2" color="text.secondary">Multi-{t('promotion').toLowerCase()} {t('campaign').toLowerCase()} management</Typography></Box>
        <Button variant="contained" startIcon={<Plus size={16} />}>New {t('campaign')}</Button>
      </Box>
      <Card>
        <CardContent>
          <TextField placeholder="Search campaigns..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} /> }} sx={{ mb: 2, maxWidth: 360, width: '100%' }} />
          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Campaign Name</TableCell><TableCell>Promotions</TableCell><TableCell>Status</TableCell><TableCell align="right">Total Budget</TableCell><TableCell>Period</TableCell></TableRow></TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No campaigns found</Typography></TableCell></TableRow>
                  ) : filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{c.name}</Typography></TableCell>
                      <TableCell>{c.promotion_count || 0}</TableCell>
                      <TableCell><Chip label={c.status || 'active'} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                      <TableCell align="right">R {Number(c.total_budget || 0).toLocaleString()}</TableCell>
                      <TableCell>{c.start_date ? new Date(c.start_date).toLocaleDateString() : '-'}</TableCell>
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
