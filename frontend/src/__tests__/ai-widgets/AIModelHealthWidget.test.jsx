/**
 * Tests for AIModelHealthWidget
 * Tests ML model health monitoring and status display
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AIModelHealthWidget from '../../components/ai-widgets/AIModelHealthWidget';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock axios
jest.mock('axios');

// Mock Material-UI icons
jest.mock('@mui/icons-material', () => ({
  Psychology: () => <div>PsychologyIcon</div>,
  Refresh: () => <div>RefreshIcon</div>,
  CheckCircle: () => <div>CheckCircleIcon</div>,
  Warning: () => <div>WarningIcon</div>,
  Error: () => <div>ErrorIcon</div>,
  InfoOutlined: () => <div>InfoOutlinedIcon</div>,
}));

const theme = createTheme();
const Wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('AIModelHealthWidget', () => {
  const mockHealthyData = {
    status: 'healthy',
    timestamp: '2025-11-07T12:00:00Z',
    models: {
      demand_forecasting: true,
      price_optimization: true,
      promotion_lift: true,
      recommendations: true
    },
    version: '1.0.0',
    uptime: '2h 15m'
  };

  const mockDegradedData = {
    status: 'degraded',
    timestamp: '2025-11-07T12:00:00Z',
    models: {
      demand_forecasting: false,
      price_optimization: false,
      promotion_lift: false,
      recommendations: false
    },
    version: '1.0.0',
    uptime: '1h 30m',
    message: 'ML models not yet loaded'
  };

  const mockPartialHealthData = {
    status: 'degraded',
    timestamp: '2025-11-07T12:00:00Z',
    models: {
      demand_forecasting: true,
      price_optimization: true,
      promotion_lift: false,
      recommendations: false
    },
    version: '1.0.0',
    uptime: '45m'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-token-123');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ===== LOADING STATE TESTS =====

  test('should show loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // ===== SUCCESS STATE TESTS =====

  test('should render health data successfully', async () => {
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI/ML Service Health')).toBeInTheDocument();
    });
  });

  test('should display service status', async () => {
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    });
  });

  test('should display degraded status', async () => {
    axios.get.mockResolvedValueOnce({ data: mockDegradedData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('DEGRADED')).toBeInTheDocument();
    });
  });

  test('should display model count', async () => {
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('4/4 Models')).toBeInTheDocument();
    });
  });

  test('should display partial model count', async () => {
    axios.get.mockResolvedValueOnce({ data: mockPartialHealthData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('2/4 Models')).toBeInTheDocument();
    });
  });

  test('should display uptime', async () => {
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Uptime: 2h 15m/)).toBeInTheDocument();
    });
  });

  test('should display overall health percentage', async () => {
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Overall Health')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  test('should calculate partial health percentage correctly', async () => {
    axios.get.mockResolvedValueOnce({ data: mockPartialHealthData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  test('should display all model names', async () => {
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Demand Forecasting')).toBeInTheDocument();
      expect(screen.getByText('Price Optimization')).toBeInTheDocument();
      expect(screen.getByText('Promotion Lift')).toBeInTheDocument();
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });
  });

  test('should show "Loaded" status for loaded models', async () => {
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      const loadedChips = screen.getAllByText('Loaded');
      expect(loadedChips).toHaveLength(4);
    });
  });

  test('should show "Not Loaded" status for unloaded models', async () => {
    axios.get.mockResolvedValueOnce({ data: mockDegradedData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      const notLoadedChips = screen.getAllByText('Not Loaded');
      expect(notLoadedChips).toHaveLength(4);
    });
  });

  test('should show degraded mode alert when status is degraded', async () => {
    axios.get.mockResolvedValueOnce({ data: mockDegradedData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Degraded Mode:/)).toBeInTheDocument();
      expect(screen.getByText(/using fallback predictions/)).toBeInTheDocument();
    });
  });

  test('should not show degraded mode alert when status is healthy', async () => {
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Degraded Mode:/)).not.toBeInTheDocument();
    });
  });

  test('should display custom message when provided', async () => {
    axios.get.mockResolvedValueOnce({ data: mockDegradedData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ML models not yet loaded')).toBeInTheDocument();
    });
  });

  test('should display formatted timestamp', async () => {
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  // ===== ERROR HANDLING TESTS =====

  test('should display error message on API failure', async () => {
    axios.get.mockRejectedValueOnce({
      response: { data: { message: 'Health check service unavailable' } }
    });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Health check service unavailable')).toBeInTheDocument();
    });
  });

  test('should display generic error on network failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load health status')).toBeInTheDocument();
    });
  });

  // ===== REFRESH FUNCTIONALITY TESTS =====

  test('should refetch data when refresh button is clicked', async () => {
    axios.get.mockResolvedValue({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI/ML Service Health')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledTimes(1);

    const refreshButton = screen.getByRole('button', { name: /refresh health status/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  test('should auto-refresh every 2 minutes', async () => {
    axios.get.mockResolvedValue({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    // Fast-forward 2 minutes
    jest.advanceTimersByTime(120000);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  test('should disable refresh button while loading', async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    axios.get.mockReturnValue(promise);

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI/ML Service Health')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh health status/i });
    fireEvent.click(refreshButton);

    // Button should be disabled while loading
    expect(refreshButton).toBeDisabled();

    // Resolve the promise
    resolvePromise({ data: mockHealthyData });

    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });
  });

  // ===== API CALL TESTS =====

  test('should call API with correct endpoint', async () => {
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/ai/health'),
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
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token'
          })
        })
      );
    });
  });

  // ===== HEALTH PERCENTAGE CALCULATION TESTS =====

  test('should show 0% when no models exist', async () => {
    const noModelsData = {
      ...mockHealthyData,
      models: {}
    };

    axios.get.mockResolvedValueOnce({ data: noModelsData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  test('should show 25% when 1 of 4 models loaded', async () => {
    const oneModelData = {
      ...mockHealthyData,
      models: {
        demand_forecasting: true,
        price_optimization: false,
        promotion_lift: false,
        recommendations: false
      }
    };

    axios.get.mockResolvedValueOnce({ data: oneModelData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });

  test('should show 75% when 3 of 4 models loaded', async () => {
    const threeModelsData = {
      ...mockHealthyData,
      models: {
        demand_forecasting: true,
        price_optimization: true,
        promotion_lift: true,
        recommendations: false
      }
    };

    axios.get.mockResolvedValueOnce({ data: threeModelsData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  // ===== STATUS ICON/COLOR TESTS =====

  test('should use success color for healthy status', async () => {
    axios.get.mockResolvedValueOnce({ data: mockHealthyData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    });
  });

  test('should use warning color for degraded status', async () => {
    axios.get.mockResolvedValueOnce({ data: mockDegradedData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('DEGRADED')).toBeInTheDocument();
    });
  });

  test('should handle "operational" status as healthy', async () => {
    const operationalData = {
      ...mockHealthyData,
      status: 'operational'
    };

    axios.get.mockResolvedValueOnce({ data: operationalData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('OPERATIONAL')).toBeInTheDocument();
    });
  });

  test('should handle "error" status', async () => {
    const errorData = {
      ...mockHealthyData,
      status: 'error'
    };

    axios.get.mockResolvedValueOnce({ data: errorData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ERROR')).toBeInTheDocument();
    });
  });

  test('should handle "unavailable" status', async () => {
    const unavailableData = {
      ...mockHealthyData,
      status: 'unavailable'
    };

    axios.get.mockResolvedValueOnce({ data: unavailableData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('UNAVAILABLE')).toBeInTheDocument();
    });
  });

  // ===== EDGE CASES =====

  test('should handle missing models object', async () => {
    const noModelsData = {
      status: 'healthy',
      timestamp: '2025-11-07T12:00:00Z'
    };

    axios.get.mockResolvedValueOnce({ data: noModelsData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI/ML Service Health')).toBeInTheDocument();
      expect(screen.getByText('0/0 Models')).toBeInTheDocument();
    });
  });

  test('should handle missing uptime', async () => {
    const noUptimeData = {
      ...mockHealthyData,
      uptime: undefined
    };

    axios.get.mockResolvedValueOnce({ data: noUptimeData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Uptime: N\/A/)).toBeInTheDocument();
    });
  });

  test('should handle missing timestamp', async () => {
    const noTimestampData = {
      ...mockHealthyData,
      timestamp: undefined
    };

    axios.get.mockResolvedValueOnce({ data: noTimestampData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI/ML Service Health')).toBeInTheDocument();
      expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();
    });
  });

  test('should handle missing message', async () => {
    const noMessageData = {
      ...mockDegradedData,
      message: undefined
    };

    axios.get.mockResolvedValueOnce({ data: noMessageData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI/ML Service Health')).toBeInTheDocument();
    });
  });

  test('should clean up interval on unmount', async () => {
    axios.get.mockResolvedValue({ data: mockHealthyData });

    const { unmount } = render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Fast-forward 2 minutes after unmount
    jest.advanceTimersByTime(120000);

    // Should not make another call after unmount
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test('should properly format model names with underscores', async () => {
    const customModelData = {
      ...mockHealthyData,
      models: {
        demand_forecasting_v2: true,
        price_optimization_advanced: true
      }
    };

    axios.get.mockResolvedValueOnce({ data: customModelData });

    render(
      <Wrapper>
        <AIModelHealthWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Demand Forecasting V2')).toBeInTheDocument();
      expect(screen.getByText('Price Optimization Advanced')).toBeInTheDocument();
    });
  });
});
