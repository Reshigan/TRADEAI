import React, { useState } from 'react';
import { Box, Paper, Typography, Button, Grid, Slider, CircularProgress } from '@mui/material';
import { ShowChart, PlayArrow } from '@mui/icons-material';
import enterpriseApi from '../../../services/enterpriseApi';

export default function PricingSimulator({ onSaveScenario }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [priceChange, setPriceChange] = useState(5);

  const runSimulation = async () => {
    try {
      setLoading(true);
      const response = await enterpriseApi.simulations.pricingStrategy({
        products: [],
        priceChange,
        duration: 30
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
            <Typography variant="h6" gutterBottom>Price Change %</Typography>
            <Slider
              value={priceChange}
              onChange={(e, v) => setPriceChange(v)}
              min={-30}
              max={30}
              marks valueLabelDisplay="on"
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              onClick={runSimulation}
              disabled={loading}
            >
              Simulate Pricing
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <ShowChart sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6">Pricing Strategy Results</Typography>
            {results && <Typography color="success.main" sx={{ mt: 2 }}>Simulation Complete!</Typography>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
