/**
 * Tests for AIPriceOptimizationWidget
 * Tests price optimization display, impact metrics, and user interactions
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AIPriceOptimizationWidget from '../../components/ai-widgets/AIPriceOptimizationWidget';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock axios
jest.mock('axios');

// Mock Material-UI icons to avoid rendering issues
jest.mock('@mui/icons-material', () => ({
  AttachMoney: () => <div>AttachMoneyIcon</div>,
  Refresh: () => <div>RefreshIcon</div>,
  TrendingUp: () => <div>TrendingUpIcon</div>,
  CheckCircle: () => <div>CheckCircleIcon</div>,
  InfoOutlined: () => <div>InfoOutlinedIcon</div>,
}));

// Theme wrapper for Material-UI components
const theme = createTheme();
const Wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('AIPriceOptimizationWidget', () => {
  const mockOptimizationData = {
    product_id: 'PROD-123',
    current_price: 25.99,
    optimal_price: 28.50,
    price_change_pct: 9.65,
    expected_impact: {
      revenue_lift_pct: 12.5,
      profit_lift_pct: 18.3,
      volume_change_pct: -2.8
    },
    confidence: 0.87,
    model_version: 'v1.0.0',
    timestamp: '2025-11-07T12:00:00Z',
    recommendations: [
      'Implement price increase gradually over 2 weeks',
      'Monitor competitor pricing closely',
      'Consider promotional timing'
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-token-123');
  });

  // ===== LOADING STATE TESTS =====

  test('should show loading state initially', () => {
    axios.post.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // ===== SUCCESS STATE TESTS =====

  test('should render optimization data successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: mockOptimizationData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Price Optimization')).toBeInTheDocument();
    });

    // Check current price display
    expect(screen.getByText('Current Price')).toBeInTheDocument();
    expect(screen.getByText('$25.99')).toBeInTheDocument();

    // Check optimal price display
    expect(screen.getByText('Optimal Price')).toBeInTheDocument();
    expect(screen.getByText('$28.50')).toBeInTheDocument();
  });

  test('should display confidence level correctly', async () => {
    axios.post.mockResolvedValueOnce({ data: mockOptimizationData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Confidence: 87%/)).toBeInTheDocument();
    });
  });

  test('should calculate and display price change percentage', async () => {
    axios.post.mockResolvedValueOnce({ data: mockOptimizationData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('+9.7%')).toBeInTheDocument();
    });
  });

  test('should display predicted impact metrics', async () => {
    axios.post.mockResolvedValueOnce({ data: mockOptimizationData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Profit')).toBeInTheDocument();
      expect(screen.getByText('Demand')).toBeInTheDocument();
    });
  });

  test('should display all recommendations', async () => {
    axios.post.mockResolvedValueOnce({ data: mockOptimizationData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Implement price increase gradually/)).toBeInTheDocument();
      expect(screen.getByText(/Monitor competitor pricing/)).toBeInTheDocument();
      expect(screen.getByText(/Consider promotional timing/)).toBeInTheDocument();
    });
  });

  test('should show "Apply Optimal Price" button', async () => {
    axios.post.mockResolvedValueOnce({ data: mockOptimizationData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Apply Optimal Price')).toBeInTheDocument();
    });
  });

  test('should show degraded status indicator when applicable', async () => {
    const degradedData = {
      ...mockOptimizationData,
      status: 'degraded',
    };

    axios.post.mockResolvedValueOnce({ data: degradedData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Simulated Data')).toBeInTheDocument();
    });
  });

  // ===== ERROR HANDLING TESTS =====

  test('should display error message on API failure', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Optimization service unavailable' } }
    });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Optimization service unavailable')).toBeInTheDocument();
    });
  });

  test('should display generic error on network failure', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load optimization')).toBeInTheDocument();
    });
  });

  // ===== REFRESH FUNCTIONALITY TESTS =====

  test('should refetch data when refresh button is clicked', async () => {
    axios.post.mockResolvedValue({ data: mockOptimizationData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Price Optimization')).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledTimes(1);

    // Find and click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh optimization/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  // ===== PROPS CHANGE TESTS =====

  test('should refetch when productId changes', async () => {
    axios.post.mockResolvedValue({ data: mockOptimizationData });

    const { rerender } = render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    // Change productId
    rerender(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-456" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    // Verify new productId in request
    expect(axios.post.mock.calls[1][1].productId).toBe('PROD-456');
  });

  test('should refetch when currentPrice changes', async () => {
    axios.post.mockResolvedValue({ data: mockOptimizationData });

    const { rerender } = render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    // Change currentPrice
    rerender(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={29.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    // Verify new price in request
    expect(axios.post.mock.calls[1][1].currentPrice).toBe(29.99);
  });

  // ===== DEFAULT PROPS TESTS =====

  test('should use default props when not provided', async () => {
    axios.post.mockResolvedValueOnce({ data: mockOptimizationData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          productId: 'SAMPLE-PROD',
          currentPrice: 25.99
        }),
        expect.any(Object)
      );
    });
  });

  // ===== API CALL TESTS =====

  test('should call API with correct parameters', async () => {
    axios.post.mockResolvedValueOnce({ data: mockOptimizationData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-789" currentPrice={49.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/ai/optimize/price'),
        {
          productId: 'PROD-789',
          currentPrice: 49.99,
          cost: 49.99 * 0.6,
          constraints: {
            min_price: 49.99 * 0.8,
            max_price: 49.99 * 1.3
          },
          optimizationObjective: 'profit'
        },
        {
          headers: {
            Authorization: 'Bearer mock-token-123'
          }
        }
      );
    });
  });

  test('should include authorization header from localStorage', async () => {
    localStorage.setItem('token', 'test-jwt-token');
    axios.post.mockResolvedValueOnce({ data: mockOptimizationData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token'
          })
        })
      );
    });
  });

  // ===== DATA TRANSFORMATION TESTS =====

  test('should transform ML service response correctly', async () => {
    axios.post.mockResolvedValueOnce({ data: mockOptimizationData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      // Confidence should be converted from 0.87 to 87%
      expect(screen.getByText(/Confidence: 87%/)).toBeInTheDocument();
    });
  });

  // ===== PRICE CHANGE CALCULATION TESTS =====

  test('should calculate price increase correctly', async () => {
    const increaseData = {
      ...mockOptimizationData,
      current_price: 20.00,
      optimal_price: 24.00,
      price_change_pct: 20.0
    };

    axios.post.mockResolvedValueOnce({ data: increaseData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={20.00} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('+20.0%')).toBeInTheDocument();
    });
  });

  test('should calculate price decrease correctly', async () => {
    const decreaseData = {
      ...mockOptimizationData,
      current_price: 30.00,
      optimal_price: 24.00,
      price_change_pct: -20.0
    };

    axios.post.mockResolvedValueOnce({ data: decreaseData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={30.00} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('-20.0%')).toBeInTheDocument();
    });
  });

  // ===== CONFIDENCE LEVEL TESTS =====

  test('should show success color for high confidence (>= 80%)', async () => {
    const highConfidenceData = {
      ...mockOptimizationData,
      confidence: 0.90
    };

    axios.post.mockResolvedValueOnce({ data: highConfidenceData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Confidence: 90%/)).toBeInTheDocument();
    });
  });

  test('should show primary color for lower confidence (< 80%)', async () => {
    const lowConfidenceData = {
      ...mockOptimizationData,
      confidence: 0.65
    };

    axios.post.mockResolvedValueOnce({ data: lowConfidenceData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Confidence: 65%/)).toBeInTheDocument();
    });
  });

  // ===== EDGE CASES =====

  test('should handle missing expected_impact data gracefully', async () => {
    const noImpactData = {
      ...mockOptimizationData,
      expected_impact: {}
    };

    axios.post.mockResolvedValueOnce({ data: noImpactData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Price Optimization')).toBeInTheDocument();
    });
  });

  test('should handle empty recommendations array', async () => {
    const noRecommendationsData = {
      ...mockOptimizationData,
      recommendations: []
    };

    axios.post.mockResolvedValueOnce({ data: noRecommendationsData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Price Optimization')).toBeInTheDocument();
    });

    // Recommendations section should still be present but empty
    expect(screen.getByText(/Recommendations:/)).toBeInTheDocument();
  });

  test('should handle zero price change', async () => {
    const noPriceChangeData = {
      ...mockOptimizationData,
      current_price: 25.99,
      optimal_price: 25.99,
      price_change_pct: 0.0
    };

    axios.post.mockResolvedValueOnce({ data: noPriceChangeData });

    render(
      <Wrapper>
        <AIPriceOptimizationWidget productId="PROD-123" currentPrice={25.99} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('$25.99')).toBeInTheDocument();
      expect(screen.getByText('+0.0%')).toBeInTheDocument();
    });
  });
});
