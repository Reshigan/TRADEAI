import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PromotionReports from '../../../../frontend/src/components/reports/modules/PromotionReports';

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

describe('PromotionReports Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders promotion reports header', () => {
      renderWithProviders(<PromotionReports />);
      
      expect(screen.getByText('Promotion Performance Reports')).toBeInTheDocument();
      expect(screen.getByText(/Comprehensive promotion analytics/)).toBeInTheDocument();
    });

    test('renders all tab navigation', () => {
      renderWithProviders(<PromotionReports />);
      
      expect(screen.getByText('CAMPAIGN OVERVIEW')).toBeInTheDocument();
      expect(screen.getByText('ROI ANALYSIS')).toBeInTheDocument();
      expect(screen.getByText('UPLIFT MEASUREMENT')).toBeInTheDocument();
      expect(screen.getByText('CHANNEL PERFORMANCE')).toBeInTheDocument();
      expect(screen.getByText('EFFECTIVENESS REPORT')).toBeInTheDocument();
    });

    test('renders key performance metrics', () => {
      renderWithProviders(<PromotionReports />);
      
      expect(screen.getByText('Total ROI')).toBeInTheDocument();
      expect(screen.getByText('Total Spend')).toBeInTheDocument();
      expect(screen.getByText('Avg Uplift')).toBeInTheDocument();
      expect(screen.getByText('Total Conversions')).toBeInTheDocument();
    });

    test('renders filter and export buttons', () => {
      renderWithProviders(<PromotionReports />);
      
      expect(screen.getByText('Filter')).toBeInTheDocument();
      expect(screen.getByLabelText(/export/i)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('switches to ROI analysis tab', () => {
      renderWithProviders(<PromotionReports />);
      
      const roiTab = screen.getByText('ROI ANALYSIS');
      fireEvent.click(roiTab);
      
      expect(screen.getByText('ROI Performance Analysis')).toBeInTheDocument();
    });

    test('switches to uplift measurement tab', () => {
      renderWithProviders(<PromotionReports />);
      
      const upliftTab = screen.getByText('UPLIFT MEASUREMENT');
      fireEvent.click(upliftTab);
      
      expect(screen.getByText('Uplift Analysis')).toBeInTheDocument();
    });

    test('switches to channel performance tab', () => {
      renderWithProviders(<PromotionReports />);
      
      const channelTab = screen.getByText('CHANNEL PERFORMANCE');
      fireEvent.click(channelTab);
      
      expect(screen.getByText('Channel Performance Analysis')).toBeInTheDocument();
    });

    test('switches to effectiveness report tab', () => {
      renderWithProviders(<PromotionReports />);
      
      const effectivenessTab = screen.getByText('EFFECTIVENESS REPORT');
      fireEvent.click(effectivenessTab);
      
      expect(screen.getByText('Campaign Effectiveness Analysis')).toBeInTheDocument();
    });
  });

  describe('Data Visualization', () => {
    test('renders charts in campaign overview tab', () => {
      renderWithProviders(<PromotionReports />);
      
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    test('renders ROI analysis charts', () => {
      renderWithProviders(<PromotionReports />);
      
      const roiTab = screen.getByText('ROI ANALYSIS');
      fireEvent.click(roiTab);
      
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    test('renders uplift measurement charts', () => {
      renderWithProviders(<PromotionReports />);
      
      const upliftTab = screen.getByText('UPLIFT MEASUREMENT');
      fireEvent.click(upliftTab);
      
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
    });
  });

  describe('Data Tables', () => {
    test('renders campaign performance table in overview', () => {
      renderWithProviders(<PromotionReports />);
      
      expect(screen.getByText('Top Performing Campaigns')).toBeInTheDocument();
      expect(screen.getByText('Campaign')).toBeInTheDocument();
      expect(screen.getByText('ROI')).toBeInTheDocument();
      expect(screen.getByText('Spend')).toBeInTheDocument();
      expect(screen.getByText('Uplift')).toBeInTheDocument();
    });

    test('renders ROI breakdown table', () => {
      renderWithProviders(<PromotionReports />);
      
      const roiTab = screen.getByText('ROI ANALYSIS');
      fireEvent.click(roiTab);
      
      expect(screen.getByText('ROI Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Investment')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    test('renders channel performance table', () => {
      renderWithProviders(<PromotionReports />);
      
      const channelTab = screen.getByText('CHANNEL PERFORMANCE');
      fireEvent.click(channelTab);
      
      expect(screen.getByText('Channel Performance Summary')).toBeInTheDocument();
      expect(screen.getByText('Channel')).toBeInTheDocument();
      expect(screen.getByText('Campaigns')).toBeInTheDocument();
    });
  });

  describe('Synthetic Data Generation', () => {
    test('generates realistic promotion metrics', () => {
      renderWithProviders(<PromotionReports />);
      
      // Check that ROI and spend values are displayed
      expect(screen.getByText(/264\.8%/)).toBeInTheDocument();
      expect(screen.getByText(/R\s*911,767/)).toBeInTheDocument();
      expect(screen.getByText(/25\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/13,162/)).toBeInTheDocument();
    });

    test('generates campaign names and types', () => {
      renderWithProviders(<PromotionReports />);
      
      // Check for campaign names in the table
      expect(screen.getByText('Summer Sale 2025')).toBeInTheDocument();
      expect(screen.getByText('Black Friday Deals')).toBeInTheDocument();
    });

    test('generates realistic ROI percentages', () => {
      renderWithProviders(<PromotionReports />);
      
      const roiTab = screen.getByText('ROI ANALYSIS');
      fireEvent.click(roiTab);
      
      // Check for ROI percentages
      expect(screen.getByText(/\d+\.\d+%/)).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    test('filter button is clickable', () => {
      renderWithProviders(<PromotionReports />);
      
      const filterButton = screen.getByText('Filter');
      expect(filterButton).toBeEnabled();
      
      fireEvent.click(filterButton);
      // Filter functionality would be tested with actual implementation
    });

    test('export button is clickable', () => {
      renderWithProviders(<PromotionReports />);
      
      const exportButton = screen.getByLabelText(/export/i);
      expect(exportButton).toBeEnabled();
      
      fireEvent.click(exportButton);
      // Export functionality would be tested with actual implementation
    });

    test('tab selection updates active state', () => {
      renderWithProviders(<PromotionReports />);
      
      const overviewTab = screen.getByText('CAMPAIGN OVERVIEW');
      const roiTab = screen.getByText('ROI ANALYSIS');
      
      // Overview should be active by default
      expect(overviewTab.closest('[aria-selected="true"]')).toBeInTheDocument();
      
      // Click ROI tab
      fireEvent.click(roiTab);
      expect(roiTab.closest('[aria-selected="true"]')).toBeInTheDocument();
    });
  });

  describe('Campaign Status Tracking', () => {
    test('displays campaign status indicators', () => {
      renderWithProviders(<PromotionReports />);
      
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    test('shows campaign duration information', () => {
      renderWithProviders(<PromotionReports />);
      
      // Check for date ranges in campaign data
      expect(screen.getByText(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
    });
  });

  describe('ROI Analysis Features', () => {
    test('displays ROI trends over time', () => {
      renderWithProviders(<PromotionReports />);
      
      const roiTab = screen.getByText('ROI ANALYSIS');
      fireEvent.click(roiTab);
      
      expect(screen.getByText('ROI Trend Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    test('shows investment vs revenue comparison', () => {
      renderWithProviders(<PromotionReports />);
      
      const roiTab = screen.getByText('ROI ANALYSIS');
      fireEvent.click(roiTab);
      
      expect(screen.getByText('Investment vs Revenue')).toBeInTheDocument();
    });
  });

  describe('Uplift Measurement Features', () => {
    test('displays uplift percentage metrics', () => {
      renderWithProviders(<PromotionReports />);
      
      const upliftTab = screen.getByText('UPLIFT MEASUREMENT');
      fireEvent.click(upliftTab);
      
      expect(screen.getByText('Uplift Performance')).toBeInTheDocument();
      expect(screen.getByText(/\d+\.\d+%/)).toBeInTheDocument();
    });

    test('shows baseline vs promoted sales', () => {
      renderWithProviders(<PromotionReports />);
      
      const upliftTab = screen.getByText('UPLIFT MEASUREMENT');
      fireEvent.click(upliftTab);
      
      expect(screen.getByText('Baseline vs Promoted Sales')).toBeInTheDocument();
    });
  });

  describe('Channel Performance Features', () => {
    test('displays multi-channel analysis', () => {
      renderWithProviders(<PromotionReports />);
      
      const channelTab = screen.getByText('CHANNEL PERFORMANCE');
      fireEvent.click(channelTab);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('Retail')).toBeInTheDocument();
      expect(screen.getByText('Mobile')).toBeInTheDocument();
    });

    test('shows channel-specific ROI', () => {
      renderWithProviders(<PromotionReports />);
      
      const channelTab = screen.getByText('CHANNEL PERFORMANCE');
      fireEvent.click(channelTab);
      
      expect(screen.getByText('Channel ROI Comparison')).toBeInTheDocument();
    });
  });

  describe('Effectiveness Reporting', () => {
    test('displays conversion rate metrics', () => {
      renderWithProviders(<PromotionReports />);
      
      const effectivenessTab = screen.getByText('EFFECTIVENESS REPORT');
      fireEvent.click(effectivenessTab);
      
      expect(screen.getByText('Conversion Rates')).toBeInTheDocument();
    });

    test('shows customer engagement metrics', () => {
      renderWithProviders(<PromotionReports />);
      
      const effectivenessTab = screen.getByText('EFFECTIVENESS REPORT');
      fireEvent.click(effectivenessTab);
      
      expect(screen.getByText('Customer Engagement')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing campaign data gracefully', () => {
      renderWithProviders(<PromotionReports />);
      
      // Component should render even without API data
      expect(screen.getByText('Promotion Performance Reports')).toBeInTheDocument();
    });

    test('displays fallback values for metrics', () => {
      renderWithProviders(<PromotionReports />);
      
      // Should display synthetic data as fallback
      expect(screen.getByText(/264\.8%/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for interactive elements', () => {
      renderWithProviders(<PromotionReports />);
      
      expect(screen.getByLabelText(/export/i)).toBeInTheDocument();
    });

    test('has proper heading structure', () => {
      renderWithProviders(<PromotionReports />);
      
      expect(screen.getByRole('heading', { name: /Promotion Performance Reports/i })).toBeInTheDocument();
    });

    test('tabs are keyboard accessible', () => {
      renderWithProviders(<PromotionReports />);
      
      const roiTab = screen.getByText('ROI ANALYSIS');
      roiTab.focus();
      
      fireEvent.keyDown(roiTab, { key: 'Enter' });
      expect(screen.getByText('ROI Performance Analysis')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('renders without performance issues', () => {
      const startTime = performance.now();
      renderWithProviders(<PromotionReports />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('handles multiple campaigns efficiently', () => {
      renderWithProviders(<PromotionReports />);
      
      // Should still render all components with multiple campaigns
      expect(screen.getByText('Promotion Performance Reports')).toBeInTheDocument();
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
    });
  });
});