import React from 'react';
import { Card, Grid, Typography, Box, Button } from '@mui/material';
import { 
  AttachMoney, 
  AccountBalanceWallet, 
  ReceiptLong, 
  TrendingDown, 
  CheckCircle 
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useMyWork } from '../../hooks/useMyWork';

const FinanceCockpit = ({ user }) => {
  const { tenantId } = useAuth();
  const { claims, loading } = useMyWork();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Finance Cockpit: {user?.firstName || 'Finance Officer'}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Managing accruals, settlements, and P&L accuracy for the la-portfolio.
      </Typography>

      <Grid container spacing={3}>
        {/* Top Row: Financial Health KPIs */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="subtitle2">Total Accruals</Typography>
            <Typography variant="h4">R 12,450,000</Typography>
            <Typography variant="caption">Current liabilities</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.main', color: 'white' }}>
            <Typography variant="subtitle2">Pending Settlements</Typography>
            <Typography variant="h4">R 1,200,000</Typography>
            <Typography variant="caption">Awaiting payment</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
            <Typography variant="subtitle2">Unreconciled Deductions</Typography>
            <Typography variant="h4">R 450,000</Typography>
            <Typography variant="caption">Action required</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
            <Typography variant="subtitle2">Net Margin Impact</Typography>
            <Typography variant="h4">+2.4%</Typography>
            <Typography variant="caption">Optimized vs baseline</Typography>
          </Card>
        </Grid>

        {/* Middle Row: Financial Queues */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">High-Value Claims</Typography>
              <Button size="small" variant="outlined">Review All</Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {claims?.slice(0, 5).map(claim => (
                <Box key={claim.id} sx={{ p: 2, border: '1px solid #eee', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2"><strong>{claim.claim_number}</strong> - {claim.customer_name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>R {claim.claimed_amount}</Typography>
                </Box>
              ))}
              {(!claims || claims.length === 0) && <Typography variant="body2" color="text.secondary">No claims requiring urgent attention.</Typography>}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>Accrual Status</Typography>
            <Box sx={{ height: 200, bgcolor: '#f9f9f9', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">P&L Impact Visualization Area</Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<AttachMoney />} color="primary">Generate Accrual Report</Button>
              <Button variant="contained" startIcon={<AccountBalanceWallet />} color="secondary">Settle All Approved</Button>
            </Box>
          </Card>
        </Grid>

        {/* Bottom Row: Financial Compliance */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Audit & Compliance Alerts</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ p: 1, bgcolor: 'error.light', color: 'white', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningAmber fontSize="small" />
                <Typography variant="body2">3 Claims exceed the 30-day settlement SLA</Typography>
              </Box>
              <Box sx={{ p: 1, bgcolor: 'warning.light', color: 'black', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLong fontSize="small" />
                <Typography variant="body2">Deduction mismatch detected for Vendor X (R 12,000)</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinanceCockpit;
