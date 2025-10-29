import React from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const BusinessProfileStep = ({ data, onChange, errors = {} }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Box>
      <p>Step Component: BusinessProfileStep</p>
      {/* TODO: Add full form fields */}
    </Box>
  );
};

export default BusinessProfileStep;
