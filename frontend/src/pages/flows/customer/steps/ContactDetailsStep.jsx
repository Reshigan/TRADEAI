import React, { useState } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Button,
  IconButton,
  Paper,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';
import {
  ContactMail as ContactIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';

const ContactDetailsStep = ({ data, onChange, errors = {} }) => {
  const [contacts, setContacts] = useState(data.contacts || [
    { name: '', position: '', email: '', phone: '', isPrimary: true }
  ]);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleContactChange = (index, field, value) => {
    const newContacts = [...contacts];
    newContacts[index] = {
      ...newContacts[index],
      [field]: value
    };
    
    // If setting as primary, unset others
    if (field === 'isPrimary' && value === true) {
      newContacts.forEach((contact, i) => {
        if (i !== index) contact.isPrimary = false;
      });
    }
    
    setContacts(newContacts);
    handleChange('contacts', newContacts);
  };

  const addContact = () => {
    const newContacts = [...contacts, { name: '', position: '', email: '', phone: '', isPrimary: false }];
    setContacts(newContacts);
    handleChange('contacts', newContacts);
  };

  const removeContact = (index) => {
    if (contacts.length > 1) {
      const newContacts = contacts.filter((_, i) => i !== index);
      // If we removed the primary contact, make the first one primary
      if (contacts[index].isPrimary && newContacts.length > 0) {
        newContacts[0].isPrimary = true;
      }
      setContacts(newContacts);
      handleChange('contacts', newContacts);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ContactIcon color="primary" />
        Contact Information
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Add contact persons for this customer. At least one contact is required. Mark the main contact as primary.
      </Typography>

      {contacts.map((contact, index) => (
        <Paper
          key={index}
          elevation={1}
          sx={{
            p: 3,
            mb: 3,
            border: contact.isPrimary ? '2px solid' : '1px solid',
            borderColor: contact.isPrimary ? 'primary.main' : 'divider',
            position: 'relative'
          }}
        >
          {/* Primary Badge */}
          {contact.isPrimary && (
            <Chip
              icon={<StarIcon />}
              label="Primary Contact"
              color="primary"
              size="small"
              sx={{ position: 'absolute', top: 16, right: 16 }}
            />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Contact {index + 1}
            </Typography>
            {contacts.length > 1 && (
              <IconButton
                color="error"
                size="small"
                onClick={() => removeContact(index)}
                title="Remove contact"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>

          <Grid container spacing={2}>
            {/* Full Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Full Name"
                value={contact.name || ''}
                onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                error={!!errors[`contacts.${index}.name`]}
                helperText={errors[`contacts.${index}.name`] || 'Contact person full name'}
                placeholder="e.g., John Doe"
              />
            </Grid>

            {/* Position/Title */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Position/Title"
                value={contact.position || ''}
                onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                error={!!errors[`contacts.${index}.position`]}
                helperText={errors[`contacts.${index}.position`] || 'Job title or role'}
                placeholder="e.g., Purchasing Manager"
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="email"
                label="Email Address"
                value={contact.email || ''}
                onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                error={!!errors[`contacts.${index}.email`]}
                helperText={errors[`contacts.${index}.email`] || 'Business email address'}
                placeholder="john.doe@company.com"
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="tel"
                label="Phone Number"
                value={contact.phone || ''}
                onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                error={!!errors[`contacts.${index}.phone`]}
                helperText={errors[`contacts.${index}.phone`] || 'Contact phone number'}
                placeholder="+1 (555) 123-4567"
              />
            </Grid>

            {/* Set as Primary */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={contact.isPrimary || false}
                    onChange={(e) => handleContactChange(index, 'isPrimary', e.target.checked)}
                    icon={<StarBorderIcon />}
                    checkedIcon={<StarIcon />}
                  />
                }
                label="Set as primary contact"
              />
            </Grid>
          </Grid>
        </Paper>
      ))}

      {/* Add Contact Button */}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addContact}
        fullWidth
        sx={{ mb: 3 }}
      >
        Add Another Contact
      </Button>

      <Divider sx={{ my: 3 }} />

      {/* Address Section */}
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
        <ContactIcon color="primary" />
        Address Information
      </Typography>

      <Grid container spacing={3}>
        {/* Street Address */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Street Address"
            value={data.address?.street || ''}
            onChange={(e) => handleChange('address', { ...(data.address || {}), street: e.target.value })}
            error={!!errors['address.street']}
            helperText={errors['address.street'] || 'Street address including building/unit number'}
            placeholder="123 Main Street, Suite 100"
          />
        </Grid>

        {/* City */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="City"
            value={data.address?.city || ''}
            onChange={(e) => handleChange('address', { ...(data.address || {}), city: e.target.value })}
            error={!!errors['address.city']}
            helperText={errors['address.city']}
            placeholder="e.g., New York"
          />
        </Grid>

        {/* State/Province */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="State/Province"
            value={data.address?.state || ''}
            onChange={(e) => handleChange('address', { ...(data.address || {}), state: e.target.value })}
            error={!!errors['address.state']}
            helperText={errors['address.state']}
            placeholder="e.g., NY"
          />
        </Grid>

        {/* Country */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Country"
            value={data.address?.country || ''}
            onChange={(e) => handleChange('address', { ...(data.address || {}), country: e.target.value })}
            error={!!errors['address.country']}
            helperText={errors['address.country']}
            placeholder="e.g., United States"
          />
        </Grid>

        {/* Postal Code */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Postal/ZIP Code"
            value={data.address?.postalCode || ''}
            onChange={(e) => handleChange('address', { ...(data.address || {}), postalCode: e.target.value })}
            error={!!errors['address.postalCode']}
            helperText={errors['address.postalCode']}
            placeholder="e.g., 10001"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContactDetailsStep;
