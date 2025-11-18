import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import {
  AccountBalance as BudgetIcon,
  Receipt as WalletIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

const FundingOverview = () => {
  const [loading, setLoading] = useState(true);
  const [fundingSources, setFundingSources] = useState({
    budgets: [],
    wallets: [],
    terms: [],
  });
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchFundingData();
  }, []);

  const fetchFundingData = async () => {
    try {
      setLoading(true);
      
      const [budgetsRes, walletsRes, termsRes] = await Promise.all([
        apiClient.get('/budgets'),
        apiClient.get('/kam-wallets'),
        apiClient.get('/trading-terms'),
      ]);

      setFundingSources({
        budgets: budgetsRes.data || [],
        wallets: walletsRes.data || [],
        terms: termsRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching funding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const budgetTotal = fundingSources.budgets.reduce((sum, b) => sum + (b.allocated || 0), 0);
    const budgetSpent = fundingSources.budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    const budgetRemaining = budgetTotal - budgetSpent;

    const walletTotal = fundingSources.wallets.reduce((sum, w) => sum + (w.totalAllocation || 0), 0);
    const walletUsed = fundingSources.wallets.reduce((sum, w) => sum + (w.totalUsed || 0), 0);
    const walletRemaining = walletTotal - walletUsed;

    const termsTotal = fundingSources.terms.reduce((sum, t) => sum + (t.capAmount || 0), 0);

    return {
      total: budgetTotal + walletTotal + termsTotal,
      spent: budgetSpent + walletUsed,
      remaining: budgetRemaining + walletRemaining,
      budgetTotal,
      budgetSpent,
      budgetRemaining,
      walletTotal,
      walletUsed,
      walletRemaining,
      termsTotal,
    };
  };

  const totals = calculateTotals();
  const utilizationRate = totals.total > 0 ? (totals.spent / totals.total) * 100 : 0;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Loading...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        💰 Funding Overview
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Unified view of all funding sources: Budgets, KAM Wallets, and Trading Terms. Monitor available capacity for promotions and trade spend.
        </Typography>
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BudgetIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Funding
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                R {totals.total.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Spent
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                R {totals.spent.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WalletIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Remaining
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                R {totals.remaining.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon color={utilizationRate > 80 ? 'error' : 'warning'} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Utilization
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {utilizationRate.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={utilizationRate}
                sx={{ mt: 1 }}
                color={utilizationRate > 80 ? 'error' : 'primary'}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
            <Tab label={`Budgets (${fundingSources.budgets.length})`} />
            <Tab label={`KAM Wallets (${fundingSources.wallets.length})`} />
            <Tab label={`Trading Terms (${fundingSources.terms.length})`} />
          </Tabs>

          {activeTab === 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Budget Code</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell align="right"><strong>Allocated</strong></TableCell>
                    <TableCell align="right"><strong>Spent</strong></TableCell>
                    <TableCell align="right"><strong>Remaining</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fundingSources.budgets.map((budget) => {
                    const remaining = (budget.allocated || 0) - (budget.spent || 0);
                    const utilization = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;
                    
                    return (
                      <TableRow key={budget._id}>
                        <TableCell>{budget.code}</TableCell>
                        <TableCell>{budget.name}</TableCell>
                        <TableCell align="right">R {(budget.allocated || 0).toLocaleString()}</TableCell>
                        <TableCell align="right">R {(budget.spent || 0).toLocaleString()}</TableCell>
                        <TableCell align="right">R {remaining.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={budget.status}
                            size="small"
                            color={budget.status === 'approved' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 1 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>User</strong></TableCell>
                    <TableCell><strong>Period</strong></TableCell>
                    <TableCell align="right"><strong>Total Allocation</strong></TableCell>
                    <TableCell align="right"><strong>Used</strong></TableCell>
                    <TableCell align="right"><strong>Remaining</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fundingSources.wallets.map((wallet) => (
                    <TableRow key={wallet._id}>
                      <TableCell>{wallet.userId?.name || wallet.userId}</TableCell>
                      <TableCell>
                        {new Date(wallet.period?.startDate).toLocaleDateString()} - {new Date(wallet.period?.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">R {(wallet.totalAllocation || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">R {(wallet.totalUsed || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">R {(wallet.remainingBalance || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={wallet.status}
                          size="small"
                          color={wallet.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 2 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Term Code</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>Period</strong></TableCell>
                    <TableCell align="right"><strong>Rate</strong></TableCell>
                    <TableCell align="right"><strong>Cap Amount</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fundingSources.terms.map((term) => (
                    <TableRow key={term._id}>
                      <TableCell>{term.termCode}</TableCell>
                      <TableCell>{term.description}</TableCell>
                      <TableCell>{term.customer?.name || term.customer}</TableCell>
                      <TableCell>
                        {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        {term.rateType === 'percent' ? `${term.rate}%` : `R ${term.rate}`}
                      </TableCell>
                      <TableCell align="right">
                        {term.capAmount ? `R ${term.capAmount.toLocaleString()}` : 'No cap'}
                      </TableCell>
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
};

export default FundingOverview;
