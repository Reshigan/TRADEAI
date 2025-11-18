// TRADEAI v2.0 - Dashboard Component Tests for 100% Coverage

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import Dashboard from '../../components/Dashboard';
import { enterpriseTheme } from '../../theme/enterpriseTheme';
import * as analyticsService from '../../services/analyticsService';

// Mock services
jest.mock('../../services/analyticsService');
jest.mock('../../services/authService');

// Mock chart components to avoid canvas issues
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={enterpriseTheme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

// Mock data
const mockDashboardData = {
  summary: {
    totalBudget: 1000000,
    spentAmount: 750000,
    remainingBudget: 250000,
    activePromotions: 15,
    pendingApprovals: 8,
    completedActivities: 142
  },
  chartData: {
    spendTrend: [
      { month: 'Jan', amount: 50000 },
      { month: 'Feb', amount: 75000 },
      { month: 'Mar', amount: 90000 }
    ]
  }
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService.getDashboardSummary.mockResolvedValue(mockDashboardData.summary);
    analyticsService.getSpendTrend.mockResolvedValue(mockDashboardData.chartData.spendTrend);
  });

  test('renders dashboard without crashing', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('displays summary data correctly', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('$1,000,000')).toBeInTheDocument();
      expect(screen.getByText('$750,000')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  test('handles error states gracefully', async () => {
    analyticsService.getDashboardSummary.mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard data')).toBeInTheDocument();
    });
  });
});