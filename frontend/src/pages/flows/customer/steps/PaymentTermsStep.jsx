import React from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const PaymentTermsStep = ({ data, onChange, errors = {} }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Box>
      <p>Step Component: PaymentTermsStep</p>
      {/* TODO: Add full form fields */}
    </Box>
  );
};

export default PaymentTermsStep;
