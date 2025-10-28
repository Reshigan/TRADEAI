import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Typography,
  Alert,
  Collapse,
  IconButton,
  Chip,
  InputAdornment,
  CircularProgress,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Psychology as AIIcon,
  AutoAwesome as SuggestionIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

/**
 * SmartForm - AI-enhanced form with intelligent suggestions and validation
 * 
 * Features:
 * - AI-powered field suggestions
 * - Real-time validation with smart feedback
 * - Auto-complete predictions
 * - Field dependencies and smart defaults
 * - Contextual help and tips
 */
const SmartForm = ({
  fields = [],
  initialValues = {},
  onSubmit,
  onCancel,
  title,
  aiSuggestions = {},
  enableAI = true,
  isLoading = false
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const [validationMessages, setValidationMessages] = useState({});

  useEffect(() => {
    // Load AI suggestions
    if (enableAI && aiSuggestions) {
      setSuggestions(aiSuggestions);
    }
  }, [enableAI, aiSuggestions]);

  // Handle field change
  const handleChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: null
      }));
    }

    // Validate field
    validateField(fieldId, value);

    // Trigger dependent field updates
    updateDependentFields(fieldId, value);
  };

  // Validate individual field
  const validateField = (fieldId, value) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    let message = null;
    let type = 'info';

    // Required validation
    if (field.required && !value) {
      message = `${field.label} is required`;
      type = 'error';
    }

    // Custom validation
    if (field.validate && value) {
      const validationResult = field.validate(value, formData);
      if (validationResult) {
        message = validationResult;
        type = 'error';
      }
    }

    // AI-powered validation suggestions
    if (enableAI && value && !message) {
      const aiValidation = generateAIValidation(field, value);
      if (aiValidation) {
        message = aiValidation.message;
        type = aiValidation.type;
      }
    }

    setValidationMessages(prev => ({
      ...prev,
      [fieldId]: message ? { message, type } : null
    }));
  };

  // Generate AI validation
  const generateAIValidation = (field, value) => {
    // Simple AI validation logic (in real app, this would call ML service)
    if (field.type === 'number') {
      const numValue = parseFloat(value);
      if (field.id.includes('price') && numValue < 0) {
        return { message: 'Price should be positive', type: 'error' };
      }
      if (field.id.includes('discount') && numValue > 100) {
        return { message: 'Discount cannot exceed 100%', type: 'error' };
      }
    }

    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { message: 'Please enter a valid email address', type: 'error' };
      }
    }

    return null;
  };

  // Update dependent fields
  const updateDependentFields = (fieldId, value) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field || !field.affects) return;

    // Update dependent fields based on this field's value
    field.affects.forEach(affectedFieldId => {
      const affectedField = fields.find(f => f.id === affectedFieldId);
      if (affectedField && affectedField.computeValue) {
        const computedValue = affectedField.computeValue(formData, fieldId, value);
        if (computedValue !== undefined) {
          setFormData(prev => ({
            ...prev,
            [affectedFieldId]: computedValue
          }));
        }
      }
    });
  };

  // Apply AI suggestion
  const applySuggestion = (fieldId, suggestion) => {
    handleChange(fieldId, suggestion);
    setShowSuggestions(prev => ({
      ...prev,
      [fieldId]: false
    }));
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
      if (field.validate && formData[field.id]) {
        const error = field.validate(formData[field.id], formData);
        if (error) {
          newErrors[field.id] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Get validation icon
  const getValidationIcon = (type) => {
    switch (type) {
      case 'error': return <ErrorIcon fontSize="small" color="error" />;
      case 'warning': return <WarningIcon fontSize="small" color="warning" />;
      case 'success': return <SuccessIcon fontSize="small" color="success" />;
      default: return <AIIcon fontSize="small" color="info" />;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {title && (
        <Typography variant="h5" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
          {title}
        </Typography>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {fields.map(field => (
            <Grid item xs={12} sm={field.width || 6} key={field.id}>
              <Box>
                <TextField
                  fullWidth
                  label={field.label}
                  type={field.type || 'text'}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  required={field.required}
                  error={!!errors[field.id]}
                  helperText={errors[field.id]}
                  disabled={field.disabled || isLoading}
                  multiline={field.multiline}
                  rows={field.rows || 1}
                  select={field.select}
                  SelectProps={field.select ? { native: true } : undefined}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {enableAI && suggestions[field.id] && (
                          <Tooltip title="AI Suggestion Available">
                            <IconButton
                              size="small"
                              onClick={() => setShowSuggestions(prev => ({
                                ...prev,
                                [field.id]: !prev[field.id]
                              }))}
                            >
                              <SuggestionIcon fontSize="small" color="secondary" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </InputAdornment>
                    )
                  }}
                >
                  {field.select && field.options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </TextField>

                {/* Validation Message */}
                {validationMessages[field.id] && (
                  <Alert
                    severity={validationMessages[field.id].type}
                    icon={getValidationIcon(validationMessages[field.id].type)}
                    sx={{ mt: 1, py: 0 }}
                  >
                    <Typography variant="caption">
                      {validationMessages[field.id].message}
                    </Typography>
                  </Alert>
                )}

                {/* AI Suggestions */}
                {enableAI && suggestions[field.id] && showSuggestions[field.id] && (
                  <Collapse in={showSuggestions[field.id]}>
                    <Alert
                      severity="info"
                      icon={<AIIcon />}
                      sx={{
                        mt: 1,
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`
                      }}
                      action={
                        <IconButton
                          size="small"
                          onClick={() => setShowSuggestions(prev => ({
                            ...prev,
                            [field.id]: false
                          }))}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <Typography variant="caption" fontWeight="600" display="block" gutterBottom>
                        AI Suggestion:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {Array.isArray(suggestions[field.id]) ? (
                          suggestions[field.id].map((suggestion, index) => (
                            <Chip
                              key={index}
                              label={suggestion}
                              size="small"
                              onClick={() => applySuggestion(field.id, suggestion)}
                              sx={{ cursor: 'pointer' }}
                            />
                          ))
                        ) : (
                          <Chip
                            label={suggestions[field.id]}
                            size="small"
                            onClick={() => applySuggestion(field.id, suggestions[field.id])}
                            sx={{ cursor: 'pointer' }}
                          />
                        )}
                      </Box>
                    </Alert>
                  </Collapse>
                )}

                {/* Field help text */}
                {field.helpText && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {field.helpText}
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Form Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default SmartForm;
