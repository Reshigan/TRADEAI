import React from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Checkbox } from '@mui/material';
import { Shield } from 'lucide-react';

const roles = [
  { name: 'Super Admin', key: 'super_admin', color: '#DC2626', permissions: ['all'] },
  { name: 'Admin', key: 'admin', color: '#7C3AED', permissions: ['users', 'config', 'budgets', 'promotions', 'approvals', 'settlements', 'reports'] },
  { name: 'Manager', key: 'manager', color: '#2563EB', permissions: ['budgets', 'promotions', 'approvals', 'reports'] },
  { name: 'KAM', key: 'kam', color: '#059669', permissions: ['promotions', 'trade_spends', 'claims'] },
  { name: 'Finance', key: 'finance', color: '#F59E0B', permissions: ['claims', 'deductions', 'settlements', 'accruals', 'pnl', 'reports'] },
  { name: 'Viewer', key: 'viewer', color: 'text.secondary', permissions: ['view_only'] },
];

const modules = ['users', 'config', 'budgets', 'promotions', 'trade_spends', 'approvals', 'claims', 'deductions', 'settlements', 'accruals', 'pnl', 'reports'];

export default function RoleList() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1">Roles & Permissions</Typography>
        <Typography variant="body2" color="text.secondary">Manage role-based access control</Typography>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
                  {roles.map(r => <TableCell key={r.key} align="center"><Chip icon={<Shield size={12} />} label={r.name} size="small" sx={{ bgcolor: `${r.color}15`, color: r.color, fontWeight: 600, '& .MuiChip-icon': { color: r.color } }} /></TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map(mod => (
                  <TableRow key={mod}>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{mod.replace(/_/g, ' ')}</TableCell>
                    {roles.map(r => (
                      <TableCell key={r.key} align="center">
                        <Checkbox size="small" checked={r.permissions.includes('all') || r.permissions.includes(mod)} disabled sx={{ '&.Mui-checked': { color: r.color } }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
