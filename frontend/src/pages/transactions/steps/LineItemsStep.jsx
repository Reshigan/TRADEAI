import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  InputAdornment,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../utils/formatters';

export default function LineItemsStep({ data, errors, onChange, products }) {
  const [items, setItems] = useState(data.items || []);
  const [totals, setTotals] = useState({
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal: 0
  });

  useEffect(() => {
    calculateTotals();
  }, [items]);

  useEffect(() => {
    onChange({ 
      ...data, 
      items,
      amount: {
        gross: totals.subtotal,
        discount: totals.totalDiscount,
        tax: totals.totalTax,
        net: totals.grandTotal
      }
    });
  }, [totals]);

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const discount = parseFloat(item.discount) || 0;
      const taxRate = parseFloat(item.taxRate) || 0;

      const lineSubtotal = quantity * unitPrice;
      const lineDiscount = (lineSubtotal * discount) / 100;
      const taxableAmount = lineSubtotal - lineDiscount;
      const lineTax = (taxableAmount * taxRate) / 100;

      subtotal += lineSubtotal;
      totalDiscount += lineDiscount;
      totalTax += lineTax;
    });

    setTotals({
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal: subtotal - totalDiscount + totalTax
    });
  };

  const addItem = () => {
    setItems([...items, {
      productId: '',
      sku: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 0,
      total: 0
    }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-populate product details
    if (field === 'productId' && products) {
      const product = products.find(p => p._id === value);
      if (product) {
        newItems[index].sku = product.sku || '';
        newItems[index].description = product.name || '';
        newItems[index].unitPrice = product.price || 0;
      }
    }

    // Calculate line total
    const item = newItems[index];
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discount) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;

    const lineSubtotal = quantity * unitPrice;
    const lineDiscount = (lineSubtotal * discount) / 100;
    const taxableAmount = lineSubtotal - lineDiscount;
    const lineTax = (taxableAmount * taxRate) / 100;
    
    newItems[index].total = taxableAmount + lineTax;

    setItems(newItems);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Line Items
      </Typography>

      {errors.items && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.items}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Items ({items.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addItem}
          >
            Add Item
          </Button>
        </Box>

        {items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No items added yet
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addItem}
              sx={{ mt: 2 }}
            >
              Add First Item
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="30%">Product</TableCell>
                  <TableCell width="10%">Quantity</TableCell>
                  <TableCell width="15%">Unit Price</TableCell>
                  <TableCell width="10%">Discount %</TableCell>
                  <TableCell width="10%">Tax %</TableCell>
                  <TableCell width="15%">Total</TableCell>
                  <TableCell width="10%" align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Autocomplete
                        size="small"
                        options={products || []}
                        getOptionLabel={(option) => option.name || ''}
                        value={products?.find(p => p._id === item.productId) || null}
                        onChange={(e, newValue) => updateItem(index, 'productId', newValue?._id || '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select product"
                            error={!!errors[`items.${index}.productId`]}
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props}>
                            <Box>
                              <Typography variant="body2">{option.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {option.sku} • ${option.price}
                              </Typography>
                            </Box>
                          </li>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        inputProps={{ min: 0, step: 1 }}
                        error={!!errors[`items.${index}.quantity`]}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }}
                        error={!!errors[`items.${index}.unitPrice`]}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateItem(index, 'discount', e.target.value)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.taxRate}
                        onChange={(e) => updateItem(index, 'taxRate', e.target.value)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${item.total?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Totals Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ width: 400 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1">Subtotal:</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body1" fontWeight="medium">
                  ${totals.subtotal.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body1">Discount:</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body1" color="error.main" fontWeight="medium">
                  -${totals.totalDiscount.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body1">Tax:</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body1" fontWeight="medium">
                  ${totals.totalTax.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="h6">Grand Total:</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  ${totals.grandTotal.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>

            {totals.grandTotal >= 1000 && (
              <Alert severity="info" sx={{ mt: 2 }} icon={<CalculateIcon />}>
                <Typography variant="caption">
                  This transaction requires management approval (amount ≥ {formatCurrency(1000)})
                </Typography>
              </Alert>
            )}
          </Box>
        </Box>
      </Paper>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
        <Typography variant="body2" color="warning.dark">
          ⚠️ <strong>Note:</strong> Ensure all line items have valid products and quantities. Tax rates will be applied based on your configuration.
        </Typography>
      </Box>
    </Box>
  );
}
