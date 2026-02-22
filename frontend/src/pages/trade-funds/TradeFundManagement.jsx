import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, Snackbar, Tooltip,
  LinearProgress, Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ArrowDownward as DrawdownIcon,
  ArrowUpward as TopupIcon,
  SwapHoriz as TransferIcon,
  FastForward as CarryoverIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingDown as SpentIcon,
  Savings as RemainingIcon,
  Rule as RuleIcon,
  Receipt as TxnIcon,
} from '@mui/icons-material';
import { tradeFundService, budgetService, customerService } from '../../services/api';

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  if (Math.abs(num) >= 1000000) return `R${(num / 1000000).toFixed(1)}M`;
  if (Math.abs(num) >= 1000) return `R${(num / 1000).toFixed(0)}K`;
  return `R${num.toFixed(0)}`;
};

const formatPct = (value) => `${(parseFloat(value) || 0).toFixed(1)}%`;

const SummaryCard = ({ title, value, subtitle, icon, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mt: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}15` }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const statusColor = (status) => {
  if (status === 'active') return { bg: '#D1FAE5', text: '#059669' };
  if (status === 'frozen') return { bg: '#DBEAFE', text: '#2563EB' };
  if (status === 'closed') return { bg: '#F3F4F6', text: '#6B7280' };
  if (status === 'depleted') return { bg: '#FEE2E2', text: '#DC2626' };
  if (status === 'expired') return { bg: '#FEF3C7', text: '#D97706' };
  return { bg: '#F3F4F6', text: '#6B7280' };
};

const txnTypeColor = (type) => {
  if (type === 'drawdown') return { bg: '#FEE2E2', text: '#DC2626' };
  if (type === 'topup' || type === 'initial_funding') return { bg: '#D1FAE5', text: '#059669' };
  if (type === 'transfer_in') return { bg: '#DBEAFE', text: '#2563EB' };
  if (type === 'transfer_out') return { bg: '#FEF3C7', text: '#D97706' };
  if (type === 'carryover_in' || type === 'carryover_out') return { bg: '#EDE9FE', text: '#7C3AED' };
  return { bg: '#F3F4F6', text: '#6B7280' };
};

const FUND_TYPES = [
  { value: 'trade_promotion', label: 'Trade Promotion' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'rebate', label: 'Rebate' },
  { value: 'discretionary', label: 'Discretionary' },
  { value: 'co_op', label: 'Co-Op' },
  { value: 'shopper_marketing', label: 'Shopper Marketing' },
];

const CARRYOVER_POLICIES = [
  { value: 'forfeit', label: 'Forfeit (Lose Remaining)' },
  { value: 'full', label: 'Full Carryover' },
  { value: 'percentage', label: 'Percentage Cap' },
  { value: 'manual', label: 'Manual Approval' },
];

const EMPTY_FUND = {
  fundName: '', fundCode: '', fundType: 'trade_promotion',
  parentFundId: '', budgetId: '', fiscalYear: new Date().getFullYear(),
  currency: 'ZAR', originalAmount: 0,
  ownerId: '', ownerName: '', region: '', channel: '',
  customerId: '', customerName: '', productCategory: '',
  effectiveDate: '', expiryDate: '',
  carryoverPolicy: 'forfeit', maxCarryoverPct: 0, notes: '',
};

const TradeFundManagement = () => {
  const [tab, setTab] = useState(0);
  const [funds, setFunds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fundOptions, setFundOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const [fundDialog, setFundDialog] = useState(false);
  const [fundForm, setFundForm] = useState(EMPTY_FUND);
  const [editingId, setEditingId] = useState(null);

  const [detailDialog, setDetailDialog] = useState(false);
  const [detailFund, setDetailFund] = useState(null);
  const [detailTransactions, setDetailTransactions] = useState([]);
  const [detailRules, setDetailRules] = useState([]);
  const [detailTab, setDetailTab] = useState(0);

  const [opDialog, setOpDialog] = useState(false);
  const [opType, setOpType] = useState('drawdown');
  const [opForm, setOpForm] = useState({ amount: 0, description: '', fundId: '', toFundId: '' });
  const [opFund, setOpFund] = useState(null);

  const [ruleDialog, setRuleDialog] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    ruleName: '', ruleType: 'validation', conditionField: '', conditionOperator: 'equals',
    conditionValue: '', actionType: 'approve', actionValue: '', priority: 1, description: '',
  });
  const [editingRuleId, setEditingRuleId] = useState(null);

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const fetchFunds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tradeFundService.getAll();
      setFunds(res.data || []);
    } catch (e) {
      showSnack(e.message || 'Failed to load funds', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await tradeFundService.getSummary();
      setSummary(res.data || {});
    } catch { /* ignore */ }
  }, []);

  const fetchRefData = useCallback(async () => {
    try {
      const [budgetRes, custRes, optRes] = await Promise.allSettled([
        budgetService.getAll({ limit: 200 }),
        customerService.getAll({ limit: 200 }),
        tradeFundService.getOptions(),
      ]);
      if (budgetRes.status === 'fulfilled') setBudgets(budgetRes.value?.data || []);
      if (custRes.status === 'fulfilled') setCustomers(custRes.value?.data || []);
      if (optRes.status === 'fulfilled') setFundOptions(optRes.value?.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchFunds();
    fetchSummary();
    fetchRefData();
  }, [fetchFunds, fetchSummary, fetchRefData]);

  const handleCreate = () => {
    setEditingId(null);
    setFundForm(EMPTY_FUND);
    setFundDialog(true);
  };

  const handleEdit = (fund) => {
    setEditingId(fund.id);
    setFundForm({
      fundName: fund.fundName || fund.fund_name || '',
      fundCode: fund.fundCode || fund.fund_code || '',
      fundType: fund.fundType || fund.fund_type || 'trade_promotion',
      parentFundId: fund.parentFundId || fund.parent_fund_id || '',
      budgetId: fund.budgetId || fund.budget_id || '',
      fiscalYear: fund.fiscalYear || fund.fiscal_year || new Date().getFullYear(),
      currency: fund.currency || 'ZAR',
      originalAmount: parseFloat(fund.originalAmount || fund.original_amount) || 0,
      ownerId: fund.ownerId || fund.owner_id || '',
      ownerName: fund.ownerName || fund.owner_name || '',
      region: fund.region || '',
      channel: fund.channel || '',
      customerId: fund.customerId || fund.customer_id || '',
      customerName: fund.customerName || fund.customer_name || '',
      productCategory: fund.productCategory || fund.product_category || '',
      effectiveDate: fund.effectiveDate || fund.effective_date || '',
      expiryDate: fund.expiryDate || fund.expiry_date || '',
      carryoverPolicy: fund.carryoverPolicy || fund.carryover_policy || 'forfeit',
      maxCarryoverPct: parseFloat(fund.maxCarryoverPct || fund.max_carryover_pct) || 0,
      notes: fund.notes || '',
    });
    setFundDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await tradeFundService.update(editingId, fundForm);
        showSnack('Fund updated');
      } else {
        await tradeFundService.create(fundForm);
        showSnack('Fund created');
      }
      setFundDialog(false);
      fetchFunds();
      fetchSummary();
      fetchRefData();
    } catch (e) {
      showSnack(e.response?.data?.message || e.message || 'Save failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fund? This cannot be undone.')) return;
    try {
      await tradeFundService.delete(id);
      showSnack('Fund deleted');
      fetchFunds();
      fetchSummary();
    } catch (e) {
      showSnack(e.response?.data?.message || e.message || 'Delete failed', 'error');
    }
  };

  const handleViewDetail = async (fund) => {
    setDetailFund(fund);
    setDetailTab(0);
    setDetailDialog(true);
    try {
      const [txnRes, ruleRes] = await Promise.allSettled([
        tradeFundService.getTransactions(fund.id),
        tradeFundService.getRules(fund.id),
      ]);
      if (txnRes.status === 'fulfilled') setDetailTransactions(txnRes.value?.data || []);
      if (ruleRes.status === 'fulfilled') setDetailRules(ruleRes.value?.data || []);
    } catch { /* ignore */ }
  };

  const openOperation = (type, fund) => {
    setOpType(type);
    setOpFund(fund);
    setOpForm({ amount: 0, description: '', fundId: fund.id, toFundId: '' });
    setOpDialog(true);
  };

  const handleOperation = async () => {
    try {
      const amt = parseFloat(opForm.amount);
      if (!amt || amt <= 0) { showSnack('Enter a valid amount', 'error'); return; }
      if (opType === 'drawdown') {
        await tradeFundService.drawdown(opFund.id, { amount: amt, description: opForm.description });
        showSnack('Drawdown processed');
      } else if (opType === 'topup') {
        await tradeFundService.topup(opFund.id, { amount: amt, description: opForm.description });
        showSnack('Top-up processed');
      } else if (opType === 'transfer') {
        if (!opForm.toFundId) { showSnack('Select destination fund', 'error'); return; }
        await tradeFundService.transfer({ fromFundId: opFund.id, toFundId: opForm.toFundId, amount: amt, description: opForm.description });
        showSnack('Transfer processed');
      } else if (opType === 'carryover') {
        await tradeFundService.carryover(opFund.id, { carryoverAmount: amt, carryoverPolicy: 'manual' });
        showSnack('Carryover processed');
      }
      setOpDialog(false);
      fetchFunds();
      fetchSummary();
      fetchRefData();
    } catch (e) {
      showSnack(e.response?.data?.message || e.message || 'Operation failed', 'error');
    }
  };

  const openRuleDialog = (fund, rule = null) => {
    setOpFund(fund);
    if (rule) {
      setEditingRuleId(rule.id);
      setRuleForm({
        ruleName: rule.ruleName || rule.rule_name || '',
        ruleType: rule.ruleType || rule.rule_type || 'validation',
        conditionField: rule.conditionField || rule.condition_field || '',
        conditionOperator: rule.conditionOperator || rule.condition_operator || 'equals',
        conditionValue: rule.conditionValue || rule.condition_value || '',
        actionType: rule.actionType || rule.action_type || 'approve',
        actionValue: rule.actionValue || rule.action_value || '',
        priority: rule.priority || 1,
        description: rule.description || '',
      });
    } else {
      setEditingRuleId(null);
      setRuleForm({
        ruleName: '', ruleType: 'validation', conditionField: '', conditionOperator: 'equals',
        conditionValue: '', actionType: 'approve', actionValue: '', priority: 1, description: '',
      });
    }
    setRuleDialog(true);
  };

  const handleSaveRule = async () => {
    try {
      if (editingRuleId) {
        await tradeFundService.updateRule(editingRuleId, ruleForm);
        showSnack('Rule updated');
      } else {
        await tradeFundService.createRule(opFund.id, ruleForm);
        showSnack('Rule created');
      }
      setRuleDialog(false);
      if (detailFund) {
        const ruleRes = await tradeFundService.getRules(detailFund.id);
        setDetailRules(ruleRes.data || []);
      }
    } catch (e) {
      showSnack(e.response?.data?.message || e.message || 'Rule save failed', 'error');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await tradeFundService.deleteRule(ruleId);
      showSnack('Rule deleted');
      if (detailFund) {
        const ruleRes = await tradeFundService.getRules(detailFund.id);
        setDetailRules(ruleRes.data || []);
      }
    } catch (e) {
      showSnack(e.response?.data?.message || e.message || 'Delete failed', 'error');
    }
  };

  const handleCustomerSelect = (custId) => {
    const cust = customers.find(c => c.id === custId);
    setFundForm(prev => ({ ...prev, customerId: custId, customerName: cust?.name || '' }));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
            Trade Fund Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            Manage fund pools, drawdowns, transfers, carryovers and rules
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { fetchFunds(); fetchSummary(); }} size="small">
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, borderRadius: 2 }}>
            New Fund
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <SummaryCard title="Total Funds" value={summary.totalFunds || 0} subtitle={`${summary.activeFunds || 0} active`} icon={<WalletIcon />} color="#7C3AED" />
          </Grid>
          <Grid item xs={6} md={3}>
            <SummaryCard title="Original Budget" value={formatCurrency(summary.totalOriginal)} subtitle="Across all funds" icon={<WalletIcon />} color="#2563EB" />
          </Grid>
          <Grid item xs={6} md={3}>
            <SummaryCard title="Drawn / Spent" value={formatCurrency(summary.totalDrawn)} subtitle={`${formatPct(summary.utilizationPct)} utilized`} icon={<SpentIcon />} color="#DC2626" />
          </Grid>
          <Grid item xs={6} md={3}>
            <SummaryCard title="Remaining" value={formatCurrency(summary.totalRemaining)} subtitle={`${formatCurrency(summary.totalCommitted)} committed`} icon={<RemainingIcon />} color="#059669" />
          </Grid>
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' } }}>
        <Tab label="All Funds" />
        <Tab label="Active" />
        <Tab label="Closed / Expired" />
      </Tabs>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F9FAFB' }}>
              <TableCell sx={{ fontWeight: 600 }}>Fund Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Year</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Original</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Drawn</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Remaining</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Utilization</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(funds || [])
              .filter(f => {
                const st = f.status;
                if (tab === 1) return st === 'active';
                if (tab === 2) return st === 'closed' || st === 'expired' || st === 'depleted';
                return true;
              })
              .map((f) => {
                const orig = parseFloat(f.originalAmount || f.original_amount) || 0;
                const drawn = parseFloat(f.drawnAmount || f.drawn_amount) || 0;
                const remaining = parseFloat(f.remainingAmount || f.remaining_amount) || 0;
                const util = orig > 0 ? ((drawn / orig) * 100) : 0;
                const sc = statusColor(f.status);
                return (
                  <TableRow key={f.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewDetail(f)}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.fundName || f.fund_name}</Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{f.fundCode || f.fund_code}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={f.fundType || f.fund_type || '-'} size="small" sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 500 }} />
                    </TableCell>
                    <TableCell>{f.fiscalYear || f.fiscal_year}</TableCell>
                    <TableCell align="right">{formatCurrency(orig)}</TableCell>
                    <TableCell align="right" sx={{ color: '#DC2626' }}>{formatCurrency(drawn)}</TableCell>
                    <TableCell align="right" sx={{ color: '#059669' }}>{formatCurrency(remaining)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={Math.min(util, 100)} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: util > 90 ? '#DC2626' : util > 70 ? '#D97706' : '#7C3AED' } }} />
                        <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'right' }}>{util.toFixed(0)}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={f.status} size="small" sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 500, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell align="center" onClick={e => e.stopPropagation()}>
                      <Tooltip title="Drawdown"><IconButton size="small" onClick={() => openOperation('drawdown', f)}><DrawdownIcon fontSize="small" sx={{ color: '#DC2626' }} /></IconButton></Tooltip>
                      <Tooltip title="Top Up"><IconButton size="small" onClick={() => openOperation('topup', f)}><TopupIcon fontSize="small" sx={{ color: '#059669' }} /></IconButton></Tooltip>
                      <Tooltip title="Transfer"><IconButton size="small" onClick={() => openOperation('transfer', f)}><TransferIcon fontSize="small" sx={{ color: '#2563EB' }} /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(f)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(f.id)}><DeleteIcon fontSize="small" sx={{ color: '#DC2626' }} /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            {funds.length === 0 && !loading && (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No trade funds found. Create your first fund to get started.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Fund Dialog */}
      <Dialog open={fundDialog} onClose={() => setFundDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? 'Edit Fund' : 'Create New Fund'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Fund Name" value={fundForm.fundName} onChange={e => setFundForm(p => ({ ...p, fundName: e.target.value }))} required />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Fund Code" value={fundForm.fundCode} onChange={e => setFundForm(p => ({ ...p, fundCode: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Fund Type" value={fundForm.fundType} onChange={e => setFundForm(p => ({ ...p, fundType: e.target.value }))}>
                {FUND_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Original Amount (ZAR)" type="number" value={fundForm.originalAmount} onChange={e => setFundForm(p => ({ ...p, originalAmount: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Fiscal Year" type="number" value={fundForm.fiscalYear} onChange={e => setFundForm(p => ({ ...p, fiscalYear: parseInt(e.target.value) || new Date().getFullYear() }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Parent Fund" value={fundForm.parentFundId} onChange={e => setFundForm(p => ({ ...p, parentFundId: e.target.value }))}>
                <MenuItem value="">None</MenuItem>
                {fundOptions.map(fo => <MenuItem key={fo.id} value={fo.id}>{fo.name} ({fo.code})</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Budget" value={fundForm.budgetId} onChange={e => setFundForm(p => ({ ...p, budgetId: e.target.value }))}>
                <MenuItem value="">None</MenuItem>
                {budgets.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Customer" value={fundForm.customerId} onChange={e => handleCustomerSelect(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Region" value={fundForm.region} onChange={e => setFundForm(p => ({ ...p, region: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Channel" value={fundForm.channel} onChange={e => setFundForm(p => ({ ...p, channel: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Product Category" value={fundForm.productCategory} onChange={e => setFundForm(p => ({ ...p, productCategory: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Owner Name" value={fundForm.ownerName} onChange={e => setFundForm(p => ({ ...p, ownerName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Effective Date" type="date" InputLabelProps={{ shrink: true }} value={fundForm.effectiveDate} onChange={e => setFundForm(p => ({ ...p, effectiveDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Expiry Date" type="date" InputLabelProps={{ shrink: true }} value={fundForm.expiryDate} onChange={e => setFundForm(p => ({ ...p, expiryDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Carryover Policy" value={fundForm.carryoverPolicy} onChange={e => setFundForm(p => ({ ...p, carryoverPolicy: e.target.value }))}>
                {CARRYOVER_POLICIES.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </TextField>
            </Grid>
            {fundForm.carryoverPolicy === 'percentage' && (
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Max Carryover %" type="number" value={fundForm.maxCarryoverPct} onChange={e => setFundForm(p => ({ ...p, maxCarryoverPct: parseFloat(e.target.value) || 0 }))} />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={2} value={fundForm.notes} onChange={e => setFundForm(p => ({ ...p, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFundDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!fundForm.fundName} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fund Operation Dialog (Drawdown / Topup / Transfer / Carryover) */}
      <Dialog open={opDialog} onClose={() => setOpDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
          {opType === 'drawdown' ? 'Fund Drawdown' : opType === 'topup' ? 'Top Up Fund' : opType === 'transfer' ? 'Transfer Between Funds' : 'Process Carryover'}
        </DialogTitle>
        <DialogContent>
          {opFund && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Fund: <strong>{opFund.fundName || opFund.fund_name}</strong> | Remaining: <strong>{formatCurrency(opFund.remainingAmount || opFund.remaining_amount)}</strong>
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Amount (ZAR)" type="number" value={opForm.amount} onChange={e => setOpForm(p => ({ ...p, amount: e.target.value }))} required />
            </Grid>
            {opType === 'transfer' && (
              <Grid item xs={12}>
                <TextField select fullWidth label="Destination Fund" value={opForm.toFundId} onChange={e => setOpForm(p => ({ ...p, toFundId: e.target.value }))} required>
                  <MenuItem value="">Select destination</MenuItem>
                  {fundOptions.filter(fo => fo.id !== opFund?.id).map(fo => (
                    <MenuItem key={fo.id} value={fo.id}>{fo.name} (Remaining: {formatCurrency(fo.remaining)})</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={opForm.description} onChange={e => setOpForm(p => ({ ...p, description: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleOperation}
            sx={{ bgcolor: opType === 'drawdown' ? '#DC2626' : opType === 'topup' ? '#059669' : '#7C3AED', '&:hover': { opacity: 0.9 } }}>
            Confirm {opType === 'drawdown' ? 'Drawdown' : opType === 'topup' ? 'Top Up' : opType === 'transfer' ? 'Transfer' : 'Carryover'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fund Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {detailFund?.fundName || detailFund?.fund_name || 'Fund Detail'}
          <Chip label={detailFund?.status} size="small" sx={{ ml: 1, ...(() => { const sc = statusColor(detailFund?.status); return { bgcolor: sc.bg, color: sc.text }; })(), fontWeight: 500, textTransform: 'capitalize' }} />
        </DialogTitle>
        <DialogContent>
          {detailFund && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Type</Typography><Typography variant="body2" fontWeight={600}>{detailFund.fundType || detailFund.fund_type}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Fiscal Year</Typography><Typography variant="body2" fontWeight={600}>{detailFund.fiscalYear || detailFund.fiscal_year}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Original</Typography><Typography variant="body2" fontWeight={600}>{formatCurrency(detailFund.originalAmount || detailFund.original_amount)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Remaining</Typography><Typography variant="body2" fontWeight={600} color="#059669">{formatCurrency(detailFund.remainingAmount || detailFund.remaining_amount)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Drawn</Typography><Typography variant="body2" fontWeight={600} color="#DC2626">{formatCurrency(detailFund.drawnAmount || detailFund.drawn_amount)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Committed</Typography><Typography variant="body2" fontWeight={600}>{formatCurrency(detailFund.committedAmount || detailFund.committed_amount)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Carryover</Typography><Typography variant="body2" fontWeight={600}>{formatCurrency(detailFund.carryoverAmount || detailFund.carryover_amount)}</Typography></Grid>
                <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Policy</Typography><Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{detailFund.carryoverPolicy || detailFund.carryover_policy}</Typography></Grid>
              </Grid>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button size="small" variant="outlined" startIcon={<DrawdownIcon />} onClick={() => openOperation('drawdown', detailFund)} color="error">Drawdown</Button>
                <Button size="small" variant="outlined" startIcon={<TopupIcon />} onClick={() => openOperation('topup', detailFund)} color="success">Top Up</Button>
                <Button size="small" variant="outlined" startIcon={<TransferIcon />} onClick={() => openOperation('transfer', detailFund)} color="primary">Transfer</Button>
                <Button size="small" variant="outlined" startIcon={<CarryoverIcon />} onClick={() => openOperation('carryover', detailFund)} color="secondary">Carryover</Button>
              </Box>

              <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' } }}>
                <Tab icon={<TxnIcon />} iconPosition="start" label="Transactions" />
                <Tab icon={<RuleIcon />} iconPosition="start" label="Rules" />
              </Tabs>

              {detailTab === 0 && (
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Balance</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Posted By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailTransactions.map(txn => {
                        const tc = txnTypeColor(txn.transactionType || txn.transaction_type);
                        return (
                          <TableRow key={txn.id}>
                            <TableCell>{(txn.postedAt || txn.posted_at || txn.createdAt || txn.created_at || '').slice(0, 10)}</TableCell>
                            <TableCell><Chip label={(txn.transactionType || txn.transaction_type || '').replace(/_/g, ' ')} size="small" sx={{ bgcolor: tc.bg, color: tc.text, fontWeight: 500, textTransform: 'capitalize' }} /></TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(txn.amount)}</TableCell>
                            <TableCell align="right">{formatCurrency(txn.runningBalance || txn.running_balance)}</TableCell>
                            <TableCell>{txn.description || '-'}</TableCell>
                            <TableCell>{txn.postedBy || txn.posted_by || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                      {detailTransactions.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: '#9CA3AF' }}>No transactions yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {detailTab === 1 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    <Button size="small" startIcon={<AddIcon />} onClick={() => openRuleDialog(detailFund)}>Add Rule</Button>
                  </Box>
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Rule Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Condition</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailRules.map(rule => (
                          <TableRow key={rule.id}>
                            <TableCell>{rule.ruleName || rule.rule_name}</TableCell>
                            <TableCell><Chip label={(rule.ruleType || rule.rule_type || '').replace(/_/g, ' ')} size="small" sx={{ fontWeight: 500, textTransform: 'capitalize' }} /></TableCell>
                            <TableCell>{rule.conditionField || rule.condition_field} {rule.conditionOperator || rule.condition_operator} {rule.conditionValue || rule.condition_value}</TableCell>
                            <TableCell>{(rule.actionType || rule.action_type || '').replace(/_/g, ' ')} {rule.actionValue || rule.action_value}</TableCell>
                            <TableCell>{rule.priority}</TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => openRuleDialog(detailFund, rule)}><EditIcon fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={() => handleDeleteRule(rule.id)}><DeleteIcon fontSize="small" sx={{ color: '#DC2626' }} /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {detailRules.length === 0 && (
                          <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: '#9CA3AF' }}>No rules configured</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={ruleDialog} onClose={() => setRuleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingRuleId ? 'Edit Rule' : 'Add Rule'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Rule Name" value={ruleForm.ruleName} onChange={e => setRuleForm(p => ({ ...p, ruleName: e.target.value }))} required /></Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Rule Type" value={ruleForm.ruleType} onChange={e => setRuleForm(p => ({ ...p, ruleType: e.target.value }))}>
                <MenuItem value="validation">Validation</MenuItem>
                <MenuItem value="allocation">Allocation</MenuItem>
                <MenuItem value="carryover">Carryover</MenuItem>
                <MenuItem value="drawdown_limit">Drawdown Limit</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Priority" type="number" value={ruleForm.priority} onChange={e => setRuleForm(p => ({ ...p, priority: parseInt(e.target.value) || 1 }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Condition Field" value={ruleForm.conditionField} onChange={e => setRuleForm(p => ({ ...p, conditionField: e.target.value }))} placeholder="e.g. customer_tier" /></Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Operator" value={ruleForm.conditionOperator} onChange={e => setRuleForm(p => ({ ...p, conditionOperator: e.target.value }))}>
                <MenuItem value="equals">Equals</MenuItem>
                <MenuItem value="not_equals">Not Equals</MenuItem>
                <MenuItem value="greater_than">Greater Than</MenuItem>
                <MenuItem value="less_than">Less Than</MenuItem>
                <MenuItem value="in">In</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Condition Value" value={ruleForm.conditionValue} onChange={e => setRuleForm(p => ({ ...p, conditionValue: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Action" value={ruleForm.actionType} onChange={e => setRuleForm(p => ({ ...p, actionType: e.target.value }))}>
                <MenuItem value="approve">Approve</MenuItem>
                <MenuItem value="reject">Reject</MenuItem>
                <MenuItem value="flag">Flag for Review</MenuItem>
                <MenuItem value="limit_amount">Limit Amount</MenuItem>
                <MenuItem value="set_percentage">Set Percentage</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Action Value" value={ruleForm.actionValue} onChange={e => setRuleForm(p => ({ ...p, actionValue: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={ruleForm.description} onChange={e => setRuleForm(p => ({ ...p, description: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRuleDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRule} disabled={!ruleForm.ruleName} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingRuleId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(p => ({ ...p, open: false }))} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TradeFundManagement;
