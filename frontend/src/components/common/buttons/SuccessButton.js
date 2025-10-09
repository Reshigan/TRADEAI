/**
 * Success/Green Action Button Component
 * Used for approve, complete, resolve, and other positive actions
 */

import React from 'react';
import PrimaryButton from './PrimaryButton';
import PropTypes from 'prop-types';

const SuccessButton = ({
  children,
  ...rest
}) => {
  return (
    <PrimaryButton
      color="success"
      {...rest}
    >
      {children}
    </PrimaryButton>
  );
};

SuccessButton.propTypes = {
  children: PropTypes.node.isRequired
};

export default SuccessButton;
