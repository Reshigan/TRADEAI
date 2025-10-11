/**
 * ProductForm Component Tests
 * Comprehensive testing for product data entry form
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ProductForm } from '../ProductForm';

// Mock API client
jest.mock('../../services/api', () => ({
  apiClient: {
    post: jest.fn(),
    put: jest.fn(),
  },
}));

describe('ProductForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders product form with all required fields', () => {
    render(
      <ProductForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );

    // Check for form fields
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sku/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/brand/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unit price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cost price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByRole('button', { name: /save product/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('validates required fields on form submission', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /save product/i });
    await user.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/product name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/sku is required/i)).toBeInTheDocument();
      expect(screen.getByText(/unit price is required/i)).toBeInTheDocument();
    });

    // Ensure onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );

    // Fill out the form
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/sku/i), 'TEST-001');
    await user.type(screen.getByLabelText(/description/i), 'Test product description');
    await user.type(screen.getByLabelText(/category/i), 'Electronics');
    await user.type(screen.getByLabelText(/brand/i), 'TestBrand');
    await user.type(screen.getByLabelText(/unit price/i), '99.99');
    await user.type(screen.getByLabelText(/cost price/i), '50.00');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save product/i });
    await user.click(submitButton);

    // Check that onSubmit was called with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'Test product description',
        category: 'Electronics',
        brand: 'TestBrand',
        unit_price: 99.99,
        cost_price: 50.00,
        currency: 'USD',
        status: 'active'
      });
    });
  });

  test('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});