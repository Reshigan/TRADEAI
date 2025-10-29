import React from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const ReviewSubmitStep = ({ data, onChange, errors = {} }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Box>
      <p>Step Component: ReviewSubmitStep</p>
      {/* TODO: Add full form fields */}
    </Box>
  );
};

export default ReviewSubmitStep;
