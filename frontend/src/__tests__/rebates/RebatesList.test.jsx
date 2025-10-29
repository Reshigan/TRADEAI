import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RebatesList from '../../pages/rebates/RebatesList';

jest.mock('../../services/api');

describe('RebatesList', () => {
  it('should render rebates list', () => {
    render(
      <BrowserRouter>
        <RebatesList />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Rebates Management/i)).toBeInTheDocument();
  });
});
