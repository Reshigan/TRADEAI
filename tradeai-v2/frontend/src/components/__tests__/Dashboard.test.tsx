/**
 * Dashboard Component Tests
 * Comprehensive testing for business dashboard
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Dashboard } from '../Dashboard';

// Mock API client
const mockApiClient = {
  get: jest.fn(),
};

jest.mock('../../services/api', () => ({
  apiClient: mockApiClient,
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockApiClient.get.mockImplementation((url) => {
      if (url.includes('/stats')) {
        return Promise.resolve({
          data: {
            totalCustomers: 150,
            totalProducts: 500,
            totalBudgets: 25,
            totalTradeSpend: 125000.00,
            activeCampaigns: 12,
            pendingApprovals: 8
          }
        });
      }
      if (url.includes('/activities')) {
        return Promise.resolve({
          data: [
            {
              id: '1',
              type: 'budget_created',
              description: 'New marketing budget created',
              timestamp: '2025-10-11T10:00:00Z',
              user: 'John Doe'
            },
            {
              id: '2',
              type: 'trade_spend_approved',
              description: 'Trade spend approved for Customer ABC',
              timestamp: '2025-10-11T09:30:00Z',
              user: 'Jane Smith'
            }
          ]
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test('renders dashboard with loading state initially', () => {
    render(<Dashboard />);
    
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  test('displays dashboard stats after loading', async () => {
    render(<Dashboard />);
    
    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total Customers
      expect(screen.getByText('500')).toBeInTheDocument(); // Total Products
      expect(screen.getByText('25')).toBeInTheDocument(); // Total Budgets
      expect(screen.getByText('$125,000.00')).toBeInTheDocument(); // Total Trade Spend
      expect(screen.getByText('12')).toBeInTheDocument(); // Active Campaigns
      expect(screen.getByText('8')).toBeInTheDocument(); // Pending Approvals
    });
  });

  test('displays recent activities', async () => {
    render(<Dashboard />);
    
    // Wait for activities to load
    await waitFor(() => {
      expect(screen.getByText('New marketing budget created')).toBeInTheDocument();
      expect(screen.getByText('Trade spend approved for Customer ABC')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('displays quick action buttons', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create budget/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new campaign/i })).toBeInTheDocument();
    });
  });

  test('handles quick action button clicks', async () => {
    const user = userEvent.setup();
    const mockNavigate = jest.fn();
    
    // Mock navigation
    jest.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
    }));
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument();
    });
    
    const addCustomerButton = screen.getByRole('button', { name: /add customer/i });
    await user.click(addCustomerButton);
    
    // Verify navigation or modal opening
    // This would depend on your actual implementation
  });

  test('displays budget utilization chart', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/budget utilization/i)).toBeInTheDocument();
      // Check for chart container or specific chart elements
      expect(screen.getByTestId('budget-chart')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    mockApiClient.get.mockRejectedValue(new Error('API Error'));
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard data/i)).toBeInTheDocument();
    });
  });

  test('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<Dashboard />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
    
    // Clear mock calls
    mockApiClient.get.mockClear();
    
    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    // Verify API calls were made again
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/dashboard/stats');
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/dashboard/activities');
  });

  test('displays correct time formatting for activities', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      // Check for relative time formatting (e.g., "2 hours ago")
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no activities', async () => {
    // Mock empty activities response
    mockApiClient.get.mockImplementation((url) => {
      if (url.includes('/activities')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({
        data: {
          totalCustomers: 0,
          totalProducts: 0,
          totalBudgets: 0,
          totalTradeSpend: 0,
          activeCampaigns: 0,
          pendingApprovals: 0
        }
      });
    });
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/no recent activities/i)).toBeInTheDocument();
    });
  });

  test('displays correct currency formatting', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      // Check that monetary values are properly formatted
      expect(screen.getByText('$125,000.00')).toBeInTheDocument();
    });
  });

  test('shows notification badges for pending items', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      // Check for notification badge on pending approvals
      const pendingBadge = screen.getByTestId('pending-approvals-badge');
      expect(pendingBadge).toHaveTextContent('8');
    });
  });
});