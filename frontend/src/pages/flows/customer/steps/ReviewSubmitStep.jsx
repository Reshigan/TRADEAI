import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  ContactMail as ContactIcon,
  Payment as PaymentIcon,
  CardGiftcard as RebateIcon,
  Psychology as AIIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { formatLabel } from '../../../../utils/formatters';

const ReviewSubmitStep= ({ data, onChange, errors = {}, onEditStep }) => {
  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span style={{ color: '#999', fontStyle: 'italic' }}>Not provided</span>;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return value.toString();
  };

  const renderSection = (title, icon, step, fields) => (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            {icon}
            <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
          </Box>
          {onEditStep && (
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onEditStep(step);
              }}
            >
              Edit
            </Button>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {fields.map(({ label, value, fullWidth }) => (
            <Grid item xs={12} sm={fullWidth ? 12 : 6} key={label}>
              <Typography variant="caption" color="text.secondary" display="block">
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {renderValue(value)}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircleIcon color="primary" />
        Review & Submit
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Please review all information before submitting. You can edit any section by clicking the "Edit" button.
      </Typography>

      {/* Validation Warnings */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Please fix the following errors before submitting:
          </Typography>
          <List dense>
            {Object.entries(errors).map(([field, message]) => (
              <ListItem key={field} disablePadding>
                <ListItemText primary={`• ${field}: ${message}`} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Basic Information */}
      {renderSection(
        'Basic Information',
        <BusinessIcon color="primary" />,
        0,
        [
          { label: 'Company Name', value: data.name },
          { label: 'Customer Code', value: data.code },
          { label: 'Customer Type', value: data.customerType },
          { label: 'Channel', value: data.channel },
          { label: 'Tier', value: data.tier },
          { label: 'SAP Customer ID', value: data.sapCustomerId },
          { label: 'Status', value: data.status },
          { label: 'Tags', value: data.tags, fullWidth: true }
        ]
      )}

      {/* Business Profile */}
      {renderSection(
        'Business Profile & Performance',
        <BusinessIcon color="primary" />,
        1,
        [
          { label: 'Last Year Sales', value: data.performance?.lastYearSales ? `$${data.performance.lastYearSales.toLocaleString()}` : '' },
          { label: 'Current Year Target', value: data.performance?.currentYearTarget ? `$${data.performance.currentYearTarget.toLocaleString()}` : '' },
          { label: 'Current Year Actual', value: data.performance?.currentYearActual ? `$${data.performance.currentYearActual.toLocaleString()}` : '' },
          { label: 'Growth Rate', value: data.performance?.growthRate ? `${data.performance.growthRate}%` : '' },
          { label: 'Market Share', value: data.performance?.marketShare ? `${data.performance.marketShare}%` : '' },
          { label: 'Compliance Status', value: data.complianceStatus },
          { label: 'Customer Group', value: data.customerGroup },
          { label: 'Business Description', value: data.businessDescription, fullWidth: true },
          { label: 'Internal Notes', value: data.notes, fullWidth: true }
        ]
      )}

      {/* Contact Information */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <ContactIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">Contact Information</Typography>
            </Box>
            {onEditStep && (
              <Button size="small" startIcon={<EditIcon />} onClick={(e) => { e.stopPropagation(); onEditStep(2); }}>
                Edit
              </Button>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {/* Contacts */}
          <Typography variant="subtitle2" gutterBottom>Contacts</Typography>
          {data.contacts && data.contacts.length > 0 ? (
            data.contacts.map((contact, index) => (
              <Paper key={index} elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold">{contact.name || 'Unnamed Contact'}</Typography>
                  {contact.isPrimary && <Chip label="Primary" color="primary" size="small" />}
                </Box>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Position</Typography>
                    <Typography variant="body2">{contact.position || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body2">{contact.email || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                    <Typography variant="body2">{contact.phone || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No contacts added
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Address */}
          <Typography variant="subtitle2" gutterBottom>Address</Typography>
          {data.address ? (
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2">
                {data.address.street}<br />
                {data.address.city}, {data.address.state} {data.address.postalCode}<br />
                {data.address.country}
              </Typography>
            </Paper>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No address provided
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Payment Terms */}
      {renderSection(
        'Payment Terms & Financial Details',
        <PaymentIcon color="primary" />,
        3,
        [
          { label: 'Credit Limit', value: data.creditLimit ? `$${parseFloat(data.creditLimit).toLocaleString()}` : '' },
          { label: 'Payment Terms', value: data.paymentTerms },
          { label: 'Currency', value: data.currency },
          { label: 'Tax ID', value: data.taxId },
          { label: 'Bank Name', value: data.bankDetails?.bankName },
          { label: 'Account Holder', value: data.bankDetails?.accountHolderName },
          { label: 'Account Number', value: data.bankDetails?.accountNumber },
          { label: 'Routing Number', value: data.bankDetails?.routingNumber }
        ]
      )}

      {/* Trading Terms */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <RebateIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">Rebate & Trading Terms</Typography>
            </Box>
            {onEditStep && (
              <Button size="small" startIcon={<EditIcon />} onClick={(e) => { e.stopPropagation(); onEditStep(4); }}>
                Edit
              </Button>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {/* Retro-Active Rebate */}
          <Typography variant="subtitle2" gutterBottom>Retro-Active Rebate</Typography>
          <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'success.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Percentage</Typography>
                <Typography variant="body2">{data.tradingTerms?.retroActive?.percentage || 0}%</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Valid From</Typography>
                <Typography variant="body2">{data.tradingTerms?.retroActive?.validFrom || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Valid To</Typography>
                <Typography variant="body2">{data.tradingTerms?.retroActive?.validTo || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Prompt Payment */}
          <Typography variant="subtitle2" gutterBottom>Prompt Payment Discount</Typography>
          <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'info.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Percentage</Typography>
                <Typography variant="body2">{data.tradingTerms?.promptPayment?.percentage || 0}%</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Days</Typography>
                <Typography variant="body2">{data.tradingTerms?.promptPayment?.days || 0} days</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Volume Rebate Tiers */}
          <Typography variant="subtitle2" gutterBottom>Volume Rebate Tiers</Typography>
          {data.tradingTerms?.volumeRebate && data.tradingTerms.volumeRebate.length > 0 ? (
            data.tradingTerms.volumeRebate.map((tier, index) => (
              <Paper key={index} elevation={0} sx={{ p: 2, mb: 1, bgcolor: 'warning.50' }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  {tier.tierName || `Tier ${index + 1}`}
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Min Volume</Typography>
                    <Typography variant="body2">${tier.minVolume?.toLocaleString() || 0}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Max Volume</Typography>
                    <Typography variant="body2">${tier.maxVolume?.toLocaleString() || 0}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Rebate</Typography>
                    <Typography variant="body2">{tier.percentage || 0}%</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Scope</Typography>
                    <Typography variant="body2">{tier.productScope || 'all'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No volume rebate tiers configured
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* AI Insights */}
      {data.aiInsights && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">AI Analysis Summary</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50' }}>
                  <Typography variant="caption" color="text.secondary">Risk Score</Typography>
                  <Typography variant="h5" fontWeight="bold">{data.aiInsights.riskScore}/100</Typography>
                  <Chip label={formatLabel(data.aiInsights.riskLevel)} color={data.aiInsights.riskColor} size="small" sx={{ mt: 1 }} />
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
                  <Typography variant="caption" color="text.secondary">Credit Score</Typography>
                  <Typography variant="h5" fontWeight="bold">{data.aiInsights.creditScore}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                  <Typography variant="caption" color="text.secondary">Predicted LTV</Typography>
                  <Typography variant="h5" fontWeight="bold">${data.aiInsights.predictedLTV.toLocaleString()}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                  <Typography variant="caption" color="text.secondary">Segment</Typography>
                  <Typography variant="h5" fontWeight="bold">{data.aiInsights.segment}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Ready to Submit */}
      <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Ready to submit!</strong> Review all sections above and click "Submit" when you're ready to create this customer.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ReviewSubmitStep;
