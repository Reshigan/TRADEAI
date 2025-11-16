import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Chip
} from '@mui/material';
import {Settings} from '@mui/icons-material';

const RebateConfiguration = () => {
  const [rebateTypes, setRebateTypes] = useState([
    {
      id: 'volume',
      name: 'Volume Rebates',
      description: 'Tiered rebates based on purchase volume',
      enabled: true,
      icon: '📊',
      settings: { tiers: 3, maxRate: 5 }
    },
    {
      id: 'growth',
      name: 'Growth Rebates',
      description: 'Rebates based on YoY growth',
      enabled: true,
      icon: '📈',
      settings: { minGrowth: 10, maxRate: 3 }
    },
    {
      id: 'early-payment',
      name: 'Early Payment Discounts',
      description: 'Discounts for early invoice payment',
      enabled: true,
      icon: '💰',
      settings: { terms: '2/10 Net 30', rate: 2 }
    },
    {
      id: 'slotting',
      name: 'Slotting Fees',
      description: 'One-time or annual placement fees',
      enabled: true,
      icon: '🏪',
      settings: { type: 'annual', amount: 5000 }
    },
    {
      id: 'coop',
      name: 'Co-op Marketing',
      description: 'Marketing and advertising allowances',
      enabled: true,
      icon: '📢',
      settings: { accrualRate: 3, requireProof: true }
    },
    {
      id: 'off-invoice',
      name: 'Off-Invoice Discounts',
      description: 'Immediate price reductions',
      enabled: true,
      icon: '🎯',
      settings: { maxDiscount: 20 }
    },
    {
      id: 'billback',
      name: 'Bill-Back Rebates',
      description: 'Post-sale claim-based rebates',
      enabled: false,
      icon: '📝',
      settings: { claimPeriod: 90, requireDocumentation: true }
    },
    {
      id: 'display',
      name: 'Display/Feature Allowances',
      description: 'End-cap and circular advertising fees',
      enabled: false,
      icon: '🎨',
      settings: { endCapFee: 500, circularFee: 1000 }
    }
  ]);

  const handleToggle = (id) => {
    setRebateTypes(types =>
      types.map(type =>
        type.id === id ? { ...type, enabled: !type.enabled } : type
      )
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Rebate Type Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure which rebate types are available and their settings
      </Typography>

      <Grid container spacing={3}>
        {rebateTypes.map((rebate) => (
          <Grid item xs={12} md={6} key={rebate.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="h3">{rebate.icon}</Typography>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {rebate.name}
                        </Typography>
                        <Chip
                          label={rebate.enabled ? 'Enabled' : 'Disabled'}
                          color={rebate.enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {rebate.description}
                      </Typography>
                    </Box>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={rebate.enabled}
                        onChange={() => handleToggle(rebate.id)}
                      />
                    }
                    label=""
                  />
                </Box>

                {rebate.enabled && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {Object.entries(rebate.settings).map(([key, value]) => (
                        <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button
                      size="small"
                      startIcon={<Settings />}
                      sx={{ mt: 2 }}
                      fullWidth
                      variant="outlined"
                    >
                      Configure Settings
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined">Reset to Defaults</Button>
        <Button variant="contained">Save Configuration</Button>
      </Box>
    </Box>
  );
};

export default RebateConfiguration;
