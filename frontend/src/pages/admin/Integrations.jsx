import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, Chip, Switch, FormControlLabel } from '@mui/material';
import { CheckCircle, XCircle, Settings } from 'lucide-react';

const integrations = [
  { id: 'sap', name: 'SAP ERP', description: 'Bi-directional data sync with SAP S/4HANA', status: 'configured', icon: '🔗' },
  { id: 'azure_ad', name: 'Azure AD', description: 'Single sign-on and user provisioning', status: 'configured', icon: '🔐' },
  { id: 'email', name: 'Email (SMTP)', description: 'Notification emails for approvals and alerts', status: 'active', icon: '📧' },
  { id: 'ai_workers', name: 'Workers AI', description: 'ML predictions and AI insights engine', status: 'active', icon: '🤖' },
  { id: 'r2_storage', name: 'Cloudflare R2', description: 'Document and file storage for claims', status: 'active', icon: '📦' },
  { id: 'webhook', name: 'Webhooks', description: 'Real-time event notifications to external systems', status: 'inactive', icon: '🔔' },
];

export default function Integrations() {
  const [statuses, setStatuses] = useState(() => {
    const s = {};
    integrations.forEach(i => { s[i.id] = i.status === 'active'; });
    return s;
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1">Integrations</Typography>
        <Typography variant="body2" color="text.secondary">Manage external system connections and APIs</Typography>
      </Box>

      <Grid container spacing={2}>
        {integrations.map(i => (
          <Grid item xs={12} sm={6} md={4} key={i.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography fontSize={28}>{i.icon}</Typography>
                  <Chip
                    icon={i.status === 'active' ? <CheckCircle size={12} /> : i.status === 'configured' ? <Settings size={12} /> : <XCircle size={12} />}
                    label={i.status}
                    size="small"
                    color={i.status === 'active' ? 'success' : i.status === 'configured' ? 'info' : 'default'}
                    sx={{ textTransform: 'capitalize', '& .MuiChip-icon': { fontSize: 12 } }}
                  />
                </Box>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>{i.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{i.description}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={<Switch size="small" checked={statuses[i.id] || false} onChange={(e) => setStatuses(prev => ({ ...prev, [i.id]: e.target.checked }))} />}
                    label={<Typography variant="caption">{statuses[i.id] ? 'Enabled' : 'Disabled'}</Typography>}
                  />
                  <Button size="small" variant="outlined">Configure</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
