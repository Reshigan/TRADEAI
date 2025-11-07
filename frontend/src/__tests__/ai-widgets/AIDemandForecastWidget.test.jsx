/**
 * AIDemandForecastWidget Component Tests
 * Tests for demand forecasting AI widget
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import AIDemandForecastWidget from '../../components/ai-widgets/AIDemandForecastWidget';
import axios from 'axios';
import { enterpriseTheme } from '../../theme/enterpriseTheme';

// Mock axios
jest.mock('axios');

// Mock recharts to avoid canvas issues
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />
}));

// Test wrapper
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={enterpriseTheme}>
    {children}
  </ThemeProvider>
);

// Mock forecast data
const mockForecastData = {
  forecast: [
    {
      date: '2025-11-08',
      predicted_volume: 1250,
      confidence_lower: 1100,
      confidence_upper: 1400
    },
    {
      date: '2025-11-09',
      predicted_volume: 1300,
      confidence_lower: 1150,
      confidence_upper: 1450
    },
    {
      date: '2025-11-10',
      predicted_volume: 1350,
      confidence_lower: 1200,
      confidence_upper: 1500
    },
    {
      date: '2025-11-11',
      predicted_volume: 1400,
      confidence_lower: 1250,
      confidence_upper: 1550
    },
    {
      date: '2025-11-12',
      predicted_volume: 1320,
      confidence_lower: 1170,
      confidence_upper: 1470
    },
    {
      date: '2025-11-13',
      predicted_volume: 1280,
      confidence_lower: 1130,
      confidence_upper: 1430
    },
    {
      date: '2025-11-14',
      predicted_volume: 1310,
      confidence_lower: 1160,
      confidence_upper: 1460
    }
  ],
  accuracy_estimate: 0.15,
  model_version: 'v1.2.0',
  features_count: 24,
  timestamp: '2025-11-07T10:00:00Z'
};

describe('AIDemandForecastWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching forecast', () => {
      axios.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should render forecast data successfully', async () => {
      axios.post.mockResolvedValue({ data: mockForecastData });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });

      // Verify API call
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/ai/forecast/demand'),
        {
          productId: 'PROD123',
          customerId: 'CUST456',
          horizonDays: 7,
          includePromotions: true
        },
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });

    it('should display confidence score', async () => {
      axios.post.mockResolvedValue({ data: mockForecastData });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        // Confidence = (1 - accuracy_estimate) * 100 = (1 - 0.15) * 100 = 85%
        expect(screen.getByText(/85%/i)).toBeInTheDocument();
      });
    });

    it('should display model version', async () => {
      axios.post.mockResolvedValue({ data: mockForecastData });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/v1\.2\.0/i)).toBeInTheDocument();
      });
    });

    it('should show upward trend indicator when demand increases', async () => {
      axios.post.mockResolvedValue({ data: mockForecastData });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        // First value: 1250, Last value: 1310 → upward trend
        expect(screen.getByText(/trending up/i)).toBeInTheDocument();
      });
    });

    it('should show downward trend indicator when demand decreases', async () => {
      const decliningForecast = {
        ...mockForecastData,
        forecast: [
          { date: '2025-11-08', predicted_volume: 1400, confidence_lower: 1250, confidence_upper: 1550 },
          { date: '2025-11-09', predicted_volume: 1350, confidence_lower: 1200, confidence_upper: 1500 },
          { date: '2025-11-10', predicted_volume: 1300, confidence_lower: 1150, confidence_upper: 1450 },
          { date: '2025-11-11', predicted_volume: 1250, confidence_lower: 1100, confidence_upper: 1400 }
        ]
      };

      axios.post.mockResolvedValue({ data: decliningForecast });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/trending down/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      const errorMessage = 'Failed to load forecast';
      axios.post.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error when no error message provided', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load forecast/i)).toBeInTheDocument();
      });
    });

    it('should log error to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      axios.post.mockRejectedValue(error);

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Forecast error:', error);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refetch data when refresh button is clicked', async () => {
      axios.post.mockResolvedValue({ data: mockForecastData });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledTimes(1);
      });

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Props Changes', () => {
    it('should refetch data when productId changes', async () => {
      axios.post.mockResolvedValue({ data: mockForecastData });

      const { rerender } = render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledTimes(1);
      });

      rerender(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD456" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledTimes(2);
      });

      expect(axios.post).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          productId: 'PROD456'
        }),
        expect.anything()
      );
    });

    it('should refetch data when customerId changes', async () => {
      axios.post.mockResolvedValue({ data: mockForecastData });

      const { rerender } = render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledTimes(1);
      });

      rerender(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST789" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch data when days changes', async () => {
      axios.post.mockResolvedValue({ data: mockForecastData });

      const { rerender } = render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledTimes(1);
      });

      rerender(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={30} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledTimes(2);
      });

      expect(axios.post).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          horizonDays: 30
        }),
        expect.anything()
      );
    });
  });

  describe('Default Props', () => {
    it('should use default props when not provided', async () => {
      axios.post.mockResolvedValue({ data: mockForecastData });

      render(
        <TestWrapper>
          <AIDemandForecastWidget />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            productId: 'ALL',
            customerId: 'ALL',
            horizonDays: 7
          }),
          expect.anything()
        );
      });
    });
  });

  describe('Fallback Data Handling', () => {
    it('should handle ML service fallback response', async () => {
      const fallbackData = {
        ...mockForecastData,
        usingFallback: true,
        warning: 'ML service unavailable'
      };

      axios.post.mockResolvedValue({ data: fallbackData });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/ml service unavailable/i)).toBeInTheDocument();
      });
    });

    it('should display fallback model version', async () => {
      const fallbackData = {
        forecast: mockForecastData.forecast,
        model_version: 'fallback',
        accuracy_estimate: 0.25
      };

      axios.post.mockResolvedValue({ data: fallbackData });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/fallback/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Transformation', () => {
    it('should transform ML service response to widget format', async () => {
      axios.post.mockResolvedValue({ data: mockForecastData });

      const { container } = render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });

      // Widget should transform snake_case to camelCase
      // predicted_volume → value
      // confidence_lower → confidenceLower
      // confidence_upper → confidenceUpper
    });
  });

  describe('Chart Rendering', () => {
    it('should render chart with correct number of data points', async () => {
      axios.post.mockResolvedValue({ data: mockForecastData });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        const chart = screen.getByTestId('area-chart');
        expect(chart).toBeInTheDocument();
      });

      // Should have 7 forecast points
      expect(mockForecastData.forecast).toHaveLength(7);
    });
  });

  describe('Confidence Display', () => {
    it('should calculate confidence from accuracy estimate', async () => {
      const dataWithLowAccuracy = {
        ...mockForecastData,
        accuracy_estimate: 0.30 // 30% error → 70% confidence
      };

      axios.post.mockResolvedValue({ data: dataWithLowAccuracy });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/70%/i)).toBeInTheDocument();
      });
    });

    it('should use default confidence when accuracy estimate missing', async () => {
      const dataWithoutAccuracy = {
        forecast: mockForecastData.forecast,
        model_version: 'v1.2.0'
        // No accuracy_estimate
      };

      axios.post.mockResolvedValue({ data: dataWithoutAccuracy });

      render(
        <TestWrapper>
          <AIDemandForecastWidget productId="PROD123" customerId="CUST456" days={7} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/89%/i)).toBeInTheDocument(); // Default 89%
      });
    });
  });
});
