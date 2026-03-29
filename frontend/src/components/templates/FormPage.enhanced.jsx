/**
 * Enhanced FormPage Template
 * Professional form page with validation, sections, and consistent layout
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  IconButton,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch,
  Radio,
  RadioGroup,
  Autocomplete,
  Paper,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Skeleton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  ArrowLeft,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  Trash2,
  Copy,
  Upload,
  Calendar,
  DollarSign,
  Percent,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  FileText,
  Image,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../common/ToastNotification';

/**
 * Professional FormPage Template
 * Use this as a base for all form pages in the application
 */
export default function FormPageTemplate({
  // Data
  initialValues = {},
  item = null,
  loading = false,
  saving = false,
  
  // Configuration
  title,
  subtitle,
  mode = 'create', // 'create' | 'edit' | 'view'
  steps = null, // For multi-step forms
  
  // Form Schema
  sections = [],
  
  // Validation
  validate = null,
  validationErrors = {},
  
  // Actions
  onSubmit,
  onCancel,
  onDraft,
  onReset,
  
  // Customization
  renderSection = null,
  renderField = null,
  children,
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Initialize values when item changes
  useEffect(() => {
    if (item) {
      setValues({ ...initialValues, ...item });
    } else {
      setValues(initialValues);
    }
  }, [item, initialValues]);
  
  // Include external validation errors
  useEffect(() => {
    if (validationErrors) {
      setErrors(validationErrors);
      setShowValidationErrors(true);
    }
  }, [validationErrors]);
  
  // Field change handler
  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };
  
  // Field blur handler
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Validate on blur
    if (validate) {
      const fieldErrors = validate({ [field]: values[field] }, values);
      if (fieldErrors) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
    }
  };
  
  // Validate all fields
  const validateForm = () => {
    if (!validate) return true;
    
    const allErrors = validate(values, values);
    if (allErrors && Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setShowValidationErrors(true);
      return false;
    }
    return true;
  };
  
  // Submit handler
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Form submission error');
    }
  };
  
  // Navigation handlers
  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };
  
  const handleNext = () => {
    if (steps && activeStep < steps.length - 1) {
      // Validate current step
      const currentStepFields = steps[activeStep].fields || [];
      const stepValues = {};
      currentStepFields.forEach((field) => {
        stepValues[field.name] = values[field.name];
      });
      
      if (validate) {
        const stepErrors = validate(stepValues, values);
        if (stepErrors && Object.keys(stepErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...stepErrors }));
          setShowValidationErrors(true);
          return;
        }
      }
      
      setActiveStep((prev) => prev + 1);
    }
  };
  
  const handleStepChange = (step) => {
    setActiveStep(step);
  };
  
  // Render field based on type
  const renderFieldComponent = (field) => {
    const {
      type = 'text',
      name,
      label,
      required = false,
      disabled = false,
      placeholder,
      helperText,
      startAdornment,
      endAdornment,
      options = [],
      multiline = false,
      rows = 3,
      fullWidth = true,
      sx = {},
      InputProps = {},
      ...rest
    } = field;
    
    const hasError = errors[name] && (touched[name] || showValidationErrors);
    
    const commonProps = {
      id: name,
      name,
      label,
      value: values[name] ?? '',
      onChange: (e) => handleChange(name, e.target.value),
      onBlur: () => handleBlur(name),
      error: hasError,
      helperText: hasError ? errors[name] : helperText,
      disabled: disabled || loading || saving,
      placeholder,
      required,
      fullWidth,
      sx: {
        '& .MuiInputLabel-root.Mui-required': {
          '&:after': {
            content: '" *"',
            color: 'error.main',
          },
        },
        ...sx,
      },
      ...rest,
    };
    
    // Add adornments
    const inputProps = {
      ...InputProps,
      startAdornment: startAdornment,
      endAdornment: endAdornment,
    };
    
    switch (type) {
      case 'textarea':
        return (
          <TextField
            {...commonProps}
            multiline={multiline}
            rows={rows}
            InputProps={inputProps}
          />
        );
      
      case 'select':
        return (
          <FormControl fullWidth error={hasError} required={required}>
            <InputLabel>{label}</InputLabel>
            <Select
              value={values[name] ?? ''}
              onChange={(e) => handleChange(name, e.target.value)}
              onBlur={() => handleBlur(name)}
              label={label}
              disabled={disabled || loading || saving}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {hasError && <FormHelperText>{errors[name]}</FormHelperText>}
          </FormControl>
        );
      
      case 'autocomplete':
        return (
          <Autocomplete
            value={values[name] ?? null}
            onChange={(e, value) => handleChange(name, value)}
            onBlur={() => handleBlur(name)}
            options={options}
            getOptionLabel={(option) => option.label || option}
            disabled={disabled || loading || saving}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={placeholder}
                error={hasError}
                helperText={hasError ? errors[name] : helperText}
                required={required}
              />
            )}
          />
        );
      
      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!values[name]}
                onChange={(e) => handleChange(name, e.target.checked)}
                onBlur={() => handleBlur(name)}
                disabled={disabled || loading || saving}
              />
            }
            label={label}
          />
        );
      
      case 'switch':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={!!values[name]}
                onChange={(e) => handleChange(name, e.target.checked)}
                onBlur={() => handleBlur(name)}
                disabled={disabled || loading || saving}
              />
            }
            label={label}
          />
        );
      
      case 'radio':
        return (
          <FormControl component="fieldset">
            <FormLabel component="legend">{label}</FormLabel>
            <RadioGroup
              value={values[name] ?? ''}
              onChange={(e) => handleChange(name, e.target.value)}
              onBlur={() => handleBlur(name)}
              row={field.row}
            >
              {options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio disabled={disabled || loading || saving} />}
                  label={option.label}
                  disabled={disabled || loading || saving}
                />
              ))}
            </RadioGroup>
            {hasError && <FormHelperText>{errors[name]}</FormHelperText>}
          </FormControl>
        );
      
      case 'date':
        return (
          <TextField
            {...commonProps}
            type="date"
            InputLabelProps={{ shrink: true }}
            InputProps={inputProps}
          />
        );
      
      case 'datetime':
        return (
          <TextField
            {...commonProps}
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            InputProps={inputProps}
          />
        );
      
      case 'number':
        return (
          <TextField
            {...commonProps}
            type="number"
            InputProps={{
              ...inputProps,
              inputProps: { min: field.min, max: field.max, step: field.step },
            }}
          />
        );
      
      case 'currency':
        return (
          <TextField
            {...commonProps}
            type="number"
            InputProps={{
              ...inputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <DollarSign size={18} color="#94A3B8" />
                </InputAdornment>
              ),
            }}
          />
        );
      
      case 'percentage':
        return (
          <TextField
            {...commonProps}
            type="number"
            InputProps={{
              ...inputProps,
              endAdornment: (
                <InputAdornment position="end">
                  <Percent size={18} color="#94A3B8" />
                </InputAdornment>
              ),
            }}
          />
        );
      
      case 'email':
        return (
          <TextField
            {...commonProps}
            type="email"
            InputProps={{
              ...inputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Mail size={18} color="#94A3B8" />
                </InputAdornment>
              ),
            }}
          />
        );
      
      case 'url':
        return (
          <TextField
            {...commonProps}
            type="url"
            InputProps={{
              ...inputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Globe size={18} color="#94A3B8" />
                </InputAdornment>
              ),
            }}
          />
        );
      
      case 'file':
        return (
          <Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload size={18} />}
              disabled={disabled || loading || saving}
              sx={{ mb: 1 }}
            >
              Upload File
              <input
                type="file"
                hidden
                onChange={(e) => handleChange(name, e.target.files[0])}
              />
            </Button>
            {values[name] && (
              <Typography variant="body2" color="text.secondary">
                {values[name].name || values[name]}
              </Typography>
            )}
            {hasError && (
              <FormHelperText error>{errors[name]}</FormHelperText>
            )}
          </Box>
        );
      
      default:
        return (
          <TextField
            {...commonProps}
            type={type}
            InputProps={inputProps}
          />
        );
    }
  };
  
  // Render section
  const renderSectionComponent = (section, index) => {
    const {
      title,
      description,
      icon: Icon,
      fields = [],
      collapsed = false,
      sx = {},
    } = section;
    
    if (renderSection) {
      return renderSection(section, values, handleChange, errors);
    }
    
    return (
      <Card key={index} sx={{ mb: 3, ...sx }}>
        <CardContent>
          {/* Section Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
            {Icon && (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: 'primary.50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color="#2563EB" />
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontSize: '1.125rem', fontWeight: 600, mb: 0.5 }}>
                {title}
              </Typography>
              {description && (
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Fields Grid */}
          <Grid container spacing={2.5}>
            {fields.map((field, fieldIndex) => (
              <Grid
                item
                xs={field.xs || 12}
                sm={field.sm || field.xs || 12}
                md={field.md || field.sm || field.xs || 12}
                lg={field.lg || field.md || field.sm || field.xs || 12}
                key={fieldIndex}
              >
                {renderFieldComponent(field)}
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton width={200} height={40} sx={{ mb: 2 }} />
          <Skeleton width={400} height={20} />
        </Box>
        {[...Array(3)].map((_, i) => (
          <Card key={i} sx={{ mb: 3 }}>
            <CardContent>
              <Skeleton width={150} height={24} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {[...Array(4)].map((_, j) => (
                  <Grid item xs={6} key={j}>
                    <Skeleton width="100%" height={56} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ mb: 4, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h1" sx={{ fontSize: '1.875rem', fontWeight: 700, mb: 0.5 }}>
                {mode === 'create' ? 'Create New' : mode === 'edit' ? 'Edit' : 'View'} {title}
              </Typography>
              {subtitle && (
                <Typography variant="body1" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<X size={18} />}
                onClick={handleBack}
                disabled={saving}
                sx={{ fontWeight: 600 }}
              >
                Cancel
              </Button>
              {mode !== 'view' && (
                <Button
                  variant="contained"
                  startIcon={<Save size={18} />}
                  onClick={handleSubmit}
                  loading={saving}
                  disabled={saving}
                  sx={{ fontWeight: 600 }}
                >
                  {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
                </Button>
              )}
            </Box>
          </Box>
          
          {/* Validation Errors Alert */}
          {showValidationErrors && Object.keys(errors).length > 0 && (
            <Alert
              severity="error"
              sx={{ mt: 3 }}
              icon={<AlertCircle size={20} />}
            >
              <AlertTitle>Validation Errors</AlertTitle>
              Please correct the following errors before continuing.
            </Alert>
          )}
        </Box>
        
        {/* Stepper for multi-step forms */}
        {steps && steps.length > 1 && (
          <>
            <Divider />
            <Box sx={{ px: 3, py: 2 }}>
              <Stepper
                activeStep={activeStep}
                orientation="horizontal"
                sx={{
                  '& .MuiStepConnector-root': {
                    '& .MuiStepConnector-line': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiStepLabel-label.Mui-completed': {
                    color: 'primary.main',
                  },
                  '& .MuiStepLabel-label.Mui-active': {
                    color: 'primary.main',
                    fontWeight: 600,
                  },
                }}
              >
                {steps.map((step, index) => (
                  <Step key={index}>
                    <StepLabel
                      onClick={() => handleStepChange(index)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {step.title}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </>
        )}
      </Box>
      
      {/* Form Content */}
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        {steps && steps.length > 1 ? (
          // Multi-step form
          <Box>
            {steps[activeStep].description && (
              <Alert severity="info" sx={{ mb: 3 }} icon={<Info size={20} />}>
                {steps[activeStep].description}
              </Alert>
            )}
            
            <Card>
              <CardContent>
                <Grid container spacing={2.5}>
                  {(steps[activeStep].fields || []).map((field, index) => (
                    <Grid
                      item
                      xs={field.xs || 12}
                      sm={field.sm || 12}
                      md={field.md || 12}
                      key={index}
                    >
                      {renderFieldComponent(field)}
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
            
            {/* Step Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep((prev) => prev - 1)}
                disabled={activeStep === 0}
                sx={{ fontWeight: 600 }}
              >
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  startIcon={<CheckCircle size={18} />}
                  sx={{ fontWeight: 600 }}
                >
                  {mode === 'create' ? 'Create' : 'Save Changes'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ChevronRight size={18} />}
                  sx={{ fontWeight: 600 }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        ) : (
          // Single-page form
          <>
            {sections.map((section, index) => renderSectionComponent(section, index))}
            
            {/* Custom children content */}
            {children}
            
            {/* Form Actions */}
            {mode !== 'view' && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 1.5,
                  mt: 3,
                  pt: 3,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {onDraft && (
                  <Button
                    variant="outlined"
                    onClick={onDraft}
                    sx={{ fontWeight: 600 }}
                  >
                    Save as Draft
                  </Button>
                )}
                {onReset && (
                  <Button
                    variant="outlined"
                    onClick={onReset}
                    startIcon={<X size={18} />}
                    sx={{ fontWeight: 600 }}
                  >
                    Reset
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  startIcon={<Save size={18} />}
                  loading={saving}
                  disabled={saving}
                  sx={{ fontWeight: 600, minWidth: 120 }}
                >
                  {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

/**
 * Field Group Component
 */
export function FieldGroup({ label, children, icon: Icon }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {Icon && <Icon size={18} color="#94A3B8" />}
        <Typography variant="subtitle2" fontWeight={600}>
          {label}
        </Typography>
      </Box>
      <Paper
        sx={{
          p: 2.5,
          bgcolor: 'background.subtle',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}

/**
 * Repeating Field Group (for dynamic lists)
 */
export function RepeatingFieldGroup({
  label,
  items = [],
  onAdd,
  onRemove,
  onChange,
  renderItem,
  maxItems,
}) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
            {label}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Plus size={16} />}
            onClick={onAdd}
            disabled={maxItems && items.length >= maxItems}
            sx={{ fontWeight: 600 }}
          >
            Add {label}
          </Button>
        </Box>
        
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No {label.toLowerCase()} added yet
          </Typography>
        ) : (
          items.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
                pb: 2,
                borderBottom: index < items.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ flex: 1 }}>
                {renderItem(item, index, onChange)}
              </Box>
              <IconButton
                size="small"
                onClick={() => onRemove(index)}
                sx={{ mt: 1 }}
              >
                <Trash2 size={18} color="#DC2626" />
              </IconButton>
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
}
