import React, { useState } from 'react';
import { Box, TextField, InputAdornment, Button, Typography, MenuItem, Select, FormControl, InputLabel, Grid, Chip } from '@mui/material';
import { Search, Plus, Download, Filter } from 'lucide-react';
import KPICard from '../shared/KPICard';
import EmptyState from '../shared/EmptyState';

export default function ListPage({ title, kpis = [], filters = [], data = [], columns = [], loading = false, onAdd, addLabel = 'Add New', onExport, onRowClick, searchPlaceholder = 'Search...', emptyTitle, emptyDescription, emptyActionLabel, renderCustomView, children }) {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});

  const filteredData = data.filter(row => {
    if (search) {
      const s = search.toLowerCase();
      const match = Object.values(row).some(v => String(v || '').toLowerCase().includes(s));
      if (!match) return false;
    }
    for (const f of filters) {
      if (filterValues[f.key] && filterValues[f.key] !== 'all') {
        if (row[f.key] !== filterValues[f.key]) return false;
      }
    }
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onExport && <Button variant="outlined" startIcon={<Download size={16} />} onClick={onExport}>Export</Button>}
          {onAdd && <Button variant="contained" startIcon={<Plus size={16} />} onClick={onAdd}>{addLabel}</Button>}
        </Box>
      </Box>

      {kpis.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {kpis.map((kpi, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <KPICard {...kpi} />
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder={searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} color="#94A3B8" /></InputAdornment> }}
          sx={{ minWidth: 280 }} />
        {filters.map(f => (
          <FormControl size="small" key={f.key} sx={{ minWidth: 140 }}>
            <InputLabel>{f.label}</InputLabel>
            <Select value={filterValues[f.key] || 'all'} label={f.label} onChange={e => setFilterValues(prev => ({ ...prev, [f.key]: e.target.value }))}>
              <MenuItem value="all">All</MenuItem>
              {(f.options || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
        ))}
      </Box>

      {renderCustomView ? renderCustomView(filteredData) : children ? children : (
        filteredData.length === 0 && !loading ? (
          <EmptyState title={emptyTitle || `No ${title.toLowerCase()} found`} description={emptyDescription} actionLabel={emptyActionLabel || addLabel} onAction={onAdd} />
        ) : (
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr" sx={{ bgcolor: '#F8FAFC' }}>
                  {columns.map(col => (
                    <Box component="th" key={col.key} sx={{ p: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9' }}>
                      {col.label}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {filteredData.map((row, ri) => (
                  <Box component="tr" key={row.id || ri} onClick={() => onRowClick && onRowClick(row)} sx={{ cursor: onRowClick ? 'pointer' : 'default', '&:hover': { bgcolor: '#F8FAFC' } }}>
                    {columns.map(col => (
                      <Box component="td" key={col.key} sx={{ p: '12px 16px', fontSize: '0.8125rem', borderBottom: '1px solid #F1F5F9', color: 'text.primary' }}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )
      )}
    </Box>
  );
}
