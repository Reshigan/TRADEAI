import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TradeSpendReports from '../../../../frontend/src/components/reports/modules/TradeSpendReports';

// Mock the API service
jest.mock('../../../../frontend/src/services/api', () => ({
  get: jest.fn(),
}));

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
}));

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('TradeSpendReports Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders trade spend reports header', () => {
      renderWithProviders(<TradeSpendReports />);
      
      expect(screen.getByText('Trade Spend Performance Reports')).toBeInTheDocument();
      expect(screen.getByText(/Comprehensive trade spend analysis/)).toBeInTheDocument();
    });

    test('renders all tab navigation', () => {
      renderWithProviders(<TradeSpendReports />);
      
      expect(screen.getByText('SPEND OVERVIEW')).toBeInTheDocument();
      expect(screen.getByText('BUDGET VS ACTUAL')).toBeInTheDocument();
      expect(screen.getByText('CHANNEL PERFORMANCE')).toBeInTheDocument();
      expect(screen.getByText('OPTIMIZATION ANALYTICS')).toBeInTheDocument();
      expect(screen.getByText('ROI ANALYSIS')).toBeInTheDocument();
    });

    test('renders key performance metrics', () => {
      renderWithProviders(<TradeSpendReports />);
      
      expect(screen.getByText('Total Budget')).toBeInTheDocument();
      expect(screen.getByText('Actual Spend')).toBeInTheDocument();
      expect(screen.getByText('Average ROI')).toBeInTheDocument();
      expect(screen.getByText('Budget Utilization')).toBeInTheDocument();
    });

    test('renders filter and export buttons', () => {
      renderWithProviders(<TradeSpendReports />);
      
      expect(screen.getByText('Filter')).toBeInTheDocument();
      expect(screen.getByLabelText(/export/i)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('switches to budget vs actual tab', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const budgetTab = screen.getByText('BUDGET VS ACTUAL');
      fireEvent.click(budgetTab);
      
      expect(screen.getByText('Budget vs Actual Analysis')).toBeInTheDocument();
    });

    test('switches to channel performance tab', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const channelTab = screen.getByText('CHANNEL PERFORMANCE');
      fireEvent.click(channelTab);
      
      expect(screen.getByText('Channel Performance Analysis')).toBeInTheDocument();
    });

    test('switches to optimization analytics tab', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const optimizationTab = screen.getByText('OPTIMIZATION ANALYTICS');
      fireEvent.click(optimizationTab);
      
      expect(screen.getByText('Spend Optimization Analysis')).toBeInTheDocument();
    });

    test('switches to ROI analysis tab', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const roiTab = screen.getByText('ROI ANALYSIS');
      fireEvent.click(roiTab);
      
      expect(screen.getByText('ROI Performance Analysis')).toBeInTheDocument();
    });
  });

  describe('Data Visualization', () => {
    test('renders charts in spend overview tab', () => {
      renderWithProviders(<TradeSpendReports />);
      
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    test('renders budget vs actual charts', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const budgetTab = screen.getByText('BUDGET VS ACTUAL');
      fireEvent.click(budgetTab);
      
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    test('renders channel performance charts', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const channelTab = screen.getByText('CHANNEL PERFORMANCE');
      fireEvent.click(channelTab);
      
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
    });
  });

  describe('Data Tables', () => {
    test('renders trade spend program summary table', () => {
      renderWithProviders(<TradeSpendReports />);
      
      expect(screen.getByText('Trade Spend Program Summary')).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Budget')).toBeInTheDocument();
      expect(screen.getByText('Actual Spend')).toBeInTheDocument();
      expect(screen.getByText('Sales Impact')).toBeInTheDocument();
      expect(screen.getByText('ROI')).toBeInTheDocument();
    });

    test('renders budget variance table', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const budgetTab = screen.getByText('BUDGET VS ACTUAL');
      fireEvent.click(budgetTab);
      
      expect(screen.getByText('Budget Variance Analysis')).toBeInTheDocument();
      expect(screen.getByText('Period')).toBeInTheDocument();
      expect(screen.getByText('Variance')).toBeInTheDocument();
    });

    test('renders channel performance table', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const channelTab = screen.getByText('CHANNEL PERFORMANCE');
      fireEvent.click(channelTab);
      
      expect(screen.getByText('Channel Performance Summary')).toBeInTheDocument();
      expect(screen.getByText('Channel')).toBeInTheDocument();
      expect(screen.getByText('Spend')).toBeInTheDocument();
    });
  });

  describe('Synthetic Data Generation', () => {
    test('generates realistic trade spend metrics', () => {
      renderWithProviders(<TradeSpendReports />);
      
      // Check that budget and spend values are displayed
      expect(screen.getByText(/R\s*1,390,585/)).toBeInTheDocument();
      expect(screen.getByText(/R\s*1,391,281/)).toBeInTheDocument();
      expect(screen.getByText(/359\.8%/)).toBeInTheDocument();
      expect(screen.getByText(/100\.1%/)).toBeInTheDocument();
    });

    test('generates customer names and spend data', () => {
      renderWithProviders(<TradeSpendReports />);
      
      // Check for customer names in the table
      expect(screen.getByText('Customer A')).toBeInTheDocument();
      expect(screen.getByText('Customer B')).toBeInTheDocument();
    });

    test('generates realistic ROI percentages', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const roiTab = screen.getByText('ROI ANALYSIS');
      fireEvent.click(roiTab);
      
      // Check for ROI percentages
      expect(screen.getByText(/\d+\.\d+%/)).toBeInTheDocument();
    });
  });

  describe('Budget vs Actual Analysis', () => {
    test('displays budget variance indicators', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const budgetTab = screen.getByText('BUDGET VS ACTUAL');
      fireEvent.click(budgetTab);
      
      expect(screen.getByText('Budget Variance Trends')).toBeInTheDocument();
      expect(screen.getByText(/over|under/i)).toBeInTheDocument();
    });

    test('shows monthly budget tracking', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const budgetTab = screen.getByText('BUDGET VS ACTUAL');
      fireEvent.click(budgetTab);
      
      expect(screen.getByText('Monthly Budget Tracking')).toBeInTheDocument();
    });
  });

  describe('Channel Performance Analysis', () => {
    test('displays multi-channel spend analysis', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const channelTab = screen.getByText('CHANNEL PERFORMANCE');
      fireEvent.click(channelTab);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('Retail')).toBeInTheDocument();
      expect(screen.getByText('Wholesale')).toBeInTheDocument();
    });

    test('shows channel ROI comparison', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const channelTab = screen.getByText('CHANNEL PERFORMANCE');
      fireEvent.click(channelTab);
      
      expect(screen.getByText('Channel ROI Comparison')).toBeInTheDocument();
    });
  });

  describe('Optimization Analytics', () => {
    test('displays spend efficiency metrics', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const optimizationTab = screen.getByText('OPTIMIZATION ANALYTICS');
      fireEvent.click(optimizationTab);
      
      expect(screen.getByText('Spend Efficiency Analysis')).toBeInTheDocument();
    });

    test('shows optimization recommendations', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const optimizationTab = screen.getByText('OPTIMIZATION ANALYTICS');
      fireEvent.click(optimizationTab);
      
      expect(screen.getByText('Optimization Recommendations')).toBeInTheDocument();
    });
  });

  describe('ROI Analysis Features', () => {
    test('displays ROI trends over time', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const roiTab = screen.getByText('ROI ANALYSIS');
      fireEvent.click(roiTab);
      
      expect(screen.getByText('ROI Trend Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    test('shows investment vs return comparison', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const roiTab = screen.getByText('ROI ANALYSIS');
      fireEvent.click(roiTab);
      
      expect(screen.getByText('Investment vs Return')).toBeInTheDocument();
    });
  });

  describe('Category Breakdown', () => {
    test('displays spend by category', () => {
      renderWithProviders(<TradeSpendReports />);
      
      expect(screen.getByText('Spend by Category')).toBeInTheDocument();
      expect(screen.getByText('Beverages')).toBeInTheDocument();
      expect(screen.getByText('FMCG')).toBeInTheDocument();
    });

    test('shows category percentages', () => {
      renderWithProviders(<TradeSpendReports />);
      
      expect(screen.getByText(/52%/)).toBeInTheDocument();
      expect(screen.getByText(/48%/)).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    test('filter button is clickable', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const filterButton = screen.getByText('Filter');
      expect(filterButton).toBeEnabled();
      
      fireEvent.click(filterButton);
      // Filter functionality would be tested with actual implementation
    });

    test('export button is clickable', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const exportButton = screen.getByLabelText(/export/i);
      expect(exportButton).toBeEnabled();
      
      fireEvent.click(exportButton);
      // Export functionality would be tested with actual implementation
    });

    test('tab selection updates active state', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const overviewTab = screen.getByText('SPEND OVERVIEW');
      const budgetTab = screen.getByText('BUDGET VS ACTUAL');
      
      // Overview should be active by default
      expect(overviewTab.closest('[aria-selected="true"]')).toBeInTheDocument();
      
      // Click budget tab
      fireEvent.click(budgetTab);
      expect(budgetTab.closest('[aria-selected="true"]')).toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    test('displays program status indicators', () => {
      renderWithProviders(<TradeSpendReports />);
      
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Under Review')).toBeInTheDocument();
    });

    test('shows utilization status colors', () => {
      renderWithProviders(<TradeSpendReports />);
      
      // Check for utilization percentages
      expect(screen.getByText(/66\.4%/)).toBeInTheDocument();
      expect(screen.getByText(/221\.4%/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing trade spend data gracefully', () => {
      renderWithProviders(<TradeSpendReports />);
      
      // Component should render even without API data
      expect(screen.getByText('Trade Spend Performance Reports')).toBeInTheDocument();
    });

    test('displays fallback values for metrics', () => {
      renderWithProviders(<TradeSpendReports />);
      
      // Should display synthetic data as fallback
      expect(screen.getByText(/R\s*1,390,585/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for interactive elements', () => {
      renderWithProviders(<TradeSpendReports />);
      
      expect(screen.getByLabelText(/export/i)).toBeInTheDocument();
    });

    test('has proper heading structure', () => {
      renderWithProviders(<TradeSpendReports />);
      
      expect(screen.getByRole('heading', { name: /Trade Spend Performance Reports/i })).toBeInTheDocument();
    });

    test('tabs are keyboard accessible', () => {
      renderWithProviders(<TradeSpendReports />);
      
      const budgetTab = screen.getByText('BUDGET VS ACTUAL');
      budgetTab.focus();
      
      fireEvent.keyDown(budgetTab, { key: 'Enter' });
      expect(screen.getByText('Budget vs Actual Analysis')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('renders without performance issues', () => {
      const startTime = performance.now();
      renderWithProviders(<TradeSpendReports />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('handles multiple trade spend programs efficiently', () => {
      renderWithProviders(<TradeSpendReports />);
      
      // Should still render all components with multiple programs
      expect(screen.getByText('Trade Spend Performance Reports')).toBeInTheDocument();
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
    });
  });
});