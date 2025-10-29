import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CustomerFlow from '../../pages/flows/CustomerFlow';

describe('CustomerFlow', () => {
  it('should render without crashing', () => {
    render(
      <BrowserRouter>
        <CustomerFlow />
      </BrowserRouter>
    );
    expect(screen.getByText(/Customer Onboarding/i)).toBeInTheDocument();
  });

  // TODO: Add more comprehensive tests
});
