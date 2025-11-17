import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Autocomplete,
  FormHelperText,
  Typography,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { enZA } from 'date-fns/locale';
import {format, parseISO} from 'date-fns';
import { customerService, productService } from '../../services/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const ActivityForm = ({ activity, onSubmit, startDate, endDate }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch customers and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, productsResponse] = await Promise.all([
          customerService.getCustomers(),
          productService.getProducts()
        ]);
        
        setCustomers(customersResponse.data.data);
        setProducts(productsResponse.data.data);
      } catch (error) {
        console.error('Error fetching form data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Form validation schema
  const validationSchema = Yup.object({
    date: Yup.date().required('Date is required'),
    activityType: Yup.string().required('Activity type is required'),
    customer: Yup.string().required('Customer is required'),
    products: Yup.array().min(1, 'At least one product is required'),
    title: Yup.string().required('Title is required').max(100, 'Title must be at most 100 characters'),
    description: Yup.string().max(500, 'Description must be at most 500 characters'),
    value: Yup.number().min(0, 'Value must be positive'),
    priority: Yup.string().required('Priority is required')
  });
  
  // Initialize form with activity data or defaults
  const formik = useFormik({
    initialValues: {
      date: activity ? (typeof activity.date === 'string' ? parseISO(activity.date) : activity.date) : new Date(),
      activityType: activity?.type || 'promotion',
      customer: activity?.customer || '',
      products: activity?.products || [],
      title: activity?.title || '',
      description: activity?.description || '',
      value: activity?.value || 0,
      priority: activity?.priority || 'medium',
      status: activity?.status || 'scheduled'
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit({
        ...values,
        date: format(values.date, 'yyyy-MM-dd')
      });
    }
  });
  
  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enZA}>
            <DatePicker
              label="Date"
              value={formik.values.date}
              onChange={(newDate) => formik.setFieldValue('date', newDate)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={formik.touched.date && Boolean(formik.errors.date)}
                  helperText={formik.touched.date && formik.errors.date}
                />
              )}
              minDate={startDate}
              maxDate={endDate}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={formik.touched.activityType && Boolean(formik.errors.activityType)}>
            <InputLabel>Activity Type</InputLabel>
            <Select
              name="activityType"
              value={formik.values.activityType}
              onChange={formik.handleChange}
              label="Activity Type"
            >
              <MenuItem value="promotion">Promotion</MenuItem>
              <MenuItem value="trade_spend">Trade Spend</MenuItem>
              <MenuItem value="campaign">Campaign</MenuItem>
              <MenuItem value="event">Event</MenuItem>
              <MenuItem value="training">Training</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
            {formik.touched.activityType && formik.errors.activityType && (
              <FormHelperText>{formik.errors.activityType}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Autocomplete
            options={customers}
            getOptionLabel={(option) => option.name}
            value={customers.find(c => c._id === formik.values.customer) || null}
            onChange={(_, newValue) => {
              formik.setFieldValue('customer', newValue?._id || '');
            }}
            loading={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Customer"
                fullWidth
                error={formik.touched.customer && Boolean(formik.errors.customer)}
                helperText={formik.touched.customer && formik.errors.customer}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={products}
            getOptionLabel={(option) => option.name}
            value={products.filter(p => formik.values.products.includes(p._id))}
            onChange={(_, newValue) => {
              formik.setFieldValue('products', newValue.map(p => p._id));
            }}
            loading={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Products"
                fullWidth
                error={formik.touched.products && Boolean(formik.errors.products)}
                helperText={formik.touched.products && formik.errors.products}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  {...getTagProps({ index })}
                  key={option._id}
                />
              ))
            }
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            name="title"
            label="Title"
            fullWidth
            value={formik.values.title}
            onChange={formik.handleChange}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formik.values.description}
            onChange={formik.handleChange}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            name="value"
            label="Value (ZAR)"
            type="number"
            fullWidth
            value={formik.values.value}
            onChange={formik.handleChange}
            error={formik.touched.value && Boolean(formik.errors.value)}
            helperText={formik.touched.value && formik.errors.value}
            InputProps={{
              startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>R</Typography>
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth error={formik.touched.priority && Boolean(formik.errors.priority)}>
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={formik.values.priority}
              onChange={formik.handleChange}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
            {formik.touched.priority && formik.errors.priority && (
              <FormHelperText>{formik.errors.priority}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              label="Status"
            >
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {activity ? 'Update Activity' : 'Create Activity'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ActivityForm;