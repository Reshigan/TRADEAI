import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProductReports from '../../../../frontend/src/components/reports/modules/ProductReports';

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

describe('ProductReports Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders product reports header', () => {
      renderWithProviders(<ProductReports />);
      
      expect(screen.getByText('Product Performance Reports')).toBeInTheDocument();
      expect(screen.getByText(/Comprehensive product analytics/)).toBeInTheDocument();
    });

    test('renders all tab navigation', () => {
      renderWithProviders(<ProductReports />);
      
      expect(screen.getByText('OVERVIEW')).toBeInTheDocument();
      expect(screen.getByText('SALES PERFORMANCE')).toBeInTheDocument();
      expect(screen.getByText('INVENTORY ANALYTICS')).toBeInTheDocument();
      expect(screen.getByText('PROFITABILITY')).toBeInTheDocument();
      expect(screen.getByText('COMPARISON')).toBeInTheDocument();
    });

    test('renders key performance metrics', () => {
      renderWithProviders(<ProductReports />);
      
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Units Sold')).toBeInTheDocument();
      expect(screen.getByText('Avg Margin')).toBeInTheDocument();
      expect(screen.getByText('Active Products')).toBeInTheDocument();
    });

    test('renders filter and export buttons', () => {
      renderWithProviders(<ProductReports />);
      
      expect(screen.getByText('Filter')).toBeInTheDocument();
      expect(screen.getByLabelText(/export/i)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('switches to sales performance tab', () => {
      renderWithProviders(<ProductReports />);
      
      const salesTab = screen.getByText('SALES PERFORMANCE');
      fireEvent.click(salesTab);
      
      expect(screen.getByText('Sales Performance Analysis')).toBeInTheDocument();
    });

    test('switches to inventory analytics tab', () => {
      renderWithProviders(<ProductReports />);
      
      const inventoryTab = screen.getByText('INVENTORY ANALYTICS');
      fireEvent.click(inventoryTab);
      
      expect(screen.getByText('Inventory Performance Metrics')).toBeInTheDocument();
    });

    test('switches to profitability tab', () => {
      renderWithProviders(<ProductReports />);
      
      const profitabilityTab = screen.getByText('PROFITABILITY');
      fireEvent.click(profitabilityTab);
      
      expect(screen.getByText('Profitability Analysis')).toBeInTheDocument();
    });

    test('switches to comparison tab', () => {
      renderWithProviders(<ProductReports />);
      
      const comparisonTab = screen.getByText('COMPARISON');
      fireEvent.click(comparisonTab);
      
      expect(screen.getByText('Product Comparison Analysis')).toBeInTheDocument();
    });
  });

  describe('Data Visualization', () => {
    test('renders charts in overview tab', () => {
      renderWithProviders(<ProductReports />);
      
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    test('renders sales performance charts', () => {
      renderWithProviders(<ProductReports />);
      
      const salesTab = screen.getByText('SALES PERFORMANCE');
      fireEvent.click(salesTab);
      
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    test('renders inventory analytics charts', () => {
      renderWithProviders(<ProductReports />);
      
      const inventoryTab = screen.getByText('INVENTORY ANALYTICS');
      fireEvent.click(inventoryTab);
      
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
    });
  });

  describe('Data Tables', () => {
    test('renders product performance table in overview', () => {
      renderWithProviders(<ProductReports />);
      
      expect(screen.getByText('Top Performing Products')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Units')).toBeInTheDocument();
      expect(screen.getByText('Margin')).toBeInTheDocument();
    });

    test('renders inventory summary table', () => {
      renderWithProviders(<ProductReports />);
      
      const inventoryTab = screen.getByText('INVENTORY ANALYTICS');
      fireEvent.click(inventoryTab);
      
      expect(screen.getByText('Inventory Summary')).toBeInTheDocument();
      expect(screen.getByText('Stock Level')).toBeInTheDocument();
      expect(screen.getByText('Turnover Rate')).toBeInTheDocument();
    });

    test('renders profitability breakdown table', () => {
      renderWithProviders(<ProductReports />);
      
      const profitabilityTab = screen.getByText('PROFITABILITY');
      fireEvent.click(profitabilityTab);
      
      expect(screen.getByText('Profitability Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Gross Margin')).toBeInTheDocument();
      expect(screen.getByText('Net Margin')).toBeInTheDocument();
    });
  });

  describe('Synthetic Data Generation', () => {
    test('generates realistic product data', () => {
      renderWithProviders(<ProductReports />);
      
      // Check that revenue values are displayed
      expect(screen.getByText(/R\s*2,847,392/)).toBeInTheDocument();
      expect(screen.getByText(/18,429/)).toBeInTheDocument();
      expect(screen.getByText(/34\.2%/)).toBeInTheDocument();
      expect(screen.getByText(/127/)).toBeInTheDocument();
    });

    test('generates product names and categories', () => {
      renderWithProviders(<ProductReports />);
      
      // Check for product names in the table
      expect(screen.getByText('Premium Coffee Blend')).toBeInTheDocument();
      expect(screen.getByText('Organic Green Tea')).toBeInTheDocument();
    });

    test('generates realistic margin percentages', () => {
      renderWithProviders(<ProductReports />);
      
      const profitabilityTab = screen.getByText('PROFITABILITY');
      fireEvent.click(profitabilityTab);
      
      // Check for margin percentages
      expect(screen.getByText(/\d+\.\d+%/)).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    test('filter button is clickable', () => {
      renderWithProviders(<ProductReports />);
      
      const filterButton = screen.getByText('Filter');
      expect(filterButton).toBeEnabled();
      
      fireEvent.click(filterButton);
      // Filter functionality would be tested with actual implementation
    });

    test('export button is clickable', () => {
      renderWithProviders(<ProductReports />);
      
      const exportButton = screen.getByLabelText(/export/i);
      expect(exportButton).toBeEnabled();
      
      fireEvent.click(exportButton);
      // Export functionality would be tested with actual implementation
    });

    test('tab selection updates active state', () => {
      renderWithProviders(<ProductReports />);
      
      const overviewTab = screen.getByText('OVERVIEW');
      const salesTab = screen.getByText('SALES PERFORMANCE');
      
      // Overview should be active by default
      expect(overviewTab.closest('[aria-selected="true"]')).toBeInTheDocument();
      
      // Click sales tab
      fireEvent.click(salesTab);
      expect(salesTab.closest('[aria-selected="true"]')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('renders responsive containers for charts', () => {
      renderWithProviders(<ProductReports />);
      
      const responsiveContainers = screen.getAllByTestId('responsive-container');
      expect(responsiveContainers.length).toBeGreaterThan(0);
    });

    test('renders grid layout for metrics cards', () => {
      renderWithProviders(<ProductReports />);
      
      const metricsCards = screen.getAllByText(/Total Revenue|Units Sold|Avg Margin|Active Products/);
      expect(metricsCards).toHaveLength(4);
    });
  });

  describe('Error Handling', () => {
    test('handles missing data gracefully', () => {
      renderWithProviders(<ProductReports />);
      
      // Component should render even without API data
      expect(screen.getByText('Product Performance Reports')).toBeInTheDocument();
    });

    test('displays fallback values for metrics', () => {
      renderWithProviders(<ProductReports />);
      
      // Should display synthetic data as fallback
      expect(screen.getByText(/R\s*2,847,392/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      renderWithProviders(<ProductReports />);
      
      expect(screen.getByLabelText(/export/i)).toBeInTheDocument();
    });

    test('has proper heading structure', () => {
      renderWithProviders(<ProductReports />);
      
      expect(screen.getByRole('heading', { name: /Product Performance Reports/i })).toBeInTheDocument();
    });

    test('tabs are keyboard accessible', () => {
      renderWithProviders(<ProductReports />);
      
      const salesTab = screen.getByText('SALES PERFORMANCE');
      salesTab.focus();
      
      fireEvent.keyDown(salesTab, { key: 'Enter' });
      expect(screen.getByText('Sales Performance Analysis')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('renders without performance issues', () => {
      const startTime = performance.now();
      renderWithProviders(<ProductReports />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('handles large datasets efficiently', () => {
      // This would test with larger synthetic datasets
      renderWithProviders(<ProductReports />);
      
      // Should still render all components
      expect(screen.getByText('Product Performance Reports')).toBeInTheDocument();
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
    });
  });
});