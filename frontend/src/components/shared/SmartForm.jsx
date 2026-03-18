import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Button, Stack, Typography, Alert, Snackbar } from '@mui/material';
import { Save, RotateCcw, AlertTriangle } from 'lucide-react';

/**
 * SmartForm — Form wrapper with validation, auto-save, keyboard submit, dirty tracking.
 * Uses Yup for validation (already in project dependencies).
 */
const SmartForm = ({
  schema,
  initialValues = {},
  onSubmit,
  onAutoSave,
  onChange,
  layout = 'single',
  children,
  submitLabel = 'Save',
  showReset = false,
  showSubmit = true,
  autoSave = false,
  autoSaveDelay = 3000,
  readOnly = false,
  disabled = false,
  actions,
  sx = {},
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimer = useRef(null);
  const initialValuesRef = useRef(initialValues);

  // Update values when initialValues change
  useEffect(() => {
    const prev = JSON.stringify(initialValuesRef.current);
    const next = JSON.stringify(initialValues);
    if (prev !== next) {
      setValues(initialValues);
      setDirty(false);
      setErrors({});
      setTouched({});
      initialValuesRef.current = initialValues;
    }
  }, [initialValues]);

  // Validate a single field
  const validateField = useCallback(async (fieldName, fieldValue) => {
    if (!schema) return null;
    try {
      await schema.validateAt(fieldName, { ...values, [fieldName]: fieldValue });
      return null;
    } catch (err) {
      return err.message;
    }
  }, [schema, values]);

  // Validate all fields
  const validateAll = useCallback(async () => {
    if (!schema) return {};
    try {
      await schema.validate(values, { abortEarly: false });
      return {};
    } catch (err) {
      const fieldErrors = {};
      if (err.inner) {
        err.inner.forEach(e => {
          if (e.path && !fieldErrors[e.path]) {
            fieldErrors[e.path] = e.message;
          }
        });
      }
      return fieldErrors;
    }
  }, [schema, values]);

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    setDirty(true);
    setSubmitError(null);

    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    if (onChange) onChange({ ...values, [name]: value });

    // Auto-save
    if (autoSave && onAutoSave) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        onAutoSave({ ...values, [name]: value });
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }, autoSaveDelay);
    }
  }, [values, errors, autoSave, onAutoSave, autoSaveDelay, onChange]);

  // Handle field blur
  const handleBlur = useCallback(async (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const fieldError = await validateField(name, value);
    if (fieldError) {
      setErrors(prev => ({ ...prev, [name]: fieldError }));
    }
  }, [validateField]);

  // Handle submit
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const fieldErrors = await validateAll();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      // Mark all fields as touched
      const allTouched = {};
      Object.keys(fieldErrors).forEach(k => { allTouched[k] = true; });
      setTouched(prev => ({ ...prev, ...allTouched }));
      setSubmitting(false);
      return;
    }

    try {
      if (onSubmit) await onSubmit(values);
      setDirty(false);
    } catch (err) {
      setSubmitError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }, [values, validateAll, onSubmit]);

  // Keyboard submit (Ctrl+Enter)
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !readOnly && !disabled) {
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleSubmit, readOnly, disabled]);

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Reset form
  const handleReset = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
    setDirty(false);
    setSubmitError(null);
  }, []);

  // Get field props helper
  const getFieldProps = useCallback((fieldName) => ({
    name: fieldName,
    value: values[fieldName] ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched[fieldName] ? errors[fieldName] : undefined,
    disabled: disabled || submitting,
    readOnly,
  }), [values, errors, touched, handleChange, handleBlur, disabled, submitting, readOnly]);

  // Clone children with form context
  const enhancedChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;
    
    // If child has a name prop, inject field props
    if (child.props.name) {
      return React.cloneElement(child, {
        ...getFieldProps(child.props.name),
        ...child.props, // Allow explicit overrides
        error: (touched[child.props.name] ? errors[child.props.name] : undefined) || child.props.error,
      });
    }

    // For FormSection and other wrappers, pass down context
    return React.cloneElement(child, {
      formValues: values,
      formErrors: errors,
      formTouched: touched,
      getFieldProps,
      onChange: handleChange,
      onBlur: handleBlur,
      readOnly,
      disabled: disabled || submitting,
    });
  });

  const layoutSx = layout === 'two-column' ? {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: 2,
  } : {};

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ ...sx }}
      noValidate
    >
      {/* Unsaved changes indicator */}
      {dirty && !readOnly && (
        <Alert
          severity="info"
          icon={<AlertTriangle size={18} />}
          sx={{ mb: 2 }}
          action={autoSaved ? <Typography variant="caption" color="text.secondary">Auto-saved</Typography> : undefined}
        >
          You have unsaved changes.
        </Alert>
      )}

      {/* Submit error */}
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      {/* Form content */}
      <Box sx={layoutSx}>
        {enhancedChildren}
      </Box>

      {/* Action buttons */}
      {!readOnly && showSubmit && (
        <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
          {showReset && dirty && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleReset}
              startIcon={<RotateCcw size={16} />}
              disabled={submitting}
            >
              Reset
            </Button>
          )}
          {actions}
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save size={16} />}
            disabled={submitting || !dirty}
            sx={{ minWidth: 120 }}
          >
            {submitting ? 'Saving...' : submitLabel}
          </Button>
        </Stack>
      )}

      {/* Auto-save indicator */}
      <Snackbar
        open={autoSaved}
        autoHideDuration={2000}
        message="Draft auto-saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
};

export default SmartForm;
