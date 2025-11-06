import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Container,
  Alert,
  Snackbar,
  Typography,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

import BasicTransactionStep from './steps/BasicTransactionStep';
import LineItemsStep from './steps/LineItemsStep';
import PaymentTermsStep from './steps/PaymentTermsStep';
import ReviewSubmitStep from './steps/ReviewSubmitStep';

const steps = [
  'Transaction Details',
  'Line Items',
  'Payment Terms',
  'Review & Submit'
];

const STORAGE_KEY = 'transaction_entry_draft';

export default function TransactionEntryFlow() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    transactionType: '',
    transactionDate: new Date(),
    customerId: '',
    vendorId: '',
    currency: 'USD',
    contractId: '',
    notes: '',
    items: [],
    amount: {
      gross: 0,
      discount: 0,
      tax: 0,
      net: 0
    },
    paymentMethod: '',
    paymentTerms: '',
    paymentDueDate: null,
    paymentReferenceNumber: '',
    customPaymentTerms: ''
  });
  const [errors, setErrors] = useState({});
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadDraft();
    loadReferenceData();
  }, []);

  useEffect(() => {
    saveDraft();
  }, [formData]);

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        // Convert date strings back to Date objects
        if (draft.transactionDate) {
          draft.transactionDate = new Date(draft.transactionDate);
        }
        if (draft.paymentDueDate) {
          draft.paymentDueDate = new Date(draft.paymentDueDate);
        }
        setFormData(draft);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  const loadReferenceData = async () => {
    setLoading(true);
    try {
      const [customersRes, vendorsRes, productsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/vendors'),
        api.get('/products')
      ]);

      setCustomers(customersRes.data.data || customersRes.data.customers || []);
      setVendors(vendorsRes.data.data || vendorsRes.data.vendors || []);
      setProducts(productsRes.data.data || productsRes.data.products || []);
    } catch (error) {
      console.error('Failed to load reference data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load reference data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.transactionType) {
        newErrors.transactionType = 'Transaction type is required';
      }
      if (!formData.transactionDate) {
        newErrors.transactionDate = 'Transaction date is required';
      }
      if (!formData.customerId) {
        newErrors.customerId = 'Customer is required';
      }
    }

    if (step === 1) {
      if (!formData.items || formData.items.length === 0) {
        newErrors.items = 'At least one line item is required';
      } else {
        formData.items.forEach((item, index) => {
          if (!item.productId) {
            newErrors[`items.${index}.productId`] = 'Product is required';
          }
          if (!item.quantity || item.quantity <= 0) {
            newErrors[`items.${index}.quantity`] = 'Valid quantity is required';
          }
          if (!item.unitPrice || item.unitPrice < 0) {
            newErrors[`items.${index}.unitPrice`] = 'Valid unit price is required';
          }
        });
      }
    }

    if (step === 2) {
      if (!formData.paymentMethod) {
        newErrors.paymentMethod = 'Payment method is required';
      }
      if (!formData.paymentTerms) {
        newErrors.paymentTerms = 'Payment terms are required';
      }
      if (formData.paymentTerms === 'custom' && !formData.customPaymentTerms) {
        newErrors.customPaymentTerms = 'Custom payment terms description is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setSnackbar({
        open: true,
        message: 'Please fix the errors before proceeding',
        severity: 'error'
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      setSnackbar({
        open: true,
        message: 'Please complete all required fields',
        severity: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      // Prepare submission data
      const submissionData = {
        transactionType: formData.transactionType,
        transactionDate: formData.transactionDate,
        customerId: formData.customerId,
        vendorId: formData.vendorId || undefined,
        currency: formData.currency,
        contractId: formData.contractId || undefined,
        items: formData.items.map(item => ({
          productId: item.productId,
          sku: item.sku,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount || 0),
          tax: parseFloat(item.taxRate || 0) * parseFloat(item.unitPrice) * parseFloat(item.quantity) / 100,
          total: item.total
        })),
        payment: {
          method: formData.paymentMethod,
          terms: formData.paymentTerms,
          dueDate: formData.paymentDueDate,
          referenceNumber: formData.paymentReferenceNumber || undefined
        }
      };

      // Add notes if provided
      if (formData.notes) {
        submissionData.notes = formData.notes;
      }

      // Add custom payment terms if applicable
      if (formData.paymentTerms === 'custom' && formData.customPaymentTerms) {
        submissionData.payment.customTerms = formData.customPaymentTerms;
      }

      const response = await api.post('/transactions', submissionData);

      setSnackbar({
        open: true,
        message: 'Transaction created successfully!',
        severity: 'success'
      });

      clearDraft();

      // Redirect to transaction detail page after short delay
      setTimeout(() => {
        navigate(`/transactions/${response.data.data._id}`);
      }, 1500);

    } catch (error) {
      console.error('Failed to submit transaction:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create transaction',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (newData) => {
    setFormData(newData);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <BasicTransactionStep
            data={formData}
            errors={errors}
            onChange={handleFormChange}
            customers={customers}
            vendors={vendors}
          />
        );
      case 1:
        return (
          <LineItemsStep
            data={formData}
            errors={errors}
            onChange={handleFormChange}
            products={products}
          />
        );
      case 2:
        return (
          <PaymentTermsStep
            data={formData}
            errors={errors}
            onChange={handleFormChange}
          />
        );
      case 3:
        return (
          <ReviewSubmitStep
            data={formData}
            customers={customers}
            products={products}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2 }}>
          Loading reference data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Create New Transaction
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Follow the steps below to create a new transaction
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ mb: 4, minHeight: 400 }}>
          {getStepContent(activeStep)}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            size="large"
          >
            Back
          </Button>

          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Step {activeStep + 1} of {steps.length}
            </Typography>
          </Box>

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={submitting ? null : <CheckCircleIcon />}
            >
              {submitting ? 'Submitting...' : 'Submit Transaction'}
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
            >
              Next
            </Button>
          )}
        </Box>

        {/* Auto-save indicator */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            <SaveIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Progress is automatically saved
          </Typography>
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
