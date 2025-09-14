import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tradingTermsService } from '../../services/tradingTermsService';

const TradingTermForm = ({ open, onClose, term, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    termType: '',
    priority: 'medium',
    validityPeriod: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [termOptions, setTermOptions] = useState({});

  useEffect(() => {
    if (open) {
      loadTermOptions();
      if (term) {
        setFormData({
          ...term,
          validityPeriod: {
            startDate: new Date(term.validityPeriod.startDate),
            endDate: new Date(term.validityPeriod.endDate)
          }
        });
      } else {
        setFormData({
          name: '',
          code: '',
          description: '',
          termType: '',
          priority: 'medium',
          validityPeriod: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }
  }, [open, term]);

  const loadTermOptions = async () => {
    try {
      const response = await tradingTermsService.getTradingTermOptions();
      setTermOptions(response.data);
    } catch (err) {
      console.error('Failed to load term options:', err);
    }
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (term) {
        await tradingTermsService.updateTradingTerm(term._id, formData);
      } else {
        await tradingTermsService.createTradingTerm(formData);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {term ? 'Edit Trading Term' : 'Create Trading Term'}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                required
                helperText="Unique identifier for this trading term"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Term Type</InputLabel>
                <Select
                  value={formData.termType}
                  onChange={(e) => handleChange('termType', e.target.value)}
                  label="Term Type"
                >
                  {termOptions.termTypes?.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  label="Priority"
                >
                  {termOptions.priorities?.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Validity Period
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.validityPeriod.startDate}
                  onChange={(date) => handleChange('validityPeriod.startDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formData.validityPeriod.endDate}
                  onChange={(date) => handleChange('validityPeriod.endDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  minDate={formData.validityPeriod.startDate}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Saving...' : (term ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TradingTermForm;