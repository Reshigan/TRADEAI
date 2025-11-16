import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import {  AttachMoney, PlayArrow } from '@mui/icons-material';
import enterpriseApi from '../../../services/enterpriseApi';

export default function BudgetOptimizer({ onSaveScenario }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [totalBudget, setTotalBudget] = useState(1000000);

  const runOptimization = async () => {
    try {
      setLoading(true);
      const response = await enterpriseApi.simulations.budgetAllocation({
        totalBudget,
        categories: ['product_A', 'product_B', 'product_C'],
        objective: 'maximize_roi'
      });
      setResults(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Budget Parameters</Typography>
            <TextField
              fullWidth
              label="Total Budget"
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              onClick={runOptimization}
              disabled={loading}
            >
              Optimize Budget
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          {results ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6">Optimal Allocation</Typography>
              <Alert severity="success" sx={{ mt: 2 }}>
                Budget optimization complete! Check results above.
              </Alert>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
              <AttachMoney sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6">Configure budget parameters and optimize</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
