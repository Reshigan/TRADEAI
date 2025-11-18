import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import kamWalletService from '../../services/kamwallet/kamWalletService';
import userService from '../../services/user/userService';
import { useCurrency } from '../../contexts/CurrencyContext';

const KAMWalletManagement = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    totalAllocation: '',
    currency: 'ZAR'
  });

  useEffect(() => {
    loadWallets();
    loadUsers();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const data = await kamWalletService.getWallets();
      setWallets(data);
      setError(null);
    } catch (err) {
      setError('Failed to load wallets: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers({ role: 'key_account_manager' });
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleCreateWallet = async () => {
    try {
      await kamWalletService.createWallet({
        userId: formData.userId,
        period: {
          startDate: formData.startDate,
          endDate: formData.endDate
        },
        totalAllocation: parseFloat(formData.totalAllocation),
        currency: formData.currency
      });
      setOpenDialog(false);
      setFormData({
        userId: '',
        startDate: '',
        endDate: '',
        totalAllocation: '',
        currency: 'ZAR'
      });
      loadWallets();
    } catch (err) {
      setError('Failed to create wallet: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'exhausted':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateUsedPercentage = (wallet) => {
    const totalUsed = wallet.allocations?.reduce((sum, alloc) => sum + alloc.usedAmount, 0) || 0;
    return ((totalUsed / wallet.totalAllocation) * 100).toFixed(1);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">KAM Wallet Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Wallet
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Total Allocation</TableCell>
                  <TableCell align="right">Used</TableCell>
                  <TableCell align="right">Remaining</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : wallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No wallets found. Create your first wallet to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  wallets.map((wallet) => {
                    const totalUsed = wallet.allocations?.reduce((sum, alloc) => sum + alloc.usedAmount, 0) || 0;
                    const remaining = wallet.totalAllocation - totalUsed;
                    
                    return (
                      <TableRow key={wallet._id}>
                        <TableCell>
                          {wallet.userId?.name || wallet.userId?.email || 'Unknown User'}
                        </TableCell>
                        <TableCell>
                          {new Date(wallet.period.startDate).toLocaleDateString()} - {new Date(wallet.period.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(wallet.totalAllocation)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(totalUsed)} ({calculateUsedPercentage(wallet)}%)
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(remaining)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={wallet.status}
                            color={getStatusColor(wallet.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/kamwallet/${wallet._id}`)}
                            title="View Details"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/kamwallet/${wallet._id}/allocate`)}
                            title="Allocate Funds"
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New KAM Wallet</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="KAM User"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              fullWidth
              required
            >
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />

            <TextField
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />

            <TextField
              label="Total Allocation"
              type="number"
              value={formData.totalAllocation}
              onChange={(e) => setFormData({ ...formData, totalAllocation: e.target.value })}
              fullWidth
              required
            />

            <TextField
              select
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              fullWidth
            >
              <MenuItem value="ZAR">ZAR (South African Rand)</MenuItem>
              <MenuItem value="USD">USD (US Dollar)</MenuItem>
              <MenuItem value="EUR">EUR (Euro)</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateWallet}
            variant="contained"
            disabled={!formData.userId || !formData.startDate || !formData.endDate || !formData.totalAllocation}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KAMWalletManagement;
