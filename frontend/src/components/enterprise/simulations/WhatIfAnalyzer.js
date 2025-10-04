import React, { useState } from 'react';
import { Box, Paper, Typography, Button, Grid, TextField, CircularProgress, Alert } from '@mui/material';
import { CompareArrows, PlayArrow } from '@mui/icons-material';
import enterpriseApi from '../../../services/enterpriseApi';

export default function WhatIfAnalyzer({ onSaveScenario, savedScenarios }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runAnalysis = async () => {
    try {
      setLoading(true);
      const response = await enterpriseApi.simulations.whatIfAnalysis({
        baseScenario: {
          type: 'promotion_impact',
          promotionType: 'discount',
          discountPercent: 10,
          duration: 30
        },
        variations: [
          { discountPercent: 15 },
          { discountPercent: 20 }
        ]
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
            <Typography variant="h6" gutterBottom>What-If Scenarios</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Compare {savedScenarios.length} saved scenarios
            </Alert>
            <Button
              fullWidth
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              onClick={runAnalysis}
              disabled={loading}
            >
              Run What-If Analysis
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <CompareArrows sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6">Scenario Comparison Results</Typography>
            {results && <Alert severity="success" sx={{ mt: 2 }}>Analysis Complete!</Alert>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
