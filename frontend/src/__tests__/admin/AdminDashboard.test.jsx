import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../../pages/admin/AdminDashboard';

jest.mock('../../services/api');

describe('AdminDashboard', () => {
  it('should render admin dashboard', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/System Administration/i)).toBeInTheDocument();
    expect(screen.getByText(/System Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/User Management/i)).toBeInTheDocument();
  });
});
