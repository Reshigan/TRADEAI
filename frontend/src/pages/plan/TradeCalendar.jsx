import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Chip, Grid, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Calendar, List, Grid as GridIcon } from 'lucide-react';
import { promotionService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function TradeCalendar() {
  const navigate = useNavigate();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('timeline');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await promotionService.getAll({ limit: 100 });
        setPromos(res.data || res || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const statusColor = (s) => ({ draft: '#94A3B8', pending_approval: '#F59E0B', approved: '#2563EB', active: '#059669', completed: '#6B7280' }[s] || '#94A3B8');

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Trade Calendar</Typography><Typography variant="body2" color="text.secondary">Promotion timeline and conflict visualization</Typography></Box>
        <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
          <ToggleButton value="timeline"><Calendar size={16} /></ToggleButton>
          <ToggleButton value="list"><List size={16} /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button size="small" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>Prev</Button>
            <Typography variant="h3">{monthName}</Typography>
            <Button size="small" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>Next</Button>
          </Box>

          {view === 'timeline' ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0', mb: 1, minWidth: 800 }}>
                <Box sx={{ width: 200, flexShrink: 0, p: 1 }}><Typography variant="caption" fontWeight={600}>Promotion</Typography></Box>
                <Box sx={{ flex: 1, display: 'flex' }}>
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <Box key={i} sx={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>
                      <Typography variant="caption" color="text.secondary">{i + 1}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              {promos.filter(p => p.start_date).slice(0, 15).map(p => {
                const start = new Date(p.start_date);
                const end = p.end_date ? new Date(p.end_date) : new Date(start.getTime() + 7 * 24 * 3600 * 1000);
                const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                if (end < monthStart || start > monthEnd) return null;
                const startDay = Math.max(1, start.getDate());
                const endDay = Math.min(daysInMonth, end.getDate());
                const left = ((startDay - 1) / daysInMonth) * 100;
                const width = ((endDay - startDay + 1) / daysInMonth) * 100;
                return (
                  <Box key={p.id} sx={{ display: 'flex', minHeight: 36, alignItems: 'center', minWidth: 800, '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <Box sx={{ width: 200, flexShrink: 0, px: 1 }}>
                      <Typography variant="body2" fontWeight={500} noWrap sx={{ cursor: 'pointer' }} onClick={() => navigate(`/execute/promotions/${p.id}`)}>{p.name || p.promotion_name}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, position: 'relative', height: 28 }}>
                      <Box sx={{ position: 'absolute', left: `${left}%`, width: `${Math.max(width, 2)}%`, height: 22, top: 3, bgcolor: statusColor(p.status), borderRadius: 1, opacity: 0.8 }} />
                    </Box>
                  </Box>
                );
              })}
              {promos.filter(p => p.start_date).length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No promotions with dates found</Typography>
              )}
            </Box>
          ) : (
            <Box>
              {promos.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No promotions found</Typography>
              ) : promos.map(p => (
                <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #F1F5F9', cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' } }} onClick={() => navigate(`/execute/promotions/${p.id}`)}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{p.name || p.promotion_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.start_date ? new Date(p.start_date).toLocaleDateString() : 'No dates'} - {p.end_date ? new Date(p.end_date).toLocaleDateString() : 'TBD'}</Typography>
                  </Box>
                  <Chip label={p.status || 'draft'} size="small" sx={{ bgcolor: `${statusColor(p.status)}15`, color: statusColor(p.status), textTransform: 'capitalize' }} />
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
