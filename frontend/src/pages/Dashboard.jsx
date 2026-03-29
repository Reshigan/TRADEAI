/**
 * Enhanced Professional Dashboard
 * Modern, professional UI with improved visual hierarchy and design
 */

import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, LinearProgress, Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Skeleton, IconButton, Tooltip, Avatar, Divider, Paper } from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Megaphone, 
  AlertTriangle, 
  CheckSquare, 
  ArrowRight, 
  Plus, 
  Calendar, 
  BarChart3, 
  Target,
  Clock,
  ChevronRight,
  MoreVertical,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyticsService, promotionService, budgetService, approvalService } from '../services/api';

const fmt = (v) => {
  if (v == null) return 'R 0';
  const n = Number(v);
  if (n >= 1e6) return `R ${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `R ${(n/1e3).toFixed(0)}K`;
  return `R ${n.toFixed(0)}`;
};

// Enhanced KPI Card Component with professional styling
function KPI({ icon: Icon, label, value, change, color = '#2563EB', loading, subtitle }) {
  if (loading) {
    return (
      <Card sx={{ height: '100%', transition: 'all 0.2s ease' }}>
        <CardContent sx={{ py: 3 }}>
          <Skeleton width={100} height={20} sx={{ mb: 2 }} />
          <Skeleton width={140} height={36} sx={{ mb: 1 }} />
          <Skeleton width={80} height={16} />
        </CardContent>
      </Card>
    );
  }
  
  const positive = change >= 0;
  const gradientMap = {
    '#2563EB': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    '#059669': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    '#7C3AED': 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    '#F59E0B': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  };

  return (
    <Card sx={{ 
      height: '100%', 
      transition: 'all 0.2s ease',
      '&:hover': { 
        transform: 'translateY(-2px)', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        borderColor: color + '40',
      }
    }}>
      <CardContent sx={{ py: 2.5, px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'block', mb: 0.5 }}>
              {label}
            </Typography>
            <Typography variant="h2" sx={{ mb: 0.5, fontSize: '1.875rem' }}>{value}</Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'text.tertiary', display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ 
            width: 48, 
            height: 48, 
            borderRadius: 3, 
            background: gradientMap[color] || color,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}>
            <Icon size={22} color="#fff" />
          </Box>
        </Box>
        {change != null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.25, 
              px: 1, 
              py: 0.5, 
              borderRadius: 1,
              bgcolor: positive ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
            }}>
              {positive ? <TrendingUp size={16} color="#059669" /> : <TrendingDown size={16} color="#DC2626" />}
              <Typography variant="caption" sx={{ color: positive ? '#059669' : '#DC2626', fontWeight: 700, fontSize: '0.8125rem' }}>
                {Math.abs(change)}%
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>vs last period</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced Section Header Component
function SectionHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {Icon && (
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: 2.5, 
            bgcolor: 'primary.50', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Icon size={20} color="#2563EB" />
          </Box>
        )}
        <Box>
          <Typography variant="h3" sx={{ fontSize: '1.125rem', fontWeight: 600 }}>{title}</Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {action}
    </Box>
  );
}

// Enhanced Quick Action Button
function QuickActionButton({ label, path, icon: Icon, color = '#2563EB' }) {
  const navigate = useNavigate();
  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={() => navigate(path)}
      startIcon={<Icon size={18} />}
      sx={{ 
        mb: 1, 
        justifyContent: 'flex-start', 
        py: 1.5,
        borderColor: 'divider', 
        color: color,
        fontWeight: 500,
        '&:hover': { 
          borderColor: color, 
          bgcolor: `${color}08`,
          transform: 'translateX(2px)',
        },
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </Button>
  );
}

// Enhanced status chip with better styling
const StatusChip = ({ status }) => {
  const statusConfig = {
    draft: { bg: '#F1F5F9', text: '#475569', label: 'Draft' },
    pending_approval: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
    pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
    approved: { bg: '#DBEAFE', text: '#1E40AF', label: 'Approved' },
    active: { bg: '#D1FAE5', text: '#065F46', label: 'Active' },
    completed: { bg: '#F3F4F6', text: '#374151', label: 'Completed' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
    rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
  };
  
  const config = statusConfig[status] || statusConfig.draft;
  
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        bgcolor: config.bg,
        color: config.text,
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 24,
        borderRadius: 1,
      }}
    />
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({});
  const [recentPromos, setRecentPromos] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [analytics, promos, budgets, approvals] = await Promise.allSettled([
          analyticsService.getDashboard(),
          promotionService.getAll({ limit: 5, sort: '-created_at' }),
          budgetService.getAll({ limit: 5 }),
          approvalService.getAll({ status: 'pending', limit: 5 }),
        ]);
        const a = analytics.status === 'fulfilled' ? (analytics.value.data || analytics.value) : {};
        setKpis({
          totalBudget: a.total_budget || a.totalBudget || 0,
          totalSpend: a.total_spend || a.totalSpend || 0,
          activePromos: a.active_promotions || a.activePromotions || 0,
          roi: a.avg_roi || a.averageRoi || 0,
          budgetUtil: a.budget_utilization || a.budgetUtilization || 0,
          pendingCount: a.pending_approvals || a.pendingApprovals || 0,
        });
        if (promos.status === 'fulfilled') setRecentPromos((promos.value.data || promos.value || []).slice(0, 5));
        if (approvals.status === 'fulfilled') setPendingApprovals((approvals.value.data || approvals.value || []).slice(0, 5));
      } catch (e) { console.error('Dashboard load error:', e); }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Enhanced Page Header */}
      <Box sx={{ mb: 4, pt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h1" sx={{ fontSize: '1.875rem', fontWeight: 700, mb: 0.5 }}>
              Welcome back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's what's happening with your trade promotions today
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="View Reports">
              <IconButton onClick={() => navigate('/advanced-reporting')} sx={{ bgcolor: 'background.paper', boxShadow: 'sm' }}>
                <BarChart3 size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Create New">
              <IconButton 
                sx={{ bgcolor: 'primary.main', color: 'white', boxShadow: 'md', '&:hover': { bgcolor: 'primary.dark' } }}
                onClick={() => navigate('/promotions/new')}
              >
                <Plus size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* KPI Grid - Enhanced Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KPI 
            icon={DollarSign} 
            label="Total Budget" 
            value={fmt(kpis.totalBudget)} 
            change={8.2} 
            color="#2563EB" 
            loading={loading}
            subtitle="Annual allocation"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPI 
            icon={Target} 
            label="Total Spend" 
            value={fmt(kpis.totalSpend)} 
            change={-3.1} 
            color="#059669" 
            loading={loading}
            subtitle="Year to date"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPI 
            icon={Megaphone} 
            label="Active Promotions" 
            value={String(kpis.activePromos || 0)} 
            change={12} 
            color="#7C3AED" 
            loading={loading}
            subtitle="Currently running"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPI 
            icon={TrendingUp} 
            label="Average ROI" 
            value={`${(kpis.roi || 0).toFixed(1)}x`} 
            change={5.4} 
            color="#F59E0B" 
            loading={loading}
            subtitle="Return on investment"
          />
        </Grid>
      </Grid>

      {/* Secondary Metrics Grid */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <SectionHeader 
                title="Budget Utilization" 
                subtitle="Track your spending progress"
                icon={BarChart3}
              />
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Progress</Typography>
                  <Typography variant="body2" fontWeight={600}>{(kpis.budgetUtil || 0).toFixed(1)}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={kpis.budgetUtil || 0} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    bgcolor: 'action.hover', 
                    '& .MuiLinearProgress-bar': { 
                      bgcolor: (kpis.budgetUtil || 0) > 90 ? '#DC2626' : 
                               (kpis.budgetUtil || 0) > 75 ? '#F59E0B' : '#2563EB',
                      borderRadius: 4,
                    } 
                  }} 
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Spent</Typography>
                  <Typography variant="h6" fontWeight={600}>{fmt(kpis.totalSpend)}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Available</Typography>
                  <Typography variant="h6" fontWeight={600}>{fmt((kpis.totalBudget || 0) - (kpis.totalSpend || 0))}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <SectionHeader 
                title="Pending Approvals" 
                subtitle={`${pendingApprovals.length} items awaiting review`}
                icon={Clock}
                action={
                  <Chip 
                    label={pendingApprovals.length} 
                    size="small" 
                    color={pendingApprovals.length > 0 ? 'warning' : 'default'}
                    sx={{ fontWeight: 700 }}
                  />
                }
              />
              {pendingApprovals.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <CheckSquare size={40} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
                  <Typography variant="body2" color="text.secondary">All caught up!</Typography>
                  <Typography variant="caption" color="text.tertiary">No pending approvals</Typography>
                </Box>
              ) : (
                <Box>
                  {pendingApprovals.slice(0, 3).map((a, i) => (
                    <Box 
                      key={i} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        py: 1.5, 
                        borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none',
                        '&:hover': { bgcolor: 'background.subtle' },
                        borderRadius: 1,
                        px: 1,
                        mx: -1,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {a.promotion_name || a.entity_type || 'Approval'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {a.requester_name || 'Unknown'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {fmt(a.amount)}
                      </Typography>
                    </Box>
                  ))}
                  <Button 
                    size="small" 
                    endIcon={<ArrowRight size={14} />} 
                    onClick={() => navigate('/approvals')}
                    fullWidth
                    sx={{ mt: 2, fontWeight: 600 }}
                  >
                    View All Approvals
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <SectionHeader 
                title="Quick Actions" 
                subtitle="Common tasks and shortcuts"
                icon={Activity}
              />
              <Box sx={{ mt: 2 }}>
                <QuickActionButton 
                  label="Create Promotion" 
                  path="/promotions/new" 
                  icon={Plus} 
                  color="#2563EB" 
                />
                <QuickActionButton 
                  label="Create Trade Spend" 
                  path="/trade-spends/new" 
                  icon={DollarSign} 
                  color="#059669" 
                />
                <QuickActionButton 
                  label="Submit Claim" 
                  path="/claims/create" 
                  icon={AlertTriangle} 
                  color="#7C3AED" 
                />
                <QuickActionButton 
                  label="View Reports" 
                  path="/reports" 
                  icon={BarChart3} 
                  color="#F59E0B" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Promotions Table */}
      <Card>
        <CardContent>
          <SectionHeader 
            title="Recent Promotions" 
            subtitle="Latest promotions created or updated"
            icon={Megaphone}
            action={
              <Button 
                size="small" 
                endIcon={<ArrowRight size={14} />} 
                onClick={() => navigate('/promotions')}
                sx={{ fontWeight: 600 }}
              >
                View All
              </Button>
            }
          />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Promotion Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Budget</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentPromos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ py: 6 }}>
                        <Megaphone size={48} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          No promotions yet
                        </Typography>
                        <Button 
                          variant="contained" 
                          onClick={() => navigate('/promotions/new')}
                          startIcon={<Plus size={16} />}
                        >
                          Create Your First Promotion
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentPromos.map((p, i) => (
                    <TableRow 
                      key={i} 
                      onClick={() => navigate(`/promotions/${p.id}`)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          bgcolor: 'background.subtle',
                          '& .action-buttons': { opacity: 1 },
                        },
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar 
                            sx={{ 
                              width: 40, 
                              height: 40, 
                              borderRadius: 2,
                              bgcolor: 'primary.50',
                              color: 'primary.main',
                              fontWeight: 600,
                            }}
                          >
                            {(p.name || p.promotion_name || 'P').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {p.name || p.promotion_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: #{p.id || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {(p.type || p.promotion_type || 'N/A').replace('_', ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={p.status || 'draft'} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {fmt(p.budget || p.planned_spend || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {p.start_date ? new Date(p.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box className="action-buttons" sx={{ opacity: 0, transition: 'opacity 0.2s ease' }}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/promotions/${p.id}`); }}>
                            <ChevronRight size={18} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Box mt={4} p={3} bgcolor="background.paper" borderRadius={2} border="1px solid" borderColor="divider">
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
          <strong>Pro Tip:</strong> Use the Quick Actions panel to quickly create new promotions, trade spends, or claims. 
          Monitor your budget utilization regularly to stay on track with your financial goals.
        </Typography>
      </Box>
    </Box>
  );
}
