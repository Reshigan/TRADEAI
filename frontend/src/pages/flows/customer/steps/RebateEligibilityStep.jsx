import React, { useState } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Paper,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  CardGiftcard as RebateIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const RebateEligibilityStep = ({ data, onChange, errors = {} }) => {
  const [volumeRebates, setVolumeRebates] = useState(
    data.tradingTerms?.volumeRebate || []
  );

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleTradingTermsChange = (section, field, value) => {
    const tradingTerms = data.tradingTerms || {};
    onChange({
      ...data,
      tradingTerms: {
        ...tradingTerms,
        [section]: {
          ...(tradingTerms[section] || {}),
          [field]: value
        }
      }
    });
  };

  const handleVolumeRebateChange = (index, field, value) => {
    const newRebates = [...volumeRebates];
    newRebates[index] = {
      ...newRebates[index],
      [field]: value
    };
    setVolumeRebates(newRebates);
    
    const tradingTerms = data.tradingTerms || {};
    onChange({
      ...data,
      tradingTerms: {
        ...tradingTerms,
        volumeRebate: newRebates
      }
    });
  };

  const addVolumeRebate = () => {
    const newRebate = {
      tierName: '',
      minVolume: 0,
      maxVolume: 0,
      percentage: 0,
      productScope: 'all'
    };
    const newRebates = [...volumeRebates, newRebate];
    setVolumeRebates(newRebates);
    
    const tradingTerms = data.tradingTerms || {};
    onChange({
      ...data,
      tradingTerms: {
        ...tradingTerms,
        volumeRebate: newRebates
      }
    });
  };

  const removeVolumeRebate = (index) => {
    const newRebates = volumeRebates.filter((_, i) => i !== index);
    setVolumeRebates(newRebates);
    
    const tradingTerms = data.tradingTerms || {};
    onChange({
      ...data,
      tradingTerms: {
        ...tradingTerms,
        volumeRebate: newRebates
      }
    });
  };

  const productScopes = [
    { value: 'all', label: 'All Products' },
    { value: 'category', label: 'Specific Category' },
    { value: 'brand', label: 'Specific Brand' },
    { value: 'sku', label: 'Specific SKU' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RebateIcon color="primary" />
        Rebate Eligibility & Trading Terms
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure rebate programs and trading terms for this customer. All fields are optional.
      </Typography>

      {/* Retro-Active Rebate */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Retro-Active Rebate
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Year-end rebate based on total annual purchases
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Percentage"
              value={data.tradingTerms?.retroActive?.percentage || ''}
              onChange={(e) => handleTradingTermsChange('retroActive', 'percentage', parseFloat(e.target.value) || 0)}
              error={!!errors['tradingTerms.retroActive.percentage']}
              helperText={errors['tradingTerms.retroActive.percentage'] || 'Rebate percentage'}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              placeholder="0.00"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Valid From"
              value={data.tradingTerms?.retroActive?.validFrom || ''}
              onChange={(e) => handleTradingTermsChange('retroActive', 'validFrom', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Start date for this term"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Valid To"
              value={data.tradingTerms?.retroActive?.validTo || ''}
              onChange={(e) => handleTradingTermsChange('retroActive', 'validTo', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="End date for this term"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Conditions"
              value={data.tradingTerms?.retroActive?.conditions || ''}
              onChange={(e) => handleTradingTermsChange('retroActive', 'conditions', e.target.value)}
              helperText="Special conditions or requirements for this rebate"
              placeholder="e.g., Minimum annual purchase of $100,000 required"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Prompt Payment Discount */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Prompt Payment Discount
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Discount for early payment of invoices
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Percentage"
              value={data.tradingTerms?.promptPayment?.percentage || ''}
              onChange={(e) => handleTradingTermsChange('promptPayment', 'percentage', parseFloat(e.target.value) || 0)}
              error={!!errors['tradingTerms.promptPayment.percentage']}
              helperText={errors['tradingTerms.promptPayment.percentage'] || 'Discount percentage'}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              placeholder="0.00"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Days"
              value={data.tradingTerms?.promptPayment?.days || ''}
              onChange={(e) => handleTradingTermsChange('promptPayment', 'days', parseInt(e.target.value) || 0)}
              error={!!errors['tradingTerms.promptPayment.days']}
              helperText={errors['tradingTerms.promptPayment.days'] || 'Payment within X days'}
              InputProps={{
                endAdornment: <InputAdornment position="end">days</InputAdornment>
              }}
              placeholder="0"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Conditions"
              value={data.tradingTerms?.promptPayment?.conditions || ''}
              onChange={(e) => handleTradingTermsChange('promptPayment', 'conditions', e.target.value)}
              helperText="Additional conditions"
              placeholder="e.g., Must be paid in full"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Volume Rebate Tiers */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon fontSize="small" />
              Volume Rebate Tiers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tiered rebates based on purchase volume
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={addVolumeRebate}
          >
            Add Tier
          </Button>
        </Box>

        {volumeRebates.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No volume rebate tiers configured. Click "Add Tier" to create one.
            </Typography>
          </Box>
        ) : (
          volumeRebates.map((rebate, index) => (
            <Paper
              key={index}
              elevation={1}
              sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Tier {index + 1}
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeVolumeRebate(index)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tier Name"
                    value={rebate.tierName || ''}
                    onChange={(e) => handleVolumeRebateChange(index, 'tierName', e.target.value)}
                    placeholder="e.g., Bronze, Silver, Gold"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Product Scope</InputLabel>
                    <Select
                      value={rebate.productScope || 'all'}
                      label="Product Scope"
                      onChange={(e) => handleVolumeRebateChange(index, 'productScope', e.target.value)}
                    >
                      {productScopes.map((scope) => (
                        <MenuItem key={scope.value} value={scope.value}>
                          {scope.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>Which products this tier applies to</FormHelperText>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Min Volume"
                    value={rebate.minVolume || ''}
                    onChange={(e) => handleVolumeRebateChange(index, 'minVolume', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    placeholder="0.00"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Volume"
                    value={rebate.maxVolume || ''}
                    onChange={(e) => handleVolumeRebateChange(index, 'maxVolume', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    placeholder="0.00"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Rebate %"
                    value={rebate.percentage || ''}
                    onChange={(e) => handleVolumeRebateChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                    placeholder="0.00"
                  />
                </Grid>
              </Grid>
            </Paper>
          ))
        )}
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Additional Terms */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Additional Trading Terms
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Other Terms & Conditions"
          value={data.additionalTradingTerms || ''}
          onChange={(e) => handleChange('additionalTradingTerms', e.target.value)}
          helperText="Any other special trading terms, agreements, or conditions"
          placeholder="Enter any additional trading terms, special agreements, or conditions that apply to this customer..."
        />
      </Box>
    </Box>
  );
};

export default RebateEligibilityStep;
