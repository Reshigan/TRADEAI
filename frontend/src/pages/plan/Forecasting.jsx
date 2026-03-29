import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, TextField, MenuItem, LinearProgress } from '@mui/material';
import { TrendingUp, BarChart } from 'lucide-react';
import { forecastingService } from '../../services/api';
import { useToast } from '../../components/common/ToastNotification';

const fmt = (v) => { const n = Number(v || 0); return n >= 1e6 ? `R ${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `R ${(n/1e3).toFixed(0)}K` : `R ${n.toFixed(0)}`; };

export default function Forecasting() {
  const toast = useToast();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('quarterly');

  const generateForecast = async () => {
    setLoading(true);
    try {
      const res = await forecastingService.generateSalesForecast({ period });
      setForecast(res.data || res);
    } catch (e) { console.error(e); toast.error('An error occurred'); }
    setLoading(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h1">Forecasting</Typography><Typography variant="body2" color="text.secondary">AI-powered sales and promotion forecasting</Typography></Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField select size="small" value={period} onChange={(e) => setPeriod(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="monthly">Monthly</MenuItem><MenuItem value="quarterly">Quarterly</MenuItem><MenuItem value="annual">Annual</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={<TrendingUp size={16} />} onClick={generateForecast} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Forecast'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {forecast && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Predicted Revenue</Typography>
              <Typography variant="h2">{fmt(forecast.predicted_revenue || forecast.revenue)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Predicted Trade Spend</Typography>
              <Typography variant="h2">{fmt(forecast.predicted_spend || forecast.trade_spend)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Predicted ROI</Typography>
              <Typography variant="h2">{forecast.predicted_roi ? `${Number(forecast.predicted_roi).toFixed(1)}x` : '-'}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12}>
            <Card><CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>Forecast Details</Typography>
              <Typography variant="body2" color="text.secondary">
                Based on historical patterns and current promotion pipeline, the forecast predicts
                {forecast.confidence ? ` with ${Number(forecast.confidence).toFixed(0)}% confidence` : ''}.
              </Typography>
            </CardContent></Card>
          </Grid>
        </Grid>
      )}

      {!forecast && !loading && (
        <Card><CardContent sx={{ py: 6, textAlign: 'center' }}>
          <BarChart size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
          <Typography variant="h3" sx={{ mb: 1 }}>Generate a Forecast</Typography>
          <Typography variant="body2" color="text.secondary">Select a period and click Generate to get AI-powered predictions</Typography>
        </CardContent></Card>
      )}
    </Box>
  );
}
