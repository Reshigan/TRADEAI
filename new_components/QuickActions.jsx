import React from 'react';
import { Card, CardContent, Typography, Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ actions = [] }) => {
  const navigate = useNavigate();

  const defaultActions = [
    {
      label: 'Create Budget',
      path: '/budgets/new',
      color: 'primary',
      icon: <AddIcon />
    },
    {
      label: 'New Promotion',
      path: '/promotions/new',
      color: 'secondary',
      icon: <AddIcon />
    },
    {
      label: 'Log Trade Spend',
      path: '/trade-spends/new',
      color: 'success',
      icon: <AddIcon />
    },
    {
      label: 'Process Rebate',
      path: '/rebates/new',
      color: 'info',
      icon: <AddIcon />
    }
  ];

  const actionsToShow = actions.length > 0 ? actions : defaultActions;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Stack spacing={1.5}>
          {actionsToShow.map((action, index) => (
            <Button
              key={index}
              variant="contained"
              color={action.color}
              startIcon={action.icon}
              fullWidth
              onClick={() => navigate(action.path)}
              sx={{ justifyContent: 'flex-start' }}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
