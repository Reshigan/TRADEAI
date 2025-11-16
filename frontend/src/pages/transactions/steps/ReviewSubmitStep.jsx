import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../utils/formatters';

const TRANSACTION_TYPE_LABELS = {
  order: 'Order',
  trade_deal: 'Trade Deal',
  settlement: 'Settlement',
  payment: 'Payment',
  accrual: 'Accrual',
  deduction: 'Deduction'
};

const PAYMENT_METHOD_LABELS = {
  credit: 'Credit Card',
  debit: 'Debit Card',
  wire_transfer: 'Wire Transfer',
  check: 'Check',
  cash: 'Cash',
  credit_memo: 'Credit Memo'
};

const PAYMENT_TERMS_LABELS = {
  net_30: 'Net 30',
  net_60: 'Net 60',
  net_90: 'Net 90',
  cod: 'COD',
  prepaid: 'Prepaid',
  custom: 'Custom'
};

export default function ReviewSubmitStep({ data, customers, products }) {
  const [submitting] = useState(false);

  const customer = customers?.find(c => c._id === data.customerId);
  const amount = data.amount || {};
  const requiresApproval = amount.net >= 1000;

  // Validation checks
  const validationChecks = [
    {
      label: 'Transaction details completed',
      status: data.transactionType && data.transactionDate && data.customerId,
      severity: 'error'
    },
    {
      label: 'At least one line item added',
      status: data.items && data.items.length > 0,
      severity: 'error'
    },
    {
      label: 'Payment terms configured',
      status: data.paymentMethod && data.paymentTerms,
      severity: 'error'
    },
    {
      label: 'Total amount calculated',
      status: amount.net > 0,
      severity: 'warning'
    }
  ];

  const allValid = validationChecks.filter(c => c.severity === 'error').every(c => c.status);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Review & Submit
      </Typography>

      {/* Validation Status */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Validation Status
        </Typography>
        <List dense>
          {validationChecks.map((check, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                {check.status ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  check.severity === 'error' ? (
                    <WarningIcon color="error" />
                  ) : (
                    <InfoIcon color="warning" />
                  )
                )}
              </ListItemIcon>
              <ListItemText
                primary={check.label}
                secondary={check.status ? 'Completed' : 'Incomplete'}
              />
            </ListItem>
          ))}
        </List>

        {!allValid && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Please complete all required fields before submitting.
          </Alert>
        )}

        {requiresApproval && (
          <Alert severity="info" sx={{ mt: 2 }} icon={<InfoIcon />}>
            This transaction requires management approval due to the amount (≥ {formatCurrency(1000)}).
            It will be submitted for review after creation.
          </Alert>
        )}
      </Paper>

      {/* Transaction Summary */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Transaction Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Transaction Type:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {TRANSACTION_TYPE_LABELS[data.transactionType] || 'Not selected'}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Transaction Date:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {data.transactionDate ? new Date(data.transactionDate).toLocaleDateString() : 'Not set'}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Customer:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {customer ? `${customer.name} (${customer.code})` : 'Not selected'}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Currency:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {data.currency || 'USD'}
            </Typography>
          </Grid>

          {data.contractId && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Contract ID:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {data.contractId}
              </Typography>
            </Grid>
          )}

          {data.notes && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Notes:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {data.notes}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Line Items */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Line Items
        </Typography>
        {data.items && data.items.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Discount</TableCell>
                  <TableCell align="right">Tax</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((item, index) => {
                  const product = products?.find(p => p._id === item.productId);
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {product?.name || item.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {item.sku}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">${item.unitPrice?.toFixed(2)}</TableCell>
                      <TableCell align="right">{item.discount}%</TableCell>
                      <TableCell align="right">{item.taxRate}%</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          ${item.total?.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="warning">No line items added</Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Amount Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ width: 300 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">Subtotal:</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight="medium">
                  ${amount.gross?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="error.main">Discount:</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="error.main" fontWeight="medium">
                  -${amount.discount?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2">Tax:</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight="medium">
                  ${amount.tax?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="h6">Total:</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  ${amount.net?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>

      {/* Payment Details */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payment Terms
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Payment Method:
            </Typography>
            <Chip
              label={PAYMENT_METHOD_LABELS[data.paymentMethod] || 'Not selected'}
              color="primary"
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Payment Terms:
            </Typography>
            <Chip
              label={PAYMENT_TERMS_LABELS[data.paymentTerms] || 'Not selected'}
              color="info"
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Grid>

          {data.paymentDueDate && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Due Date:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {new Date(data.paymentDueDate).toLocaleDateString()}
              </Typography>
            </Grid>
          )}

          {data.paymentReferenceNumber && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Reference Number:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {data.paymentReferenceNumber}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {submitting && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}
