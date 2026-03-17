import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Grid, LinearProgress,
} from '@mui/material';
import { DollarSign, Megaphone, LayoutGrid, TrendingUp } from 'lucide-react';
import api, { promotionService, tradeCalendarService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (v) => {
  const n = parseFloat(v) || 0;
  if (n >= 1e6) return `R${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `R${(n / 1e3).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

const statusColor = (s) => ({
  draft: '#94A3B8', pending_approval: '#F59E0B', approved: '#2563EB',
  active: '#059669', completed: '#6B7280', planned: '#3B82F6', cancelled: '#EF4444',
}[s] || '#94A3B8');

const typeColor = (t) => ({
  promotion: '#059669', campaign: '#7C3AED', marketing: '#2563EB',
  trade_spend: '#F59E0B', product_launch: '#EC4899', pricing: '#14B8A6',
  digital: '#8B5CF6', event: '#F97316',
}[t] || '#6B7280');

function GanttRow({ item, currentMonth, daysInMonth, label, color, onClick }) {
  const start = new Date(item.start_date || item.startDate);
  const end = item.end_date || item.endDate ? new Date(item.end_date || item.endDate) : new Date(start.getTime() + 7 * 86400000);
  const mStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const mEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  if (end < mStart || start > mEnd) return null;
  const sDay = Math.max(1, start.getMonth() === currentMonth.getMonth() ? start.getDate() : 1);
  const eDay = Math.min(daysInMonth, end.getMonth() === currentMonth.getMonth() ? end.getDate() : daysInMonth);
  const left = ((sDay - 1) / daysInMonth) * 100;
  const width = ((eDay - sDay + 1) / daysInMonth) * 100;
  return (
    <Box sx={{ display: 'flex', minHeight: 36, alignItems: 'center', minWidth: 800, '&:hover': { bgcolor: '#F8FAFC' } }}>
      <Box sx={{ width: 220, flexShrink: 0, px: 1 }}>
        <Typography variant="body2" fontWeight={500} noWrap sx={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>{label}</Typography>
      </Box>
      <Box sx={{ flex: 1, position: 'relative', height: 28 }}>
        <Box sx={{ position: 'absolute', left: `${left}%`, width: `${Math.max(width, 2)}%`, height: 22, top: 3, bgcolor: color, borderRadius: 1, opacity: 0.85 }} />
      </Box>
    </Box>
  );
}

function MonthNav({ currentMonth, setCurrentMonth, monthName, daysInMonth }) {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button size="small" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>Prev</Button>
        <Typography variant="h6" fontWeight={700}>{monthName}</Typography>
        <Button size="small" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>Next</Button>
      </Box>
      <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0', mb: 1, minWidth: 800 }}>
        <Box sx={{ width: 220, flexShrink: 0, p: 1 }}><Typography variant="caption" fontWeight={600}>Name</Typography></Box>
        <Box sx={{ flex: 1, display: 'flex' }}>
          {Array.from({ length: daysInMonth }, (_, i) => (
            <Box key={i} sx={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>
              <Typography variant="caption" color="text.secondary">{i + 1}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}

function SummaryCard({ title, value, subtitle, color = '#1E40AF' }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mt: 0.5 }}>{value}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function TradeCalendar() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [promos, setPromos] = useState([]);
  const [tradeSpends, setTradeSpends] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [activityGrid, setActivityGrid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [promoRes, spendRes, calRes, gridRes] = await Promise.all([
          promotionService.getAll({ limit: 100 }).catch(() => ({ data: [] })),
          api.get('/trade-spends?limit=100').catch(() => ({ data: { data: [] } })),
          tradeCalendarService.getAll().catch(() => ({ data: [] })),
          api.get('/activity-grid?limit=100').catch(() => ({ data: { data: [] } })),
        ]);
        setPromos(promoRes.data || promoRes || []);
        const spendData = spendRes.data?.data || spendRes.data || [];
        setTradeSpends(Array.isArray(spendData) ? spendData : []);
        setCalendarEvents(calRes.data || []);
        const gridData = gridRes.data?.data || gridRes.data || [];
        setActivityGrid(Array.isArray(gridData) ? gridData : []);
      } catch (e) { console.error('Calendar load error:', e); }
      setLoading(false);
    };
    load();
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const tabLabels = [
    { label: 'Trade Spend', icon: <DollarSign size={16} /> },
    { label: 'Marketing Activity', icon: <TrendingUp size={16} /> },
    { label: 'Promotions', icon: <Megaphone size={16} /> },
    { label: 'Activity Grid', icon: <LayoutGrid size={16} /> },
  ];

  // Filter marketing events from calendar_events
  const marketingEvents = calendarEvents.filter(e =>
    ['campaign', 'marketing', 'event', 'task'].includes(e.event_type || e.eventType)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Trade Calendar</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            Unified view of trade spend, marketing, promotions, and activities
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={() => navigate('/trade-calendar')}
          sx={{ borderColor: '#E5E7EB', color: '#374151' }}>
          Advanced Calendar
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <SummaryCard title="Trade Spends" value={tradeSpends.length} subtitle={`Total: ${formatCurrency(tradeSpends.reduce((s, ts) => s + (ts.amount || 0), 0))}`} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard title="Marketing Events" value={marketingEvents.length} subtitle="Campaigns & activities" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard title="Promotions" value={promos.length} subtitle={`${promos.filter(p => p.status === 'active').length} active`} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard title="Activity Grid" value={activityGrid.length} subtitle={`${activityGrid.filter(a => a.status === 'active').length} active`} />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            {tabLabels.map((t, i) => (
              <Tab key={i} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{t.icon}{t.label}</Box>} />
            ))}
          </Tabs>
        </Box>

        <CardContent>
          <MonthNav currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} monthName={monthName} daysInMonth={daysInMonth} />

          {/* Tab 0: Trade Spend Calendar */}
          {activeTab === 0 && (
            <Box sx={{ overflowX: 'auto' }}>
              {tradeSpends.filter(ts => ts.start_date || ts.period_start).length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No trade spends with dates found</Typography>
              ) : tradeSpends.filter(ts => ts.start_date || ts.period_start).map(ts => (
                <GanttRow
                  key={ts.id}
                  item={{ start_date: ts.start_date || ts.period_start, end_date: ts.end_date || ts.period_end }}
                  currentMonth={currentMonth}
                  daysInMonth={daysInMonth}
                  label={ts.description || ts.notes || ts.spend_type || `Trade Spend ${(ts.id || '').slice(-6)}`}
                  color={statusColor(ts.status)}
                  onClick={() => navigate(`/execute/trade-spends`)}
                />
              ))}
              <Box sx={{ mt: 2 }}>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tradeSpends.slice(0, 10).map(ts => (
                        <TableRow key={ts.id} hover>
                          <TableCell>{ts.description || ts.notes || '-'}</TableCell>
                          <TableCell><Chip label={ts.spend_type || ts.category || '-'} size="small" /></TableCell>
                          <TableCell>{formatCurrency(ts.amount)}</TableCell>
                          <TableCell>{formatDate(ts.start_date || ts.period_start)}</TableCell>
                          <TableCell><Chip label={ts.status || 'draft'} size="small" sx={{ bgcolor: `${statusColor(ts.status)}15`, color: statusColor(ts.status), textTransform: 'capitalize' }} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}

          {/* Tab 1: Marketing Activity Calendar */}
          {activeTab === 1 && (
            <Box sx={{ overflowX: 'auto' }}>
              {marketingEvents.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No marketing activities found</Typography>
              ) : marketingEvents.map(ev => (
                <GanttRow
                  key={ev.id}
                  item={{ start_date: ev.start_date, end_date: ev.end_date }}
                  currentMonth={currentMonth}
                  daysInMonth={daysInMonth}
                  label={ev.name || ev.title || ev.description || 'Event'}
                  color={typeColor(ev.event_type || ev.eventType)}
                />
              ))}
              <Box sx={{ mt: 2 }}>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Start</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>End</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Budget</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {marketingEvents.slice(0, 10).map(ev => (
                        <TableRow key={ev.id} hover>
                          <TableCell>{ev.name || ev.title || '-'}</TableCell>
                          <TableCell><Chip label={ev.event_type || ev.eventType || '-'} size="small" sx={{ bgcolor: `${typeColor(ev.event_type || ev.eventType)}15`, color: typeColor(ev.event_type || ev.eventType), textTransform: 'capitalize' }} /></TableCell>
                          <TableCell>{ev.customer_name || ev.customerName || '-'}</TableCell>
                          <TableCell>{formatDate(ev.start_date)}</TableCell>
                          <TableCell>{formatDate(ev.end_date)}</TableCell>
                          <TableCell>{ev.planned_spend || ev.budget ? formatCurrency(ev.planned_spend || ev.budget) : '-'}</TableCell>
                          <TableCell><Chip label={ev.status || 'planned'} size="small" sx={{ bgcolor: `${statusColor(ev.status)}15`, color: statusColor(ev.status), textTransform: 'capitalize' }} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}

          {/* Tab 2: Promotions Calendar */}
          {activeTab === 2 && (
            <Box sx={{ overflowX: 'auto' }}>
              {promos.filter(p => p.start_date).length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No promotions with dates found</Typography>
              ) : promos.filter(p => p.start_date).slice(0, 20).map(p => (
                <GanttRow
                  key={p.id}
                  item={{ start_date: p.start_date, end_date: p.end_date }}
                  currentMonth={currentMonth}
                  daysInMonth={daysInMonth}
                  label={p.name || p.promotion_name || 'Promotion'}
                  color={statusColor(p.status)}
                  onClick={() => navigate(`/execute/promotions/${p.id}`)}
                />
              ))}
              <Box sx={{ mt: 2 }}>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Promotion</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Start</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>End</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {promos.slice(0, 10).map(p => (
                        <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/execute/promotions/${p.id}`)}>
                          <TableCell>{p.name || p.promotion_name || '-'}</TableCell>
                          <TableCell><Chip label={p.promotion_type || '-'} size="small" /></TableCell>
                          <TableCell>{formatDate(p.start_date)}</TableCell>
                          <TableCell>{formatDate(p.end_date)}</TableCell>
                          <TableCell><Chip label={p.status || 'draft'} size="small" sx={{ bgcolor: `${statusColor(p.status)}15`, color: statusColor(p.status), textTransform: 'capitalize' }} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}

          {/* Tab 3: Activity Grid */}
          {activeTab === 3 && (
            <Box sx={{ overflowX: 'auto' }}>
              {activityGrid.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No activity grid items found</Typography>
              ) : activityGrid.filter(a => a.start_date).map(a => (
                <GanttRow
                  key={a.id}
                  item={{ start_date: a.start_date, end_date: a.end_date }}
                  currentMonth={currentMonth}
                  daysInMonth={daysInMonth}
                  label={a.activity_name || a.name || 'Activity'}
                  color={typeColor(a.activity_type || a.type)}
                />
              ))}
              <Box sx={{ mt: 2 }}>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Activity</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Start</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>End</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Budget</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Spent</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Performance</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activityGrid.slice(0, 15).map(a => (
                        <TableRow key={a.id} hover>
                          <TableCell>{a.activity_name || a.name || '-'}</TableCell>
                          <TableCell><Chip label={a.activity_type || a.type || '-'} size="small" sx={{ bgcolor: `${typeColor(a.activity_type || a.type)}15`, color: typeColor(a.activity_type || a.type), textTransform: 'capitalize' }} /></TableCell>
                          <TableCell>{formatDate(a.start_date)}</TableCell>
                          <TableCell>{formatDate(a.end_date)}</TableCell>
                          <TableCell>{formatCurrency(a.budget_allocated)}</TableCell>
                          <TableCell>{formatCurrency(a.budget_spent)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={Math.min(100, a.performance || 0)} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: (a.performance || 0) >= 80 ? '#059669' : (a.performance || 0) >= 50 ? '#F59E0B' : '#EF4444' } }} />
                              <Typography variant="caption" fontWeight={600}>{(a.performance || 0).toFixed(0)}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Chip label={a.status || 'planned'} size="small" sx={{ bgcolor: `${statusColor(a.status)}15`, color: statusColor(a.status), textTransform: 'capitalize' }} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
